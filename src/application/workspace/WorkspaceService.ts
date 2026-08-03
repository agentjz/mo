import { createStoryId, type StoryDocument } from '../../domain/story/document.ts';
import { createStoryEditorState } from '../../domain/story/editorState.ts';
import {
  StorySaveCoordinator,
  type SaveCoordinatorCallbacks,
} from '../editor/StorySaveCoordinator.ts';
import { AssetUrlRegistry } from '../../platform/storage/AssetUrlRegistry.ts';
import { acquireStoryWriteLock, type StoryWriteLockHandle } from '../../platform/storage/StoryWriteLock.ts';
import { workspaceChannel } from '../../platform/storage/WorkspaceChannel.ts';
import { workspaceRepository, type WorkspaceRepository } from '../../platform/storage/WorkspaceRepository.ts';
import type { AssetRecord, StoredStory } from '../../platform/storage/types.ts';
import type { RulePackContribution } from '../../plugin/contributions.ts';

export class WorkspaceService {
  private initialization: Promise<void> | null = null;
  private readonly assetUrls: AssetUrlRegistry;

  constructor(private readonly repository: WorkspaceRepository) {
    this.assetUrls = new AssetUrlRegistry(repository);
  }

  initialize(): Promise<void> {
    this.initialization ??= this.repository.initialize();
    return this.initialization;
  }

  async listStories(): Promise<StoryDocument[]> {
    await this.initialize();
    return (await this.repository.listStories()).map(stored => stored.document);
  }

  async getStoredStory(id: string): Promise<StoredStory | undefined> {
    await this.initialize();
    return this.repository.getStory(id);
  }

  async createStory(): Promise<StoredStory> {
    await this.initialize();
    const now = new Date().toISOString();
    const id = createStoryId();
    const document: StoryDocument = {
      format: 'mo.story', version: 2, id,
      meta: { title: '我的互动小说', author: '作者', description: '' },
      entrySceneId: 'scene-1',
      scenes: [{
        id: 'scene-1', type: 'start', content: { text: '故事从这里开始...', typewriterSpeed: 0 },
        choices: [], media: {}, tags: [], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
      }],
      variables: [],
      rules: [],
      presentation: { templateId: 'builtin.visual-novel', settings: {}, sceneVariants: {} },
      extensionData: {},
      createdAt: now,
      updatedAt: now,
    };
    return this.repository.createStory(document, createStoryEditorState(document.scenes.map(scene => scene.id)));
  }

  async deleteStory(id: string): Promise<void> {
    await this.initialize();
    await this.repository.deleteStory(id);
  }

  async exportWorkspace(): Promise<Blob> {
    await this.initialize();
    const { StoryArchiveService } = await import('../../platform/export/StoryArchiveService.ts');
    return new StoryArchiveService(this.repository).exportWorkspace();
  }

  async restoreWorkspace(file: Blob): Promise<void> {
    await this.initialize();
    const { StoryArchiveService } = await import('../../platform/export/StoryArchiveService.ts');
    await new StoryArchiveService(this.repository).restoreWorkspace(file);
    this.assetUrls.clear();
  }

  async exportStandalone(document: StoryDocument, rulePacks: RulePackContribution[] = []): Promise<Blob> {
    await this.initialize();
    const [{ HTMLExporter }, { templatePackageService, templateRegistry }] = await Promise.all([
      import('../../platform/export/HTMLExporter.ts'),
      import('../../templates/runtimeCatalog.ts'),
    ]);
    await templatePackageService.restore();
    return new HTMLExporter(this.repository, templateRegistry).export(document, rulePacks);
  }

  async putAsset(input: {
    blob: Blob;
    mimeType: string;
    fileName: string;
    width: number;
    height: number;
  }): Promise<AssetRecord> {
    await this.initialize();
    return this.repository.putAsset(input);
  }

  async resolveAssetUrl(path: string | undefined): Promise<string> {
    await this.initialize();
    return this.assetUrls.resolve(path);
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    await this.initialize();
    return this.repository.getSetting<T>(key);
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.initialize();
    return this.repository.setSetting(key, value);
  }

  async removeSetting(key: string): Promise<void> {
    await this.initialize();
    return this.repository.removeSetting(key);
  }

  createSaveCoordinator(
    initialRevision: number,
    callbacks: SaveCoordinatorCallbacks,
    debounceMs = 500,
  ): StorySaveCoordinator {
    return new StorySaveCoordinator(initialRevision, this.repository, workspaceChannel, callbacks, debounceMs);
  }

  acquireWriteLock(storyId: string): Promise<StoryWriteLockHandle> {
    return acquireStoryWriteLock(storyId);
  }

  subscribeToStoryChanges(listener: (storyId: string, revision: number) => void): () => void {
    return workspaceChannel.subscribe(message => listener(message.storyId, message.revision));
  }
}

export const workspaceService = new WorkspaceService(workspaceRepository);
