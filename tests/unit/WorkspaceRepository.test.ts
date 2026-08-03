import 'fake-indexeddb/auto';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { StoryDocument } from '../../src/domain/story/document.ts';
import type { StoryEditorState } from '../../src/domain/story/editorState.ts';
import { WorkspaceRepository } from '../../src/platform/storage/WorkspaceRepository.ts';
import { RevisionConflictError } from '../../src/platform/storage/types.ts';
import { canonicalEditorState, canonicalStory } from '../fixtures/canonicalStory.ts';

function document(id = 'story-test') {
  const value = canonicalStory();
  value.id = id;
  value.scenes[1].media = {};
  return value;
}

function baselineSampleHash(document: StoryDocument, editorState: StoryEditorState): string {
  const projection = {
    meta: {
      ...document.meta,
      start_node: Number(document.entrySceneId),
      displayMode: document.presentation.templateId === 'builtin.visual-novel'
        ? 'visual-novel'
        : document.presentation.templateId,
    },
    nodes: document.scenes.map(scene => ({
      id: scene.id,
      type: scene.type,
      position: editorState.scenePositions[scene.id],
      text: scene.content.text,
      choices: scene.choices.map(choice => ({
        id: choice.id,
        text: choice.text,
        targetSceneId: choice.targetSceneId,
      })),
    })),
    variables: document.variables,
  };
  return createHash('sha256').update(JSON.stringify(projection)).digest('hex');
}

describe('WorkspaceRepository', () => {
  let repository: WorkspaceRepository;

  beforeEach(() => {
    repository = new WorkspaceRepository(`mo-test-${crypto.randomUUID()}`);
  });

  it('只在首次初始化时原子创建两个当前格式示例作品', async () => {
    await repository.initialize();
    await repository.initialize();
    const stories = await repository.listStories();
    expect(stories).toHaveLength(2);
    expect(stories.map(item => item.document.meta.title)).toEqual(expect.arrayContaining([
      '墨水编辑器开发实例：survive!',
      '墨水编辑器开发实例：雾都疑案',
    ]));
    const survival = stories.find(item => item.document.meta.title.endsWith('survive!'))!;
    const mystery = stories.find(item => item.document.meta.title.endsWith('雾都疑案'))!;
    expect({
      author: survival.document.meta.author,
      description: survival.document.meta.description,
      scenes: survival.document.scenes.length,
      choices: survival.document.scenes.reduce((sum, scene) => sum + scene.choices.length, 0),
      positions: Object.keys(survival.editorState.scenePositions).length,
    }).toEqual({
      author: '墨水官方',
      description: '叙事游戏开发实例，展示纯节点流的剧情分支和选择系统。40个节点，多个结局。改编自《书虫》',
      scenes: 40,
      choices: 60,
      positions: 40,
    });
    expect({
      author: mystery.document.meta.author,
      description: mystery.document.meta.description,
      scenes: mystery.document.scenes.length,
      choices: mystery.document.scenes.reduce((sum, scene) => sum + scene.choices.length, 0),
      positions: Object.keys(mystery.editorState.scenePositions).length,
    }).toEqual({
      author: '墨水官方',
      description: "1898年伦敦，你是著名侦探米克罗夫特·庞德。一名女子遭到攻击，警方怀疑是'白教堂杀手'所为。你能抓住真凶吗？35个节点的侦探推理互动小说。",
      scenes: 35,
      choices: 51,
      positions: 35,
    });
    expect(baselineSampleHash(survival.document, survival.editorState)).toBe('dc44bbf592ffcd87fe0b8815758019968cf60cb4888425ffba6b3a6e3379db31');
    expect(baselineSampleHash(mystery.document, mystery.editorState)).toBe('3e15f7b6e4983db8a6b4d438fab551707f57fe6bbf20a15319e3ceb53fe110d1');
    expect(stories.every(item => item.document.version === 2 && item.editorState.viewport.zoom === 1)).toBe(true);
  });

  it('用 revision 阻止旧标签覆盖新内容', async () => {
    const created = await repository.createStory(document(), canonicalEditorState());
    const updated = structuredClone(created.document);
    updated.meta.title = '新标题';
    const saved = await repository.saveStory(updated, created.editorState, created.revision);
    expect(saved.revision).toBe(2);
    await expect(repository.saveStory(created.document, created.editorState, created.revision)).rejects.toBeInstanceOf(RevisionConflictError);
    expect((await repository.getStory(created.id))?.document.meta.title).toBe('新标题');
  });

  it('按内容哈希去重图片并在最后引用删除后回收', async () => {
    const blob = new Blob(['same-image'], { type: 'image/png' });
    const first = await repository.putAsset({ blob, mimeType: 'image/png', fileName: 'a.png', width: 10, height: 10 });
    const second = await repository.putAsset({ blob, mimeType: 'image/png', fileName: 'b.png', width: 10, height: 10 });
    expect(second.id).toBe(first.id);
    const value = document();
    value.scenes[0].media.background = {
      assetId: first.id, fileName: first.fileName, mimeType: first.mimeType, size: first.size,
      hash: first.hash, width: first.width, height: first.height,
    };
    await repository.createStory(value, canonicalEditorState());
    await repository.deleteStory(value.id);
    expect(await repository.getAsset(first.id)).toBeUndefined();
  });

  it('整库替换在一个事务中提交全部记录', async () => {
    const created = await repository.createStory(document(), canonicalEditorState());
    const snapshot = await repository.snapshot();
    snapshot.settings.push({ key: 'plugin.config', value: { enabled: true } });
    await repository.replaceWorkspace(snapshot);
    expect((await repository.getStory(created.id))?.revision).toBe(1);
    expect(await repository.getSetting('plugin.config')).toEqual({ enabled: true });
  });
});
