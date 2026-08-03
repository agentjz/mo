import { useEffect, useState } from 'react';
import type { StoryFlowNode as StoryNode } from '../ui/editor/flowTypes.ts';
import HotspotEditor, { type Hotspot } from './HotspotEditor.tsx';

interface HotspotDraft {
  show: boolean;
  rect: { x: number; y: number; width: number; height: number } | null;
  label: string;
  targetNodeId: string;
}

interface Props {
  nodeId: string;
  imageUrl: string;
  allNodes: StoryNode[];
  hotspots: Hotspot[];
  isDark: boolean;
  onChange: (hotspots: Hotspot[]) => void;
}

const emptyDraft: HotspotDraft = { show: false, rect: null, label: '', targetNodeId: '' };

function HotspotManager({ nodeId, imageUrl, allNodes, hotspots, isDark, onChange }: Props): JSX.Element {
  const [draft, setDraft] = useState<HotspotDraft>(emptyDraft);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!deleteConfirm) return;
    const timer = setTimeout(() => setDeleteConfirm(null), 3000);
    return () => clearTimeout(timer);
  }, [deleteConfirm]);

  const availableNodes = allNodes.filter(node => node.id !== nodeId);

  return (
    <div className="form-group">
      <label>热区管理</label>
      <div style={{
        marginBottom: '12px', padding: '12px', background: isDark ? '#1e293b' : '#f9fafb',
        border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: '6px',
      }}>
        <div style={{
          fontWeight: '600', marginBottom: '8px', color: isDark ? '#cbd5e1' : '#374151', fontSize: '0.9rem',
        }}>
          热区列表 ({hotspots.length})
        </div>
        {hotspots.length === 0 ? (
          <div style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.85rem', fontStyle: 'italic' }}>
            暂无热区，点击下方图片绘制
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hotspots.map(hotspot => {
              const targetNode = allNodes.find(node => node.id === hotspot.targetNodeId);
              const nodeLabel = targetNode ? `节点${targetNode.data.nodeId}` : '已删除';
              return (
                <div
                  key={hotspot.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px',
                    background: isDark ? '#0f172a' : '#ffffff',
                    border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`, borderRadius: '4px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '500', color: isDark ? '#e2e8f0' : '#1f2937',
                      fontSize: '0.875rem', marginBottom: '2px',
                    }}>
                      {hotspot.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#6b7280' }}>→ {nodeLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteConfirm === hotspot.id) {
                        onChange(hotspots.filter(candidate => candidate.id !== hotspot.id));
                        setDeleteConfirm(null);
                      } else {
                        setDeleteConfirm(hotspot.id);
                      }
                    }}
                    style={{
                      padding: '4px 8px', background: deleteConfirm === hotspot.id ? '#ef4444' : 'transparent',
                      border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`, borderRadius: '4px',
                      color: deleteConfirm === hotspot.id ? '#ffffff' : (isDark ? '#ef4444' : '#dc2626'),
                      cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0, transition: 'all 0.2s',
                    }}
                  >
                    {deleteConfirm === hotspot.id ? '确认？' : '删除'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {draft.show && (
        <div style={{
          marginBottom: '12px', padding: '12px', background: isDark ? '#1e3a5f' : '#e0f2fe',
          border: '2px solid #3b82f6', borderRadius: '6px',
        }}>
          <div style={{
            fontWeight: '600', marginBottom: '12px', color: isDark ? '#60a5fa' : '#0369a1', fontSize: '0.9rem',
          }}>
            新建热区
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{
              display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '500',
              color: isDark ? '#cbd5e1' : '#374151',
            }}>
              标签文本
            </label>
            <input
              type="text" value={draft.label}
              onChange={event => setDraft({ ...draft, label: event.target.value })}
              placeholder="如：打开门"
              style={{
                width: '100%', padding: '8px', fontSize: '0.875rem',
                border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`, borderRadius: '4px',
                background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#1f2937',
              }}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '500',
              color: isDark ? '#cbd5e1' : '#374151',
            }}>
              目标节点
            </label>
            <select
              value={draft.targetNodeId}
              onChange={event => setDraft({ ...draft, targetNodeId: event.target.value })}
              style={{
                width: '100%', padding: '8px', fontSize: '0.875rem',
                border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`, borderRadius: '4px',
                background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#1f2937',
              }}
            >
              <option value="">请选择目标节点</option>
              {availableNodes.map(node => (
                <option key={node.id} value={node.id}>节点{node.data.nodeId} - {node.data.text.substring(0, 30)}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                if (!draft.label.trim()) {
                  alert('请输入标签文本');
                  return;
                }
                if (!draft.targetNodeId) {
                  alert('请选择目标节点');
                  return;
                }
                const rect = draft.rect!;
                onChange([...hotspots, {
                  id: `hotspot_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                  targetNodeId: draft.targetNodeId,
                  label: draft.label.trim(),
                  x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                }]);
                setDraft(emptyDraft);
              }}
              style={{
                flex: 1, padding: '8px', background: 'var(--theme-brand-primary)', color: '#ffffff',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500',
              }}
            >
              确定
            </button>
            <button
              type="button"
              onClick={() => setDraft(emptyDraft)}
              style={{
                flex: 1, padding: '8px', background: isDark ? '#475569' : '#e5e7eb',
                color: isDark ? '#e2e8f0' : '#374151', border: 'none', borderRadius: '4px',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <HotspotEditor
        imageUrl={imageUrl}
        hotspots={hotspots}
        onFinishDrawing={rect => {
          if (availableNodes.length === 0) {
            alert('没有可用的目标节点');
            return;
          }
          setDraft({ show: true, rect, label: '', targetNodeId: '' });
        }}
        isDark={isDark}
      />
    </div>
  );
}

export default HotspotManager;
