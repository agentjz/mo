import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';
import { expect, test } from '@playwright/test';
import { createStory, waitForStory } from './helpers.ts';

test.setTimeout(120_000);

async function downloadFromCard(page: import('@playwright/test').Page, title: string, buttonTitle: string) {
  const card = page.locator('.story-card').filter({ hasText: title });
  const downloadPromise = page.waitForEvent('download');
  await card.locator(`button[title="${buttonTitle}"]`).click();
  return downloadPromise;
}

test('单作品 JSON/ZIP/HTML 导出与两种独立播放器', async ({ page, context }, testInfo) => {
  const storyId = await createStory(page);
  const title = `导出测试_${Date.now()}`;
  await page.getByPlaceholder('我的互动小说').fill(title);
  await waitForStory(page, storyId, stored => stored?.story.meta.title === title);
  await page.getByRole('button', { name: '返回仪表盘' }).click();
  await expect(page.locator('.dashboard')).toBeVisible();

  const jsonDownload = await downloadFromCard(page, title, '导出JSON（纯文本）');
  const jsonPath = await jsonDownload.path();
  expect(jsonPath).toBeTruthy();
  expect(JSON.parse(await readFile(jsonPath!, 'utf8'))).toMatchObject({ format: 'mo.story', version: 1 });

  const zipDownload = await downloadFromCard(page, title, '导出ZIP（含图片）');
  const zipPath = await zipDownload.path();
  expect(zipPath).toBeTruthy();
  const zip = await JSZip.loadAsync(await readFile(zipPath!));
  expect(zip.file('manifest.json')).not.toBeNull();
  expect(zip.file('story.json')).not.toBeNull();

  const visualDownload = await downloadFromCard(page, title, '导出为HTML');
  const visualPath = testInfo.outputPath('visual-player.html');
  await visualDownload.saveAs(visualPath);
  const visualHTML = await readFile(visualPath, 'utf8');
  expect(visualHTML).toContain(title);
  expect(visualHTML).not.toContain('__MO_STORY_DATA__');
  expect(visualHTML).not.toMatch(/<(?:script|img)\b[^>]*\bsrc=["']https?:\/\//i);
  expect(visualHTML).not.toMatch(/<link\b[^>]*\bhref=["']https?:\/\//i);

  const visualPage = await context.newPage();
  const externalRequests: string[] = [];
  visualPage.on('request', request => {
    if (/^https?:\/\//i.test(request.url())) externalRequests.push(request.url());
  });
  await visualPage.goto(pathToFileURL(visualPath).href);
  await expect(visualPage.locator('.start-screen-title')).toHaveText(title);
  await visualPage.getByRole('button', { name: '开始游戏' }).click();
  await expect(visualPage.locator('.vn-dialogue-box')).toContainText('故事开始');
  expect(externalRequests).toEqual([]);

  await page.locator('.story-card').filter({ hasText: title }).click();
  await expect(page.locator('.react-flow')).toBeVisible();
  await page.locator('.form-group').filter({ hasText: '播放器样式' }).locator('select').selectOption('chat');
  await waitForStory(page, storyId, stored => stored?.story.meta.renderStyle === 'chat');
  await page.getByRole('button', { name: '返回仪表盘' }).click();

  const chatDownload = await downloadFromCard(page, title, '导出为HTML');
  const chatPath = testInfo.outputPath('chat-player.html');
  await chatDownload.saveAs(chatPath);
  const chatPage = await context.newPage();
  const chatExternalRequests: string[] = [];
  chatPage.on('request', request => {
    if (/^https?:\/\//i.test(request.url())) chatExternalRequests.push(request.url());
  });
  await chatPage.goto(pathToFileURL(chatPath).href);
  await expect(chatPage.locator('.chat-start-title')).toHaveText(title);
  await chatPage.getByRole('button', { name: '开始游戏' }).click();
  await expect(chatPage.locator('.chat-messages')).toContainText('故事开始');
  expect(chatExternalRequests).toEqual([]);
});

test('整库备份可以替换恢复被删除的作品', async ({ page }) => {
  const storyId = await createStory(page);
  const title = `备份恢复_${Date.now()}`;
  await page.getByPlaceholder('我的互动小说').fill(title);
  await waitForStory(page, storyId, stored => stored?.story.meta.title === title);
  await page.getByRole('button', { name: '返回仪表盘' }).click();

  const backupPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出作品库' }).click();
  const backup = await backupPromise;
  const backupPath = await backup.path();
  expect(backupPath).toBeTruthy();

  const card = page.locator('.story-card').filter({ hasText: title });
  await card.getByTitle('删除').click();
  await card.getByTitle('确认删除？(3秒后取消)').click();
  await expect(page.locator('.story-card').filter({ hasText: title })).toHaveCount(0);

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '导入作品库' }).click();
  const chooser = await chooserPromise;
  page.once('dialog', dialog => dialog.accept());
  await chooser.setFiles(backupPath!);

  await expect(page.locator('.story-card').filter({ hasText: title })).toBeVisible();
});
