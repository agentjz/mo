import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';
import Loading from '../components/ui/Loading.tsx';
import { PluginProvider } from '../contexts/PluginContext.tsx';
import { ThemeProvider } from '../contexts/ThemeContext.tsx';

type InitializationState = 'loading' | 'ready' | 'error';

function WorkspaceShell(): JSX.Element {
  const [state, setState] = useState<InitializationState>('loading');

  useEffect(() => {
    let active = true;
    void workspaceService.initialize()
      .then(() => {
        if (active) setState('ready');
      })
      .catch(error => {
        console.error('Failed to initialize local workspace:', error);
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === 'loading') return <Loading fullScreen message="加载本地作品库..." />;
  if (state === 'error') {
    return <div className="app-bootstrap-error" role="alert">本地作品库加载失败</div>;
  }

  return (
    <PluginProvider>
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </PluginProvider>
  );
}

export default WorkspaceShell;
