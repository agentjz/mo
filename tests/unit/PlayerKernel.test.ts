import { describe, expect, it } from 'vitest';
import { PlayerKernel } from '../../src/application/player/PlayerKernel.ts';
import { canonicalStory } from '../fixtures/canonicalStory.ts';

describe('PlayerKernel', () => {
  it('统一管理开始、选择、跳转、历史、访问和存档', () => {
    const kernel = new PlayerKernel(canonicalStory());
    expect(kernel.dispatch({ type: 'start' }).scene?.id).toBe('arrival');
    expect(kernel.dispatch({ type: 'choose', choiceId: 'inspect' }).scene?.id).toBe('platform');
    expect(kernel.dispatch({ type: 'choose', choiceId: 'finish' }).status).toBe('ended');
    expect(kernel.snapshot().variables.minute).toBe(1);
    const save = kernel.save();
    kernel.dispatch({ type: 'restart' });
    expect(kernel.snapshot().scene?.id).toBe('arrival');
    kernel.load(save);
    expect(kernel.snapshot().scene?.id).toBe('exit');
    expect(kernel.snapshot().history).toEqual(['arrival', 'platform', 'exit']);
  });

  it('模板切换不进入运行核心', () => {
    const source = JSON.stringify(canonicalStory());
    const first = new PlayerKernel(JSON.parse(source));
    const secondDocument = JSON.parse(source);
    secondDocument.presentation.templateId = 'test.other-template';
    const second = new PlayerKernel(secondDocument);
    for (const kernel of [first, second]) {
      kernel.dispatch({ type: 'start' });
      kernel.dispatch({ type: 'choose', choiceId: 'inspect' });
    }
    expect(first.snapshot()).toEqual(second.snapshot());
  });
});
