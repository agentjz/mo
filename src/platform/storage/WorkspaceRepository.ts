import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { FOG_MYSTERY_TEMPLATE, SURVIVAL_GAME_TEMPLATE } from '../../domain/story/templates/index.ts';
import { cloneStory, collectAssetIds, createStoryId, parseStory } from '../../domain/story/schema.ts';
import type { Story } from '../../types/index.ts';
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
const DATABASE_VERSION = 1;
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
      for (const template of [SURVIVAL_GAME_TEMPLATE, FOG_MYSTERY_TEMPLATE]) {
        const story = parseStory({
          ...cloneStory(template),
          id: createStoryId(),
          createdAt: now,
          updatedAt: now,
        });
        await transaction.objectStore('stories').add({ id: story.id, story, revision: 1, updatedAt: now });
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

  async createStory(story: Story): Promise<StoredStory> {
    const parsed = parseStory(story);
    const database = await this.database();
    const stored: StoredStory = {
      id: parsed.id,
      story: cloneStory(parsed),
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

  async saveStory(story: Story, expectedRevision: number): Promise<StoredStory> {
    const parsed = parseStory(story);
    const database = await this.database();
    const transaction = database.transaction('stories', 'readwrite');
    const current = await transaction.store.get(parsed.id);
    const actualRevision = current?.revision ?? 0;

    if (!current || actualRevision !== expectedRevision) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError(parsed.id, expectedRevision, actualRevision);
    }

    const next: StoredStory = {
      id: parsed.id,
      story: cloneStory(parsed),
      revision: actualRevision + 1,
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

  async importStory(story: Story): Promise<StoredStory> {
    const now = new Date().toISOString();
    const imported = parseStory({
      ...cloneStory(story),
      id: createStoryId(),
      createdAt: now,
      updatedAt: now,
    });
    return this.createStory(imported);
  }

  async importStoryWithAssets(story: Story, assets: AssetRecord[]): Promise<StoredStory> {
    const now = new Date().toISOString();
    const imported = parseStory({
      ...cloneStory(story),
      id: createStoryId(),
      createdAt: now,
      updatedAt: now,
    });
    const stored: StoredStory = {
      id: imported.id,
      story: imported,
      revision: 1,
      updatedAt: now,
    };
    const database = await this.database();
    const transaction = database.transaction(['stories', 'assets'], 'readwrite');
    try {
      for (const asset of assets) await transaction.objectStore('assets').put(asset);
      await transaction.objectStore('stories').add(stored);
      await transaction.done;
      return structuredClone(stored);
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
      for (const assetId of collectAssetIds(stored.story)) referenced.add(assetId);
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
    const database = await this.database();
    const transaction = database.transaction(['stories', 'assets', 'settings'], 'readwrite');
    try {
      await Promise.all([
        transaction.objectStore('stories').clear(),
        transaction.objectStore('assets').clear(),
        transaction.objectStore('settings').clear(),
      ]);
      for (const story of snapshot.stories) await transaction.objectStore('stories').put(story);
      for (const asset of snapshot.assets) await transaction.objectStore('assets').put(asset);
      for (const setting of snapshot.settings) await transaction.objectStore('settings').put(setting);
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
