import { ContributionRegistry, type PluginContributionMap } from './contributions.ts';
import type {
  Plugin,
  PluginContext,
  PluginHook,
  PluginHookHandler,
  RegisteredPlugin,
} from './types.ts';

interface OwnedHook {
  ownerPluginId: string;
  handler: PluginHookHandler;
}

interface OwnedEventHandler {
  ownerPluginId: string;
  originalHandler: (data: never) => void;
  invoke: (data: unknown) => void;
}

type ConfigChangeListener = () => void | Promise<void>;

export class PluginSystem {
  private readonly plugins = new Map<string, RegisteredPlugin>();
  private readonly hooks = new Map<PluginHook, OwnedHook[]>();
  private readonly eventHandlers = new Map<string, OwnedEventHandler[]>();
  private readonly dataStore = new Map<string, unknown>();
  private readonly contributions = new ContributionRegistry();
  private readonly configListeners = new Set<ConfigChangeListener>();
  private readonly context: PluginContext;
  private activatingPluginId: string | null = null;

  constructor(context: Partial<PluginContext> = {}) {
    this.context = {
      engine: context.engine ?? this.createDefaultEngine(),
      data: {
        get: key => this.dataStore.get(key),
        set: (key, value) => { this.dataStore.set(key, value); },
        remove: key => { this.dataStore.delete(key); },
      },
      events: {
        emit: (event, data) => this.emitEvent(event, data),
        on: (event, handler) => this.addEventListener(event, handler),
        off: (event, handler) => this.removeEventListener(event, handler),
      },
      getPlugin: this.getPluginInstance.bind(this),
      getContribution: this.getContribution.bind(this),
      pluginSystem: this,
      ui: context.ui,
    };
  }

  updateContext(context: Partial<PluginContext>): void {
    if (context.engine) this.context.engine = context.engine;
    if (context.ui) this.context.ui = context.ui;
  }

  async register(plugin: Plugin): Promise<void> {
    const id = plugin.metadata.id;
    if (this.plugins.has(id)) throw new Error(`Plugin ${id} is already registered`);
    this.assertDependenciesInstalled(plugin);

    const enabled = plugin.config?.enabled ?? true;
    if (enabled) this.assertNoEnabledConflicts(plugin);

    const registered: RegisteredPlugin = {
      plugin,
      enabled,
      installedAt: new Date().toISOString(),
      health: enabled ? 'ready' : 'disabled',
    };
    this.plugins.set(id, registered);

    if (!enabled) return;
    try {
      await this.activate(registered);
    } catch (error) {
      this.plugins.delete(id);
      throw error;
    }
  }

  async unregister(pluginId: string): Promise<void> {
    const registered = this.plugins.get(pluginId);
    if (!registered) return;
    this.assertNoEnabledDependents(pluginId);
    if (registered.enabled) await this.deactivate(registered);
    this.plugins.delete(pluginId);
    await this.notifyConfigChange();
  }

  async enable(pluginId: string): Promise<void> {
    const registered = this.plugins.get(pluginId);
    if (!registered || registered.enabled) return;
    this.assertDependenciesEnabled(registered.plugin);

    const conflicts = this.findEnabledConflicts(registered.plugin);
    for (const conflict of conflicts) this.assertNoEnabledDependents(conflict.plugin.metadata.id);
    for (const conflict of conflicts) await this.disable(conflict.plugin.metadata.id);

    try {
      await this.activate(registered);
      registered.enabled = true;
      registered.health = 'ready';
      registered.error = undefined;
      await this.notifyConfigChange();
    } catch (error) {
      registered.enabled = false;
      registered.health = 'degraded';
      registered.error = error instanceof Error ? error.message : String(error);
      for (const conflict of conflicts) await this.enable(conflict.plugin.metadata.id);
      throw error;
    }
  }

  async disable(pluginId: string): Promise<void> {
    const registered = this.plugins.get(pluginId);
    if (!registered || !registered.enabled) return;
    this.assertNoEnabledDependents(pluginId);
    try {
      await this.deactivate(registered);
      registered.enabled = false;
      registered.health = 'disabled';
      registered.error = undefined;
    } catch (error) {
      registered.enabled = false;
      registered.health = 'degraded';
      registered.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      await this.notifyConfigChange();
    }
  }

