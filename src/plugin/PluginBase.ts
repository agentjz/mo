/**
 * 插件基类
 * 职责：提供插件的基础实现和辅助方法
 */

import type { Plugin, PluginMetadata, PluginContext, PluginConfig } from './types.js';

export abstract class PluginBase implements Plugin {
  abstract metadata: PluginMetadata;
  
  protected context!: PluginContext;
  protected settings: Record<string, unknown> = {};
  
  config: PluginConfig = {
    enabled: true,
    settings: {}
  };

  /**
   * 安装插件
   */
  async install(context: PluginContext): Promise<void> {
    this.context = context;
    this.settings = this.config.settings || {};
    await this.onInstall();
  }

  /**
   * 卸载插件
   */
  async uninstall(): Promise<void> {
    await this.onUninstall();
  }

  /**
   * 获取设置
   */
  getSettings(): Record<string, unknown> {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Record<string, unknown>): void {
    const next = { ...this.settings, ...structuredClone(settings) };
    this.onSettingsUpdate(next);
    this.settings = next;
    this.config.settings = { ...next };
  }

  /**
   * 生命周期钩子（子类覆盖）
   */
  protected async onInstall(): Promise<void> {}
  
  protected async onUninstall(): Promise<void> {}
  
  protected onSettingsUpdate(_settings: Record<string, unknown>): void {}

  /**
   * 辅助方法：读取数据
   */
  protected getData<T = unknown>(key: string): T | undefined {
    return this.context.data.get(key) as T | undefined;
  }

  /**
   * 辅助方法：写入数据
   */
  protected setData(key: string, value: unknown): void {
    this.context.data.set(key, value);
  }

  /**
   * 辅助方法：触发事件
   */
  protected emit(event: string, data?: unknown): void {
    this.context.events.emit(event, data);
  }

  /**
   * 辅助方法：监听事件
   */
  protected on<T = unknown>(event: string, handler: (data: T) => void): void {
    this.context.events.on(event, handler);
  }

  /**
   * 辅助方法：显示通知
   */
  protected notify(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.context.ui?.showNotification(message, type);
  }
}

