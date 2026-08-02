import JSZip from 'jszip';
import { z } from 'zod';
import {
  FILE_FORMAT_VERSION,
  STORY_FILE_FORMAT,
  STORY_ZIP_FORMAT,
  WORKSPACE_BACKUP_FORMAT,
  storyFileSchema,
  storyZipManifestSchema,
  workspaceManifestSchema,
} from '../../domain/story/fileFormats.ts';
import { collectAssetIds, parseStory } from '../../domain/story/schema.ts';
import type { WorkspaceRepository } from '../storage/WorkspaceRepository.ts';
import { StorageQuotaError, type AssetRecord, type SettingRecord, type StoredStory } from '../storage/types.ts';
import type { Story } from '../../types/index.ts';
import { sha256 } from './binary.ts';

const MAX_JSON_BYTES = 50 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_ENTRY_BYTES = 128 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 1024 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 30_000;

const settingsSchema = z.array(z.object({ key: z.string().min(1), value: z.unknown() }).strict()).max(10_000);

function jsonBlob(value: unknown): Blob {
  return new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
}

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

export class StoryArchiveService {
  constructor(private readonly repository: WorkspaceRepository) {}

  exportStoryJson(story: Story): Blob {
    const parsed = parseStory(story);
    return jsonBlob({ format: STORY_FILE_FORMAT, version: FILE_FORMAT_VERSION, story: parsed });
  }

  async importStoryJson(file: Blob): Promise<StoredStory> {
    assertInputSize(file.size, MAX_JSON_BYTES, 'JSON 文件超出大小限制');
    const envelope = storyFileSchema.parse(JSON.parse(await file.text()));
    if (collectAssetIds(envelope.story as Story).size > 0) {
      throw new Error('JSON 文件不包含图片资源，请使用 ZIP 导入含图片作品');
    }
    return this.repository.importStory(envelope.story as Story);
  }

  async exportStoryZip(story: Story): Promise<Blob> {
    const parsed = parseStory(story);
    const assets = await this.requiredAssets(parsed);
    const zip = new JSZip();
    zip.file('story.json', JSON.stringify({
      format: STORY_FILE_FORMAT,
      version: FILE_FORMAT_VERSION,
      story: parsed,
    }, null, 2));

    const manifestAssets = [];
    for (const asset of assets) {
      const file = `assets/${asset.hash}`;
      zip.file(file, asset.blob);
      manifestAssets.push({
        id: asset.id,
        file,
        mimeType: asset.mimeType,
        size: asset.size,
        hash: asset.hash,
        fileName: asset.fileName,
        width: asset.width,
        height: asset.height,
      });
    }
    zip.file('manifest.json', JSON.stringify({
      format: STORY_ZIP_FORMAT,
      version: FILE_FORMAT_VERSION,
      storyFile: 'story.json',
      assets: manifestAssets,
    }, null, 2));
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }

  async importStoryZip(file: Blob): Promise<StoredStory> {
    assertInputSize(file.size, MAX_ARCHIVE_BYTES, 'ZIP 文件超出大小限制');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    assertArchiveShape(zip);
    const manifest = storyZipManifestSchema.parse(JSON.parse(await readTextEntry(zip, 'manifest.json')));
    const storyEnvelope = storyFileSchema.parse(JSON.parse(await readTextEntry(zip, manifest.storyFile)));
    const assets = await this.readAssets(zip, manifest.assets);
    this.assertStoryAssets(storyEnvelope.story as Story, assets);
    await this.assertCapacity(assets.reduce((total, asset) => total + asset.size, 0));
    return this.repository.importStoryWithAssets(storyEnvelope.story as Story, assets);
  }

  async exportWorkspace(): Promise<Blob> {
    const snapshot = await this.repository.snapshot();
    const zip = new JSZip();
    const stories = snapshot.stories.map(stored => {
      const file = `stories/${encodeURIComponent(stored.id)}.json`;
      zip.file(file, JSON.stringify(stored.story));
      return { id: stored.id, file, revision: stored.revision };
    });
    const assets = snapshot.assets.map(asset => {
      const file = `assets/${asset.hash}`;
      zip.file(file, asset.blob);
      return {
        id: asset.id,
        file,
        mimeType: asset.mimeType,
        size: asset.size,
        hash: asset.hash,
        fileName: asset.fileName,
        width: asset.width,
        height: asset.height,
      };
    });
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
    const stories: StoredStory[] = [];
    for (const item of manifest.stories) {
      const story = parseStory(JSON.parse(await readTextEntry(zip, item.file)));
      if (story.id !== item.id) throw new Error(`作品 ID 与清单不一致: ${item.id}`);
      stories.push({ id: story.id, story, revision: item.revision, updatedAt: story.updatedAt });
    }
    const assets = await this.readAssets(zip, manifest.assets);
    const settings = settingsSchema.parse(JSON.parse(await readTextEntry(zip, manifest.settingsFile))) as SettingRecord[];
    for (const stored of stories) this.assertStoryAssets(stored.story, assets);
    await this.assertCapacity(assets.reduce((total, asset) => total + asset.size, 0));
    await this.repository.replaceWorkspace({ stories, assets, settings });
  }

  private async requiredAssets(story: Story): Promise<AssetRecord[]> {
    const ids = collectAssetIds(story);
    const assets = await this.repository.getAssets(ids);
    this.assertStoryAssets(story, assets);
    return assets;
  }

  private assertStoryAssets(story: Story, assets: AssetRecord[]): void {
    const available = new Set(assets.map(asset => asset.id));
    const missing = [...collectAssetIds(story)].filter(id => !available.has(id));
    if (missing.length > 0) throw new Error(`作品缺少图片资源: ${missing.join(', ')}`);
  }

  private async readAssets(zip: JSZip, entries: z.infer<typeof storyZipManifestSchema>['assets']): Promise<AssetRecord[]> {
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
      if (actualHash !== item.hash || item.id !== `asset:${actualHash}`) {
        throw new Error(`图片哈希校验失败: ${item.file}`);
      }
      assets.push({
        ...item,
        blob,
        createdAt: new Date().toISOString(),
      });
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
