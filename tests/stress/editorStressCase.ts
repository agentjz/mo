import { expect, test, type Page } from '@playwright/test';
import { readStoredStory } from '../e2e/helpers.ts';

async function seedLargeStory(page: Page, nodeCount: number): Promise<string> {
  await page.goto('/mo/#/app');
  await expect(page.locator('.dashboard')).toBeVisible();
  return page.evaluate(async count => {
    const id = `stress-${count}-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const nodes = Array.from({ length: count }, (_, index) => ({
      id: String(index + 1),
      type: 'storyNode',
      position: { x: (index % 20) * 500, y: Math.floor(index / 20) * 300 },
      data: {
        nodeId: index + 1,
        nodeType: index === 0 ? 'start' : index === count - 1 ? 'ending' : 'normal',
        text: `压力节点 ${index + 1}`,
        choices: index === count - 1 ? [] : [{ id: `c${index + 1}`, text: '继续' }],
      },
    }));
    const edges = Array.from({ length: count - 1 }, (_, index) => ({
      id: `e${index + 1}`,
      source: String(index + 1),
      target: String(index + 2),
      sourceHandle: `c${index + 1}`,
    }));
    const story = {
      id,
      meta: {
        title: `${count} 节点压力作品`,
        author: '压力测试',
        description: '',
        start_node: 1,
        displayMode: 'visual-novel',
        renderStyle: 'visual-novel',
      },
      nodes,
      edges,
      variables: [],
      createdAt: now,
      updatedAt: now,
    };
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mo-workspace');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = database.transaction('stories', 'readwrite');
    transaction.objectStore('stories').put({ id, story, revision: 1, updatedAt: now });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
    return id;
  }, nodeCount);
}

export function defineEditorStressTests(nodeCounts: readonly number[], timeout: number): void {
  test.setTimeout(timeout);

  for (const nodeCount of nodeCounts) {
    test(`${nodeCount} 节点加载、编辑、保存和刷新恢复`, async ({ page }) => {
      const storyId = await seedLargeStory(page, nodeCount);
      const loadStartedAt = performance.now();
      await page.goto(`/mo/#/editor/${storyId}`);
      await expect(page.locator('.react-flow')).toBeVisible();
      await expect(page.getByText(`(${nodeCount}个)`, { exact: true })).toBeVisible();
      const loadMs = performance.now() - loadStartedAt;

      const visibleNodes = await page.locator('.react-flow__node').count();
      expect(visibleNodes).toBeGreaterThan(0);
      if (nodeCount >= 500) expect(visibleNodes).toBeLessThan(nodeCount);

      const before = await readStoredStory(page, storyId);
      await page.getByRole('button', { name: '添加节点' }).click();
      await expect(page.getByText(`(${nodeCount + 1}个)`, { exact: true })).toBeVisible();
      await expect.poll(async () => (await readStoredStory(page, storyId))?.story.nodes.length, {
        timeout: 30_000,
        intervals: [50, 100, 250, 500],
      }).toBe(nodeCount + 1);
      const after = await readStoredStory(page, storyId);
      expect(after!.revision).toBeGreaterThan(before!.revision);

      const reloadStartedAt = performance.now();
      await page.reload();
      await expect(page.getByText(`(${nodeCount + 1}个)`, { exact: true })).toBeVisible();
      const reloadMs = performance.now() - reloadStartedAt;
      const heapBytes = await page.evaluate(() => {
        const memory = performance as Performance & { memory?: { usedJSHeapSize: number } };
        return memory.memory?.usedJSHeapSize ?? 0;
      });

      console.log(JSON.stringify({
        nodeCount,
        loadMs: Math.round(loadMs),
        reloadMs: Math.round(reloadMs),
        heapBytes,
      }));
      expect(loadMs).toBeLessThan(20_000);
      expect(reloadMs).toBeLessThan(20_000);
      if (heapBytes > 0) expect(heapBytes).toBeLessThan(512 * 1024 * 1024);
    });
  }
}
