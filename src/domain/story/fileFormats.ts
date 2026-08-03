import { z } from 'zod';

export const WORKSPACE_BACKUP_FORMAT = 'mo.workspace' as const;
export const FILE_FORMAT_VERSION = 2 as const;

const archivePath = (prefix: string) => z.string().regex(new RegExp(`^${prefix}/[A-Za-z0-9._%~-]+$`));

export const assetManifestSchema = z.object({
  id: z.string().startsWith('asset:'),
  file: archivePath('assets'),
  mimeType: z.string().startsWith('image/'),
  size: z.number().int().nonnegative(),
  hash: z.string().min(1),
  fileName: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
}).strict();

export const workspaceManifestSchema = z.object({
  format: z.literal(WORKSPACE_BACKUP_FORMAT),
  version: z.literal(FILE_FORMAT_VERSION),
  createdAt: z.string().min(1),
  stories: z.array(z.object({
    id: z.string().min(1),
    file: archivePath('stories'),
    revision: z.number().int().positive(),
    updatedAt: z.string().min(1),
  }).strict()).max(20_000),
  assets: z.array(assetManifestSchema).max(10_000),
  settingsFile: z.literal('settings.json'),
}).strict();
