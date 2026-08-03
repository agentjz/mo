import { describe, expect, it } from 'vitest';
import { AuthoringSession } from '../../src/application/authoring/AuthoringSession.ts';
import { canonicalEditorState, canonicalStory } from '../fixtures/canonicalStory.ts';

describe('AuthoringSession', () => {
  it('dry-run 返回 diff 但不改变 revision 或快照', () => {
    const session = new AuthoringSession(canonicalStory(), canonicalEditorState(), 4);
    const before = session.query();
    const result = session.submit({
      expectedRevision: 4,
      dryRun: true,
      commands: [{ version: 1, type: 'update-meta', patch: { title: '试运行标题' } }],
    });
    expect(result.committed).toBe(false);
    expect(result.revision).toBe(4);
    expect(result.diff).toContainEqual(expect.objectContaining({ path: 'meta.title' }));
    expect(session.query()).toEqual(before);
  });

  it('批次全量成功才递增一次 revision 并形成一次撤销记录', () => {
    const session = new AuthoringSession(canonicalStory(), canonicalEditorState(), 1);
    const result = session.submit({
      expectedRevision: 1,
      commands: [
        { version: 1, type: 'update-meta', patch: { title: '新标题' } },
        { version: 1, type: 'move-scene', sceneId: 'arrival', position: { x: 100, y: 200 } },
      ],
    });
    expect(result.revision).toBe(2);
    expect(session.query().document.meta.title).toBe('新标题');
    expect(session.undo().revision).toBe(3);
    expect(session.query().document.meta.title).toBe('规范作品');
    expect(session.redo().revision).toBe(4);
  });

  it('无效引用或过期 revision 原子失败', () => {
    const session = new AuthoringSession(canonicalStory(), canonicalEditorState(), 2);
    const before = session.query();
    expect(() => session.submit({
      expectedRevision: 2,
      commands: [
        { version: 1, type: 'update-meta', patch: { title: '不应提交' } },
        { version: 1, type: 'set-choice-target', sceneId: 'arrival', choiceId: 'inspect', targetSceneId: 'missing' },
      ],
    })).toThrow(/目标场景/);
    expect(session.query()).toEqual(before);
    expect(() => session.submit({ expectedRevision: 1, commands: [] })).toThrow(/revision/i);
  });
});
