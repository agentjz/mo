import type { StoryAnalysis } from '../../../domain/story/analysis.ts';
import type { StoryDocument } from '../../../domain/story/document.ts';
import type { StoryEditorState } from '../../../domain/story/editorState.ts';
import { PluginBase } from '../../../plugin/PluginBase.ts';
import type { PluginContributions } from '../../../plugin/contributions.ts';
import type { PluginMetadata } from '../../../plugin/types.ts';

export class RadialLayoutPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.layout.radial', name: '辐射布局', version: '1.0.0', author: '墨水官方',
    description: '以Hub节点为中心辐射排列，适合循环叙事和开放世界故事', icon: 'RAD', category: 'tool',
    tags: ['工具', 'layout', 'radial', 'hub'],
  };

  getContributions(): PluginContributions {
    return { layout: { radial: { layout: (document, state, analysis) => this.layout(document, state, analysis) } } };
  }

  layout(document: StoryDocument, state: StoryEditorState, analysis: StoryAnalysis): StoryEditorState {
    if (document.scenes.length === 0) return state;
    const center = [...document.scenes].sort((left, right) => {
      const leftScore = (analysis.nodes.get(left.id)?.inDegree ?? 0) + (analysis.nodes.get(left.id)?.outDegree ?? 0);
      const rightScore = (analysis.nodes.get(right.id)?.inDegree ?? 0) + (analysis.nodes.get(right.id)?.outDegree ?? 0);
      return rightScore - leftScore;
    })[0];
    const others = document.scenes.filter(scene => scene.id !== center.id);
    const positions: StoryEditorState['scenePositions'] = { [center.id]: { x: 400, y: 400 } };
    const radius = Math.max(650, others.length * 45);
    others.forEach((scene, index) => {
      const angle = -Math.PI / 2 + index * (2 * Math.PI / Math.max(others.length, 1));
      positions[scene.id] = { x: Math.round(400 + Math.cos(angle) * radius), y: Math.round(400 + Math.sin(angle) * radius) };
    });
    return { ...state, scenePositions: positions };
  }
}
