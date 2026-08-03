import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { builtinTemplateEntries } from '../../src/templates/catalog.ts';
import { createStory, readStoredStory, waitForStory } from './helpers.ts';

const packageMarkup = `<main data-player-template="{{templateId}}">
  <header><span data-story-title>{{storyTitle}}</span><button data-player-menu>菜单</button></header>
  <p data-scene-speaker>{{sceneSpeaker}}</p><div data-scene-text>{{sceneText}}</div>
  <div data-scene-media></div><nav data-scene-choices></nav><aside data-player-status></aside>
</main>`;
const templateArtifactRoot = resolve('artifacts', 'experience-current', '09d8d2f', 'templates');
const templateViewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '390x844', width: 390, height: 844 },
] as const;

async function sha256(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function templatePackage(): Promise<Buffer> {
  const css = 'main{display:grid;min-height:100vh}';
  const manifest = {
    format: 'mo.player-template', version: 1,
    template: {
      id: 'local.browser-test', name: '浏览器测试模板', version: '1.0.0', category: '测试',
      preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M8AAAICAQB7CYVIAAAAAElFTkSuQmCC',
      capabilities: { images: 'fallback' }, settings: [], sceneVariants: ['default', 'focused'],
      resources: [], fallback: { images: '文本' }, structuralFingerprint: 'browser-test>content>choices',
    },
    files: [
      { path: 'template.html', size: new TextEncoder().encode(packageMarkup).byteLength, sha256: await sha256(packageMarkup) },
      { path: 'template.css', size: new TextEncoder().encode(css).byteLength, sha256: await sha256(css) },
    ],
  };
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(manifest));
  zip.file('template.html', packageMarkup);
  zip.file('template.css', css);
  return zip.generateAsync({ type: 'nodebuffer' });
}

test('十二模板可选择、预览并保持同一运行语义', async ({ page }) => {
  const storyId = await createStory(page);
  await page.getByRole('button', { name: '选择播放器模板' }).click();
  const gallery = page.locator('[data-template-gallery]');
  const cards = gallery.locator('[data-template-card]');
  await expect(cards).toHaveCount(12);
  await expect(gallery.locator('iframe')).toHaveCount(1);
  const selectedCard = gallery.locator('.template-card-selected');
  await expect(selectedCard).toHaveAttribute('data-template-id', 'builtin.visual-novel');
  const preview = selectedCard.locator('iframe');
  await expect.poll(() => preview.getAttribute('srcdoc')).toContain('data-player-template="builtin.visual-novel"');
  await expect.poll(() => preview.getAttribute('srcdoc')).toContain('我的互动小说');
  await expect(gallery.locator('[data-template-card]:not(.template-card-selected) iframe')).toHaveCount(0);
  await expect(gallery.locator('[data-template-card]:not(.template-card-selected) .template-card-preview:not(.template-card-preview-live)')).toHaveCount(11);
  const fingerprints = await cards.evaluateAll(items => items.map(card => card.getAttribute('data-structure')));
  expect(new Set(fingerprints).size).toBe(12);
  await cards.nth(5).getByRole('button', { name: '使用此模板' }).click();
  await page.getByRole('button', { name: '播放', exact: true }).click();
  await page.getByRole('button', { name: '开始游戏' }).click();
  await expect(page.locator('[data-player-template]')).toBeVisible();
  expect(page.url()).toContain(`/play/${storyId}`);
});

