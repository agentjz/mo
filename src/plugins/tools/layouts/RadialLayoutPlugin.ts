/**
 * 辐射布局插件
 * 职责：以Hub节点为中心辐射排列
 * 适合：循环叙事、生存游戏、开放世界
 */

import { PluginBase } from '../../../plugin/PluginBase.js';
import type { PluginMetadata } from '../../../plugin/types.js';
import type { StoryNode, StoryEdge } from '../../../types/index.js';
import type { StoryAnalysis } from '../../../utils/engine/storyAnalyzer.js';
import type { PluginContributions } from '../../../plugin/contributions.ts';

/**
 * Hub节点信息
 */
interface HubNode {
  nodeId: string;
  hubScore: number;
  inDegree: number;
  outDegree: number;
  backEdgeCount: number;
  depth: number;
}

/**
 * 节点分组：Hub节点和其活动节点
 */
interface HubCluster {
  hub: HubNode;
  activities: StoryNode[];
  hubNode: StoryNode;
}

export class RadialLayoutPlugin extends PluginBase {
  private edges: StoryEdge[] = [];
  
  metadata: PluginMetadata = {
    id: 'tool.layout.radial',
    name: '辐射布局',
    version: '1.0.0',
    author: '墨水官方',
    description: '以Hub节点为中心辐射排列，适合循环叙事和开放世界故事',
    icon: 'RAD',
    category: 'tool',
    tags: ['工具', 'layout', 'radial', 'hub']
  };

  getContributions(): PluginContributions {
    return {
      layout: {
        radial: { layout: (nodes, edges, analysis) => this.layoutRadial(nodes, edges, analysis) },
      },
    };
  }

  /**
   * 辐射布局主方法
   */
  layoutRadial(nodes: StoryNode[], edges: StoryEdge[], analysis: StoryAnalysis): StoryNode[] {
    if (nodes.length === 0) return nodes;
    if (!analysis.startNodeId) {
      return this.fallbackLayout(nodes);
    }

    this.edges = edges;

    // 1. 识别Hub节点
    const hubs = this.detectHubNodes(nodes, analysis);
    
    if (hubs.length === 0) {
      // 没有Hub节点，使用简单布局
      return this.fallbackLayout(nodes);
    }

    // 2. 将节点分组到对应的Hub
    const clusters = this.groupNodesByHub(nodes, hubs, analysis);

    // 3. 布局主线（Hub之间的连接）
    const mainLineHubs = this.layoutMainLine(clusters);

    // 4. 布局每个Hub周围的活动节点
    const positioned = this.layoutClusters(mainLineHubs, clusters);

    return positioned;
  }

  /**
   * 检测Hub节点
   * 
   * Hub特征：
   * 1. 高入度+高出度（总度数 > threshold）
   * 2. 有大量返回边（循环的中心）
   * 3. 在SCC中或有循环边
   */
  private detectHubNodes(
    nodes: StoryNode[], 
    analysis: StoryAnalysis
  ): HubNode[] {
    const hubs: HubNode[] = [];
    const backEdges = this.identifyBackEdges(this.edges, analysis);

    nodes.forEach(node => {
      const nodeAnalysis = analysis.nodes.get(node.id);
      if (!nodeAnalysis) return;

      const totalDegree = nodeAnalysis.inDegree + nodeAnalysis.outDegree;
      const backEdgeCount = backEdges.filter(e => e.target === node.id).length;

      // Hub条件：度数>=6 或 回边>=3
      const isHub = totalDegree >= 6 || backEdgeCount >= 3;

      if (isHub) {
        hubs.push({
          nodeId: node.id,
          hubScore: totalDegree + backEdgeCount * 2,
          inDegree: nodeAnalysis.inDegree,
          outDegree: nodeAnalysis.outDegree,
          backEdgeCount,
          depth: nodeAnalysis.depth
        });
      }
    });

    // 按hubScore降序排序
    return hubs.sort((a, b) => b.hubScore - a.hubScore);
  }

  /**
   * 识别返回边（指向更早深度的边）
   */
  private identifyBackEdges(edges: StoryEdge[], analysis: StoryAnalysis): StoryEdge[] {
    return edges.filter(edge => {
      const sourceAnalysis = analysis.nodes.get(edge.source);
      const targetAnalysis = analysis.nodes.get(edge.target);
      
      if (!sourceAnalysis || !targetAnalysis) return false;
      
      // 如果目标深度小于等于源深度，这是一条返回边
      return targetAnalysis.depth <= sourceAnalysis.depth;
    });
  }

