import { expect, test } from '@playwright/test';

test('首页首屏不加载编辑器、Blockly 或模板运行代码', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/mo/#/');
  await expect(page.locator('.landing-twine')).toBeVisible();
  expect(scripts.join('\n')).not.toMatch(/Editor|blockly|template-player|reactflow/i);
});
