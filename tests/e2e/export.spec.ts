import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { createStory, openDashboard, waitForStory } from './helpers.ts';

test.setTimeout(120_000);

async function downloadFromCard(page: import('@playwright/test').Page, title: string, buttonTitle: string) {
  const card = page.locator('.story-card').filter({ hasText: title });
  const downloadPromise = page.waitForEvent('download');
  await card.locator(`button[title="${buttonTitle}"]`).click();
  return downloadPromise;
}

test('单作品独立 HTML 导出与两种播放器', async ({ page, context }, testInfo) => {
  const storyId = await createStory(page);
  const title = `导出测试_${Date.now()}`;
  await page.getByPlaceholder('我的互动小说').fill(title);
  await waitForStory(page, storyId, stored => stored?.document.meta.title === title);
  await page.getByRole('button', { name: '返回仪表盘' }).click();
  await expect(page.locator('.dashboard')).toBeVisible();

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
  await expect(visualPage.locator('.start-screen')).toBeVisible();
  await visualPage.getByRole('button', { name: '开始游戏' }).click();
  await expect(visualPage.locator('[data-player-template]')).toBeVisible();
  await expect(visualPage.locator('[data-scene-text]')).toContainText('故事从这里开始');
  await visualPage.getByRole('button', { name: '菜单' }).click();
  await expect(visualPage.locator('.game-menu-panel')).toContainText('世界地图');
  await visualPage.getByRole('button', { name: '保存游戏' }).click();
  await expect(visualPage.getByText('槽位 3')).toBeVisible();
  expect(externalRequests).toEqual([]);

  await page.locator('.story-card').filter({ hasText: title }).click();
  await expect(page.locator('.react-flow')).toBeVisible();
  await page.locator('.form-group').filter({ hasText: '播放器样式' }).locator('select').selectOption('chat');
  await waitForStory(page, storyId, stored => stored?.document.presentation.templateId === 'builtin.chat');
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
  await expect(chatPage.locator('.chat-start-screen')).toBeVisible();
  await chatPage.getByRole('button', { name: '开始游戏' }).click();
  await expect(chatPage.locator('[data-player-template]')).toBeVisible();
  await expect(chatPage.locator('[data-scene-text]')).toContainText('故事从这里开始');
  await expect(chatPage.locator('.chat-message-left')).toContainText('故事从这里开始');
  await chatPage.getByRole('button', { name: '菜单' }).click();
  await expect(chatPage.locator('.chat-game-menu')).toContainText('世界地图');
  expect(chatExternalRequests).toEqual([]);
});

test('整库备份可以替换恢复被删除的作品', async ({ page }) => {
  const storyId = await createStory(page);
  const title = `备份恢复_${Date.now()}`;
  await page.getByPlaceholder('我的互动小说').fill(title);
  await waitForStory(page, storyId, stored => stored?.document.meta.title === title);
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

test('损坏整库 ZIP 导入失败且不改变现有作品库', async ({ page }) => {
  await openDashboard(page);
  const before = await page.locator('.story-card h3').allTextContents();
  const importButton = page.getByRole('button', { name: '导入作品库' });
  const chooserPromise = page.waitForEvent('filechooser');
  await importButton.click();
  const chooser = await chooserPromise;
  page.once('dialog', dialog => dialog.accept());
  await chooser.setFiles({
    name: 'damaged-workspace.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('not-a-zip'),
  });

  await expect(page.locator('#notification-container')).not.toBeEmpty();
  await expect(importButton).toBeEnabled();
  expect(await page.locator('.story-card h3').allTextContents()).toEqual(before);
});
