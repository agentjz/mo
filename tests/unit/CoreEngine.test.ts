/**
 * CoreEngine 单元测试
 * 测试核心引擎的节点流转逻辑
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { CoreEngine } from '../../src/core/CoreEngine';
import type { Story } from '../../src/types/index';

describe('CoreEngine - 基础功能', () => {
  let simpleStory: Story;
  
  beforeEach(() => {
    // 准备测试数据：开始 → 普通 → 结局
    simpleStory = {
      id: 'test-story',
      meta: {
        id: 'test',
        title: '测试故事',
        author: '测试',
        start_node: 1
      },
      nodes: [
        {
          id: '1',
          type: 'storyNode',
          position: { x: 0, y: 0 },
          data: {
            nodeId: 1,
            nodeType: 'start',
            text: '开始节点',
            choices: [
              { id: 'c1', text: '选项1' }
            ]
          }
        },
        {
          id: '2',
          type: 'storyNode',
          position: { x: 0, y: 0 },
          data: {
            nodeId: 2,
            nodeType: 'normal',
            text: '普通节点',
            choices: [
              { id: 'c2', text: '选项2' }
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
            text: '结局节点',
            choices: []
          }
        }
      ],
      edges: [
        { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' },
        { id: 'e2', source: '2', target: '3', sourceHandle: 'c2' }
      ],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  test('能创建引擎实例', () => {
    const engine = new CoreEngine(simpleStory);
    expect(engine).toBeDefined();
  });

  test('start() 应该找到开始节点', () => {
    const engine = new CoreEngine(simpleStory);
    const currentNode = engine.start();
    
    expect(currentNode.id).toBe('1');
    expect(currentNode.text).toBe('开始节点');
    expect(currentNode.type).toBe('start');
    expect(currentNode.choices.length).toBe(1);
  });

  test('start() 找不到开始节点时应该抛出错误', () => {
    const storyWithoutStart = {
      ...simpleStory,
      nodes: [
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
      ],
      edges: []
    };
    
    const engine = new CoreEngine(storyWithoutStart as any);
    expect(() => engine.start()).toThrow('未找到开始节点');
  });

  test('makeChoice() 应该正确跳转到目标节点', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    
    const nextNode = engine.makeChoice('c1');
    
    expect(nextNode.id).toBe('2');
    expect(nextNode.text).toBe('普通节点');
  });

  test('makeChoice() 选项未连接时应该抛出错误', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    
    expect(() => engine.makeChoice('invalid-choice')).toThrow('选项未连接到目标节点');
  });

  test('getCurrentNode() 应该返回当前节点', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    
    const currentNode = engine.getCurrentNode();
    expect(currentNode.id).toBe('1');
  });

  test('isEnding() 应该正确判断结局节点', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    
    expect(engine.isEnding()).toBe(false);
    
    engine.makeChoice('c1');
    expect(engine.isEnding()).toBe(false);
    
    engine.makeChoice('c2');
    expect(engine.isEnding()).toBe(true);
  });

  test('getHistory() 应该记录访问历史', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    engine.makeChoice('c1');
    
    const history = engine.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].id).toBe('1');
    expect(history[1].id).toBe('2');
  });

  test('goBack() 应该回退到上一个节点', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    engine.makeChoice('c1');
    
    const prevNode = engine.goBack();
    
    expect(prevNode).not.toBeNull();
    expect(prevNode!.id).toBe('1');
  });

  test('goBack() 在起点时应该返回null', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    
    const result = engine.goBack();
    expect(result).toBeNull();
  });

  test('canGoBack() 应该正确判断是否可回退', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    
    expect(engine.canGoBack()).toBe(false);
    
    engine.makeChoice('c1');
    expect(engine.canGoBack()).toBe(true);
  });

  test('jumpToNode() 应该直接跳转到指定节点', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    
    const targetNode = engine.jumpToNode('3');
    
    expect(targetNode.id).toBe('3');
    expect(targetNode.type).toBe('ending');
  });

  test('jumpToNode() 跳转到不存在的节点应该抛出错误', () => {
    const engine = new CoreEngine(simpleStory);
    engine.start();
    
    expect(() => engine.jumpToNode('999')).toThrow('未找到目标节点');
  });
});

describe('CoreEngine - 存档功能', () => {
  let story: Story;
  
  beforeEach(() => {
    story = {
      id: 'test-story',
      meta: {
        id: 'test',
        title: '测试故事',
        author: '测试',
        start_node: 1
      },
      nodes: [
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
      ],
      edges: [
        { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' }
      ],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  test('save() 应该保存当前状态', () => {
    const engine = new CoreEngine(story);
    engine.start();
    engine.makeChoice('c1');
    
    const saveData = engine.save();
    
    expect(saveData.currentNodeId).toBe('2');
    expect(saveData.history).toEqual(['1', '2']);
  });

  test('load() 应该恢复保存的状态', () => {
    const engine = new CoreEngine(story);
    engine.start();
    engine.makeChoice('c1');
    
    const saveData = engine.save();
    
    // 创建新引擎实例
    const newEngine = new CoreEngine(story);
    const loadedNode = newEngine.load(saveData);
    
    expect(loadedNode.id).toBe('2');
    expect(newEngine.getHistory().length).toBe(2);
  });
});

describe('CoreEngine - 事件系统', () => {
  test('应该触发 engine:start 事件', () => {
    const story = {
      id: 'test',
      meta: { id: 'test', title: 'test', author: 'test', start_node: 1 },
      nodes: [
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
      ],
      edges: [],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    let eventFired = false;
    const eventEmitter = {
      emit: (event: string) => {
        if (event === 'engine:start') {
          eventFired = true;
        }
      },
      trigger: (hook: string, data: any) => data
    };
    
    const engine = new CoreEngine(story as any, eventEmitter);
    engine.start();
    
    expect(eventFired).toBe(true);
  });

  test('应该触发 choice:select 事件', () => {
    const story = {
      id: 'test',
      meta: { id: 'test', title: 'test', author: 'test', start_node: 1 },
      nodes: [
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
      ],
      edges: [
        { id: 'e1', source: '1', target: '2', sourceHandle: 'c1' }
      ],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    let eventFired = false;
    const eventEmitter = {
      emit: (event: string) => {
        if (event === 'choice:select') {
          eventFired = true;
        }
      },
      trigger: (hook: string, data: any) => data
    };
    
    const engine = new CoreEngine(story as any, eventEmitter);
    engine.start();
    engine.makeChoice('c1');
    
    expect(eventFired).toBe(true);
  });
});

