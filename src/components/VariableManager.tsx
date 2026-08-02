/**
 * 变量管理组件
 * 职责：管理故事中的变量定义
 */

import { useState } from 'react';
import type { VariableDefinition } from '../types/index.ts';

interface VariableManagerProps {
  variables: VariableDefinition[];
  onVariablesChange: (variables: VariableDefinition[]) => void;
}

function VariableManager({ variables, onVariablesChange }: VariableManagerProps): JSX.Element {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<VariableDefinition>>({
    id: '',
    label: '',
    type: 'number',
    defaultValue: 0,
    displayInPlayer: false,
    displayOrder: undefined
  });

  const userVars = variables;
  
  const filteredVars = userVars.filter(v =>
    v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (variable: VariableDefinition) => {
    setIsAdding(false);
    setEditingId(variable.id);
    setFormData({ ...variable });
  };

  const handleSave = () => {
    if (!formData.id || !formData.label) {
      alert('请输入变量ID和名称');
      return;
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.id)) {
      alert('变量ID只能包含字母、数字和下划线，且不能以数字开头');
      return;
    }

    const newVar: VariableDefinition = {
      id: formData.id,
      label: formData.label,
      type: formData.type || 'number',
      defaultValue: formData.defaultValue ?? (formData.type === 'number' ? 0 : formData.type === 'boolean' ? false : ''),
      description: formData.description,
      source: 'user',
      displayInPlayer: formData.displayInPlayer ?? false,
      displayOrder: formData.displayOrder
    };

    let updatedVars: VariableDefinition[];

    if (editingId) {
      updatedVars = userVars.map(v => v.id === editingId ? newVar : v);
    } else {
      const exists = userVars.some(v => v.id === newVar.id);
      if (exists) {
        alert('该变量ID已存在');
        return;
      }
      updatedVars = [...userVars, newVar];
    }

    // 立即更新全局状态
    onVariablesChange(updatedVars);

    setIsAdding(false);
    setEditingId(null);
    setFormData({
      id: '',
      label: '',
      type: 'number',
      defaultValue: 0,
      displayInPlayer: false,
      displayOrder: undefined
    });
  };

  const handleDelete = (variableId: string) => {
    if (!confirm('确定要删除这个变量吗？')) {
      return;
    }

    const updatedVars = userVars.filter(v => v.id !== variableId);
    // 立即更新全局状态
    onVariablesChange(updatedVars);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      id: '',
      label: '',
      type: 'number',
      defaultValue: 0,
      displayInPlayer: false,
      displayOrder: undefined
    });
  };

  const getDefaultValueForType = (type: 'number' | 'string' | 'boolean'): number | string | boolean => {
    switch (type) {
      case 'number': return 0;
      case 'string': return '';
      case 'boolean': return false;
    }
  };

  const renderVariableForm = () => (
    <div className="variable-form">
      <div className="variable-form-group">
        <label>变量ID (英文)</label>
        <input
          type="text"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          placeholder="如：love"
          disabled={!!editingId}
          className={editingId ? 'readonly-field' : ''}
          title={editingId ? '变量ID创建后不可修改，避免破坏现有脚本引用' : '变量ID用于在 Blockly 脚本中引用此变量'}
        />
      </div>

      <div className="variable-form-group">
        <label>变量名称 (中文)</label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="如：好感度"
        />
      </div>

      <div className="variable-form-group">
        <label>类型</label>
        <select
          value={formData.type}
          onChange={(e) => {
            const newType = e.target.value as 'number' | 'string' | 'boolean';
            setFormData({
              ...formData,
              type: newType,
              defaultValue: getDefaultValueForType(newType)
            });
          }}
        >
          <option value="number">数字</option>
          <option value="string">字符串</option>
          <option value="boolean">布尔值</option>
        </select>
      </div>

      <div className="variable-form-group">
        <label>初始值</label>
        {formData.type === 'number' && (
          <input
            type="number"
            value={formData.defaultValue as number}
            onChange={(e) => setFormData({ ...formData, defaultValue: Number(e.target.value) })}
          />
        )}
        {formData.type === 'string' && (
          <input
            type="text"
            value={formData.defaultValue as string}
            onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
            placeholder="输入字符串"
          />
        )}
        {formData.type === 'boolean' && (
          <select
            value={String(formData.defaultValue)}
            onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value === 'true' })}
          >
            <option value="false">否 (false)</option>
            <option value="true">是 (true)</option>
          </select>
        )}
      </div>

      <div className="variable-form-group">
        <label>说明 (可选)</label>
        <input
          type="text"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="变量用途说明"
        />
      </div>

      <div className="variable-form-actions">
        <button onClick={handleSave} className="btn-variable-save">
          保存
        </button>
        <button onClick={handleCancel} className="btn-variable-cancel">
          取消
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0 }}>变量</h3>
        <button 
          onClick={() => setIsAdding(true)}
          style={{
            padding: '6px 12px',
            background: 'var(--theme-brand-gradient)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          + 添加变量
        </button>
      </div>
      
      {userVars.length === 0 && !isAdding && !editingId && (
        <div className="variable-empty-state" style={{ marginBottom: '16px' }}>
          <p style={{ margin: '8px 0' }}>暂无变量</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #888)', margin: '4px 0' }}>
            点击"添加变量"按钮创建全局变量。<br/>
            关闭并重新打开 Blockly 窗口可见新变量。
          </p>
        </div>
      )}

      <div>
        {(isAdding || editingId) && renderVariableForm()}

        {userVars.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 className="variable-category-title">
              用户定义的变量
            </h4>
            {userVars.length > 3 && !isAdding && !editingId && (
              <input
                type="text"
                placeholder="搜索变量..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  marginBottom: '12px',
                  fontSize: '0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--theme-brand-primary, #FF6D5A)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              />
            )}
            {filteredVars.map((variable) => (
              <div key={variable.id} className="variable-item">
                <div className="variable-item-header" style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div className="variable-item-info" style={{ width: '100%' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span className="variable-item-name">
                          {variable.label}
                        </span>
                        <span className="variable-item-id">
                          ${variable.id}
                        </span>
                      </div>
                    </div>
                    <div className="variable-item-meta" style={{ 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      marginBottom: '6px'
                    }}>
                      <div style={{ marginBottom: '2px' }}>类型: {variable.type}</div>
                      <div>初始值: {String(variable.defaultValue)}</div>
                    </div>
                    {variable.description && (
                      <div className="variable-item-description" style={{ 
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        marginBottom: '6px'
                      }}>
                        {variable.description}
                      </div>
                    )}
                    <div className="variable-item-usage" style={{ 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      marginBottom: '8px'
                    }}>
                      在文本中使用: <code>{`{{$vars.${variable.id}}}`}</code>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      marginBottom: '8px'
                    }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}>
                        <input
                          type="checkbox"
                          checked={variable.displayInPlayer ?? false}
                          onChange={(e) => {
                            const updatedVars = userVars.map(v => 
                              v.id === variable.id 
                                ? { ...v, displayInPlayer: e.target.checked }
                                : v
                            );
                            onVariablesChange(updatedVars);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>播放器显示</span>
                      </label>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap'
                      }}>
                        <span>顺序:</span>
                        <input
                          type="number"
                          value={variable.displayOrder ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const updatedVars = userVars.map(v => 
                              v.id === variable.id 
                                ? { ...v, displayOrder: value === '' ? undefined : Number(value) }
                                : v
                            );
                            onVariablesChange(updatedVars);
                          }}
                          placeholder="不填"
                          style={{ 
                            width: '70px',
                            padding: '4px 6px',
                            fontSize: '0.875rem',
                            border: '1px solid var(--border-color, #ddd)',
                            borderRadius: '4px'
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="variable-item-actions" style={{ 
                    display: 'flex', 
                    gap: '8px',
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => handleEdit(variable)}
                      className="btn-variable-edit"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(variable.id)}
                      className="btn-variable-delete"
                      title="删除此全局变量"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredVars.length === 0 && userVars.length > 0 && searchTerm && (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                未找到匹配的变量
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}

export default VariableManager;

