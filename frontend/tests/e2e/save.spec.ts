/**
 * 自动保存功能 E2E 测试
 * 测试场景：
 * 1. 编辑节点 → 关闭面板 → 等待0.1秒 → 自动保存 → 刷新验证
 * 2. 编辑节点 → 关闭面板 → 快速刷新 → 数据仍保存
 * 3. 编辑节点 → 关闭面板 → 等待0.1秒 → 自动保存成功 → 刷新验证
 * 4. 连续编辑 → 防抖重置 → 最后一次编辑后0.1秒保存 → 刷新验证
 * 5. 节点面板打开 → 修改标题触发自动保存 → applyChanges被调用 → 刷新验证
 * 6. 上传图片 → 关闭面板 → 等待0.1秒 → 自动保存 → 刷新验证
 * 7. 编辑故事标题 → 等待0.1秒 → 自动保存 → 刷新验证
 */

import { test, expect } from '@playwright/test';

// 测试前准备：登录并创建故事
test.beforeEach(async ({ page }) => {
  // 访问首页
  await page.goto('http://localhost:5173');
  
  // 点击"在线使用"按钮
  await page.click('text=在线使用');
  
  // 等待登录页面加载
  await page.waitForSelector('input#username', { timeout: 10000 });
  
  // 用户名密码登录（固定用户）
  await page.fill('input#username', '2222');
  await page.fill('input#password', '2222');
  await page.click('button.btn-login');
  
  // 等待跳转到Dashboard
  await page.waitForURL('**/app', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // 创建新故事
  await page.click('text=创建新作品');
  await page.waitForURL('**/editor/**', { timeout: 10000 });
  
  // 等待编辑器加载完成
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
});

// 场景1：编辑节点 → 关闭面板 → 等待0.1秒自动保存 → 刷新验证
test('场景1：编辑节点 → 关闭面板 → 等待0.1秒 → 自动保存 → 刷新验证', async ({ page }) => {
  // 1. 点击第一个节点（开始节点）
  await page.locator('.react-flow__node').first().click();
  
  // 2. 等待底部编辑面板出现
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  
  // 3. 在底部编辑面板的文本框输入内容
  const testText = '自动保存测试_' + Date.now();
  const textarea = page.locator('[data-testid="bottom-edit-panel"] textarea').first();
  await textarea.click();
  await textarea.press('Control+A');
  await textarea.pressSequentially(testText, { delay: 50 });
  
  // 4. 关闭编辑面板（触发状态同步到 editor.nodes）
  await page.locator('[data-testid="bottom-edit-panel"] button').filter({ hasText: '关闭' }).click();
  await page.waitForTimeout(300);
  console.log('已关闭面板，数据同步到内存，等待0.1秒自动保存...');
  
  // 5. 等待200ms让自动保存触发（0.1秒防抖 + 100ms余量）
  await page.waitForTimeout(200);
  
  // 6. 刷新页面
  await page.reload();
  
  // 7. 等待编辑器重新加载
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // 8. 再次点击节点
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  
  // 9. 验证：文本应该还在
  const savedText = await page.locator('[data-testid="bottom-edit-panel"] textarea').first().inputValue();
  expect(savedText).toBe(testText);
});

// 场景2：编辑 → 关闭面板 → 快速刷新仍应保存
test('场景2：编辑节点 → 关闭面板 → 快速刷新 → 数据仍保存', async ({ page }) => {
  // 1. 点击节点
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  
  // 2. 在底部编辑面板输入内容
  const testText = '会丢失的文本_' + Date.now();
  const textarea = page.locator('[data-testid="bottom-edit-panel"] textarea').first();
  await textarea.click();
  await textarea.press('Control+A');
  await textarea.pressSequentially(testText, { delay: 50 });
  
  // 3. 关闭编辑面板（触发状态同步）
  await page.locator('[data-testid="bottom-edit-panel"] button').filter({ hasText: '关闭' }).click();
  await page.waitForTimeout(300);
  console.log('已关闭面板，快速刷新验证保存可靠性...');
  
  // 4. 只等待50ms就刷新。关闭面板已经同步节点数据，保存链路不应依赖丢数据窗口。
  await page.waitForTimeout(50);
  
  // 5. 刷新页面
  await page.reload();
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // 6. 再次打开节点
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  
  // 7. 验证：数据应该保存
  const afterReloadText = await page.locator('[data-testid="bottom-edit-panel"] textarea').first().inputValue();
  expect(afterReloadText).toBe(testText);
});

// 场景3：编辑节点后关闭面板，等待自动保存 → 刷新验证
test('场景3：编辑节点 → 关闭面板 → 等待0.1秒 → 自动保存成功 → 刷新验证', async ({ page }) => {
  // 1. 点击节点
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  
  // 2. 在底部编辑面板输入内容
  const testText = '关闭后自动保存_' + Date.now();
  const textarea = page.locator('[data-testid="bottom-edit-panel"] textarea').first();
  await textarea.click();
  await textarea.press('Control+A');
  await textarea.pressSequentially(testText, { delay: 50 });
  
  // 3. 点击编辑面板内的关闭按钮
  await page.locator('[data-testid="bottom-edit-panel"] button').filter({ hasText: '关闭' }).click();
  await page.waitForTimeout(500);
  
  // 4. 验证：编辑面板消失
  await expect(page.locator('[data-testid="bottom-edit-panel"]')).not.toBeVisible();
  
  // 5. 等待200ms让自动保存触发（0.1秒防抖 + 100ms余量）
  console.log('面板关闭后等待0.1秒自动保存...');
  await page.waitForTimeout(200);
  
  // 6. 刷新页面
  await page.reload();
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // 7. 验证：数据应该保存了
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  const savedText = await page.locator('[data-testid="bottom-edit-panel"] textarea').first().inputValue();
  expect(savedText).toBe(testText);
});

// 场景4：连续编辑 - 测试防抖机制（每次关闭面板触发状态同步）→ 刷新验证
test('场景4：连续编辑 → 防抖重置 → 最后一次编辑后0.1秒保存 → 刷新验证', async ({ page }) => {
  // 1. 第一次编辑
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  const textarea = page.locator('[data-testid="bottom-edit-panel"] textarea').first();
  await textarea.click();
  await textarea.press('Control+A');
  await textarea.pressSequentially('第一次编辑', { delay: 50 });
  await page.locator('[data-testid="bottom-edit-panel"] button').filter({ hasText: '关闭' }).click();
  console.log('第一次编辑，关闭面板，等待0.05秒（不够触发保存）...');
  await page.waitForTimeout(50);
  
  // 2. 第二次编辑（防抖重置）
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  const textarea2 = page.locator('[data-testid="bottom-edit-panel"] textarea').first();
  await textarea2.click();
  await textarea2.press('Control+A');
  await textarea2.pressSequentially('第二次编辑', { delay: 50 });
  await page.locator('[data-testid="bottom-edit-panel"] button').filter({ hasText: '关闭' }).click();
  console.log('第二次编辑，关闭面板，等待0.05秒（不够触发保存）...');
  await page.waitForTimeout(50);
  
  // 3. 第三次编辑（最后一次）
  const finalText = '最终文本_' + Date.now();
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  const textarea3 = page.locator('[data-testid="bottom-edit-panel"] textarea').first();
  await textarea3.click();
  await textarea3.press('Control+A');
  await textarea3.pressSequentially(finalText, { delay: 50 });
  await page.locator('[data-testid="bottom-edit-panel"] button').filter({ hasText: '关闭' }).click();
  console.log('第三次编辑（最后一次），关闭面板，等待200ms自动保存...');
  
  // 4. 等待200ms让自动保存触发（从最后一次关闭面板算起，0.1秒防抖 + 100ms余量）
  await page.waitForTimeout(200);
  
  // 5. 刷新验证
  await page.reload();
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  const savedText = await page.locator('[data-testid="bottom-edit-panel"] textarea').first().inputValue();
  
  // 6. 验证：应该保存的是最后一次编辑的内容
  expect(savedText).toBe(finalText);
});

// 场景5：面板打开时，通过修改元数据触发自动保存（测试applyChanges逻辑）→ 刷新验证
test('场景5：节点面板打开 → 修改标题触发自动保存 → applyChanges被调用 → 刷新验证', async ({ page }) => {
  // 1. 先编辑节点但不关闭面板
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  
  const testText = '面板打开自动保存_' + Date.now();
  const textarea = page.locator('[data-testid="bottom-edit-panel"] textarea').first();
  await textarea.click();
  await textarea.press('Control+A');
  await textarea.pressSequentially(testText, { delay: 50 });
  console.log('节点已编辑，但面板保持打开...');
  
  // 2. 不关闭面板，修改故事标题（触发自动保存）
  const titleInput = page.locator('input[placeholder="我的互动小说"]').or(page.locator('label:has-text("标题") + input'));
  await titleInput.first().click();
  await titleInput.first().press('Control+A');
  await titleInput.first().pressSequentially('触发保存_' + Date.now(), { delay: 50 });
  console.log('修改标题，触发状态变化，等待200ms自动保存...');
  
  // 3. 等待200ms让自动保存触发（自动保存会调用 applyChanges 读取节点数据，0.1秒防抖 + 100ms余量）
  await page.waitForTimeout(200);
  
  // 4. 刷新页面
  await page.reload();
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // 5. 验证：节点数据应该保存了（证明自动保存时 applyChanges 被正确调用）
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  const savedText = await page.locator('[data-testid="bottom-edit-panel"] textarea').first().inputValue();
  expect(savedText).toBe(testText);
});

// 场景6：上传图片 → 关闭面板 → 等待0.1秒自动保存 → 刷新验证
test('场景6：上传图片 → 关闭面板 → 等待0.1秒 → 自动保存 → 刷新验证', async ({ page }) => {
  // 1. 点击节点
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  
  // 2. 上传图片（定位隐藏的 file input，路径相对于 frontend/ 目录）
  const fileInput = page.locator('[data-testid="bottom-edit-panel"] input[type="file"]').first();
  await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
  
  // 3. 等待上传完成
  await page.waitForTimeout(1000);
  console.log('图片上传完成，关闭面板...');
  
  // 4. 关闭编辑面板（触发状态同步）
  await page.locator('[data-testid="bottom-edit-panel"] button').filter({ hasText: '关闭' }).click();
  await page.waitForTimeout(300);
  console.log('已关闭面板，等待200ms自动保存...');
  
  // 5. 等待200ms让自动保存触发（0.1秒防抖 + 100ms余量）
  await page.waitForTimeout(200);
  
  // 6. 刷新页面
  await page.reload();
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // 7. 再次打开节点
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 10000 });
  
  // 8. 验证：图片还在（检查是否有"更换"和"删除"按钮）
  const hasChangeButton = await page.locator('[data-testid="bottom-edit-panel"]').locator('button.btn-secondary', { hasText: '更换' }).isVisible()
    .catch(() => false);
  const hasDeleteButton = await page.locator('[data-testid="bottom-edit-panel"]').locator('button.btn-danger', { hasText: '删除' }).isVisible()
    .catch(() => false);
  expect(hasChangeButton || hasDeleteButton).toBe(true);
});

// 场景7：编辑故事元数据后自动保存 → 刷新验证
test('场景7：编辑故事标题 → 等待0.1秒 → 自动保存 → 刷新验证', async ({ page }) => {
  // 1. 点击侧边栏的标题输入框
  const titleInput = page.locator('input[placeholder="我的互动小说"]').or(page.locator('label:has-text("标题") + input'));
  await titleInput.first().click();
  
  // 2. 修改标题
  const newTitle = '自动保存测试标题_' + Date.now();
  await titleInput.first().click();
  await titleInput.first().press('Control+A');
  await titleInput.first().pressSequentially(newTitle, { delay: 50 });
  
  // 3. 等待200ms自动保存（0.1秒防抖 + 100ms余量）
  console.log('标题修改后，等待0.1秒自动保存...');
  await page.waitForTimeout(200);
  
  // 4. 刷新页面
  await page.reload();
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // 5. 验证：标题应该保存了
  const savedTitle = await titleInput.first().inputValue();
  expect(savedTitle).toBe(newTitle);
});
