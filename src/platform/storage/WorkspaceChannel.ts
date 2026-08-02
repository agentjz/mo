export interface StoryChangedMessage {
  type: 'story-changed';
  storyId: string;
  revision: number;
  sourceTabId: string;
}

type Listener = (message: StoryChangedMessage) => void;

export class WorkspaceChannel {
  readonly tabId = crypto.randomUUID();
  private readonly channel = typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel('mo-workspace-events');
  private readonly listeners = new Set<Listener>();

  constructor() {
    this.channel?.addEventListener('message', (event: MessageEvent<StoryChangedMessage>) => {
      const message = event.data;
      if (message?.type !== 'story-changed' || message.sourceTabId === this.tabId) return;
      for (const listener of this.listeners) listener(message);
    });
  }

  publishStoryChanged(storyId: string, revision: number): void {
    this.channel?.postMessage({
      type: 'story-changed',
      storyId,
      revision,
      sourceTabId: this.tabId,
    } satisfies StoryChangedMessage);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close(): void {
    this.listeners.clear();
    this.channel?.close();
  }
}

export const workspaceChannel = new WorkspaceChannel();
