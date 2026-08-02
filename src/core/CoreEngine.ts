/**
 * 核心引擎（纯粹的节点流引擎）
 * 职责：节点跳转、历史管理、事件触发
 * 
 * 设计原则：
 * - 不包含任何业务逻辑
 * - 只管理节点流转
 * - 通过事件系统与插件通信
 */

import { NODE_TYPES } from '../constants/defaults.js';
import type { Story, StoryNode, StoryEdge, CurrentNode, SaveState } from '../types/index.js';

export interface EngineEventEmitter {
  emit: (event: EngineHook, data?: unknown) => void;
  trigger: <T>(hook: EngineHook, data: T) => T;
}

type EngineHook =
  | 'engine:start'
  | 'node:before-enter'
  | 'node:after-enter'
  | 'node:before-leave'
  | 'choice:filter'
  | 'choice:before-select'
  | 'choice:select'
  | 'content:process'
  | 'data:save'
  | 'data:load';

export class CoreEngine {
  private nodes: StoryNode[];
  private edges: StoryEdge[];
  private currentNodeId: string | null;
  private history: string[];
  private eventEmitter: EngineEventEmitter | null = null;

  constructor(storyData: Story, eventEmitter?: EngineEventEmitter) {
    this.nodes = storyData.nodes;
    this.edges = storyData.edges;
    this.currentNodeId = null;
    this.history = [];
    this.eventEmitter = eventEmitter || null;
  }

  /**
   * 设置事件发射器
   */
  setEventEmitter(emitter: EngineEventEmitter): void {
    this.eventEmitter = emitter;
  }

  /**
   * 触发事件
   */
  private emit(event: EngineHook, data?: unknown): void {
    this.eventEmitter?.emit(event, data);
  }

  /**
   * 触发钩子
   */
  private trigger<T>(hook: EngineHook, data: T): T {
    return this.eventEmitter?.trigger(hook, data) ?? data;
  }

  /**
   * 开始故事
   */
  start(startNodeId?: string): CurrentNode {
    this.emit('engine:start', {});
    
    let startNode: StoryNode | undefined;
    
    if (startNodeId) {
      // 从指定节点开始
      startNode = this.nodes.find(n => n.id === startNodeId);
      if (!startNode) {
        throw new Error(`未找到指定的开始节点: ${startNodeId}`);
      }
    } else {
      // 从开始节点开始
      startNode = this.nodes.find(n => n.data.nodeType === NODE_TYPES.START);
      if (!startNode) {
        throw new Error('未找到开始节点');
      }
    }
    
    this.currentNodeId = startNode.id;
    this.history = [startNode.id];
    
    return this.getCurrentNode();
  }

  /**
   * 获取当前节点
   */
  getCurrentNode(): CurrentNode {
    if (!this.currentNodeId) {
      throw new Error('当前节点ID为空');
    }

    const node = this.nodes.find(n => n.id === this.currentNodeId);
    if (!node) {
      throw new Error(`未找到节点: ${this.currentNodeId}`);
    }

    return this.buildCurrentNode(node);
  }

  /**
   * 构建当前节点数据
   */
  private buildCurrentNode(node: StoryNode): CurrentNode {
    this.emit('node:before-enter', { nodeId: node.id });
    
    let choices = node.data.choices.map((choice, index) => {
      const edge = this.edges.find(e => 
        e.source === node.id && e.sourceHandle === choice.id
      );

      return {
        id: choice.id,
        text: choice.text,
        targetNodeId: edge ? edge.target : null,
        index: index
      };
    });

    // 触发选择过滤钩子
    choices = this.trigger('choice:filter', {
      nodeId: node.id,
      choices: choices
    }).choices;

    // 触发内容渲染钩子
    const text = this.trigger('content:process', {
      nodeId: node.id,
      text: node.data.text
    }).text;

    const currentNode: CurrentNode = {
      id: node.id,
      nodeId: node.data.nodeId,
      text: text,
      type: node.data.nodeType,
      choices: choices.filter((c: any) => c.targetNodeId !== null),
      image: node.data.image,
      characterImages: node.data.characterImages
    };

    this.emit('node:after-enter', { nodeId: node.id, node: currentNode });
    
    return currentNode;
  }

