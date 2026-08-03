import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { builtinTemplateEntries } from '../../src/templates/catalog.ts';
import { canonicalEditorState, canonicalStory } from '../fixtures/canonicalStory.ts';

const artifactRoot = resolve('artifacts', 'experience-current', '09d8d2f', 'templates');
const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '390x844', width: 390, height: 844 },
] as const;
const assetId = 'asset:template-matrix';
const characterAssetId = 'asset:template-character';
const assetSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" fill="#20333d"/><path d="M0 540 280 320 520 490 790 190 1200 560V675H0Z" fill="#47717a"/>
  <circle cx="930" cy="145" r="72" fill="#f0c96b"/><path d="M0 570h1200" stroke="#d7e6e2" stroke-width="8"/>
</svg>`;
const characterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="640" viewBox="0 0 320 640">
  <circle cx="160" cy="104" r="72" fill="#e9c6a2"/><path d="M58 640V280c0-86 204-86 204 0v360Z" fill="#345d76"/>
  <path d="M108 100c20-48 84-50 106 0" fill="none" stroke="#17242b" stroke-width="34" stroke-linecap="round"/>
</svg>`;

async function seedMatrixStory(page: Page): Promise<string> {
  const story = canonicalStory();
  story.id = 'template-matrix';
  story.meta = {
    title: '雾夜列车调查档案',
    author: '墨水测试',
    description: '一份覆盖长文本、图片、人物、热区、变量和多结局的模板验收作品。',
  };
  story.presentation.settings = { showHud: true, textScale: 1 };
  story.presentation.sceneVariants = { platform: 'focused' };
  const platform = story.scenes.find(scene => scene.id === 'platform')!;
  platform.content.text = '**站台档案**\n月光落在空旷站台上，广播反复播报一串无法辨认的编号。你需要检查散落的车票、墙上的旧地图和候车室门边的潮湿脚印，再决定下一步。\n\n[[再看一眼]]';
  platform.media.background = {
    assetId, fileName: 'station.svg', mimeType: 'image/svg+xml', size: assetSvg.length,
    hash: 'template-matrix-svg', width: 1200, height: 675, position: 'center', scale: 1, label: '雾夜站台',
  };
  platform.media.characters = [
    { ...platform.media.background, assetId: characterAssetId, fileName: 'character.svg', width: 320, height: 640, label: '调查员', horizontalPosition: 'left', verticalPosition: 'bottom', scale: 0.42 },
    { ...platform.media.background, assetId: characterAssetId, fileName: 'character.svg', width: 320, height: 640, label: '站务员', horizontalPosition: 'center', verticalPosition: 'bottom', scale: 0.48 },
    { ...platform.media.background, assetId: characterAssetId, fileName: 'character.svg', width: 320, height: 640, label: '旅客', horizontalPosition: 'right', verticalPosition: 'bottom', scale: 0.4 },
  ];
  platform.media.hotspots = [];
  platform.choices.push({ id: 'yard', text: '调查候车室', targetSceneId: 'yard' });
  story.scenes.push({
    id: 'yard', type: 'normal', content: { text: '候车室门边留下了一串脚印。', typewriterSpeed: 0, speaker: '调查员' },
    choices: [{ id: 'yard-back', text: '返回站台', targetSceneId: 'platform' }],
    media: {
      background: { ...platform.media.background, label: '候车室' }, characters: [],
      hotspots: [{ id: 'yard-exit', label: '出口', targetSceneId: 'exit', x: 0.72, y: 0.2, width: 0.18, height: 0.45 }],
    },
    tags: ['候车室'], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
  });
  const editorState = canonicalEditorState();
  editorState.scenePositions.yard = { x: 520, y: 520 };

  await page.goto('/mo/#/app');
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.evaluate(async ({ document, editorState: seededEditorState, svg, portrait }) => {
    const database = await new Promise<IDBDatabase>((resolveOpen, rejectOpen) => {
      const request = indexedDB.open('mo-workspace');
      request.onerror = () => rejectOpen(request.error);
      request.onsuccess = () => resolveOpen(request.result);
    });
    const transaction = database.transaction(['stories', 'assets'], 'readwrite');
    transaction.objectStore('stories').put({
      id: document.id, document, editorState: seededEditorState, revision: 1, updatedAt: document.updatedAt,
    });
    transaction.objectStore('assets').put({
      id: 'asset:template-matrix', blob: new Blob([svg], { type: 'image/svg+xml' }),
      mimeType: 'image/svg+xml', size: svg.length, hash: 'template-matrix-svg', fileName: 'station.svg',
      width: 1200, height: 675, createdAt: document.createdAt,
    });
    transaction.objectStore('assets').put({
      id: 'asset:template-character', blob: new Blob([portrait], { type: 'image/svg+xml' }),
      mimeType: 'image/svg+xml', size: portrait.length, hash: 'template-character-svg', fileName: 'character.svg',
      width: 320, height: 640, createdAt: document.createdAt,
    });
    await new Promise<void>((resolveTransaction, rejectTransaction) => {
      transaction.oncomplete = () => resolveTransaction();
      transaction.onerror = () => rejectTransaction(transaction.error);
      transaction.onabort = () => rejectTransaction(transaction.error);
    });
    database.close();
  }, { document: story, editorState, svg: assetSvg, portrait: characterSvg });
  return story.id;
}