  trigger<T>(hookName: PluginHook, data: T): T {
    let result: unknown = data;
    for (const owned of this.hooks.get(hookName) ?? []) {
      try {
        result = owned.handler(result, this.context);
      } catch (error) {
        this.markDegraded(owned.ownerPluginId, error);
      }
    }
    return result as T;
  }

  async triggerAsync<T>(hookName: PluginHook, data: T): Promise<T> {
    let result: unknown = data;
    for (const owned of this.hooks.get(hookName) ?? []) {
      try {
        result = await owned.handler(result, this.context);
      } catch (error) {
        this.markDegraded(owned.ownerPluginId, error);
      }
    }
    return result as T;
  }

  getContribution<Kind extends keyof PluginContributionMap>(
    kind: Kind,
    key: string,
  ): PluginContributionMap[Kind] | undefined {
    return this.contributions.get(kind, key);
  }

  listContributions<Kind extends keyof PluginContributionMap>(kind: Kind) {
    return this.contributions.list(kind);
  }

  getAllPlugins(): RegisteredPlugin[] {
    return [...this.plugins.values()];
  }

  getEnabledPlugins(): RegisteredPlugin[] {
    return this.getAllPlugins().filter(plugin => plugin.enabled);
  }

  getPlugin(pluginId: string): RegisteredPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  isPluginEnabled(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.enabled ?? false;
  }

  exportConfig(): Record<string, { enabled: boolean; settings: Record<string, unknown> }> {
    const config: Record<string, { enabled: boolean; settings: Record<string, unknown> }> = {};
    for (const [id, registered] of this.plugins) {
      config[id] = {
        enabled: registered.enabled,
        settings: registered.plugin.getSettings?.() ?? {},
      };
    }
    return config;
  }

