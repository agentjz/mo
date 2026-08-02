import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';
import Loading from '../components/ui/Loading.tsx';
import type { Story } from '../types/index.ts';
import notification from '../utils/notification.ts';
import ChatStylePlayer from './ChatStylePlayer.tsx';
import VisualNovelPlayer from './VisualNovelPlayer.tsx';

function PlayerRouter(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!id) throw new Error('无效的游戏参数');
        const stored = await workspaceService.getStoredStory(id);
        if (!stored) throw new Error('故事不存在');
        if (active) setStory(stored.story);
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

  if (loading) return <Loading fullScreen message="加载故事中..." />;
  if (!story) return <Loading fullScreen message="故事不存在" />;
  return story.meta.renderStyle === 'chat'
    ? <ChatStylePlayer story={story} />
    : <VisualNovelPlayer story={story} />;
}

export default PlayerRouter;
