import { z } from 'zod';

const extensionDataSchema = z.record(z.string(), z.unknown());
const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);

const assetSchema = z.object({
  assetId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  hash: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  position: z.enum([
    'center', 'top', 'bottom', 'left', 'right',
    'top left', 'top right', 'bottom left', 'bottom right',
  ]).optional(),
  scale: z.number().min(0.1).max(3).optional(),
  label: z.string().optional(),
  horizontalPosition: z.enum(['left', 'center', 'right']).optional(),
  verticalPosition: z.enum(['top', 'center', 'bottom']).optional(),
}).strict();

const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  targetSceneId: z.string().min(1),
  visibilityRuleId: z.string().min(1).optional(),
  selectRuleIds: z.array(z.string().min(1)).max(100).optional(),
  extensionData: extensionDataSchema.optional(),
}).strict();

const sceneSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['start', 'normal', 'ending']),
  content: z.object({
    text: z.string(),
    typewriterSpeed: z.number().int().nonnegative().max(60_000).optional(),
    speaker: z.string().optional(),
  }).strict(),
  choices: z.array(choiceSchema).max(500),
  media: z.object({
    background: assetSchema.optional(),
    characters: z.array(assetSchema).max(20).optional(),
    hotspots: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      targetSceneId: z.string().min(1),
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().positive().max(1),
      height: z.number().positive().max(1),
    }).strict()).max(200).optional(),
  }).strict(),
  tags: z.array(z.string()).max(100),
  ruleIds: z.object({
    onEnter: z.array(z.string().min(1)).max(100),
    onLeave: z.array(z.string().min(1)).max(100),
  }).strict(),
  extensionData: extensionDataSchema,
}).strict();

const variableSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['number', 'string', 'boolean']),
  defaultValue: scalarSchema,
  description: z.string().optional(),
  source: z.enum(['user', 'plugin']),
  pluginId: z.string().min(1).optional(),
  displayInPlayer: z.boolean(),
  displayOrder: z.number().int().optional(),
}).strict();

const conditionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('variable'),
    variableId: z.string().min(1),
    operator: z.enum(['equals', 'not-equals', 'greater-than', 'less-than', 'greater-or-equal', 'less-or-equal', 'truthy', 'falsy']),
    value: scalarSchema.optional(),
  }).strict(),
  z.object({
    type: z.literal('function'),
    functionId: z.string().min(1),
    arguments: z.array(scalarSchema).optional(),
  }).strict(),
]);

const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('set-variable'), variableId: z.string().min(1), value: scalarSchema }).strict(),
  z.object({ type: z.literal('change-number'), variableId: z.string().min(1), amount: z.number() }).strict(),
  z.object({ type: z.literal('call-function'), functionId: z.string().min(1), arguments: z.array(scalarSchema).optional() }).strict(),
]);

const ruleSchema = z.object({
  id: z.string().min(1),
  trigger: z.enum(['scene-enter', 'scene-leave', 'choice-visible', 'choice-select']),
  scope: z.object({
    sceneId: z.string().min(1),
    choiceId: z.string().min(1).optional(),
  }).strict(),
  condition: conditionSchema.optional(),
  actions: z.array(actionSchema).max(200),
  extensionData: extensionDataSchema.optional(),
}).strict();

export const storyDocumentSchema = z.object({
  format: z.literal('mo.story'),
  version: z.literal(2),
  id: z.string().min(1).max(200),
  meta: z.object({
    title: z.string().min(1).max(300),
    author: z.string().max(200),
    description: z.string().max(20_000),
  }).strict(),
  entrySceneId: z.string().min(1),
  scenes: z.array(sceneSchema).min(1).max(5_000),
  variables: z.array(variableSchema).max(2_000),
  rules: z.array(ruleSchema).max(5_000),
  presentation: z.object({
    templateId: z.string().min(1),
    settings: extensionDataSchema,
    sceneVariants: z.record(z.string(), z.string()),
  }).strict(),
  extensionData: extensionDataSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
}).strict();

