import { expect, test, type Page } from '@playwright/test';
import { readStoredStory } from '../e2e/helpers.ts';

async function seedLargeStory(page: Page, nodeCount: number): Promise<string> {
  await page.goto('/mo/#/app');
  await expect(page.locator('.dashboard')).toBeVisible();
  return page.evaluate(async count => {
    const id = `stress-${count}-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const document = {
      format: 'mo.story', version: 2, id,
      meta: { title: `${count} 节点压力作品`, author: '压力测试', description: '' },
      entrySceneId: 'scene-1',
      scenes: Array.from({ length: count }, (_, index) => ({
        id: `scene-${index + 1}`,
        type: index === 0 ? 'start' : index === count - 1 ? 'ending' : 'normal',
        content: { text: `压力节点 ${index + 1}`, typewriterSpeed: 0 },
        choices: index === count - 1 ? [] : [{
          id: `choice-${index + 1}`,
          text: '继续',
          targetSceneId: index === 0 && count > 2 ? 'scene-3' : `scene-${index + 2}`,
        }],
        media: {}, tags: [], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
      })),
      variables: [], rules: [],
      presentation: { templateId: 'builtin.visual-novel', settings: {}, sceneVariants: {} },
      extensionData: {}, createdAt: now, updatedAt: now,
    };
    const editorState = {
      scenePositions: Object.fromEntries(Array.from({ length: count }, (_, index) => [
        `scene-${index + 1}`,
        { x: (index % 20) * 500, y: Math.floor(index / 20) * 300 },
      ])),
      viewport: { x: 0, y: 0, zoom: 1 }, selectedSceneId: null, selectedChoiceId: null,
    };
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mo-workspace');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = database.transaction('stories', 'readwrite');
    transaction.objectStore('stories').put({ id, document, editorState, revision: 1, updatedAt: now });
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
    test(`${nodeCount} 节点全链编辑、试玩和刷新恢复`, async ({ page }) => {
      const storyId = await seedLargeStory(page, nodeCount);
      const loadStartedAt = performance.now();
      await page.goto(`/mo/#/editor/${storyId}`);
      await expect(page.locator('.react-flow')).toBeVisible();
      await expect(page.getByText(`(${nodeCount}个)`, { exact: true })).toBeVisible();
      const loadMs = performance.now() - loadStartedAt;

      const visibleNodes = await page.locator('.react-flow__node').count();
      expect(visibleNodes).toBeGreaterThan(0);
      if (nodeCount >= 500) expect(visibleNodes).toBeLessThan(nodeCount);
      await page.evaluate(() => {
        const state = window as Window & { __moStressLongTasks?: number[]; __moStressObserver?: PerformanceObserver };
        state.__moStressLongTasks = [];
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
          state.__moStressObserver = new PerformanceObserver(list => {
            state.__moStressLongTasks!.push(...list.getEntries().map(entry => entry.duration));
          });
          state.__moStressObserver.observe({ entryTypes: ['longtask'] });
        }
      });

      const operationMs: Record<string, number> = {};
      const measure = async (name: string, action: () => Promise<void>): Promise<void> => {
        const startedAt = performance.now();
        await action();
        operationMs[name] = Math.round(performance.now() - startedAt);
      };

      await measure('searchAndSelect', async () => {
        await page.getByRole('button', { name: /全部节点/ }).click();
        await page.getByPlaceholder('搜索节点内容...').fill(`压力节点 ${nodeCount}`);
        await expect(page.getByText('找到 1 个节点', { exact: false })).toBeVisible();
        await page.locator(`.node-tag[title="压力节点 ${nodeCount}"]`).click();
        await expect(page.getByTestId('bottom-edit-panel')).toBeVisible();
      });

      const editedText = `压力节点 ${nodeCount}，正文编辑已保存。`;
      await measure('editBody', async () => {
        await page.getByPlaceholder(/输入小说内容/).fill(editedText);
        await page.getByTestId('bottom-edit-panel').getByRole('button', { name: '关闭' }).click();
        await expect.poll(async () => (
          await readStoredStory(page, storyId)
        )?.document.scenes.find(scene => scene.id === `scene-${nodeCount}`)?.content.text).toBe(editedText);
      });

      await page.getByPlaceholder('搜索节点内容...').fill('压力节点 1');
      await page.locator('.node-tag[title="压力节点 1"]').click();
      await expect(page.getByTestId('bottom-edit-panel')).toBeVisible();
      await page.getByTestId('bottom-edit-panel').getByRole('button', { name: '关闭' }).click();

      const firstNode = page.locator('.react-flow__node[data-id="scene-1"]');
      const secondNode = page.locator('.react-flow__node[data-id="scene-2"]');
      await expect(firstNode).toBeVisible();
      await expect(secondNode).toBeVisible();
      const positionBeforeMove = (await readStoredStory(page, storyId))!.editorState.scenePositions['scene-1'];
      await measure('moveNode', async () => {
        const box = await firstNode.boundingBox();
        if (!box) throw new Error('无法读取压力节点边界');
        await page.mouse.move(box.x + box.width / 2, box.y + 30);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 48, box.y + 62, { steps: 6 });
        await page.mouse.up();
        await expect.poll(async () => {
          const position = (await readStoredStory(page, storyId))!.editorState.scenePositions['scene-1'];
          return position.x !== positionBeforeMove.x || position.y !== positionBeforeMove.y;
        }).toBe(true);
      });

      if (await page.getByTestId('bottom-edit-panel').isVisible()) {
        await page.getByTestId('bottom-edit-panel').getByRole('button', { name: '关闭' }).click();
      }
      await measure('connectNodes', async () => {
        const source = firstNode.locator('.react-flow__handle.source').first();
        const target = secondNode.locator('.react-flow__handle.target').first();
        const sourceBox = await source.boundingBox();
        const targetBox = await target.boundingBox();
        if (!sourceBox || !targetBox) throw new Error('无法读取压力连线端点');
        await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
        await page.mouse.up();
        await expect.poll(async () => (
          await readStoredStory(page, storyId)
        )?.document.scenes[0].choices[0].targetSceneId).toBe('scene-2');
      });

      const before = await readStoredStory(page, storyId);
      const saveStartedAt = performance.now();
      await page.getByRole('button', { name: '添加节点' }).click();
      await expect(page.getByText(`(${nodeCount + 1}个)`, { exact: true })).toBeVisible();
      await expect.poll(async () => (await readStoredStory(page, storyId))?.document.scenes.length, {
        timeout: 30_000,
        intervals: [50, 100, 250, 500],
      }).toBe(nodeCount + 1);
      operationMs.addAndSave = Math.round(performance.now() - saveStartedAt);
      const after = await readStoredStory(page, storyId);
      expect(after!.revision).toBeGreaterThan(before!.revision);

      await measure('switchTemplate', async () => {
        await page.getByRole('button', { name: '选择播放器模板' }).click();
        await page.locator('[data-template-id="builtin.chapter-book"]').getByRole('button', { name: '使用此模板' }).click();
        await expect.poll(async () => (await readStoredStory(page, storyId))?.document.presentation.templateId).toBe('builtin.chapter-book');
      });

      const longTaskSummary = await page.evaluate(() => {
        const state = window as Window & { __moStressLongTasks?: number[]; __moStressObserver?: PerformanceObserver };
        state.__moStressObserver?.disconnect();
        const durations = state.__moStressLongTasks ?? [];
        return { count: durations.length, maxMs: Math.round(Math.max(0, ...durations)) };
      });

      await measure('play', async () => {
        await page.getByRole('button', { name: '播放', exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`/play/${storyId}`));
        await page.getByRole('button', { name: '开始游戏' }).click();
        await expect(page.locator('[data-player-template="builtin.chapter-book"]')).toBeVisible();
      });

      await page.goto(`/mo/#/editor/${storyId}`);
      await expect(page.locator('.react-flow')).toBeVisible();

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
        visibleNodes,
        longTaskSummary,
        operationMs,
      }));
      const loadBudget = nodeCount === 100 ? 300 : nodeCount === 500 ? 600 : 900;
      const reloadBudget = nodeCount === 100 ? 250 : nodeCount === 500 ? 350 : 500;
      const heapBudget = (nodeCount === 100 ? 64 : nodeCount === 500 ? 128 : 160) * 1024 * 1024;
      expect(loadMs).toBeLessThan(loadBudget);
      expect(reloadMs).toBeLessThan(reloadBudget);
      if (heapBytes > 0) expect(heapBytes).toBeLessThan(heapBudget);
      for (const duration of Object.values(operationMs)) expect(duration).toBeLessThan(10_000);

      const recovered = await readStoredStory(page, storyId);
      expect(recovered?.document.presentation.templateId).toBe('builtin.chapter-book');
      expect(recovered?.document.scenes[0].choices[0].targetSceneId).toBe('scene-2');
      expect(recovered?.document.scenes.find(scene => scene.id === `scene-${nodeCount}`)?.content.text).toBe(editedText);
    });
  }
}