test('十二模板独立 HTML 在 file:// 下零 HTTP 请求', async ({ page, context }, testInfo) => {
  test.setTimeout(120_000);
  await mkdir(templateArtifactRoot, { recursive: true });
  const storyId = await createStory(page);
  for (const [index, entry] of builtinTemplateEntries.entries()) {
    await page.getByRole('button', { name: '选择播放器模板' }).click();
    const card = page.locator(`[data-template-id="${entry.manifest.id}"]`);
    const select = card.getByRole('button');
    if (await select.isEnabled()) await select.click();
    else await page.getByRole('button', { name: '关闭' }).click();
    await waitForStory(page, storyId, stored => stored?.document.presentation.templateId === entry.manifest.id);
    await page.getByRole('button', { name: '返回仪表盘' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.story-card').filter({ hasText: '我的互动小说' }).getByTitle('导出为HTML').click();
    const download = await downloadPromise;
    const path = testInfo.outputPath(`template-${String(index + 1).padStart(2, '0')}.html`);
    await download.saveAs(path);
    const player = await context.newPage();
    const requests: string[] = [];
    const consoleErrors: string[] = [];
    player.on('request', request => { if (/^https?:/i.test(request.url())) requests.push(request.url()); });
    player.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await player.goto(pathToFileURL(path).href);
    const start = player.getByRole('button', { name: '开始游戏' });
    if (await start.isVisible()) await start.click();
    await expect(player.locator('[data-player-template]')).toBeVisible();
    for (const viewport of templateViewports) {
      await player.setViewportSize(viewport);
      const layout = await player.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        shellWidth: document.querySelector<HTMLElement>('[data-player-template]')?.getBoundingClientRect().width ?? 0,
      }));
      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.shellWidth).toBeGreaterThan(200);
      const fileName = `${String(index + 1).padStart(2, '0')}-${entry.manifest.id.replace('builtin.', '')}-standalone-${viewport.name}.png`;
      const screenshot = await player.screenshot({ path: resolve(templateArtifactRoot, fileName), animations: 'disabled' });
      expect(screenshot.byteLength).toBeGreaterThan(2_000);
    }
    await player.getByRole('button', { name: '菜单' }).click();
    const menu = player.getByRole('dialog');
    await expect(menu).toContainText('世界地图');
    await menu.getByRole('button', { name: '保存游戏' }).click();
    await expect(menu).toContainText('槽位 3');
    expect(requests).toEqual([]);
    expect(consoleErrors).toEqual([]);
    await player.close();
    await page.locator('.story-card').filter({ hasText: '我的互动小说' }).click();
    await expect(page.locator('.react-flow')).toBeVisible();
  }
});

test('本地模板 ZIP 安装、恢复、卸载和失败回路保持原子', async ({ page }) => {
  const storyId = await createStory(page);
  const before = await readStoredStory(page, storyId);
  await page.getByRole('button', { name: '选择播放器模板' }).click();

  const invalidChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '导入模板' }).click();
  await (await invalidChooser).setFiles({ name: 'invalid.zip', mimeType: 'application/zip', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('[data-template-card]')).toHaveCount(12);
  expect((await readStoredStory(page, storyId))?.document.presentation).toEqual(before?.document.presentation);

  const validChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '导入模板' }).click();
  await (await validChooser).setFiles({ name: 'template.zip', mimeType: 'application/zip', buffer: await templatePackage() });
  const localCard = page.locator('[data-template-id="local.browser-test"]');
  await expect(localCard).toContainText('浏览器测试模板');
  await expect(page.locator('[data-template-card]')).toHaveCount(13);

  await page.locator('[data-template-gallery]').getByRole('button', { name: '关闭' }).click();
  await page.reload();
  await expect(page.locator('.react-flow')).toBeVisible();
  await page.getByRole('button', { name: '选择播放器模板' }).click();
  await expect(page.locator('[data-template-id="local.browser-test"]')).toBeVisible();
  await page.locator('[data-template-id="local.browser-test"]').getByRole('button', { name: '卸载' }).click();
  await expect(page.locator('[data-template-id="local.browser-test"]')).toHaveCount(0);
  await expect(page.locator('[data-template-card]')).toHaveCount(12);
});

test('节点场景变体同步到网页试玩和独立 HTML', async ({ page, context }, testInfo) => {
  const storyId = await createStory(page);
  const node = page.locator('.react-flow__node').first();
  const sceneId = await node.getAttribute('data-id');
  expect(sceneId).toBeTruthy();
  await node.click();
  await page.getByRole('button', { name: '选择播放器模板' }).click();
  await page.getByLabel('当前节点变体').selectOption('focused');
  await waitForStory(page, storyId, stored => stored?.document.presentation.sceneVariants[sceneId!] === 'focused');
  await page.locator('[data-template-gallery]').getByRole('button', { name: '关闭' }).click();

  await page.getByRole('button', { name: '播放', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/play/${storyId}`));
  await page.getByRole('button', { name: '开始游戏' }).click();
  await expect(page.locator('[data-player-template]')).toHaveAttribute('data-scene-variant', 'focused');

  await page.goto('/mo/#/app');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.story-card').filter({ hasText: '我的互动小说' }).getByTitle('导出为HTML').click();
  const download = await downloadPromise;
  const htmlPath = testInfo.outputPath('scene-variant.html');
  await download.saveAs(htmlPath);
  expect(await readFile(htmlPath, 'utf8')).toContain('sceneVariants');
  const standalone = await context.newPage();
  await standalone.goto(pathToFileURL(htmlPath).href);
  await standalone.getByRole('button', { name: '开始游戏' }).click();
  await expect(standalone.locator('[data-player-template]')).toHaveAttribute('data-scene-variant', 'focused');
});
