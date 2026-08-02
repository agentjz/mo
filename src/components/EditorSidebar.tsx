/**
 * 编辑器侧边栏
 * 职责：元数据编辑、工具按钮、变量管理
 */

import { useState, useEffect } from 'react';
import { useNodeSearch } from '../hooks/useNodeSearch.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import type { StoryMeta, ValidationResult, VariableDefinition } from '../types/index.ts';
import ScriptHelper from './ScriptHelper.tsx';
import VariableManager from './VariableManager.tsx';

interface StoryStats {
  nodeCount: number;
  edgeCount: number;
  maxDepth: number;
  endingCount: number;
  hasCycles: boolean;
  cycleCount: number;
  sccCount: number;
  keyDecisionCount: number;
}

interface EditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyMeta: StoryMeta;
  variables: VariableDefinition[];
  onMetaChange: (meta: StoryMeta) => void;
  onVariablesChange: (variables: VariableDefinition[]) => void;
  onAddNode: () => void;
  onDeleteNode: () => void;
  onValidate: () => void;
  onAutoLayout: (layoutType?: 'hierarchical' | 'radial') => void;
  onJumpToNode: (nodeId: string) => void;
  onBackToDashboard: () => void;
  onPlay: () => void;
  hasSelectedNode: boolean;
  validationResult: ValidationResult | null;
  nodeCount: number;
  allNodes: Array<{ id: string; nodeId: number; nodeType: string; text: string; tags?: string[] }>;
  storyStats: StoryStats | null;
  keyDecisionNodes: Array<{ id: string; nodeId: number }>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  tagFilter: string;
  allTags: string[];
  onTagFilterChange: (tag: string) => void;
}

