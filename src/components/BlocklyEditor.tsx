/**
 * Blockly 编辑器组件
 * 职责：提供可视化编程界面
 */

import { useLayoutEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import type { BlocklyWorkspaceState } from '../types/blockly';
import type { VariableDefinition } from '../domain/story/document.ts';
import { useTheme } from '../contexts/ThemeContext';
import { usePluginSystem } from '../contexts/PluginContext';
import { initializeBlockly, createCustomToolbox } from '../utils/blocklyInit';

interface BlocklyEditorProps {
  initialState?: BlocklyWorkspaceState;
  onChange: (state: BlocklyWorkspaceState) => void;
  readOnly?: boolean;
  height?: number;
  globalVariables?: VariableDefinition[];  // 全局变量列表（从 story.variables）
}

function BlocklyEditor({
  initialState,
  onChange,
  readOnly = false,
  height,
  globalVariables = []
}: BlocklyEditorProps): JSX.Element {
  const { currentTheme } = useTheme();
  const isDark = currentTheme === 'theme.dark';
  const pluginSystem = usePluginSystem();
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  // 初始化 Blockly 工作区
  // 使用 useLayoutEffect 确保 DOM 完全渲染后再初始化
  useLayoutEffect(() => {
    if (!blocklyDivRef.current) {
      console.log('[BlocklyEditor] Div not ready yet');
      return;
    }
    if (workspaceRef.current) {
      console.log('[BlocklyEditor] Already initialized');
      return;
    }

    console.log('[BlocklyEditor] Starting Blockly initialization with plugin system');
    
    // 初始化自定义积木块（全局只需一次）
    // 传入 pluginSystem，让游戏模组可以注册自己的积木
    initializeBlockly(pluginSystem);

    const toolbox = createCustomToolbox(pluginSystem);

    console.log('[BlocklyEditor] Initializing workspace...', {
      div: blocklyDivRef.current,
      width: blocklyDivRef.current.clientWidth,
      height: blocklyDivRef.current.clientHeight
    });

    try {
      // 创建工作区
      const workspace = Blockly.inject(blocklyDivRef.current, {
        toolbox: toolbox as unknown as Blockly.utils.toolbox.ToolboxDefinition,
        theme: Blockly.Themes.Zelos,  // 统一使用 Zelos 主题（深浅色都有更好的对比度）
        grid: {
          spacing: 20,
          length: 3,
          colour: isDark ? '#444' : '#ccc',
          snap: true
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2
        },
        trashcan: !readOnly,
        readOnly,
        move: {
          scrollbars: {
            horizontal: true,
            vertical: true
          },
          drag: true,
          wheel: true
        }
      });

      workspaceRef.current = workspace;

      // 注入全局变量（在加载 initialState 之前）
      if (globalVariables && globalVariables.length > 0) {
        console.log('[BlocklyEditor] Injecting global variables:', globalVariables.map(v => v.id));
        globalVariables.forEach(varDef => {
          // 检查变量是否已存在（避免重复创建）
          const variableMap = workspace.getVariableMap();
          const existingVar = variableMap.getVariable(varDef.id);
          if (!existingVar) {
            // 使用变量的 id 作为变量名（Blockly 内部标识）
            variableMap.createVariable(varDef.id, '', varDef.id);
            console.log('[BlocklyEditor] Created variable:', varDef.id);
          }
        });
      }

      // 加载初始状态
      if (initialState) {
        try {
          const { generatedCode: _generatedCode, ...serializedState } = initialState;
          Blockly.serialization.workspaces.load(serializedState, workspace);
          console.log('[BlocklyEditor] Loaded initial state');
        } catch (error) {
          console.error('[BlocklyEditor] Failed to load initial state:', error);
        }
      }

      // 再次注入全局变量（确保 initialState 加载后不会覆盖新变量）
      if (globalVariables && globalVariables.length > 0) {
        console.log('[BlocklyEditor] Re-injecting global variables after state load:', globalVariables.map(v => v.id));
        globalVariables.forEach(varDef => {
          const variableMap = workspace.getVariableMap();
          const existingVar = variableMap.getVariable(varDef.id);
          if (!existingVar) {
            variableMap.createVariable(varDef.id, '', varDef.id);
            console.log('[BlocklyEditor] Created missing variable:', varDef.id);
          }
        });
      }

      // 监听变化
      if (!readOnly) {
        workspace.addChangeListener(() => {
          try {
            const state = Blockly.serialization.workspaces.save(workspace);
            onChange({
              ...state as BlocklyWorkspaceState,
              generatedCode: generateCodeFromLiveWorkspace(workspace),
            });
          } catch (error) {
            console.error('[BlocklyEditor] Failed to save state:', error);
          }
        });
      }

      console.log('[BlocklyEditor] Workspace initialized successfully');
    } catch (error) {
      console.error('[BlocklyEditor] Failed to initialize workspace:', error);
    }

    // 清理
    return () => {
      console.log('[BlocklyEditor] Cleaning up workspace');
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, []); // 空依赖数组，只在组件挂载时运行一次

  // 主题切换（现在统一使用 Zelos，不需要切换）
  // useEffect(() => {
  //   if (workspaceRef.current && isInitialized) {
  //     workspaceRef.current.setTheme(Blockly.Themes.Zelos);
  //   }
  // }, [isDark, isInitialized]);

  return (
    <div 
      ref={blocklyDivRef} 
      style={{ 
        height: height ? `${height}px` : '100%',
        width: '100%',
        border: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`,
        borderRadius: '6px',
        background: isDark ? '#1e1e1e' : '#ffffff'
      }}
    />
  );
}

/**
 * 从 Blockly 工作区生成 JavaScript 代码
 */
export function generateCodeFromWorkspace(state: BlocklyWorkspaceState): string {
  // 创建临时工作区
  const tempDiv = document.createElement('div');
  const workspace = Blockly.inject(tempDiv, { readOnly: true });

  try {
    // 加载状态
    const { generatedCode: _generatedCode, ...serializedState } = state;
    Blockly.serialization.workspaces.load(serializedState, workspace);
    
    // 生成代码
    const code = javascriptGenerator.workspaceToCode(workspace);
    
    return code;
  } catch (error) {
    console.error('[BlocklyEditor] Failed to generate code:', error);
    return '';
  } finally {
    workspace.dispose();
    tempDiv.remove();
  }
}

function generateCodeFromLiveWorkspace(workspace: Blockly.Workspace): string {
  let code = javascriptGenerator.workspaceToCode(workspace).replace(/^var\s+[^;]+;[\s\n]*/gm, '');
  const topBlocks = workspace.getTopBlocks(false);
  if (topBlocks.length === 1 && topBlocks[0].outputConnection !== null) {
    const expression = code.trim().replace(/;$/, '');
    if (expression && !expression.startsWith('return')) code = `return ${expression};`;
  }
  return code;
}

/**
 * 执行 Blockly 脚本
 */
export function executeBlocklyScript(
  state: BlocklyWorkspaceState | undefined,
  context: {
    vars: Record<string, any>;
    functions?: Record<string, Function>;
  }
): any {
  if (!state) return;

  const code = generateCodeFromWorkspace(state);
  if (!code) return;

  try {
    // 创建执行上下文
    const contextVars = context.vars;
    const contextFns = context.functions || {};

    // 使用 Function 构造函数执行代码（比 eval 稍微安全一点）
    const fn = new Function('vars', 'fns', code);
    return fn(contextVars, contextFns);
  } catch (error) {
    console.error('[BlocklyEditor] Script execution error:', error);
    console.error('Code:', code);
  }
}

export default BlocklyEditor;

