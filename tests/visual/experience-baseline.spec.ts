import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

const BASELINE_COMMIT = '09d8d2f';
const baselineRoot = resolve('artifacts', 'experience-baseline', BASELINE_COMMIT);
const artifactRoot = resolve('artifacts', 'experience-current', BASELINE_COMMIT);
const desktopViewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
] as const;
const playerViewports = [
  ...desktopViewports,
  { name: '390x844', width: 390, height: 844 },
] as const;
const approvedIncrementalStates = new Set([
  'dashboard',
  'editor-default',
  'editor-node-panel',
  'editor-edge-panel',
]);
const approvedCompositorNoiseStates = new Set(['chat-ending']);

interface CapturedState {
  name: string;
  viewport: string;
  url: string;
  title: string;
  visibleText: string;
  interactiveNames: string[];
  landmarks: Record<string, number>;
  root: {
    selector: string;
    box: { x: number; y: number; width: number; height: number };
    style: Record<string, string>;
  };
}

function pixelDifference(actual: Buffer, expected: Buffer): { changedPixels: number; maxChannelDelta: number } {
  const actualPng = PNG.sync.read(actual);
  const expectedPng = PNG.sync.read(expected);
  if (actualPng.width !== expectedPng.width || actualPng.height !== expectedPng.height) {
    return { changedPixels: Number.POSITIVE_INFINITY, maxChannelDelta: 255 };
  }
  let changedPixels = 0;
  let maxChannelDelta = 0;
  for (let offset = 0; offset < actualPng.data.length; offset += 4) {
    let pixelDelta = 0;
    for (let channel = 0; channel < 4; channel += 1) {
      pixelDelta = Math.max(pixelDelta, Math.abs(actualPng.data[offset + channel] - expectedPng.data[offset + channel]));
    }
    if (pixelDelta > 0) changedPixels += 1;
    maxChannelDelta = Math.max(maxChannelDelta, pixelDelta);
  }
  return { changedPixels, maxChannelDelta };
}

const imageData = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"%3E%3Crect width="1200" height="675" fill="%231d2b3a"/%3E%3Cpath d="M0 520L300 300L520 470L760 180L1200 560V675H0Z" fill="%234c6a72"/%3E%3Ccircle cx="900" cy="150" r="70" fill="%23f5d08a"/%3E%3C/svg%3E';

function fixtureStory(id: string, renderStyle: 'visual-novel' | 'chat') {
  const now = '2026-08-02T00:00:00.000Z';
  const image = {
    assetId: imageData,
    fileName: 'baseline.svg',
    mimeType: 'image/svg+xml',
    size: imageData.length,
    hash: 'baseline-image',
    width: 1200,
    height: 675,
    position: 'center' as const,
    label: '月台',
  };
  const document = {
    format: 'mo.story' as const,
    version: 2 as const,
    id,
    meta: {
      title: renderStyle === 'chat' ? '基线聊天故事' : '基线视觉故事',
      author: '墨水基线',
      description: '用于冻结播放器结构、文案和交互的确定性作品。',
    },
    entrySceneId: '1',
    scenes: [
      {
        id: '1', type: 'start' as const,
        content: { text: '**列车已经进站。**\n你要从哪一侧下车？', typewriterSpeed: 0 },
        choices: [{ id: 'choice-platform', text: '走向月台', targetSceneId: '2' }],
        media: {}, tags: ['序章'], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
      },
      {
        id: '2', type: 'normal' as const,
        content: { text: '月光落在空旷站台上，远处的钟正好敲响。', typewriterSpeed: 0 },
        choices: [{ id: 'choice-ending', text: '沿灯光继续前行', targetSceneId: '3' }],
        media: {
          background: image,
          characters: [{ ...image, horizontalPosition: 'center' as const, verticalPosition: 'bottom' as const, scale: 0.55 }],
        },
        tags: ['探索'], ruleIds: { onEnter: [], onLeave: [] },
        extensionData: {
          'ui-config': {
            dialogBoxPosition: 'bottom', dialogBoxHeight: 200, dialogBoxWidth: 90,
            dialogBoxOpacity: 0.85, dialogBoxPadding: 24, dialogBoxRadius: 12,
            dialogBoxBlur: 15, dialogBoxFontSize: 18,
          },
        },
      },
      {
        id: '3', type: 'ending' as const,
        content: { text: '天亮以前，你终于找到了出口。', typewriterSpeed: 0 },
        choices: [], media: {}, tags: ['结局'], ruleIds: { onEnter: [], onLeave: [] }, extensionData: {},
      },
    ],
    variables: [
      { id: 'health', label: '生命', type: 'number' as const, defaultValue: 84, source: 'user' as const, displayInPlayer: true, displayOrder: 1 },
      { id: 'ticket', label: '车票', type: 'boolean' as const, defaultValue: true, source: 'user' as const, displayInPlayer: true, displayOrder: 2 },
    ],
    rules: [],
    presentation: {
      templateId: renderStyle === 'chat' ? 'builtin.chat' : 'builtin.visual-novel',
      settings: { stylePluginId: 'vn-style.pixel' }, sceneVariants: {},
    },
    extensionData: {}, createdAt: now, updatedAt: now,
  };
  return {
    id,
    document,
    editorState: {
      scenePositions: { '1': { x: 80, y: 180 }, '2': { x: 520, y: 180 }, '3': { x: 960, y: 180 } },
      viewport: { x: 0, y: 0, zoom: 1 }, selectedSceneId: null, selectedChoiceId: null,
    },
    revision: 1,
    updatedAt: now,
  };
}

