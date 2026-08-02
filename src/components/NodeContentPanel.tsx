/**
 * 节点内容编辑面板
 * 职责：编辑节点的故事内容（文本、选项、标签、脚本等）
 * 位置：右侧编辑面板上部
 */

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { StoryNode, Choice, NodeType, BlocklyWorkspaceState, NodeScripts, VariableDefinition } from '../types/index.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import BlocklyScriptEditor from './BlocklyScriptEditor.tsx';

interface NodeContentPanelProps {
  node: StoryNode;
  onUpdate: (nodeId: string, data: Partial<StoryNode['data']>) => void;
  onDeleteChoice?: (nodeId: string, choiceIndex: number, choice: Choice) => void;
  globalVariables?: VariableDefinition[];
  onDraftChange?: () => void;
}

export interface NodeContentPanelRef {
  applyChanges: () => Partial<StoryNode['data']>;
}

const NodeContentPanel = forwardRef<NodeContentPanelRef, NodeContentPanelProps>(
  ({ node, onUpdate, onDeleteChoice, globalVariables = [], onDraftChange }, ref) => {
    const { currentTheme } = useTheme();
    const isDark = currentTheme === 'theme.dark';

    const [text, setText] = useState<string>('');
    const [choices, setChoices] = useState<Choice[]>([]);
    const [nodeType, setNodeType] = useState<NodeType>(node.data.nodeType || 'normal');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState<string>('');
    const [typewriterSpeed, setTypewriterSpeed] = useState<number>(0);
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number>(-1);
    const draftFingerprintRef = useRef<string>('');

    // Blockly 脚本状态
    const [nodeScripts, setNodeScripts] = useState<NodeScripts>({});
    const [editingScript, setEditingScript] = useState<{
      type: 'node-enter' | 'node-leave' | 'choice-condition' | 'choice-select';
      choiceIndex?: number;
      currentState?: BlocklyWorkspaceState;
    } | null>(null);

    useEffect(() => {
      setText(node.data.text);
      setChoices(node.data.choices);
      setNodeType(node.data.nodeType || 'normal');
      setTags((node.data as any).tags || []);
      setTypewriterSpeed((node.data as any).typewriterSpeed || 0);

      const data = node.data as any;
      const blocklyScripts = data.pluginData?.['blockly.scripts'] || {};
      setNodeScripts(blocklyScripts);

      setDeleteConfirmIndex(-1);
    }, [node]);

    useEffect(() => {
      if (deleteConfirmIndex >= 0) {
        const timer = setTimeout(() => setDeleteConfirmIndex(-1), 3000);
        return () => clearTimeout(timer);
      }
      return () => {};
    }, [deleteConfirmIndex]);

    const buildNodeData = (): Partial<StoryNode['data']> => {
      const choicesWithScripts = choices.map((choice) => {
        const choiceData = choice as any;
        const existingPluginData = choiceData.pluginData || {};
        return {
          ...choice,
          pluginData: {
            ...existingPluginData,
            'blockly.scripts': choiceData.pluginData?.['blockly.scripts'] || {}
          }
        };
      });

      // 只返回上部面板负责的字段
      return {
        text,
        choices: choicesWithScripts,
        nodeType,
        tags,
        typewriterSpeed,
        pluginData: {
          'blockly.scripts': nodeScripts
        }
      } as any;
    };

    useEffect(() => {
      const fingerprint = JSON.stringify(buildNodeData());
      if (draftFingerprintRef.current && draftFingerprintRef.current !== fingerprint) onDraftChange?.();
      draftFingerprintRef.current = fingerprint;
    }, [text, choices, nodeType, tags, typewriterSpeed, nodeScripts, onDraftChange]);

  useImperativeHandle(ref, () => ({
    applyChanges: () => {
      // 不直接调用 onUpdate，而是返回数据让父组件合并
      return buildNodeData();
    }
  }), [node.id, onUpdate, text, choices, nodeType, tags, typewriterSpeed, nodeScripts]);

    const addChoice = (): void => {
      const newChoice: Choice = {
        id: `c${node.id}_${choices.length + 1}`,
        text: `选项${choices.length + 1}`
      };
      setChoices([...choices, newChoice]);
    };

    const updateChoice = (index: number, newText: string): void => {
      const newChoices = [...choices];
      newChoices[index].text = newText;
      setChoices(newChoices);
    };

    const handleDeleteChoiceClick = (index: number): void => {
      if (choices.length <= 1) return;

      if (deleteConfirmIndex === index) {
        const choiceToDelete = choices[index];
        const newChoices = choices.filter((_, i) => i !== index);
        setChoices(newChoices);
        setDeleteConfirmIndex(-1);

        if (onDeleteChoice) {
          onDeleteChoice(node.id, index, choiceToDelete);
        }
      } else {
        setDeleteConfirmIndex(index);
      }
    };

    const handleAddTag = (): void => {
      const trimmedTag = tagInput.trim();
      if (!trimmedTag) return;
      if (tags.includes(trimmedTag)) {
        alert('标签已存在');
        return;
      }
      if (tags.length >= 10) {
        alert('最多添加10个标签');
        return;
      }

      setTags([...tags, trimmedTag]);
      setTagInput('');
    };

    const handleDeleteTag = (tagToDelete: string): void => {
      setTags(tags.filter(tag => tag !== tagToDelete));
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    };

    return (
      <>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label>节点类型</label>
            <select value={nodeType} onChange={(e) => setNodeType(e.target.value as NodeType)}>
              <option value="start">开始节点</option>
              <option value="normal">普通节点</option>
              <option value="ending">结局节点</option>
            </select>
          </div>

          <div className="form-group">
            <label>标签</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="输入标签，按回车添加"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '0.95rem',
                  minHeight: '38px'
                }}
                maxLength={20}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.875rem',
                  height: '38px',
                  background: !tagInput.trim() ? '#e5e7eb' : '#6b7280',
                  color: !tagInput.trim() ? '#9ca3af' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !tagInput.trim() ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '8px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}>
                {tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: isDark ? '#1e3a5f' : '#e0f2fe',
                      color: isDark ? '#60a5fa' : '#0369a1',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      border: isDark ? '1px solid #334155' : '1px solid #bae6fd'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#60a5fa' : '#0369a1',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: '1rem',
                        lineHeight: '1',
                        fontWeight: 'bold'
                      }}
                      title="删除标签"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>小说文本</label>
              <span style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#6b7280' }}>
                {text.replace(/\s/g, '').length} 字
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入小说内容，支持 **粗体** *斜体* [color=red]彩色[/color] [[选项文本]] @角色名：对话 等格式..."
              rows={10}
            />
            <div style={{ marginTop: '12px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isDark ? '#cbd5e1' : '#374151'
              }}>
                打字机速度：{typewriterSpeed === 0 ? '关闭' : `${typewriterSpeed}ms/字`}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={typewriterSpeed}
                onChange={(e) => setTypewriterSpeed(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-with-button">
              <label>选项列表</label>
              <button className="btn-add-choice" onClick={addChoice}>
                + 添加选项
              </button>
            </div>
            {choices.map((choice, index) => {
              const choiceData = choice as any;
              const choiceScripts = choiceData.pluginData?.['blockly.scripts'] || {};

              return (
                <div key={choice.id} style={{ marginBottom: '16px' }}>
                  <div className="choice-edit" style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => updateChoice(index, e.target.value)}
                      placeholder={`选项 ${index + 1}`}
                      style={{ flex: 1 }}
                    />
                    <button
                      className={`btn-delete ${deleteConfirmIndex === index ? 'btn-danger-confirm' : ''}`}
                      onClick={() => handleDeleteChoiceClick(index)}
                      disabled={choices.length <= 1}
                      title={deleteConfirmIndex === index ? '确认删除？' : '删除选项'}
                    >
                      {deleteConfirmIndex === index ? '确认？' : '×'}
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '6px',
                    marginLeft: '4px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setEditingScript({
                        type: 'choice-condition',
                        choiceIndex: index,
                        currentState: choiceScripts.condition
                      })}
                      className="btn btn-secondary btn-small"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem'
                      }}
                      title="设置此选项的显示条件"
                    >
                      {choiceScripts.condition ? '显示条件' : '+ 显示条件'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingScript({
                        type: 'choice-select',
                        choiceIndex: index,
                        currentState: choiceScripts.onSelect
                      })}
                      className="btn btn-secondary btn-small"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem'
                      }}
                      title="设置选择此选项时执行的脚本"
                    >
                      {choiceScripts.onSelect ? '选择时执行' : '+ 选择时执行'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <details
            style={{
              marginTop: '24px',
              padding: '16px',
              background: isDark ? '#1e293b' : '#f0f9ff',
              border: `1px solid ${isDark ? '#334155' : '#bae6fd'}`,
              borderRadius: '8px',
              color: isDark ? '#e2e8f0' : '#0c4a6e'
            }}
          >
            <summary style={{
              cursor: 'pointer',
              fontWeight: '600',
              color: isDark ? '#94a3b8' : '#0369a1',
              fontSize: '0.95rem',
              userSelect: 'none'
            }}>
              节点脚本设置
            </summary>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingScript({ type: 'node-enter', currentState: nodeScripts.onEnter })}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.875rem'
                  }}
                >
                  {nodeScripts.onEnter ? '进入节点时' : '+ 进入节点时'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingScript({ type: 'node-leave', currentState: nodeScripts.onLeave })}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.875rem'
                  }}
                >
                  {nodeScripts.onLeave ? '离开节点时' : '+ 离开节点时'}
                </button>
              </div>
            </div>
          </details>
        </div>

        {editingScript && (
          <BlocklyScriptEditor
            title={
              editingScript.type === 'node-enter' ? '进入节点时执行' :
              editingScript.type === 'node-leave' ? '离开节点时执行' :
              editingScript.type === 'choice-condition' ? '选项显示条件' :
              '选择时执行'
            }
            initialState={editingScript.currentState}
            globalVariables={globalVariables}
            onChange={(newState) => {
              if (editingScript.type === 'node-enter') {
                setNodeScripts({ ...nodeScripts, onEnter: newState });
              } else if (editingScript.type === 'node-leave') {
                setNodeScripts({ ...nodeScripts, onLeave: newState });
              } else if (editingScript.type === 'choice-condition' || editingScript.type === 'choice-select') {
                const choiceIndex = editingScript.choiceIndex!;
                const updatedChoices = [...choices];
                const choiceData = updatedChoices[choiceIndex] as any;

                if (!choiceData.pluginData) {
                  choiceData.pluginData = {};
                }
                if (!choiceData.pluginData['blockly.scripts']) {
                  choiceData.pluginData['blockly.scripts'] = {};
                }

                if (editingScript.type === 'choice-condition') {
                  choiceData.pluginData['blockly.scripts'].condition = newState;
                } else {
                  choiceData.pluginData['blockly.scripts'].onSelect = newState;
                }

                setChoices(updatedChoices);
              }
            }}
            onClose={() => setEditingScript(null)}
          />
        )}
      </>
    );
  }
);

export default NodeContentPanel;
