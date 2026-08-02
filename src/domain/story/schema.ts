import { z } from 'zod';
import type { Story } from '../../types/index.ts';

const pluginDataSchema = z.record(z.string(), z.unknown());

const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  pluginData: pluginDataSchema.optional(),
}).strict();

const imageSchema = z.object({
  imagePath: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  originalFormat: z.string().min(1),
  hash: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  position: z.enum([
    'center', 'top', 'bottom', 'left', 'right',
    'top left', 'top right', 'bottom left', 'bottom right',
  ]).optional(),
  sceneName: z.string().optional(),
  scale: z.number().min(0.1).max(3).optional(),
}).strict();

const characterImageSchema = imageSchema.extend({
  horizontalPosition: z.enum(['left', 'center', 'right']).optional(),
  verticalPosition: z.enum(['top', 'center', 'bottom']).optional(),
});

const storyNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('storyNode'),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }).strict(),
  data: z.object({
    nodeId: z.number().int().positive(),
    text: z.string(),
    choices: z.array(choiceSchema).max(500),
    nodeType: z.enum(['start', 'normal', 'ending']),
    image: imageSchema.optional(),
    characterImages: z.object({
      left: characterImageSchema.optional(),
      center: characterImageSchema.optional(),
      right: characterImageSchema.optional(),
    }).strict().optional(),
    tags: z.array(z.string()).max(100).optional(),
    typewriterSpeed: z.number().nonnegative().max(60_000).optional(),
    pluginData: pluginDataSchema.optional(),
  }).strict(),
}).strict();

const storyEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  markerEnd: z.unknown().optional(),
  style: z.record(z.string(), z.unknown()).optional(),
}).strict();

const variableSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['number', 'string', 'boolean']),
  defaultValue: z.union([z.number(), z.string(), z.boolean()]),
  description: z.string().optional(),
  source: z.enum(['user', 'plugin']).optional(),
  pluginId: z.string().optional(),
  displayInPlayer: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
}).strict();

export const storySchema = z.object({
  id: z.string().min(1).max(200),
  meta: z.object({
    id: z.string().optional(),
    title: z.string().min(1).max(300),
    author: z.string().max(200),
    description: z.string().max(20_000),
    start_node: z.number().int().positive(),
    displayMode: z.literal('visual-novel').optional(),
    renderStyle: z.enum(['visual-novel', 'chat']).optional(),
    stylePluginId: z.string().optional(),
  }).strict(),
  nodes: z.array(storyNodeSchema).max(5_000),
  edges: z.array(storyEdgeSchema).max(25_000),
  variables: z.array(variableSchema).max(2_000).optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
}).strict();

export function parseStory(input: unknown): Story {
  return storySchema.parse(input) as Story;
}

export function cloneStory(story: Story): Story {
  return structuredClone(story);
}

export function createStoryId(): string {
  return `story_${crypto.randomUUID()}`;
}

export function collectAssetIds(story: Story): Set<string> {
  const ids = new Set<string>();
  const add = (value?: string) => {
    if (value?.startsWith('asset:')) ids.add(value);
  };

  for (const node of story.nodes) {
    add(node.data.image?.imagePath);
    add(node.data.characterImages?.left?.imagePath);
    add(node.data.characterImages?.center?.imagePath);
    add(node.data.characterImages?.right?.imagePath);
  }

  return ids;
}
