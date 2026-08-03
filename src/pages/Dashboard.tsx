import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';
import Loading from '../components/ui/Loading.tsx';
import { downloadBlob, safeFileName } from '../platform/export/binary.ts';
import type { StoryDocument } from '../domain/story/document.ts';
import { usePluginSystem } from '../contexts/PluginContext.tsx';
import notification from '../utils/notification.ts';
import '../styles/dashboard.css';

function chooseFile(accept: string): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const pluginSystem = usePluginSystem();
  const [stories, setStories] = useState<StoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const storyById = useMemo(() => new Map(stories.map(story => [story.id, story])), [stories]);

  useEffect(() => {
    void loadStories();
  }, []);

  useEffect(() => {
    if (!deleteConfirmId) return;
    const timer = window.setTimeout(() => setDeleteConfirmId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [deleteConfirmId]);

  async function loadStories(): Promise<void> {
    try {
      setStories(await workspaceService.listStories());
    } catch (error) {
      console.error('加载失败:', error);
      notification.error('加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNew(): Promise<void> {
    try {
      const created = await workspaceService.createStory();
      navigate(`/editor/${created.id}`);
    } catch (error) {
      console.error('创建失败:', error);
      notification.error(`创建失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async function handleDelete(id: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    try {
      await workspaceService.deleteStory(id);
      setDeleteConfirmId(null);
      notification.success('作品已删除');
      await loadStories();
    } catch (error) {
      console.error('删除失败:', error);
      notification.error('删除失败');
    }
  }

  async function handleExportHTML(id: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await runBusy(async () => {
      const story = storyById.get(id);
      if (!story) throw new Error('故事不存在');
      notification.info('正在导出视觉小说HTML，请稍候...');
      downloadBlob(
        await workspaceService.exportStandalone(story, pluginSystem.listContributions('rulePack').map(item => item.value)),
        `${safeFileName(story.meta.title)}_visual-novel.html`,
      );
      notification.success('visual-novelHTML已导出');
    }, '导出HTML失败');
  }

  async function handleExportWorkspace(): Promise<void> {
    await runBusy(async () => {
      downloadBlob(await workspaceService.exportWorkspace(), '墨水作品库备份.zip');
      notification.success('作品库已导出');
    }, '导出失败');
  }

  async function handleRestoreWorkspace(): Promise<void> {
    const file = await chooseFile('.zip,application/zip');
    if (!file || !confirm('导入作品库将替换当前全部作品，确定继续吗？')) return;
    await runBusy(async () => {
      await workspaceService.restoreWorkspace(file);
      await loadStories();
      notification.success('作品库已导入');
    }, '导入失败');
  }

  async function runBusy(action: () => Promise<void>, fallback: string): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      console.error(fallback, error);
      notification.error(error instanceof Error ? error.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>互动小说编辑器</h1>
      </header>

      <div className="dashboard-actions">
        <button className="btn-primary" onClick={handleCreateNew} disabled={busy}>+ 创建新作品</button>
        <button className="btn-secondary" onClick={handleExportWorkspace} disabled={busy}>导出作品库</button>
        <button className="btn-secondary" onClick={handleRestoreWorkspace} disabled={busy}>导入作品库</button>
        <button className="btn-secondary" onClick={() => navigate('/plugins')}>插件商店</button>
      </div>

      <div className="stories-grid">
        {stories.length === 0 ? <div className="empty-state" /> : stories.map(story => (
          <div key={story.id} className="story-card" onClick={() => navigate(`/editor/${story.id}`)}>
            <h3>{story.meta.title}</h3>
            <p className="story-meta">作者: {story.meta.author || '未命名'}</p>
            <p className="story-desc">{story.meta.description || '暂无描述'}</p>
            <div className="story-stats">
              <span>{story.scenes.length} 个节点</span>
              <span>{story.scenes.reduce((total, scene) => total + scene.choices.length, 0)} 条连线</span>
            </div>
            <div className="story-actions">
              <button className="btn-icon" onClick={event => void handleExportHTML(story.id, event)} title="导出为HTML">HTML</button>
              <button
                className={`btn-icon btn-danger ${deleteConfirmId === story.id ? 'btn-danger-confirm' : ''}`}
                onClick={event => void handleDelete(story.id, event)}
                title={deleteConfirmId === story.id ? '确认删除？(3秒后取消)' : '删除'}
              >
                {deleteConfirmId === story.id ? '确认删除？' : '删除'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
