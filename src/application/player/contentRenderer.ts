import { marked } from 'marked';

export interface RenderableChoice {
  id: string;
  text: string;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderPlayerContent(text: string, choices: RenderableChoice[]): string {
  let processed = text
    .replace(/\[color=([^\]]+)\](.+?)\[\/color\]/gs, '<span style="color:$1">$2</span>')
    .replace(/\[big\](.+?)\[\/big\]/gs, '<span style="font-size:1.3em;font-weight:bold">$1</span>')
    .replace(/\[small\](.+?)\[\/small\]/gs, '<span style="font-size:.85em;opacity:.8">$1</span>')
    .replace(/\[bg=([^\]]+)\](.+?)\[\/bg\]/gs, '<span style="background-color:$1;padding:2px 4px;border-radius:2px">$2</span>')
    .replace(/\[center\](.+?)\[\/center\]/gs, '<div style="text-align:center">$1</div>')
    .replace(/\[right\](.+?)\[\/right\]/gs, '<div style="text-align:right">$1</div>')
    .replace(/\[glow\](.+?)\[\/glow\]/gs, '<span style="color:#5bc0de;text-shadow:0 0 10px rgba(91,192,222,.8)">$1</span>');
  let html = marked.parse(processed, { async: false, breaks: true, gfm: true }) as string;
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_match, value: string) => {
    const label = value.trim();
    const numeric = /^\d+$/.test(label) ? choices[Number(label) - 1] : undefined;
    const choice = choices.find(candidate => candidate.text === label) ?? numeric;
    return choice
      ? `<a class="choice-embed-link" data-choice-id="${escapeAttribute(choice.id)}">${choice.text}</a>`
      : '';
  });
  return html.replace(/<p>/g, '').replace(/<\/p>/g, '');
}
