import JSZip from 'jszip';
import { z } from 'zod';
import {
  FILE_FORMAT_VERSION,
  WORKSPACE_BACKUP_FORMAT,
  assetManifestSchema,
  workspaceManifestSchema,
} from '../../domain/story/fileFormats.ts';
import { collectAssetIds, parseStoryDocument } from '../../domain/story/document.ts';
import { parseStoryEditorState } from '../../domain/story/editorState.ts';
import type { WorkspaceRepository } from '../storage/WorkspaceRepository.ts';
import { StorageQuotaError, type AssetRecord, type SettingRecord, type StoredStory } from '../storage/types.ts';
import { sha256 } from './binary.ts';

const MAX_JSON_BYTES = 50 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_ENTRY_BYTES = 128 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 1024 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 30_000;

const settingsSchema = z.array(z.object({ key: z.string().min(1), value: z.unknown() }).strict()).max(10_000);
const storyRecordSchema = z.object({ document: z.unknown(), editorState: z.unknown() }).strict();

function assertInputSize(size: number, limit: number, message: string): void {
  if (size > limit) throw new Error(message);
}

function assertArchiveShape(zip: JSZip): void {
  if (Object.keys(zip.files).length > MAX_ARCHIVE_ENTRIES) throw new Error('压缩包文件数量超出限制');
}

async function readTextEntry(zip: JSZip, path: string, maxBytes = MAX_JSON_BYTES): Promise<string> {
  const entry = zip.file(path);
  if (!entry) throw new Error(`压缩包缺少 ${path}`);
  const bytes = await entry.async('uint8array');
  assertInputSize(bytes.byteLength, maxBytes, `${path} 超出大小限制`);
  return new TextDecoder().decode(bytes);
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label}存在重复 ID`);
}

export class StoryArchiveService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async exportWorkspace(): Promise<Blob> {
    const snapshot = await this.repository.snapshot();
    const zip = new JSZip();
    const stories = snapshot.stories.map(stored => {
      const file = `stories/${encodeURIComponent(stored.id)}.json`;
      zip.file(file, JSON.stringify({ document: stored.document, editorState: stored.editorState }));
      return { id: stored.id, file, revision: stored.revision, updatedAt: stored.updatedAt };
    });
    const assets = [];
    for (const asset of snapshot.assets) {
      const file = `assets/${asset.hash}`;
      zip.file(file, await asset.blob.arrayBuffer());
      assets.push({
        id: asset.id, file, mimeType: asset.mimeType, size: asset.size, hash: asset.hash,
        fileName: asset.fileName, width: asset.width, height: asset.height,
      });
    }
    zip.file('settings.json', JSON.stringify(snapshot.settings));
    zip.file('manifest.json', JSON.stringify({
      format: WORKSPACE_BACKUP_FORMAT,
      version: FILE_FORMAT_VERSION,
      createdAt: new Date().toISOString(),
      stories,
      assets,
      settingsFile: 'settings.json',
    }, null, 2));
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }

  async restoreWorkspace(file: Blob): Promise<void> {
    assertInputSize(file.size, MAX_ARCHIVE_BYTES, '备份文件超出大小限制');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    assertArchiveShape(zip);
    const manifest = workspaceManifestSchema.parse(JSON.parse(await readTextEntry(zip, 'manifest.json')));
    assertUnique(manifest.stories.map(item => item.id), '作品清单');
    assertUnique(manifest.stories.map(item => item.file), '作品文件');
    assertUnique(manifest.assets.map(item => item.id), '资源清单');
    assertUnique(manifest.assets.map(item => item.file), '资源文件');

    const stories: StoredStory[] = [];
    for (const item of manifest.stories) {
      const record = storyRecordSchema.parse(JSON.parse(await readTextEntry(zip, item.file)));
      const document = parseStoryDocument(record.document);
      const editorState = parseStoryEditorState(record.editorState);
      if (document.id !== item.id || document.updatedAt !== item.updatedAt) throw new Error(`作品与清单不一致: ${item.id}`);
      stories.push({ id: item.id, document, editorState, revision: item.revision, updatedAt: item.updatedAt });
    }
    const assets = await this.readAssets(zip, manifest.assets);
    const settings = settingsSchema.parse(JSON.parse(await readTextEntry(zip, manifest.settingsFile))) as SettingRecord[];
    assertUnique(settings.map(setting => setting.key), '设置');
    this.assertAllAssets(stories, assets);
    await this.assertCapacity(assets.reduce((total, asset) => total + asset.size, 0));
    await this.repository.replaceWorkspace({ stories, assets, settings });
  }

  private assertAllAssets(stories: StoredStory[], assets: AssetRecord[]): void {
    const available = new Set(assets.map(asset => asset.id));
    for (const stored of stories) {
      const missing = [...collectAssetIds(stored.document)].filter(id => !available.has(id));
      if (missing.length > 0) throw new Error(`作品缺少图片资源: ${missing.join(', ')}`);
    }
  }

  private async readAssets(zip: JSZip, entries: z.infer<typeof assetManifestSchema>[]): Promise<AssetRecord[]> {
    const assets: AssetRecord[] = [];
    let total = 0;
    for (const item of entries) {
      const entry = zip.file(item.file);
      if (!entry) throw new Error(`压缩包缺少图片: ${item.file}`);
      const bytes = await entry.async('uint8array');
      assertInputSize(bytes.byteLength, MAX_ENTRY_BYTES, `${item.file} 超出大小限制`);
      total += bytes.byteLength;
      assertInputSize(total, MAX_TOTAL_UNCOMPRESSED_BYTES, '压缩包解压总大小超出限制');
      if (bytes.byteLength !== item.size) throw new Error(`图片大小校验失败: ${item.file}`);
      const blob = new Blob([new Uint8Array(bytes).buffer], { type: item.mimeType });
      const actualHash = await sha256(blob);
      if (actualHash !== item.hash || item.id !== `asset:${actualHash}`) throw new Error(`图片哈希校验失败: ${item.file}`);
      assets.push({ ...item, blob, createdAt: new Date().toISOString() });
    }
    return assets;
  }

  private async assertCapacity(requiredBytes: number): Promise<void> {
    const estimate = await this.repository.estimateStorage();
    if (estimate && estimate.quota > 0 && requiredBytes > estimate.available * 0.9) {
      throw new StorageQuotaError('浏览器剩余空间不足以完成导入');
    }
  }
}
