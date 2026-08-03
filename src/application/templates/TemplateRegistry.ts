import type { PlayerTemplateEntry, PlayerTemplateModule } from '../../domain/templates/contracts.ts';

export class TemplateRegistry {
  private readonly entries = new Map<string, PlayerTemplateEntry>();
  private readonly modules = new Map<string, Promise<PlayerTemplateModule>>();

  register(entry: PlayerTemplateEntry): void {
    if (this.entries.has(entry.manifest.id)) throw new Error(`模板 ID 重复或冲突: ${entry.manifest.id}`);
    this.entries.set(entry.manifest.id, entry);
  }

  registerMany(entries: PlayerTemplateEntry[]): void {
    const ids = new Set(this.entries.keys());
    for (const entry of entries) {
      if (ids.has(entry.manifest.id)) throw new Error(`模板 ID 重复或冲突: ${entry.manifest.id}`);
      ids.add(entry.manifest.id);
    }
    for (const entry of entries) this.entries.set(entry.manifest.id, entry);
  }

  unregister(id: string): void {
    this.entries.delete(id);
    this.modules.delete(id);
  }

  list(): PlayerTemplateEntry[] {
    return [...this.entries.values()];
  }

  get(id: string): PlayerTemplateEntry | undefined {
    return this.entries.get(id);
  }

  async load(id: string): Promise<PlayerTemplateModule> {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`模板不存在: ${id}`);
    let pending = this.modules.get(id);
    if (!pending) {
      pending = entry.loader().then(module => {
        if (module.manifest.id !== id) throw new Error(`模板 manifest 与注册 ID 不一致: ${id}`);
        return module;
      }).catch(error => {
        this.modules.delete(id);
        throw error;
      });
      this.modules.set(id, pending);
    }
    return pending;
  }
}
