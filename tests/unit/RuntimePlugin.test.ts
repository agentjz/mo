import { beforeEach, describe, expect, it } from 'vitest';
import { PlayerKernel } from '../../src/application/player/PlayerKernel.ts';
import { PluginSystem } from '../../src/plugin/PluginSystem.ts';
import { RuntimePlugin } from '../../src/plugins/basicmod/RuntimePlugin.ts';
import { canonicalStory } from '../fixtures/canonicalStory.ts';

describe('RuntimePlugin', () => {
  let system: PluginSystem;
  let plugin: RuntimePlugin;

  beforeEach(async () => {
    system = new PluginSystem();
    plugin = new RuntimePlugin();
    await system.register(plugin);
  });

  it('作为类型化 runtime 贡献持有变量唯一写入口', () => {
    const document = canonicalStory();
    const runtime = system.getContribution('runtime', 'variables');
    expect(runtime).toBeDefined();
    runtime!.initialize(document.variables);
    runtime!.set('minute', 5);
    expect(runtime!.get('minute')).toBe(5);
    expect(runtime!.snapshot()).toMatchObject({ minute: 5, ticket: true });
    expect(() => runtime!.set('minute', 'five')).toThrow(/数字/);
    expect(() => runtime!.set('missing', 1)).toThrow(/不存在/);
  });

  it('播放器开始、规则执行和存档恢复都写回同一个 runtime', () => {
    const document = canonicalStory();
    const runtime = system.getContribution('runtime', 'variables')!;
    const kernel = new PlayerKernel(document, runtime);

    kernel.dispatch({ type: 'start' });
    kernel.dispatch({ type: 'choose', choiceId: 'inspect' });
    kernel.dispatch({ type: 'choose', choiceId: 'finish' });
    expect(runtime.get('minute')).toBe(1);

    const save = kernel.save();
    kernel.dispatch({ type: 'restart' });
    expect(runtime.get('minute')).toBe(0);
    kernel.load(save);
    expect(runtime.get('minute')).toBe(1);
  });

  it('重新初始化不会泄漏上一部作品的变量', () => {
    const first = canonicalStory();
    plugin.initialize(first.variables);
    plugin.set('minute', 9);
    plugin.initialize([{ id: 'name', label: '姓名', type: 'string', defaultValue: '旅人', source: 'user', displayInPlayer: true }]);
    expect(plugin.snapshot()).toEqual({ name: '旅人' });
  });
});
