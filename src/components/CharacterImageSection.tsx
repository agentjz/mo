import type { ChangeEvent, RefObject } from 'react';
import type {
  EditorCharacterImages as CharacterImages,
  EditorImage as NodeImage,
} from '../ui/editor/flowTypes.ts';

export type CharacterPosition = 'left' | 'center' | 'right';

interface Props {
  images: CharacterImages;
  imageUrls: Record<CharacterPosition, string>;
  uploadingPosition: string | null;
  fileInputRefs: Record<CharacterPosition, RefObject<HTMLInputElement>>;
  isDark: boolean;
  onImagesChange: (images: CharacterImages) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>, position: CharacterPosition) => void;
  onDelete: (position: CharacterPosition) => void;
}

function CharacterImageSection(props: Props): JSX.Element {
  return (
    <div className="form-group">
      <label>角色立绘</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {(['left', 'center', 'right'] as const).map(position => {
          const positionLabel = position === 'left' ? '左' : position === 'center' ? '中' : '右';
          const image = props.images[position];
          const uploading = props.uploadingPosition === position;
          const openFilePicker = (): void => props.fileInputRefs[position].current?.click();

          return (
            <div key={position}>
              <div style={{
                fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px', textAlign: 'center',
                color: props.isDark ? '#cbd5e1' : '#374151',
              }}>
                {positionLabel}
              </div>
              {image ? (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px', background: '#f9fafb' }}>
                  <img
                    src={props.imageUrls[position]}
                    alt={`${positionLabel}立绘`}
                    style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', borderRadius: '4px', marginBottom: '6px' }}
                  />
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{
                      display: 'block', fontSize: '0.7rem', color: props.isDark ? '#9ca3af' : '#6b7280',
                      marginBottom: '4px', textAlign: 'center',
                    }}>
                      缩放: {(image.scale || 1).toFixed(1)}x
                    </label>
                    <input
                      type="range" min="0.1" max="3.0" step="0.1" value={image.scale || 1}
                      onChange={event => props.onImagesChange({
                        ...props.images,
                        [position]: { ...image, scale: parseFloat(event.target.value) },
                      })}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{
                      display: 'block', fontSize: '0.7rem', color: props.isDark ? '#9ca3af' : '#6b7280',
                      marginBottom: '2px', textAlign: 'center',
                    }}>
                      水平
                    </label>
                    <select
                      value={image.horizontalPosition || position}
                      onChange={event => props.onImagesChange({
                        ...props.images,
                        [position]: { ...image, horizontalPosition: event.target.value as CharacterPosition } as NodeImage,
                      })}
                      style={{
                        width: '100%', padding: '2px 4px', fontSize: '0.7rem', borderRadius: '4px',
                        border: '1px solid #d1d5db', background: '#ffffff',
                      }}
                    >
                      <option value="left">左</option>
                      <option value="center">中</option>
                      <option value="right">右</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{
                      display: 'block', fontSize: '0.7rem', color: props.isDark ? '#9ca3af' : '#6b7280',
                      marginBottom: '2px', textAlign: 'center',
                    }}>
                      垂直
                    </label>
                    <select
                      value={image.verticalPosition || 'bottom'}
                      onChange={event => props.onImagesChange({
                        ...props.images,
                        [position]: {
                          ...image,
                          verticalPosition: event.target.value as 'top' | 'center' | 'bottom',
                        } as NodeImage,
                      })}
                      style={{
                        width: '100%', padding: '2px 4px', fontSize: '0.7rem', borderRadius: '4px',
                        border: '1px solid #d1d5db', background: '#ffffff',
                      }}
                    >
                      <option value="top">上</option>
                      <option value="center">中</option>
                      <option value="bottom">下</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      type="button" onClick={openFilePicker} disabled={uploading}
                      style={{
                        padding: '4px 8px', fontSize: '0.7rem', background: '#6b7280', color: '#ffffff',
                        border: 'none', borderRadius: '4px', cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.6 : 1,
                      }}
                    >
                      {uploading ? '处理中...' : '更换'}
                    </button>
                    <button
                      type="button" onClick={() => props.onDelete(position)} disabled={uploading}
                      style={{
                        padding: '4px 8px', fontSize: '0.7rem', background: '#dc2626', color: '#ffffff',
                        border: 'none', borderRadius: '4px', cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.6 : 1,
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={uploading ? -1 : 0}
                  onClick={openFilePicker}
                  onKeyDown={event => {
                    if (!uploading && (event.key === 'Enter' || event.key === ' ')) openFilePicker();
                  }}
                  style={{
                    border: '2px dashed #d1d5db', borderRadius: '6px', padding: '16px 8px',
                    textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: '#f9fafb',
                    minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: uploading ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{uploading ? '处理中' : '点击上传'}</div>
                </div>
              )}
              <input
                ref={props.fileInputRefs[position]}
                type="file"
                accept="image/*"
                onChange={event => props.onUpload(event, position)}
                style={{ display: 'none' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CharacterImageSection;
