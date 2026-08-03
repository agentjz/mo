import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { cloneStoryDocument, collectAssetIds, createStoryId, parseStoryDocument, type StoryDocument } from '../../domain/story/document.ts';
import { parseStoryEditorState, type StoryEditorState } from '../../domain/story/editorState.ts';
import {
  MYSTERY_SAMPLE,
  MYSTERY_SAMPLE_EDITOR_STATE,
  SURVIVAL_SAMPLE,
  SURVIVAL_SAMPLE_EDITOR_STATE,
} from '../../domain/story/samples.ts';
import {
  RevisionConflictError,
  StorageQuotaError,
  type AssetRecord,
  type SettingRecord,
  type StorageEstimate,
  type StoredStory,
  type WorkspaceSnapshot,
} from './types.ts';

const DATABASE_NAME = 'mo-workspace';
const DATABASE_VERSION = 2;
const SEED_KEY = 'workspace.seeded';

interface MoDatabase extends DBSchema {
  stories: {
    key: string;
    value: StoredStory;
    indexes: { 'by-updated-at': string };
  };
  assets: {
    key: string;
    value: AssetRecord;
  };
  settings: {
    key: string;
    value: SettingRecord;
  };
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && (
    error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  );
}

export class WorkspaceRepository {
  private databasePromise: Promise<IDBPDatabase<MoDatabase>> | null = null;

  constructor(private readonly databaseName = DATABASE_NAME) {}

  private database(): Promise<IDBPDatabase<MoDatabase>> {
    if (!this.databasePromise) {
      this.databasePromise = openDB<MoDatabase>(this.databaseName, DATABASE_VERSION, {
        upgrade(database) {
          for (const store of [...database.objectStoreNames]) database.deleteObjectStore(store);
          const stories = database.createObjectStore('stories', { keyPath: 'id' });
          stories.createIndex('by-updated-at', 'updatedAt');
          database.createObjectStore('assets', { keyPath: 'id' });
          database.createObjectStore('settings', { keyPath: 'key' });
        },
      });
    }
    return this.databasePromise;
  }

  async initialize(): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(['stories', 'settings'], 'readwrite');
    const seeded = await transaction.objectStore('settings').get(SEED_KEY);

    if (!seeded) {
      const now = new Date().toISOString();
      for (const [template, templateEditorState] of [
        [SURVIVAL_SAMPLE, SURVIVAL_SAMPLE_EDITOR_STATE],
        [MYSTERY_SAMPLE, MYSTERY_SAMPLE_EDITOR_STATE],
      ] as const) {
        const document = parseStoryDocument({
          ...cloneStoryDocument(template),
          id: createStoryId(),
          createdAt: now,
          updatedAt: now,
        });
        await transaction.objectStore('stories').add({
          id: document.id,
          document,
          editorState: structuredClone(templateEditorState),
          revision: 1,
          updatedAt: now,
        });
      }
      await transaction.objectStore('settings').put({ key: SEED_KEY, value: true });
    }

