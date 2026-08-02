/**
 * 插件导出（前端主题 + 内置插件）
 */

// ============= 内置插件（播放器核心功能）=============
import { createBasicModPlugins } from './basicmod/index.js';
import { createToolPlugins, createPlayerToolPlugins } from './tools/index.js';
import { createGameModPlugins } from './gamemods/index.js';

export * from './basicmod/index.js';
export * from './tools/index.js';
export * from './gamemods/index.js';

// ============= 前端专用插件（主题样式）=============
export { ThemePlugin, ThemeManager } from './ThemePlugin';
export { LightThemePlugin } from './LightThemePlugin';
export { DarkThemePlugin } from './DarkThemePlugin';
export { CatppuccinFrappeThemePlugin } from './CatppuccinFrappeThemePlugin';
export { CatppuccinMochaThemePlugin } from './CatppuccinMochaThemePlugin';

import { LightThemePlugin } from './LightThemePlugin';
import { DarkThemePlugin } from './DarkThemePlugin';
import { CatppuccinFrappeThemePlugin } from './CatppuccinFrappeThemePlugin';
import { CatppuccinMochaThemePlugin } from './CatppuccinMochaThemePlugin';

/**
 * 创建前端主题插件实例（编辑器和播放器样式）
 */
export function createFrontendPlugins() {
  return [
    // 编辑器主题插件
    new LightThemePlugin(),
    new DarkThemePlugin(),
    // Catppuccin 主题系列
    new CatppuccinFrappeThemePlugin(),
    new CatppuccinMochaThemePlugin()
  ];
}

/**
 * 创建内置插件实例（编辑器完整功能）
 */
export function createBuiltinPlugins() {
  return [
    ...createBasicModPlugins(),
    ...createToolPlugins(),
    ...createGameModPlugins()
  ];
}

/**
 * 创建播放器专用内置插件实例（仅播放功能，不含编辑器工具）
 */
export function createBuiltinPlayerPlugins() {
  return [
    ...createBasicModPlugins(),
    ...createPlayerToolPlugins(),
    ...createGameModPlugins()
  ];
}
