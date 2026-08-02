/**
 * PlayerCore 单元测试
 * 测试播放器核心功能（不测试UI，只测试逻辑）
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PlayerCore } from '../../src/player/PlayerCore';
import type { Story } from '../../src/types/index';

describe('PlayerCore - 基础功能', () => {
  let simpleStory: Story;
  
  beforeEach(() => {
    simpleStory = {
      id: 'test-story',
      meta: {
        id: 'test',
        title: '测试故事',
        author: '测试',
        start_node: 1,
        displayMode: 'visual-novel'
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
            choices: [{ id: 'c1', text: '选项1' }]
          }
        },
        {
          id: '2',
          type: 'storyNode',
          position: { x: 0, y: 0 },
          data: {
            nodeId: 2,
            nodeType: 'ending',
            text: '结局节点',
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
    
    // 清理localStorage
    localStorage.clear();
  });

  test('能创建播放器实例', () => {
    const player = new PlayerCore();
    expect(player).toBeDefined();
  });

  test('start() 应该初始化游戏', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_'
    });
    
    await player.start(simpleStory);
    
    // 验证消息列表不为空
    const messages = player.getMessages();
    expect(messages.length).toBeGreaterThan(0);
  });

  test('makeChoice() 应该正确做出选择', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_'
    });
    
    await player.start(simpleStory);
    
    // 获取初始选项
    const choices = player.getChoices();
    expect(choices.length).toBe(1);
    
    // 做出选择
    player.makeChoice('c1');
    
    // 验证已到达结局
    const messages = player.getMessages();
    const hasEndingMessage = messages.some(m => m.text.includes('游戏结束'));
    expect(hasEndingMessage).toBe(true);
  });

  test('getMessages() 应该返回消息历史', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_'
    });
    
    await player.start(simpleStory);
    
    const messages = player.getMessages();
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
  });

  test('getChoices() 应该返回当前可选选项', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_'
    });
    
    await player.start(simpleStory);
    
    const choices = player.getChoices();
    expect(Array.isArray(choices)).toBe(true);
    expect(choices.length).toBe(1);
    expect(choices[0].id).toBe('c1');
  });
});

describe('PlayerCore - 回调函数', () => {
  let story: Story;
  
  beforeEach(() => {
    story = {
      id: 'test-story',
      meta: {
        id: 'test',
        title: '测试故事',
        author: '测试',
        start_node: 1,
        displayMode: 'visual-novel'
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
    
    localStorage.clear();
  });

  test('onNodeChange 应该在节点变化时触发', async () => {
    const onNodeChange = vi.fn();
    
    const player = new PlayerCore({
      saveKeyPrefix: 'test_',
      onNodeChange
    });
    
    await player.start(story);
    
    expect(onNodeChange).toHaveBeenCalled();
  });

  test('onChoicesChange 应该在选项变化时触发', async () => {
    const onChoicesChange = vi.fn();
    
    const player = new PlayerCore({
      saveKeyPrefix: 'test_',
      onChoicesChange
    });
    
    await player.start(story);
    
    expect(onChoicesChange).toHaveBeenCalled();
  });
});

describe('PlayerCore - 存档功能', () => {
  let story: Story;
  
  beforeEach(() => {
    story = {
      id: 'test-story',
      meta: {
        id: 'test',
        title: '测试故事',
        author: '测试',
        start_node: 1,
        displayMode: 'visual-novel'
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
    
    localStorage.clear();
  });

  test('executeSave() 应该保存游戏', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_save_'
    });
    
    await player.start(story);
    player.makeChoice('c1');
    
    const saveResult = player.executeSave();
    
    expect(saveResult).toBe(true);
    
    // 验证localStorage中有数据
    const savedData = localStorage.getItem('test_save_test-story');
    expect(savedData).not.toBeNull();
  });

  test('executeLoad() 应该加载游戏', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_load_'
    });
    
    await player.start(story);
    player.makeChoice('c1');
    player.executeSave();
    
    // 创建新播放器实例
    const newPlayer = new PlayerCore({
      saveKeyPrefix: 'test_load_'
    });
    await newPlayer.start(story);
    
    const loadResult = newPlayer.executeLoad();
    
    expect(loadResult).not.toBeNull();
  });

  test('executeRestart() 应该重启游戏', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_restart_'
    });
    
    await player.start(story);
    player.makeChoice('c1');
    
    const restartResult = player.executeRestart();
    
    expect(restartResult).not.toBeNull();
    expect(restartResult!.id).toBe('1');
  });

  test('saveToSlot() 应该保存到指定槽位', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_slot_'
    });
    
    await player.start(story);
    player.makeChoice('c1');
    
    const result = player.saveToSlot(1);
    
    expect(result).toBe(true);
    
    // 验证槽位数据
    const savedData = localStorage.getItem('test_slot_test-story_slot_1');
    expect(savedData).not.toBeNull();
  });

  test('loadFromSlot() 应该从指定槽位加载', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_slot_load_'
    });
    
    await player.start(story);
    player.makeChoice('c1');
    player.saveToSlot(1);
    
    // 创建新播放器
    const newPlayer = new PlayerCore({
      saveKeyPrefix: 'test_slot_load_'
    });
    await newPlayer.start(story);
    
    const loadResult = newPlayer.loadFromSlot(1);
    
    expect(loadResult).not.toBeNull();
    expect(loadResult!.id).toBe('2');
  });

  test('getSaveSlots() 应该返回所有存档槽', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_slots_'
    });
    
    await player.start(story);
    player.makeChoice('c1');
    player.saveToSlot(1);
    player.saveToSlot(2);
    
    const slots = player.getSaveSlots();
    
    expect(slots.length).toBe(3);
    expect(slots[0].exists).toBe(true);
    expect(slots[1].exists).toBe(true);
    expect(slots[2].exists).toBe(false);
  });
});

describe('PlayerCore - 边界情况', () => {
  test('没有选项时 getChoices() 应该返回空数组', async () => {
    const story: Story = {
      id: 'test',
      meta: {
        id: 'test',
        title: '测试',
        author: '测试',
        start_node: 1,
        displayMode: 'visual-novel'
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
            choices: []
          }
        }
      ],
      edges: [],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const player = new PlayerCore();
    await player.start(story);
    
    const choices = player.getChoices();
    expect(choices).toEqual([]);
  });

  test('executeLoad() 没有存档时应该返回null', async () => {
    const player = new PlayerCore({
      saveKeyPrefix: 'test_no_save_'
    });
    
    const story: Story = {
      id: 'test',
      meta: {
        id: 'test',
        title: '测试',
        author: '测试',
        start_node: 1,
        displayMode: 'visual-novel'
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
            choices: []
          }
        }
      ],
      edges: [],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await player.start(story);
    const result = player.executeLoad();
    
    expect(result).toBeNull();
  });
});

