import { expect, type Page } from '@playwright/test';

export interface BrowserStoredStory {
  id: string;
  revision: number;
  story: {
    meta: { title: string; renderStyle?: 'visual-novel' | 'chat' };
    nodes: Array<{ id: string; data: { text: string } }>;
  };
}

export async function openDashboard(page: Page): Promise<void> {
  await page.goto('/mo/#/app');
  await expect(page.locator('.dashboard')).toBeVisible();
}

export async function createStory(page: Page): Promise<string> {
  await openDashboard(page);
  await page.getByRole('button', { name: '创建新作品' }).click();
  await expect(page.locator('.react-flow')).toBeVisible();
  const match = new URL(page.url()).hash.match(/^#\/editor\/(.+)$/);
  if (!match) throw new Error(`无法从编辑器 URL 读取作品 ID: ${page.url()}`);
  return match[1];
}

export async function readStoredStory(page: Page, storyId: string): Promise<BrowserStoredStory | null> {
  return page.evaluate(id => new Promise<BrowserStoredStory | null>((resolve, reject) => {
    const request = indexedDB.open('mo-workspace');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('stories', 'readonly');
      const getRequest = transaction.objectStore('stories').get(id);
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        resolve((getRequest.result as BrowserStoredStory | undefined) ?? null);
        database.close();
      };
    };
  }), storyId);
}

export async function waitForStory(
  page: Page,
  storyId: string,
  predicate: (stored: BrowserStoredStory | null) => boolean,
): Promise<BrowserStoredStory> {
  await expect.poll(async () => predicate(await readStoredStory(page, storyId)), {
    timeout: 10_000,
    intervals: [50, 100, 250, 500],
  }).toBe(true);
  const stored = await readStoredStory(page, storyId);
  if (!stored) throw new Error(`作品 ${storyId} 未写入 IndexedDB`);
  return stored;
}
