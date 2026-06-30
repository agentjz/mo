/**
 * 插件系统核心
 * 职责：管理插件生命周期、事件分发、钩子触发
 */

import type { Plugin, PluginHook, PluginContext, RegisteredPlugin, PluginHookHandler } from './types.js';

export class PluginSystem {
  private plugins: Map<string, RegisteredPlugin> = new Map();
  private hooks: Map<PluginHook, PluginHookHandler[]> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private dataStore: Map<string, any> = new Map();
  private context: PluginContext;

  constructor(context: Partial<PluginContext> = {}) {
    this.context = {
      engine: context.engine || this.createDefaultEngine(),
      data: this.createDataAPI(),
      events: this.createEventAPI(),
      getPlugin: this.getPluginInstance.bind(this),
      pluginSystem: this,
      ui: context.ui
    };
  }

  /**
   * 创建默认引擎API（如果没有提供）
   */
  private createDefaultEngine() {
    return {
      getNode: () => null,
      getAllNodes: () => [],
      getEdges: () => [],
      getCurrentNodeId: () => null,
      moveTo: () => {
        throw new Error('引擎尚未注入，无法跳转节点');
      }
    };
  }

  /**
   * 创建数据访问API
   */
  private createDataAPI() {
    return {
      get: (key: string) => this.dataStore.get(key),
      set: (key: string, value: any) => this.dataStore.set(key, value),
      remove: (key: string) => this.dataStore.delete(key)
    };
  }

  /**
   * 创建事件API
   */
  private createEventAPI() {
    return {
      emit: (event: string, data?: any) => this.emitEvent(event, data),
      on: (event: string, handler: Function) => this.addEventListener(event, handler),
      off: (event: string, handler: Function) => this.removeEventListener(event, handler)
    };
  }

  /**
   * 更新上下文（用于外部注入引擎）
   */
  updateContext(context: Partial<PluginContext>): void {
    if (context.engine) this.context.engine = context.engine;
    if (context.ui) this.context.ui = context.ui;
  }

  /**
   * 获取插件实例（供其他插件使用）
   */
  private getPluginInstance<T = any>(pluginId: string): T | null {
    const registered = this.plugins.get(pluginId);
    if (!registered || !registered.enabled) {
      return null;
    }
    return registered.plugin as T;
  }

  /**
   * 注册插件
   * 职责：注册插件元数据（plugin实例 + actions manifest）
   * 原子性保证：要么全部成功，要么回滚
   */
  async register(plugin: Plugin): Promise<void> {
    const { id } = plugin.metadata;
    
    if (this.plugins.has(id)) {
      throw new Error(`Plugin ${id} is already registered`);
    }

    // 检查依赖
    if (plugin.metadata.requires) {
      for (const requiredId of plugin.metadata.requires) {
        if (!this.plugins.has(requiredId)) {
          throw new Error(`Plugin ${id} requires ${requiredId}, but it is not installed`);
        }
      }
    }

    const registered: RegisteredPlugin = {
      plugin,
      enabled: plugin.config?.enabled ?? true,
      installedAt: new Date().toISOString()
    };

    this.plugins.set(id, registered);

    // 如果插件启用，检查冲突并安装运行时（hooks）
    if (registered.enabled) {
      if (plugin.metadata.conflicts) {
        for (const conflictId of plugin.metadata.conflicts) {
          const conflictPlugin = this.plugins.get(conflictId);
          if (conflictPlugin?.enabled) {
            throw new Error(`Plugin ${id} conflicts with ${conflictId}`);
          }
        }
      }
      
      try {
        await this.installPlugin(plugin);
      } catch (error) {
        // 回滚：移除已注册的内容
        this.plugins.delete(id);
        throw error;
      }
    }
  }

