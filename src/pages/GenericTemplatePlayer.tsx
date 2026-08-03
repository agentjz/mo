import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerController } from '../application/player/PlayerController.ts';
import type { PlayerSnapshot } from '../application/player/PlayerKernel.ts';
import GameMenu from '../components/GameMenu.tsx';
import StartScreen from '../components/StartScreen.tsx';
import type { StoryDocument } from '../domain/story/document.ts';
import type { PlayerTemplateModule } from '../domain/templates/contracts.ts';
import { templateRegistry } from '../templates/runtimeCatalog.ts';
import { resolveAssetUrl, useAssetUrl } from '../hooks/useAssetUrl.ts';
import { usePluginSystem } from '../contexts/PluginContext.tsx';
import '../styles/game-menu.css';
import '../styles/start-screen.css';

interface Props {
  story: StoryDocument;
  startSceneId?: string;
}

function GenericTemplatePlayer({ story, startSceneId }: Props): JSX.Element {
  const navigate = useNavigate();
  const pluginSystem = usePluginSystem();
  const rootRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PlayerController | null>(null);
  const [template, setTemplate] = useState<PlayerTemplateModule | null>(null);
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);
  const [renderedContent, setRenderedContent] = useState('');
  const [started, setStarted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const backgroundUrl = useAssetUrl(snapshot?.scene?.media.background?.assetId);

  useEffect(() => {
    let active = true;
    void templateRegistry.load(story.presentation.templateId).then(module => {
      if (!active) return;
      setTemplate(module);
      controllerRef.current = new PlayerController(story, {
        onSnapshot: (next, rendered) => {
          setSnapshot(next);
          setRenderedContent(rendered);
        },
      }, undefined,
      pluginSystem.listContributions('rulePack').map(item => item.value),
      pluginSystem.getContribution('runtime', 'variables'));
    });
    return () => { active = false; };
  }, [story]);

  const markup = useMemo(() => {
    if (!template || !snapshot) return '';
    return template.render({ document: story, snapshot, settings: story.presentation.settings });
  }, [snapshot, story, template]);

  useEffect(() => {
    let active = true;
    const root = rootRef.current;
    const controller = controllerRef.current;
    if (!root || !controller || !snapshot) return;
    const text = root.querySelector<HTMLElement>('[data-scene-text]');
    if (text) text.innerHTML = renderedContent;
    const choices = root.querySelector<HTMLElement>('[data-scene-choices]');
    if (choices) {
      const buttons = snapshot.availableChoices.map(choice => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = choice.text;
        button.addEventListener('click', () => controller.choose(choice.id));
        return button;
      });
      for (const hotspot of snapshot.scene?.media.hotspots ?? []) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = hotspot.label;
        button.addEventListener('click', () => controller.useHotspot(hotspot.id));
        buttons.push(button);
      }
      if (snapshot.status === 'ended') {
        const restart = document.createElement('button');
        restart.type = 'button';
        restart.textContent = '重新开始';
        restart.addEventListener('click', () => controller.restart());
        buttons.push(restart);
      }
      choices.replaceChildren(...buttons);
    }
    root.querySelector('[data-player-menu]')?.addEventListener('click', () => setShowMenu(true), { once: true });
    const media = root.querySelector<HTMLElement>('[data-scene-media]');
    const background = snapshot.scene?.media.background;
    if (media && background && backgroundUrl) {
      media.style.backgroundImage = `url(${backgroundUrl})`;
      media.setAttribute('aria-label', background.label ?? background.fileName);
    }
    if (media) {
      void Promise.all((snapshot.scene?.media.characters ?? []).map(async character => ({
        character,
        url: await resolveAssetUrl(character.assetId),
      }))).then(characters => {
        if (!active || !media.isConnected) return;
        for (const { character, url } of characters) {
          const figure = document.createElement('figure');
          figure.dataset.characterFallback = 'true';
          const image = document.createElement('img');
          image.src = url;
          image.alt = character.label ?? character.fileName;
          const caption = document.createElement('figcaption');
          caption.textContent = character.label ?? character.fileName;
          figure.append(image, caption);
          media.append(figure);
        }
      });
    }
    const speaker = root.querySelector<HTMLElement>('[data-scene-speaker]');
    if (speaker) speaker.textContent = snapshot.scene?.content.speaker ?? '';
    const status = root.querySelector<HTMLElement>('[data-player-status]');
    if (status) {
      const showHud = story.presentation.settings.showHud !== false;
      status.hidden = !showHud;
      status.textContent = showHud
        ? controller.listDisplayVariables().map(variable => `${variable.label}: ${String(variable.value)}`).join(' · ')
        : '';
    }
    const shell = root.querySelector<HTMLElement>('[data-player-template]');
    shell?.style.setProperty('--text-scale', String(story.presentation.settings.textScale ?? 1));
    return () => { active = false; };
  }, [backgroundUrl, markup, renderedContent, snapshot]);

  const controller = controllerRef.current;
  if (!started) {
    return <StartScreen story={story} hasSaveData={controller?.listSaveSlots().some(slot => slot.exists) ?? false} onStartGame={() => {
      controllerRef.current?.start(startSceneId);
      setStarted(true);
    }} onContinueGame={() => { setStarted(true); setShowMenu(true); }} onExit={() => navigate('/')} />;
  }
  if (!template || !snapshot || !controller) return <div className="loading">加载播放器...</div>;

  return (
    <>
      <style>{template.css}</style>
      <div ref={rootRef} dangerouslySetInnerHTML={{ __html: markup }} />
      {showMenu && <GameMenu playerController={controller} onClose={() => setShowMenu(false)} onNewGame={() => controller.restart()} onExit={() => navigate('/')} />}
    </>
  );
}

export default GenericTemplatePlayer;
