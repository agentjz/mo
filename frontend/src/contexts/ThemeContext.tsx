/**
 * 主题系统上下文
 * 职责：为整个应用提供主题管理功能
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeManager } from '../plugins/index';
import { usePluginSystem } from './PluginContext';

interface ThemeContextType {
  themeManager: ThemeManager | null;
  currentTheme: string | null;
  availableThemes: Array<{ id: string; theme: any }>;
  switchTheme: (themeId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pluginSystem = usePluginSystem();
  const [themeManager, setThemeManager] = useState<ThemeManager | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [availableThemes, setAvailableThemes] = useState<Array<{ id: string; theme: any }>>([]);

  useEffect(() => {
    if (pluginSystem) {
      const manager = new ThemeManager(pluginSystem);
      setThemeManager(manager);
      
      // 初始化主题系统
      manager.initialize().then(() => {
        setCurrentTheme(manager.getCurrentTheme());
        setAvailableThemes(manager.getAvailableThemes());
      });
    }
  }, [pluginSystem]);

  const switchTheme = async (themeId: string) => {
    if (themeManager) {
      await themeManager.switchTheme(themeId);
      setCurrentTheme(themeManager.getCurrentTheme());
    }
  };

  const value: ThemeContextType = {
    themeManager,
    currentTheme,
    availableThemes,
    switchTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
