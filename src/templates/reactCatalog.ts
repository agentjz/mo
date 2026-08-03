import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { StoryDocument } from '../domain/story/document.ts';
import { builtinTemplateEntries } from './catalog.ts';

export interface PlayerTemplateComponentProps {
  story: StoryDocument;
  startSceneId?: string;
}

export interface ReactTemplateEntry {
  id: string;
  component: LazyExoticComponent<ComponentType<PlayerTemplateComponentProps>>;
}

const generic = () => import('../pages/GenericTemplatePlayer.tsx');
const componentLoaders: Record<string, () => Promise<{ default: ComponentType<PlayerTemplateComponentProps> }>> = {
  'builtin.visual-novel': () => import('../pages/VisualNovelPlayer.tsx'),
  'builtin.chat': () => import('../pages/ChatStylePlayer.tsx'),
};

export const reactTemplateEntries: ReactTemplateEntry[] = builtinTemplateEntries.map(entry => ({
  id: entry.manifest.id,
  component: lazy(componentLoaders[entry.manifest.id] ?? generic),
}));
