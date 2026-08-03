/**
 * 生存游戏模组插件
 * 职责：提供基础生存属性管理
 */

import { PluginBase } from '../../../plugin/PluginBase.js';
import type { PluginMetadata } from '../../../plugin/types.js';
import type { PluginContributions } from '../../../plugin/contributions.ts';
import type { RuntimeVariableAccess } from '../../../domain/rules/RuleEngine.ts';
import { getSurvivalDocs } from './docs.js';
import { SURVIVAL_VARIABLES } from './variables.js';
import { SURVIVAL_BLOCKS } from './blocks.js';
import { SURVIVAL_GENERATORS } from './generators.js';

function modifyStat(runtime: RuntimeVariableAccess, ...args: Array<string | number | boolean>): void {
  const stat = String(args[0] ?? '');
  const current = Number(runtime.get(stat) || 100);
  runtime.set(stat, Math.max(0, Math.min(100, current + Number(args[1] ?? 0))));
}

function getStat(runtime: RuntimeVariableAccess, ...args: Array<string | number | boolean>): number {
  return Number(runtime.get(String(args[0] ?? '')) || 0);
}

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

  protected async onInstall(): Promise<void> {
    console.log('[SurvivalPlugin] Survival systems installed');
  }

  getContributions(): PluginContributions {
    return {
      rulePack: {
        survival: {
          variables: SURVIVAL_VARIABLES,
          functions: {
            modifyStat,
            getStat,
          },
          blockly: {
            blocks: SURVIVAL_BLOCKS,
            generators: SURVIVAL_GENERATORS,
            toolbox: [{
              kind: 'category', name: '生存', colour: 120,
              contents: [{ kind: 'block', type: 'survival_modify_stat' }, { kind: 'block', type: 'survival_get_stat' }],
            }],
          },
          docs: { [this.metadata.id]: getSurvivalDocs() },
        },
      },
    };
  }
}

