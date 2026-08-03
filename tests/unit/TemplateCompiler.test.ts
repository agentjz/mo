import { describe, expect, it } from 'vitest';
import { TemplateCompiler } from '../../src/application/templates/TemplateCompiler.ts';
import { builtinTemplateEntries } from '../../src/templates/catalog.ts';
import { canonicalStory } from '../fixtures/canonicalStory.ts';

describe('TemplateCompiler', () => {
  it('生成只含当前模板、当前故事且零网络依赖的独立 HTML', async () => {
    const compiler = new TemplateCompiler();
    const template = await builtinTemplateEntries[0].loader();
    const html = await compiler.compile({ document: canonicalStory(), template, assets: new Map() });
    expect(html).toContain(canonicalStory().meta.title);
    expect(html).toContain(template.manifest.id);
    expect(html).not.toMatch(/(?:src|href)=["']https?:\/\//i);
    for (const other of builtinTemplateEntries.slice(1)) expect(html).not.toContain(other.manifest.id);
  });

  it('模板 01 和 02 编译各自基线 shell、开始页与完整菜单入口', async () => {
    const compiler = new TemplateCompiler();
    const story = canonicalStory();
    const visual = await compiler.compile({ document: story, template: await builtinTemplateEntries[0].loader(), assets: new Map() });
    expect(visual).toContain('class="start-screen"');
    expect(visual).toContain('class="vn-player"');
    expect(visual).toContain('class="game-menu-panel"');
    expect(visual).toContain('世界地图');
    expect(visual).toContain('背包');

    story.presentation.templateId = 'builtin.chat';
    const chat = await compiler.compile({ document: story, template: await builtinTemplateEntries[1].loader(), assets: new Map() });
    expect(chat).toContain('class="chat-player"');
    expect(chat).toContain('class="chat-phone-container"');
    expect(chat).toContain('class="chat-game-menu"');
    expect(chat).toContain('data-message-stream');
    expect(chat).not.toContain('class="vn-player"');
  });

  it('为未自带 chrome 的模板补入开始页和完整菜单', async () => {
    const compiler = new TemplateCompiler();
    const story = canonicalStory();
    story.presentation.templateId = 'builtin.chapter-book';
    const html = await compiler.compile({ document: story, template: await builtinTemplateEntries[2].loader(), assets: new Map() });
    expect(html).toContain('data-player-start');
    expect(html).toContain('data-player-main');
    expect(html).toContain('data-menu-overlay');
    expect(html).toContain('data-menu-content');
  });
});
