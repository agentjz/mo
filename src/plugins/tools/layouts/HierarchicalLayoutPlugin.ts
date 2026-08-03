import type { StoryAnalysis } from '../../../domain/story/analysis.ts';
import type { StoryDocument } from '../../../domain/story/document.ts';
import type { StoryEditorState } from '../../../domain/story/editorState.ts';
import { PluginBase } from '../../../plugin/PluginBase.ts';
import type { PluginContributions } from '../../../plugin/contributions.ts';
import type { PluginMetadata } from '../../../plugin/types.ts';

export class HierarchicalLayoutPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.layout.hierarchical', name: '层次布局', version: '1.0.0', author: '墨水官方',
    description: '按深度分层排列节点，适合线性故事和视觉小说', icon: 'LAY', category: 'tool',
    tags: ['工具', 'layout', 'hierarchical'],
  };

  getContributions(): PluginContributions {
    return { layout: { hierarchical: { layout: (document, state, analysis) => this.layout(document, state, analysis) } } };
  }

  layout(document: StoryDocument, state: StoryEditorState, analysis: StoryAnalysis): StoryEditorState {
    const layers = new Map<number, string[]>();
    for (const scene of document.scenes) {
      const value = analysis.nodes.get(scene.id)?.depth;
      const depth = value === undefined || value === Infinity ? analysis.maxDepth + 1 : value;
      const ids = layers.get(depth) ?? [];
      ids.push(scene.id);
      layers.set(depth, ids);
    }
    const positions: StoryEditorState['scenePositions'] = {};
    for (const [depth, ids] of [...layers].sort(([left], [right]) => left - right)) {
      const start = -((ids.length - 1) * 700) / 2 + 100;
      ids.sort().forEach((id, index) => { positions[id] = { x: start + index * 700, y: 100 + depth * 350 }; });
    }
    return { ...state, scenePositions: positions };
  }
}
