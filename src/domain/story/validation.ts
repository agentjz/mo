import type { StoryDocument } from './document.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStoryDocument(document: StoryDocument): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sceneIds = new Set(document.scenes.map(scene => scene.id));
  const reachable = new Set<string>();
  const pending = [document.entrySceneId];
  while (pending.length > 0) {
    const sceneId = pending.shift()!;
    if (reachable.has(sceneId)) continue;
    reachable.add(sceneId);
    const scene = document.scenes.find(candidate => candidate.id === sceneId);
    if (!scene) {
      errors.push(`入口或选择指向不存在的场景：${sceneId}`);
      continue;
    }
    for (const choice of scene.choices) pending.push(choice.targetSceneId);
    for (const hotspot of scene.media.hotspots ?? []) pending.push(hotspot.targetSceneId);
  }
  if (!sceneIds.has(document.entrySceneId)) errors.push('缺少开始场景');
  if (!document.scenes.some(scene => scene.type === 'ending')) warnings.push('故事没有结局场景');
  for (const scene of document.scenes) {
    if (!reachable.has(scene.id)) warnings.push(`场景 ${scene.id} 无法从开始场景到达`);
    if (scene.type !== 'ending' && scene.choices.length === 0 && (scene.media.hotspots?.length ?? 0) === 0) {
      warnings.push(`场景 ${scene.id} 没有后续选择或热区`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
