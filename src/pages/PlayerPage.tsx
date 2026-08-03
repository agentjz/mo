import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';
import Loading from '../components/ui/Loading.tsx';
import type { StoryDocument } from '../domain/story/document.ts';
import { reactTemplateEntries } from '../templates/reactCatalog.ts';
import { templatePackageService, templateRegistry } from '../templates/runtimeCatalog.ts';
import notification from '../utils/notification.ts';

const renderers = new Map(reactTemplateEntries.map(entry => [entry.id, entry.component]));
const localRenderer = lazy(() => import('./GenericTemplatePlayer.tsx'));

function PlayerPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<StoryDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!id) throw new Error('无效的游戏参数');
        await templatePackageService.restore();
        const stored = await workspaceService.getStoredStory(id);
        if (!stored) throw new Error('故事不存在');
        if (active) setStory(stored.document);
      } catch (error) {
        console.error('加载故事失败:', error);
        notification.error('加载故事失败');
        window.setTimeout(() => navigate('/app'), 2000);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, navigate]);

  const Renderer = useMemo(() => {
    if (!story) return undefined;
    return renderers.get(story.presentation.templateId)
      ?? (templateRegistry.get(story.presentation.templateId)?.source === 'local' ? localRenderer : undefined);
  }, [story]);
  if (loading) return <Loading fullScreen message="加载故事中..." />;
  if (!story) return <Loading fullScreen message="故事不存在" />;
  if (!Renderer) return <Loading fullScreen message="播放器模板不存在" />;
  return <Suspense fallback={<Loading fullScreen message="加载播放器模板..." />}>
    <Renderer story={story} startSceneId={searchParams.get('startNode') ?? undefined} />
  </Suspense>;
}

export default PlayerPage;
