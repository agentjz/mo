/**
 * Blockly 相关类型定义
 * 职责：定义 Blockly 工作区和脚本的数据结构
 */

/**
 * Blockly 工作区状态（Blockly 原生序列化格式）
 */
export interface BlocklyWorkspaceState {
  blocks: {
    languageVersion: number;
    blocks: any[];  // Blockly 积木块数组
  };
  variables?: Array<{  // 变量列表（可选，由 Blockly 自动管理）
    name: string;
    id: string;
    type?: string;
  }>;
}

/**
 * 节点脚本（使用 Blockly）
 */
export interface NodeScripts {
  onEnter?: BlocklyWorkspaceState;   // 进入节点时执行
  onLeave?: BlocklyWorkspaceState;   // 离开节点时执行
}

/**
 * 选项脚本（使用 Blockly）
 */
export interface ChoiceScripts {
  condition?: BlocklyWorkspaceState;  // 显示条件（返回 boolean）
  onSelect?: BlocklyWorkspaceState;   // 选择时执行
}

/**
 * 积木块分类
 */
export type BlockCategory = 
  | 'variables'    // 变量操作
  | 'logic'        // 逻辑运算
  | 'math'         // 数学运算
  | 'text'         // 文本操作
  | 'lists'        // 列表操作
  | 'loops'        // 循环
  | 'functions';   // 函数

/**
 * 自定义积木块定义
 */
export interface CustomBlockDefinition {
  type: string;                    // 积木块类型 ID
  category: BlockCategory;         // 所属分类
  message0: string;                // 积木块显示文本
  args0?: any[];                   // 参数定义
  previousStatement?: boolean | string;  // 是否可以连接上一个积木
  nextStatement?: boolean | string;      // 是否可以连接下一个积木
  output?: string | null;          // 输出类型（用于返回值积木）
  colour?: number;                 // 颜色
  tooltip?: string;                // 提示文本
  helpUrl?: string;                // 帮助链接
}

/**
 * 积木块代码生成器
 */
export interface BlockCodeGenerator {
  [blockType: string]: (block: any) => string | [string, number];
}

