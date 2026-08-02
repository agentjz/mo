/**
 * 基础模组插件导出
 * 职责：统一导出所有基础模组插件
 * 
 * v3.0 Blockly重构说明：
 * - 移除 Action 系统，改用 Blockly
 * - RuntimePlugin 简化为变量存储和模板替换
 * - BlocklyPlugin 提供可视化编程积木块
 */

import { RuntimePlugin } from './RuntimePlugin.js';
import { BlocklyPlugin } from './BlocklyPlugin.js';

export {
  RuntimePlugin,
  BlocklyPlugin
};

export * from './types.js';

/**
 * 创建所有基础模组插件实例
 */
export function createBasicModPlugins() {
  return [
    new RuntimePlugin(),
    new BlocklyPlugin()
  ];
}
