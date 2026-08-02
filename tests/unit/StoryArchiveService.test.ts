import 'fake-indexeddb/auto';
import JSZip from 'jszip';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  FILE_FORMAT_VERSION,
  STORY_FILE_FORMAT,
  STORY_ZIP_FORMAT,
  WORKSPACE_BACKUP_FORMAT,
} from '../../src/domain/story/fileFormats.ts';
import { StoryArchiveService } from '../../src/platform/export/StoryArchiveService.ts';
import { WorkspaceRepository } from '../../src/platform/storage/WorkspaceRepository.ts';
import type { Story } from '../../src/types/index.ts';

function makeStory(id = 'story-archive'): Story {
  const now = '2026-08-02T00:00:00.000Z';
  return {
    id,
    meta: {
      title: '归档测试', author: '作者', description: '', start_node: 1,
      displayMode: 'visual-novel',
    },
    nodes: [{
      id: '1', type: 'storyNode', position: { x: 0, y: 0 },
      data: { nodeId: 1, nodeType: 'start', text: '开始', choices: [] },
    }],
    edges: [], variables: [], createdAt: now, updatedAt: now,
  };
}

async function zipBlob(zip: JSZip): Promise<Blob> {
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  return new Blob([bytes], { type: 'application/zip' });
}

describe('StoryArchiveService', () => {
  let repository: WorkspaceRepository;
  let service: StoryArchiveService;

  beforeEach(() => {
    repository = new WorkspaceRepository(`mo-archive-${crypto.randomUUID()}`);
    service = new StoryArchiveService(repository);
  });

  it('JSON 往返使用当前严格格式并为导入作品分配新 ID', async () => {
    const story = makeStory();
    const exported = service.exportStoryJson(story);
    const parsed = JSON.parse(await exported.text());
    expect(parsed).toMatchObject({ format: STORY_FILE_FORMAT, version: FILE_FORMAT_VERSION });

    const imported = await service.importStoryJson(exported);
    expect(imported.id).not.toBe(story.id);
    expect(imported.story.meta.title).toBe(story.meta.title);
  });

  it('JSON 引用图片时要求改用 ZIP，且不写入半份作品', async () => {
    const story = makeStory();
    story.nodes[0].data.image = {
      imagePath: 'asset:missing', fileName: 'scene.png', fileSize: 1,
      originalFormat: 'png', hash: 'missing', width: 1, height: 1,
    };
    const file = service.exportStoryJson(story);

    await expect(service.importStoryJson(file)).rejects.toThrow('请使用 ZIP');
    expect(await repository.listStories()).toHaveLength(0);
  });

  it('无图片 ZIP 可以完整往返', async () => {
    const story = makeStory();
    const imported = await service.importStoryZip(await service.exportStoryZip(story));

    expect(imported.story.meta.title).toBe(story.meta.title);
    expect(imported.id).not.toBe(story.id);
  });

  it('ZIP 图片哈希错误时拒绝写入', async () => {
    const story = makeStory();
    story.nodes[0].data.image = {
      imagePath: 'asset:deadbeef', fileName: 'scene.png', fileSize: 3,
      originalFormat: 'png', hash: 'deadbeef', width: 1, height: 1,
    };
    const zip = new JSZip();
    zip.file('story.json', JSON.stringify({
      format: STORY_FILE_FORMAT, version: FILE_FORMAT_VERSION, story,
    }));
    zip.file('assets/deadbeef', new Uint8Array([1, 2, 3]));
    zip.file('manifest.json', JSON.stringify({
      format: STORY_ZIP_FORMAT,
      version: FILE_FORMAT_VERSION,
      storyFile: 'story.json',
      assets: [{
        id: 'asset:deadbeef', file: 'assets/deadbeef', mimeType: 'image/png',
        size: 3, hash: 'deadbeef', fileName: 'scene.png', width: 1, height: 1,
      }],
    }));

    await expect(service.importStoryZip(await zipBlob(zip))).rejects.toThrow('图片哈希校验失败');
    expect(await repository.listStories()).toHaveLength(0);
  });

  it('整库备份恢复 stories 与 settings', async () => {
    const original = await repository.createStory(makeStory());
    await repository.setSetting('plugins.config', { 'tool.validator': { enabled: false, settings: {} } });
    const backup = await service.exportWorkspace();
    await repository.createStory(makeStory('temporary'));

    await service.restoreWorkspace(backup);

    const stories = await repository.listStories();
    expect(stories.map(item => item.id)).toEqual([original.id]);
    expect(await repository.getSetting('plugins.config')).toEqual({
      'tool.validator': { enabled: false, settings: {} },
    });
  });

  it('整库文件校验失败时保留现有作品库', async () => {
    const original = await repository.createStory(makeStory());
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
      format: WORKSPACE_BACKUP_FORMAT,
      version: FILE_FORMAT_VERSION,
      createdAt: '2026-08-02T00:00:00.000Z',
      stories: [{ id: original.id, file: 'stories/missing.json', revision: 1 }],
      assets: [],
      settingsFile: 'settings.json',
    }));
    zip.file('settings.json', '[]');

    await expect(service.restoreWorkspace(await zipBlob(zip))).rejects.toThrow('压缩包缺少');
    expect((await repository.listStories()).map(item => item.id)).toEqual([original.id]);
  });
});
