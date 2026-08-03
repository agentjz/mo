import { describe, expect, it } from 'vitest';
import { AuthoringSession } from '../../src/application/authoring/AuthoringSession.ts';
import { BrowserAuthoringPort } from '../../src/application/authoring/BrowserAuthoringPort.ts';
import { createStoryEditorState } from '../../src/domain/story/editorState.ts';
import { SURVIVAL_SAMPLE } from '../../src/domain/story/samples.ts';

function createPort(): BrowserAuthoringPort {
  return new BrowserAuthoringPort(new AuthoringSession(
    structuredClone(SURVIVAL_SAMPLE),
    createStoryEditorState(SURVIVAL_SAMPLE.scenes.map(scene => scene.id)),
    4,
  ));
}

describe('BrowserAuthoringPort', () => {
  it('只在审阅接受后提交变更', () => {
    const port = createPort();
    const review = port.submit({
      expectedRevision: 4,
      commands: [{ version: 1, type: 'update-meta', patch: { title: '审阅后的标题' } }],
    });
    expect(port.query().document.meta.title).not.toBe('审阅后的标题');
    expect(review.diff).toContainEqual(expect.objectContaining({ path: 'meta.title' }));
    expect(port.accept(review.id).document.meta.title).toBe('审阅后的标题');
  });

  it('支持部分接受并保留批次原子性', () => {
    const port = createPort();
    const review = port.submit({
      expectedRevision: 4,
      commands: [
        { version: 1, type: 'update-meta', patch: { title: '接受' } },
        { version: 1, type: 'update-meta', patch: { author: '拒绝' } },
      ],
    });
    const result = port.accept(review.id, { commandIndexes: [0] });
    expect(result.document.meta.title).toBe('接受');
    expect(result.document.meta.author).not.toBe('拒绝');
  });

  it('拒绝、过期和无效引用均保持当前内容不变', () => {
    const port = createPort();
    const rejected = port.submit({
      expectedRevision: 4,
      commands: [{ version: 1, type: 'update-meta', patch: { title: '不会写入' } }],
    });
    port.reject(rejected.id);
    expect(port.query().document.meta.title).toBe(SURVIVAL_SAMPLE.meta.title);

    const stale = port.submit({
      expectedRevision: 4,
      commands: [{ version: 1, type: 'update-meta', patch: { author: '旧审阅' } }],
    });
    const current = port.submit({
      expectedRevision: 4,
      commands: [{ version: 1, type: 'update-meta', patch: { author: '当前提交' } }],
    });
    port.accept(current.id);
    expect(() => port.accept(stale.id)).toThrow('审阅已过期');
    expect(port.query().document.meta.author).toBe('当前提交');

    const entry = SURVIVAL_SAMPLE.scenes.find(scene => scene.id === SURVIVAL_SAMPLE.entrySceneId)!;
    const choice = entry.choices[0];
    expect(() => port.submit({
      expectedRevision: 5,
      commands: [{ version: 1, type: 'set-choice-target', sceneId: entry.id, choiceId: choice.id, targetSceneId: 'missing' }],
    })).toThrow('目标场景不存在');
    expect(port.query().document.scenes.find(scene => scene.id === entry.id)?.choices[0].targetSceneId).toBe(choice.targetSceneId);
  });
});
