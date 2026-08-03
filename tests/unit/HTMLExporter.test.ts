import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HTMLExporter } from '../../src/platform/export/HTMLExporter.ts';
import { WorkspaceRepository } from '../../src/platform/storage/WorkspaceRepository.ts';
import { canonicalStory } from '../fixtures/canonicalStory.ts';

describe('HTMLExporter', () => {
  let repository: WorkspaceRepository;
  let exporter: HTMLExporter;

  beforeEach(() => {
    repository = new WorkspaceRepository(`mo-html-${crypto.randomUUID()}`);
    exporter = new HTMLExporter(repository);
  });

  it('安全内联当前故事且只包含所选模板', async () => {
    const document = canonicalStory();
    document.meta.title = '测试 <作品>';
    document.scenes[0].content.text = '</script><script>unsafe()</script>';
    document.scenes[1].media = {};
    const html = await (await exporter.export(document)).text();
    expect(html).toContain('<title>测试 &lt;作品&gt;</title>');
    expect(html).toContain('builtin.visual-novel');
    expect(html).not.toContain('builtin.chat');
    expect(html).not.toContain('</script><script>unsafe()');
    expect(html).not.toMatch(/(?:src|href)=["']https?:\/\//i);
  });

  it('把引用图片内联为 data URL', async () => {
    const asset = await repository.putAsset({ blob: new Blob(['image-bytes'], { type: 'image/png' }), mimeType: 'image/png', fileName: 'scene.png', width: 20, height: 10 });
    vi.spyOn(repository, 'getAssets').mockResolvedValue([asset]);
    const document = canonicalStory();
    document.scenes[1].media.background = {
      assetId: asset.id, fileName: asset.fileName, mimeType: asset.mimeType, size: asset.size,
      hash: asset.hash, width: asset.width, height: asset.height,
    };
    document.scenes[1].media.characters = [];
    const html = await (await exporter.export(document)).text();
    expect(html).toContain('data:image/png;base64,');
  });

  it('引用图片缺失时拒绝生成残缺 HTML', async () => {
    const document = canonicalStory();
    await expect(exporter.export(document)).rejects.toThrow('作品缺少图片资源');
  });
});
