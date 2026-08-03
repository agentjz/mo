import type {
  PlayerTemplateEntry,
  PlayerTemplateManifest,
  PlayerTemplateModule,
} from '../domain/templates/contracts.ts';

const PREVIEW = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M8AAAICAQB7CYVIAAAAAElFTkSuQmCC';

interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  fingerprint: string;
  shell: string;
  accent: string;
  surface: string;
  text: string;
  renderer: 'visual-novel' | 'chat' | 'generic';
}

const definitions: TemplateDefinition[] = [
  { id: 'builtin.visual-novel', name: '沉浸视觉小说', category: '沉浸', fingerprint: 'fullscreen-stage>character-layer>bottom-dialogue>corner-menu', shell: 'stage', accent: '#e0a86e', surface: 'rgba(18,18,24,.86)', text: '#fff', renderer: 'visual-novel' },
  { id: 'builtin.chat', name: '即时聊天', category: '对话', fingerprint: 'phone-shell>message-stream>composer-choices>sheet-menu', shell: 'chat', accent: '#71c48f', surface: '#eff3f6', text: '#1e2930', renderer: 'chat' },
  { id: 'builtin.chapter-book', name: '章节书页', category: '阅读', fingerprint: 'book-cover>chapter-header>page-spread>footnote-choices', shell: 'book', accent: '#a33d32', surface: '#f4efe5', text: '#28231d', renderer: 'generic' },
  { id: 'builtin.minimal-adventure', name: '极简文字冒险', category: '文字', fingerprint: 'terminal-column>command-history>inline-prompt>status-rule', shell: 'terminal', accent: '#69d391', surface: '#101412', text: '#d8e7dc', renderer: 'generic' },
  { id: 'builtin.stage-theatre', name: '舞台剧场', category: '戏剧', fingerprint: 'proscenium>actor-zones>script-ribbon>cue-choices', shell: 'theatre', accent: '#d5ac56', surface: '#24181c', text: '#fff7e4', renderer: 'generic' },
  { id: 'builtin.investigation-file', name: '调查档案', category: '调查', fingerprint: 'case-tabs>evidence-board>report-pane>tool-drawer', shell: 'casefile', accent: '#b03b35', surface: '#d9d6cb', text: '#252525', renderer: 'generic' },
  { id: 'builtin.travel-journal', name: '旅行手账', category: '探索', fingerprint: 'journal-index>place-heading>annotated-image>route-choices', shell: 'journal', accent: '#287b70', surface: '#f1ead9', text: '#30302b', renderer: 'generic' },
  { id: 'builtin.spatial-atlas', name: '空间图鉴', category: '探索', fingerprint: 'atlas-canvas>legend-rail>hotspot-list>location-drawer', shell: 'atlas', accent: '#3e79a8', surface: '#e8edf0', text: '#202a32', renderer: 'generic' },
  { id: 'builtin.storyboard-comic', name: '分镜漫画', category: '图像', fingerprint: 'comic-grid>active-panel>speech-balloon>transition-strip', shell: 'comic', accent: '#e64b35', surface: '#fff', text: '#111', renderer: 'generic' },
  { id: 'builtin.radio-script', name: '广播剧本', category: '声音', fingerprint: 'scene-cue>dialogue-track>narration-track>episode-nav', shell: 'radio', accent: '#de405d', surface: '#161923', text: '#eef0f7', renderer: 'generic' },
  { id: 'builtin.memory-album', name: '记忆相册', category: '图像', fingerprint: 'photo-stage>caption-card>memory-filmstrip>date-index', shell: 'album', accent: '#567d9e', surface: '#e9e6e1', text: '#292927', renderer: 'generic' },
  { id: 'builtin.desktop-dossier', name: '桌面卷宗', category: '高密度', fingerprint: 'workspace-grid>document-pane>status-sidebar>task-menubar', shell: 'dossier', accent: '#c38c32', surface: '#20252a', text: '#edf0f2', renderer: 'generic' },
];

