/**
 * 故事节点组件（可复用）
 * 职责：渲染单个节点的视图
 * 
 * 重构说明：
 * - 显示分析信息（深度、可达结局、关键决策点）
 * - 循环节点特殊标记
 * - 更丰富的视觉反馈
 */

import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import config from '../config/index.ts'
import type { NodeData } from '../types/index.ts'
import type { NodeAnalysis } from '../utils/engine/storyAnalyzer.ts'

interface StoryNodeProps {
  data: NodeData & {
    analysis?: NodeAnalysis | null;  // 新增：节点分析信息
  };
}

const StoryNode = memo(({ data }: StoryNodeProps) => {
  const analysis = data.analysis;

  const getNodeStyle = (): React.CSSProperties => {
    const colors = config.ui.nodeColors;
    let style: React.CSSProperties;

    switch (data.nodeType) {
      case 'start':
        style = { borderColor: colors.start.border, backgroundColor: colors.start.background }
        break;
      case 'ending':
        style = { borderColor: colors.ending.border, backgroundColor: colors.ending.background }
        break;
      default:
        style = { borderColor: colors.normal.border, backgroundColor: colors.normal.background }
        break;
    }

    // 关键决策点：红色边框
    if (analysis?.isKeyDecision) {
      style.borderColor = '#ef4444';
      style.borderWidth = '3px';
    }

    // 循环节点：虚线边框
    if (analysis?.isInLoop) {
      style.borderStyle = 'dashed';
      style.borderWidth = '2px';
    }

    return style;
  }

  const getNodeTypeText = (): string => {
    switch (data.nodeType) {
      case 'start':
        return '开始'
      case 'ending':
        return '结局'
      default:
        return '普通'
    }
  }

  return (
    <div className="story-node" style={getNodeStyle()}>
      {/* 开始节点不应该有输入连接点 */}
      {data.nodeType !== 'start' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="node-handle"
        />
      )}

      <div className="node-header">
        <span className="node-title">
          节点 {data.nodeId} - {getNodeTypeText()}
        </span>
        
        {/* 显示深度信息 */}
        {analysis && analysis.depth !== Infinity && (
          <span className="node-depth" style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280',
            marginLeft: '8px'
          }}>
            第{analysis.depth}层
          </span>
        )}
      </div>

      {/* 用户标签 */}
      {(data as any).tags && (data as any).tags.length > 0 && (
        <div className="node-user-tags" style={{ 
          display: 'flex', 
          gap: '4px', 
          flexWrap: 'wrap',
          marginTop: '4px',
          marginBottom: '6px'
        }}>
          {(data as any).tags.map((tag: string) => (
            <span 
              key={tag}
              style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                fontWeight: '500',
                border: '1px solid #bae6fd'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 分析信息标签 */}
      {analysis && (
        <div className="node-badges" style={{ 
          display: 'flex', 
          gap: '4px', 
          flexWrap: 'wrap',
          marginTop: '4px',
          marginBottom: '8px'
        }}>
          {analysis.isKeyDecision && (
            <span className="badge badge-key-decision" style={{
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5'
            }}>
              关键决策
            </span>
          )}
          
          {analysis.isInLoop && (
            <span className="badge badge-loop" style={{
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              border: '1px solid #93c5fd'
            }}>
              循环
            </span>
          )}
          
          {analysis.reachableEndings.length > 0 && (
            <span className="badge badge-endings" style={{
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              border: '1px solid #6ee7b7'
            }}>
              {analysis.reachableEndings.length}个结局
            </span>
          )}
        </div>
      )}

      {/* 渲染节点内容 */}
      <div className="node-content">
        {data.text.substring(0, 120)}
        {data.text.length > 120 && '...'}
      </div>

      {/* 输出连接点 */}
      {data.nodeType !== 'ending' && (
        <div className="node-choices">
          {data.choices.map((choice, index) => (
            <div key={choice.id} className="choice-item">
              <span className="choice-text">{index + 1}. {choice.text}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={choice.id}
                className="node-handle choice-handle"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* 结束节点显示提示文字 */}
      {data.nodeType === 'ending' && (
        <div className="node-ending-hint">
          [故事结局]
        </div>
      )}

      {/* 节点统计信息（鼠标悬停时显示更多） */}
      {analysis && (
        <div className="node-stats" style={{
          fontSize: '0.7rem',
          color: '#9ca3af',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div>入度: {analysis.inDegree}; 出度: {analysis.outDegree}{analysis.maxDepthToEnd > 0 ? `; 距结局: ${analysis.maxDepthToEnd}步` : ''}</div>
        </div>
      )}
    </div>
  )
})

StoryNode.displayName = 'StoryNode'

export default StoryNode