export type StoryDocument = z.infer<typeof storyDocumentSchema>;
export type StoryMeta = StoryDocument['meta'];
export type Scene = StoryDocument['scenes'][number];
export type SceneContent = Scene['content'];
export type Choice = Scene['choices'][number];
export type SceneMedia = Scene['media'];
export type MediaAsset = NonNullable<SceneMedia['background']>;
export type VariableDefinition = StoryDocument['variables'][number];
export type RuleDocument = StoryDocument['rules'][number];
export type RuleTrigger = RuleDocument['trigger'];
export type RuleCondition = NonNullable<RuleDocument['condition']>;
export type RuleAction = RuleDocument['actions'][number];

function assertUnique(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${label} ID 重复: ${value}`);
    seen.add(value);
  }
}

function assertReferences(document: StoryDocument): void {
  assertUnique(document.scenes.map(scene => scene.id), '场景');
  assertUnique(document.variables.map(variable => variable.id), '变量');
  assertUnique(document.rules.map(rule => rule.id), '规则');

  const sceneIds = new Set(document.scenes.map(scene => scene.id));
  const variableIds = new Set(document.variables.map(variable => variable.id));
  const rules = new Map(document.rules.map(rule => [rule.id, rule]));
  if (!sceneIds.has(document.entrySceneId)) throw new Error(`入口目标场景不存在: ${document.entrySceneId}`);

  for (const scene of document.scenes) {
    assertUnique(scene.choices.map(choice => choice.id), `场景 ${scene.id} 的选项`);
    assertUnique((scene.media.hotspots ?? []).map(hotspot => hotspot.id), `场景 ${scene.id} 的热区`);
    for (const choice of scene.choices) {
      if (!sceneIds.has(choice.targetSceneId)) throw new Error(`选项 ${choice.id} 的目标场景不存在: ${choice.targetSceneId}`);
      if (choice.visibilityRuleId && !rules.has(choice.visibilityRuleId)) throw new Error(`选项 ${choice.id} 引用的规则不存在`);
      for (const ruleId of choice.selectRuleIds ?? []) if (!rules.has(ruleId)) throw new Error(`选项 ${choice.id} 引用的规则不存在`);
    }
    for (const hotspot of scene.media.hotspots ?? []) {
      if (!sceneIds.has(hotspot.targetSceneId)) throw new Error(`热区 ${hotspot.id} 的目标场景不存在`);
    }
    for (const ruleId of [...scene.ruleIds.onEnter, ...scene.ruleIds.onLeave]) {
      if (!rules.has(ruleId)) throw new Error(`场景 ${scene.id} 引用的规则不存在: ${ruleId}`);
    }
  }

  for (const rule of document.rules) {
    if (!sceneIds.has(rule.scope.sceneId)) throw new Error(`规则 ${rule.id} 引用的场景不存在`);
    if (rule.scope.choiceId) {
      const scene = document.scenes.find(candidate => candidate.id === rule.scope.sceneId);
      if (!scene?.choices.some(choice => choice.id === rule.scope.choiceId)) throw new Error(`规则 ${rule.id} 引用的选项不存在`);
    }
    if (rule.condition?.type === 'variable' && !variableIds.has(rule.condition.variableId)) throw new Error(`规则 ${rule.id} 引用的变量不存在`);
    for (const action of rule.actions) {
      if ('variableId' in action && !variableIds.has(action.variableId)) throw new Error(`规则 ${rule.id} 引用的变量不存在`);
    }
  }
}

export function parseStoryDocument(input: unknown): StoryDocument {
  const document = storyDocumentSchema.parse(input);
  assertReferences(document);
  return document;
}

export function cloneStoryDocument(document: StoryDocument): StoryDocument {
  return structuredClone(document);
}

export function createStoryId(): string {
  return `story_${crypto.randomUUID()}`;
}

export function collectAssetIds(document: StoryDocument): Set<string> {
  const ids = new Set<string>();
  for (const scene of document.scenes) {
    if (scene.media.background) ids.add(scene.media.background.assetId);
    for (const character of scene.media.characters ?? []) ids.add(character.assetId);
  }
  return ids;
}
