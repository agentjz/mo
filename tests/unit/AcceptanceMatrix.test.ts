import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('F001-F018 长期验收映射', () => {
  it('每个失败模式都有可执行证据文件', async () => {
    const matrix = JSON.parse(await readFile('tests/fixtures/acceptance-matrix.json', 'utf8')) as Record<string, string[]>;
    expect(Object.keys(matrix)).toEqual(Array.from({ length: 18 }, (_, index) => `F${String(index + 1).padStart(3, '0')}`));
    for (const [failureId, files] of Object.entries(matrix)) {
      expect(files.length, `${failureId} 没有证据`).toBeGreaterThan(0);
      for (const file of files) expect(existsSync(file), `${failureId} 缺少 ${file}`).toBe(true);
    }
  });
});
