import type {
  PlayerTemplateManifest,
  PlayerTemplateModule,
  PlayerTemplateRenderContext,
} from '../domain/templates/contracts.ts';
import chatCss from '../styles/chat-style-player.css?raw';
import menuCss from '../styles/game-menu.css?raw';
import startCss from '../styles/start-screen.css?raw';
import visualNovelCss from '../styles/visual-novel-player.css?raw';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function meta(context?: PlayerTemplateRenderContext) {
  return {
    title: escapeHtml(context?.document.meta.title ?? ''),
    author: escapeHtml(context?.document.meta.author ?? ''),
    description: escapeHtml((context?.document.meta.description ?? '').slice(0, 200)),
  };
}

const standaloneCss = `
[hidden]{display:none!important}
button{font-family:inherit}
[data-player-status]{position:absolute;right:18px;top:18px;z-index:300;color:#fff;font-size:13px;text-shadow:0 1px 3px #000}
.mo-standalone-menu-button{width:100%;min-height:44px;margin:4px 0;padding:10px 16px;cursor:pointer}
.mo-standalone-menu-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.mo-standalone-menu-list{display:grid;gap:8px}
.mo-standalone-menu-meta{font-size:13px;opacity:.72;margin-top:4px}
.mo-standalone-menu-item{padding:12px;border:1px solid currentColor;margin-bottom:8px}
.mo-character-layer{position:absolute;inset:0;z-index:150;pointer-events:none}
.mo-character-layer img{position:absolute;bottom:5%;max-width:90vw;max-height:90vh;object-fit:contain}
.mo-character-left{left:5%}.mo-character-center{left:50%;transform:translateX(-50%)}.mo-character-right{right:5%}
.mo-hotspot-fallback{position:absolute;left:16px;bottom:16px;z-index:180;display:flex;gap:8px;flex-wrap:wrap}
.mo-hotspot-fallback button{min-height:44px;padding:8px 14px}
.mo-character-layer{display:flex;align-items:end;justify-content:center;gap:12px;overflow:hidden}
.mo-character-layer [data-character-fallback]{display:grid;align-content:end;width:min(30%,220px);margin:0;text-align:center}
.mo-character-layer [data-character-fallback] img{position:static;width:100%;max-height:34vh;transform:none}
.mo-character-layer [data-character-fallback] figcaption{padding:4px 6px;background:#0009;color:#fff;font-size:12px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;

function visualShell(context?: PlayerTemplateRenderContext): string {
  const value = meta(context);
  return `<div class="mo-baseline-player">
    <section class="start-screen" data-player-start>
      <div class="start-screen-content">
        <h1 class="start-screen-title" data-story-title>${value.title}</h1><div class="start-screen-author">${value.author}</div>
        ${value.description ? `<div class="start-screen-description">${value.description}</div>` : ''}
        <div class="start-screen-buttons"><button data-start-new>开始游戏</button><button data-start-continue hidden>继续游戏</button><button data-start-exit>退出游戏</button></div>
      </div>
    </section>
    <main class="vn-player" data-player-template="builtin.visual-novel" data-player-main hidden>
      <button class="vn-menu-button" data-player-menu aria-label="菜单">&#9776;</button>
      <div class="vn-background" data-scene-media></div><div class="mo-character-layer" data-character-layer></div>
      <div class="vn-dialogue-container"><div class="vn-dialogue-box"><div class="vn-text"><span data-scene-speaker></span><div data-scene-text></div></div></div><nav class="vn-choices" data-scene-choices data-choice-class="vn-choice-link" aria-label="选择"></nav></div>
      <aside data-player-status></aside><div class="mo-hotspot-fallback" data-hotspot-fallback></div>
      <div class="vn-game-over" data-player-ending hidden><div class="vn-game-over-text">游戏结束</div><div class="vn-game-over-hint">点击左上角 ☰ 按钮，选择新游戏或退出</div></div>
      <div class="game-menu-overlay" data-menu-overlay hidden><section class="game-menu-panel" role="dialog" aria-modal="true" aria-label="游戏菜单"><header class="game-menu-header"><h2 data-menu-title>游戏菜单</h2><button class="game-menu-close" data-menu-close aria-label="关闭">×</button></header><div class="game-menu-content" data-menu-content></div></section></div>
    </main>
  </div>`;
}

function chatShell(context?: PlayerTemplateRenderContext): string {
  const value = meta(context);
  return `<main class="chat-player" data-player-template="builtin.chat">
    <div class="chat-phone-container">
      <section class="chat-start-screen" data-player-start><div class="chat-start-content">
        <h1 class="chat-start-title">${value.title}</h1><div class="chat-start-author">${value.author}</div>
        ${value.description ? `<div class="chat-start-description">${value.description}</div>` : ''}
        <div class="chat-start-buttons"><button data-start-new>开始游戏</button><button data-start-continue hidden>继续游戏</button><button data-start-exit>退出游戏</button></div>
      </div></section>
      <div data-player-main hidden style="display:contents">
        <header class="chat-header"><button class="chat-back-button" data-player-back aria-label="返回">‹</button><div class="chat-title" data-story-title>${value.title}</div><button class="chat-menu-button" data-player-menu aria-label="菜单">⋮</button></header>
        <div class="chat-messages-container"><div class="chat-messages" data-message-stream><div data-scene-media hidden></div><div data-scene-speaker hidden></div><div data-scene-text hidden></div></div><div class="chat-game-over" data-player-ending hidden><div class="chat-game-over-text">游戏结束</div><div class="chat-game-over-hint">点击右上角菜单可重新开始</div></div></div>
        <nav class="chat-choices" data-scene-choices data-choice-class="chat-choice-link" aria-label="选择"></nav><aside data-player-status hidden></aside><div data-hotspot-fallback hidden></div>
        <div class="chat-game-menu-overlay" data-menu-overlay hidden><section class="chat-game-menu" role="dialog" aria-modal="true" aria-label="游戏菜单"><header class="chat-game-menu-header"><span class="chat-game-menu-header-spacer"></span><span data-menu-title>游戏菜单</span><button data-menu-close aria-label="关闭">×</button></header><div class="chat-game-menu-content" data-menu-content></div></section></div>
      </div>
    </div>
  </main>`;
}

export function createVisualNovelTemplate(manifest: PlayerTemplateManifest): PlayerTemplateModule {
  return { manifest, render: visualShell, css: `${visualNovelCss}\n${startCss}\n${menuCss}\n${standaloneCss}` };
}

export function createChatTemplate(manifest: PlayerTemplateManifest): PlayerTemplateModule {
  return { manifest, render: chatShell, css: `${chatCss}\n${standaloneCss}\n.chat-choices{display:grid;gap:8px;padding:10px 12px;background:#ededed}.chat-choices button{min-height:44px;border:1px solid #d9d9d9;border-radius:8px;background:#fff;color:#576b95}.chat-game-menu-content .mo-standalone-menu-button{border:1px solid #e5e5e5;border-radius:8px;background:#fff;color:#1a1a1a}.chat-game-menu-content .mo-standalone-menu-item{color:#1a1a1a;border-color:#e5e5e5;border-radius:8px}` };
}
