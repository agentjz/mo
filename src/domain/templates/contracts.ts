import { z } from 'zod';
import type { StoryDocument } from '../story/document.ts';
import type { PlayerCommand, PlayerSnapshot } from '../../application/player/PlayerKernel.ts';

export type TemplateCapabilityLevel = 'native' | 'fallback' | 'unsupported';

export interface TemplateSetting {
  id: string;
  label: string;
  type: 'boolean' | 'number' | 'select' | 'color';
  defaultValue: string | number | boolean;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
}

export interface PlayerTemplateManifest {
  id: string;
  name: string;
  version: string;
  category: string;
  preview: string;
  capabilities: Record<string, TemplateCapabilityLevel>;
  settings: TemplateSetting[];
  sceneVariants: string[];
  resources: string[];
  fallback: Record<string, string>;
  structuralFingerprint: string;
}

export interface PlayerTemplateRenderContext {
  document: StoryDocument;
  snapshot: PlayerSnapshot;
  settings: Record<string, unknown>;
  dispatch?: (command: PlayerCommand) => void;
}

export interface PlayerTemplateModule {
  manifest: PlayerTemplateManifest;
  render(context?: PlayerTemplateRenderContext): string;
  css: string;
}

export interface PlayerTemplateEntry {
  manifest: PlayerTemplateManifest;
  loader: () => Promise<PlayerTemplateModule>;
  source: 'builtin' | 'local';
}

const templateSettingSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(100),
  type: z.enum(['boolean', 'number', 'select', 'color']),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]),
  options: z.array(z.object({ label: z.string().min(1), value: z.string() }).strict()).max(100).optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
}).strict();

export const playerTemplateManifestSchema = z.object({
  id: z.string().regex(/^(?:builtin|local)\.[a-z0-9][a-z0-9.-]*$/).max(160),
  name: z.string().min(1).max(160),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  category: z.string().min(1).max(80),
  preview: z.string().startsWith('data:image/').max(1024 * 1024),
  capabilities: z.record(z.string().min(1), z.enum(['native', 'fallback', 'unsupported'])),
  settings: z.array(templateSettingSchema).max(100),
  sceneVariants: z.array(z.string().min(1).max(100)).min(1).max(100),
  resources: z.array(z.string().min(1).max(300)).max(100),
  fallback: z.record(z.string().min(1), z.string().max(500)),
  structuralFingerprint: z.string().min(1).max(500),
}).strict().superRefine((manifest, context) => {
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) context.addIssue({ code: 'custom', message: `${label}存在重复项` });
  };
  unique(manifest.settings.map(setting => setting.id), '模板设置');
  unique(manifest.sceneVariants, '场景变体');
  unique(manifest.resources, '模板资源');
  for (const setting of manifest.settings) {
    if (setting.type === 'boolean' && typeof setting.defaultValue !== 'boolean') {
      context.addIssue({ code: 'custom', message: `设置 ${setting.id} 默认值类型错误` });
    }
    if (setting.type === 'number' && typeof setting.defaultValue !== 'number') {
      context.addIssue({ code: 'custom', message: `设置 ${setting.id} 默认值类型错误` });
    }
    if (setting.type === 'select' && !setting.options?.some(option => option.value === setting.defaultValue)) {
      context.addIssue({ code: 'custom', message: `设置 ${setting.id} 默认值不在选项中` });
    }
  }
});

export function parsePlayerTemplateManifest(input: unknown): PlayerTemplateManifest {
  return playerTemplateManifestSchema.parse(input);
}
