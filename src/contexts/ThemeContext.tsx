/**
 * 主题系统上下文
 * 职责：为整个应用提供主题管理功能
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeManager } from '../plugins/index';
import { usePluginSystem, useThemeManager } from './PluginContext';

interface ThemeContextType {
  themeManager: ThemeManager | null;
  currentTheme: string | null;
  availableThemes: Array<{ id: string; theme: ReturnType<ThemeManager['getAvailableThemes']>[number]['theme'] }>;
  switchTheme: (themeId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pluginSystem = usePluginSystem();
  const themeManager = useThemeManager();
  const [currentTheme, setCurrentTheme] = useState<string | null>(() => themeManager.getCurrentTheme());
  const [availableThemes, setAvailableThemes] = useState(() => themeManager.getAvailableThemes());

  const refresh = useCallback(() => {
    setCurrentTheme(themeManager.getCurrentTheme());
    setAvailableThemes(themeManager.getAvailableThemes());
  }, [themeManager]);

  useEffect(() => {
    refresh();
    return pluginSystem.onConfigChange(refresh);
  }, [pluginSystem, refresh]);

  const switchTheme = async (themeId: string) => {
    await themeManager.switchTheme(themeId);
    refresh();
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
