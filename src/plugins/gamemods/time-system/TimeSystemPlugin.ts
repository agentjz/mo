/**
 * 时间系统插件
 * 职责：提供时间流逝、进位计算、时间显示功能
 * 
 * 设计理念：
 * - 通过 Blockly 积木块可视化操作
 * - 自动处理 分→时→天→月 的进位
 * - 用户只需定义变量：分钟、小时、天、月
 */

import { PluginBase } from '../../../plugin/PluginBase.js';
import type { PluginMetadata } from '../../../plugin/types.js';
import type { PluginContributions } from '../../../plugin/contributions.ts';
import type { RuntimeVariableAccess } from '../../../domain/rules/RuleEngine.ts';
import { getTimeSystemDocs } from './docs.js';
import { TIME_SYSTEM_VARIABLES } from './variables.js';
import { TIME_BLOCKS } from './blocks.js';
import { TIME_GENERATORS } from './generators.js';

function addTime(runtime: RuntimeVariableAccess, ...args: Array<string | number | boolean>): void {
  let minute = Number(runtime.get('minute') || 0) + Number(args[0] ?? 0);
  let hour = Number(runtime.get('hour') || 0);
  let day = Number(runtime.get('day') || 1);
  let month = Number(runtime.get('month') || 1);
  if (minute >= 60) { hour += Math.floor(minute / 60); minute %= 60; }
  if (hour >= 24) { day += Math.floor(hour / 24); hour %= 24; }
  if (day > 30) { month += Math.floor((day - 1) / 30); day = ((day - 1) % 30) + 1; }
  runtime.set('minute', minute);
  runtime.set('hour', hour);
  runtime.set('day', day);
  runtime.set('month', month);
}

function formatTime(runtime: RuntimeVariableAccess): string {
  const month = runtime.get('month') || 1;
  const day = runtime.get('day') || 1;
  const hour = runtime.get('hour') || 0;
  const minute = runtime.get('minute') || 0;
  return `第${month}月 第${day}天 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export class TimeSystemPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'gamemod.time-system',
    name: '时间',
    version: '1.0.0',
    author: '墨水官方',
    description: '提供时间流逝和显示功能，自动处理进位规则',
    icon: 'TIME',
    category: 'gamemod',
    tags: ['游戏模组', '时间', 'time', 'calendar'],
    requires: ['basicmod.runtime']
  };

  protected async onInstall(): Promise<void> {
    console.log('[TimeSystemPlugin] Time system installed');
  }

  getContributions(): PluginContributions {
    return {
      rulePack: {
        time: {
          variables: TIME_SYSTEM_VARIABLES,
          functions: {
            addTime,
            formatTime,
          },
          blockly: {
            blocks: TIME_BLOCKS,
            generators: TIME_GENERATORS,
            toolbox: [{
              kind: 'category', name: '时间', colour: 45,
              contents: [{ kind: 'block', type: 'time_add' }, { kind: 'block', type: 'time_format' }],
            }],
          },
          docs: { [this.metadata.id]: getTimeSystemDocs() },
        },
      },
    };
  }
}

