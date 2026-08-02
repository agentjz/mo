/**
 * 时间系统游戏模组 - 变量定义
 * 单一数据源：所有时间系统变量的定义
 */

import type { VariableDefinition } from '../../../types/index.js';

export const TIME_SYSTEM_VARIABLES: VariableDefinition[] = [
  { id: 'minute', label: '分钟', type: 'number', defaultValue: 0, source: 'plugin', pluginId: 'gamemod.time-system' },
  { id: 'hour', label: '小时', type: 'number', defaultValue: 0, source: 'plugin', pluginId: 'gamemod.time-system' },
  { id: 'day', label: '天', type: 'number', defaultValue: 1, source: 'plugin', pluginId: 'gamemod.time-system' },
  { id: 'month', label: '月', type: 'number', defaultValue: 1, source: 'plugin', pluginId: 'gamemod.time-system' }
];

export const TIME_SYSTEM_VARIABLE_COUNT = TIME_SYSTEM_VARIABLES.length;

