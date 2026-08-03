import type { StoryDocument } from '../../src/domain/story/document.ts';
import type { StoryEditorState } from '../../src/domain/story/editorState.ts';

export function canonicalStory(): StoryDocument {
  return {
    format: 'mo.story',
    version: 2,
    id: 'canonical-story',
    meta: {
      title: '规范作品',
      author: '墨水测试',
      description: '覆盖分支、循环、规则、图片和多结局的自有测试内容。',
    },
    entrySceneId: 'arrival',
    scenes: [
      {
        id: 'arrival',
        type: 'start',
        content: { text: '**列车抵达。**\n欢迎，{{$vars.name}}。你可以先[[检查车票]]。', typewriterSpeed: 0 },
        choices: [
          { id: 'inspect', text: '检查车票', targetSceneId: 'platform' },
          { id: 'leave', text: '直接离开', targetSceneId: 'exit', visibilityRuleId: 'has-ticket' },
          { id: 'wait', text: '留在车站', targetSceneId: 'camp' },
        ],
        media: {},
        tags: ['序章'],
        ruleIds: { onEnter: ['record-arrival'], onLeave: ['record-departure'] },
        extensionData: {},
      },
      {
        id: 'platform',
        type: 'normal',
        content: { text: '站台的钟声响起。', typewriterSpeed: 0, speaker: '旁白' },
        choices: [
          { id: 'loop', text: '再看一眼', targetSceneId: 'platform' },
          { id: 'finish', text: '走向出口', targetSceneId: 'exit', selectRuleIds: ['spend-minute'] },
        ],
        media: {
          background: {
            assetId: 'asset:canonical-background', fileName: 'platform.png', mimeType: 'image/png',
            size: 12, hash: 'canonical-background', width: 1200, height: 675, position: 'center', scale: 1,
          },
          characters: [{
            assetId: 'asset:canonical-background', fileName: 'traveler.png', mimeType: 'image/png',
            size: 12, hash: 'canonical-background', width: 600, height: 900, label: '旅人',
            horizontalPosition: 'center', verticalPosition: 'bottom', scale: 0.75,
          }],
          hotspots: [{ id: 'exit-hotspot', label: '出口', targetSceneId: 'exit', x: 0.72, y: 0.2, width: 0.18, height: 0.45 }],
        },
        tags: ['探索'],
        ruleIds: { onEnter: [], onLeave: [] },
        extensionData: {},
      },
      {
        id: 'exit',
        type: 'ending',
        content: { text: '你离开了车站。', typewriterSpeed: 0 },
        choices: [],
        media: {},
        tags: ['结局'],
        ruleIds: { onEnter: [], onLeave: [] },
        extensionData: {},
      },
      {
        id: 'camp', type: 'normal',
        content: { text: '你决定在候车室休息一会儿。', typewriterSpeed: 0, speaker: '旁白' },
        choices: [
          { id: 'rest', text: '休息到天亮', targetSceneId: 'stay', selectRuleIds: ['advance-time', 'consume-health'] },
          { id: 'return', text: '回到站台', targetSceneId: 'arrival' },
        ],
        media: {}, tags: ['休息'], ruleIds: { onEnter: ['blockly:camp:enter'], onLeave: [] }, extensionData: {},
      },
      {
        id: 'stay', type: 'ending',
        content: { text: '清晨的第一班列车带你去了另一座城市。', typewriterSpeed: 0 },
        choices: [], media: {}, tags: ['另一结局'], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
      },
    ],
    variables: [
      { id: 'name', label: '名字', type: 'string', defaultValue: '旅人', source: 'user', displayInPlayer: false },
      { id: 'ticket', label: '车票', type: 'boolean', defaultValue: true, source: 'user', displayInPlayer: true, displayOrder: 1 },
      { id: 'departed', label: '已离开入口', type: 'boolean', defaultValue: false, source: 'user', displayInPlayer: false },
      { id: 'minute', label: '分钟', type: 'number', defaultValue: 0, source: 'plugin', pluginId: 'gamemod.time-system', displayInPlayer: true, displayOrder: 2 },
      { id: 'hour', label: '小时', type: 'number', defaultValue: 0, source: 'plugin', pluginId: 'gamemod.time-system', displayInPlayer: true, displayOrder: 3 },
      { id: 'day', label: '天', type: 'number', defaultValue: 1, source: 'plugin', pluginId: 'gamemod.time-system', displayInPlayer: true, displayOrder: 4 },
      { id: 'month', label: '月', type: 'number', defaultValue: 1, source: 'plugin', pluginId: 'gamemod.time-system', displayInPlayer: true, displayOrder: 5 },
      { id: 'health', label: '生命值', type: 'number', defaultValue: 100, source: 'plugin', pluginId: 'gamemod.survival', displayInPlayer: true, displayOrder: 6 },
      { id: 'hunger', label: '饥饿度', type: 'number', defaultValue: 100, source: 'plugin', pluginId: 'gamemod.survival', displayInPlayer: true, displayOrder: 7 },
      { id: 'thirst', label: '口渴度', type: 'number', defaultValue: 100, source: 'plugin', pluginId: 'gamemod.survival', displayInPlayer: true, displayOrder: 8 },
    ],
    rules: [
      { id: 'record-arrival', trigger: 'scene-enter', scope: { sceneId: 'arrival' }, actions: [{ type: 'set-variable', variableId: 'name', value: '旅人' }] },
      { id: 'record-departure', trigger: 'scene-leave', scope: { sceneId: 'arrival' }, actions: [{ type: 'set-variable', variableId: 'departed', value: true }] },
      { id: 'has-ticket', trigger: 'choice-visible', scope: { sceneId: 'arrival', choiceId: 'leave' }, condition: { type: 'variable', variableId: 'ticket', operator: 'equals', value: true }, actions: [] },
      { id: 'spend-minute', trigger: 'choice-select', scope: { sceneId: 'platform', choiceId: 'finish' }, actions: [{ type: 'change-number', variableId: 'minute', amount: 1 }] },
      { id: 'advance-time', trigger: 'choice-select', scope: { sceneId: 'camp', choiceId: 'rest' }, actions: [{ type: 'call-function', functionId: 'addTime', arguments: [480] }] },
      { id: 'consume-health', trigger: 'choice-select', scope: { sceneId: 'camp', choiceId: 'rest' }, actions: [{ type: 'call-function', functionId: 'modifyStat', arguments: ['health', -5] }] },
      {
        id: 'blockly:camp:enter', trigger: 'scene-enter', scope: { sceneId: 'camp' },
        actions: [{ type: 'call-function', functionId: 'blockly.execute', arguments: ["vars['departed'] = true;"] }],
        extensionData: { 'blockly.owner': true, 'blockly.workspace': { blocks: { languageVersion: 0, blocks: [] }, generatedCode: "vars['departed'] = true;" } },
      },
    ],
    presentation: {
      templateId: 'builtin.visual-novel',
      settings: {},
      sceneVariants: {},
    },
    extensionData: {},
    createdAt: '2026-08-02T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
  };
}

export function canonicalEditorState(): StoryEditorState {
  return {
    scenePositions: {
      arrival: { x: 80, y: 180 },
      platform: { x: 520, y: 180 },
      exit: { x: 960, y: 180 },
      camp: { x: 520, y: 520 },
      stay: { x: 960, y: 520 },
    },
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedSceneId: null,
    selectedChoiceId: null,
  };
}
