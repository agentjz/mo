import type { Story } from '../../types/index.ts';
import type { WorkspaceRepository } from '../../platform/storage/WorkspaceRepository.ts';
import type { StoredStory } from '../../platform/storage/types.ts';
import type { WorkspaceChannel } from '../../platform/storage/WorkspaceChannel.ts';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'error' | 'conflict';

export interface SaveCoordinatorCallbacks {
  onStateChange?: (state: SaveState) => void;
  onSaved?: (stored: StoredStory) => void;
  onError?: (error: unknown) => void;
}

export class StorySaveCoordinator {
  private revision: number;
  private pending: Story | null = null;
  private timer: number | null = null;
  private writePromise: Promise<void> | null = null;
  private state: SaveState = 'idle';
  private disposed = false;

  constructor(
    initialRevision: number,
    private readonly repository: WorkspaceRepository,
    private readonly channel: WorkspaceChannel,
    private readonly callbacks: SaveCoordinatorCallbacks = {},
    private readonly debounceMs = 500,
  ) {
    this.revision = initialRevision;
  }

  get currentState(): SaveState {
    return this.state;
  }

  get hasPendingWrite(): boolean {
    return this.pending !== null || this.writePromise !== null;
  }

  queue(story: Story): void {
    if (this.disposed) return;
    this.pending = structuredClone(story);
    this.setState('dirty');
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.debounceMs);
  }

  async flush(): Promise<void> {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.writePromise) await this.writePromise;
    if (!this.pending || this.state === 'conflict') return;

    const write = async () => {
      while (this.pending && this.state !== 'conflict') {
        const snapshot = this.pending;
        this.pending = null;
        this.setState('saving');
        try {
          const stored = await this.repository.saveStory(snapshot, this.revision);
          this.revision = stored.revision;
          this.channel.publishStoryChanged(stored.id, stored.revision);
          this.callbacks.onSaved?.(stored);
          this.setState(this.pending ? 'dirty' : 'idle');
        } catch (error) {
          this.pending = snapshot;
          this.setState(error instanceof Error && error.name === 'RevisionConflictError' ? 'conflict' : 'error');
          this.callbacks.onError?.(error);
          break;
        }
      }
    };

    this.writePromise = write().finally(() => { this.writePromise = null; });
    await this.writePromise;
  }

  markExternalRevision(revision: number): void {
    if (revision <= this.revision) return;
    if (this.hasPendingWrite) {
      this.setState('conflict');
      return;
    }
    this.revision = revision;
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }

  private setState(state: SaveState): void {
    if (this.state === state) return;
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }
}
