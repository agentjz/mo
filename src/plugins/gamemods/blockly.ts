/**
 * 游戏模组 - Blockly 积木块和代码生成器统一导出
 * 职责：汇总所有游戏模组的 Blockly 扩展，供播放器使用
 */

import { TIME_BLOCKS } from './time-system/blocks.js';
import { TIME_GENERATORS } from './time-system/generators.js';
import { SURVIVAL_BLOCKS } from './survival/blocks.js';
import { SURVIVAL_GENERATORS } from './survival/generators.js';

/**
 * 所有游戏模组的积木块定义
 */
export const ALL_GAMEMOD_BLOCKS = [
  ...TIME_BLOCKS,
  ...SURVIVAL_BLOCKS
];

/**
 * 所有游戏模组的代码生成器
 */
export const ALL_GAMEMOD_GENERATORS = {
  ...TIME_GENERATORS,
  ...SURVIVAL_GENERATORS
};