function manifest(definition: TemplateDefinition): PlayerTemplateManifest {
  return {
    id: definition.id,
    name: definition.name,
    version: '1.0.0',
    category: definition.category,
    preview: PREVIEW,
    capabilities: {
      images: 'native',
      characters: definition.renderer === 'visual-novel' ? 'native' : 'fallback',
      hotspots: definition.renderer === 'generic' ? 'fallback' : 'native',
      markdown: 'native',
      menu: 'native',
    },
    settings: [
      { id: 'showHud', label: '显示状态', type: 'boolean', defaultValue: true },
      { id: 'textScale', label: '文字大小', type: 'number', defaultValue: 1, min: 0.8, max: 1.4 },
    ],
    sceneVariants: ['default', 'focused'],
    resources: [],
    fallback: { hotspots: '地点按钮', characters: '带名称插图' },
    structuralFingerprint: definition.fingerprint,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function templateShell(definition: TemplateDefinition, title: string, text: string): string {
  const header = `<header class="mo-template__header"><span data-story-title>${title}</span><button type="button" data-player-menu aria-label="菜单">&#9776;</button></header>`;
  const content = `<article class="mo-template__content"><p data-scene-speaker></p><div data-scene-text>${text}</div></article>`;
  const media = '<div class="mo-template__media" data-scene-media></div>';
  const choices = '<nav class="mo-template__choices" data-scene-choices aria-label="选择"></nav>';
  const status = '<aside class="mo-template__status" data-player-status></aside>';
  switch (definition.shell) {
    case 'book': return `${header}<div class="mo-book-spread"><aside class="mo-book-index">CHAPTER</aside><section class="mo-template__stage">${content}${media}</section></div>${choices}${status}`;
    case 'terminal': return `${header}<section class="mo-template__stage"><div class="mo-terminal-rule">MO://STORY</div>${content}<span class="mo-terminal-prompt">&gt;_</span>${choices}</section>${status}`;
    case 'theatre': return `${header}<section class="mo-template__stage"><div class="mo-theatre-curtain mo-theatre-curtain-left"></div>${media}<div class="mo-theatre-script">${content}${choices}</div><div class="mo-theatre-curtain mo-theatre-curtain-right"></div></section>${status}`;
    case 'casefile': return `${header}<div class="mo-case-tabs"><span>CASE</span><span>CLUES</span><span>REPORT</span></div><section class="mo-template__stage"><aside class="mo-case-board">${media}${status}</aside>${content}</section>${choices}`;
    case 'journal': return `${header}<section class="mo-template__stage"><div class="mo-journal-photo">${media}</div><div class="mo-journal-entry">${content}${choices}</div></section>${status}`;
    case 'atlas': return `${header}<section class="mo-template__stage"><div class="mo-atlas-canvas">${media}</div><aside class="mo-atlas-legend">${content}${status}${choices}</aside></section>`;
    case 'comic': return `${header}<section class="mo-template__stage"><div class="mo-comic-panel mo-comic-panel-small"></div><div class="mo-comic-panel">${media}${content}</div><div class="mo-comic-panel mo-comic-panel-small"></div></section><div class="mo-comic-strip">${choices}${status}</div>`;
    case 'radio': return `${header}<div class="mo-radio-cue">ON AIR <span></span></div><section class="mo-template__stage"><aside class="mo-radio-track">SCENE<br>NARRATION<br>DIALOGUE</aside>${content}</section><footer class="mo-radio-footer">${choices}${status}</footer>`;
    case 'album': return `${header}<section class="mo-template__stage"><figure class="mo-album-photo">${media}<figcaption>${content}</figcaption></figure></section><div class="mo-album-filmstrip">${choices}</div>${status}`;
    case 'dossier': return `${header}<div class="mo-dossier-workspace"><aside class="mo-dossier-sidebar">FILES${status}</aside><section class="mo-template__stage">${content}${choices}</section><aside class="mo-dossier-tools">STATUS${media}</aside></div>`;
    default: return `${header}<section class="mo-template__stage">${media}${content}</section>${choices}${status}`;
  }
}

function layoutCss(shell: string, accent: string): string {
  const layouts: Record<string, string> = {
    book: '.mo-book-spread{display:grid;grid-template-columns:120px minmax(0,760px);margin:auto;box-shadow:0 14px 40px #0003}.mo-book-index{padding:40px 18px;background:#a33d32;color:#fff;writing-mode:vertical-rl}.mo-template--book .mo-template__stage{padding:48px;background:#f4efe5;min-height:480px}.mo-template--book .mo-template__content::first-letter{font-size:3em;float:left;margin-right:8px}',
    terminal: '.mo-template--terminal{max-width:900px;margin:auto;font-family:Consolas,monospace}.mo-template--terminal .mo-template__stage{border-left:2px solid #69d391;padding:24px}.mo-terminal-rule{font-size:12px;color:#69d391;border-bottom:1px dashed #69d391;padding-bottom:10px}.mo-terminal-prompt{display:block;margin-top:22px;color:#69d391}.mo-template--terminal .mo-template__choices{justify-content:flex-start}',
    theatre: '.mo-template--theatre .mo-template__stage{grid-template-columns:90px 1fr 90px;min-height:560px;background:#09090b}.mo-theatre-curtain{background:#711d2a}.mo-theatre-curtain-left{clip-path:polygon(0 0,100% 0,72% 100%,0 100%)}.mo-theatre-curtain-right{clip-path:polygon(0 0,100% 0,100% 100%,28% 100%)}.mo-theatre-script{align-self:end;padding:28px;background:#24181ddd;text-align:center}.mo-template--theatre .mo-template__choices{margin-top:16px}',
    casefile: '.mo-case-tabs{display:flex;gap:4px;max-width:980px;margin:auto}.mo-case-tabs span{padding:8px 18px;background:#a33d32;color:#fff}.mo-template--casefile .mo-template__stage{grid-template-columns:minmax(240px,42%) 1fr;gap:0;background:#eeeade;box-shadow:0 12px 28px #0004}.mo-case-board{min-height:460px;background:#b7b0a0;padding:24px;border-right:1px solid #777}.mo-template--casefile .mo-template__content{padding:40px}',
    journal: '.mo-template--journal .mo-template__stage{grid-template-columns:minmax(260px,45%) 1fr;gap:32px;background:#f1ead9;padding:34px;box-shadow:0 8px 28px #0003}.mo-journal-photo{min-height:380px;background:#d7cfba;border:10px solid #fff;transform:rotate(-1deg)}.mo-journal-entry{border-left:1px solid #9db0a7;padding-left:28px}.mo-template--journal .mo-template__choices{justify-content:flex-start;margin-top:28px}',
    atlas: '.mo-template--atlas .mo-template__stage{grid-template-columns:1fr 320px;max-width:1200px;min-height:600px;border:1px solid #7894a5}.mo-atlas-canvas{background-color:#cbdce4;background-image:linear-gradient(#7894a533 1px,transparent 1px),linear-gradient(90deg,#7894a533 1px,transparent 1px);background-size:28px 28px}.mo-atlas-legend{padding:28px;background:#e8edf0;border-left:4px solid #3e79a8}.mo-template--atlas .mo-template__choices{display:grid;margin-top:26px}',
    comic: '.mo-template--comic .mo-template__stage{grid-template-columns:1fr 2fr 1fr;gap:10px;max-width:1200px}.mo-comic-panel{min-height:520px;border:5px solid #111;background:#fff;padding:22px;transform:rotate(.3deg)}.mo-comic-panel-small{min-height:360px;align-self:center;background:repeating-linear-gradient(45deg,#fff,#fff 8px,#eee 8px,#eee 10px)}.mo-template--comic .mo-template__content{border:3px solid #111;border-radius:48%;padding:30px;background:#fff}.mo-comic-strip{display:flex;align-items:center;justify-content:center;gap:18px}',
    radio: '.mo-template--radio{max-width:1050px;margin:auto}.mo-radio-cue{display:flex;align-items:center;gap:10px;color:#f46980;font-weight:700}.mo-radio-cue span{width:10px;height:10px;border-radius:50%;background:#f0445e}.mo-template--radio .mo-template__stage{grid-template-columns:170px 1fr;border-top:1px solid #586074;border-bottom:1px solid #586074}.mo-radio-track{padding:30px 20px;line-height:2.6;color:#8e98b1;border-right:1px solid #586074}.mo-template--radio .mo-template__content{padding:36px}.mo-radio-footer{display:grid;gap:12px}',
    album: '.mo-template--album .mo-template__stage{max-width:900px}.mo-album-photo{margin:0;padding:22px 22px 60px;background:#fff;color:#292927;box-shadow:0 14px 32px #0004;transform:rotate(-.5deg)}.mo-album-photo .mo-template__media{min-height:360px;background:#c7d1d8}.mo-album-photo figcaption{margin-top:22px}.mo-album-filmstrip{padding:16px;background:#252525;border-block:8px dotted #ddd}.mo-album-filmstrip .mo-template__choices{justify-content:center}',
    dossier: '.mo-template--dossier{padding:0}.mo-template--dossier .mo-template__header{padding:12px 18px;background:#343b42}.mo-dossier-workspace{display:grid;grid-template-columns:190px 1fr 220px;min-height:calc(100vh - 66px)}.mo-dossier-sidebar,.mo-dossier-tools{padding:24px;background:#2b3137;color:#aeb6bd}.mo-template--dossier .mo-template__stage{padding:32px;background:#edf0f2;color:#20252a;align-content:start}.mo-template--dossier .mo-template__choices{display:grid;justify-content:stretch;margin-top:34px}.mo-dossier-tools{border-left:1px solid #49515a}',
  };
  return `${layouts[shell] ?? ''}.mo-template--${shell} .mo-template__header{border-color:${accent}}`;
}

function createModule(definition: TemplateDefinition): PlayerTemplateModule {
  const templateManifest = manifest(definition);
  return {
    manifest: templateManifest,
    render: context => {
      const title = escapeHtml(context?.document.meta.title ?? '');
      const text = escapeHtml(context?.snapshot.scene?.content.text ?? '');
      const sceneId = context?.snapshot.scene?.id ?? '';
      const variant = context?.document.presentation.sceneVariants[sceneId] ?? templateManifest.sceneVariants[0];
      return `<main class="mo-template mo-template--${definition.shell}" data-player-template="${definition.id}" data-scene-variant="${escapeHtml(variant)}">${templateShell(definition, title, text)}</main>`;
    },
    css: `:root{color-scheme:dark}*{box-sizing:border-box}html,body,#root{margin:0;min-height:100%;width:100%}body{background:${definition.surface};color:${definition.text};font-family:system-ui,"Microsoft YaHei",sans-serif}.mo-template{min-height:100vh;display:grid;grid-template-rows:auto 1fr auto;gap:16px;padding:24px}.mo-template[data-scene-variant="focused"] .mo-template__header,.mo-template[data-scene-variant="focused"] .mo-template__status{opacity:.55}.mo-template[data-scene-variant="focused"] .mo-template__content{max-width:680px;margin-inline:auto}.mo-template__header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${definition.accent};padding-bottom:12px}.mo-template__header button{width:40px;height:40px;border:1px solid currentColor;background:transparent;color:inherit}.mo-template__stage{display:grid;align-content:center;max-width:960px;width:100%;margin:auto}.mo-template__media{min-height:120px;background-size:cover;background-position:center;display:flex;align-items:end;justify-content:center;gap:12px;overflow:hidden}.mo-template__media img{display:block;max-width:100%;max-height:52vh;object-fit:contain;margin:auto}.mo-template__media [data-character-fallback]{display:grid;align-content:end;width:min(30%,220px);margin:0;text-align:center}.mo-template__media [data-character-fallback] img{width:100%;max-height:34vh}.mo-template__media [data-character-fallback] figcaption{padding:4px 6px;background:#0009;color:#fff;font-size:12px}.mo-template__content{font-size:calc(1rem * var(--text-scale,1));line-height:1.75;overflow-wrap:anywhere}.mo-template__choices{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.mo-template__choices button{min-height:44px;padding:10px 18px;border:1px solid ${definition.accent};background:transparent;color:inherit}.mo-template__status{font-size:13px}${layoutCss(definition.shell, definition.accent)}@media(max-width:600px){.mo-template{padding:16px}.mo-template__choices{display:grid}.mo-template__choices button{width:100%}.mo-book-spread,.mo-template--theatre .mo-template__stage,.mo-template--casefile .mo-template__stage,.mo-template--journal .mo-template__stage,.mo-template--atlas .mo-template__stage,.mo-template--comic .mo-template__stage,.mo-template--radio .mo-template__stage,.mo-dossier-workspace{grid-template-columns:1fr}.mo-book-index,.mo-theatre-curtain,.mo-comic-panel-small,.mo-radio-track,.mo-dossier-sidebar{display:none}.mo-dossier-tools{border-left:0}.mo-template__stage{min-height:auto!important}.mo-template__content{padding:20px!important}}`,
  };
}

async function loadModule(definition: TemplateDefinition): Promise<PlayerTemplateModule> {
  const templateManifest = manifest(definition);
  if (definition.renderer === 'visual-novel') {
    const { createVisualNovelTemplate } = await import('./baselinePlayerTemplates.ts');
    return createVisualNovelTemplate(templateManifest);
  }
  if (definition.renderer === 'chat') {
    const { createChatTemplate } = await import('./baselinePlayerTemplates.ts');
    return createChatTemplate(templateManifest);
  }
  return createModule(definition);
}

export const builtinTemplateEntries: PlayerTemplateEntry[] = definitions.map(definition => {
  const templateManifest = manifest(definition);
  return {
    manifest: templateManifest,
    source: 'builtin',
    loader: () => loadModule(definition),
  };
});
