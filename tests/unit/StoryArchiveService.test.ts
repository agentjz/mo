import 'fake-indexeddb/auto';
import JSZip from 'jszip';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FILE_FORMAT_VERSION, WORKSPACE_BACKUP_FORMAT } from '../../src/domain/story/fileFormats.ts';
import { StoryArchiveService } from '../../src/platform/export/StoryArchiveService.ts';
import { WorkspaceRepository } from '../../src/platform/storage/WorkspaceRepository.ts';
import { canonicalEditorState, canonicalStory } from '../fixtures/canonicalStory.ts';

interface TestWorkspaceManifest {
  format: string;
  version: number;
  createdAt: string;
  stories: Array<{ id: string; file: string; revision: number; updatedAt: string }>;
  assets: Array<{
    id: string;
    file: string;
    mimeType: string;
    size: number;
    hash: string;
    fileName: string;
    width: number;
    height: number;
  }>;
  settingsFile: string;
}

async function zipBlob(zip: JSZip): Promise<Blob> {
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  return new Blob([bytes], { type: 'application/zip' });
}

function storyWithoutMedia(id?: string) {
  const document = canonicalStory();
  if (id) document.id = id;
  for (const scene of document.scenes) scene.media = {};
  return document;
}

async function mutateArchive(
  source: Blob,
  mutate: (zip: JSZip, manifest: TestWorkspaceManifest) => void | Promise<void>,
): Promise<Blob> {
  const zip = await JSZip.loadAsync(await source.arrayBuffer());
  const manifest = JSON.parse(await zip.file('manifest.json')!.async('string')) as TestWorkspaceManifest;
  await mutate(zip, manifest);
  zip.file('manifest.json', JSON.stringify(manifest));
  return zipBlob(zip);
}

async function workspaceFingerprint(repository: WorkspaceRepository) {
  const snapshot = await repository.snapshot();
  return {
    stories: snapshot.stories,
    assets: snapshot.assets.map(({ blob: _blob, ...asset }) => asset),
    settings: snapshot.settings,
  };
}

