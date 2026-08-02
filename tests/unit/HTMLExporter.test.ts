import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HTMLExporter } from '../../src/platform/export/HTMLExporter.ts';
import { WorkspaceRepository } from '../../src/platform/storage/WorkspaceRepository.ts';
import type { Story } from '../../src/types/index.ts';

const TEMPLATE = '<!doctype html><html><head><title>__MO_STORY_TITLE__</title></head><body><script>window.__MO_STORY__=__MO_STORY_DATA__</script></body></html>';

function makeStory(): Story {
  const now = '2026-08-02T00:00:00.000Z';
  return {
    id: 'story-export',
    meta: {
      title: '测试 <作品>', author: '作者', description: '', start_node: 1,
      displayMode: 'visual-novel',
    },
    nodes: [{
      id: '1', type: 'storyNode', position: { x: 0, y: 0 },
      data: { nodeId: 1, nodeType: 'start', text: '</script><script>unsafe()</script>', choices: [] },
    }],
    edges: [], variables: [], createdAt: now, updatedAt: now,
  };
}

describe('HTMLExporter', () => {
  let repository: WorkspaceRepository;
  let exporter: HTMLExporter;

  beforeEach(() => {
    repository = new WorkspaceRepository(`mo-html-${crypto.randomUUID()}`);
    exporter = new HTMLExporter(repository);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(TEMPLATE, { status: 200 })));
  });

  it('安全注入故事、标题和播放器样式', async () => {
    const html = await (await exporter.export(makeStory(), 'body{color:red}')).text();

    expect(fetch).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}templates/visual-novel-player.html`);
    expect(html).toContain('<title>测试 &lt;作品&gt;</title>');
    expect(html).toContain('\\u003c/script>\\u003cscript>unsafe()\\u003c/script>');
    expect(html).toContain('<style id="custom-style">body{color:red}</style>');
    expect(html).not.toContain('</script><script>unsafe()');
  });

  it('把 IndexedDB 图片替换为独立 data URL', async () => {
    const asset = await repository.putAsset({
      blob: new Blob(['image-bytes'], { type: 'image/png' }),
      mimeType: 'image/png', fileName: 'scene.png', width: 20, height: 10,
    });
    vi.spyOn(repository, 'getAssets').mockResolvedValue([asset]);
    const story = makeStory();
    story.nodes[0].data.image = {
      imagePath: asset.id, fileName: asset.fileName, fileSize: asset.size,
      originalFormat: 'png', hash: asset.hash, width: asset.width, height: asset.height,
    };

    const html = await (await exporter.export(story)).text();

    expect(html).toContain('data:image/png;base64,');
    expect(html).not.toContain(asset.id);
  });

  it('引用图片缺失时拒绝生成残缺 HTML', async () => {
    const story = makeStory();
    story.nodes[0].data.image = {
      imagePath: 'asset:missing', fileName: 'missing.png', fileSize: 1,
      originalFormat: 'png', hash: 'missing', width: 1, height: 1,
    };

    await expect(exporter.export(story)).rejects.toThrow('作品缺少图片资源');
  });
});
