import { describe, expect, it } from 'vitest';
import { parseStoryDocument } from '../../src/domain/story/document.ts';
import { composeStoryDocument, projectEditorMeta, projectStoryGraph } from '../../src/ui/editor/storyFlowAdapter.ts';
import { renderPlayerContent } from '../../src/application/player/contentRenderer.ts';
import { canonicalEditorState, canonicalStory } from '../fixtures/canonicalStory.ts';

describe('StoryDocument 与 React Flow 投影', () => {
  it('Choice.targetSceneId 是唯一连接事实', () => {
    const document = parseStoryDocument(canonicalStory());
    const graph = projectStoryGraph(document, canonicalEditorState());
    expect(graph.edges.map(edge => [edge.source, edge.sourceHandle, edge.target])).toEqual([
      ['arrival', 'inspect', 'platform'],
      ['arrival', 'leave', 'exit'],
      ['arrival', 'wait', 'camp'],
      ['platform', 'loop', 'platform'],
      ['platform', 'finish', 'exit'],
      ['camp', 'rest', 'stay'],
      ['camp', 'return', 'arrival'],
    ]);
  });

  it('拒绝缺失目标、重复 ID 和非法表现引用', () => {
    const missingTarget = canonicalStory();
    missingTarget.scenes[0].choices[0].targetSceneId = 'missing';
    expect(() => parseStoryDocument(missingTarget)).toThrow(/目标场景/);

    const duplicate = canonicalStory();
    duplicate.scenes.push(structuredClone(duplicate.scenes[0]));
    expect(() => parseStoryDocument(duplicate)).toThrow(/重复/);
  });

  it('规范作品覆盖多结局、Markdown、内嵌选择、媒体、热区和四类规则时间点', () => {
    const document = parseStoryDocument(canonicalStory());
    const arrival = document.scenes.find(scene => scene.id === 'arrival')!;
    const platform = document.scenes.find(scene => scene.id === 'platform')!;
    expect(document.scenes.filter(scene => scene.type === 'ending')).toHaveLength(2);
    expect(renderPlayerContent(arrival.content.text, arrival.choices)).toContain('data-choice-id="inspect"');
    expect(renderPlayerContent(arrival.content.text, arrival.choices)).toContain('<strong>列车抵达。</strong>');
    expect(platform.media.background).toBeDefined();
    expect(platform.media.characters).toHaveLength(1);
    expect(platform.media.hotspots).toHaveLength(1);
    expect(new Set(document.rules.map(rule => rule.trigger))).toEqual(new Set(['scene-enter', 'scene-leave', 'choice-visible', 'choice-select']));
    expect(document.rules.flatMap(rule => rule.actions).filter(action => action.type === 'call-function').map(action => action.functionId)).toEqual(['addTime', 'modifyStat', 'blockly.execute']);
    expect(document.rules.find(rule => rule.id === 'blockly:camp:enter')?.extensionData?.['blockly.owner']).toBe(true);
  });

  it('Blockly 工作区只作为四类 RuleDocument 的编辑投影', () => {
    const document = canonicalStory();
    const graph = projectStoryGraph(document, canonicalEditorState());
    graph.nodes[0].data.pluginData = {
      ...graph.nodes[0].data.pluginData,
      'blockly.scripts': { onEnter: { blocks: { languageVersion: 0, blocks: [] }, generatedCode: "vars['minute'] = 3;" } },
    };
    graph.nodes[0].data.choices[0].pluginData = {
      'blockly.scripts': { condition: { blocks: { languageVersion: 0, blocks: [] }, generatedCode: "return vars['ticket'];" } },
    };
    const composed = composeStoryDocument(document, projectEditorMeta(document), document.variables, graph.nodes, graph.edges);
    expect(composed.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'blockly:arrival:enter', trigger: 'scene-enter' }),
      expect.objectContaining({ id: 'blockly:arrival:inspect:visible', trigger: 'choice-visible' }),
    ]));
    expect(composed.scenes[0].extensionData['blockly.scripts']).toBeUndefined();
    const projected = projectStoryGraph(composed, canonicalEditorState());
    expect(projected.nodes[0].data.pluginData?.['blockly.scripts']).toBeTruthy();
  });
});
