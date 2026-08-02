/**
 * 浅青色主题插件（默认主题）
 * 职责：提供当前的浅青色渐变设计
 */

import { ThemePlugin, type ThemeDefinition } from './ThemePlugin';
import type { PluginMetadata } from '../plugin/types';

export class LightThemePlugin extends ThemePlugin {
  metadata: PluginMetadata = {
    id: 'theme.light',
    name: '日间模式',
    version: '1.0.0',
    description: '明亮清晰的日间主题',
    author: '墨水官方',
    category: 'theme',
    tags: ['浅色', '日间', '默认'],
    conflicts: ['theme.dark']
  };

  getThemeDefinition(): ThemeDefinition {
    return {
      id: 'light',
      name: '日间模式',
      description: '明亮清晰的日间主题',
      isDark: false,
      colors: {
        // 背景色
        backgroundPrimary: '#ffffff',
        backgroundSecondary: '#f9fafb',
        backgroundGradient: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
        
        // 文字颜色
        textPrimary: '#404040',
        textSecondary: '#737373',
        textMuted: '#a3a3a3',
        
        // 品牌色
        brandPrimary: '#FF6D5A',
        brandSecondary: '#E85A48',
        brandGradient: 'linear-gradient(135deg, #FF6D5A 0%, #FF9472 100%)',
        
        // 功能色
        success: '#16a34a',
        warning: '#ea580c',
        danger: '#dc2626',
        info: '#2563eb',
        
        // 边框和分割线
        border: 'rgba(212, 212, 212, 0.5)',
        borderLight: 'rgba(229, 229, 229, 0.5)',
        borderFocus: '#FF6D5A',
        
        // 交互状态
        hover: 'rgba(255, 109, 90, 0.08)',
        active: 'rgba(255, 109, 90, 0.12)',
        selected: 'rgba(255, 109, 90, 0.15)',
        
        // 阴影
        shadow: 'rgba(0, 0, 0, 0.08)',
        shadowLight: 'rgba(0, 0, 0, 0.04)',
        shadowHeavy: 'rgba(0, 0, 0, 0.15)'
      },
    };
  }
}
