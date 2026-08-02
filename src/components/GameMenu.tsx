import { useState } from 'react';
import type { PlayerCore } from '../player/PlayerCore.ts';

interface GameMenuProps {
  playerCore: PlayerCore;
  onClose: () => void;
  onNewGame: () => void;
  onExit: () => void;
}

type MenuView = 'main' | 'save' | 'load' | 'worldmap' | 'player';

function GameMenu({ playerCore, onClose, onNewGame, onExit }: GameMenuProps): JSX.Element {
  const [currentView, setCurrentView] = useState<MenuView>('main');
  const [feedback, setFeedback] = useState<string>('');
  const [playerTab, setPlayerTab] = useState<'attributes' | 'inventory'>('attributes');

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 2000);
  };

  const handleNewGame = () => {
    if (confirm('确定要开始新游戏吗？当前进度将会丢失。')) {
      onNewGame();
      onClose();
    }
  };

  const handleSave = (slotId: number) => {
    const success = playerCore.saveToSlot(slotId);
    if (success) {
      showFeedback(`已保存到槽位 ${slotId}`);
    } else {
      showFeedback('保存失败');
    }
  };

  const handleLoad = (slotId: number) => {
    const node = playerCore.loadFromSlot(slotId);
    if (node) {
      showFeedback(`已加载槽位 ${slotId}`);
      setTimeout(() => onClose(), 500);
    } else {
      showFeedback('加载失败或槽位为空');
    }
  };

  const handleJumpToNode = (nodeId: string) => {
    playerCore.jumpToNode(nodeId);
    onClose();
  };

  const handleBack = () => {
    if (currentView === 'main') {
      onClose();
    } else {
      setCurrentView('main');
    }
  };

  const renderMainMenu = () => (
    <div className="game-menu-list">
      <button onClick={handleNewGame}>新游戏</button>
      <button onClick={() => setCurrentView('load')}>继续游戏</button>
      <button onClick={() => setCurrentView('save')}>保存游戏</button>
      <button onClick={() => setCurrentView('worldmap')}>世界地图</button>
      <button onClick={() => setCurrentView('player')}>玩家</button>
      <button onClick={onExit}>退出游戏</button>
    </div>
  );

  const renderSaveMenu = () => {
    const slots = playerCore.getSaveSlots();
    
    return (
      <div className="game-menu-slots">
        <h3>保存游戏</h3>
        {slots.map(slot => (
          <div key={slot.slotId} className="game-menu-slot">
            <div className="game-menu-slot-header">
              <span>槽位 {slot.slotId}</span>
              <button onClick={() => handleSave(slot.slotId)}>保存</button>
            </div>
            {slot.exists && (
              <div className="game-menu-slot-info">
                <div>{slot.nodeName}</div>
                <div className="game-menu-slot-time">
                  {slot.saveTime ? new Date(slot.saveTime).toLocaleString('zh-CN') : ''}
                </div>
              </div>
            )}
            {!slot.exists && (
              <div className="game-menu-slot-empty">空槽位</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderLoadMenu = () => {
    const slots = playerCore.getSaveSlots();
    
    return (
      <div className="game-menu-slots">
        <h3>继续游戏</h3>
        {slots.map(slot => (
          <div key={slot.slotId} className="game-menu-slot">
            <div className="game-menu-slot-header">
              <span>槽位 {slot.slotId}</span>
              {slot.exists && (
                <button onClick={() => handleLoad(slot.slotId)}>加载</button>
              )}
            </div>
            {slot.exists && (
              <div className="game-menu-slot-info">
                <div>{slot.nodeName}</div>
                <div className="game-menu-slot-time">
                  {slot.saveTime ? new Date(slot.saveTime).toLocaleString('zh-CN') : ''}
                </div>
              </div>
            )}
            {!slot.exists && (
              <div className="game-menu-slot-empty">空槽位</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderWorldMap = () => {
    const visitedNodes = playerCore.getVisitedNodes();
    
    return (
      <div className="game-menu-worldmap">
        <h3>世界地图</h3>
        {visitedNodes.length === 0 && (
          <div className="game-menu-empty">暂无已访问的场景</div>
        )}
        {visitedNodes.length > 0 && (
          <div className="game-menu-node-list">
            {visitedNodes.map(node => (
              <button
                key={node.nodeId}
                className="game-menu-node-item"
                onClick={() => handleJumpToNode(node.nodeId)}
              >
                <div className="game-menu-node-name">{node.nodeName}</div>
                <div className="game-menu-node-meta">
                  访问 {node.visitCount} 次
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPlayer = () => {
    const variables = playerCore.getDisplayVariables();
    const story = playerCore.getCurrentStory();
    
    // 根据type分类变量
    const attributes = variables.filter(v => {
      const varDef = story?.variables?.find(vd => vd.id === v.id);
      return varDef?.type === 'number' || varDef?.type === 'string';
    });
    
    const inventory = variables.filter(v => {
      const varDef = story?.variables?.find(vd => vd.id === v.id);
      return varDef?.type === 'boolean';
    });
    
    return (
      <div className="game-menu-player">
        <h3>玩家</h3>
        
        {/* Tab切换按钮 */}
        <div className="player-tabs">
          <button 
            className={playerTab === 'attributes' ? 'active' : ''}
            onClick={() => setPlayerTab('attributes')}
          >
            属性
          </button>
          <button 
            className={playerTab === 'inventory' ? 'active' : ''}
            onClick={() => setPlayerTab('inventory')}
          >
            背包
          </button>
        </div>
        
        {/* 属性Tab */}
        {playerTab === 'attributes' && (
          <div className="game-menu-attributes-tab">
            {attributes.length === 0 && (
              <div className="game-menu-empty">暂无属性数据</div>
            )}
            {attributes.length > 0 && (
              <div className="game-menu-var-list">
                {attributes.map(variable => (
                  <div key={variable.id} className="game-menu-var-item">
                    <span className="game-menu-var-label">{variable.label}</span>
                    <span className="game-menu-var-value">{String(variable.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* 背包Tab */}
        {playerTab === 'inventory' && (
          <div className="game-menu-inventory-tab">
            {inventory.length === 0 && (
              <div className="game-menu-empty">暂无物品数据</div>
            )}
            {inventory.length > 0 && (
              <div className="game-menu-inventory-list">
                {inventory.map(variable => (
                  <div key={variable.id} className="game-menu-inventory-item">
                    <span className="inventory-icon">
                      {variable.value ? '✅' : '❌'}
                    </span>
                    <span className={`inventory-name ${variable.value ? 'collected' : 'missing'}`}>
                      {variable.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="game-menu-overlay" onClick={onClose}>
      <div className="game-menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="game-menu-header">
          <h2>菜单</h2>
          <button className="game-menu-close" onClick={handleBack}>
            {currentView === 'main' ? '×' : '返回'}
          </button>
        </div>
        
        <div className="game-menu-content">
          {currentView === 'main' && renderMainMenu()}
          {currentView === 'save' && renderSaveMenu()}
          {currentView === 'load' && renderLoadMenu()}
          {currentView === 'worldmap' && renderWorldMap()}
          {currentView === 'player' && renderPlayer()}
        </div>
        
        {feedback && (
          <div className="game-menu-feedback">{feedback}</div>
        )}
      </div>
    </div>
  );
}

export default GameMenu;

