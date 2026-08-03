import { describe, expect, it, vi } from 'vitest';
import { TemplateRegistry } from '../../src/application/templates/TemplateRegistry.ts';
import type { PlayerTemplateModule } from '../../src/domain/templates/contracts.ts';

function module(id: string): PlayerTemplateModule {
  return {
    manifest: {
      id, name: id, version: '1.0.0', category: 'test', preview: 'data:image/png;base64,AA==',
      capabilities: { images: 'native', characters: 'fallback', hotspots: 'fallback' },
      settings: [], sceneVariants: ['default', 'alternate'], resources: [],
      fallback: { characters: '带名称插图', hotspots: '地点按钮' }, structuralFingerprint: `shell:${id}`,
    },
    render: () => '<main></main>',
    css: '',
  };
}

describe('TemplateRegistry', () => {
  it('统一注册、冲突检测、懒加载缓存和删除', async () => {
    const registry = new TemplateRegistry();
    const loader = vi.fn(async () => module('test.template'));
    registry.register({ manifest: module('test.template').manifest, loader, source: 'builtin' });
    await expect(registry.load('test.template')).resolves.toMatchObject({ manifest: { id: 'test.template' } });
    await registry.load('test.template');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(() => registry.register({ manifest: module('test.template').manifest, loader, source: 'local' })).toThrow(/重复|冲突/);
    registry.unregister('test.template');
    await expect(registry.load('test.template')).rejects.toThrow(/不存在/);
  });
});
