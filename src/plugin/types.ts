/**
 * 插件系统类型定义
 * 职责：定义插件相关的所有类型和接口
 */

import type { PluginContributionMap, PluginContributions } from './contributions.ts';

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
  compatibleWith?: string[];
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
  
  // UI扩展（仅前端可用）
  ui?: {
    showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
    openDialog: (config: unknown) => Promise<unknown>;
  };
}

/**
 * 插件接口
 */
export interface Plugin {
  metadata: PluginMetadata;
  
  install(context: PluginContext): void | Promise<void>;
  
  uninstall?(): void | Promise<void>;
  
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

