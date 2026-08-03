import { validateStoryDocument } from '../../domain/story/validation.ts';
import { PluginBase } from '../../plugin/PluginBase.ts';
import type { PluginContributions } from '../../plugin/contributions.ts';
import type { PluginMetadata } from '../../plugin/types.ts';

export class ValidatorPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.validator', name: '故事验证器', version: '1.0.0', author: '墨水官方',
    description: '检测孤立节点、死胡同、未连接选项等结构问题', icon: 'CHECK', category: 'tool',
    tags: ['工具', 'validate', 'quality'],
  };

  getContributions(): PluginContributions {
    return { validator: { story: { validate: validateStoryDocument } } };
  }
}
