import type { StoryDocument } from '../../domain/story/document.ts';
import type { PlayerTemplateModule } from '../../domain/templates/contracts.ts';
import { createRuleRuntime } from '../../domain/rules/RuleEngine.ts';
import type { RulePackContribution } from '../../plugin/contributions.ts';
import { PlayerKernel } from '../player/PlayerKernel.ts';
import { createPlayerStateMachine } from '../player/playerStateMachine.ts';
import { renderPlayerContent } from '../player/contentRenderer.ts';
import { STANDALONE_RUNTIME } from './standaloneRuntime.ts';
import menuCss from '../../styles/game-menu.css?raw';
import startCss from '../../styles/start-screen.css?raw';

export interface TemplateCompileInput {
  document: StoryDocument;
  template: PlayerTemplateModule;
  assets: Map<string, Blob | string>;
  rulePacks?: RulePackContribution[];
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function standaloneChrome(shell: string, document: StoryDocument): { shell: string; css: string } {
  const hasStart = shell.includes('data-player-start');
  const hasMenu = shell.includes('data-menu-overlay');
  let result = shell;
  if (!hasMenu) {
    result += `<div class="game-menu-overlay" data-menu-overlay hidden><section class="game-menu-panel" role="dialog" aria-modal="true" aria-label="游戏菜单"><header class="game-menu-header"><h2 data-menu-title>游戏菜单</h2><button class="game-menu-close" data-menu-close aria-label="关闭">×</button></header><div class="game-menu-content" data-menu-content></div></section></div>`;
  }
  if (!hasStart) {
    const description = document.meta.description
      ? `<div class="start-screen-description">${escapeHtml(document.meta.description.slice(0, 200))}</div>`
      : '';
    result = `<section class="start-screen" data-player-start><div class="start-screen-content"><h1 class="start-screen-title">${escapeHtml(document.meta.title)}</h1><div class="start-screen-author">${escapeHtml(document.meta.author)}</div>${description}<div class="start-screen-buttons"><button data-start-new>开始游戏</button><button data-start-continue hidden>继续游戏</button><button data-start-exit>退出游戏</button></div></div></section><div data-player-main hidden>${result}</div>`;
  }
  return { shell: result, css: hasStart && hasMenu ? '' : `[hidden]{display:none!important}\n${startCss}\n${menuCss}` };
}

export class TemplateCompiler {
  async compile(input: TemplateCompileInput): Promise<string> {
    const kernel = new PlayerKernel(input.document);
    const snapshot = kernel.dispatch({ type: 'start' });
    const shell = input.template.render({
      document: input.document,
      snapshot,
      settings: input.document.presentation.settings,
    });
    const chrome = standaloneChrome(shell, input.document);
    const assets = await this.inlineAssets(input.assets);
    const renderedScenes = Object.fromEntries(input.document.scenes.map(scene => [
      scene.id,
      renderPlayerContent(scene.content.text, scene.choices),
    ]));
    const runtimeFunctions = this.runtimeFunctions(input.document, input.rulePacks ?? []);
    const payload = safeJson({ document: input.document, assets, renderedScenes, runtimeFunctions });
    const css = `${input.template.css}\n${chrome.css}`.replace(/<\/style/gi, '<\\/style');
    const coreSource = `const createRuleRuntime=${this.functionSource(createRuleRuntime)};const createPlayerStateMachine=${this.functionSource(createPlayerStateMachine)};`;
    return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${this.escape(input.document.meta.title)}</title><style>${css}</style></head>
<body><div id="root">${chrome.shell}</div><script type="application/json" id="mo-story">${payload}</script><script>${coreSource}${STANDALONE_RUNTIME}
</script></body></html>`;
  }

  private async inlineAssets(assets: Map<string, Blob | string>): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const [id, value] of assets) result[id] = typeof value === 'string' ? value : await this.blobToDataUrl(value);
    return result;
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('资源读取失败'));
      reader.readAsDataURL(blob);
    });
  }

  private escape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private runtimeFunctions(document: StoryDocument, packs: RulePackContribution[]): Record<string, string> {
    const required = new Set<string>();
    for (const rule of document.rules) {
      if (rule.condition?.type === 'function') required.add(rule.condition.functionId);
      for (const action of rule.actions) if (action.type === 'call-function') required.add(action.functionId);
    }
    const result: Record<string, string> = {};
    for (const pack of packs) {
      for (const [id, fn] of Object.entries(pack.functions)) {
        if (!required.has(id)) continue;
        if (result[id]) throw new Error(`独立播放器运行函数重复: ${id}`);
        result[id] = this.functionSource(fn);
      }
    }
    return result;
  }

  private functionSource(fn: unknown): string {
    if (typeof fn !== 'function') throw new Error('独立播放器运行贡献不是函数');
    const source = Function.prototype.toString.call(fn);
    if (source.includes('[native code]')) throw new Error('独立播放器无法内联原生运行函数');
    return source.replace(/<\/script/gi, '<\\/script');
  }
}
