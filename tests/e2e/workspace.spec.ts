import { expect, test } from '@playwright/test';
import { createStory, openDashboard, readStoredStory, waitForStory } from './helpers.ts';

test('GitHub Pages 子路径、Hash 深链与首次作品库', async ({ page }) => {
  const markdownRequests: string[] = [];
  page.on('request', request => {
    if (request.url().endsWith('.md')) markdownRequests.push(request.url());
  });

  await page.goto('/mo/');
  await expect(page.getByText('墨水', { exact: true })).toBeVisible();
  await expect(page.getByText('墨水 / MO', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '本地版本' }).click();
  await expect(page.getByRole('heading', { name: '扫码加入微信群' })).toBeVisible();
  await expect(page.getByAltText('微信群二维码')).toBeVisible();
  await page.locator('.qr-modal-close').click();
  await expect(page.getByRole('heading', { name: '扫码加入微信群' })).toHaveCount(0);
  await page.getByRole('button', { name: '重要声明' }).click();
  await expect(page.getByRole('heading', { name: '重要声明 / Important Notice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '关于保存 / About Saving' })).toBeVisible();
  await page.getByRole('button', { name: '返回首页' }).click();
  expect(markdownRequests).toEqual([]);
  await page.getByRole('button', { name: '在线使用' }).click();
  await expect(page.locator('.story-card')).toHaveCount(2);
  await expect(page.getByText('墨水编辑器开发实例：survive!')).toBeVisible();
  await expect(page.getByText('墨水编辑器开发实例：雾都疑案')).toBeVisible();

  await page.goto('/mo/#/plugins');
  await expect(page.getByRole('heading', { name: '插件商店' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '插件商店' })).toBeVisible();
});

test('创建、编辑、自动保存和刷新恢复', async ({ page }) => {
  const storyId = await createStory(page);
  const initial = await readStoredStory(page, storyId);
  expect(initial?.revision).toBe(1);

  const title = `自动保存_${Date.now()}`;
  await page.getByPlaceholder('我的互动小说').fill(title);
  const titleSaved = await waitForStory(page, storyId, stored => stored?.document.meta.title === title);
  expect(titleSaved.revision).toBeGreaterThan(1);

  await page.locator('.react-flow__node').first().click();
  const panel = page.getByTestId('bottom-edit-panel');
  await expect(panel).toBeVisible();
  const text = `节点正文_${Date.now()}`;
  await panel.getByPlaceholder(/输入小说内容/).fill(text);
  await panel.getByRole('button', { name: '关闭' }).click();
  await waitForStory(page, storyId, stored => stored?.document.scenes[0]?.content.text === text);

  await page.reload();
  await expect(page.getByPlaceholder('我的互动小说')).toHaveValue(title);
  await page.locator('.react-flow__node').first().click();
  await expect(page.getByTestId('bottom-edit-panel').getByPlaceholder(/输入小说内容/)).toHaveValue(text);
});

test('同一作品第二标签只读，外部 revision 冲突停止保存', async ({ page, context }) => {
  const storyId = await createStory(page);
  const secondPage = await context.newPage();
  await secondPage.goto(`/mo/#/editor/${storyId}`);
  await expect(secondPage.locator('.editor-readonly-banner')).toBeVisible();
  await secondPage.locator('.react-flow__node').first().click();
  await expect(secondPage.getByTestId('bottom-edit-panel')).toHaveCount(0);

  await page.getByPlaceholder('我的互动小说').fill(`本地待保存_${Date.now()}`);
  await expect.poll(() => page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }), { timeout: 450, intervals: [20, 30, 50] }).toBe(true);

  await secondPage.evaluate(async id => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mo-workspace');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = database.transaction('stories', 'readwrite');
    const store = transaction.objectStore('stories');
    const current = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as Record<string, unknown>);
    });
    const revision = Number(current.revision) + 1;
    store.put({ ...current, revision });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
    const channel = new BroadcastChannel('mo-workspace-events');
    channel.postMessage({ type: 'story-changed', storyId: id, revision, sourceTabId: 'e2e-external' });
    channel.close();
  }, storyId);

  await expect(page.locator('.editor-save-error')).toBeVisible();
});

test('插件配置和主题只在变更时持久化', async ({ page }) => {
  await page.goto('/mo/#/plugins');
  const validatorCard = page.locator('.plugin-card').filter({ hasText: '故事验证器' });
  const validatorToggle = validatorCard.locator('input[type="checkbox"]');
  await expect(validatorToggle).toBeChecked();
  await validatorCard.locator('.toggle-switch').click();
  await expect(validatorToggle).not.toBeChecked();

  const darkCard = page.locator('.plugin-card').filter({ hasText: '夜间模式' });
  await darkCard.locator('.toggle-switch').click();
  await expect(page.locator('body')).toHaveClass(/theme-dark/);

  await page.reload();
  await expect(page.locator('.plugin-store-container')).toBeVisible();
  await expect(page.locator('.plugin-card').filter({ hasText: '故事验证器' }).locator('input')).not.toBeChecked();
  await expect(page.locator('body')).toHaveClass(/theme-dark/);
});

test('首次加载后可以离线刷新作品库', async ({ page, context }) => {
  await openDashboard(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.locator('.dashboard')).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.dashboard')).toBeVisible();
  await expect(page.locator('.story-card')).toHaveCount(2);
  await context.setOffline(false);
});