  /**
   * 做出选择，跳转到下一个节点
   */
  makeChoice(choiceId: string): CurrentNode {
    if (!this.currentNodeId) {
      throw new Error('当前节点ID为空');
    }

    const currentStoryNode = this.nodes.find(n => n.id === this.currentNodeId);
    if (!currentStoryNode) {
      throw new Error(`未找到节点: ${this.currentNodeId}`);
    }

    const edge = this.edges.find(e => 
      e.source === this.currentNodeId && e.sourceHandle === choiceId
    );
    
    if (!edge || !edge.target) {
      throw new Error('选项未连接到目标节点');
    }

    this.emit('choice:before-select', { choiceId, targetNodeId: edge.target });
    this.emit('node:before-leave', { nodeId: this.currentNodeId });

    this.currentNodeId = edge.target;
    this.history.push(this.currentNodeId);
    
    this.emit('choice:select', { choiceId, nodeId: this.currentNodeId });
    
    return this.getCurrentNode();
  }

  /**
   * 直接跳转到指定节点（用于图片热区等场景）
   * 不需要通过choice和edge，直接指定目标节点ID
   */
  jumpToNode(targetNodeId: string): CurrentNode {
    if (!this.currentNodeId) {
      throw new Error('当前节点ID为空');
    }

    const targetNode = this.nodes.find(n => n.id === targetNodeId);
    if (!targetNode) {
      throw new Error(`未找到目标节点: ${targetNodeId}`);
    }

    this.emit('node:before-leave', { nodeId: this.currentNodeId });

    this.currentNodeId = targetNodeId;
    this.history.push(this.currentNodeId);
    
    return this.getCurrentNode();
  }

  /**
   * 是否为结局节点
   */
  isEnding(): boolean {
    const current = this.getCurrentNode();
    return current && current.type === NODE_TYPES.ENDING;
  }

  /**
   * 获取历史记录
   */
  getHistory(): Array<{ id: string; text: string }> {
    return this.history.map(nodeId => {
      const node = this.nodes.find(n => n.id === nodeId);
      return node ? {
        id: nodeId,
        text: node.data.text.substring(0, 50) + '...'
      } : { id: nodeId, text: '未知节点' };
    }).filter(item => item.text !== '未知节点');
  }

  /**
   * 保存进度
   */
  save(): SaveState {
    if (!this.currentNodeId) {
      throw new Error('没有当前节点ID，无法保存');
    }

    let saveData: SaveState = {
      currentNodeId: this.currentNodeId,
      history: this.history
    };

    // 触发保存钩子，让插件添加自己的数据
    saveData = this.trigger('data:save', saveData);

    return saveData;
  }

  /**
   * 加载进度
   */
  load(savedState: SaveState): CurrentNode {
    // 触发加载钩子，让插件恢复自己的数据
    const state = this.trigger('data:load', savedState);
    
    this.currentNodeId = state.currentNodeId;
    this.history = state.history;
    
    return this.getCurrentNode();
  }

  /**
   * 回退到上一步
   */
  goBack(): CurrentNode | null {
    if (this.history.length <= 1) {
      return null;
    }
    
    this.history.pop();
    this.currentNodeId = this.history[this.history.length - 1];
    return this.getCurrentNode();
  }

  /**
   * 是否可以回退
   */
  canGoBack(): boolean {
    return this.history.length > 1;
  }

  /**
   * 获取节点（只读）
   */
  getNode(id: string): StoryNode | null {
    return this.nodes.find(n => n.id === id) || null;
  }

  /**
   * 获取所有节点（只读）
   */
  getAllNodes(): StoryNode[] {
    return [...this.nodes];
  }

  /**
   * 获取所有边（只读）
   */
  getEdges(): StoryEdge[] {
    return [...this.edges];
  }

  /**
   * 获取当前节点ID
   */
  getCurrentNodeId(): string | null {
    return this.currentNodeId;
  }
}

export default CoreEngine;

