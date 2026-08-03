/**
 * 生存游戏模组 - 变量定义
 * 职责：提供基础生存属性
 */

import type { VariableDefinition } from '../../../domain/story/document.ts';

export const SURVIVAL_VARIABLES: VariableDefinition[] = [
  { 
    id: 'health', 
    label: '生命值', 
    type: 'number', 
    defaultValue: 100, 
    source: 'plugin', 
    pluginId: 'gamemod.survival',
    displayInPlayer: true,
    displayOrder: 20,
  },
  { 
    id: 'hunger', 
    label: '饥饿度', 
    type: 'number', 
    defaultValue: 100, 
    source: 'plugin', 
    pluginId: 'gamemod.survival',
    displayInPlayer: true,
    displayOrder: 21,
  },
  { 
    id: 'thirst', 
    label: '口渴度', 
    type: 'number', 
    defaultValue: 100, 
    source: 'plugin', 
    pluginId: 'gamemod.survival',
    displayInPlayer: true,
    displayOrder: 22,
  }
];

export const SURVIVAL_VARIABLE_COUNT = SURVIVAL_VARIABLES.length;

