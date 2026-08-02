/**
 * 热区编辑器组件
 * 职责：在图片上手动绘制热区，直接关联到目标节点
 * 零魔法原则：用户手动绘制，手动输入标签，手动选择目标节点
 */

import { useState, useRef, useEffect } from 'react';

export interface Hotspot {
  id: string;           // 热区唯一ID
  targetNodeId: string; // 目标节点ID（直接跳转）
  label: string;        // 热区标签文本（显示用）
  x: number;            // 0-1 百分比
  y: number;            // 0-1 百分比
  width: number;        // 0-1 百分比
  height: number;       // 0-1 百分比
}

interface HotspotEditorProps {
  imageUrl: string;
  hotspots: Hotspot[];
  onStartDrawing?: () => void; // 开始绘制热区时触发
  onFinishDrawing?: (rect: { x: number; y: number; width: number; height: number }) => void; // 完成绘制时返回坐标
  isDark?: boolean;
}

function HotspotEditor({ imageUrl, hotspots, onStartDrawing, onFinishDrawing, isDark = false }: HotspotEditorProps): JSX.Element {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
    onStartDrawing?.();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const width = x - startPos.x;
    const height = y - startPos.y;
    
    setCurrentRect({
      x: width >= 0 ? startPos.x : x,
      y: height >= 0 ? startPos.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || currentRect.width < 0.01 || currentRect.height < 0.01) {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentRect(null);
      return;
    }
    
    // 通知父组件完成绘制，传递坐标
    onFinishDrawing?.(currentRect);
    
    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
  };

  if (!imageLoaded) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: isDark ? '#9ca3af' : '#6b7280'
      }}>
        加载图片中...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        padding: '10px',
        background: isDark ? '#1e3a5f' : '#e0f2fe',
        border: `1px solid ${isDark ? '#334155' : '#bae6fd'}`,
        borderRadius: '6px',
        fontSize: '0.8rem',
        color: isDark ? '#94a3b8' : '#0369a1',
        lineHeight: '1.5'
      }}>
        <strong>绘制热区：</strong>在图片上按住鼠标拖拽绘制蓝色矩形框
      </div>

      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) {
            handleMouseUp();
          }
        }}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          cursor: 'crosshair',
          border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
          borderRadius: '6px',
          overflow: 'hidden'
        }}
      >
        {/* 已存在的热区 */}
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            style={{
              position: 'absolute',
              left: `${hotspot.x * 100}%`,
              top: `${hotspot.y * 100}%`,
              width: `${hotspot.width * 100}%`,
              height: `${hotspot.height * 100}%`,
              border: '2px solid var(--theme-info)',
              background: 'var(--theme-selected)',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{
              background: 'var(--theme-info)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              {hotspot.label}
            </div>
          </div>
        ))}
        
        {/* 正在绘制的热区 */}
        {isDrawing && currentRect && (
          <div
            style={{
              position: 'absolute',
              left: `${currentRect.x * 100}%`,
              top: `${currentRect.y * 100}%`,
              width: `${currentRect.width * 100}%`,
              height: `${currentRect.height * 100}%`,
              border: '3px dashed var(--theme-info)',
              background: 'var(--theme-selected)',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

    </div>
  );
}

export default HotspotEditor;
