/**
 * Blockly 脚本编辑器（独立组件）
 * 职责：提供固定窗口的 Blockly 编辑界面
 * 特点：完全独立、无耦合、简单布局
 */

import type { BlocklyWorkspaceState, VariableDefinition } from '../types/index';
import { useTheme } from '../contexts/ThemeContext';
import BlocklyEditor from './BlocklyEditor';

interface BlocklyScriptEditorProps {
  title: string;
  initialState: BlocklyWorkspaceState | undefined;
  globalVariables: VariableDefinition[];
  onChange: (state: BlocklyWorkspaceState) => void;
  onClose: () => void;
}

function BlocklyScriptEditor({
  title,
  initialState,
  globalVariables,
  onChange,
  onClose
}: BlocklyScriptEditorProps): JSX.Element {
  const { currentTheme } = useTheme();
  const isDark = currentTheme === 'theme.dark';

  return (
    <div className="blockly-overlay">
      <div className="blockly-window">
        {/* 标题栏 */}
        <div className="blockly-header">
          <h3>{title}</h3>
          <button 
            onClick={onClose}
            className="blockly-close-btn"
            title="关闭"
          >
            ×
          </button>
        </div>

        {/* 内容区 */}
        <div className="blockly-body">
          {/* 提示信息 */}
          <div className="blockly-hint" style={{
            background: isDark ? '#1e3a5f' : '#e0f2fe',
            borderColor: isDark ? '#334155' : '#bae6fd',
            color: isDark ? '#94a3b8' : '#0369a1'
          }}>
            <strong>变量使用说明：</strong>
            全局变量在左侧栏"变量"面板中创建，所有节点共享，在 Blockly 中从"故事变量"类别的下拉列表中选择使用
          </div>

          {/* Blockly 工作区 */}
          <div className="blockly-workspace">
            <BlocklyEditor
              key={`blockly-${globalVariables.length}`}
              initialState={initialState}
              globalVariables={globalVariables}
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlocklyScriptEditor;

