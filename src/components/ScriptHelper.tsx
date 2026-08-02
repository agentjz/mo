/**
 * 脚本助手组件
 * 职责：展示语法文档和游戏模组信息
 */

import { useState, useMemo } from 'react';
import { usePluginSystem } from '../contexts/PluginContext.tsx';
import type { GameModDocs } from '../plugins/gamemods/types.js';
import type { VariableDefinition } from '../types/index.js';

interface ScriptHelperProps {
  variables: VariableDefinition[];
  onVariablesChange: (variables: VariableDefinition[]) => void;
}

function ScriptHelper({ variables, onVariablesChange }: ScriptHelperProps): JSX.Element {
  const pluginSystem = usePluginSystem();
  const [expandedSection, setExpandedSection] = useState<string>('');
  const [expandedMods, setExpandedMods] = useState<Record<string, boolean>>({});

  const enabledGameMods = pluginSystem.getEnabledPlugins()
    .filter(p => p.plugin.metadata.category === 'gamemod')
    .map(p => p.plugin.metadata.id);
  
  const gameModDocs: Record<string, GameModDocs> = useMemo(() => {
    return pluginSystem.trigger('plugin:get-docs', {});
  }, [pluginSystem]);
  
  const allPluginVariables: VariableDefinition[] = useMemo(() => {
    return pluginSystem.trigger('plugin:get-variables', []);
  }, [pluginSystem]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const toggleModExpanded = (modId: string) => {
    setExpandedMods(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };
  
  const injectModVariables = (modId: string) => {
    const modVariables = allPluginVariables.filter(v => v.pluginId === modId);
    const newVars = [...variables];
    let addedCount = 0;
    
    modVariables.forEach(varDef => {
      const exists = variables.some(v => v.id === varDef.id);
      if (!exists) {
        newVars.push(varDef);
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      onVariablesChange(newVars);
      console.log(`[ScriptHelper] Injected ${addedCount} variables from ${modId}`);
    } else {
      console.log(`[ScriptHelper] All variables from ${modId} already exist`);
    }
  };

  return (
    <div className="section">
      <h3>脚本助手</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Markdown语法 */}
        <div>
          <button 
            className="toggle-list-btn"
            onClick={() => toggleSection('markdown')}
          >
            {expandedSection === 'markdown' ? '▼' : '▶'} Markdown语法
          </button>
          {expandedSection === 'markdown' && (
            <div style={{ 
              marginTop: '8px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '6px',
              border: '1px solid rgba(229, 229, 229, 0.5)',
              fontSize: '0.8rem',
              lineHeight: '1.6'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>基础格式：</strong>
              </div>
              <div><code>**粗体**</code> - 粗体文字</div>
              <div><code>*斜体*</code> - 斜体文字</div>
              <div><code>`代码`</code> - 等宽代码</div>
              <div><code>[链接文字](网址)</code> - 超链接</div>
              
              <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                <strong>自定义标签：</strong>
              </div>
              <div><code>[color=red]彩色[/color]</code> - 自定义颜色</div>
              <div><code>[bg=yellow]背景[/bg]</code> - 背景高亮</div>
              <div><code>[big]大字[/big]</code> - 大字强调</div>
              <div><code>[small]小字[/small]</code> - 小字注释</div>
              <div><code>[center]居中[/center]</code> - 居中对齐</div>
              <div><code>[right]右对齐[/right]</code> - 右对齐</div>
              <div><code>[glow]发光[/glow]</code> - 发光特效</div>
              
              <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                <strong>内嵌选项：</strong>
              </div>
              <div><code>[[选项文本]]</code> - 内嵌选项为超链接</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                示例：你可以[[向左走]]或[[向右走]]
              </div>
            </div>
          )}
        </div>

        {/* 变量 */}
        {variables && variables.length > 0 && (
          <div>
            <button 
              className="toggle-list-btn"
              onClick={() => toggleSection('variables')}
            >
              {expandedSection === 'variables' ? '▼' : '▶'} 变量 ({variables.length}个)
            </button>
            {expandedSection === 'variables' && (
              <div style={{ 
                marginTop: '8px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '6px',
                border: '1px solid rgba(229, 229, 229, 0.5)'
              }}>
                <div style={{ 
                  marginBottom: '12px',
                  fontSize: '0.8rem',
                  lineHeight: '1.6'
                }}>
                  <strong>使用方法：</strong>
                  <div><code>{`{{$vars.变量ID}}`}</code> - 在文本中显示变量值</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                    示例：你的好感度是{`{{$vars.love}}`}
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  可用变量：
                </div>
                <div style={{ 
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {variables.map(varDef => (
                    <div
                      key={varDef.id}
                      style={{
                        padding: '8px',
                        marginBottom: '6px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>
                          {varDef.label}
                        </span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          color: '#9ca3af',
                          fontFamily: 'monospace'
                        }}>
                          {varDef.type}
                        </span>
                      </div>
                      <code style={{ fontSize: '0.75rem' }}>{`{{$vars.${varDef.id}}}`}</code>
                      {varDef.description && (
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: '#6b7280',
                          marginTop: '4px'
                        }}>
                          {varDef.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 游戏模组文档 */}
        {enabledGameMods.length > 0 && (
          <div>
            <button 
              className="toggle-list-btn"
              onClick={() => toggleSection('gamemods')}
            >
              {expandedSection === 'gamemods' ? '▼' : '▶'} 游戏模组 ({enabledGameMods.length}个)
            </button>

            {expandedSection === 'gamemods' && (
              <div style={{ marginTop: '8px' }}>
                {enabledGameMods.map(modId => {
                  const plugin = pluginSystem.getPlugin(modId);
                  if (!plugin) return null;
                  
                  const docs = gameModDocs[modId];
                  const isModExpanded = expandedMods[modId];

                  return (
                    <div 
                      key={modId}
                      style={{
                        marginBottom: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        onClick={() => toggleModExpanded(modId)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#f9fafb',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151'
                        }}
                      >
                        <span>{docs.name}</span>
                        <span>{isModExpanded ? '▼' : '▶'}</span>
                      </button>

                      {isModExpanded && docs && (
                        <div style={{ 
                          padding: '12px', 
                          fontSize: '0.8rem', 
                          background: '#ffffff',
                          color: '#374151',
                          lineHeight: '1.6'
                        }}>
                          <p style={{ 
                            margin: '0 0 12px 0', 
                            fontWeight: '600',
                            color: '#111827'
                          }}>
                            {docs.description}
                          </p>
                          
                          {(() => {
                            const modVariables = allPluginVariables.filter(v => v.pluginId === modId);
                            if (modVariables.length > 0) {
                              return (
                                <button
                                  onClick={() => injectModVariables(modId)}
                                  style={{
                                    padding: '8px 12px',
                                    marginBottom: '12px',
                                    background: 'var(--theme-brand-primary)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    width: '100%'
                                  }}
                                >
                                  注入变量（{modVariables.length}个）
                                </button>
                              );
                            }
                            return null;
                          })()}
                          
                          {docs.usage?.setup && docs.usage.setup.map((line, idx) => (
                            <div key={idx} style={{ 
                              marginBottom: '4px',
                              textAlign: 'left',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              color: '#4b5563'
                            }}>
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScriptHelper;
