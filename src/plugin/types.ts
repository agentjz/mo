/**
 * 插件系统类型定义
 * 职责：定义插件相关的所有类型和接口
 */

import type { StoryNode, StoryEdge } from '../types/index.js';
import type { PluginContributionMap, PluginContributions } from './contributions.ts';

/**
 * 插件生命周期钩子
 */
export type PluginHook = 
  // 引擎生命周期
  | 'engine:init'
  | 'engine:start'
  | 'engine:destroy'
  // 节点生命周期
  | 'node:before-enter'
  | 'node:enter'
  | 'node:after-enter'
  | 'node:before-leave'
  | 'node:leave'
  // 选择相关
  | 'choice:before-select'
  | 'choice:select'
  | 'choice:filter'
  // 内容处理
  | 'content:render'
  | 'content:process'
  // 数据管理
  | 'data:save'
  | 'data:load'
  | 'data:get'
  | 'data:set'
  // 编辑器相关
  | 'editor:init'
  | 'editor:node-add'
  | 'editor:node-update'
  | 'editor:node-delete'
  | 'editor:edge-add'
  | 'editor:edge-delete'
  // UI扩展
  | 'ui:toolbar'
  | 'ui:sidebar'
  | 'ui:node-panel'
  | 'ui:player-hud'
  // 播放器相关
  | 'player:init'
  | 'player:render'
  | 'player:command'
  // Blockly扩展
  | 'blockly:register-blocks'
  | 'blockly:register-generators'
  | 'blockly:register-toolbox-categories'
  // 插件变量注册
  | 'plugin:get-variables'
  | 'plugin:get-docs';

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon?: string;
  category: 'tool' | 'basicmod' | 'gamemod' | 'theme' | 'enhance' | 'community';
  tags?: string[];
  requires?: string[];
  conflicts?: string[];
  compatibleWith?: ('visual-novel')[];
}

/**
 * 插件配置
 */
export interface PluginConfig {
  enabled: boolean;
  settings?: Record<string, unknown>;
}

/**
 * 插件上下文（插件运行时可访问的API）
 */
export interface PluginContext {
  // 引擎访问
  engine: {
    getNode: (id: string) => StoryNode | null;
    getAllNodes: () => StoryNode[];
    getEdges: () => StoryEdge[];
    getCurrentNodeId: () => string | null;
    moveTo: (nodeId: string) => void;
  };
  
  // 数据访问
  data: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    remove: (key: string) => void;
  };
  
  // 事件系统
  events: {
    emit: (event: string, data?: unknown) => void;
    on: <T = unknown>(event: string, handler: (data: T) => void) => void;
    off: <T = unknown>(event: string, handler: (data: T) => void) => void;
  };
  
  // 插件系统访问
  getPlugin: <T = unknown>(pluginId: string) => T | null;

  getContribution: <Kind extends keyof PluginContributionMap>(
    kind: Kind,
    key: string,
  ) => PluginContributionMap[Kind] | undefined;
  
  // 插件系统自身
  pluginSystem?: unknown;
  
  // UI扩展（仅前端可用）
  ui?: {
    showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
    openDialog: (config: unknown) => Promise<unknown>;
  };
}

/**
 * 插件钩子处理器
 */
export type PluginHookHandler = (data: any, context: PluginContext) => any | Promise<any>;

/**
 * 插件接口
 */
export interface Plugin {
  metadata: PluginMetadata;
  
  install(context: PluginContext): void | Promise<void>;
  
  uninstall?(): void | Promise<void>;
  
  hooks?: Partial<Record<PluginHook, PluginHookHandler>>;

  getContributions?(): PluginContributions;
  
  config?: PluginConfig;
  
  getSettings?(): Record<string, unknown>;
  
  updateSettings?(settings: Record<string, unknown>): void;
}

/**
 * 插件注册信息
 */
export interface RegisteredPlugin {
  plugin: Plugin;
  enabled: boolean;
  installedAt: string;
  health: 'ready' | 'disabled' | 'degraded';
  error?: string;
}

/**
 * 插件存储配置
 */
export interface PluginStoreConfig {
  plugins: RegisteredPlugin[];
  settings: Record<string, unknown>;
}

