import { collectAssetIds, cloneStory } from '../../domain/story/schema.ts';
import type { Story } from '../../types/index.ts';
import type { WorkspaceRepository } from '../storage/WorkspaceRepository.ts';
import { blobToDataUrl } from './binary.ts';

const STORY_PLACEHOLDER = '__MO_STORY_DATA__';
const TITLE_PLACEHOLDER = '__MO_STORY_TITLE__';

export class HTMLExporter {
  private templatePromise: Promise<string> | null = null;

  constructor(private readonly repository: WorkspaceRepository) {}

  async export(story: Story, customStyleCSS = ''): Promise<Blob> {
    const template = await this.loadTemplate();
    const portable = cloneStory(story);
    const assets = await this.repository.getAssets(collectAssetIds(portable));
    const dataUrls = new Map<string, string>();
    for (const asset of assets) dataUrls.set(asset.id, await blobToDataUrl(asset.blob));
    this.replaceAssetPaths(portable, dataUrls);

    const serialized = JSON.stringify(portable).replace(/</g, '\\u003c');
    let html = template
      .replace(STORY_PLACEHOLDER, serialized)
      .replace(TITLE_PLACEHOLDER, this.escapeHTML(story.meta.title));
    if (customStyleCSS) {
      html = html.replace('</head>', `<style id="custom-style">${customStyleCSS}</style></head>`);
    }
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  private loadTemplate(): Promise<string> {
    this.templatePromise ??= fetch(`${import.meta.env.BASE_URL}templates/visual-novel-player.html`)
      .then(response => {
        if (!response.ok) throw new Error('播放器模板未构建');
        return response.text();
      });
    return this.templatePromise;
  }

  private replaceAssetPaths(story: Story, urls: Map<string, string>): void {
    const replace = (path: string): string => {
      if (!path.startsWith('asset:')) return path;
      const url = urls.get(path);
      if (!url) throw new Error(`作品缺少图片资源: ${path}`);
      return url;
    };
    for (const node of story.nodes) {
      if (node.data.image) node.data.image.imagePath = replace(node.data.image.imagePath);
      for (const image of Object.values(node.data.characterImages ?? {})) {
        if (image) image.imagePath = replace(image.imagePath);
      }
    }
  }

  private escapeHTML(value: string): string {
    return value.replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[character] ?? character));
  }
}
