import type { ChangeEvent, RefObject } from 'react';
import type { EditorImage as NodeImage } from '../ui/editor/flowTypes.ts';
import { formatFileSize } from '../utils/imageProcessor.ts';

interface Props {
  image?: NodeImage;
  imageUrl?: string;
  uploading: boolean;
  editingHotspots: boolean;
  hotspotCount: number;
  isDark: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onImageChange: (image: NodeImage) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onToggleHotspots: () => void;
}

function BackgroundImageSection(props: Props): JSX.Element {
  return (
    <div className="form-group">
      <label>背景图</label>
      {props.image ? (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', background: '#f9fafb' }}>
          <img
            src={props.imageUrl}
            alt={props.image.fileName}
            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px', marginBottom: '8px' }}
          />
          <div style={{ fontSize: '0.875rem', color: props.isDark ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>
            <div><strong>文件名：</strong>{props.image.fileName}</div>
            <div><strong>大小：</strong>{formatFileSize(props.image.fileSize)}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: '500',
              color: props.isDark ? '#cbd5e1' : '#374151',
            }}>
              背景位置
            </label>
            <select
              value={props.image.position || 'center'}
              onChange={event => props.onImageChange({ ...props.image!, position: event.target.value as NodeImage['position'] })}
              style={{
                width: '100%', padding: '8px 12px', fontSize: '0.875rem',
                border: '1px solid var(--theme-border)', borderRadius: '4px',
                background: 'var(--theme-background-primary)', color: 'var(--theme-text-primary)',
              }}
            >
              <option value="center">居中</option>
              <option value="top">顶部</option>
              <option value="bottom">底部</option>
              <option value="left">左侧</option>
              <option value="right">右侧</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button" className="btn btn-secondary btn-small"
              onClick={() => props.fileInputRef.current?.click()} disabled={props.uploading}
              style={{ flex: 1, minWidth: 0 }}
            >
              {props.uploading ? '处理中...' : '更换'}
            </button>
            <button
              type="button" className="btn btn-danger btn-small"
              onClick={props.onDelete} disabled={props.uploading}
              style={{ flex: 1, minWidth: 0 }}
            >
              删除
            </button>
            <button
              type="button" className={`btn ${props.editingHotspots ? 'btn-success' : 'btn-info'} btn-small`}
              onClick={props.onToggleHotspots} style={{ flex: 1, minWidth: 0 }}
            >
              {props.editingHotspots ? '完成' : (props.hotspotCount > 0 ? `热区(${props.hotspotCount})` : '热区')}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => props.fileInputRef.current?.click()}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') props.fileInputRef.current?.click();
          }}
          style={{
            border: '2px dashed #d1d5db', borderRadius: '6px', padding: '32px',
            textAlign: 'center', cursor: 'pointer', background: '#f9fafb', transition: 'all 0.2s',
          }}
        >
          <div style={{ color: props.isDark ? '#cbd5e1' : '#374151', marginBottom: '4px' }}>点击上传背景图</div>
          <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>支持 JPG、PNG、WebP、GIF</div>
        </div>
      )}
      <input
        ref={props.fileInputRef}
        type="file"
        accept="image/*"
        onChange={props.onUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default BackgroundImageSection;
