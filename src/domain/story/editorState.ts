import { z } from 'zod';

const positionSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();

export const storyEditorStateSchema = z.object({
  scenePositions: z.record(z.string(), positionSchema),
  viewport: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    zoom: z.number().positive().finite(),
  }).strict(),
  selectedSceneId: z.string().nullable(),
  selectedChoiceId: z.string().nullable(),
}).strict();

export type StoryEditorState = z.infer<typeof storyEditorStateSchema>;
export type ScenePosition = StoryEditorState['scenePositions'][string];

export function parseStoryEditorState(input: unknown): StoryEditorState {
  return storyEditorStateSchema.parse(input);
}

export function createStoryEditorState(sceneIds: string[]): StoryEditorState {
  return {
    scenePositions: Object.fromEntries(sceneIds.map((id, index) => [id, { x: 100 + index * 360, y: 100 }])),
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedSceneId: null,
    selectedChoiceId: null,
  };
}
