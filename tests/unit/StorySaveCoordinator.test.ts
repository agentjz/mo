import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { StorySaveCoordinator } from '../../src/application/editor/StorySaveCoordinator.ts';
import { WorkspaceRepository } from '../../src/platform/storage/WorkspaceRepository.ts';
import { WorkspaceChannel } from '../../src/platform/storage/WorkspaceChannel.ts';
import type { Story } from '../../src/types/index.ts';

function story(): Story {
  return {
    id: 'coordinator-story',
    meta: { title: 'A', author: 'A', description: '', start_node: 1 },
    nodes: [{
      id: '1', type: 'storyNode', position: { x: 0, y: 0 },
      data: { nodeId: 1, text: 'A', choices: [], nodeType: 'start' },
    }],
    edges: [],
    variables: [],
    createdAt: '2026-08-02T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
  };
}

describe('StorySaveCoordinator', () => {
  it('合并连续变更并保存最新快照', async () => {
    const repository = new WorkspaceRepository(`mo-coordinator-${crypto.randomUUID()}`);
    const created = await repository.createStory(story());
    const channel = new WorkspaceChannel();
    const onSaved = vi.fn();
    const coordinator = new StorySaveCoordinator(created.revision, repository, channel, { onSaved }, 1);

    coordinator.queue({ ...created.story, meta: { ...created.story.meta, title: 'B' } });
    coordinator.queue({ ...created.story, meta: { ...created.story.meta, title: 'C' } });
    await coordinator.flush();

    expect((await repository.getStory(created.id))?.story.meta.title).toBe('C');
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(coordinator.currentState).toBe('idle');
    coordinator.dispose();
    channel.close();
  });
});
