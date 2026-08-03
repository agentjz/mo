import { expect, test } from '@playwright/test';
import { createStory } from './helpers.ts';

test('本地创作端口支持查询、dry-run、审阅拒绝和原子接受', async ({ page }) => {
  const storyId = await createStory(page);
  const port = await page.evaluate(() => Boolean(window.moAuthoring));
  expect(port).toBe(true);
  const result = await page.evaluate(async id => {
    const before = await window.moAuthoring!.query(id);
    const review = await window.moAuthoring!.submit({
      storyId: id,
      expectedRevision: before.revision,
      dryRun: true,
      commands: [{ version: 1, type: 'update-meta', patch: { title: '端口审阅标题' } }],
    });
    const after = await window.moAuthoring!.query(id);
    return { before, review, after };
  }, storyId);
  expect(result.review.committed).toBe(false);
  expect(result.review.diff.length).toBeGreaterThan(0);
  expect(result.after).toEqual(result.before);
});
