/**
 * 游戏模组插件导出
 * 职责：统一导出所有游戏模组插件
 */

export * from './types.js';
export { TimeSystemPlugin } from './time-system/index.js';
export { SurvivalPlugin } from './survival/index.js';

import { TimeSystemPlugin } from './time-system/index.js';
import { SurvivalPlugin } from './survival/index.js';

/**
 * 创建所有游戏模组插件实例
 */
export function createGameModPlugins() {
  return [
    new TimeSystemPlugin(),
    new SurvivalPlugin()
  ];
}
