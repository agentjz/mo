/**
 * 故事流程验证器（框架无关，前后端共享）
 * 职责：检查故事结构的完整性和有效性
 * 
 * 重构说明：
 * - 使用graphAlgorithms.ts提供的循环检测
 * - 增加结局可达性检查
 * - 增加假选择检测
 */

import { VALIDATION_MESSAGES, NODE_TYPES } from '../constants/defaults.js';
import type { StoryNode, StoryEdge, ValidationResult } from '../types/index.js';
import { buildGraph, findCycles } from '../utils/engine/graphAlgorithms.js';

class StoryValidator {
  private nodes: StoryNode[];
  private edges: StoryEdge[];
  private errors: string[];
  private warnings: string[];

  constructor(nodes: StoryNode[], edges: StoryEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 执行全部验证
   * @returns 验证结果 { valid, errors, warnings }
   */
  validate(): ValidationResult {
    this.errors = [];
    this.warnings = [];

    this.checkStartNode();
    this.checkOrphanNodes();
    this.checkDeadEnds();
    this.checkUnconnectedChoices();
    this.checkCircularReferences();
    this.checkEndingReachability();
    this.checkFakeChoices();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * 检查是否有开始节点
   */
  private checkStartNode(): void {
    const startNodes = this.nodes.filter(n => n.data.nodeType === NODE_TYPES.START);
    if (startNodes.length === 0) {
      this.errors.push(VALIDATION_MESSAGES.NO_START_NODE);
    } else if (startNodes.length > 1) {
      this.errors.push(VALIDATION_MESSAGES.MULTIPLE_START_NODES);
    }
  }

  /**
   * 检查孤立节点（无法到达的节点）
   * 
   * 性能优化：使用索引代替shift()，避免O(n²)复杂度
   */
  private checkOrphanNodes(): void {
    const startNode = this.nodes.find(n => n.data.nodeType === NODE_TYPES.START);
    if (!startNode) return;

    const reachable = new Set<string>([startNode.id]);
    const queue: string[] = [startNode.id];
    let queueIndex = 0;

    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];
      if (!current) continue;

      const outgoing = this.edges.filter(e => e.source === current);
      
      outgoing.forEach(edge => {
        if (!reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    this.nodes.forEach(node => {
      if (!reachable.has(node.id) && node.data.nodeType !== NODE_TYPES.START) {
        this.errors.push(VALIDATION_MESSAGES.ORPHAN_NODE(node.data.nodeId));
      }
    });
  }

  /**
   * 检查死胡同（非结局节点但没有后续）
   */
  private checkDeadEnds(): void {
    this.nodes.forEach(node => {
      if (node.data.nodeType === NODE_TYPES.ENDING) return;
      
      const hasOutgoing = this.edges.some(e => e.source === node.id);
      if (!hasOutgoing) {
        this.errors.push(VALIDATION_MESSAGES.DEAD_END(node.data.nodeId));
      }
    });
  }

  /**
   * 检查未连接的选项
   */
  private checkUnconnectedChoices(): void {
    this.nodes.forEach(node => {
      if (node.data.nodeType === NODE_TYPES.ENDING) return; // 结束节点没有选项
      
      (node.data as any).choices.forEach((choice: any) => {
        const hasEdge = this.edges.some(e => 
          e.source === node.id && e.sourceHandle === choice.id
        );
        
        if (!hasEdge) {
          this.errors.push(
            VALIDATION_MESSAGES.UNCONNECTED_CHOICE(node.data.nodeId, choice.text)
          );
        }
      });
    });
  }

  /**
   * 检查循环引用（使用graphAlgorithms的正确实现）
   */
  private checkCircularReferences(): void {
    // 构建图结构
    const graph = buildGraph(
      this.nodes.map(n => n.id),
      this.edges.map(e => ({ source: e.source, target: e.target }))
    );

    // 使用graphAlgorithms检测所有循环
    const cycles = findCycles(graph);

    if (cycles.length > 0) {
      cycles.forEach(cycle => {
        // 将节点ID转换为nodeId显示
        const nodeIds = cycle.nodes
          .map(id => {
            const node = this.nodes.find(n => n.id === id);
            return node ? node.data.nodeId : id;
          })
          .join(' → ');
        
        this.warnings.push(`警告：检测到循环结构: ${nodeIds}`);
      });

      if (cycles.length > 10) {
        this.warnings.push('警告：检测到过多循环结构，可能导致玩家困惑');
      }
    }
  }

  /**
   * 检查结局的可达性
   * 确保至少有一个结局可以从开始节点到达
   * 
   * 性能优化：使用索引代替shift()，避免O(n²)复杂度
   */
  private checkEndingReachability(): void {
    const startNode = this.nodes.find(n => n.data.nodeType === NODE_TYPES.START);
    const endingNodes = this.nodes.filter(n => n.data.nodeType === NODE_TYPES.ENDING);

    if (endingNodes.length === 0) {
      this.warnings.push('警告：故事没有结局节点');
      return;
    }

    if (!startNode) return;

    // BFS找到所有可达的结局
    const reachableEndings = new Set<string>();
    const visited = new Set<string>([startNode.id]);
    const queue: string[] = [startNode.id];
    let queueIndex = 0;

    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];
      if (!current) continue;

      const currentNode = this.nodes.find(n => n.id === current);
      if (currentNode && currentNode.data.nodeType === NODE_TYPES.ENDING) {
        reachableEndings.add(current);
      }

      const outgoing = this.edges.filter(e => e.source === current);
      outgoing.forEach(edge => {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    // 检查是否有结局无法到达
    endingNodes.forEach(ending => {
      if (!reachableEndings.has(ending.id)) {
        this.warnings.push(
          `警告：结局节点 ${ending.data.nodeId} 无法从开始节点到达`
        );
      }
    });

    // 如果没有任何可达的结局
    if (reachableEndings.size === 0) {
      this.errors.push('错误：没有任何结局可以从开始节点到达');
    }
  }

  /**
   * 检查假选择（多个选项指向同一节点）
   */
  private checkFakeChoices(): void {
    this.nodes.forEach(node => {
      if (node.data.nodeType === NODE_TYPES.ENDING) return;
      if ((node.data as any).choices.length < 2) return;

      // 找到这个节点的所有出边
      const outgoingEdges = this.edges.filter(e => e.source === node.id);
      
      // 统计每个目标节点被指向的次数
      const targetCounts = new Map<string, number>();
      outgoingEdges.forEach(edge => {
        targetCounts.set(edge.target, (targetCounts.get(edge.target) || 0) + 1);
      });

      // 如果所有选项都指向同一个节点
      if (targetCounts.size === 1 && (node.data as any).choices.length > 1) {
        this.warnings.push(
          `警告：节点 ${node.data.nodeId} 的所有选项都指向同一节点（假选择）`
        );
      }

      // 如果多个选项指向同一节点
      targetCounts.forEach((count, target) => {
        if (count > 1) {
          const targetNode = this.nodes.find(n => n.id === target);
          const targetLabel = targetNode ? `节点 ${targetNode.data.nodeId}` : target;
          this.warnings.push(
            `警告：节点 ${node.data.nodeId} 有 ${count} 个选项指向 ${targetLabel}`
          );
        }
      });
    });
  }
}

export default StoryValidator;
