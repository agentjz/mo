import { useEffect, useState } from 'react';
import type { PlayerSnapshot } from '../application/player/PlayerKernel.ts';
import type { StoryDocument } from '../domain/story/document.ts';
import type { PlayerTemplateEntry } from '../domain/templates/contracts.ts';
import type { EditorStoryMeta } from '../ui/editor/flowTypes.ts';

interface Props {
  entry: PlayerTemplateEntry;
  storyMeta: EditorStoryMeta;
  scene?: { id: string; text: string };
}

function previewContext(entry: PlayerTemplateEntry, storyMeta: EditorStoryMeta, selected?: Props['scene']) {
  const now = '2026-08-02T00:00:00.000Z';
  const scene = {
    id: selected?.id ?? 'preview',
    type: 'start' as const,
    content: { text: selected?.text || '故事从这里开始...', typewriterSpeed: 0, speaker: '旁白' },
    choices: [{ id: 'preview-choice', text: '继续', targetSceneId: selected?.id ?? 'preview' }],
    media: {}, tags: ['预览'], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
  };
  const document: StoryDocument = {
    format: 'mo.story', version: 2, id: 'template-preview',
    meta: { title: storyMeta.title, author: storyMeta.author, description: storyMeta.description },
    entrySceneId: scene.id, scenes: [scene], variables: [], rules: [],
    presentation: {
      templateId: entry.manifest.id,
      settings: storyMeta.templateSettings,
      sceneVariants: storyMeta.templateSceneVariants,
    },
    extensionData: {}, createdAt: now, updatedAt: now,
  };
  const snapshot: PlayerSnapshot = {
    status: 'running', scene, availableChoices: scene.choices,
    history: [scene.id], visits: [{ sceneId: scene.id, count: 1, firstIndex: 0, lastIndex: 0 }], variables: {},
  };
  return { document, snapshot };
}

function TemplatePreview({ entry, storyMeta, scene }: Props): JSX.Element {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    let active = true;
    void entry.loader().then(module => {
      if (!active) return;
      const context = previewContext(entry, storyMeta, scene);
      const markup = module.render({ ...context, settings: storyMeta.templateSettings });
      const css = module.css.replace(/<\/style/gi, '<\\/style');
      setSrcDoc(`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${markup}</body></html>`);
    });
    return () => { active = false; };
  }, [entry, scene?.id, scene?.text, storyMeta]);

  return (
    <div className="template-card-preview template-card-preview-live">
      {srcDoc && <iframe title={`${entry.manifest.name}预览`} sandbox="" srcDoc={srcDoc} />}
    </div>
  );
}

export default TemplatePreview;
