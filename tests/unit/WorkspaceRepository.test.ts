import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceRepository } from '../../src/platform/storage/WorkspaceRepository.ts';
import { RevisionConflictError } from '../../src/platform/storage/types.ts';
import type { Story } from '../../src/types/index.ts';

function makeStory(id = 'story-test'): Story {
  const now = '2026-08-02T00:00:00.000Z';
  return {
    id,
    meta: {
      title: '测试作品',
      author: '作者',
      description: '',
      start_node: 1,
      displayMode: 'visual-novel',
    },
    nodes: [{
      id: '1',
      type: 'storyNode',
      position: { x: 0, y: 0 },
      data: {
        nodeId: 1,
        text: '开始',
        choices: [],
        nodeType: 'start',
      },
    }],
    edges: [],
    variables: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('WorkspaceRepository', () => {
  let repository: WorkspaceRepository;

  beforeEach(() => {
    repository = new WorkspaceRepository(`mo-test-${crypto.randomUUID()}`);
  });

  it('只在首次初始化时原子创建两个示例作品', async () => {
    await repository.initialize();
    await repository.initialize();

    const stories = await repository.listStories();
    expect(stories).toHaveLength(2);
    expect(stories.map(item => item.story.meta.title)).toEqual(expect.arrayContaining([
      '墨水编辑器开发实例：survive!',
      '墨水编辑器开发实例：雾都疑案',
    ]));
  });

  it('用 revision 阻止旧标签覆盖新内容', async () => {
    const created = await repository.createStory(makeStory());
    const updatedStory = { ...created.story, meta: { ...created.story.meta, title: '新标题' } };
    const saved = await repository.saveStory(updatedStory, created.revision);

    expect(saved.revision).toBe(2);
    await expect(repository.saveStory(created.story, created.revision)).rejects.toBeInstanceOf(RevisionConflictError);
    expect((await repository.getStory(created.id))?.story.meta.title).toBe('新标题');
  });

  it('按内容哈希去重图片并在最后引用删除后回收', async () => {
    const blob = new Blob(['same-image'], { type: 'image/png' });
    const first = await repository.putAsset({
      blob,
      mimeType: 'image/png',
      fileName: 'a.png',
      width: 10,
      height: 10,
    });
    const second = await repository.putAsset({
      blob,
      mimeType: 'image/png',
      fileName: 'b.png',
      width: 10,
      height: 10,
    });
    expect(second.id).toBe(first.id);

    const story = makeStory();
    story.nodes[0].data.image = {
      imagePath: first.id,
      fileName: first.fileName,
      fileSize: first.size,
      originalFormat: 'png',
      hash: first.hash,
      width: first.width,
      height: first.height,
    };
    await repository.createStory(story);
    await repository.deleteStory(story.id);
    expect(await repository.getAsset(first.id)).toBeUndefined();
  });

  it('整库替换在一个事务中提交 stories、assets 和 settings', async () => {
    const story = await repository.createStory(makeStory());
    const snapshot = await repository.snapshot();
    snapshot.settings.push({ key: 'plugin.config', value: { enabled: true } });

    await repository.replaceWorkspace(snapshot);

    expect((await repository.getStory(story.id))?.revision).toBe(1);
    expect(await repository.getSetting('plugin.config')).toEqual({ enabled: true });
  });
});
