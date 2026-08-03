/**
 * 视觉小说播放器
 * 职责：视觉小说风格的UI展示
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerController } from '../application/player/PlayerController.ts';
import type { Choice, MediaAsset, StoryDocument } from '../domain/story/document.ts';
import { resolveAssetUrl } from '../hooks/useAssetUrl.ts';
import GameMenu from '../components/GameMenu.tsx';
import StartScreen from '../components/StartScreen.tsx';
import { usePluginSystem } from '../contexts/PluginContext.tsx';
import '../styles/visual-novel-player.css';
import '../styles/game-menu.css';
import '../styles/start-screen.css';

type Hotspot = NonNullable<StoryDocument['scenes'][number]['media']['hotspots']>[number];
type ResolvedCharacter = MediaAsset & { url: string };
type ResolvedCharacters = Partial<Record<'left' | 'center' | 'right', ResolvedCharacter>>;

interface Props {
  story: StoryDocument;
  startSceneId?: string;
}

function VisualNovelPlayer({ story, startSceneId }: Props): JSX.Element {
  const navigate = useNavigate();
  const pluginSystem = usePluginSystem();
  const [currentText, setCurrentText] = useState<string>('');
  const [displayText, setDisplayText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [background, setBackground] = useState<string>('');
  const [nodeImage, setNodeImage] = useState<MediaAsset | undefined>(undefined);
  const [characterImages, setCharacterImages] = useState<ResolvedCharacters>({});
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [typewriterSpeed, setTypewriterSpeed] = useState<number>(0);
  const [showGameMenu, setShowGameMenu] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [hasSaveData, setHasSaveData] = useState<boolean>(false);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [dialogUIConfig, setDialogUIConfig] = useState({
    position: 'bottom' as 'top' | 'center' | 'bottom',
    height: 200,
    width: 90,
    opacity: 0.85,
    padding: 24,
    radius: 12,
    blur: 15,
    fontSize: 18
  });
  const playerRef = useRef<PlayerController | null>(null);
  const dialogueBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializePlayer();
  }, []);

  // 打字机效果
  useEffect(() => {
    if (!typewriterSpeed || typewriterSpeed === 0) {
      setDisplayText(currentText);
      setIsTyping(false);
      return;
    }

    // 提取纯文本
    const temp = document.createElement('div');
    temp.innerHTML = currentText;
    const plainText = temp.textContent || temp.innerText || '';

    setIsTyping(true);
    setDisplayText('');

    let index = 0;
    const timer = setInterval(() => {
      if (index < plainText.length) {
        setDisplayText(plainText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setDisplayText(currentText);
        setIsTyping(false);
      }
    }, typewriterSpeed);

    return () => clearInterval(timer);
  }, [currentText, typewriterSpeed]);

  useEffect(() => {
    const dialogueBox = dialogueBoxRef.current;
    if (!dialogueBox) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('choice-embed-link') || target.hasAttribute('data-choice-id')) {
        const choiceId = target.getAttribute('data-choice-id');
        if (choiceId && playerRef.current) {
          playerRef.current.choose(choiceId);
        }
      }
    };

    dialogueBox.addEventListener('click', handleClick);
    return () => dialogueBox.removeEventListener('click', handleClick);
  }, [displayText]);

  async function initializePlayer(): Promise<void> {
    const player = new PlayerController(story, {
      onSnapshot: async (snapshot, renderedText) => {
        const scene = snapshot.scene;
        if (!scene) return;
        setCurrentSceneId(scene.id);
        // 使用渲染后的HTML内容，与终端播放器保持一致
        setCurrentText(renderedText);
        
        // 获取打字机速度
        setTypewriterSpeed(scene.content.typewriterSpeed || 0);
        
        if (scene.media.background?.assetId) {
          setBackground(await resolveAssetUrl(scene.media.background.assetId));
          setNodeImage(scene.media.background);
        } else {
          setBackground('');
          setNodeImage(undefined);
        }
        
        // 构建角色立绘URL
        const newCharacterImages: ResolvedCharacters = {};
        for (const character of scene.media.characters ?? []) {
          const position = character.horizontalPosition ?? 'center';
          newCharacterImages[position] = {
            ...character,
            url: await resolveAssetUrl(character.assetId),
          };
        }
        setCharacterImages(newCharacterImages);
        
        setHotspots(scene.media.hotspots ?? []);
        
        // 加载对话框UI配置
        const uiConfig = (scene.extensionData['ui-config'] ?? {}) as Record<string, unknown>;
        const numberSetting = (key: string, fallback: number) => typeof uiConfig[key] === 'number' ? uiConfig[key] as number : fallback;
        const positionSetting = uiConfig.dialogBoxPosition === 'top' || uiConfig.dialogBoxPosition === 'center' || uiConfig.dialogBoxPosition === 'bottom'
          ? uiConfig.dialogBoxPosition
          : 'bottom';
        setDialogUIConfig({
          position: positionSetting,
          height: numberSetting('dialogBoxHeight', 200),
          width: numberSetting('dialogBoxWidth', 90),
          opacity: numberSetting('dialogBoxOpacity', 0.85),
          padding: numberSetting('dialogBoxPadding', 24),
          radius: numberSetting('dialogBoxRadius', 12),
          blur: numberSetting('dialogBoxBlur', 15),
          fontSize: numberSetting('dialogBoxFontSize', 18)
        });
        
        setCurrentChoices(snapshot.availableChoices);
        setGameEnded(snapshot.status === 'ended');
      },
    }, undefined,
    pluginSystem.listContributions('rulePack').map(item => item.value),
    pluginSystem.getContribution('runtime', 'variables'));
    
    playerRef.current = player;
    
    const slots = player.listSaveSlots();
    const hasData = slots.some(slot => slot.exists);
    setHasSaveData(hasData);
  }

  async function handleStartGame(): Promise<void> {
    if (!playerRef.current) return;
    playerRef.current.start(startSceneId);
    setGameStarted(true);
  }

  function handleContinueGame(): void {
    setShowGameMenu(true);
    setGameStarted(true);
  }

  function handleChoice(choiceId: string): void {
    if (playerRef.current) {
      playerRef.current.choose(choiceId);
    }
  }

  function handleNewGame(): void {
    if (playerRef.current) {
      playerRef.current.restart();
    }
  }

  function handleExit(): void {
    navigate('/');
  }

  const isImageHotspotMode = hotspots.length > 0 && background && !gameEnded;

  if (!gameStarted) {
    return (
      <StartScreen
        story={story}
        hasSaveData={hasSaveData}
        onStartGame={handleStartGame}
        onContinueGame={handleContinueGame}
        onExit={handleExit}
      />
    );
  }

  return (
    <div
      className="vn-player"
      data-player-template="builtin.visual-novel"
      data-scene-variant={story.presentation.sceneVariants[currentSceneId] ?? 'default'}
    >
      <button className="vn-menu-button" data-player-menu onClick={() => setShowGameMenu(true)}>
        ☰
      </button>
      
      {showGameMenu && playerRef.current && (
        <GameMenu
          playerController={playerRef.current}
          onClose={() => setShowGameMenu(false)}
          onNewGame={handleNewGame}
          onExit={handleExit}
        />
      )}

      {background && (
        <div 
          className="vn-background"
          style={{ 
            backgroundImage: `url(${background})`,
            backgroundPosition: nodeImage?.position || 'center'
          }}
        />
      )}
      
      {/* 图片热区模式：全屏背景+可点击热区（完全透明，无边框无标签） */}
      {isImageHotspotMode && nodeImage && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: nodeImage.position?.includes('top') ? 'flex-start' : 
                      nodeImage.position?.includes('bottom') ? 'flex-end' : 'center',
          justifyContent: nodeImage.position?.includes('left') ? 'flex-start' : 
                          nodeImage.position?.includes('right') ? 'flex-end' : 'center',
          pointerEvents: 'none',
          zIndex: 100
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: `${nodeImage.width} / ${nodeImage.height}`,
            pointerEvents: 'auto'
          }}>
            {hotspots.map((hotspot) => {
              return (
                <button
                  type="button"
                  aria-label={hotspot.label}
                  key={hotspot.id}
                  onClick={() => {
                    if (playerRef.current) {
                      playerRef.current.useHotspot(hotspot.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${hotspot.x * 100}%`,
                    top: `${hotspot.y * 100}%`,
                    width: `${hotspot.width * 100}%`,
                    height: `${hotspot.height * 100}%`,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 0,
                    padding: 0
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* 角色立绘层 - 独立层级，zIndex: 150 */}
      {(characterImages.left || characterImages.center || characterImages.right) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 150
        }}>
          {/* 渲染每个立绘 */}
          {[
            { key: 'left', image: characterImages.left },
            { key: 'center', image: characterImages.center },
            { key: 'right', image: characterImages.right }
          ].map(({ key, image }) => {
            if (!image) return null;
            
            const hPos = image.horizontalPosition || key as 'left' | 'center' | 'right';
            const vPos = image.verticalPosition || 'bottom';
            const scale = image.scale || 1.0;
            
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  // 水平位置
                  ...(hPos === 'left' ? { left: '5%' } :
                      hPos === 'right' ? { right: '5%' } :
                      { left: '50%', transform: 'translateX(-50%)' }),
                  // 垂直位置
                  ...(vPos === 'top' ? { top: '5%' } :
                      vPos === 'center' ? { top: '50%', transform: hPos === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)' } :
                      { bottom: '5%' }),
                  pointerEvents: 'none'
                }}
              >
                <img
                  src={image.url}
                  alt={`Character ${key}`}
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    transform: `scale(${scale})`,
                    transformOrigin: `${hPos} ${vPos}`,
                    display: 'block'
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {/* 传统模式：对话框+选项 */}
      {!isImageHotspotMode && (
        <div 
          className="vn-dialogue-container"
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 200,
            ...(dialogUIConfig.position === 'top' ? {
              top: '40px'
            } : dialogUIConfig.position === 'bottom' ? {
              bottom: '40px'
            } : {
              top: '50%',
              transform: 'translateY(-50%)'
            })
          }}
        >
        <div 
          className="vn-dialogue-box" 
          ref={dialogueBoxRef}
          style={{
            width: `${dialogUIConfig.width}%`,
            minHeight: `${dialogUIConfig.height}px`,
            maxHeight: '50vh',
            background: `rgba(0, 0, 0, ${dialogUIConfig.opacity})`,
            backdropFilter: `blur(${dialogUIConfig.blur}px)`,
            borderRadius: `${dialogUIConfig.radius}px`,
            padding: `${dialogUIConfig.padding}px ${dialogUIConfig.padding + 8}px`,
            color: '#ffffff',
            overflowY: 'auto'
          }}
        >
          {isTyping ? (
            <div className="vn-text" style={{ whiteSpace: 'pre-wrap', fontSize: `${dialogUIConfig.fontSize}px` }}>
              {displayText}
            </div>
          ) : (
            <div 
              className="vn-text"
              style={{ fontSize: `${dialogUIConfig.fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: displayText }}
            />
          )}
        </div>
        
        {currentChoices.length > 0 && !gameEnded && (
          <div className="vn-choices">
            {currentChoices.map((choice) => (
              <span
                key={choice.id}
                className="vn-choice-link"
                onClick={() => handleChoice(choice.id)}
              >
                {choice.text}
              </span>
            ))}
          </div>
        )}
      </div>
      )}
      
      {gameEnded && (
        <div className="vn-game-over">
          <div className="vn-game-over-text">游戏结束</div>
          <div className="vn-game-over-hint">
            点击左上角 ☰ 按钮，选择新游戏或退出
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualNovelPlayer;

