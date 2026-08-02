import type { WorkspaceRepository } from './WorkspaceRepository.ts';

export class AssetUrlRegistry {
  private readonly urls = new Map<string, string>();

  constructor(private readonly repository: WorkspaceRepository) {}

  async resolve(path: string | undefined): Promise<string> {
    if (!path) return '';
    if (!path.startsWith('asset:')) return path;

    const cached = this.urls.get(path);
    if (cached) return cached;

    const asset = await this.repository.getAsset(path);
    if (!asset) throw new Error(`图片资源不存在: ${path}`);
    const url = URL.createObjectURL(asset.blob);
    this.urls.set(path, url);
    return url;
  }

  clear(): void {
    for (const url of this.urls.values()) URL.revokeObjectURL(url);
    this.urls.clear();
  }
}
