import { DEFAULT_START_NODE, DEFAULT_STORY_META } from '../../constants/defaults.ts';
import { cloneStory, createStoryId } from '../../domain/story/schema.ts';
import { workspaceRepository, type WorkspaceRepository } from '../../platform/storage/WorkspaceRepository.ts';
import type { StoredStory } from '../../platform/storage/types.ts';
import type { Story } from '../../types/index.ts';

export class WorkspaceService {
  private initialization: Promise<void> | null = null;

  constructor(private readonly repository: WorkspaceRepository) {}

  initialize(): Promise<void> {
    this.initialization ??= this.repository.initialize();
    return this.initialization;
  }

  async listStories(): Promise<Story[]> {
    await this.initialize();
    return (await this.repository.listStories()).map(stored => stored.story);
  }

  async getStoredStory(id: string): Promise<StoredStory | undefined> {
    await this.initialize();
    return this.repository.getStory(id);
  }

  async createStory(): Promise<StoredStory> {
    await this.initialize();
    const now = new Date().toISOString();
    const id = createStoryId();
    const story: Story = {
      id,
      meta: cloneStory({
        id,
        meta: DEFAULT_STORY_META,
        nodes: [],
        edges: [],
        variables: [],
        createdAt: now,
        updatedAt: now,
      }).meta,
      nodes: [structuredClone(DEFAULT_START_NODE)],
      edges: [],
      variables: [],
      createdAt: now,
      updatedAt: now,
    };
    return this.repository.createStory(story);
  }

  async deleteStory(id: string): Promise<void> {
    await this.initialize();
    await this.repository.deleteStory(id);
  }

  async importStory(story: Story): Promise<StoredStory> {
    await this.initialize();
    return this.repository.importStory(story);
  }
}

export const workspaceService = new WorkspaceService(workspaceRepository);
