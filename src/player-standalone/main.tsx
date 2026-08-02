import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import ChatStylePlayer from '../pages/ChatStylePlayer.tsx';
import VisualNovelPlayer from '../pages/VisualNovelPlayer.tsx';
import type { Story } from '../types/index.ts';
import '../styles/theme-variables.css';
import '../styles/global.css';

declare global {
  interface Window {
    STORY_DATA: Story;
  }
}

const story = window.STORY_DATA;
const Player = story.meta.renderStyle === 'chat' ? ChatStylePlayer : VisualNovelPlayer;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MemoryRouter>
    <Player story={story} />
  </MemoryRouter>,
);