async function seedStories(page: Page): Promise<void> {
  await page.goto('/mo/#/app');
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.evaluate(async stories => {
    const database = await new Promise<IDBDatabase>((resolveOpen, rejectOpen) => {
      const request = indexedDB.open('mo-workspace');
      request.onerror = () => rejectOpen(request.error);
      request.onsuccess = () => resolveOpen(request.result);
    });
    const transaction = database.transaction('stories', 'readwrite');
    for (const story of stories) transaction.objectStore('stories').put(story);
    await new Promise<void>((resolveTransaction, rejectTransaction) => {
      transaction.oncomplete = () => resolveTransaction();
      transaction.onerror = () => rejectTransaction(transaction.error);
      transaction.onabort = () => rejectTransaction(transaction.error);
    });
    database.close();
  }, [fixtureStory('baseline-visual', 'visual-novel'), fixtureStory('baseline-chat', 'chat')]);
}

async function disableMotion(page: Page): Promise<void> {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-delay: 0s !important;
      animation-duration: 0s !important;
      caret-color: transparent !important;
      scroll-behavior: auto !important;
      transition-delay: 0s !important;
      transition-duration: 0s !important;
    }
  ` });
}

async function capture(page: Page, name: string, viewport: string, rootSelector: string): Promise<CapturedState> {
  await disableMotion(page);
  await expect(page.locator(rootSelector).first()).toBeVisible();
  const fileName = `${name}-${viewport}.png`;
  const screenshot = await page.screenshot({ path: resolve(artifactRoot, fileName), animations: 'disabled' });
  const baseline = await readFile(resolve(baselineRoot, fileName));
  if (approvedIncrementalStates.has(name)) {
    expect(screenshot.byteLength, `${fileName} 增量截图为空`).toBeGreaterThan(2_000);
    expect(baseline.byteLength, `${fileName} 基线截图为空`).toBeGreaterThan(2_000);
  } else {
    const difference = pixelDifference(screenshot, baseline);
    if (approvedCompositorNoiseStates.has(name)) {
      expect(difference.maxChannelDelta, `${fileName} 色阶差异过大`).toBeLessThanOrEqual(1);
      expect(difference.changedPixels, `${fileName} 合成差异像素过多`).toBeLessThanOrEqual(16);
    } else {
      expect(difference, `${fileName} 与 ${BASELINE_COMMIT} 像素不一致`).toEqual({ changedPixels: 0, maxChannelDelta: 0 });
    }
  }
  return page.evaluate(({ stateName, viewportName, selector }) => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) throw new Error(`基线根元素不存在: ${selector}`);
    const box = root.getBoundingClientRect();
    const style = getComputedStyle(root);
    const visible = (element: Element) => {
      const html = element as HTMLElement;
      const rect = html.getBoundingClientRect();
      const computed = getComputedStyle(html);
      return rect.width > 0 && rect.height > 0 && computed.visibility !== 'hidden' && computed.display !== 'none';
    };
    const interactiveNames = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [tabindex="0"]')]
      .filter(visible)
      .map(element => {
        const html = element as HTMLInputElement;
        return (element.getAttribute('aria-label') || element.getAttribute('title') || html.placeholder || element.textContent || '').replace(/\s+/g, ' ').trim();
      })
      .filter(Boolean);
    return {
      name: stateName,
      viewport: viewportName,
      url: location.hash,
      title: document.title,
      visibleText: (document.body.innerText || '').replace(/\s+/g, ' ').trim(),
      interactiveNames,
      landmarks: Object.fromEntries(['header', 'nav', 'main', 'section', 'aside', 'dialog', 'button', 'input', 'select', 'textarea'].map(tag => [tag, [...document.querySelectorAll(tag)].filter(visible).length])),
      root: {
        selector,
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        style: {
          display: style.display,
          position: style.position,
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          borderRadius: style.borderRadius,
        },
      },
    };
  }, { stateName: name, viewportName: viewport, selector: rootSelector });
}

async function open(page: Page, route: string, selector: string): Promise<void> {
  await page.goto(`/mo/#/${route}`);
  await expect(page.locator(selector).first()).toBeVisible();
}

