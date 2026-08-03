import { describe, expect, it } from 'vitest';
import { analyzeStoryDocument } from '../../src/domain/story/analysis.ts';
import type { StoryDocument } from '../../src/domain/story/document.ts';
import { canonicalStory } from '../fixtures/canonicalStory.ts';

describe('StoryDocument 拓扑分析', () => {
  it('使用 SCC 缩合图计算循环、深度、入出度与可达结局', () => {
    const result = analyzeStoryDocument(canonicalStory());
    expect(result.startNodeId).toBe('arrival');
    expect(result.endingNodeIds).toEqual(['exit', 'stay']);
    expect(result.hasCycles).toBe(true);
    expect(result.nodes.get('platform')).toMatchObject({
      isInLoop: true,
      inDegree: 2,
      outDegree: 3,
      reachableEndings: ['exit'],
    });
  });

  it('在线性时间内分析 3000 个场景', () => {
    const now = '2026-08-02T00:00:00.000Z';
    const count = 3000;
    const document: StoryDocument = {
      format: 'mo.story', version: 2, id: 'large',
      meta: { title: '大图', author: '', description: '' },
      entrySceneId: 'scene-0',
      scenes: Array.from({ length: count }, (_, index) => ({
        id: `scene-${index}`,
        type: index === 0 ? 'start' : index === count - 1 ? 'ending' : 'normal',
        content: { text: `场景 ${index}` },
        choices: index === count - 1 ? [] : [{ id: `choice-${index}`, text: '继续', targetSceneId: `scene-${index + 1}` }],
        media: {}, tags: [], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
      })),
      variables: [], rules: [],
      presentation: { templateId: 'builtin.visual-novel', settings: {}, sceneVariants: {} },
      extensionData: {}, createdAt: now, updatedAt: now,
    };
    const startedAt = performance.now();
    const result = analyzeStoryDocument(document);
    expect(result.nodes.size).toBe(count);
    expect(result.maxDepth).toBe(count - 1);
    expect(performance.now() - startedAt).toBeLessThan(2000);
  });
});
