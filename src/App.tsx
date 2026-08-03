import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Loading from './components/ui/Loading.tsx';

const LandingPage = lazy(() => import('./features/landing/LandingPage.tsx'));
const StatementPage = lazy(() => import('./features/statement/StatementPage.tsx'));
const WorkspaceShell = lazy(() => import('./app/WorkspaceShell.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Editor = lazy(() => import('./pages/Editor.tsx'));
const PlayerPage = lazy(() => import('./pages/PlayerPage.tsx'));
const PluginStore = lazy(() => import('./pages/PluginStore.tsx'));

function App(): JSX.Element {
  return (
    <HashRouter>
      <Suspense fallback={<Loading fullScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/statement" element={<StatementPage />} />
          <Route element={<WorkspaceShell />}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/editor/:id" element={<Editor />} />
              <Route path="/play/:id" element={<PlayerPage />} />
              <Route path="/plugins" element={<PluginStore />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
