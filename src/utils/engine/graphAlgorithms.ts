/**
 * 图算法工具集（框架无关）
 * 职责：提供通用图算法实现（SCC、循环检测、拓扑排序）
 * 
 * 设计原则：
 * - 纯算法：不依赖业务类型
 * - 高性能：使用经典算法（Tarjan、Kosaraju）
 * - 可测试：输入输出都是基础数据结构
 */

/**
 * 图的基础表示（邻接表）
 */
export interface Graph {
  nodes: string[];
  edges: Map<string, string[]>; // nodeId -> [targetIds]
}

/**
 * 强连通分量（SCC）
 */
export interface StronglyConnectedComponent {
  id: number;           // SCC的唯一标识
  nodes: string[];      // 属于这个SCC的所有节点
  isLoop: boolean;      // 是否为循环（节点数>1或有自环）
}

/**
 * 循环信息
 */
export interface Cycle {
  nodes: string[];      // 组成循环的节点序列
}

/**
 * Tarjan算法：查找所有强连通分量
 * 
 * 时间复杂度：O(V + E)
 * 空间复杂度：O(V)
 * 
 * 算法思路：
 * 1. DFS遍历图
 * 2. 维护每个节点的访问顺序（index）和最小可达顺序（lowlink）
 * 3. 当 lowlink[v] == index[v] 时，v是SCC的根节点
 * 4. 从栈中弹出所有节点直到v，形成一个SCC
 * 
 * @param graph - 有向图
 * @returns 所有强连通分量
 */
export function findStronglyConnectedComponents(graph: Graph): StronglyConnectedComponent[] {
  const { nodes, edges } = graph;
  
  // Tarjan算法的状态
  const index = new Map<string, number>();      // 节点访问顺序
  const lowlink = new Map<string, number>();    // 节点能到达的最小index
  const onStack = new Set<string>();            // 节点是否在栈中
  const stack: string[] = [];                   // DFS栈
  let currentIndex = 0;                         // 当前访问序号
  const sccs: StronglyConnectedComponent[] = [];
  
  /**
   * DFS递归函数
   */
  function strongConnect(v: string): void {
    // 初始化当前节点
    index.set(v, currentIndex);
    lowlink.set(v, currentIndex);
    currentIndex++;
    stack.push(v);
    onStack.add(v);
    
    // 遍历所有后继节点
    const successors = edges.get(v) || [];
    for (const w of successors) {
      if (!index.has(w)) {
        // 后继节点未访问，递归访问
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        // 后继节点在栈中，说明有回边
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }
    
    // 如果v是SCC的根节点
    if (lowlink.get(v) === index.get(v)) {
      const sccNodes: string[] = [];
      let w: string;
      
      // 弹出栈中所有属于这个SCC的节点
      do {
        w = stack.pop()!;
        onStack.delete(w);
        sccNodes.push(w);
      } while (w !== v);
      
      // 判断是否为循环
      const isLoop = sccNodes.length > 1 || hasSelfLoop(v, edges);
      
      sccs.push({
        id: sccs.length,
        nodes: sccNodes,
        isLoop
      });
    }
  }
  
  // 对所有未访问节点执行DFS
  for (const node of nodes) {
    if (!index.has(node)) {
      strongConnect(node);
    }
  }
  
  return sccs;
}

/**
 * 检查节点是否有自环
 */
function hasSelfLoop(node: string, edges: Map<string, string[]>): boolean {
  const successors = edges.get(node) || [];
  return successors.includes(node);
}

/**
 * 检测图中是否存在循环
 * 
 * @param graph - 有向图
 * @returns 是否存在循环
 */
export function hasCycle(graph: Graph): boolean {
  const sccs = findStronglyConnectedComponents(graph);
  return sccs.some(scc => scc.isLoop);
}

/**
 * 查找图中的所有简单循环（使用Johnson算法的简化版）
 * 
 * 注意：这个函数可能性能开销较大，建议只在需要详细循环信息时使用
 * 对于大图（>100节点），只返回前10个循环避免性能问题
 * 
 * @param graph - 有向图
 * @returns 所有简单循环
 */
export function findCycles(graph: Graph): Cycle[] {
  const cycles: Cycle[] = [];
  const { nodes, edges } = graph;
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];
  
  /**
   * DFS查找循环
   */
  function dfs(node: string): void {
    if (cycles.length >= 10) return; // 限制返回的循环数量
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const successors = edges.get(node) || [];
    for (const successor of successors) {
      if (!visited.has(successor)) {
        dfs(successor);
      } else if (recursionStack.has(successor)) {
        // 找到循环
        const cycleStartIndex = path.indexOf(successor);
        if (cycleStartIndex !== -1) {
          const cycleNodes = path.slice(cycleStartIndex);
          cycles.push({ nodes: cycleNodes });
        }
      }
      
      if (cycles.length >= 10) return;
    }
    
    path.pop();
    recursionStack.delete(node);
  }
  
  // 对每个未访问的节点执行DFS
  for (const node of nodes) {
    if (!visited.has(node)) {
      dfs(node);
    }
    if (cycles.length >= 10) break;
  }
  
  return cycles;
}

