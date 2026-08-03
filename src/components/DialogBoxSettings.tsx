interface Props {
  isDark: boolean;
  position: 'top' | 'center' | 'bottom';
  height: number;
  width: number;
  opacity: number;
  padding: number;
  radius: number;
  blur: number;
  fontSize: number;
  onPositionChange: (value: 'top' | 'center' | 'bottom') => void;
  onHeightChange: (value: number) => void;
  onWidthChange: (value: number) => void;
  onOpacityChange: (value: number) => void;
  onPaddingChange: (value: number) => void;
  onRadiusChange: (value: number) => void;
  onBlurChange: (value: number) => void;
  onFontSizeChange: (value: number) => void;
}

function DialogBoxSettings(props: Props): JSX.Element {
  const numberInputStyle = {
    width: '100%', padding: '6px 8px', fontSize: '0.85rem',
    border: '1px solid var(--theme-border)', borderRadius: '4px',
    background: 'var(--theme-background-primary)', color: 'var(--theme-text-primary)',
  } as const;
  const positionButtonStyle = (value: Props['position']) => ({
    flex: 1,
    padding: '6px',
    background: props.position === value ? 'var(--theme-brand-primary)' : 'var(--theme-background-secondary)',
    color: props.position === value ? '#ffffff' : 'var(--theme-text-primary)',
    border: `1px solid ${props.position === value ? 'var(--theme-brand-primary)' : 'var(--theme-border)'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  } as const);

  return (
    <details open style={{
      border: `1px solid ${props.isDark ? '#334155' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '12px',
      background: props.isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(249, 250, 251, 0.5)',
    }}>
      <summary style={{
        cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
        color: props.isDark ? '#e2e8f0' : '#1f2937', userSelect: 'none',
        marginBottom: '12px', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
        对话框配置
      </summary>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>位置</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => props.onPositionChange('top')} style={positionButtonStyle('top')}>上</button>
            <button onClick={() => props.onPositionChange('center')} style={positionButtonStyle('center')}>中</button>
            <button onClick={() => props.onPositionChange('bottom')} style={positionButtonStyle('bottom')}>下</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>高度（px）</label>
            <input
              type="number" min="1" max="400" value={props.height}
              onChange={event => props.onHeightChange(parseInt(event.target.value) || 200)}
              style={numberInputStyle}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>宽度（%）</label>
            <input
              type="number" min="1" max="100" value={props.width}
              onChange={event => props.onWidthChange(parseInt(event.target.value) || 90)}
              style={numberInputStyle}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
            透明度：{Math.round(props.opacity * 100)}%
          </label>
          <input
            type="range" min="0" max="1" step="0.05" value={props.opacity}
            onChange={event => props.onOpacityChange(parseFloat(event.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>字体（px）</label>
            <input
              type="number" min="1" max="100" value={props.fontSize}
              onChange={event => props.onFontSizeChange(parseInt(event.target.value) || 18)}
              style={numberInputStyle}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>内边距（px）</label>
            <input
              type="number" min="1" max="50" value={props.padding}
              onChange={event => props.onPaddingChange(parseInt(event.target.value) || 24)}
              style={numberInputStyle}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>圆角（px）</label>
            <input
              type="number" min="1" max="30" value={props.radius}
              onChange={event => props.onRadiusChange(parseInt(event.target.value) || 12)}
              style={numberInputStyle}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>模糊（px）</label>
            <input
              type="number" min="0" max="30" value={props.blur}
              onChange={event => {
                const value = parseInt(event.target.value);
                if (!Number.isNaN(value)) props.onBlurChange(value);
              }}
              style={numberInputStyle}
            />
          </div>
        </div>
      </div>
    </details>
  );
}

export default DialogBoxSettings;
