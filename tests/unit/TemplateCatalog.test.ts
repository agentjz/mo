import { describe, expect, it } from 'vitest';
import { builtinTemplateEntries } from '../../src/templates/catalog.ts';

describe('十二套内建模板合同', () => {
  it('具有完整能力、设置、变体、预览和唯一结构指纹', () => {
    expect(builtinTemplateEntries).toHaveLength(12);
    const fingerprints = new Set<string>();
    for (const entry of builtinTemplateEntries) {
      const manifest = entry.manifest;
      expect(manifest.preview).toMatch(/^data:image\//);
      expect(manifest.settings.length).toBeGreaterThan(0);
      expect(manifest.sceneVariants.length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(manifest.capabilities).length).toBeGreaterThan(0);
      expect(manifest.fallback).toBeTruthy();
      fingerprints.add(manifest.structuralFingerprint);
    }
    expect(fingerprints.size).toBe(12);
  });
});
