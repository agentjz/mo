/**
 * 故事结构分析器（框架无关，前后端共享）
 * 职责：分析互动小说的拓扑结构，提取叙事语义
 * 
 * 设计原则：
 * - 纯逻辑：不依赖DOM、React、Node.js特定API
 * - 图算法：使用graphAlgorithms的高质量实现
 * - 单一职责：只分析结构，不负责布局
 * 
 * 重构说明：
 * - 使用graphAlgorithms.ts提供的SCC检测
 * - 正确处理循环结构
 * - 删除有bug的路径估算
 */

import { NODE_TYPES } from '../../constants/defaults.js';
import type { StoryNode, StoryEdge } from '../../types/index.js';
import {
  buildGraph,
  findStronglyConnectedComponents,
  findCycles,
  type StronglyConnectedComponent,
  type Cycle
} from './graphAlgorithms.js';

/**
 * 单个节点的分析结果
 */
export interface NodeAnalysis {
  nodeId: string;
  depth: number;              // 从开始节点到此节点的最短距离（考虑了SCC）
  sccId: number | null;       // 所属的强连通分量ID
  isInLoop: boolean;          // 是否在循环中
  maxDepthToEnd: number;      // 从此节点到任意结局的最长距离
  outDegree: number;          // 出度（有几个后续节点）
  inDegree: number;           // 入度（有几个前置节点）
  choiceCount: number;        // 选项数量
  isKeyDecision: boolean;     // 是否为关键决策点（3+选项）
  reachableEndings: string[]; // 可到达的结局节点ID列表
}

/**
 * 整体故事的分析结果
 */
export interface StoryAnalysis {
  nodes: Map<string, NodeAnalysis>;
  maxDepth: number;                           // 故事最大深度
  startNodeId: string | null;                 // 开始节点ID
  endingNodeIds: string[];                    // 所有结局节点ID
  hasCycles: boolean;                         // 是否包含循环
  sccs: StronglyConnectedComponent[];         // 所有强连通分量
  cycles: Cycle[];                            // 检测到的循环（最多10个）
}

/**
 * 故事结构分析器
 */
class StoryAnalyzer {
  private nodes: StoryNode[];
  private edges: StoryEdge[];
  private adjacencyList: Map<string, string[]>;         // 邻接表：nodeId -> [targetIds]
  private reverseAdjacencyList: Map<string, string[]>;  // 反向邻接表

  constructor(nodes: StoryNode[], edges: StoryEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.buildAdjacencyLists();
  }

  /**
   * 构建邻接表（图的基础数据结构）
   */
  private buildAdjacencyLists(): void {
    // 初始化
    this.nodes.forEach(node => {
      this.adjacencyList.set(node.id, []);
      this.reverseAdjacencyList.set(node.id, []);
    });

    // 填充
    this.edges.forEach(edge => {
      const sources = this.adjacencyList.get(edge.source) || [];
      sources.push(edge.target);
      this.adjacencyList.set(edge.source, sources);

      const targets = this.reverseAdjacencyList.get(edge.target) || [];
      targets.push(edge.source);
      this.reverseAdjacencyList.set(edge.target, targets);
    });
  }

  /**
   * 执行完整分析
   */
  analyze(): StoryAnalysis {
    const startNode = this.nodes.find(n => n.data.nodeType === NODE_TYPES.START);
    if (!startNode) {
      return this.emptyAnalysis();
    }

    const endingNodes = this.nodes.filter(n => n.data.nodeType === NODE_TYPES.ENDING);
    
    // 构建图结构用于算法分析
    const graph = buildGraph(
      this.nodes.map(n => n.id),
      this.edges.map(e => ({ source: e.source, target: e.target }))
    );

    // 检测强连通分量和循环
    const sccs = findStronglyConnectedComponents(graph);
    const hasCyclesFlag = sccs.some(scc => scc.isLoop);
    const cycles = hasCyclesFlag ? findCycles(graph) : [];

    // 建立节点到SCC的映射
    const nodeToSCC = this.buildNodeToSCCMap(sccs);

    const endingNodeIds = endingNodes.map(node => node.id);
    const { depths, maxDepthsToEnd, reachableEndings } = this.calculateCondensationMetrics(
      sccs,
      nodeToSCC,
      startNode.id,
      endingNodeIds,
    );

    // 构建节点分析结果
    const analysisMap = new Map<string, NodeAnalysis>();
    let maxDepth = 0;

    this.nodes.forEach(node => {
      const depth = depths.get(node.id) ?? Infinity;
      const sccId = nodeToSCC.get(node.id) ?? null;
      const scc = sccId !== null ? sccs[sccId] : null;
      const isInLoop = scc ? scc.isLoop : false;
      const maxDepthToEnd = maxDepthsToEnd.get(node.id) ?? 0;
      const outDegree = this.adjacencyList.get(node.id)?.length ?? 0;
      const inDegree = this.reverseAdjacencyList.get(node.id)?.length ?? 0;
      const choiceCount = node.data.choices.length;
      const isKeyDecision = choiceCount >= 3;
      const endings = reachableEndings.get(node.id) ?? [];

      if (depth !== Infinity && depth > maxDepth) {
        maxDepth = depth;
      }

      analysisMap.set(node.id, {
        nodeId: node.id,
        depth,
        sccId,
        isInLoop,
        maxDepthToEnd,
        outDegree,
        inDegree,
        choiceCount,
        isKeyDecision,
        reachableEndings: endings
      });
    });

    return {
      nodes: analysisMap,
      maxDepth,
      startNodeId: startNode.id,
      endingNodeIds,
      hasCycles: hasCyclesFlag,
      sccs,
      cycles
    };
  }

