import { expect, test } from '@playwright/test';
import { createStory, waitForStory } from './helpers.ts';

const viewports = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
] as const;

async function expectUsableLayout(page: import('@playwright/test').Page, selector: string): Promise<void> {
  const layout = await page.locator(selector).evaluate(root => {
    const clippedButtons = [...root.querySelectorAll<HTMLElement>('button')].filter(button => {
      const style = getComputedStyle(button);
      const box = button.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || box.width === 0 || box.height === 0) return false;
      return box.left < -1 || box.right > innerWidth + 1;
    });
    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      rootOverflow: root.scrollWidth - root.clientWidth,
      clippedButtons: clippedButtons.length,
    };
  });
  expect(layout.documentOverflow).toBeLessThanOrEqual(1);
  expect(layout.rootOverflow).toBeLessThanOrEqual(1);
  expect(layout.clippedButtons).toBe(0);
}

async function contrastRatio(page: import('@playwright/test').Page, selector: string): Promise<number> {
  return page.locator(selector).first().evaluate(element => {
    const parse = (value: string): [number, number, number] => {
      const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      if (!channels || channels.length < 3) throw new Error(`无法解析颜色: ${value}`);
      return channels as [number, number, number];
    };
    const luminance = (channels: [number, number, number]): number => {
      const linear = channels.map(channel => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const foreground = luminance(parse(getComputedStyle(element).color));
    let backgroundElement: Element | null = element;
    let background = 'rgba(0, 0, 0, 0)';
    while (backgroundElement && /rgba?\([^)]*,\s*0(?:\.0+)?\)$/.test(background)) {
      background = getComputedStyle(backgroundElement).backgroundColor;
      backgroundElement = backgroundElement.parentElement;
    }
    const surface = luminance(parse(background));
    return (Math.max(foreground, surface) + 0.05) / (Math.min(foreground, surface) + 0.05);
  });
}

test('键盘、焦点、长文本、减少动画和三视口保持可用', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const storyId = await createStory(page);
  const templateTrigger = page.getByRole('button', { name: '选择播放器模板' });
  await templateTrigger.focus();
  await page.keyboard.press('Enter');
  const gallery = page.locator('[data-template-gallery]');
  await expect(gallery).toBeVisible();
  await expect.poll(() => gallery.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  await expect.poll(() => gallery.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(templateTrigger).toBeFocused();

  const longTitle = '一段用于验证编辑器长标题不会遮挡工具和模板入口的确定性标题'.repeat(3);
  const longBody = '长正文需要在桌面和手机玩家中保持可读，不能遮挡选择、菜单或返回路径。'.repeat(30);
  await page.getByPlaceholder('我的互动小说').fill(longTitle);
  await page.locator('.react-flow__node').first().click();
  await page.getByPlaceholder(/输入小说内容/).fill(longBody);
  await page.getByTestId('bottom-edit-panel').getByRole('button', { name: '关闭' }).click();
  await waitForStory(page, storyId, stored => stored?.document.meta.title === longTitle && stored.document.scenes[0].content.text === longBody);

  for (const viewport of viewports.slice(0, 2)) {
    await page.setViewportSize(viewport);
    await expectUsableLayout(page, '.editor-container');
  }
  for (const zoomViewport of [{ width: 1152, height: 720 }, { width: 960, height: 600 }]) {
    await page.setViewportSize(zoomViewport);
    await expectUsableLayout(page, '.editor-container');
  }
  expect(await contrastRatio(page, '.editor-sidebar .form-group label')).toBeGreaterThanOrEqual(4.5);
  const transitionDuration = await page.locator('.editor-canvas').evaluate(element => getComputedStyle(element).transitionDuration);
  expect(parseFloat(transitionDuration)).toBeLessThanOrEqual(0.01);

  await page.getByRole('button', { name: '播放', exact: true }).click();
  await page.getByRole('button', { name: '开始游戏' }).click();
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(page.locator('[data-player-template]')).toBeVisible();
    await expectUsableLayout(page, '[data-player-template]');
  }
});
