/**
 * 选项内嵌插件
 * 职责：支持在文本中使用[[选项文本]]内嵌选项，渲染为可点击超链接
 */

import { PluginBase } from '../../plugin/PluginBase.js';
import type { PluginMetadata, PluginHook, PluginHookHandler } from '../../plugin/types.js';
import type { PluginContributions } from '../../plugin/contributions.ts';

interface ChoiceMapping {
  placeholder: string;
  choiceId: string;
  choiceText: string;
}

export class ChoiceEmbeddingPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'tool.choice-embedding',
    name: '选项内嵌',
    version: '1.0.0',
    author: '墨水官方',
    description: '支持使用[[选项文本]]在文本中内嵌选项',
    icon: 'LINK',
    category: 'tool',
    tags: ['工具', 'choice', 'embedding']
  };

  private currentMappings: Map<string, ChoiceMapping[]> = new Map();

  getContributions(): PluginContributions {
    return {
      choiceEmbedding: {
        story: { getEmbeddedChoiceIds: nodeId => this.getEmbeddedChoiceIds(nodeId) },
      },
    };
  }

  hooks: Partial<Record<PluginHook, PluginHookHandler>> = {
    'content:render': this.handleContentRender.bind(this)
  };

  protected async onInstall(): Promise<void> {
    console.log('[ChoiceEmbeddingPlugin] Installed');
  }

  /**
   * 在Markdown渲染后，直接在HTML中查找[[]]并替换为超链接
   * 注意：只处理当前可用的选项（已通过条件过滤）
   */
  private handleContentRender(data: any, _context: any): any {
    const { renderedHTML, nodeId, availableChoices } = data;
    
    if (!renderedHTML) return data;

    const node = this.context.engine.getNode(nodeId);
    if (!node) return data;

    // 使用已过滤的可用选项，而不是原始choices
    // 这样可以确保只有满足条件的选项才会被渲染为链接
    const choices = availableChoices || node.data.choices;
    const embeddedIds: string[] = [];
    
    // 匹配HTML中的[[...]]语法
    const pattern = /\[\[([^\]]+)\]\]/g;
    
    let processed = renderedHTML.replace(pattern, (_match: string, content: string) => {
      const trimmed = content.trim();
      
      // 尝试按文本匹配
      let matchedChoice = choices.find((c: any) => c.text === trimmed);
      
      // 如果文本匹配失败，尝试按索引匹配（数字）
      if (!matchedChoice && /^\d+$/.test(trimmed)) {
        const index = parseInt(trimmed) - 1; // 用户输入从1开始
        if (index >= 0 && index < choices.length) {
          matchedChoice = choices[index];
        }
      }

      if (matchedChoice) {
        embeddedIds.push(matchedChoice.id);
        const linkHtml = `<a class="choice-embed-link" data-choice-id="${matchedChoice.id}" style="color:#5bc0de;cursor:pointer;text-decoration:none;transition:all 0.2s;">${matchedChoice.text}</a>`;
        return linkHtml;
      }

      // 如果没找到匹配的choice（可能因为条件不满足被过滤了），完全隐藏
      return '';
    });

    // 保存已内嵌的选项ID
    this.currentMappings.set(nodeId, embeddedIds.map((id) => ({
      placeholder: '', // 不再需要
      choiceId: id,
      choiceText: choices.find((c: any) => c.id === id)?.text || ''
    })));

    return { ...data, renderedHTML: processed };
  }

  /**
   * 获取节点中哪些选项被内嵌引用了
   */
  public getEmbeddedChoiceIds(nodeId: string): string[] {
    const mappings = this.currentMappings.get(nodeId);
    if (!mappings) return [];
    return mappings.map(m => m.choiceId);
  }

  /**
   * 清理节点的映射数据
   */
  public clearNodeMappings(nodeId: string): void {
    this.currentMappings.delete(nodeId);
  }
}