describe('StoryArchiveService 整库 ZIP', () => {
  let repository: WorkspaceRepository;
  let service: StoryArchiveService;

  beforeEach(() => {
    repository = new WorkspaceRepository(`mo-archive-${crypto.randomUUID()}`);
    service = new StoryArchiveService(repository);
  });

  it('完整往返作品、编辑投影、revision、图片、设置和插件配置', async () => {
    const asset = await repository.putAsset({ blob: new Blob(['image'], { type: 'image/png' }), mimeType: 'image/png', fileName: 'scene.png', width: 10, height: 10 });
    const document = storyWithoutMedia();
    document.scenes[1].media.background = {
      assetId: asset.id, fileName: asset.fileName, mimeType: asset.mimeType, size: asset.size,
      hash: asset.hash, width: asset.width, height: asset.height,
    };
    const original = await repository.createStory(document, canonicalEditorState());
    const changed = structuredClone(original.document);
    changed.meta.title = 'revision 2';
    await repository.saveStory(changed, original.editorState, original.revision);
    await repository.setSetting('plugins.config', { validator: { enabled: false } });
    const snapshot = await repository.snapshot();
    vi.spyOn(repository, 'snapshot').mockResolvedValueOnce({ ...snapshot, assets: [asset] });
    const backup = await service.exportWorkspace();
    const temporary = storyWithoutMedia('temporary');
    await repository.createStory(temporary, canonicalEditorState());

    await service.restoreWorkspace(backup);

    const stories = await repository.listStories();
    expect(stories).toHaveLength(1);
    expect(stories[0]).toMatchObject({ id: original.id, revision: 2, document: { meta: { title: 'revision 2' } } });
    expect(await repository.getAsset(asset.id)).toBeTruthy();
    expect(await repository.getSetting('plugins.config')).toEqual({ validator: { enabled: false } });
  });

  it('缺失作品文件时原子保留当前工作区', async () => {
    const document = storyWithoutMedia();
    const original = await repository.createStory(document, canonicalEditorState());
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
      format: WORKSPACE_BACKUP_FORMAT, version: FILE_FORMAT_VERSION,
      createdAt: '2026-08-02T00:00:00.000Z',
      stories: [{ id: original.id, file: `stories/${original.id}.json`, revision: 1, updatedAt: original.updatedAt }],
      assets: [], settingsFile: 'settings.json',
    }));
    zip.file('settings.json', '[]');
    await expect(service.restoreWorkspace(await zipBlob(zip))).rejects.toThrow('压缩包缺少');
    expect((await repository.listStories()).map(item => item.id)).toEqual([original.id]);
  });

  it('损坏 ZIP、manifest、作品、资源声明和图片均在提交前失败', async () => {
    await repository.createStory(storyWithoutMedia(), canonicalEditorState());
    await repository.setSetting('plugins.config', { validator: { enabled: true } });
    const baseline = await workspaceFingerprint(repository);
    const validBackup = await service.exportWorkspace();
    const assertRejectedWithoutChanges = async (file: Blob, message?: string | RegExp) => {
      const rejection = expect(service.restoreWorkspace(file)).rejects;
      if (message) await rejection.toThrow(message);
      else await rejection.toThrow();
      expect(await workspaceFingerprint(repository)).toEqual(baseline);
    };

    await assertRejectedWithoutChanges(new Blob(['not-a-zip'], { type: 'application/zip' }));
    await assertRejectedWithoutChanges(await mutateArchive(validBackup, (_zip, manifest) => {
      manifest.format = 'mo.workspace.invalid';
    }));
    await assertRejectedWithoutChanges(await mutateArchive(validBackup, (zip, manifest) => {
      zip.file(manifest.stories[0].file, JSON.stringify({ document: {}, editorState: {} }));
    }));
    await assertRejectedWithoutChanges(await mutateArchive(validBackup, async (zip, manifest) => {
      const storyPath = manifest.stories[0].file;
      const record = JSON.parse(await zip.file(storyPath)!.async('string')) as { document: ReturnType<typeof canonicalStory>; editorState: unknown };
      record.document.scenes[0].media.background = {
        assetId: 'asset:missing', fileName: 'missing.png', mimeType: 'image/png', size: 1,
        hash: 'missing', width: 1, height: 1,
      };
      zip.file(storyPath, JSON.stringify(record));
    }), '作品缺少图片资源');
    await assertRejectedWithoutChanges(await mutateArchive(validBackup, (zip, manifest) => {
      zip.file('assets/wrong-mime', new Uint8Array([1]));
      manifest.assets.push({
        id: 'asset:wrong-mime', file: 'assets/wrong-mime', mimeType: 'text/plain', size: 1,
        hash: 'wrong-mime', fileName: 'wrong.txt', width: 1, height: 1,
      });
    }));
    await assertRejectedWithoutChanges(await mutateArchive(validBackup, (zip, manifest) => {
      zip.file('assets/deadbeef', new Uint8Array([1, 2, 3]));
      manifest.assets.push({
        id: 'asset:deadbeef', file: 'assets/deadbeef', mimeType: 'image/png', size: 3,
        hash: 'deadbeef', fileName: 'image.png', width: 1, height: 1,
      });
    }), '图片哈希校验失败');
    await assertRejectedWithoutChanges(await mutateArchive(validBackup, (zip, manifest) => {
      zip.file('assets/duplicate-a', new Uint8Array([1]));
      zip.file('assets/duplicate-b', new Uint8Array([1]));
      const duplicate = {
        id: 'asset:duplicate', mimeType: 'image/png', size: 1, hash: 'duplicate',
        fileName: 'duplicate.png', width: 1, height: 1,
      };
      manifest.assets.push(
        { ...duplicate, file: 'assets/duplicate-a' },
        { ...duplicate, file: 'assets/duplicate-b' },
      );
    }), '资源清单存在重复 ID');
  });

  it('容量不足或事务提交失败时保留现有工作区', async () => {
    await repository.createStory(storyWithoutMedia(), canonicalEditorState());
    await repository.setSetting('current', { untouched: true });
    const baseline = await workspaceFingerprint(repository);

    const sourceRepository = new WorkspaceRepository(`mo-archive-source-${crypto.randomUUID()}`);
    const asset = await sourceRepository.putAsset({
      blob: new Blob(['source-image'], { type: 'image/png' }), mimeType: 'image/png',
      fileName: 'source.png', width: 10, height: 10,
    });
    const sourceDocument = storyWithoutMedia('source-story');
    sourceDocument.scenes[0].media.background = {
      assetId: asset.id, fileName: asset.fileName, mimeType: asset.mimeType, size: asset.size,
      hash: asset.hash, width: asset.width, height: asset.height,
    };
    await sourceRepository.createStory(sourceDocument, canonicalEditorState());
    const sourceSnapshot = await sourceRepository.snapshot();
    vi.spyOn(sourceRepository, 'snapshot').mockResolvedValueOnce({ ...sourceSnapshot, assets: [asset] });
    const sourceBackup = await new StoryArchiveService(sourceRepository).exportWorkspace();

    vi.spyOn(repository, 'estimateStorage').mockResolvedValueOnce({ usage: 95, quota: 100, available: 5 });
    await expect(service.restoreWorkspace(sourceBackup)).rejects.toThrow('浏览器剩余空间不足');
    expect(await workspaceFingerprint(repository)).toEqual(baseline);

    vi.spyOn(repository, 'replaceWorkspace').mockRejectedValueOnce(new Error('transaction interrupted'));
    await expect(service.restoreWorkspace(sourceBackup)).rejects.toThrow('transaction interrupted');
    expect(await workspaceFingerprint(repository)).toEqual(baseline);
  });
});
