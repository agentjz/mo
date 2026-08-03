import { describe, expect, it } from 'vitest';
import { RuleEngine, RuntimeVariableStore } from '../../src/domain/rules/RuleEngine.ts';
import { SurvivalPlugin } from '../../src/plugins/gamemods/survival/SurvivalPlugin.ts';
import { TimeSystemPlugin } from '../../src/plugins/gamemods/time-system/TimeSystemPlugin.ts';
import { canonicalStory } from '../fixtures/canonicalStory.ts';

describe('RuleEngine', () => {
  it('在四类时间点以 RuntimeVariableStore 为唯一写入口', () => {
    const document = canonicalStory();
    const variables = new RuntimeVariableStore(document.variables);
    const engine = new RuleEngine(document.rules, variables);
    engine.run('scene-enter', { sceneId: 'arrival' });
    expect(variables.get('name')).toBe('旅人');
    engine.run('scene-leave', { sceneId: 'arrival' });
    expect(variables.get('departed')).toBe(true);
    expect(engine.evaluateChoice('arrival', 'leave')).toBe(true);
    engine.run('choice-select', { sceneId: 'platform', choiceId: 'finish' });
    expect(variables.get('minute')).toBe(1);
    expect(() => variables.set('unknown', 1)).toThrow(/变量/);
  });

  it('类型化函数条件和动作共享同一个变量存储', () => {
    const document = canonicalStory();
    document.rules.push({
      id: 'function-condition', trigger: 'choice-visible', scope: { sceneId: 'arrival', choiceId: 'inspect' },
      condition: { type: 'function', functionId: 'ticket-visible', arguments: ['ticket'] }, actions: [],
    });
    const variables = new RuntimeVariableStore(document.variables);
    const engine = new RuleEngine(document.rules, variables);
    engine.registerFunction('ticket-visible', id => variables.get(String(id)) === true);
    expect(engine.evaluateChoice('arrival', 'inspect')).toBe(true);
    variables.set('ticket', false);
    expect(engine.evaluateChoice('arrival', 'inspect')).toBe(false);
  });

  it('规范作品通过时间和生存规则贡献执行函数动作', () => {
    const document = canonicalStory();
    const variables = new RuntimeVariableStore(document.variables);
    const engine = new RuleEngine(document.rules, variables);
    const packs = [new TimeSystemPlugin(), new SurvivalPlugin()]
      .flatMap(plugin => Object.values(plugin.getContributions().rulePack ?? {}));
    for (const pack of packs) {
      for (const [id, contribution] of Object.entries(pack.functions)) {
        engine.registerFunction(id, (...args) => contribution(variables, ...args));
      }
    }
    engine.run('choice-select', { sceneId: 'camp', choiceId: 'rest' });
    expect(variables.get('hour')).toBe(8);
    expect(variables.get('health')).toBe(95);
  });
});
