/**
 * 性能压力测试
 * 注意：这些测试运行时间较长，不建议每次都运行
 * 用途：验证系统在极限情况下的性能表现
 * 
 * 自动保存机制：
 * - 创建/编辑节点后，系统会在2秒后自动保存
 * - 测试中需要等待自动保存完成再验证
 */

import { test, expect } from '@playwright/test';

// 增加超时时间（性能测试可能很慢）
test.setTimeout(300000); // 5分钟

// 测试前准备：登录并创建故事
test.beforeEach(async ({ page }) => {
  // 访问首页
  await page.goto('http://localhost:5173');
  
  // 点击"在线使用"按钮
  await page.click('text=在线使用');
  
  // 等待登录页面加载
  await page.waitForSelector('input#username', { timeout: 10000 });
  
  // 用户名密码登录
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

// 场景1：100个节点压力测试
test('性能测试1-1：100个节点 → 自动保存 → 刷新加载验证', async ({ page }) => {
  await testNodePerformance(page, 100);
});

// 场景1-2：1000个节点压力测试（默认跳过，按需运行）
test.skip('性能测试1-2：1000个节点 → 自动保存 → 刷新加载验证', async ({ page }) => {
  await testNodePerformance(page, 1000);
});

// 通用节点性能测试函数
async function testNodePerformance(page: any, nodeCount: number) {
  console.log(`\n=== 开始 ${nodeCount} 个节点压力测试 ===`);
  const startTime = Date.now();
  
  // 1. 通过点击按钮创建节点（模拟人的操作）
  console.log(`[1/4] 创建 ${nodeCount} 个节点...`);
  const createStartTime = Date.now();
  
  for (let i = 0; i < nodeCount; i++) {
    // 每10个节点输出一次进度
    if (i % 10 === 0) {
      console.log(`   进度: ${i}/${nodeCount}`);
    }
    
    // 点击"添加节点"按钮
    await page.click('button:has-text("添加节点")');
    await page.waitForTimeout(10); // 等待10ms，避免太快
  }
  
  const createEndTime = Date.now();
  console.log(`[1/4] 创建完成，耗时: ${createEndTime - createStartTime}ms`);
  
  // 2. 等待自动保存（创建节点会触发状态变化，等待2秒自动保存）
  console.log('[2/4] 等待自动保存...');
  const saveStartTime = Date.now();
  
  await page.waitForTimeout(2500); // 等待2.5秒确保自动保存完成
  
  const saveEndTime = Date.now();
  const saveDuration = saveEndTime - saveStartTime;
  console.log(`[2/4] 自动保存耗时: ${saveDuration}ms`);
  
  // 3. 刷新页面，测试加载性能
  console.log('[3/4] 刷新页面，测试加载性能...');
  const reloadStartTime = Date.now();
  
  await page.reload();
  await page.waitForSelector('.react-flow', { timeout: 120000 }); // 2分钟超时
  await page.waitForTimeout(2000);
  
  const reloadEndTime = Date.now();
  const reloadDuration = reloadEndTime - reloadStartTime;
  console.log(`[3/4] 加载耗时: ${reloadDuration}ms (${(reloadDuration / 1000).toFixed(2)}s)`);
  
  // 4. 验证节点数量
  console.log('[4/4] 验证节点数量...');
  const actualNodeCount = await page.locator('.react-flow__node').count();
  console.log(`   实际渲染节点: ${actualNodeCount}`);
  
  // 节点数量应该大致相等（可能有初始节点）
  expect(actualNodeCount).toBeGreaterThanOrEqual(nodeCount);
  
  const totalTime = Date.now() - startTime;
  console.log(`\n=== ${nodeCount} 节点测试完成 ===`);
  console.log(`总耗时: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`- 创建: ${((createEndTime - createStartTime) / 1000).toFixed(2)}s`);
  console.log(`- 保存: ${(saveDuration / 1000).toFixed(2)}s`);
  console.log(`- 加载: ${(reloadDuration / 1000).toFixed(2)}s`);
  console.log(`- 平均创建速度: ${(nodeCount / ((createEndTime - createStartTime) / 1000)).toFixed(2)} 节点/秒\n`);
}

// 场景2：同一个节点上传5次图片
test('性能测试2：同一节点上传5次图片 → 自动保存 → 刷新验证', async ({ page }) => {
  console.log('\n=== 开始图片上传测试 ===');
  const startTime = Date.now();
  
  const uploadCount = 5;
  const uploadTimes: number[] = [];
  
  // 1. 点击初始节点打开编辑面板
  console.log(`[1/3] 打开编辑面板...`);
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 5000 });
  
  // 2. 重复上传5次图片
  console.log(`[2/3] 重复上传图片 ${uploadCount} 次...`);
  for (let i = 0; i < uploadCount; i++) {
    console.log(`   第 ${i + 1}/${uploadCount} 次上传...`);
    
    const uploadStartTime = Date.now();
    
    // 上传图片
    const fileInput = page.locator('[data-testid="bottom-edit-panel"] input[type="file"]').first();
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    await page.waitForTimeout(1500); // 等待上传完成
    
    // 如果不是最后一次，删除图片准备下一次上传
    if (i < uploadCount - 1) {
      const deleteBtn = page.locator('[data-testid="bottom-edit-panel"] button.btn-danger:has-text("删除")');
      await deleteBtn.click();
      await page.waitForTimeout(300);
    }
    
    const uploadEndTime = Date.now();
    uploadTimes.push(uploadEndTime - uploadStartTime);
  }
  
  // 3. 关闭面板并等待自动保存
  console.log('[3/3] 关闭面板，等待自动保存...');
  const saveStartTime = Date.now();
  
  await page.locator('[data-testid="bottom-edit-panel"] button').filter({ hasText: '关闭' }).click();
  await page.waitForTimeout(300);
  await page.waitForTimeout(2500); // 等待自动保存完成
  
  const saveDuration = Date.now() - saveStartTime;
  
  // 4. 刷新验证
  await page.reload();
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  await page.locator('.react-flow__node').first().click();
  await page.waitForSelector('[data-testid="bottom-edit-panel"]', { timeout: 5000 });
  
  // 验证图片还在
  const hasImage = await page.locator('[data-testid="bottom-edit-panel"]')
    .locator('button.btn-secondary:has-text("更换")')
    .isVisible()
    .catch(() => false);
  
  expect(hasImage).toBe(true);
  
  const totalTime = Date.now() - startTime;
  const avgUploadTime = uploadTimes.reduce((a, b) => a + b, 0) / uploadTimes.length;
  
  console.log(`\n=== 图片上传测试完成 ===`);
  console.log(`总耗时: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`- 上传次数: ${uploadCount}`);
  console.log(`- 平均耗时: ${avgUploadTime.toFixed(2)}ms`);
  console.log(`- 自动保存耗时: ${saveDuration}ms\n`);
});

