import { analyzeStoryDocument, type StoryAnalysis } from '../../domain/story/analysis.ts';
import type { StoryDocument } from '../../domain/story/document.ts';
import { PluginBase } from '../../plugin/PluginBase.ts';
import type { PluginContributions } from '../../plugin/contributions.ts';
import type { PluginMetadata } from '../../plugin/types.ts';

export class AnalyzerPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.analyzer', name: '故事分析器', version: '1.0.0', author: '墨水官方',
    description: '分析故事拓扑结构、深度、循环、关键决策点', icon: 'STAT', category: 'tool',
    tags: ['工具', 'analyze', 'structure'],
  };
  private cacheKey = '';
  private cached: StoryAnalysis | null = null;

  getContributions(): PluginContributions {
    return { analyzer: { story: { analyze: document => this.analyze(document) } } };
  }

  analyze(document: StoryDocument): StoryAnalysis {
    const key = document.scenes.map(scene => `${scene.id}:${scene.choices.map(choice => choice.targetSceneId).join(',')}`).join('|');
    if (key !== this.cacheKey || !this.cached) {
      this.cacheKey = key;
      this.cached = analyzeStoryDocument(document);
    }
    return this.cached;
  }
}