/**
 * 拓扑排序（Kahn算法）
 * 
 * 注意：只对DAG有效，如果图有循环会返回null
 * 
 * 注：当前未使用（保留以备未来需要节点顺序排列时使用）
 * 
 * @param graph - 有向图
 * @returns 拓扑排序结果，如果有循环则返回null
 */
// export function topologicalSort(graph: Graph): string[] | null {
//   const { nodes, edges } = graph;
//   
//   // 计算入度
//   const inDegree = new Map<string, number>();
//   nodes.forEach(node => inDegree.set(node, 0));
//   
//   edges.forEach((targets) => {
//     targets.forEach(target => {
//       inDegree.set(target, (inDegree.get(target) || 0) + 1);
//     });
//   });
//   
//   // 找到所有入度为0的节点
//   const queue: string[] = [];
//   inDegree.forEach((degree, node) => {
//     if (degree === 0) {
//       queue.push(node);
//     }
//   });
//   
//   const result: string[] = [];
//   
//   while (queue.length > 0) {
//     const node = queue.shift()!;
//     result.push(node);
//     
//     const successors = edges.get(node) || [];
//     for (const successor of successors) {
//       const newDegree = (inDegree.get(successor) || 0) - 1;
//       inDegree.set(successor, newDegree);
//       
//       if (newDegree === 0) {
//         queue.push(successor);
//       }
//     }
//   }
//   
//   // 如果结果长度不等于节点数量，说明有循环
//   if (result.length !== nodes.length) {
//     return null;
//   }
//   
//   return result;
// }

/**
 * 检查图是否为DAG（有向无环图）
 * 
 * 注：当前未使用（功能与 hasCycle 重复）
 * 
 * @param graph - 有向图
 * @returns 是否为DAG
 */
// export function isDAG(graph: Graph): boolean {
//   return topologicalSort(graph) !== null;
// }

/**
 * 构建图的邻接表表示（工具函数）
 * 
 * @param nodeIds - 节点ID列表
 * @param edges - 边的列表 [source, target][]
 * @returns Graph对象
 */
export function buildGraph(
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>
): Graph {
  const adjacencyList = new Map<string, string[]>();
  
  // 初始化所有节点
  nodeIds.forEach(id => {
    adjacencyList.set(id, []);
  });
  
  // 添加边
  edges.forEach(edge => {
    const targets = adjacencyList.get(edge.source) || [];
    targets.push(edge.target);
    adjacencyList.set(edge.source, targets);
  });
  
  return {
    nodes: nodeIds,
    edges: adjacencyList
  };
}

/**
 * 计算图的缩合图（condensation graph）
 * 
 * 将每个SCC看作一个超级节点，构建SCC之间的DAG
 * 用于处理有循环的图的分层布局
 * 
 * 注：当前未使用（保留以备未来实现循环专用布局策略时使用）
 * 
 * @param graph - 原始图
 * @param sccs - 强连通分量列表
 * @returns 缩合图
 */
// export function buildCondensationGraph(
//   graph: Graph,
//   sccs: StronglyConnectedComponent[]
// ): Graph {
//   // 建立节点到SCC的映射
//   const nodeToSCC = new Map<string, number>();
//   sccs.forEach(scc => {
//     scc.nodes.forEach(node => {
//       nodeToSCC.set(node, scc.id);
//     });
//   });
//   
//   // 构建SCC之间的边
//   const condensationEdges = new Map<string, Set<string>>();
//   sccs.forEach(scc => {
//     condensationEdges.set(scc.id.toString(), new Set());
//   });
//   
//   graph.edges.forEach((targets, sourceNode) => {
//     const sourceSCC = nodeToSCC.get(sourceNode);
//     if (sourceSCC === undefined) return;
//     
//     targets.forEach(target => {
//       const targetSCC = nodeToSCC.get(target);
//       if (targetSCC === undefined) return;
//       
//       // 只添加跨SCC的边
//       if (sourceSCC !== targetSCC) {
//         const edgeSet = condensationEdges.get(sourceSCC.toString())!;
//         edgeSet.add(targetSCC.toString());
//       }
//     });
//   });
//   
//   // 转换为Graph格式
//   const condensationGraph: Graph = {
//     nodes: sccs.map(scc => scc.id.toString()),
//     edges: new Map()
//   };
//   
//   condensationEdges.forEach((targets, source) => {
//     condensationGraph.edges.set(source, Array.from(targets));
//   });
//   
//   return condensationGraph;
// }

