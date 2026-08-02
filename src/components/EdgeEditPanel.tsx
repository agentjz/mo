/**
 * 连线编辑面板
 * 职责：显示连线详情，提供删除功能
 */

import { useState, useEffect } from 'react'
import type { StoryNode, StoryEdge, TextNodeData } from '../types/index.ts'
import { useTheme } from '../contexts/ThemeContext.tsx'

interface EdgeEditPanelProps {
  edge: StoryEdge;
  nodes: StoryNode[];
  onDelete: (edgeId: string) => void;
  onClose: () => void;
}

function EdgeEditPanel({ edge, nodes, onDelete, onClose }: EdgeEditPanelProps): JSX.Element {
  const { currentTheme } = useTheme()
  const isDark = currentTheme === 'theme.dark'
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false)

  useEffect(() => {
    if (deleteConfirm) {
      const timer = setTimeout(() => {
        setDeleteConfirm(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return () => {} // 返回空清理函数
  }, [deleteConfirm])

  const handleDeleteClick = (): void => {
    if (deleteConfirm) {
      onDelete(edge.id)
      onClose()
    } else {
      setDeleteConfirm(true)
    }
  }

  // 找到源节点和目标节点
  const sourceNode = nodes.find(n => n.id === edge.source)
  const targetNode = nodes.find(n => n.id === edge.target)

  // 找到具体的选项
  const sourceChoice = sourceNode 
    ? (sourceNode.data as TextNodeData).choices?.find((c: any) => c.id === edge.sourceHandle)
    : null

  const getNodeTypeLabel = (nodeType?: string): string => {
    switch (nodeType) {
      case 'start': return '开始'
      case 'ending': return '结局'
      default: return '普通'
    }
  }

  return (
    <div className="edit-panel edge-edit-panel">
      <div className="panel-header">
        <h2>连线详情</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        <div className="edge-info">
          <div className="info-row">
            <label style={{ color: isDark ? '#94a3b8' : '#64748b' }}>起始节点：</label>
            <div className="info-value" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
              节点 {sourceNode?.data.nodeId} - {getNodeTypeLabel(sourceNode?.data.nodeType)}
            </div>
          </div>

          <div className="info-row">
            <label style={{ color: isDark ? '#94a3b8' : '#64748b' }}>选项：</label>
            <div className="info-value choice-preview" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
              {sourceChoice?.text || '未知选项'}
            </div>
          </div>

          <div className="info-row">
            <label style={{ color: isDark ? '#94a3b8' : '#64748b' }}>目标节点：</label>
            <div className="info-value" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
              节点 {targetNode?.data.nodeId} - {getNodeTypeLabel(targetNode?.data.nodeType)}
            </div>
          </div>

          <div className="connection-visual">
            <div className="connection-line" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
              <span className="connection-start">{sourceNode?.data.nodeId}</span>
              <span className="connection-arrow">→</span>
              <span className="connection-end">{targetNode?.data.nodeId}</span>
            </div>
          </div>
        </div>

        <div className="danger-zone">
          <h3 style={{ color: isDark ? '#f87171' : '#dc2626' }}>危险操作</h3>
          <p className="danger-hint" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>删除此连线将断开节点之间的联系</p>
          <button 
            className={`btn ${deleteConfirm ? 'btn-danger-confirm' : 'btn-danger'}`}
            onClick={handleDeleteClick}
          >
            {deleteConfirm ? '确认删除？(3秒后取消)' : '删除此连线'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EdgeEditPanel

