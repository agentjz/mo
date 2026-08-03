import { useEffect, useRef, useState } from 'react';
import type { PlayerTemplateEntry } from '../domain/templates/contracts.ts';
import type { EditorStoryMeta as StoryMeta } from '../ui/editor/flowTypes.ts';
import { builtinTemplateEntries } from '../templates/catalog.ts';
import { templatePackageService, templateRegistry } from '../templates/runtimeCatalog.ts';
import TemplatePreview from './TemplatePreview.tsx';

interface Props {
  storyMeta: StoryMeta;
  selectedSceneId: string | null;
  allNodes: Array<{ id: string; text: string }>;
  onMetaChange: (meta: StoryMeta) => void;
  onClose: () => void;
}

function chooseTemplatePackage(): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,application/zip';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function TemplateGallery({ storyMeta, selectedSceneId, allNodes, onMetaChange, onClose }: Props): JSX.Element {
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [entries, setEntries] = useState<PlayerTemplateEntry[]>(builtinTemplateEntries);
  const [packageError, setPackageError] = useState('');
  const [packageBusy, setPackageBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void templatePackageService.restore().then(() => {
      if (active) setEntries(templateRegistry.list());
    }).catch(error => {
      if (active) setPackageError(error instanceof Error ? error.message : '本地模板恢复失败');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      returnFocusRef.current?.focus();
    };
  }, []);

  const install = async (): Promise<void> => {
    const file = await chooseTemplatePackage();
    if (!file) return;
    setPackageBusy(true);
    setPackageError('');
    try {
      await templatePackageService.install(file);
      setEntries(templateRegistry.list());
    } catch (error) {
      setPackageError(error instanceof Error ? error.message : '本地模板安装失败');
    } finally {
      setPackageBusy(false);
    }
  };

  const uninstall = async (entry: PlayerTemplateEntry): Promise<void> => {
    if (storyMeta.templateId === entry.manifest.id) {
      setPackageError('当前作品正在使用该模板，请先切换模板');
      return;
    }
    setPackageBusy(true);
    setPackageError('');
    try {
      await templatePackageService.uninstall(entry.manifest.id);
      setEntries(templateRegistry.list());
    } catch (error) {
      setPackageError(error instanceof Error ? error.message : '本地模板卸载失败');
    } finally {
      setPackageBusy(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
    ) ?? [])].filter(element => element.getClientRects().length > 0);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const previewScene = selectedSceneId
    ? allNodes.find(node => node.id === selectedSceneId)
    : allNodes[0];

  return (
    <div className="template-gallery-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="template-gallery"
        role="dialog"
        aria-modal="true"
        aria-label="播放器模板"
        data-template-gallery
        onKeyDown={handleKeyDown}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="template-gallery-header">
          <h2>播放器模板</h2>
          <div className="template-gallery-actions">
            <button className="btn btn-small" disabled={packageBusy} onClick={() => void install()}>导入模板</button>
            <button className="template-gallery-close" aria-label="关闭" onClick={onClose}>×</button>
          </div>
        </header>
        {packageError && <div className="template-package-error" role="alert">{packageError}</div>}
        <div className="template-gallery-grid">
          {entries.map(entry => {
            const selected = entry.manifest.id === storyMeta.templateId;
            const shell = entry.manifest.id.replace('builtin.', '');
            return (
              <article
                className={`template-card ${selected ? 'template-card-selected' : ''}`}
                key={entry.manifest.id}
                data-template-card
                data-template-id={entry.manifest.id}
                data-structure={entry.manifest.structuralFingerprint}
              >
                {selected ? (
                  <TemplatePreview entry={entry} storyMeta={storyMeta} scene={previewScene} />
                ) : (
                  <div className={`template-card-preview template-card-preview-${shell}`} aria-hidden="true">
                    <span className="template-preview-heading">{entry.manifest.name}</span>
                    <span className="template-preview-line" />
                    <span className="template-preview-line template-preview-line-short" />
                    <span className="template-preview-action" />
                  </div>
                )}
                <div className="template-card-body">
                  <div><strong>{entry.manifest.name}</strong><span>{entry.manifest.category}</span></div>
                  <button
                    className="btn btn-small"
                    aria-label="使用此模板"
                    disabled={selected}
                    onClick={() => {
                      const defaults = Object.fromEntries(entry.manifest.settings.map(setting => [setting.id, setting.defaultValue]));
                      onMetaChange({
                        ...storyMeta,
                        templateId: entry.manifest.id,
                        templateSettings: defaults,
                        renderStyle: entry.manifest.id === 'builtin.chat' ? 'chat' : 'visual-novel',
                      });
                      onClose();
                    }}
                  >
                    {selected ? '当前模板' : '使用此模板'}
                  </button>
                  {entry.source === 'local' && (
                    <button className="btn btn-small" disabled={packageBusy || selected} onClick={() => void uninstall(entry)}>卸载</button>
                  )}
                </div>
                {selected && entry.manifest.settings.map(setting => (
                  <label className="template-setting" key={setting.id}>
                    <span>{setting.label}</span>
                    {setting.type === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={Boolean(storyMeta.templateSettings[setting.id] ?? setting.defaultValue)}
                        onChange={event => onMetaChange({
                          ...storyMeta,
                          templateSettings: { ...storyMeta.templateSettings, [setting.id]: event.target.checked },
                        })}
                      />
                    ) : (
                      <input
                        type="number"
                        min={setting.min}
                        max={setting.max}
                        step="0.1"
                        value={Number(storyMeta.templateSettings[setting.id] ?? setting.defaultValue)}
                        onChange={event => onMetaChange({
                          ...storyMeta,
                          templateSettings: { ...storyMeta.templateSettings, [setting.id]: Number(event.target.value) },
                        })}
                      />
                    )}
                  </label>
                ))}
                {selected && selectedSceneId && (
                  <label className="template-setting">
                    <span>当前节点变体</span>
                    <select
                      aria-label="当前节点变体"
                      value={storyMeta.templateSceneVariants[selectedSceneId] ?? entry.manifest.sceneVariants[0]}
                      onChange={event => onMetaChange({
                        ...storyMeta,
                        templateSceneVariants: {
                          ...storyMeta.templateSceneVariants,
                          [selectedSceneId]: event.target.value,
                        },
                      })}
                    >
                      {entry.manifest.sceneVariants.map(variant => <option key={variant} value={variant}>{variant}</option>)}
                    </select>
                  </label>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default TemplateGallery;
