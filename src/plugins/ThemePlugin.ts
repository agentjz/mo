/**
 * 主题插件基类（前端专用）
 * 职责：提供主题样式定义和切换功能
 */

import { PluginBase } from '../plugin/PluginBase.js';
import type { PluginContributions } from '../plugin/contributions.ts';
import type { PluginSystem } from '../plugin/PluginSystem.ts';

export interface ThemeColors {
  // 背景色
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundGradient: string;
  
  // 文字颜色
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // 品牌色
  brandPrimary: string;
  brandSecondary: string;
  brandGradient: string;
  
  // 功能色
  success: string;
  warning: string;
  danger: string;
  info: string;
  
  // 边框和分割线
  border: string;
  borderLight: string;
  borderFocus: string;
  
  // 交互状态
  hover: string;
  active: string;
  selected: string;
  
  // 阴影
  shadow: string;
  shadowLight: string;
  shadowHeavy: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  colors: ThemeColors;
  customCSS?: string; // 额外的自定义CSS
}

export abstract class ThemePlugin extends PluginBase {
  abstract getThemeDefinition(): ThemeDefinition;

  getContributions(): PluginContributions {
    return {
      editorTheme: {
        [this.metadata.id]: {
          id: this.metadata.id,
          definition: () => this.getThemeDefinition(),
        },
      },
    };
  }
  
  protected async onInstall(): Promise<void> {
    await super.onInstall();
    // 只在浏览器环境中应用主题
    if (typeof document !== 'undefined') {
      this.applyTheme();
    }
  }
  
  protected async onUninstall(): Promise<void> {
    await super.onUninstall();
    // 只在浏览器环境中移除主题
    if (typeof document !== 'undefined') {
      this.removeTheme();
    }
  }
  
  protected applyTheme(): void {
    const theme = this.getThemeDefinition();
    const root = document.documentElement;
    
    // 清理所有可能残留的主题style标签（确保只有当前主题生效）
    this.cleanupAllThemeStyles();
    
    // 应用CSS变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${this.kebabCase(key)}`, value);
    });
    
    // 设置暗色模式标识
    if (theme.isDark) {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
    
    // 应用自定义CSS（如果有）
    if (theme.customCSS && theme.customCSS.trim()) {
      this.injectCustomCSS(theme.customCSS);
    }
    
    // 触发主题切换事件
    this.emit('theme:changed', { theme });
  }
  
  protected removeTheme(): void {
    const theme = this.getThemeDefinition();
    
    // 移除CSS变量
    const root = document.documentElement;
    Object.keys(theme.colors).forEach(key => {
      root.style.removeProperty(`--theme-${this.kebabCase(key)}`);
    });
    
    // 移除自定义CSS
    this.removeCustomCSS();
    
    // 移除主题类名
    document.body.classList.remove('theme-dark', 'theme-light');
  }
  
  private injectCustomCSS(css: string): void {
    const styleId = `theme-${this.metadata.id}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
  }
  
  private removeCustomCSS(): void {
    const styleId = `theme-${this.metadata.id}`;
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
  }
  
  private cleanupAllThemeStyles(): void {
    // 清理所有主题相关的style标签，确保没有残留
    const allStyles = document.querySelectorAll('style[id^="theme-theme."]');
    allStyles.forEach(style => {
      // 保留当前主题的style标签
      if (style.id !== `theme-${this.metadata.id}`) {
        style.remove();
      }
    });
  }
  
  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

/**
 * 主题管理器（前端专用）
 * 职责：管理主题切换和主题插件
 */
export class ThemeManager {
  private currentTheme: string | null = null;
  constructor(private readonly pluginSystem: PluginSystem) {}
  
  /**
   * 切换到指定主题
   */
  async switchTheme(themeId: string): Promise<void> {
    // 启用新主题（系统会自动禁用其他主题）
    const newPlugin = this.pluginSystem.getPlugin(themeId);
    if (newPlugin && !newPlugin.enabled) {
      await this.pluginSystem.enable(themeId);
    }
    
    this.currentTheme = themeId;
  }
  
  /**
   * 获取所有可用主题
   */
  getAvailableThemes(): Array<{ id: string; theme: ThemeDefinition }> {
    return this.pluginSystem.getAllPlugins().flatMap(registered => {
      if (registered.plugin.metadata.category !== 'theme') return [];
      const id = registered.plugin.metadata.id;
      const contribution = registered.plugin.getContributions?.().editorTheme?.[id];
      if (!contribution) return [];
      return [{ id, theme: contribution.definition() as ThemeDefinition }];
    });
  }
  
  /**
   * 获取当前激活的主题
   */
  getCurrentTheme(): string | null {
    return this.pluginSystem.getEnabledPlugins()
      .find(registered => registered.plugin.metadata.category === 'theme')
      ?.plugin.metadata.id ?? this.currentTheme;
  }
  
  /**
   * 初始化主题系统
   */
  async initialize(): Promise<void> {
    const enabledTheme = this.pluginSystem.getEnabledPlugins()
      .find(registered => registered.plugin.metadata.category === 'theme');
    if (enabledTheme) {
      this.currentTheme = enabledTheme.plugin.metadata.id;
      return;
    }
    
    // 如果没有保存的主题，默认使用日间模式主题
    const lightTheme = this.pluginSystem.getPlugin('theme.light');
    if (lightTheme) {
      await this.switchTheme('theme.light');
      return;
    }
    
    // 如果日间模式不可用，使用第一个可用主题
    const availableThemes = this.getAvailableThemes();
    if (availableThemes.length > 0) {
      await this.switchTheme(availableThemes[0].id);
    }
  }
}
