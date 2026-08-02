/**
 * 故事验证插件
 * 职责：检查故事结构的完整性
 */

import { PluginBase } from '../../plugin/PluginBase.js';
import StoryValidator from '../../core/StoryValidator.js';
import type { PluginMetadata } from '../../plugin/types.js';
import type { StoryNode, StoryEdge, ValidationResult } from '../../types/index.js';
import type { PluginContributions } from '../../plugin/contributions.ts';

export class ValidatorPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.validator',
    name: '故事验证器',
    version: '1.0.0',
    author: '墨水官方',
    description: '检测孤立节点、死胡同、未连接选项等结构问题',
    icon: 'CHECK',
    category: 'tool',
    tags: ['工具', 'validate', 'quality']
  };

  getContributions(): PluginContributions {
    return {
      validator: {
        story: { validate: (nodes, edges) => this.validate(nodes, edges) },
      },
    };
  }

  /**
   * 执行验证
   */
  validate(nodes: StoryNode[], edges: StoryEdge[]): ValidationResult {
    const validator = new StoryValidator(nodes, edges);
    return validator.validate();
  }

  protected async onInstall(): Promise<void> {
    console.log('[ValidatorPlugin] Installed');
    
    this.context.events.on('validator:validate', (data: { nodes: StoryNode[], edges: StoryEdge[] }) => {
      const result = this.validate(data.nodes, data.edges);
      this.context.events.emit('validator:result', result);
    });
  }
}

