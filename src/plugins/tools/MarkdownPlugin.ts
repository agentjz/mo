import { renderPlayerContent } from '../../application/player/contentRenderer.ts';
import { PluginBase } from '../../plugin/PluginBase.ts';
import type { PluginContributions } from '../../plugin/contributions.ts';
import type { PluginMetadata } from '../../plugin/types.ts';

export class MarkdownPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.markdown', name: 'Markdown渲染', version: '1.0.0', author: '墨水官方',
    description: '支持Markdown语法和自定义标签渲染', icon: 'MD', category: 'tool',
    tags: ['工具', 'content', 'render'],
  };

  getContributions(): PluginContributions {
    return {
      contentRenderer: {
        markdown: {
          order: 10,
          render: input => ({ ...input, html: renderPlayerContent(input.text, input.choices) }),
        },
      },
    };
  }
}
