/**
 * 聊天风格播放器（微信风格）
 * 职责：以聊天界面形式展示故事内容
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerCore } from '../player/PlayerCore.ts';
import type { Story, CurrentNode, ChoiceWithTarget } from '../types/index.ts';
import config from '../config/index.ts';
import { initializeBlockly } from '../utils/blocklyInit.ts';
import { usePluginSystem } from '../contexts/PluginContext.tsx';
import ChatGameMenu from '../components/ChatGameMenu.tsx';
import '../styles/chat-style-player.css';
import '../styles/game-menu.css';
import '../styles/start-screen.css';

interface Hotspot {
  id: string;
  targetNodeId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ChatMessage {
  id: string;
  type: 'story' | 'choice' | 'image';
  text: string;
  choiceId?: string;
  timestamp: number;
  isTyping?: boolean;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  hotspots?: Hotspot[];
}

interface Props {
  story: Story;
}

function ChatStylePlayer({ story }: Props): JSX.Element {
  const navigate = useNavigate();
  const pluginSystem = usePluginSystem();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChoices, setCurrentChoices] = useState<ChoiceWithTarget[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [showGameMenu, setShowGameMenu] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [hasSaveData, setHasSaveData] = useState<boolean>(false);
  const [background, setBackground] = useState<string>('');
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const playerRef = useRef<PlayerCore | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 初始化 Blockly
  useEffect(() => {
    initializeBlockly(pluginSystem);
  }, [pluginSystem]);

  useEffect(() => {
    initializePlayer();
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 处理内嵌链接点击（文本中的选项链接）
  useEffect(() => {
    if (!gameStarted) {
      return;
    }

    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('choice-embed-link') || target.hasAttribute('data-choice-id')) {
        const choiceId = target.getAttribute('data-choice-id');
        const choiceText = target.textContent || '选择';
        if (choiceId && playerRef.current) {
          // 添加玩家选择的消息（显示在右侧）
          const choiceMessage: ChatMessage = {
            id: `choice_${choiceId}_${Date.now()}`,
            type: 'choice',
            text: choiceText,
            choiceId,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, choiceMessage]);
          setCurrentChoices([]);
          
          // 执行选择
          playerRef.current.makeChoice(choiceId);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [gameStarted]);

  async function initializePlayer(): Promise<void> {
    const player = new PlayerCore({
      saveKeyPrefix: `chat_save_${story.id}_`,
      onNodeChange: (node: CurrentNode) => {
        const renderedText = node.renderedHTML || node.text || '';
        
        // 获取节点数据
        const nodeData = story.nodes.find(n => n.id === node.id)?.data as any;
        const typewriterSpeed = nodeData?.typewriterSpeed || 0;
        
        const newMessages: ChatMessage[] = [];
        
        // 加载热区数据
        const imageHotspots = nodeData?.pluginData?.['image-hotspots'] || [];
        const hasHotspots = imageHotspots.length > 0;
        
        // 如果有背景图，先添加图片消息
        if (node.image?.imagePath) {
          const baseUrl = config.api.baseURL.replace('/api', '');
          const imageOwner = (story as any)._imageOwner || story.meta.author;
          const encodedOwner = encodeURIComponent(imageOwner);
          const imageUrl = `${baseUrl}/userdata/${encodedOwner}/${node.image.imagePath}`;
          
          newMessages.push({
            id: `image_${node.id}_${Date.now()}`,
            type: 'image',
            text: '',
            timestamp: Date.now(),
            imageUrl: imageUrl,
            imageWidth: node.image.width,
            imageHeight: node.image.height,
            hotspots: hasHotspots ? imageHotspots : undefined
          });
          
          // 清除全屏背景
          setBackground('');
        } else {
          setBackground('');
        }
        
        // 只有在非热区模式下才添加文本消息
        let messageId: string | null = null;
        if (!hasHotspots || !node.image) {
          messageId = `story_${node.id}_${Date.now()}`;
          newMessages.push({
            id: messageId,
            type: 'story',
            text: renderedText,
            timestamp: Date.now(),
            isTyping: typewriterSpeed > 0
          });
        }
        
        setMessages(prev => [...prev, ...newMessages]);
        
        // 如果有打字机效果，设置当前正在打字的消息
        if (messageId && typewriterSpeed > 0) {
          setTypingMessageId(messageId);
          // 模拟打字完成
          setTimeout(() => {
            setTypingMessageId(null);
          }, typewriterSpeed * renderedText.length);
        }
        
        setGameEnded(node.type === 'ending');
      },
      onChoicesChange: (choices) => {
        setCurrentChoices(choices);
      },
      onExit: () => navigate('/')
    });
    
    playerRef.current = player;
    
    (story as any)._baseURL = config.api.baseURL.replace('/api', '');
    
    const slots = player.getSaveSlots();
    const hasData = slots.some(slot => slot.exists);
    setHasSaveData(hasData);
  }

  async function handleStartGame(): Promise<void> {
    if (!playerRef.current) return;
    await playerRef.current.start(story);
    setGameStarted(true);
  }

  function handleContinueGame(): void {
    setShowGameMenu(true);
    setGameStarted(true);
  }

  function handleChoice(choiceId: string, choiceText: string): void {
    if (playerRef.current) {
      // 添加玩家选择的消息（显示在右侧）
      const choiceMessage: ChatMessage = {
        id: `choice_${choiceId}_${Date.now()}`,
        type: 'choice',
        text: choiceText,
        choiceId,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, choiceMessage]);
      setCurrentChoices([]);
      
      // 执行选择
      playerRef.current.makeChoice(choiceId);
    }
  }

  function handleNewGame(): void {
    if (playerRef.current) {
      setMessages([]);
      playerRef.current.executeRestart();
    }
  }

  function handleExit(): void {
    navigate('/');
  }

  return (
    <div className="chat-player">
      {/* 背景（模糊效果） */}
      {background && (
        <div 
          className="chat-background"
          style={{ backgroundImage: `url(${background})` }}
        />
      )}
      
      {/* 手机容器 */}
      <div className="chat-phone-container">
        {/* 开始屏幕 */}
        {!gameStarted ? (
          <div className="chat-start-screen">
            <div className="chat-start-content">
              <h1 className="chat-start-title">{story.meta.title}</h1>
              <p className="chat-start-author">{story.meta.author}</p>
              {story.meta.description && (
                <p className="chat-start-description">{story.meta.description}</p>
              )}
              <div className="chat-start-buttons">
                <button onClick={handleStartGame}>开始游戏</button>
                {hasSaveData && (
                  <button onClick={handleContinueGame}>继续游戏</button>
                )}
                <button onClick={handleExit}>退出游戏</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 顶部标题栏 */}
            <div className="chat-header">
              <button className="chat-back-button" onClick={handleExit}>
                ‹
              </button>
              <div className="chat-title">{story.meta.title}</div>
              <button className="chat-menu-button" onClick={() => setShowGameMenu(true)}>
                ⋯
              </button>
            </div>
        
        {/* 聊天消息区 */}
        <div className="chat-messages-container" ref={chatContainerRef}>
          <div className="chat-messages">
            {messages.map((message) => {
              // 图片消息
              if (message.type === 'image') {
                const hasHotspots = message.hotspots && message.hotspots.length > 0;
                
                return (
                  <div 
                    key={message.id}
                    className="chat-message chat-message-left"
                  >
                    <div className="chat-bubble chat-bubble-image">
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        display: 'inline-block'
                      }}>
                        <img 
                          src={message.imageUrl} 
                          alt="故事图片"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '4px',
                            display: 'block'
                          }}
                        />
                        {/* 热区层（完全透明，无边框） */}
                        {hasHotspots && message.hotspots!.map((hotspot) => (
                          <div
                            key={hotspot.id}
                            onClick={() => {
                              if (playerRef.current) {
                                playerRef.current.jumpToNode(hotspot.targetNodeId);
                              }
                            }}
                            style={{
                              position: 'absolute',
                              left: `${hotspot.x * 100}%`,
                              top: `${hotspot.y * 100}%`,
                              width: `${hotspot.width * 100}%`,
                              height: `${hotspot.height * 100}%`,
                              cursor: 'pointer',
                              background: 'transparent'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // 文本消息
              return (
                <div 
                  key={message.id}
                  className={`chat-message ${message.type === 'choice' ? 'chat-message-right' : 'chat-message-left'}`}
                >
                  <div 
                    className={`chat-bubble ${message.type === 'choice' ? 'chat-bubble-choice' : 'chat-bubble-story'}`}
                  >
                    {message.isTyping && message.id === typingMessageId ? (
                      <div className="chat-typing-text">{message.text}</div>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: message.text }} />
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* 当前可选择的选项（热区模式下不显示） */}
            {currentChoices.length > 0 && !gameEnded && (() => {
              // 检查最后一条消息是否是带热区的图片
              const lastMessage = messages[messages.length - 1];
              const isHotspotMode = lastMessage?.type === 'image' && lastMessage.hotspots && lastMessage.hotspots.length > 0;
              
              if (isHotspotMode) {
                return null; // 热区模式下不显示选项
              }
              
              return (
                <div className="chat-message chat-message-left">
                  <div className="chat-bubble">
                    {currentChoices.map((choice, index) => (
                      <div key={choice.id}>
                        <span
                          className="chat-choice-link"
                          onClick={() => handleChoice(choice.id, choice.text)}
                        >
                          {choice.text}
                        </span>
                        {index < currentChoices.length - 1 && <br />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            
            {gameEnded && (
              <div className="chat-game-over">
                <div className="chat-game-over-text">游戏结束</div>
                <div className="chat-game-over-hint">
                  点击右上角 ⋯ 按钮查看菜单
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* 游戏菜单（在手机容器内） */}
        {showGameMenu && playerRef.current && (
          <ChatGameMenu
            playerCore={playerRef.current}
            onClose={() => setShowGameMenu(false)}
            onNewGame={handleNewGame}
            onExit={handleExit}
          />
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default ChatStylePlayer;

