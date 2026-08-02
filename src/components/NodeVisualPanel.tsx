/**
 * 节点视觉配置面板
 * 职责：管理节点的视觉呈现（背景图、立绘、对话框样式等）
 * 位置：右侧编辑面板下部
 */

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { StoryNode, StoryMeta, NodeImage, CharacterImages } from '../types/index.ts';
import { processImageFile, formatFileSize, validateImageFile } from '../utils/imageProcessor.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import HotspotEditor, { type Hotspot } from './HotspotEditor.tsx';
import { dataUrlToBlob } from '../platform/export/binary.ts';
import { workspaceRepository } from '../platform/storage/WorkspaceRepository.ts';
import { useAssetUrl } from '../hooks/useAssetUrl.ts';

interface NodeVisualPanelProps {
  node: StoryNode;
  allNodes: StoryNode[];
  onUpdate: (nodeId: string, data: Partial<StoryNode['data']>) => void;
  storyMeta: StoryMeta;
  onDraftChange?: () => void;
}

export interface NodeVisualPanelRef {
  applyChanges: () => Partial<StoryNode['data']>;
}

const NodeVisualPanel = forwardRef<NodeVisualPanelRef, NodeVisualPanelProps>(
  ({ node, allNodes, onUpdate, storyMeta, onDraftChange }, ref) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme === 'theme.dark';

  const [nodeImage, setNodeImage] = useState<NodeImage | undefined>(undefined);
  const [characterImages, setCharacterImages] = useState<CharacterImages>({});
  const nodeImageUrl = useAssetUrl(nodeImage?.imagePath);
  const characterImageUrls = {
    left: useAssetUrl(characterImages.left?.imagePath),
    center: useAssetUrl(characterImages.center?.imagePath),
    right: useAssetUrl(characterImages.right?.imagePath),
  };
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadingCharacter, setUploadingCharacter] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const characterFileInputRefs = {
    left: useRef<HTMLInputElement>(null),
    center: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null)
  };

  // 对话框配置
  const [dialogBoxPosition, setDialogBoxPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [dialogBoxHeight, setDialogBoxHeight] = useState<number>(200);
  const [dialogBoxWidth, setDialogBoxWidth] = useState<number>(90);
  const [dialogBoxOpacity, setDialogBoxOpacity] = useState<number>(0.8);
  const [dialogBoxPadding, setDialogBoxPadding] = useState<number>(24);
  const [dialogBoxRadius, setDialogBoxRadius] = useState<number>(12);
  const [dialogBoxBlur, setDialogBoxBlur] = useState<number>(15);
  const [dialogBoxFontSize, setDialogBoxFontSize] = useState<number>(18);

  const [editingHotspots, setEditingHotspots] = useState<boolean>(false);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [hotspotForm, setHotspotForm] = useState<{
    show: boolean;
    rect: { x: number; y: number; width: number; height: number } | null;
    label: string;
    targetNodeId: string;
  }>({
    show: false,
    rect: null,
    label: '',
    targetNodeId: ''
  });
  const [deleteHotspotConfirm, setDeleteHotspotConfirm] = useState<string | null>(null);
  const draftFingerprintRef = useRef<string>('');

  const isVisualNovelMode = storyMeta.displayMode === 'visual-novel';

  useEffect(() => {
    setNodeImage(node.data.image);
    setCharacterImages(node.data.characterImages || {});

    const data = node.data as any;
    const imageHotspots = data.pluginData?.['image-hotspots'] || [];
    setHotspots(imageHotspots);

    // 加载对话框配置
    const uiConfig = data.pluginData?.['ui-config'] || {};
    setDialogBoxPosition(uiConfig.dialogBoxPosition || 'bottom');
    setDialogBoxHeight(uiConfig.dialogBoxHeight || 200);
    setDialogBoxWidth(uiConfig.dialogBoxWidth || 90);
    setDialogBoxOpacity(uiConfig.dialogBoxOpacity ?? 0.8);
    setDialogBoxPadding(uiConfig.dialogBoxPadding || 24);
    setDialogBoxRadius(uiConfig.dialogBoxRadius || 12);
    setDialogBoxBlur(uiConfig.dialogBoxBlur ?? 15);
    setDialogBoxFontSize(uiConfig.dialogBoxFontSize || 18);

    setEditingHotspots(false);
    setDeleteHotspotConfirm(null);
  }, [node]);

  useEffect(() => {
    if (deleteHotspotConfirm) {
      const timer = setTimeout(() => setDeleteHotspotConfirm(null), 3000);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [deleteHotspotConfirm]);

  // 暴露 applyChanges 方法给父组件，点保存时调用
  useImperativeHandle(ref, () => ({
    applyChanges: () => {
      // 只返回右侧面板负责的字段
      const updatedData: Partial<StoryNode['data']> = {
        image: nodeImage,
        characterImages,
        pluginData: {
          'image-hotspots': hotspots.length > 0 ? hotspots : undefined,
          'ui-config': {
            dialogBoxPosition,
            dialogBoxHeight,
            dialogBoxWidth,
            dialogBoxOpacity,
            dialogBoxPadding,
            dialogBoxRadius,
            dialogBoxBlur,
            dialogBoxFontSize
          }
        }
      } as any;
      
      return updatedData;
    }
  }), [node.id, onUpdate, nodeImage, characterImages, hotspots, 
       dialogBoxPosition, dialogBoxHeight, dialogBoxWidth, dialogBoxOpacity,
       dialogBoxPadding, dialogBoxRadius, dialogBoxBlur, dialogBoxFontSize]);

  useEffect(() => {
    const fingerprint = JSON.stringify({
      nodeImage,
      characterImages,
      hotspots,
      dialogBoxPosition,
      dialogBoxHeight,
      dialogBoxWidth,
      dialogBoxOpacity,
      dialogBoxPadding,
      dialogBoxRadius,
      dialogBoxBlur,
      dialogBoxFontSize,
    });
    if (draftFingerprintRef.current && draftFingerprintRef.current !== fingerprint) onDraftChange?.();
    draftFingerprintRef.current = fingerprint;
  }, [
    nodeImage, characterImages, hotspots, dialogBoxPosition, dialogBoxHeight,
    dialogBoxWidth, dialogBoxOpacity, dialogBoxPadding, dialogBoxRadius,
    dialogBoxBlur, dialogBoxFontSize, onDraftChange,
  ]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      const processed = await processImageFile(file);

      const blob = await dataUrlToBlob(processed.imageData);
      const uploaded = await workspaceRepository.putAsset({
        blob,
        mimeType: blob.type,
        fileName: processed.fileName,
        width: processed.width,
        height: processed.height,
      });

      const newImage: NodeImage = {
        imagePath: uploaded.id,
        fileName: uploaded.fileName,
        fileSize: uploaded.size,
        originalFormat: processed.originalFormat,
        hash: uploaded.hash,
        width: uploaded.width,
        height: uploaded.height
      };

      setNodeImage(newImage);

    } catch (error) {
      alert('图片上传失败: ' + (error as Error).message);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteImage = () => {
    setNodeImage(undefined);
  };

  const handleCharacterImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    position: 'left' | 'center' | 'right'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploadingCharacter(position);
    try {
      const processed = await processImageFile(file);

      const blob = await dataUrlToBlob(processed.imageData);
      const uploaded = await workspaceRepository.putAsset({
        blob,
        mimeType: blob.type,
        fileName: processed.fileName,
        width: processed.width,
        height: processed.height,
      });

      const newImage: NodeImage = {
        imagePath: uploaded.id,
        fileName: uploaded.fileName,
        fileSize: uploaded.size,
        originalFormat: processed.originalFormat,
        hash: uploaded.hash,
        width: uploaded.width,
        height: uploaded.height
      };

      setCharacterImages({
        ...characterImages,
        [position]: newImage
      });

    } catch (error) {
      alert('图片上传失败: ' + (error as Error).message);
    } finally {
      setUploadingCharacter(null);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteCharacterImage = (position: 'left' | 'center' | 'right') => {
    const newCharacterImages = { ...characterImages };
    delete newCharacterImages[position];
    setCharacterImages(newCharacterImages);
  };

  if (!isVisualNovelMode) {
    return (
      <div style={{
        padding: '16px',
        textAlign: 'center',
        color: isDark ? '#9ca3af' : '#6b7280',
        fontSize: '0.875rem'
      }}>
        <div style={{ marginBottom: '8px' }}>当前故事为终端模式</div>
        <div>切换到视觉小说模式以使用此功能</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        fontSize: '0.95rem',
        fontWeight: '600',
        color: isDark ? '#e2e8f0' : '#1f2937',
        borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
        paddingBottom: '8px'
      }}>
        视觉配置
      </div>

      <details open style={{ 
        border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
        borderRadius: '8px',
        padding: '12px',
        background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(249, 250, 251, 0.5)'
      }}>
        <summary style={{
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '0.9rem',
          color: isDark ? '#e2e8f0' : '#1f2937',
          userSelect: 'none',
          marginBottom: '12px',
          listStyle: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ 
            display: 'inline-block',
            transition: 'transform 0.2s'
          }}>▼</span>
          对话框配置
        </summary>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>位置</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setDialogBoxPosition('top')}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: dialogBoxPosition === 'top' ? 'var(--theme-brand-primary)' : 'var(--theme-background-secondary)',
                  color: dialogBoxPosition === 'top' ? '#ffffff' : 'var(--theme-text-primary)',
                  border: `1px solid ${dialogBoxPosition === 'top' ? 'var(--theme-brand-primary)' : 'var(--theme-border)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                上
              </button>
              <button
                onClick={() => setDialogBoxPosition('center')}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: dialogBoxPosition === 'center' ? 'var(--theme-brand-primary)' : 'var(--theme-background-secondary)',
                  color: dialogBoxPosition === 'center' ? '#ffffff' : 'var(--theme-text-primary)',
                  border: `1px solid ${dialogBoxPosition === 'center' ? 'var(--theme-brand-primary)' : 'var(--theme-border)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                中
              </button>
              <button
                onClick={() => setDialogBoxPosition('bottom')}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: dialogBoxPosition === 'bottom' ? 'var(--theme-brand-primary)' : 'var(--theme-background-secondary)',
                  color: dialogBoxPosition === 'bottom' ? '#ffffff' : 'var(--theme-text-primary)',
                  border: `1px solid ${dialogBoxPosition === 'bottom' ? 'var(--theme-brand-primary)' : 'var(--theme-border)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                下
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>高度（px）</label>
              <input
                type="number"
                min="1"
                max="400"
                value={dialogBoxHeight}
                onChange={(e) => setDialogBoxHeight(parseInt(e.target.value) || 200)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '4px',
                  background: 'var(--theme-background-primary)',
                  color: 'var(--theme-text-primary)'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>宽度（%）</label>
              <input
                type="number"
                min="1"
                max="100"
                value={dialogBoxWidth}
                onChange={(e) => setDialogBoxWidth(parseInt(e.target.value) || 90)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '4px',
                  background: 'var(--theme-background-primary)',
                  color: 'var(--theme-text-primary)'
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
              透明度：{Math.round(dialogBoxOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={dialogBoxOpacity}
              onChange={(e) => setDialogBoxOpacity(parseFloat(e.target.value))}
              style={{
                width: '100%',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>字体（px）</label>
              <input
                type="number"
                min="1"
                max="100"
                value={dialogBoxFontSize}
                onChange={(e) => setDialogBoxFontSize(parseInt(e.target.value) || 18)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '4px',
                  background: 'var(--theme-background-primary)',
                  color: 'var(--theme-text-primary)'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>内边距（px）</label>
              <input
                type="number"
                min="1"
                max="50"
                value={dialogBoxPadding}
                onChange={(e) => setDialogBoxPadding(parseInt(e.target.value) || 24)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '4px',
                  background: 'var(--theme-background-primary)',
                  color: 'var(--theme-text-primary)'
                }}
              />
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>圆角（px）</label>
              <input
                type="number"
                min="1"
                max="30"
                value={dialogBoxRadius}
                onChange={(e) => setDialogBoxRadius(parseInt(e.target.value) || 12)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '4px',
                  background: 'var(--theme-background-primary)',
                  color: 'var(--theme-text-primary)'
                }}
              />
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>模糊（px）</label>
              <input
                type="number"
                min="0"
                max="30"
                value={dialogBoxBlur}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setDialogBoxBlur(val);
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '4px',
                  background: 'var(--theme-background-primary)',
                  color: 'var(--theme-text-primary)'
                }}
              />
            </div>
          </div>
        </div>
      </details>

      <div className="form-group">
        <label>背景图</label>
        {nodeImage ? (
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '12px',
            background: '#f9fafb'
          }}>
            <img
              src={nodeImageUrl}
              alt={nodeImage.fileName}
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            />
            <div style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>
              <div><strong>文件名：</strong>{nodeImage.fileName}</div>
              <div><strong>大小：</strong>{formatFileSize(nodeImage.fileSize)}</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isDark ? '#cbd5e1' : '#374151'
              }}>
                背景位置
              </label>
              <select
                value={nodeImage.position || 'center'}
                onChange={(e) => {
                  const newImage = { ...nodeImage, position: e.target.value as any };
                  setNodeImage(newImage);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  border: `1px solid var(--theme-border)`,
                  borderRadius: '4px',
                  background: 'var(--theme-background-primary)',
                  color: 'var(--theme-text-primary)'
                }}
              >
                <option value="center">居中</option>
                <option value="top">顶部</option>
                <option value="bottom">底部</option>
                <option value="left">左侧</option>
                <option value="right">右侧</option>
              </select>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ flex: 1, minWidth: 0 }}
              >
                {uploading ? '处理中...' : '更换'}
              </button>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={handleDeleteImage}
                disabled={uploading}
                style={{ flex: 1, minWidth: 0 }}
              >
                删除
              </button>
              <button
                type="button"
                className={`btn ${editingHotspots ? 'btn-success' : 'btn-info'} btn-small`}
                onClick={() => setEditingHotspots(!editingHotspots)}
                style={{ flex: 1, minWidth: 0 }}
              >
                {editingHotspots ? '完成' : (hotspots.length > 0 ? `热区(${hotspots.length})` : '热区')}
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #d1d5db',
              borderRadius: '6px',
              padding: '32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#f9fafb',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ color: isDark ? '#cbd5e1' : '#374151', marginBottom: '4px' }}>点击上传背景图</div>
            <div style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#9ca3af' }}>
              支持 JPG、PNG、WebP、GIF
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      {editingHotspots && nodeImage && (
        <div className="form-group">
          <label>热区管理</label>

          <div style={{
            marginBottom: '12px',
            padding: '12px',
            background: isDark ? '#1e293b' : '#f9fafb',
            border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
            borderRadius: '6px'
          }}>
            <div style={{
              fontWeight: '600',
              marginBottom: '8px',
              color: isDark ? '#cbd5e1' : '#374151',
              fontSize: '0.9rem'
            }}>
              热区列表 ({hotspots.length})
            </div>

            {hotspots.length === 0 ? (
              <div style={{
                color: isDark ? '#9ca3af' : '#6b7280',
                fontSize: '0.85rem',
                fontStyle: 'italic'
              }}>
                暂无热区，点击下方图片绘制
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hotspots.map((hotspot) => {
                  const targetNode = allNodes.find(n => n.id === hotspot.targetNodeId);
                  const nodeLabel = targetNode ? `节点${targetNode.data.nodeId}` : '已删除';

                  return (
                    <div
                      key={hotspot.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        background: isDark ? '#0f172a' : '#ffffff',
                        border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: '500',
                          color: isDark ? '#e2e8f0' : '#1f2937',
                          fontSize: '0.875rem',
                          marginBottom: '2px'
                        }}>
                          {hotspot.label}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? '#94a3b8' : '#6b7280'
                        }}>
                          → {nodeLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (deleteHotspotConfirm === hotspot.id) {
                            setHotspots(hotspots.filter(h => h.id !== hotspot.id));
                            setDeleteHotspotConfirm(null);
                          } else {
                            setDeleteHotspotConfirm(hotspot.id);
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          background: deleteHotspotConfirm === hotspot.id ? '#ef4444' : 'transparent',
                          border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
                          borderRadius: '4px',
                          color: deleteHotspotConfirm === hotspot.id ? '#ffffff' : (isDark ? '#ef4444' : '#dc2626'),
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          flexShrink: 0,
                          transition: 'all 0.2s'
                        }}
                      >
                        {deleteHotspotConfirm === hotspot.id ? '确认？' : '删除'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {hotspotForm.show && (
            <div style={{
              marginBottom: '12px',
              padding: '12px',
              background: isDark ? '#1e3a5f' : '#e0f2fe',
              border: `2px solid ${isDark ? '#3b82f6' : '#3b82f6'}`,
              borderRadius: '6px'
            }}>
              <div style={{
                fontWeight: '600',
                marginBottom: '12px',
                color: isDark ? '#60a5fa' : '#0369a1',
                fontSize: '0.9rem'
              }}>
                新建热区
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: isDark ? '#cbd5e1' : '#374151'
                }}>
                  标签文本
                </label>
                <input
                  type="text"
                  value={hotspotForm.label}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, label: e.target.value })}
                  placeholder="如：打开门"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '0.875rem',
                    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
                    borderRadius: '4px',
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#e2e8f0' : '#1f2937'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: isDark ? '#cbd5e1' : '#374151'
                }}>
                  目标节点
                </label>
                <select
                  value={hotspotForm.targetNodeId}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, targetNodeId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '0.875rem',
                    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
                    borderRadius: '4px',
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#e2e8f0' : '#1f2937'
                  }}
                >
                  <option value="">请选择目标节点</option>
                  {allNodes
                    .filter(n => n.id !== node.id)
                    .map(n => (
                      <option key={n.id} value={n.id}>
                        节点{n.data.nodeId} - {n.data.text.substring(0, 30)}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!hotspotForm.label.trim()) {
                      alert('请输入标签文本');
                      return;
                    }
                    if (!hotspotForm.targetNodeId) {
                      alert('请选择目标节点');
                      return;
                    }

                    const newHotspot: Hotspot = {
                      id: `hotspot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      targetNodeId: hotspotForm.targetNodeId,
                      label: hotspotForm.label.trim(),
                      x: hotspotForm.rect!.x,
                      y: hotspotForm.rect!.y,
                      width: hotspotForm.rect!.width,
                      height: hotspotForm.rect!.height
                    };

                    setHotspots([...hotspots, newHotspot]);
                    setHotspotForm({ show: false, rect: null, label: '', targetNodeId: '' });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'var(--theme-brand-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  确定
                </button>
                <button
                  type="button"
                  onClick={() => setHotspotForm({ show: false, rect: null, label: '', targetNodeId: '' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: isDark ? '#475569' : '#e5e7eb',
                    color: isDark ? '#e2e8f0' : '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <HotspotEditor
            imageUrl={nodeImageUrl}
            hotspots={hotspots}
            onFinishDrawing={(rect) => {
              if (allNodes.filter(n => n.id !== node.id).length === 0) {
                alert('没有可用的目标节点');
                return;
              }
              setHotspotForm({
                show: true,
                rect,
                label: '',
                targetNodeId: ''
              });
            }}
            isDark={isDark}
          />
        </div>
      )}

      <div className="form-group">
        <label>角色立绘</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {(['left', 'center', 'right'] as const).map((position) => {
            const positionLabel = position === 'left' ? '左' : position === 'center' ? '中' : '右';
            const image = characterImages[position];

            return (
              <div key={position}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '6px',
                  textAlign: 'center',
                  color: isDark ? '#cbd5e1' : '#374151'
                }}>
                  {positionLabel}
                </div>
                {image ? (
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '6px',
                    background: '#f9fafb'
                  }}>
                    <img
                      src={characterImageUrls[position]}
                      alt={`${positionLabel}立绘`}
                      style={{
                        width: '100%',
                        maxHeight: '80px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        marginBottom: '6px'
                      }}
                    />
                    <div style={{ marginBottom: '6px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginBottom: '4px',
                        textAlign: 'center'
                      }}>
                        缩放: {(image.scale || 1.0).toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={image.scale || 1.0}
                        onChange={(e) => {
                          const newScale = parseFloat(e.target.value);
                          setCharacterImages({
                            ...characterImages,
                            [position]: { ...image, scale: newScale }
                          });
                        }}
                        style={{
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    {/* 水平位置 */}
                    <div style={{ marginBottom: '6px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginBottom: '2px',
                        textAlign: 'center'
                      }}>
                        水平
                      </label>
                      <select
                        value={(image as any).horizontalPosition || position}
                        onChange={(e) => {
                          setCharacterImages({
                            ...characterImages,
                            [position]: { ...image, horizontalPosition: e.target.value as 'left' | 'center' | 'right' } as any
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '2px 4px',
                          fontSize: '0.7rem',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          background: '#ffffff'
                        }}
                      >
                        <option value="left">左</option>
                        <option value="center">中</option>
                        <option value="right">右</option>
                      </select>
                    </div>
                    {/* 垂直位置 */}
                    <div style={{ marginBottom: '6px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginBottom: '2px',
                        textAlign: 'center'
                      }}>
                        垂直
                      </label>
                      <select
                        value={(image as any).verticalPosition || 'bottom'}
                        onChange={(e) => {
                          setCharacterImages({
                            ...characterImages,
                            [position]: { ...image, verticalPosition: e.target.value as 'top' | 'center' | 'bottom' } as any
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '2px 4px',
                          fontSize: '0.7rem',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          background: '#ffffff'
                        }}
                      >
                        <option value="top">上</option>
                        <option value="center">中</option>
                        <option value="bottom">下</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => characterFileInputRefs[position].current?.click()}
                        disabled={uploadingCharacter === position}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          background: '#6b7280',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: uploadingCharacter === position ? 'not-allowed' : 'pointer',
                          opacity: uploadingCharacter === position ? 0.6 : 1
                        }}
                      >
                        {uploadingCharacter === position ? '处理中...' : '更换'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCharacterImage(position)}
                        disabled={uploadingCharacter === position}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: uploadingCharacter === position ? 'not-allowed' : 'pointer',
                          opacity: uploadingCharacter === position ? 0.6 : 1
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => characterFileInputRefs[position].current?.click()}
                    style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '6px',
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: uploadingCharacter === position ? 'not-allowed' : 'pointer',
                      background: '#f9fafb',
                      minHeight: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: uploadingCharacter === position ? 0.6 : 1
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: isDark ? '#9ca3af' : '#9ca3af' }}>
                      {uploadingCharacter === position ? '处理中' : '点击上传'}
                    </div>
                  </div>
                )}
                <input
                  ref={characterFileInputRefs[position]}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCharacterImageUpload(e, position)}
                  style={{ display: 'none' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default NodeVisualPanel;