  /**
   * 建立节点到SCC的映射
   */
  private buildNodeToSCCMap(sccs: StronglyConnectedComponent[]): Map<string, number> {
    const map = new Map<string, number>();
    sccs.forEach(scc => {
      scc.nodes.forEach(nodeId => {
        map.set(nodeId, scc.id);
      });
    });
    return map;
  }

  /**
   * 计算深度（考虑SCC）
   * 
   * 算法改进：
   * - 对于在同一SCC内的节点，赋予相同的深度
   * - 这样循环节点会在同一层显示，而不是错位
   */
  private calculateCondensationMetrics(
    sccs: StronglyConnectedComponent[],
    nodeToSCC: Map<string, number>,
    startNodeId: string,
    endingNodeIds: string[],
  ): {
    depths: Map<string, number>;
    maxDepthsToEnd: Map<string, number>;
    reachableEndings: Map<string, string[]>;
  } {
    const successors = new Map<number, Set<number>>();
    const inDegree = new Map<number, number>();
    for (const scc of sccs) {
      successors.set(scc.id, new Set());
      inDegree.set(scc.id, 0);
    }
    for (const edge of this.edges) {
      const source = nodeToSCC.get(edge.source);
      const target = nodeToSCC.get(edge.target);
      if (source === undefined || target === undefined || source === target) continue;
      const targets = successors.get(source)!;
      if (!targets.has(target)) {
        targets.add(target);
        inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
      }
    }

    const topological: number[] = [];
    const topologicalQueue = [...inDegree.entries()]
      .filter(([, degree]) => degree === 0)
      .map(([id]) => id);
    for (let cursor = 0; cursor < topologicalQueue.length; cursor += 1) {
      const current = topologicalQueue[cursor];
      topological.push(current);
      for (const target of successors.get(current) ?? []) {
        const nextDegree = (inDegree.get(target) ?? 0) - 1;
        inDegree.set(target, nextDegree);
        if (nextDegree === 0) topologicalQueue.push(target);
      }
    }

    const sccDepths = new Map<number, number>();
    const startSCC = nodeToSCC.get(startNodeId);
    if (startSCC !== undefined) {
      const queue = [startSCC];
      sccDepths.set(startSCC, 0);
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const current = queue[cursor];
        const nextDepth = sccDepths.get(current)! + 1;
        for (const target of successors.get(current) ?? []) {
          const previous = sccDepths.get(target);
          if (previous === undefined || nextDepth < previous) {
            sccDepths.set(target, nextDepth);
            queue.push(target);
          }
        }
      }
    }

    const endingSet = new Set(endingNodeIds);
    const reachableBySCC = new Map<number, Set<string>>();
    const maxDepthBySCC = new Map<number, number>();
    for (const scc of sccs) {
      reachableBySCC.set(scc.id, new Set(scc.nodes.filter(nodeId => endingSet.has(nodeId))));
      maxDepthBySCC.set(scc.id, 0);
    }
    for (let index = topological.length - 1; index >= 0; index -= 1) {
      const current = topological[index];
      const currentEndings = reachableBySCC.get(current)!;
      for (const target of successors.get(current) ?? []) {
        const targetEndings = reachableBySCC.get(target)!;
        for (const ending of targetEndings) currentEndings.add(ending);
        if (targetEndings.size > 0) {
          maxDepthBySCC.set(
            current,
            Math.max(maxDepthBySCC.get(current) ?? 0, (maxDepthBySCC.get(target) ?? 0) + 1),
          );
        }
      }
    }

    const depths = new Map<string, number>();
    const maxDepthsToEnd = new Map<string, number>();
    const reachableEndings = new Map<string, string[]>();
    for (const node of this.nodes) {
      const sccId = nodeToSCC.get(node.id);
      if (sccId === undefined) continue;
      depths.set(node.id, sccDepths.get(sccId) ?? Infinity);
      if (endingSet.has(node.id)) {
        maxDepthsToEnd.set(node.id, 0);
        reachableEndings.set(node.id, [node.id]);
      } else {
        maxDepthsToEnd.set(node.id, maxDepthBySCC.get(sccId) ?? 0);
        reachableEndings.set(node.id, [...(reachableBySCC.get(sccId) ?? [])]);
      }
    }
    return { depths, maxDepthsToEnd, reachableEndings };
  }

  /**
   * 返回空分析结果
   */
  private emptyAnalysis(): StoryAnalysis {
    return {
      nodes: new Map(),
      maxDepth: 0,
      startNodeId: null,
      endingNodeIds: [],
      hasCycles: false,
      sccs: [],
      cycles: []
    };
  }
}

export default StoryAnalyzer;
