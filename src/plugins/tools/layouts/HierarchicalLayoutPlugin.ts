/**
 * 层次布局插件
 * 职责：按深度分层排列节点
 * 适合：线性故事、视觉小说
 */

import { PluginBase } from '../../../plugin/PluginBase.js';
import type { PluginMetadata } from '../../../plugin/types.js';
import type { StoryNode, StoryEdge } from '../../../types/index.js';
import type { StoryAnalysis } from '../../../utils/engine/storyAnalyzer.js';
import type { PluginContributions } from '../../../plugin/contributions.ts';

/**
 * 布局配置
 */
interface LayoutConfig {
  layerGap: number;      // 层间垂直距离
  nodeGap: number;       // 同层节点水平间距
  startX: number;        // 起始X坐标
  startY: number;        // 起始Y坐标
  nodeWidth: number;     // 节点宽度（用于居中计算）
  nodeHeight: number;    // 节点高度
}

/**
 * 默认布局配置
 */
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  layerGap: 350,
  nodeGap: 700,
  startX: 100,
  startY: 100,
  nodeWidth: 280,
  nodeHeight: 200
};

export class HierarchicalLayoutPlugin extends PluginBase {
  private edges: StoryEdge[] = [];
  
  metadata: PluginMetadata = {
    id: 'tool.layout.hierarchical',
    name: '层次布局',
    version: '1.0.0',
    author: '墨水官方',
    description: '按深度分层排列节点，适合线性故事和视觉小说',
    icon: 'LAY',
    category: 'tool',
    tags: ['工具', 'layout', 'hierarchical']
  };

  getContributions(): PluginContributions {
    return {
      layout: {
        hierarchical: { layout: (nodes, edges, analysis) => this.layoutByDepth(nodes, edges, analysis) },
      },
    };
  }

  /**
   * 深度分层布局
   * 算法特点：
   * - 同深度节点在同一水平线（横向布局）
   * - 关键决策点优先居中
   * - 使用Barycentric Method减少连线交叉
   * - 正确处理循环（SCC内节点同深度）
   */
  layoutByDepth(nodes: StoryNode[], edges: StoryEdge[], analysis: StoryAnalysis): StoryNode[] {
    if (nodes.length === 0) return nodes;
    if (!analysis.startNodeId) {
      return this.fallbackLayout(nodes);
    }

    // 保存边信息，供排序时使用
    this.edges = edges;

    // 根据节点数量自动调整间距
    const autoConfig = this.getAutoSpacing(nodes.length);
    const storedConfig = this.settings.layoutConfig;
    const customConfig = storedConfig && typeof storedConfig === 'object' && !Array.isArray(storedConfig)
      ? storedConfig as Partial<LayoutConfig>
      : {};
    const cfg = { ...DEFAULT_LAYOUT_CONFIG, ...autoConfig, ...customConfig };

    // 按深度分组节点
    const layers = this.groupNodesByDepth(nodes, analysis);

    // 计算每层的布局
    const positioned = this.positionLayers(layers, analysis, cfg);

    return positioned;
  }

  /**
   * 按深度分组节点
   */
  private groupNodesByDepth(
    nodes: StoryNode[],
    analysis: StoryAnalysis
  ): Map<number, StoryNode[]> {
    const layers = new Map<number, StoryNode[]>();

    nodes.forEach(node => {
      const nodeAnalysis = analysis.nodes.get(node.id);
      if (!nodeAnalysis) return;

      const depth = nodeAnalysis.depth === Infinity 
        ? analysis.maxDepth + 1 
        : nodeAnalysis.depth;

      if (!layers.has(depth)) {
        layers.set(depth, []);
      }
      layers.get(depth)!.push(node);
    });

    return layers;
  }

