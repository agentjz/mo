/**
 * 生存游戏模组插件
 * 职责：提供基础生存属性管理
 */

import { PluginBase } from '../../../plugin/PluginBase.js';
import type { PluginMetadata } from '../../../plugin/types.js';
import type { RuntimeContribution } from '../../../plugin/contributions.ts';
import type { GameModDocs } from '../types.js';
import type { VariableDefinition } from '../../../types/index.js';
import { getSurvivalDocs } from './docs.js';
import { SURVIVAL_VARIABLES } from './variables.js';
import { SURVIVAL_BLOCKS } from './blocks.js';
import { SURVIVAL_GENERATORS } from './generators.js';

export class SurvivalPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'gamemod.survival',
    name: '生存游戏',
    version: '1.0.0',
    author: '墨水官方',
    description: '提供基础生存属性管理（生命/饥饿/口渴）',
    icon: 'SURV',
    category: 'gamemod',
    tags: ['游戏模组', '生存', 'survival'],
    requires: ['basicmod.runtime']
  };

  private runtimePlugin: RuntimeContribution | null = null;

  protected async onInstall(): Promise<void> {
    console.log('[SurvivalPlugin] Installing survival game systems...');
    
    this.runtimePlugin = this.context.getContribution('runtime', 'variables') ?? null;
    
    if (!this.runtimePlugin) {
      throw new Error('[SurvivalPlugin] RuntimePlugin not found!');
    }
    
    this.registerSurvivalFunctions();
    
    console.log('[SurvivalPlugin] Survival systems installed');
  }

  private registerSurvivalFunctions(): void {
    if (!this.runtimePlugin) return;
    
    console.log('[SurvivalPlugin] Registering survival functions...');
    
    this.runtimePlugin.registerFunction('modifyStat', this.modifyStat.bind(this));
    this.runtimePlugin.registerFunction('getStat', this.getStat.bind(this));
    
    console.log('[SurvivalPlugin] Registered 2 functions');
  }

  /**
   * 修改属性值
   */
  private modifyStat(stat: 'health' | 'hunger' | 'thirst', value: number): void {
    if (!this.runtimePlugin) return;
    
    const vars = this.runtimePlugin.variables();
    const current = Number(vars[stat] || 100);
    vars[stat] = Math.max(0, Math.min(100, current + value));
    
    console.log(`[SurvivalPlugin] ${stat}: ${current} -> ${vars[stat]} (${value >= 0 ? '+' : ''}${value})`);
  }

  /**
   * 获取属性值
   */
  private getStat(stat: string): number {
    if (!this.runtimePlugin) return 0;
    return Number(this.runtimePlugin.variables()[stat] || 0);
  }

  hooks = {
    'blockly:register-blocks': (blocks: any[]) => {
      console.log('[SurvivalPlugin] Registering survival blocks...');
      console.log(`[SurvivalPlugin] Providing ${SURVIVAL_BLOCKS.length} blocks`);
      return [...blocks, ...SURVIVAL_BLOCKS];
    },
    
    'blockly:register-generators': (generators: Record<string, any>) => {
      console.log('[SurvivalPlugin] Registering survival code generators...');
      console.log(`[SurvivalPlugin] Providing ${Object.keys(SURVIVAL_GENERATORS).length} generators`);
      return { ...generators, ...SURVIVAL_GENERATORS };
    },
    
    'blockly:register-toolbox-categories': (categories: any[]) => {
      console.log('[SurvivalPlugin] Registering toolbox category...');
      
      const survivalCategory = {
        kind: 'category',
        name: '生存',
        colour: 120,
        contents: [
          { kind: 'block', type: 'survival_modify_stat' },
          { kind: 'block', type: 'survival_get_stat' }
        ]
      };
      
      return [...categories, survivalCategory];
    },
    
    'plugin:get-variables': (variables: VariableDefinition[]) => {
      console.log('[SurvivalPlugin] Providing variables...');
      return [...variables, ...SURVIVAL_VARIABLES];
    },
    
    'plugin:get-docs': (docs: Record<string, GameModDocs>) => {
      console.log('[SurvivalPlugin] Providing docs...');
      return { ...docs, [this.metadata.id]: getSurvivalDocs() };
    }
  };

  static getDocs(): GameModDocs {
    return getSurvivalDocs();
  }
}

