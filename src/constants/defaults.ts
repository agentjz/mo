/**
 * 默认值和常量配置（前后端共享）
 * 职责：定义业务常量和默认值
 * 设计原则：保持框架无关，纯数据定义
 */

import type { StoryMeta, StoryNode, NodeType } from '../types/index.js';

// ============= 默认值 =============

export const DEFAULT_STORY_META: StoryMeta = {
  title: '未命名故事',
  author: '作者',
  description: '',
  start_node: 1,
  displayMode: 'visual-novel',
  stylePluginId: 'vn-style.pixel'
};

export const DEFAULT_START_NODE: StoryNode = {
  id: '1',
  type: 'storyNode',
  position: { x: 250, y: 100 },
  data: {
    nodeId: 1,
    text: '故事开始...',
    choices: [{ id: 'c1_1', text: '继续' }],
    nodeType: 'start'
  }
};

// ============= 节点类型常量 =============

export const NODE_TYPES = {
  START: 'start' as NodeType,
  NORMAL: 'normal' as NodeType,
  ENDING: 'ending' as NodeType
} as const;

// ============= 边类型常量 =============

export const EDGE_TYPES = {
  STORY: 'story'         // 故事流程边（文本节点choice -> 文本节点）
} as const;

export type EdgeType = typeof EDGE_TYPES[keyof typeof EDGE_TYPES];

// 节点类型标签（国际化可扩展）
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  start: '开始',
  normal: '普通',
  ending: '结局'
};

// ============= 验证消息常量 =============

export const VALIDATION_MESSAGES = {
  NO_START_NODE: '错误：缺少开始节点',
  MULTIPLE_START_NODES: '错误：存在多个开始节点',
  ORPHAN_NODE: (nodeId: number): string => `错误：节点 ${nodeId} 无法到达（孤立节点）`,
  DEAD_END: (nodeId: number): string => `错误：节点 ${nodeId} 是死胡同（非结局但无后续）`,
  UNCONNECTED_CHOICE: (nodeId: number, choiceText: string): string =>
    `错误：节点 ${nodeId} 的选项 "${choiceText}" 未连接到任何节点`,
  CIRCULAR_REFERENCE: (nodeId: number): string => `警告：节点 ${nodeId} 存在自循环`,
} as const;

