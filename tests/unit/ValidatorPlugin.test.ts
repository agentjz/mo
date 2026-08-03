import { beforeEach, describe, expect, it } from 'vitest';
import type { ValidatorContribution } from '../../src/plugin/contributions.ts';
import { PluginSystem } from '../../src/plugin/PluginSystem.ts';
import { ValidatorPlugin } from '../../src/plugins/tools/ValidatorPlugin.ts';
import { canonicalStory } from '../fixtures/canonicalStory.ts';

describe('ValidatorPlugin', () => {
  let validator: ValidatorContribution;

  beforeEach(async () => {
    const system = new PluginSystem();
    await system.register(new ValidatorPlugin());
    validator = system.getContribution('validator', 'story')!;
  });

  it('验证当前 StoryDocument 并识别不可达场景', () => {
    const document = canonicalStory();
    document.scenes.push({
      id: 'isolated', type: 'normal', content: { text: '孤立场景' }, choices: [],
      media: {}, tags: [], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
    });
    const result = validator.validate(document);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('场景 isolated 无法从开始场景到达');
  });

  it('没有结局时给出警告', () => {
    const document = canonicalStory();
    for (const scene of document.scenes) {
      if (scene.type === 'ending') scene.type = 'normal';
    }
    expect(validator.validate(document).warnings).toContain('故事没有结局场景');
  });
});
