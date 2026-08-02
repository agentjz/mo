/**
 * 共享类型定义
 * 职责：定义前后端通用的数据结构
 */

import type { Edge as ReactFlowEdge, Node as ReactFlowNode } from 'reactflow';

// ============= Blockly 类型 =============

export * from './blockly.js';

// ============= 基础类型 =============

export interface Position {
  x: number;
  y: number;
}

export interface Choice {
  id: string;
  text: string;
  // 插件扩展数据（各插件可在此存储自己的数据）
  pluginData?: Record<string, any>;
}

// ============= 节点类型 =============

export type NodeType = 'start' | 'normal' | 'ending';

export interface NodeImage {
  imagePath: string;     // 相对路径（如 "pictures/abc123.webp"）
  fileName: string;      // 原始文件名
  fileSize: number;      // 文件大小（字节）
  originalFormat: string; // 原始格式 (png, jpg, gif等)
  hash: string;          // 图片内容哈希（用于去重）
  width: number;         // 图片宽度
  height: number;        // 图片高度
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 
            'top left' | 'top right' | 'bottom left' | 'bottom right'; // 背景图位置
  sceneName?: string;    // 场景名称（热点图片模式下显示在世界地图中）
  scale?: number;        // 缩放比例（0.1-3.0，默认1.0）
}

export interface CharacterImage extends NodeImage {
  horizontalPosition?: 'left' | 'center' | 'right';  // 水平位置
  verticalPosition?: 'top' | 'center' | 'bottom';    // 垂直位置
}

export interface CharacterImages {
  left?: CharacterImage;
  center?: CharacterImage;
  right?: CharacterImage;
}

export interface TextNodeData {
  nodeId: number;
  text: string;
  choices: Choice[];
  nodeType: 'start' | 'normal' | 'ending';
  image?: NodeImage;
  characterImages?: CharacterImages;
  tags?: string[];
  typewriterSpeed?: number; // 打字机速度（毫秒/字符），0=关闭，默认0
  // 插件扩展数据（各插件可在此存储自己的数据）
  pluginData?: Record<string, any>;
}

export type NodeData = TextNodeData;

export type StoryNode = ReactFlowNode<NodeData>;

// ============= 边类型 =============

export type StoryEdge = ReactFlowEdge;

// ============= 故事元数据 =============

export interface StoryMeta {
  id?: string;
  title: string;
  author: string;
  description: string;
  start_node: number;
  displayMode?: 'visual-novel';  // 播放器显示模式（已移除terminal模式）
  renderStyle?: 'visual-novel' | 'chat';  // 渲染器样式：视觉小说或聊天风格，默认为visual-novel
  stylePluginId?: string;  // 当前使用的样式插件ID
}

// ============= 变量定义类型 =============

export interface VariableDefinition {
  id: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  defaultValue: number | string | boolean;
  description?: string;
  source?: 'user' | 'plugin';
  pluginId?: string;
  displayInPlayer?: boolean;
  displayOrder?: number;
}

// ============= 完整故事结构 =============

export interface Story {
  id: string;
  meta: StoryMeta;
  nodes: StoryNode[];
  edges: StoryEdge[];
  variables?: VariableDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryListItem {
  id: string;
  title: string;
  author: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ============= 故事引擎类型 =============

export interface CurrentNode {
  id: string;
  nodeId: number;
  text: string;
  type: NodeType;
  choices: ChoiceWithTarget[];
  image?: NodeImage;
  characterImages?: CharacterImages;
  renderedHTML?: string;
}

export interface VisitedNodeInfo {
  nodeId: string;
  nodeName: string;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
}

export interface ChoiceWithTarget extends Choice {
  targetNodeId: string | null;
  index: number;
}

export interface SaveState {
  currentNodeId: string;
  history: string[];
  visitedNodes?: string[];
}

export interface SaveSlot {
  slotId: number;
  exists: boolean;
  saveTime?: string;
  nodeName?: string;
  nodeText?: string;
  saveData?: SaveState;
}

// ============= 验证相关类型 =============

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