async function selectTemplate(page: Page, storyId: string, templateId: string): Promise<void> {
  await page.evaluate(async ({ id, selectedTemplateId }) => {
    const database = await new Promise<IDBDatabase>((resolveOpen, rejectOpen) => {
      const request = indexedDB.open('mo-workspace');
      request.onerror = () => rejectOpen(request.error);
      request.onsuccess = () => resolveOpen(request.result);
    });
    const transaction = database.transaction('stories', 'readwrite');
    const store = transaction.objectStore('stories');
    const stored = await new Promise<Record<string, unknown>>((resolveGet, rejectGet) => {
      const request = store.get(id);
      request.onerror = () => rejectGet(request.error);
      request.onsuccess = () => resolveGet(request.result as Record<string, unknown>);
    });
    const document = stored.document as { presentation: { templateId: string } };
    document.presentation.templateId = selectedTemplateId;
    store.put({ ...stored, document, revision: Number(stored.revision) + 1 });
    await new Promise<void>((resolveTransaction, rejectTransaction) => {
      transaction.oncomplete = () => resolveTransaction();
      transaction.onerror = () => rejectTransaction(transaction.error);
    });
    database.close();
  }, { id: storyId, selectedTemplateId: templateId });
}

test('十二模板网页试玩三视口视觉和交互矩阵', async ({ page }) => {
  test.setTimeout(180_000);
  await mkdir(artifactRoot, { recursive: true });
  const consoleErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  const storyId = await seedMatrixStory(page);

  for (const [index, entry] of builtinTemplateEntries.entries()) {
    await selectTemplate(page, storyId, entry.manifest.id);
    await page.goto('/mo/#/app');
    await expect(page.locator('.dashboard')).toBeVisible();
    await page.goto(`/mo/#/play/${storyId}?startNode=platform`);
    await page.getByRole('button', { name: '开始游戏' }).click();
    const root = page.locator('[data-player-template]');
    await expect(root).toHaveAttribute('data-player-template', entry.manifest.id);
    await expect(root).toHaveAttribute('data-scene-variant', 'focused');

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await expect(root).toBeVisible();
      const layout = await page.evaluate(() => {
        const shell = document.querySelector<HTMLElement>('[data-player-template]')!;
        const box = shell.getBoundingClientRect();
        const clippedButtons = [...document.querySelectorAll<HTMLElement>('button')].filter(button => {
          const style = getComputedStyle(button);
          const rect = button.getBoundingClientRect();
          if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return false;
          return rect.left < -1 || rect.right > innerWidth + 1;
        }).length;
        return {
          bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          box: { width: box.width, height: box.height },
          clippedButtons,
        };
      });
      expect(layout.bodyOverflow).toBeLessThanOrEqual(1);
      expect(layout.box.width).toBeGreaterThan(200);
      expect(layout.box.height).toBeGreaterThan(200);
      expect(layout.clippedButtons).toBe(0);
      const fileName = `${String(index + 1).padStart(2, '0')}-${entry.manifest.id.replace('builtin.', '')}-web-${viewport.name}.png`;
      const screenshot = await page.screenshot({ path: resolve(artifactRoot, fileName), animations: 'disabled' });
      expect(screenshot.byteLength).toBeGreaterThan(2_000);
    }

    await root.locator('[data-player-menu]').click();
    const menu = page.getByRole('dialog');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('世界地图');
    await menu.getByRole('button', { name: '保存游戏' }).click();
    await expect(menu).toContainText('槽位 3');

    await page.goto('/mo/#/app');
    await page.goto(`/mo/#/play/${storyId}?startNode=yard`);
    await page.getByRole('button', { name: '开始游戏' }).click();
    await expect(page.getByRole('button', { name: '出口' })).toBeVisible();
  }

  expect(consoleErrors).toEqual([]);
});
