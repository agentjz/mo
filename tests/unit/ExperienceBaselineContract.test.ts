import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { landingContent } from '../../src/content/landing.ts';
import { statementContent } from '../../src/content/statement.ts';

async function sha256(file: string): Promise<string> {
  return createHash('sha256').update(await readFile(file)).digest('hex').toUpperCase();
}

describe('09d8d2f 体验保护合同', () => {
  it('冻结品牌视觉资产', async () => {
    await expect(sha256('src/assets/background.webp')).resolves.toBe('F6CB55498731A97ACD4A16F6188960E2FA731E19BA59C1F96080C133156AE9A2');
    await expect(sha256('src/assets/wechat-person.png')).resolves.toBe('A9E6786F52267490472874F373D42D4F87644347CE9A4A808E5EEE4A09AC7E34');
    await expect(sha256('src/assets/wechat-qr.png')).resolves.toBe('8DCFCCA944693AE66FDCF7F4BF295A18118D2361A31FB2E41914F24233EF7110');
  });

  it('首页和声明继续由类型化内容模块提供', () => {
    expect(JSON.stringify(landingContent)).toContain('墨水 / MO');
    expect(JSON.stringify(landingContent)).toContain('在线使用');
    expect(JSON.stringify(statementContent)).toContain('重要声明 / Important Notice');
    expect(JSON.stringify(statementContent)).toContain('关于保存 / About Saving');
  });

  it('冻结页面和两套播放器的关键结构入口', async () => {
    const sources = await Promise.all([
      readFile('src/features/landing/LandingPage.tsx', 'utf8'),
      readFile('src/features/statement/StatementPage.tsx', 'utf8'),
      readFile('src/pages/Dashboard.tsx', 'utf8'),
      readFile('src/pages/Editor.tsx', 'utf8'),
      readFile('src/pages/PluginStore.tsx', 'utf8'),
      readFile('src/pages/VisualNovelPlayer.tsx', 'utf8'),
      readFile('src/pages/ChatStylePlayer.tsx', 'utf8'),
    ]);
    for (const marker of [
      'landing-twine', 'statement-page', 'dashboard', 'editor-container',
      'plugin-store-container', 'vn-player', 'chat-player',
    ]) {
      expect(sources.some(source => source.includes(marker)), marker).toBe(true);
    }
  });

  it('视觉矩阵持续覆盖 40 个冻结状态', async () => {
    const source = await readFile('tests/visual/experience-baseline.spec.ts', 'utf8');
    expect(source).toContain('expect(states).toHaveLength(40)');
    expect(source).toContain("{ name: '390x844', width: 390, height: 844 }");
    expect(source).toContain('expect(consoleErrors).toEqual([])');
  });
});
