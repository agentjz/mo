/**
 * StoryAnalyzer 单元测试
 * 测试故事结构分析功能
 */

import { describe, test, expect } from 'vitest';
import StoryAnalyzer from '../../src/utils/engine/storyAnalyzer';
import type { StoryNode, StoryEdge } from '../../src/types/index';

describe('StoryAnalyzer - 基础分析', () => {
  test('能分析简单的线性故事', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '开始',
          choices: [{ id: 'c1', text: '继续' }]
        }
      },
      {
        id: '2',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 2,
          nodeType: 'ending',
          text: '结局',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [
      { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' }
    ];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    expect(result.startNodeId).toBe('1');
    expect(result.endingNodeIds).toEqual(['2']);
    expect(result.maxDepth).toBe(1);
    expect(result.hasCycles).toBe(false);
  });

  test('应该正确计算节点深度', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '开始',
          choices: [{ id: 'c1', text: '选项1' }]
        }
      },
      {
        id: '2',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 2,
          nodeType: 'normal',
          text: '节点2',
          choices: [{ id: 'c2', text: '选项2' }]
        }
      },
      {
        id: '3',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 3,
          nodeType: 'ending',
          text: '结局',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [
      { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' },
      { id: 'e2', source: '2', target: '3', sourceHandle: 'c2' }
    ];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    const node1Analysis = result.nodes.get('1')!;
    const node2Analysis = result.nodes.get('2')!;
    const node3Analysis = result.nodes.get('3')!;
    
    expect(node1Analysis.depth).toBe(0);
    expect(node2Analysis.depth).toBe(1);
    expect(node3Analysis.depth).toBe(2);
    expect(result.maxDepth).toBe(2);
  });

  test('应该识别关键决策点（3+选项）', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '开始',
          choices: [
            { id: 'c1', text: '选项1' },
            { id: 'c2', text: '选项2' },
            { id: 'c3', text: '选项3' }
          ]
        }
      }
    ];
    
    const edges: StoryEdge[] = [];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    const node1Analysis = result.nodes.get('1')!;
    expect(node1Analysis.isKeyDecision).toBe(true);
    expect(node1Analysis.choiceCount).toBe(3);
  });

  test('应该计算入度和出度', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '开始',
          choices: [{ id: 'c1', text: '选项1' }]
        }
      },
      {
        id: '2',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 2,
          nodeType: 'normal',
          text: '节点2',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [
      { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' }
    ];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    const node1Analysis = result.nodes.get('1')!;
    const node2Analysis = result.nodes.get('2')!;
    
    expect(node1Analysis.inDegree).toBe(0);
    expect(node1Analysis.outDegree).toBe(1);
    expect(node2Analysis.inDegree).toBe(1);
    expect(node2Analysis.outDegree).toBe(0);
  });
});

describe('StoryAnalyzer - 循环检测', () => {
  test('应该检测简单循环', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '节点1',
          choices: [{ id: 'c1', text: '去节点2' }]
        }
      },
      {
        id: '2',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 2,
          nodeType: 'normal',
          text: '节点2',
          choices: [{ id: 'c2', text: '回到节点1' }]
        }
      }
    ];
    
    const edges: StoryEdge[] = [
      { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' },
      { id: 'e2', source: '2', target: '1', sourceHandle: 'c2' }
    ];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    expect(result.hasCycles).toBe(true);
    expect(result.sccs.length).toBeGreaterThan(0);
  });

  test('应该标记循环中的节点', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '节点1',
          choices: [{ id: 'c1', text: '去节点2' }]
        }
      },
      {
        id: '2',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 2,
          nodeType: 'normal',
          text: '节点2',
          choices: [{ id: 'c2', text: '回到节点1' }]
        }
      }
    ];
    
    const edges: StoryEdge[] = [
      { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' },
      { id: 'e2', source: '2', target: '1', sourceHandle: 'c2' }
    ];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    const node1Analysis = result.nodes.get('1')!;
    const node2Analysis = result.nodes.get('2')!;
    
    expect(node1Analysis.isInLoop).toBe(true);
    expect(node2Analysis.isInLoop).toBe(true);
  });
});

describe('StoryAnalyzer - 可达性分析', () => {
  test('应该计算可达结局', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '开始',
          choices: [
            { id: 'c1', text: '选项1' },
            { id: 'c2', text: '选项2' }
          ]
        }
      },
      {
        id: '2',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 2,
          nodeType: 'ending',
          text: '结局A',
          choices: []
        }
      },
      {
        id: '3',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 3,
          nodeType: 'ending',
          text: '结局B',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [
      { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' },
      { id: 'e2', source: '1', target: '3', sourceHandle: 'c2' }
    ];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    const node1Analysis = result.nodes.get('1')!;
    expect(node1Analysis.reachableEndings.length).toBe(2);
    expect(node1Analysis.reachableEndings).toContain('2');
    expect(node1Analysis.reachableEndings).toContain('3');
  });

  test('应该识别所有结局节点', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '开始',
          choices: []
        }
      },
      {
        id: '2',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 2,
          nodeType: 'ending',
          text: '结局A',
          choices: []
        }
      },
      {
        id: '3',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 3,
          nodeType: 'ending',
          text: '结局B',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    expect(result.endingNodeIds.length).toBe(2);
    expect(result.endingNodeIds).toContain('2');
    expect(result.endingNodeIds).toContain('3');
  });
});

describe('StoryAnalyzer - 边界情况', () => {
  test('空故事应该返回空分析', () => {
    const nodes: StoryNode[] = [];
    const edges: StoryEdge[] = [];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    expect(result.startNodeId).toBeNull();
    expect(result.endingNodeIds).toEqual([]);
    expect(result.maxDepth).toBe(0);
    expect(result.hasCycles).toBe(false);
  });

  test('只有开始节点的故事', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'start',
          text: '开始',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [];
    
    const analyzer = new StoryAnalyzer(nodes, edges);
    const result = analyzer.analyze();
    
    expect(result.startNodeId).toBe('1');
    expect(result.maxDepth).toBe(0);
    expect(result.endingNodeIds).toEqual([]);
  });
});

describe('StoryAnalyzer - 大图性能', () => {
  test('3000 节点链在线性时间内完成分析', () => {
    const nodeCount = 3000;
    const nodes: StoryNode[] = Array.from({ length: nodeCount }, (_, index) => ({
      id: String(index + 1),
      type: 'storyNode',
      position: { x: 0, y: index * 10 },
      data: {
        nodeId: index + 1,
        nodeType: index === 0 ? 'start' : index === nodeCount - 1 ? 'ending' : 'normal',
        text: `节点 ${index + 1}`,
        choices: index === nodeCount - 1 ? [] : [{ id: `c${index + 1}`, text: '继续' }],
      },
    }));
    const edges: StoryEdge[] = Array.from({ length: nodeCount - 1 }, (_, index) => ({
      id: `e${index + 1}`,
      source: String(index + 1),
      target: String(index + 2),
      sourceHandle: `c${index + 1}`,
    }));

    const startedAt = performance.now();
    const result = new StoryAnalyzer(nodes, edges).analyze();
    const duration = performance.now() - startedAt;

    expect(result.nodes).toHaveLength(nodeCount);
    expect(result.maxDepth).toBe(nodeCount - 1);
    expect(result.nodes.get('1')?.maxDepthToEnd).toBe(nodeCount - 1);
    expect(duration).toBeLessThan(2000);
  });
});