test('验证 09d8d2f 体验基线', async ({ page }) => {
  test.setTimeout(180_000);
  await mkdir(artifactRoot, { recursive: true });
  const consoleErrors: string[] = [];
  const states: CapturedState[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await seedStories(page);

  for (const viewport of desktopViewports) {
    await page.setViewportSize(viewport);
    await open(page, '', '.landing-twine');
    states.push(await capture(page, 'landing', viewport.name, '.landing-twine'));
    await page.getByRole('button', { name: '本地版本' }).click();
    states.push(await capture(page, 'landing-qr', viewport.name, '.qr-modal-content'));

    await open(page, 'statement', '.statement-page');
    states.push(await capture(page, 'statement', viewport.name, '.statement-page'));
    await open(page, 'app', '.dashboard');
    states.push(await capture(page, 'dashboard', viewport.name, '.dashboard'));
    await open(page, 'plugins', '.plugin-store-container');
    states.push(await capture(page, 'plugins', viewport.name, '.plugin-store-container'));

    await open(page, 'editor/baseline-visual', '.editor-container');
    states.push(await capture(page, 'editor-default', viewport.name, '.editor-container'));
    await page.locator('.react-flow__node').first().click();
    states.push(await capture(page, 'editor-node-panel', viewport.name, '[data-testid="bottom-edit-panel"]'));
    await page.getByTestId('bottom-edit-panel').getByRole('button', { name: '关闭' }).click();
    await page.locator('.react-flow__edge').first().click({ force: true });
    states.push(await capture(page, 'editor-edge-panel', viewport.name, '.edge-edit-panel'));
  }

  for (const viewport of playerViewports) {
    await page.setViewportSize(viewport);
    await open(page, 'play/baseline-visual', '.start-screen');
    states.push(await capture(page, 'visual-start', viewport.name, '.start-screen'));
    await page.getByRole('button', { name: '开始游戏' }).click();
    states.push(await capture(page, 'visual-play', viewport.name, '.vn-player'));
    await page.locator('.vn-menu-button').click();
    states.push(await capture(page, 'visual-menu', viewport.name, '.game-menu-panel'));
    await page.locator('.game-menu-close').click();
    await page.locator('.vn-choice-link').first().click();
    await page.locator('.vn-choice-link').first().click();
    states.push(await capture(page, 'visual-ending', viewport.name, '.vn-player'));

    await open(page, 'play/baseline-chat', '.chat-start-screen');
    states.push(await capture(page, 'chat-start', viewport.name, '.chat-player'));
    await page.getByRole('button', { name: '开始游戏' }).click();
    states.push(await capture(page, 'chat-play', viewport.name, '.chat-player'));
    await page.locator('.chat-menu-button').click();
    states.push(await capture(page, 'chat-menu', viewport.name, '.chat-game-menu'));
    await page.reload();
    await expect(page.locator('.chat-start-screen')).toBeVisible();
    await page.getByRole('button', { name: '开始游戏' }).click();
    await page.locator('.chat-choice-link').first().click();
    await page.locator('.chat-choice-link').first().click();
    states.push(await capture(page, 'chat-ending', viewport.name, '.chat-player'));
  }

  await writeFile(resolve(artifactRoot, 'contract.json'), `${JSON.stringify({
    commit: BASELINE_COMMIT,
    capturedAt: new Date().toISOString(),
    operationSteps: {
      createStory: 1,
      openStory: 1,
      openNodePanel: 1,
      startPlayer: 1,
      openPlayerMenu: 1,
      chooseStoryBranch: 1,
    },
    consoleErrors,
    states,
  }, null, 2)}\n`, 'utf8');

  expect(states).toHaveLength(40);
  expect(consoleErrors).toEqual([]);
});
