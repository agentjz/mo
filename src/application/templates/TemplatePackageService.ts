import { z } from 'zod';
import {
  parsePlayerTemplateManifest,
  type PlayerTemplateEntry,
  type PlayerTemplateManifest,
  type PlayerTemplateModule,
  type PlayerTemplateRenderContext,
} from '../../domain/templates/contracts.ts';
import type { TemplateRegistry } from './TemplateRegistry.ts';

export const LOCAL_TEMPLATE_PACKAGES_KEY = 'templates.local-packages';
const PACKAGE_FORMAT = 'mo.player-template';
const PACKAGE_VERSION = 1;
const MAX_ARCHIVE_BYTES = 5 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 100;
const REQUIRED_MARKERS = [
  'data-player-template', 'data-story-title', 'data-scene-speaker', 'data-scene-text',
  'data-scene-media', 'data-scene-choices', 'data-player-status', 'data-player-menu',
] as const;

const packageManifestSchema = z.object({
  format: z.literal(PACKAGE_FORMAT),
  version: z.literal(PACKAGE_VERSION),
  template: z.unknown(),
  files: z.array(z.object({
    path: z.string().min(1).max(300),
    size: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict()).min(2).max(MAX_FILES),
}).strict();

interface PersistedTemplatePackage {
  id: string;
  archive: Uint8Array;
}

interface DecodedTemplatePackage extends PersistedTemplatePackage {
  entry: PlayerTemplateEntry;
}

export interface TemplateSettingsStore {
  get(key: string): unknown | Promise<unknown>;
  set(key: string, value: unknown): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}

function assertSafePath(path: string): void {
  const parts = path.split('/');
  if (!path || path.startsWith('/') || path.startsWith('\\') || path.includes('\\')
    || parts.some(part => !part || part === '.' || part === '..') || /^[a-z]:/i.test(path)) {
    throw new Error(`模板包资源路径越界: ${path}`);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeText(bytes: Uint8Array, path: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${path} 不是有效 UTF-8 文本`);
  }
}

function assertSafeTemplate(markup: string, css: string): void {
  if (/<\/?(?:script|iframe|object|embed|link|style)\b/i.test(markup)
    || /\son[a-z]+\s*=/i.test(markup)
    || /(?:javascript:|https?:\/\/|src\s*=\s*["']?\/\/)/i.test(markup)) {
    throw new Error('模板 HTML 包含不允许的可执行或远程内容');
  }
  if (/@import|expression\s*\(|javascript:|https?:\/\/|<\/style/i.test(css)) {
    throw new Error('模板 CSS 包含不允许的可执行或远程内容');
  }
  for (const marker of REQUIRED_MARKERS) {
    if (!markup.includes(marker)) throw new Error(`模板 HTML 缺少运行标记: ${marker}`);
  }
}

function mimeType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  return ({
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
    svg: 'image/svg+xml', woff: 'font/woff', woff2: 'font/woff2', otf: 'font/otf', ttf: 'font/ttf',
  } as Record<string, string>)[extension ?? ''] ?? 'application/octet-stream';
}

function dataUrl(path: string, bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }
  return `data:${mimeType(path)};base64,${btoa(binary)}`;
}

function replaceAll(source: string, token: string, value: string): string {
  return source.split(token).join(value);
}

function renderMarkup(markup: string, manifest: PlayerTemplateManifest, context?: PlayerTemplateRenderContext): string {
  const replacements: Record<string, string> = {
    '{{templateId}}': manifest.id,
    '{{storyTitle}}': escapeHtml(context?.document.meta.title ?? ''),
    '{{sceneSpeaker}}': escapeHtml(context?.snapshot.scene?.content.speaker ?? ''),
    '{{sceneText}}': escapeHtml(context?.snapshot.scene?.content.text ?? ''),
  };
  return Object.entries(replacements).reduce((result, [token, value]) => replaceAll(result, token, value), markup);
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const input = new Uint8Array(bytes).buffer;
  const digest = await crypto.subtle.digest('SHA-256', input);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function parsePersisted(input: unknown): PersistedTemplatePackage[] {
  if (input === undefined) return [];
  if (!Array.isArray(input)) throw new Error('本地模板持久化记录无效');
  const ids = new Set<string>();
  return input.map((value, index) => {
    if (!value || typeof value !== 'object') throw new Error(`本地模板记录 ${index} 无效`);
    const record = value as { id?: unknown; archive?: unknown };
    if (typeof record.id !== 'string' || !record.id.startsWith('local.') || ids.has(record.id)) {
      throw new Error(`本地模板记录 ${index} 的 ID 无效`);
    }
    const archive = record.archive instanceof Uint8Array
      ? record.archive
      : record.archive instanceof ArrayBuffer ? new Uint8Array(record.archive) : null;
    if (!archive || archive.byteLength === 0 || archive.byteLength > MAX_ARCHIVE_BYTES) {
      throw new Error(`本地模板记录 ${record.id} 的 ZIP 无效`);
    }
    ids.add(record.id);
    return { id: record.id, archive: new Uint8Array(archive) };
  });
}

export class TemplatePackageService {
  private restored = false;
  private records: PersistedTemplatePackage[] = [];

  constructor(
    private readonly registry: TemplateRegistry,
    private readonly settings: TemplateSettingsStore,
  ) {}

  async restore(): Promise<PlayerTemplateEntry[]> {
    if (this.restored) return this.localEntries();
    const records = parsePersisted(await this.settings.get(LOCAL_TEMPLATE_PACKAGES_KEY));
    const decoded: DecodedTemplatePackage[] = [];
    for (const record of records) decoded.push(await this.decode(record.archive));
    for (let index = 0; index < decoded.length; index += 1) {
      if (decoded[index].id !== records[index].id) throw new Error(`本地模板记录 ID 与 ZIP 不一致: ${records[index].id}`);
    }
    this.registry.registerMany(decoded.map(item => item.entry));
    this.records = records;
    this.restored = true;
    return decoded.map(item => item.entry);
  }

  async install(file: Blob): Promise<PlayerTemplateEntry> {
    await this.restore();
    if (file.size === 0 || file.size > MAX_ARCHIVE_BYTES) throw new Error('模板 ZIP 大小无效');
    const archive = new Uint8Array(await file.arrayBuffer());
    const decoded = await this.decode(archive);
    if (this.registry.get(decoded.id)) throw new Error(`模板 ID 冲突: ${decoded.id}`);
    const previous = this.cloneRecords();
    const next = [...previous, { id: decoded.id, archive: new Uint8Array(archive) }];
    this.registry.register(decoded.entry);
    try {
      await this.settings.set(LOCAL_TEMPLATE_PACKAGES_KEY, next);
      this.records = next;
      return decoded.entry;
    } catch (error) {
      this.registry.unregister(decoded.id);
      await this.restoreSettings(previous).catch(() => undefined);
      throw error;
    }
  }

  async uninstall(id: string): Promise<void> {
    await this.restore();
    const entry = this.registry.get(id);
    if (!entry || entry.source !== 'local') throw new Error(`本地模板不存在: ${id}`);
    const next = this.records.filter(record => record.id !== id);
    if (next.length === this.records.length) throw new Error(`本地模板记录不存在: ${id}`);
    await this.restoreSettings(next);
    this.records = next;
    this.registry.unregister(id);
  }

  private async decode(archive: Uint8Array): Promise<DecodedTemplatePackage> {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(archive);
    const paths = Object.values(zip.files).filter(entry => !entry.dir).map(entry => entry.name);
    if (paths.length < 3 || paths.length > MAX_FILES + 1) throw new Error('模板 ZIP 文件数量无效');
    for (const path of paths) assertSafePath(path);
    const manifestEntry = zip.file('manifest.json');
    if (!manifestEntry) throw new Error('模板 ZIP 缺少 manifest.json');
    const manifestBytes = await manifestEntry.async('uint8array');
    if (manifestBytes.byteLength > 1024 * 1024) throw new Error('模板 manifest 超出大小限制');
    const packageManifest = packageManifestSchema.parse(JSON.parse(decodeText(manifestBytes, 'manifest.json')));
    const manifest = parsePlayerTemplateManifest(packageManifest.template);
    if (!manifest.id.startsWith('local.')) throw new Error('本地模板 ID 必须以 local. 开头');

    const declaredPaths = packageManifest.files.map(file => file.path);
    for (const path of declaredPaths) assertSafePath(path);
    if (new Set(declaredPaths).size !== declaredPaths.length) throw new Error('模板文件清单存在重复路径');
    const expectedPaths = new Set(['template.html', 'template.css', ...manifest.resources]);
    if (expectedPaths.size !== declaredPaths.length || declaredPaths.some(path => !expectedPaths.has(path))) {
      throw new Error('模板文件清单与 manifest 资源不一致');
    }
    const actualPaths = new Set(paths.filter(path => path !== 'manifest.json'));
    if (actualPaths.size !== declaredPaths.length || declaredPaths.some(path => !actualPaths.has(path))) {
      throw new Error('模板 ZIP 内容与文件清单不一致');
    }

    const files = new Map<string, Uint8Array>();
    let total = manifestBytes.byteLength;
    for (const declared of packageManifest.files) {
      const bytes = await zip.file(declared.path)!.async('uint8array');
      total += bytes.byteLength;
      if (total > MAX_UNCOMPRESSED_BYTES) throw new Error('模板 ZIP 解压内容超出大小限制');
      if (bytes.byteLength !== declared.size || await sha256(bytes) !== declared.sha256) {
        throw new Error(`模板文件完整性校验失败: ${declared.path}`);
      }
      files.set(declared.path, bytes);
    }

    let markup = decodeText(files.get('template.html')!, 'template.html');
    let css = decodeText(files.get('template.css')!, 'template.css');
    assertSafeTemplate(markup, css);
    for (const path of manifest.resources) {
      const url = dataUrl(path, files.get(path)!);
      markup = replaceAll(markup, `mo-resource:${path}`, url);
      css = replaceAll(css, `mo-resource:${path}`, url);
    }
    if (/mo-resource:/i.test(`${markup}\n${css}`)) throw new Error('模板包含未解析的本地资源引用');

    const module: PlayerTemplateModule = {
      manifest,
      render: context => renderMarkup(markup, manifest, context),
      css,
    };
    return {
      id: manifest.id,
      archive: new Uint8Array(archive),
      entry: { manifest, source: 'local', loader: async () => module },
    };
  }

  private localEntries(): PlayerTemplateEntry[] {
    return this.registry.list().filter(entry => entry.source === 'local');
  }

  private cloneRecords(): PersistedTemplatePackage[] {
    return this.records.map(record => ({ id: record.id, archive: new Uint8Array(record.archive) }));
  }

  private async restoreSettings(records: PersistedTemplatePackage[]): Promise<void> {
    if (records.length === 0) await this.settings.remove(LOCAL_TEMPLATE_PACKAGES_KEY);
    else await this.settings.set(LOCAL_TEMPLATE_PACKAGES_KEY, records);
  }
}
