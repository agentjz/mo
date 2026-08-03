import { useEffect, useState } from 'react';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';

export function useAssetUrl(path: string | undefined): string {
  const [url, setUrl] = useState(() => path?.startsWith('asset:') ? '' : path ?? '');

  useEffect(() => {
    let active = true;
    void workspaceService.resolveAssetUrl(path).then(resolved => {
      if (active) setUrl(resolved);
    }).catch(() => {
      if (active) setUrl('');
    });
    return () => { active = false; };
  }, [path]);

  return url;
}

export async function resolveAssetUrl(path: string | undefined): Promise<string> {
  return workspaceService.resolveAssetUrl(path);
}
