import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { StorySaveCoordinator } from '../../src/application/editor/StorySaveCoordinator.ts';
import { WorkspaceRepository } from '../../src/platform/storage/WorkspaceRepository.ts';
import { WorkspaceChannel } from '../../src/platform/storage/WorkspaceChannel.ts';
import { canonicalEditorState, canonicalStory } from '../fixtures/canonicalStory.ts';

describe('StorySaveCoordinator', () => {
  it('合并连续变更并保存最新文档与编辑投影', async () => {
    const repository = new WorkspaceRepository(`mo-coordinator-${crypto.randomUUID()}`);
    const document = canonicalStory();
    document.scenes[1].media = {};
    const created = await repository.createStory(document, canonicalEditorState());
    const channel = new WorkspaceChannel();
    const onSaved = vi.fn();
    const coordinator = new StorySaveCoordinator(created.revision, repository, channel, { onSaved }, 1);
    const second = structuredClone(created.document);
    second.meta.title = 'B';
    const latest = structuredClone(created.document);
    latest.meta.title = 'C';
    coordinator.queue({ document: second, editorState: created.editorState });
    coordinator.queue({ document: latest, editorState: created.editorState });
    await coordinator.flush();
    expect((await repository.getStory(created.id))?.document.meta.title).toBe('C');
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(coordinator.currentState).toBe('idle');
    coordinator.dispose();
    channel.close();
  });

  it('把多个本地创作事务折叠为一个带目标 revision 的原子写入', async () => {
    const repository = new WorkspaceRepository(`mo-coordinator-${crypto.randomUUID()}`);
    const document = canonicalStory();
    document.scenes[1].media = {};
    const created = await repository.createStory(document, canonicalEditorState());
    const channel = new WorkspaceChannel();
    const coordinator = new StorySaveCoordinator(created.revision, repository, channel, {}, 1);
    const changed = structuredClone(created.document);
    changed.meta.title = '折叠事务';
    coordinator.queue({ document: changed, editorState: created.editorState, revision: 5 });
    await coordinator.flush();
    expect(await repository.getStory(created.id)).toMatchObject({ revision: 5, document: { meta: { title: '折叠事务' } } });
    coordinator.dispose();
    channel.close();
  });
});
