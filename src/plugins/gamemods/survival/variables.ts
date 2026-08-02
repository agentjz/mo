/**
 * 生存游戏模组 - 变量定义
 * 职责：提供基础生存属性
 */

import type { VariableDefinition } from '../../../types/index.js';

export const SURVIVAL_VARIABLES: VariableDefinition[] = [
  { 
    id: 'health', 
    label: '生命值', 
    type: 'number', 
    defaultValue: 100, 
    source: 'plugin', 
    pluginId: 'gamemod.survival' 
  },
  { 
    id: 'hunger', 
    label: '饥饿度', 
    type: 'number', 
    defaultValue: 100, 
    source: 'plugin', 
    pluginId: 'gamemod.survival' 
  },
  { 
    id: 'thirst', 
    label: '口渴度', 
    type: 'number', 
    defaultValue: 100, 
    source: 'plugin', 
    pluginId: 'gamemod.survival' 
  }
];

export const SURVIVAL_VARIABLE_COUNT = SURVIVAL_VARIABLES.length;

