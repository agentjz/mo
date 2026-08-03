import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { PlayerKernel } from '../../src/application/player/PlayerKernel.ts';
import {
  LOCAL_TEMPLATE_PACKAGES_KEY,
  TemplatePackageService,
  type TemplateSettingsStore,
} from '../../src/application/templates/TemplatePackageService.ts';
import { TemplateRegistry } from '../../src/application/templates/TemplateRegistry.ts';
import { canonicalStory } from '../fixtures/canonicalStory.ts';

const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M8AAAICAQB7CYVIAAAAAElFTkSuQmCC';
const markup = `<main data-player-template="{{templateId}}">
  <header><span data-story-title>{{storyTitle}}</span><button data-player-menu>菜单</button></header>
  <p data-scene-speaker>{{sceneSpeaker}}</p><div data-scene-text>{{sceneText}}</div>
  <div data-scene-media><img src="mo-resource:assets/dot.png" alt=""></div>
  <nav data-scene-choices></nav><aside data-player-status></aside>
</main>`;

async function digest(content: string | Uint8Array): Promise<string> {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer);
  return [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function packageBlob(overrides: { hash?: string; html?: string } = {}): Promise<Blob> {
  const files = new Map<string, Uint8Array>([
    ['template.html', new TextEncoder().encode(overrides.html ?? markup)],
    ['template.css', new TextEncoder().encode('main{background-image:url("mo-resource:assets/dot.png")}')],
    ['assets/dot.png', new Uint8Array([137, 80, 78, 71])],
  ]);
  const manifest = {
    format: 'mo.player-template', version: 1,
    template: {
      id: 'local.test-template', name: '本地测试模板', version: '1.0.0', category: '测试', preview,
      capabilities: { images: 'native', hotspots: 'fallback' },
      settings: [{ id: 'showHud', label: '显示状态', type: 'boolean', defaultValue: true }],
      sceneVariants: ['default', 'focus'], resources: ['assets/dot.png'],
      fallback: { hotspots: '地点按钮' }, structuralFingerprint: 'local-shell>content>choices',
    },
    files: await Promise.all([...files].map(async ([path, bytes]) => ({
      path, size: bytes.byteLength, sha256: path === 'template.html' && overrides.hash ? overrides.hash : await digest(bytes),
    }))),
  };
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(manifest));
  for (const [path, bytes] of files) zip.file(path, new Uint8Array(bytes).buffer);
  const archive = await zip.generateAsync({ type: 'uint8array' });
  return new Blob([new Uint8Array(archive).buffer], { type: 'application/zip' });
}

function memoryStore(values = new Map<string, unknown>()): TemplateSettingsStore {
  return {
    get: key => values.get(key),
    set: (key, value) => { values.set(key, value); },
    remove: key => { values.delete(key); },
  };
}

describe('TemplatePackageService', () => {
  it('完整解析 ZIP、校验哈希、内联资源并持久化恢复和卸载', async () => {
    const values = new Map<string, unknown>();
    const registry = new TemplateRegistry();
    const service = new TemplatePackageService(registry, memoryStore(values));
    const entry = await service.install(await packageBlob());
    expect(entry).toMatchObject({ source: 'local', manifest: { id: 'local.test-template' } });
    expect(values.get(LOCAL_TEMPLATE_PACKAGES_KEY)).toBeDefined();

    const document = canonicalStory();
    const snapshot = new PlayerKernel(document).dispatch({ type: 'start' });
    const module = await registry.load('local.test-template');
    expect(module.render({ document, snapshot, settings: {} })).toContain(document.meta.title);
    expect(module.render()).toContain('data:image/png;base64,');
    expect(module.css).toContain('data:image/png;base64,');

    const restoredRegistry = new TemplateRegistry();
    const restored = new TemplatePackageService(restoredRegistry, memoryStore(values));
    await expect(restored.restore()).resolves.toHaveLength(1);
    await expect(restoredRegistry.load('local.test-template')).resolves.toMatchObject({ manifest: { name: '本地测试模板' } });
    await restored.uninstall('local.test-template');
    expect(restoredRegistry.get('local.test-template')).toBeUndefined();
    expect(values.has(LOCAL_TEMPLATE_PACKAGES_KEY)).toBe(false);
  });

  it('哈希、安全校验或持久化失败时不留下注册和设置', async () => {
    const values = new Map<string, unknown>();
    const registry = new TemplateRegistry();
    const service = new TemplatePackageService(registry, memoryStore(values));
    await expect(service.install(await packageBlob({ hash: '0'.repeat(64) }))).rejects.toThrow('完整性');
    await expect(service.install(await packageBlob({ html: markup.replace('<main', '<script></script><main') }))).rejects.toThrow('不允许');
    expect(registry.list()).toEqual([]);
    expect(values.size).toBe(0);

    const failingRegistry = new TemplateRegistry();
    const failing = new TemplatePackageService(failingRegistry, {
      get: () => undefined,
      set: () => { throw new Error('storage failed'); },
      remove: () => undefined,
    });
    await expect(failing.install(await packageBlob())).rejects.toThrow('storage failed');
    expect(failingRegistry.list()).toEqual([]);
  });
});
