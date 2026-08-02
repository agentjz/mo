import { z } from 'zod';
import { storySchema } from './schema.ts';

export const STORY_FILE_FORMAT = 'mo.story' as const;
export const STORY_ZIP_FORMAT = 'mo.story.zip' as const;
export const WORKSPACE_BACKUP_FORMAT = 'mo.workspace' as const;
export const FILE_FORMAT_VERSION = 1 as const;

export const storyFileSchema = z.object({
  format: z.literal(STORY_FILE_FORMAT),
  version: z.literal(FILE_FORMAT_VERSION),
  story: storySchema,
}).strict();

export const storyZipManifestSchema = z.object({
  format: z.literal(STORY_ZIP_FORMAT),
  version: z.literal(FILE_FORMAT_VERSION),
  storyFile: z.literal('story.json'),
  assets: z.array(z.object({
    id: z.string().startsWith('asset:'),
    file: z.string().startsWith('assets/'),
    mimeType: z.string().startsWith('image/'),
    size: z.number().int().nonnegative(),
    hash: z.string().min(1),
    fileName: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).strict()).max(10_000),
}).strict();

export const workspaceManifestSchema = z.object({
  format: z.literal(WORKSPACE_BACKUP_FORMAT),
  version: z.literal(FILE_FORMAT_VERSION),
  createdAt: z.string().min(1),
  stories: z.array(z.object({
    id: z.string().min(1),
    file: z.string().startsWith('stories/'),
    revision: z.number().int().positive(),
  }).strict()).max(20_000),
  assets: storyZipManifestSchema.shape.assets,
  settingsFile: z.literal('settings.json'),
}).strict();