  /**
   * 计算每层节点的位置
   * 
   * 改进说明：
   * - 维护已布局节点的坐标映射
   * - 排序时考虑前驱节点的位置，减少交叉
   */
  private positionLayers(
    layers: Map<number, StoryNode[]>,
    analysis: StoryAnalysis,
    cfg: LayoutConfig
  ): StoryNode[] {
    const positioned: StoryNode[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();
    const sortedDepths = Array.from(layers.keys()).sort((a, b) => a - b);

    sortedDepths.forEach(depth => {
      const layerNodes = layers.get(depth)!;

      // 同层节点排序：考虑前驱节点位置，减少交叉
      const sorted = this.sortLayerNodes(layerNodes, analysis, nodePositions);

      // 计算Y坐标（基于深度）
      const y = cfg.startY + depth * cfg.layerGap;

      // 计算这一层的总宽度
      const totalWidth = sorted.length * cfg.nodeGap;

      // 居中对齐：起始X = 画布中心 - 总宽度的一半
      const layerStartX = cfg.startX - totalWidth / 2 + cfg.nodeWidth / 2;

      // 为每个节点分配位置
      sorted.forEach((node, index) => {
        const x = layerStartX + index * cfg.nodeGap;
        const position = { x, y };

        // 记录节点坐标，供下一层排序使用
        nodePositions.set(node.id, position);

        positioned.push({
          ...node,
          position
        });
      });
    });

    return positioned;
  }

  /**
   * 同层节点排序逻辑（Barycentric Method）
   * 
   * 核心思路：
   * - 计算每个节点的"重心坐标"= 所有前驱节点的平均X坐标
   * - 按重心从左到右排序
   * - 这样能让连线尽量不交叉
   * 
   * 排序规则：
   * 1. 按重心坐标排序（减少交叉）
   * 2. 无前驱节点时，按入度排序
   * 3. 稳定排序（保持相对顺序）
   */
  private sortLayerNodes(
    nodes: StoryNode[],
    analysis: StoryAnalysis,
    nodePositions: Map<string, { x: number; y: number }>
  ): StoryNode[] {
    // 计算每个节点的重心坐标
    const barycenters = new Map<string, number>();
    
    nodes.forEach(node => {
      // 找到所有前驱节点（指向当前节点的节点）
      const predecessors = this.edges
        .filter(edge => edge.target === node.id)
        .map(edge => edge.source)
        .filter(sourceId => nodePositions.has(sourceId));

      if (predecessors.length > 0) {
        // 计算前驱节点的平均X坐标
        const avgX = predecessors.reduce((sum, predId) => {
          return sum + nodePositions.get(predId)!.x;
        }, 0) / predecessors.length;
        
        barycenters.set(node.id, avgX);
      } else {
        // 没有前驱节点（第0层或孤立节点），使用一个默认值
        barycenters.set(node.id, Number.MAX_SAFE_INTEGER);
      }
    });

    // 按重心坐标排序
    return nodes.sort((a, b) => {
      const aBarycenter = barycenters.get(a.id) ?? 0;
      const bBarycenter = barycenters.get(b.id) ?? 0;

      // 规则1：有重心的节点优先按重心排序
      if (aBarycenter !== Number.MAX_SAFE_INTEGER && bBarycenter !== Number.MAX_SAFE_INTEGER) {
        if (aBarycenter !== bBarycenter) {
          return aBarycenter - bBarycenter;
        }
      }

      // 规则2：没有前驱节点时，按入度排序
      const aAnalysis = analysis.nodes.get(a.id);
      const bAnalysis = analysis.nodes.get(b.id);
      
      if (aAnalysis && bAnalysis) {
        if (aAnalysis.inDegree !== bAnalysis.inDegree) {
          return bAnalysis.inDegree - aAnalysis.inDegree;
        }
        
        if (aAnalysis.outDegree !== bAnalysis.outDegree) {
          return bAnalysis.outDegree - aAnalysis.outDegree;
        }
      }

      // 规则3：保持原始顺序
      return parseInt(a.id) - parseInt(b.id);
    });
  }

  /**
   * 降级布局：当没有开始节点时使用简单垂直排列
   */
  private fallbackLayout(
    nodes: StoryNode[],
    config?: Partial<LayoutConfig>
  ): StoryNode[] {
    const cfg = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    
    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: cfg.startX,
        y: cfg.startY + index * (cfg.nodeHeight + 50)
      }
    }));
  }

  /**
   * 根据节点数量自动调整间距
   * 
   * 原则：确保节点不重叠（支持自适应宽度节点，最大400px）
   * - 水平：nodeGap = 最大节点宽度(400px) + 安全空隙(300px) = 700px
   * - 垂直：layerGap应该至少是节点实际高度的1.5倍（考虑标签、选项等动态内容）
   * 
   * 更新说明：
   * - 节点宽度从固定280px改为自适应200-400px
   * - nodeGap从500/520/550增加到700/750/800
   * - 确保即使最宽节点也不会重叠
   */
  private getAutoSpacing(nodeCount: number): Partial<LayoutConfig> {
    if (nodeCount < 15) {
      // 小故事：标准间距
      return {
        layerGap: 350,
        nodeGap: 700,
        startX: 100,
        startY: 100
      };
    } else if (nodeCount >= 40) {
      // 大故事：宽松间距
      return {
        layerGap: 400,
        nodeGap: 800,
        startX: 200,
        startY: 150
      };
    } else {
      // 中等故事：适中间距
      return {
        layerGap: 380,
        nodeGap: 750,
        startX: 150,
        startY: 120
      };
    }
  }

  protected async onInstall(): Promise<void> {
    console.log('[HierarchicalLayoutPlugin] Installed - depth-based hierarchical layout');
    
    // 初始化布局配置
    this.settings.layoutConfig = DEFAULT_LAYOUT_CONFIG;
    
    // 注册布局事件监听器
    this.context.events.on('layout:hierarchical', (data: { 
      nodes: StoryNode[], 
      edges: StoryEdge[], 
      analysis: StoryAnalysis 
    }) => {
      const layoutedNodes = this.layoutByDepth(data.nodes, data.edges, data.analysis);
      this.context.events.emit('layout:result', layoutedNodes);
    });
  }
}

