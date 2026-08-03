import { TemplateCompiler } from '../../application/templates/TemplateCompiler.ts';
import { TemplateRegistry } from '../../application/templates/TemplateRegistry.ts';
import { collectAssetIds, type StoryDocument } from '../../domain/story/document.ts';
import { builtinTemplateEntries } from '../../templates/catalog.ts';
import type { RulePackContribution } from '../../plugin/contributions.ts';
import type { WorkspaceRepository } from '../storage/WorkspaceRepository.ts';
import { blobToDataUrl } from './binary.ts';

export class HTMLExporter {
  private readonly compiler = new TemplateCompiler();
  private readonly registry: TemplateRegistry;

  constructor(private readonly repository: WorkspaceRepository, registry?: TemplateRegistry) {
    this.registry = registry ?? new TemplateRegistry();
    if (!registry) this.registry.registerMany(builtinTemplateEntries);
  }

  async export(document: StoryDocument, rulePacks: RulePackContribution[] = []): Promise<Blob> {
    const template = await this.registry.load(document.presentation.templateId);
    const requiredIds = collectAssetIds(document);
    const records = await this.repository.getAssets(requiredIds);
    const assets = new Map<string, string>();
    for (const record of records) assets.set(record.id, await blobToDataUrl(record.blob));
    const missing = [...requiredIds].filter(id => !assets.has(id));
    if (missing.length > 0) throw new Error(`作品缺少图片资源: ${missing.join(', ')}`);
    const html = await this.compiler.compile({ document, template, assets, rulePacks });
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }
}