  async importConfig(config: unknown): Promise<void> {
    if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('插件配置格式无效');
    const entries = Object.entries(config as Record<string, unknown>);
    for (const [pluginId, value] of entries) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const pluginConfig = value as { enabled?: unknown; settings?: unknown };
      const registered = this.plugins.get(pluginId);
      if (!registered) continue;
      if (pluginConfig.settings && typeof pluginConfig.settings === 'object' && !Array.isArray(pluginConfig.settings)) {
        await this.updatePluginSettings(pluginId, pluginConfig.settings as Record<string, unknown>);
      }
      if (pluginConfig.enabled === true && !registered.enabled) await this.enable(pluginId);
      if (pluginConfig.enabled === false && registered.enabled) await this.disable(pluginId);
    }
  }

  async updatePluginSettings(pluginId: string, settings: Record<string, unknown>): Promise<void> {
    const registered = this.plugins.get(pluginId);
    if (!registered) throw new Error(`Plugin ${pluginId} is not registered`);
    registered.plugin.updateSettings?.(settings);
    await this.notifyConfigChange();
  }

  onConfigChange(listener: ConfigChangeListener): () => void {
    this.configListeners.add(listener);
    return () => this.configListeners.delete(listener);
  }

  clearData(): void {
    this.dataStore.clear();
  }

  getDataSnapshot(): Record<string, unknown> {
    return Object.fromEntries(this.dataStore);
  }

  restoreDataSnapshot(snapshot: Record<string, unknown>): void {
    this.dataStore.clear();
    for (const [key, value] of Object.entries(snapshot)) this.dataStore.set(key, value);
  }

  getEventAPI(): PluginContext['events'] {
    return this.context.events;
  }

  private async activate(registered: RegisteredPlugin): Promise<void> {
    const plugin = registered.plugin;
    const id = plugin.metadata.id;
    this.activatingPluginId = id;
    try {
      await plugin.install(this.context);
      for (const [hookName, handler] of Object.entries(plugin.hooks ?? {})) {
        this.registerHook(id, hookName as PluginHook, handler);
      }
      this.contributions.register(id, plugin.getContributions?.());
      registered.health = 'ready';
      registered.error = undefined;
    } catch (error) {
      await this.cleanupFailedActivation(plugin);
      registered.health = 'degraded';
      registered.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      this.activatingPluginId = null;
    }
  }

  private async deactivate(registered: RegisteredPlugin): Promise<void> {
    const id = registered.plugin.metadata.id;
    try {
      await registered.plugin.uninstall?.();
    } finally {
      this.removeOwnedRuntime(id);
    }
  }

  private async cleanupFailedActivation(plugin: Plugin): Promise<void> {
    this.removeOwnedRuntime(plugin.metadata.id);
    try {
      await plugin.uninstall?.();
    } catch (cleanupError) {
      console.error(`Plugin ${plugin.metadata.id} cleanup failed:`, cleanupError);
    }
  }

  private removeOwnedRuntime(pluginId: string): void {
    for (const [hook, handlers] of this.hooks) {
      this.hooks.set(hook, handlers.filter(item => item.ownerPluginId !== pluginId));
    }
    for (const [event, handlers] of this.eventHandlers) {
      this.eventHandlers.set(event, handlers.filter(item => item.ownerPluginId !== pluginId));
    }
    this.contributions.unregisterOwner(pluginId);
  }

  private registerHook(ownerPluginId: string, hookName: PluginHook, handler: PluginHookHandler): void {
    const handlers = this.hooks.get(hookName) ?? [];
    handlers.push({ ownerPluginId, handler });
    this.hooks.set(hookName, handlers);
  }

  private addEventListener<T>(event: string, handler: (data: T) => void): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.push({
      ownerPluginId: this.activatingPluginId ?? 'host',
      originalHandler: handler as (data: never) => void,
      invoke: data => handler(data as T),
    });
    this.eventHandlers.set(event, handlers);
  }

  private removeEventListener<T>(event: string, handler: (data: T) => void): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    this.eventHandlers.set(
      event,
      handlers.filter(item => item.originalHandler !== handler as (data: never) => void),
    );
  }

  private emitEvent(event: string, data: unknown): void {
    for (const owned of this.eventHandlers.get(event) ?? []) {
      try {
        owned.invoke(data);
      } catch (error) {
        if (owned.ownerPluginId !== 'host') this.markDegraded(owned.ownerPluginId, error);
      }
    }
  }

  private getPluginInstance<T = unknown>(pluginId: string): T | null {
    const registered = this.plugins.get(pluginId);
    return registered?.enabled ? registered.plugin as T : null;
  }

  private createDefaultEngine(): PluginContext['engine'] {
    return {
      getNode: () => null,
      getAllNodes: () => [],
      getEdges: () => [],
      getCurrentNodeId: () => null,
      moveTo: () => { throw new Error('引擎尚未注入，无法跳转节点'); },
    };
  }

  private assertDependenciesInstalled(plugin: Plugin): void {
    for (const requiredId of plugin.metadata.requires ?? []) {
      if (!this.plugins.has(requiredId)) {
        throw new Error(`Plugin ${plugin.metadata.id} requires ${requiredId}, but it is not installed`);
      }
    }
  }

  private assertDependenciesEnabled(plugin: Plugin): void {
    for (const requiredId of plugin.metadata.requires ?? []) {
      if (!this.plugins.get(requiredId)?.enabled) {
        throw new Error(`Plugin ${plugin.metadata.id} requires enabled plugin ${requiredId}`);
      }
    }
  }

  private assertNoEnabledDependents(pluginId: string): void {
    const dependents = this.getEnabledPlugins()
      .filter(item => item.plugin.metadata.requires?.includes(pluginId))
      .map(item => item.plugin.metadata.id);
    if (dependents.length > 0) throw new Error(`Plugin ${pluginId} is required by ${dependents.join(', ')}`);
  }

  private assertNoEnabledConflicts(plugin: Plugin): void {
    const conflict = this.findEnabledConflicts(plugin)[0];
    if (conflict) throw new Error(`Plugin ${plugin.metadata.id} conflicts with ${conflict.plugin.metadata.id}`);
  }

  private findEnabledConflicts(plugin: Plugin): RegisteredPlugin[] {
    return this.getEnabledPlugins().filter(other => {
      if (other.plugin.metadata.id === plugin.metadata.id) return false;
      const explicit = plugin.metadata.conflicts?.includes(other.plugin.metadata.id)
        || other.plugin.metadata.conflicts?.includes(plugin.metadata.id);
      const exclusive = ['theme', 'enhance'].includes(plugin.metadata.category)
        && other.plugin.metadata.category === plugin.metadata.category;
      return explicit || exclusive;
    });
  }

  private markDegraded(pluginId: string, error: unknown): void {
    const registered = this.plugins.get(pluginId);
    if (!registered) return;
    registered.health = 'degraded';
    registered.error = error instanceof Error ? error.message : String(error);
    console.error(`Plugin ${pluginId} failed:`, error);
  }

  private async notifyConfigChange(): Promise<void> {
    for (const listener of this.configListeners) await listener();
  }
}