    await transaction.done;
  }

  async listStories(): Promise<StoredStory[]> {
    const database = await this.database();
    const stories = await database.getAllFromIndex('stories', 'by-updated-at');
    return stories.reverse().map(stored => structuredClone(stored));
  }

  async getStory(id: string): Promise<StoredStory | undefined> {
    const database = await this.database();
    const stored = await database.get('stories', id);
    return stored ? structuredClone(stored) : undefined;
  }

  async createStory(document: StoryDocument, editorState: StoryEditorState): Promise<StoredStory> {
    const parsed = parseStoryDocument(document);
    const parsedEditorState = parseStoryEditorState(editorState);
    const database = await this.database();
    const stored: StoredStory = {
      id: parsed.id,
      document: cloneStoryDocument(parsed),
      editorState: structuredClone(parsedEditorState),
      revision: 1,
      updatedAt: parsed.updatedAt,
    };

    try {
      await database.add('stories', stored);
      return structuredClone(stored);
    } catch (error) {
      if (isQuotaError(error)) throw new StorageQuotaError();
      throw error;
    }
  }

  async saveStory(
    document: StoryDocument,
    editorState: StoryEditorState,
    expectedRevision: number,
    nextRevision?: number,
  ): Promise<StoredStory> {
    const parsed = parseStoryDocument(document);
    const parsedEditorState = parseStoryEditorState(editorState);
    const database = await this.database();
    const transaction = database.transaction('stories', 'readwrite');
    const current = await transaction.store.get(parsed.id);
    const actualRevision = current?.revision ?? 0;

    if (!current || actualRevision !== expectedRevision) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError(parsed.id, expectedRevision, actualRevision);
    }

    const revision = nextRevision ?? actualRevision + 1;
    if (!Number.isInteger(revision) || revision <= actualRevision) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new Error('保存 revision 必须高于当前版本');
    }

    const next: StoredStory = {
      id: parsed.id,
      document: cloneStoryDocument(parsed),
      editorState: structuredClone(parsedEditorState),
      revision,
      updatedAt: parsed.updatedAt,
    };

    try {
      await transaction.store.put(next);
      await transaction.done;
      return structuredClone(next);
    } catch (error) {
      if (isQuotaError(error)) throw new StorageQuotaError();
      throw error;
    }
  }

  async deleteStory(id: string): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(['stories', 'assets'], 'readwrite');
    await transaction.objectStore('stories').delete(id);

    const remainingStories = await transaction.objectStore('stories').getAll();
    const referenced = new Set<string>();
    for (const stored of remainingStories) {
      for (const assetId of collectAssetIds(stored.document)) referenced.add(assetId);
    }

    let cursor = await transaction.objectStore('assets').openCursor();
    while (cursor) {
      if (!referenced.has(cursor.key)) await cursor.delete();
      cursor = await cursor.continue();
    }

    await transaction.done;
  }

  async putAsset(input: Omit<AssetRecord, 'id' | 'hash' | 'size' | 'createdAt'>): Promise<AssetRecord> {
    const buffer = await input.blob.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const id = `asset:${hash}`;
    const database = await this.database();
    const existing = await database.get('assets', id);
    if (existing) return existing;

    const asset: AssetRecord = {
      ...input,
      id,
      hash,
      size: input.blob.size,
      createdAt: new Date().toISOString(),
    };

    try {
      await database.add('assets', asset);
      return asset;
    } catch (error) {
      if (isQuotaError(error)) throw new StorageQuotaError();
      throw error;
    }
  }

  async getAsset(id: string): Promise<AssetRecord | undefined> {
    const database = await this.database();
    return database.get('assets', id);
  }

  async getAssets(ids: Iterable<string>): Promise<AssetRecord[]> {
    const database = await this.database();
    const result: AssetRecord[] = [];
    for (const id of ids) {
      const asset = await database.get('assets', id);
      if (asset) result.push(asset);
    }
    return result;
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const database = await this.database();
    return (await database.get('settings', key))?.value as T | undefined;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    const database = await this.database();
    await database.put('settings', { key, value });
  }

  async removeSetting(key: string): Promise<void> {
    const database = await this.database();
    await database.delete('settings', key);
  }

  async snapshot(): Promise<WorkspaceSnapshot> {
    const database = await this.database();
    const transaction = database.transaction(['stories', 'assets', 'settings'], 'readonly');
    const [stories, assets, settings] = await Promise.all([
      transaction.objectStore('stories').getAll(),
      transaction.objectStore('assets').getAll(),
      transaction.objectStore('settings').getAll(),
    ]);
    await transaction.done;
    return { stories, assets, settings };
  }

  async replaceWorkspace(snapshot: WorkspaceSnapshot): Promise<void> {
    const validated: WorkspaceSnapshot = {
      stories: snapshot.stories.map(stored => ({
        ...stored,
        document: parseStoryDocument(stored.document),
        editorState: parseStoryEditorState(stored.editorState),
      })),
      assets: structuredClone(snapshot.assets),
      settings: structuredClone(snapshot.settings),
    };
    const database = await this.database();
    const transaction = database.transaction(['stories', 'assets', 'settings'], 'readwrite');
    try {
      await Promise.all([
        transaction.objectStore('stories').clear(),
        transaction.objectStore('assets').clear(),
        transaction.objectStore('settings').clear(),
      ]);
      for (const story of validated.stories) await transaction.objectStore('stories').put(story);
      for (const asset of validated.assets) await transaction.objectStore('assets').put(asset);
      for (const setting of validated.settings) await transaction.objectStore('settings').put(setting);
      await transaction.done;
    } catch (error) {
      if (isQuotaError(error)) throw new StorageQuotaError();
      throw error;
    }
  }

  async estimateStorage(): Promise<StorageEstimate | null> {
    if (!navigator.storage?.estimate) return null;
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return { usage, quota, available: Math.max(0, quota - usage) };
  }

  async deleteDatabase(): Promise<void> {
    if (this.databasePromise) {
      (await this.databasePromise).close();
      this.databasePromise = null;
    }
    await deleteDB(this.databaseName);
  }
}

export const workspaceRepository = new WorkspaceRepository();