  /**
   * 将节点分组到Hub
   */
  private groupNodesByHub(
    nodes: StoryNode[],
    hubs: HubNode[],
    analysis: StoryAnalysis
  ): HubCluster[] {
    const hubSet = new Set(hubs.map(h => h.nodeId));
    const assignedNodes = new Set<string>();
    const clusters: HubCluster[] = [];

    // 为每个Hub创建cluster
    hubs.forEach(hub => {
      const hubNode = nodes.find(n => n.id === hub.nodeId);
      if (!hubNode) return;

      assignedNodes.add(hub.nodeId);

      // 找到Hub的直接邻居（活动节点）
      const activities: StoryNode[] = [];
      
      this.edges.forEach(edge => {
        // 从Hub出发的节点
        if (edge.source === hub.nodeId && !hubSet.has(edge.target) && !assignedNodes.has(edge.target)) {
          const activityNode = nodes.find(n => n.id === edge.target);
          if (activityNode) {
            activities.push(activityNode);
            assignedNodes.add(edge.target);
          }
        }
      });

      clusters.push({
        hub,
        activities,
        hubNode
      });
    });

    // 处理未分配的节点（非Hub且非活动节点）
    const unassignedNodes = nodes.filter(n => !assignedNodes.has(n.id));
    
    if (unassignedNodes.length > 0 && clusters.length > 0) {
      // 将未分配的节点添加到最接近的Hub
      unassignedNodes.forEach(node => {
        const nodeAnalysis = analysis.nodes.get(node.id);
        if (!nodeAnalysis) return;

        // 找到深度最接近的Hub
        let closestCluster = clusters[0];
        let minDepthDiff = Math.abs(nodeAnalysis.depth - closestCluster.hub.depth);

        clusters.forEach(cluster => {
          const depthDiff = Math.abs(nodeAnalysis.depth - cluster.hub.depth);
          if (depthDiff < minDepthDiff) {
            minDepthDiff = depthDiff;
            closestCluster = cluster;
          }
        });

        closestCluster.activities.push(node);
      });
    }

    return clusters;
  }

  /**
   * 布局主线（Hub节点按深度排列）
   */
  private layoutMainLine(clusters: HubCluster[]): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    
    // 按深度排序Hub
    const sortedClusters = [...clusters].sort((a, b) => a.hub.depth - b.hub.depth);

    // 根据cluster大小动态调整Hub间距
    const maxActivities = Math.max(...sortedClusters.map(c => c.activities.length), 1);
    const hubGap = Math.max(2000, 1500 + maxActivities * 100); // 至少2000，根据活动节点数增加
    const baseY = 600;   // 主线Y坐标
    const startX = 400;

    sortedClusters.forEach((cluster, index) => {
      const x = startX + index * hubGap;
      const y = baseY;
      
      positions.set(cluster.hub.nodeId, { x, y });
    });

    return positions;
  }

  /**
   * 布局每个Hub的cluster（辐射排列）
   */
  private layoutClusters(
    hubPositions: Map<string, { x: number; y: number }>,
    clusters: HubCluster[]
  ): StoryNode[] {
    const positioned: StoryNode[] = [];

    clusters.forEach(cluster => {
      const hubPos = hubPositions.get(cluster.hub.nodeId);
      if (!hubPos) return;

      // 添加Hub节点
      positioned.push({
        ...cluster.hubNode,
        position: hubPos
      });

      // 辐射排列活动节点
      const activityCount = cluster.activities.length;
      if (activityCount === 0) return;

      // 动态调整辐射半径：节点越多，半径越大
      const baseRadius = 600;
      const radiusIncrement = Math.min(activityCount * 30, 400); // 每个节点增加30px，最多增加400px
      const radius = baseRadius + radiusIncrement;
      
      const angleStep = (2 * Math.PI) / Math.max(activityCount, 6); // 至少6个位置避免重叠

      cluster.activities.forEach((node, index) => {
        // 从上方开始，顺时针排列
        const angle = -Math.PI / 2 + index * angleStep;
        const x = hubPos.x + radius * Math.cos(angle);
        const y = hubPos.y + radius * Math.sin(angle);

        positioned.push({
          ...node,
          position: { x: Math.round(x), y: Math.round(y) }
        });
      });
    });

    return positioned;
  }

  /**
   * 降级布局：简单网格排列
   */
  private fallbackLayout(nodes: StoryNode[]): StoryNode[] {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const gap = 700; // 增大网格间距
    const startX = 400;
    const startY = 400;

    return nodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      return {
        ...node,
        position: {
          x: startX + col * gap,
          y: startY + row * gap
        }
      };
    });
  }

  protected async onInstall(): Promise<void> {
    console.log('[RadialLayoutPlugin] Installed - Hub-centric layout for cyclic narratives');
    
    // 注册布局事件监听器
    this.context.events.on('layout:radial', (data: { 
      nodes: StoryNode[], 
      edges: StoryEdge[], 
      analysis: StoryAnalysis 
    }) => {
      const layoutedNodes = this.layoutRadial(data.nodes, data.edges, data.analysis);
      this.context.events.emit('layout:result', layoutedNodes);
    });
  }
}

