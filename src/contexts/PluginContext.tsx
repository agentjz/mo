/**
 * 插件系统上下文
 * 职责：为整个应用提供插件系统访问
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PluginSystem } from '../plugin/PluginSystem';
import { createBuiltinPlugins } from '../plugins/index';
import { createFrontendPlugins, ThemeManager } from '../plugins/index';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';

const PLUGIN_CONFIG_KEY = 'plugins.config';

interface PluginContextValue {
  pluginSystem: PluginSystem;
  themeManager: ThemeManager;
}

const PluginContext = createContext<PluginContextValue | null>(null);

export function PluginProvider({ children }: { children: React.ReactNode }) {
  const [pluginSystem] = useState(() => {
    const system = new PluginSystem();
    return system;
  });

  const [themeManager] = useState(() => {
    return new ThemeManager(pluginSystem);
  });

  const [initialized, setInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initPlugins = async () => {
      const builtinPlugins = createBuiltinPlugins();
      const frontendPlugins = createFrontendPlugins();
      const allPlugins = [...builtinPlugins, ...frontendPlugins];
      
      // 顺序注册所有插件
      // 注意：register现在是原子操作，会同时注册plugin实例和actions manifest
      // 先注册插件元数据和贡献，再恢复持久化配置。
      for (const plugin of allPlugins) {
        try {
          if (!pluginSystem.hasPlugin(plugin.metadata.id)) {
            await pluginSystem.register(plugin);
            console.log(`[PluginSystem] Registered: ${plugin.metadata.id}`);
          }
        } catch (error) {
          console.error(`Failed to register plugin ${plugin.metadata.id}:`, error);
        }
      }

      const savedConfig = await workspaceService.getSetting<unknown>(PLUGIN_CONFIG_KEY);
      if (savedConfig) {
        try {
          await pluginSystem.importConfig(savedConfig);
        } catch (error) {
          console.error('Failed to load plugin config:', error);
        }
      }

      // 初始化主题系统
      await themeManager.initialize();

      setInitialized(true);
    };

    if (!initialized) {
      void initPlugins().catch(error => {
        console.error('Failed to initialize plugins:', error);
        setInitializationError(error instanceof Error ? error.message : '插件初始化失败');
      });
    }
  }, [pluginSystem, themeManager, initialized]);

  useEffect(() => {
    if (!initialized) return;

    return pluginSystem.onConfigChange(() => (
      workspaceService.setSetting(PLUGIN_CONFIG_KEY, pluginSystem.exportConfig())
        .catch(error => console.error('Failed to save plugin config:', error))
    ));
  }, [initialized, pluginSystem]);

  if (initializationError) {
    return <div>插件初始化失败：{initializationError}</div>;
  }

  if (!initialized) {
    return <div>Loading plugins...</div>;
  }

  return (
    <PluginContext.Provider value={{ pluginSystem, themeManager }}>
      {children}
    </PluginContext.Provider>
  );
}

export function usePluginSystem(): PluginSystem {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePluginSystem must be used within PluginProvider');
  }
  return context.pluginSystem;
}

export function useThemeManager(): ThemeManager {
  const context = useContext(PluginContext);
  if (!context) throw new Error('useThemeManager must be used within PluginProvider');
  return context.themeManager;
}

