import { PluginBase } from '../../plugin/PluginBase.ts';
import type { PluginContributions } from '../../plugin/contributions.ts';
import type { PluginMetadata } from '../../plugin/types.ts';

export class ChoiceEmbeddingPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.choice-embedding', name: '选项内嵌', version: '1.0.0', author: '墨水官方',
    description: '支持使用[[选项文本]]在文本中内嵌选项', icon: 'LINK', category: 'tool',
    tags: ['工具', 'choice', 'embedding'],
  };

  getContributions(): PluginContributions {
    return {
      editorTool: {
        'choice-embedding': { id: 'choice-embedding', label: '内嵌选项', run: input => input },
      },
    };
  }
}
