import { useEffect, useState } from 'react';
import { AssetUrlRegistry } from '../platform/storage/AssetUrlRegistry.ts';
import { workspaceRepository } from '../platform/storage/WorkspaceRepository.ts';

const registry = new AssetUrlRegistry(workspaceRepository);

export function useAssetUrl(path: string | undefined): string {
  const [url, setUrl] = useState(() => path?.startsWith('asset:') ? '' : path ?? '');

  useEffect(() => {
    let active = true;
    void registry.resolve(path).then(resolved => {
      if (active) setUrl(resolved);
    }).catch(() => {
      if (active) setUrl('');
    });
    return () => { active = false; };
  }, [path]);

  return url;
}

export async function resolveAssetUrl(path: string | undefined): Promise<string> {
  return registry.resolve(path);
}
