/**
 * 右侧编辑面板（新版本）
 * 职责：容纳上下两栏布局，管理节点编辑的整体界面
 * 布局：固定在页面右侧，可关闭
 */

import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import type { StoryNode, StoryMeta, Choice, VariableDefinition } from '../types/index.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import NodeContentPanel, { type NodeContentPanelRef } from './NodeContentPanel';
import NodeVisualPanel, { type NodeVisualPanelRef } from './NodeVisualPanel';

interface BottomEditPanelProps {
  node: StoryNode;
  allNodes: StoryNode[];
  onUpdate: (nodeId: string, data: Partial<StoryNode['data']>) => void;
  onClose: () => void;
  onDeleteChoice?: (nodeId: string, choiceIndex: number, choice: Choice) => void;
  globalVariables?: VariableDefinition[];
  storyMeta: StoryMeta;
}

export interface BottomEditPanelRef {
  applyChanges: () => Partial<StoryNode['data']> | null;
}

const BottomEditPanel = forwardRef<BottomEditPanelRef, BottomEditPanelProps>(
  ({ node, allNodes, onUpdate, onClose, onDeleteChoice, globalVariables = [], storyMeta }, ref) => {
    const { currentTheme } = useTheme();
    const isDark = currentTheme === 'theme.dark';
    const contentPanelRef = useRef<NodeContentPanelRef>(null);
    const visualPanelRef = useRef<NodeVisualPanelRef>(null);

  const getMergedData = useCallback(() => {
    const contentData = contentPanelRef.current?.applyChanges();
    const visualData = visualPanelRef.current?.applyChanges();
    
    if (!contentData || !visualData) {
      console.error('[BottomEditPanel] 数据获取失败');
      return null;
    }
    
    const mergedData = {
      ...node.data,
      ...contentData,
      ...visualData,
      pluginData: {
        ...(node.data as any).pluginData,
        ...(contentData as any).pluginData,
        ...(visualData as any).pluginData
      }
    };
    
    return mergedData;
  }, [node]);

  useImperativeHandle(ref, () => ({
    applyChanges: () => getMergedData()
  }), [getMergedData]);

    const handleClose = () => {
      const mergedData = getMergedData();
      
      if (mergedData) {
        onUpdate(node.id, mergedData);
      }
      
      onClose();
    };

    return (
      <div 
        data-testid="bottom-edit-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '390px',
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? '#1e293b' : '#ffffff',
          borderLeft: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
          zIndex: 1000,
          boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)'
        }}>
        {/* 顶部工具栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
          background: isDark ? '#0f172a' : '#f9fafb',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: '0.95rem',
            fontWeight: '600',
            color: isDark ? '#e2e8f0' : '#1f2937'
          }}>
            编辑节点 {node.data.nodeId}
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: '4px 12px',
              background: 'transparent',
              border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
              borderRadius: '4px',
              color: isDark ? '#e2e8f0' : '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            关闭
          </button>
        </div>

        {/* 两栏内容区（垂直布局） */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 上部：节点内容编辑 */}
          <div style={{
            flex: '1 1 50%',
            minHeight: 0,
            borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
            overflow: 'auto'
          }}>
            <NodeContentPanel
              ref={contentPanelRef}
              node={node}
              onUpdate={onUpdate}
              onDeleteChoice={onDeleteChoice}
              globalVariables={globalVariables}
            />
          </div>

          {/* 下部：图片资源与UI配置 */}
          <div style={{
            flex: '1 1 50%',
            minHeight: 0,
            overflow: 'auto'
          }}>
            <NodeVisualPanel
              ref={visualPanelRef}
              node={node}
              allNodes={allNodes}
              onUpdate={onUpdate}
              storyMeta={storyMeta}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default BottomEditPanel;
