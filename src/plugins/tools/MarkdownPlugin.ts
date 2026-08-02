/**
 * Markdown渲染插件
 * 职责：将Markdown文本转换为HTML
 */

import { PluginBase } from '../../plugin/PluginBase.js';
import type { PluginMetadata, PluginHook, PluginHookHandler } from '../../plugin/types.js';
import { marked } from 'marked';

export class MarkdownPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.markdown',
    name: 'Markdown渲染',
    version: '1.0.0',
    author: '墨水官方',
    description: '支持Markdown语法和自定义标签渲染',
    icon: 'MD',
    category: 'tool',
    tags: ['工具', 'content', 'render']
  };

  hooks: Partial<Record<PluginHook, PluginHookHandler>> = {
    'content:render': (data, _context) => {
      const { text, story } = data;
      const rendered = this.renderMarkdown(text, story);
      return { ...data, renderedHTML: rendered };
    }
  };

  /**
   * 渲染Markdown为HTML
   */
  private renderMarkdown(text: string, _story?: any): string {
    let processed = text;
    
    // 自定义标签处理（先处理自定义标签，避免被Markdown转义）
    processed = processed.replace(/\[color=([^\]]+)\](.+?)\[\/color\]/gs, '<span style="color:$1">$2</span>');
    processed = processed.replace(/\[big\](.+?)\[\/big\]/gs, '<span style="font-size:1.3em;font-weight:bold">$1</span>');
    processed = processed.replace(/\[small\](.+?)\[\/small\]/gs, '<span style="font-size:0.85em;opacity:0.8">$1</span>');
    processed = processed.replace(/\[bg=([^\]]+)\](.+?)\[\/bg\]/gs, '<span style="background-color:$1;padding:2px 4px;border-radius:2px">$2</span>');
    processed = processed.replace(/\[center\](.+?)\[\/center\]/gs, '<div style="text-align:center">$1</div>');
    processed = processed.replace(/\[right\](.+?)\[\/right\]/gs, '<div style="text-align:right">$1</div>');
    processed = processed.replace(/\[glow\](.+?)\[\/glow\]/gs, '<span style="color:#5bc0de;text-shadow:0 0 10px rgba(91,192,222,0.8)">$1</span>');
    
    // 使用marked处理标准Markdown
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    let html = marked.parse(processed) as string;
    
    html = html.replace(/<p>/g, '').replace(/<\/p>/g, '');
    
    return html;
  }

  protected async onInstall(): Promise<void> {
    console.log('[MarkdownPlugin] Installed');
  }
}