function EditorSidebar({ 
  isOpen,
  onClose,
  storyId,
  storyMeta,
  variables,
  onMetaChange,
  onVariablesChange,
  onAddNode,
  onDeleteNode, 
  onValidate,
  onAutoLayout,
  onJumpToNode,
  onBackToDashboard,
  onPlay,
  hasSelectedNode,
  validationResult,
  nodeCount,
  allNodes,
  storyStats,
  keyDecisionNodes,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  tagFilter,
  allTags,
  onTagFilterChange
}: EditorSidebarProps): JSX.Element {
  const { currentTheme } = useTheme();
  const isDark = currentTheme === 'theme.dark';
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const [showAllNodes, setShowAllNodes] = useState<boolean>(false);
  const [startNodeId, setStartNodeId] = useState<string>('');
  
  const { searchText, setSearchText, filteredNodes, searchStats } = useNodeSearch(allNodes);

  const totalWordCount = allNodes.reduce((sum, node) => {
    return sum + node.text.replace(/\s/g, '').length;
  }, 0);

  useEffect(() => {
    if (deleteConfirm) {
      const timer = setTimeout(() => {
        setDeleteConfirm(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [deleteConfirm]);

  const handleDeleteClick = (): void => {
    if (!hasSelectedNode) return;
    
    if (deleteConfirm) {
      onDeleteNode();
      setDeleteConfirm(false);
    } else {
      setDeleteConfirm(true);
    }
  };

  return (
    <div className={`editor-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <button className="mobile-close-btn" onClick={onClose}>×</button>
      
      <div className="sidebar-content">
        <div className="section">
          <div className="section-header">
            <h3>故事信息</h3>
            <button 
              className="btn-back btn-small" 
              onClick={onBackToDashboard}
            >
              返回仪表盘
            </button>
          </div>

          <div className="form-group">
            <label>标题</label>
            <input
              type="text"
              value={storyMeta.title}
              onChange={(e) => onMetaChange({ ...storyMeta, title: e.target.value })}
              placeholder="我的互动小说"
            />
          </div>

          <div className="form-group">
            <label>作者</label>
            <input
              type="text"
              value={storyMeta.author}
              onChange={(e) => onMetaChange({ ...storyMeta, author: e.target.value })}
              placeholder="作者名"
            />
          </div>

          <div className="form-group">
            <label>简介</label>
            <textarea
              value={storyMeta.description}
              onChange={(e) => onMetaChange({ ...storyMeta, description: e.target.value })}
              placeholder="故事简介..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>播放器样式</label>
            <select
              value={storyMeta.renderStyle || 'visual-novel'}
              onChange={(e) => onMetaChange({ ...storyMeta, renderStyle: e.target.value as 'visual-novel' | 'chat' })}
            >
              <option value="visual-novel">视觉小说</option>
              <option value="chat">微信聊天</option>
            </select>
          </div>

          {allTags.length > 1 && (
            <div className="form-group">
              <label>分组</label>
              <select 
                value={tagFilter} 
                onChange={(e) => onTagFilterChange(e.target.value)}
                className="tag-filter-select"
              >
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 节点操作 */}
        <div className="section">
          <h3>节点操作 <span className="node-count-badge">({nodeCount}个)</span></h3>
          
          <div className="form-group">
            <label>从指定节点播放（可选）</label>
            <input
              type="number"
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              placeholder="输入节点ID，留空从头开始"
              min="0"
            />
          </div>
          
          <button 
            className="btn btn-success" 
            onClick={() => {
              const nodeIdNum = parseInt(startNodeId);
              if (startNodeId && !isNaN(nodeIdNum)) {
                const node = allNodes.find(n => n.nodeId === nodeIdNum);
                if (node) {
                  window.open(`${import.meta.env.BASE_URL}#/play/${storyId}?startNode=${node.id}`, '_blank');
                } else {
                  alert(`节点 ${startNodeId} 不存在`);
                }
              } else {
                onPlay();
              }
            }}
          >
            播放
          </button>

          <div className="node-creation-buttons">
            <button className="btn btn-primary" onClick={onAddNode}>
              + 添加节点
            </button>
          </div>
          <button 
            className={`btn ${deleteConfirm ? 'btn-danger-confirm' : 'btn-danger'}`}
            onClick={handleDeleteClick}
            disabled={!hasSelectedNode}
          >
            {deleteConfirm ? '确认删除？' : '删除选中节点'}
          </button>

          {/* 节点列表（可折叠+搜索） */}
          <div className="node-list-section">
            <button 
              className="toggle-list-btn"
              onClick={() => setShowAllNodes(!showAllNodes)}
            >
              {showAllNodes ? '▼' : '▶'} 全部节点
            </button>
            
            {showAllNodes && (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索节点内容..."
                    className="node-search-input"
                  />
                  {searchStats && (
                    <div className="search-stats">
                      找到 {searchStats.total} 个节点
                      {searchStats.byType.start > 0 && ` (开始: ${searchStats.byType.start})`}
                      {searchStats.byType.normal > 0 && ` (普通: ${searchStats.byType.normal})`}
                      {searchStats.byType.ending > 0 && ` (结局: ${searchStats.byType.ending})`}
                    </div>
                  )}
                </div>
                
                <div className="all-nodes-list">
                  {filteredNodes
                    .sort((a, b) => a.nodeId - b.nodeId)
                    .map(node => {
                      const getNodeClass = () => {
                        if (node.nodeType === 'start') return 'node-tag-start'
                        if (node.nodeType === 'ending') return 'node-tag-ending'
                        return 'node-tag-normal'
                      }
                      
                      const getNodeLabel = () => {
                        if (node.nodeType === 'start') return '▶'
                        if (node.nodeType === 'ending') return '●'
                        return ''
                      }
                      
                      // 截取文本预览（最多30个字符）
                      const nodeText = node.text || '(空节点)'
                      const textPreview = nodeText.length > 30 
                        ? nodeText.substring(0, 30) + '...' 
                        : nodeText
                      
                      return (
                        <button
                          key={node.id}
                          className={`node-tag ${getNodeClass()}`}
                          onClick={() => onJumpToNode(node.id)}
                          title={nodeText}
                        >
                          {getNodeLabel()} 节点 {node.nodeId}: {textPreview}
                        </button>
                      )
                    })}
                    
                  {searchStats && filteredNodes.length === 0 && (
                    <div className="no-results">未找到匹配的节点</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 变量 */}
        <div className="section">
          <VariableManager
            variables={variables}
            onVariablesChange={onVariablesChange}
          />
        </div>

        {/* 脚本助手 */}
        <ScriptHelper 
          variables={variables}
          onVariablesChange={onVariablesChange}
        />

        {/* 工具 */}
        <div className="section">
          <h3>工具</h3>
          
          <div className="history-buttons">
            <button 
              className="btn btn-secondary"
              onClick={onUndo}
              disabled={!canUndo}
              title="撤销"
            >
              ↶ 撤销
            </button>
            <button 
              className="btn btn-secondary"
              onClick={onRedo}
              disabled={!canRedo}
              title="重做"
            >
              ↷ 重做
            </button>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={() => onAutoLayout('hierarchical')}
          >
            层次布局
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onAutoLayout('radial')}
          >
            辐射布局
          </button>

          <button className="btn btn-secondary" onClick={onValidate}>
            验证故事
          </button>
        </div>

        {validationResult && (
          <div className="section validation-section">
            <h3>验证结果</h3>
            
            {validationResult.valid && (
              <div className="validation-success" style={{ 
                color: isDark ? '#4ade80' : '#16a34a',
                background: isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                border: `1px solid ${isDark ? 'rgba(74, 222, 128, 0.3)' : 'rgba(22, 163, 74, 0.3)'}`
              }}>
                验证通过！没有发现问题
              </div>
            )}

            {validationResult.errors.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ color: isDark ? '#f87171' : '#dc2626', marginBottom: '8px' }}>错误 ({validationResult.errors.length})</h4>
                {validationResult.errors.map((err: string, i: number) => (
                  <div key={i} style={{ 
                    background: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    marginBottom: '6px'
                  }}>{err}</div>
                ))}
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ color: isDark ? '#f87171' : '#dc2626', marginBottom: '8px' }}>警告 ({validationResult.warnings.length})</h4>
                {validationResult.warnings.map((warn: string, i: number) => (
                  <div key={i} style={{ 
                    background: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    marginBottom: '6px'
                  }}>{warn}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {storyStats && (
          <div className="section stats-section">
            <h3>故事统计</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">节点</span>
                <span className="stat-value">{storyStats.nodeCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">连线</span>
                <span className="stat-value">{storyStats.edgeCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">最大深度</span>
                <span className="stat-value">{storyStats.maxDepth}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">结局</span>
                <span className="stat-value">{storyStats.endingCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">总字数</span>
                <span className="stat-value">{totalWordCount}</span>
              </div>
            </div>

            {keyDecisionNodes.length > 0 && (
              <div className="analysis-detail">
                <h4>关键决策点 ({keyDecisionNodes.length})</h4>
                <div className="node-list">
                  {keyDecisionNodes.slice(0, 5).map(node => (
                    <button
                      key={node.id}
                      className="node-tag node-tag-decision"
                      onClick={() => onJumpToNode(node.id)}
                    >
                      节点 {node.nodeId}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default EditorSidebar;
