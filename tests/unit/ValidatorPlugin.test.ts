/**
 * ValidatorPlugin 单元测试
 * 测试故事结构验证功能
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ValidatorPlugin } from '../../src/plugins/tools/ValidatorPlugin';
import { PluginSystem } from '../../src/plugin/PluginSystem';
import type { StoryNode, StoryEdge } from '../../src/types/index';

describe('ValidatorPlugin - 基础验证', () => {
  let plugin: ValidatorPlugin;
  
  beforeEach(async () => {
    const pluginSystem = new PluginSystem();
    plugin = new ValidatorPlugin();
    await pluginSystem.register(plugin);
  });

  test('完整的故事应该验证通过', () => {
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
    
    const result = plugin.validate(nodes, edges);
    
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('缺少开始节点应该报错', () => {
    const nodes: StoryNode[] = [
      {
        id: '1',
        type: 'storyNode',
        position: { x: 0, y: 0 },
        data: {
          nodeId: 1,
          nodeType: 'normal',
          text: '普通节点',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [];
    
    const result = plugin.validate(nodes, edges);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('开始节点'))).toBe(true);
  });

  test('孤立节点应该报警告', () => {
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
          nodeType: 'normal',
          text: '孤立节点',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [];
    
    const result = plugin.validate(nodes, edges);
    
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('选项未连接应该报错', () => {
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
            { id: 'c1', text: '已连接的选项' },
            { id: 'c2', text: '未连接的选项' }
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
          text: '结局',
          choices: []
        }
      }
    ];
    
    const edges: StoryEdge[] = [
      { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' }
      // c2 没有连接
    ];
    
    const result = plugin.validate(nodes, edges);
    
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('未连接'))).toBe(true);
  });

  test('缺少结局节点应该报警告', () => {
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
    
    const result = plugin.validate(nodes, edges);
    
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('ValidatorPlugin - 复杂场景', () => {
  let plugin: ValidatorPlugin;
  
  beforeEach(async () => {
    const pluginSystem = new PluginSystem();
    plugin = new ValidatorPlugin();
    await pluginSystem.register(plugin);
  });

  test('多个结局的故事应该验证通过', () => {
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
    
    const result = plugin.validate(nodes, edges);
    
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('有循环的故事应该能验证', () => {
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
          choices: [
            { id: 'c2', text: '回到节点1' },
            { id: 'c3', text: '结束' }
          ]
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
      { id: 'e2', source: '2', target: '1', sourceHandle: 'c2' },
      { id: 'e3', source: '2', target: '3', sourceHandle: 'c3' }
    ];
    
    const result = plugin.validate(nodes, edges);
    
    // 有循环但有出口，应该通过验证
    expect(result.valid).toBe(true);
  });
});