  /**
   * 安装插件（调用install，注册钩子）
   * 职责：只负责运行时初始化，不处理元数据
   * 注意：actions manifest已在register时注册，这里不再处理
   */
  private async installPlugin(plugin: Plugin): Promise<void> {
    await plugin.install(this.context);

    // 注册运行时钩子
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        this.registerHook(hookName as PluginHook, handler);
      }
    }
  }

  /**
   * 卸载插件
   * 职责：完整清理插件（运行时 + 元数据）
   */
  async unregister(pluginId: string): Promise<void> {
    const registered = this.plugins.get(pluginId);
    if (!registered) return;

    const { plugin } = registered;

    // 移除运行时钩子
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        this.unregisterHook(hookName as PluginHook, handler);
      }
    }

    // 调用卸载方法
    if (plugin.uninstall) {
      await plugin.uninstall();
    }

    this.plugins.delete(pluginId);
  }

  /**
   * 启用插件
   * 职责：重新注册manifest和运行时
   */
  async enable(pluginId: string): Promise<void> {
    const registered = this.plugins.get(pluginId);
    if (!registered || registered.enabled) return;

    const plugin = registered.plugin;

    // 检查并禁用冲突的插件（conflicts声明）
    if (plugin.metadata.conflicts) {
      for (const conflictId of plugin.metadata.conflicts) {
        const conflictPlugin = this.plugins.get(conflictId);
        if (conflictPlugin?.enabled) {
          await this.disable(conflictId);
        }
      }
    }

    // 检查双向冲突：其他插件声明了与当前插件冲突
    for (const [otherId, otherRegistered] of this.plugins.entries()) {
      if (otherId === pluginId) continue;
      if (!otherRegistered.enabled) continue;
      
      if (otherRegistered.plugin.metadata.conflicts?.includes(pluginId)) {
        await this.disable(otherId);
      }
    }

    // 同category互斥逻辑：theme 和 enhance 类型的插件同时只能启用一个
    const exclusiveCategories = ['theme', 'enhance'];
    if (exclusiveCategories.includes(plugin.metadata.category)) {
      for (const [otherId, otherRegistered] of this.plugins.entries()) {
        if (otherId === pluginId) continue;
        if (!otherRegistered.enabled) continue;
        
        if (otherRegistered.plugin.metadata.category === plugin.metadata.category) {
          await this.disable(otherId);
        }
      }
    }

    registered.enabled = true;
    
    try {
      await this.installPlugin(registered.plugin);
    } catch (error) {
      // 回滚：恢复状态
      registered.enabled = false;
      throw error;
    }
  }

  /**
   * 禁用插件
   * 职责：清理运行时和manifest
   */
  async disable(pluginId: string): Promise<void> {
    const registered = this.plugins.get(pluginId);
    if (!registered || !registered.enabled) return;

    const { plugin } = registered;

    // 移除运行时钩子
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        this.unregisterHook(hookName as PluginHook, handler);
      }
    }

    // 调用插件的卸载方法（清理资源、移除样式等）
    if (plugin.uninstall) {
      await plugin.uninstall();
    }

    registered.enabled = false;
  }

  /**
   * 注册钩子处理器
   */
  private registerHook(hookName: PluginHook, handler: PluginHookHandler): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName)!.push(handler);
  }

  /**
   * 注销钩子处理器
   */
  private unregisterHook(hookName: PluginHook, handler: PluginHookHandler): void {
    const handlers = this.hooks.get(hookName);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * 触发钩子（同步，按顺序执行）
   */
  trigger(hookName: PluginHook, data: any = null): any {
    const handlers = this.hooks.get(hookName);
    if (!handlers || handlers.length === 0) {
      return data;
    }

    let result = data;
    for (const handler of handlers) {
      try {
        result = handler(result, this.context);
      } catch (error) {
        console.error(`Plugin hook ${hookName} failed:`, error);
      }
    }
    return result;
  }

  /**
   * 触发钩子（异步）
   */
  async triggerAsync(hookName: PluginHook, data: any = null): Promise<any> {
    const handlers = this.hooks.get(hookName);
    if (!handlers || handlers.length === 0) {
      return data;
    }

    let result = data;
    for (const handler of handlers) {
      try {
        result = await handler(result, this.context);
      } catch (error) {
        console.error(`Plugin hook ${hookName} failed:`, error);
      }
    }
    return result;
  }

  /**
   * 添加事件监听器
   */
  private addEventListener(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * 移除事件监听器
   */
  private removeEventListener(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler for ${event} failed:`, error);
      }
    });
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取已启用的插件
   */
  getEnabledPlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): RegisteredPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 检查插件是否已注册
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * 检查插件是否已启用
   */
  isPluginEnabled(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    return plugin?.enabled ?? false;
  }

  /**
   * 导出插件配置
   */
  exportConfig(): Record<string, any> {
    const config: Record<string, any> = {};
    this.plugins.forEach((registered, id) => {
      config[id] = {
        enabled: registered.enabled,
        settings: registered.plugin.getSettings?.() ?? {}
      };
    });
    return config;
  }

  /**
   * 导入插件配置
   */
  async importConfig(config: Record<string, any>): Promise<void> {
    for (const [pluginId, pluginConfig] of Object.entries(config)) {
      const registered = this.plugins.get(pluginId);
      if (!registered) continue;

      if (pluginConfig.enabled && !registered.enabled) {
        await this.enable(pluginId);
      } else if (!pluginConfig.enabled && registered.enabled) {
        await this.disable(pluginId);
      }

      if (pluginConfig.settings && registered.plugin.updateSettings) {
        registered.plugin.updateSettings(pluginConfig.settings);
      }
    }
  }

  /**
   * 清空数据存储
   */
  clearData(): void {
    this.dataStore.clear();
  }

  /**
   * 获取数据快照
   */
  getDataSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    this.dataStore.forEach((value, key) => {
      snapshot[key] = value;
    });
    return snapshot;
  }

  /**
   * 恢复数据快照
   */
  restoreDataSnapshot(snapshot: Record<string, any>): void {
    this.dataStore.clear();
    Object.entries(snapshot).forEach(([key, value]) => {
      this.dataStore.set(key, value);
    });
  }

  /**
   * 获取事件API（供外部使用）
   */
  getEventAPI() {
    return this.context.events;
  }
}

