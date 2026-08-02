/**
 * 故事分析插件
 * 职责：分析故事结构，提供深度、循环、关键决策点等信息
 */

import { PluginBase } from '../../plugin/PluginBase.js';
import StoryAnalyzer from '../../utils/engine/storyAnalyzer.js';
import type { PluginMetadata } from '../../plugin/types.js';
import type { StoryNode, StoryEdge } from '../../types/index.js';
import type { StoryAnalysis } from '../../utils/engine/storyAnalyzer.js';
import type { PluginContributions } from '../../plugin/contributions.ts';

export class AnalyzerPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.analyzer',
    name: '故事分析器',
    version: '1.0.0',
    author: '墨水官方',
    description: '分析故事拓扑结构、深度、循环、关键决策点',
    icon: 'STAT',
    category: 'tool',
    tags: ['工具', 'analyze', 'structure']
  };

  getContributions(): PluginContributions {
    return {
      analyzer: {
        story: { analyze: (nodes, edges) => this.analyze(nodes, edges) },
      },
    };
  }

  private cachedAnalysis: StoryAnalysis | null = null;
  private cacheKey: string = '';

  /**
   * 执行分析
   */
  analyze(nodes: StoryNode[], edges: StoryEdge[]): StoryAnalysis {
    const newKey = this.generateCacheKey(nodes, edges);
    
    if (newKey === this.cacheKey && this.cachedAnalysis) {
      return this.cachedAnalysis;
    }

    const analyzer = new StoryAnalyzer(nodes, edges);
    this.cachedAnalysis = analyzer.analyze();
    this.cacheKey = newKey;
    
    return this.cachedAnalysis;
  }

  /**
   * 生成缓存key
   */
  private generateCacheKey(nodes: StoryNode[], edges: StoryEdge[]): string {
    const nodeIds = nodes.map(n => n.id).sort().join(',');
    const edgeIds = edges.map(e => `${e.source}-${e.target}`).sort().join(',');
    return `${nodeIds}::${edgeIds}`;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedAnalysis = null;
    this.cacheKey = '';
  }

  protected async onInstall(): Promise<void> {
    console.log('[AnalyzerPlugin] Installed');
    
    this.context.events.on('analyzer:analyze', (data: { nodes: StoryNode[], edges: StoryEdge[] }) => {
      const result = this.analyze(data.nodes, data.edges);
      this.context.events.emit('analyzer:result', result);
    });

    this.context.events.on('editor:node-update', () => {
      this.clearCache();
    });
  }
}

