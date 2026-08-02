/**
 * Blockly 核心初始化逻辑
 * 职责：提供共享的Blockly初始化功能
 */

import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { BlocklyExecutor } from '../core/BlocklyExecutor';
import type { BlocklyWorkspaceState } from '../types/blockly';

/**
 * 注册自定义积木块
 */
export function registerCustomBlocks(blockDefinitions: any[]): void {
  blockDefinitions.forEach((blockDef: any) => {
    Blockly.Blocks[blockDef.type] = {
      init: function() {
        this.jsonInit(blockDef);
      }
    };
  });
}

/**
 * 注册代码生成器
 */
export function registerCodeGenerators(generators: Record<string, any>): void {
  Object.entries(generators).forEach(([blockType, generator]) => {
    (javascriptGenerator as any).forBlock[blockType] = generator;
  });
}

/**
 * 重写内置变量块的代码生成器
 * 目的：让 Blockly 的内置变量块生成访问 RuntimePlugin.vars 对象的代码
 */
export function overrideVariableBlockGenerators(): void {
  (javascriptGenerator as any).forBlock['variables_set'] = function(block: any, generator: any) {
    const varId = block.getFieldValue('VAR');
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ASSIGNMENT) || '0';
    return `vars['${varId}'] = ${value};\n`;
  };

  (javascriptGenerator as any).forBlock['variables_get'] = function(block: any, generator: any) {
    const varId = block.getFieldValue('VAR');
    return [`vars['${varId}']`, generator.ORDER_ATOMIC];
  };

  (javascriptGenerator as any).forBlock['math_change'] = function(block: any, generator: any) {
    const varId = block.getFieldValue('VAR');
    const delta = generator.valueToCode(block, 'DELTA', generator.ORDER_ADDITION) || '1';
    return `vars['${varId}'] = (typeof vars['${varId}'] == 'number' ? vars['${varId}'] : 0) + (${delta});\n`;
  };

  (javascriptGenerator as any).forBlock['text_append'] = function(block: any, generator: any) {
    const varId = block.getFieldValue('VAR');
    const text = generator.valueToCode(block, 'TEXT', generator.ORDER_NONE) || '\'\'';
    return `vars['${varId}'] = (vars['${varId}'] || '') + String(${text});\n`;
  };

  (javascriptGenerator as any).forBlock['controls_for'] = function(block: any, generator: any) {
    const varId = block.getFieldValue('VAR');
    const from = generator.valueToCode(block, 'FROM', generator.ORDER_ASSIGNMENT) || '0';
    const to = generator.valueToCode(block, 'TO', generator.ORDER_ASSIGNMENT) || '0';
    const by = generator.valueToCode(block, 'BY', generator.ORDER_ASSIGNMENT) || '1';
    const branch = generator.statementToCode(block, 'DO');
    
    let code = '';
    code += `for (vars['${varId}'] = ${from}; `;
    code += `vars['${varId}'] <= ${to}; `;
    code += `vars['${varId}'] += ${by}) {\n`;
    code += branch;
    code += '}\n';
    return code;
  };

  (javascriptGenerator as any).forBlock['controls_forEach'] = function(block: any, generator: any) {
    const varId = block.getFieldValue('VAR');
    const list = generator.valueToCode(block, 'LIST', generator.ORDER_ASSIGNMENT) || '[]';
    const branch = generator.statementToCode(block, 'DO');
    
    const tempVarName = 'temp_list_' + Math.random().toString(36).substr(2, 9);
    let code = '';
    code += `var ${tempVarName} = ${list};\n`;
    code += `for (var ${tempVarName}_index in ${tempVarName}) {\n`;
    code += `  vars['${varId}'] = ${tempVarName}[${tempVarName}_index];\n`;
    code += branch;
    code += '}\n';
    return code;
  };
}

/**
 * 注入代码生成器到 BlocklyExecutor
 */
export function injectCodeGenerator(): void {
  BlocklyExecutor.setCodeGenerator((state: BlocklyWorkspaceState) => {
    const tempDiv = document.createElement('div');
    const workspace = Blockly.inject(tempDiv, { readOnly: true });

    try {
      Blockly.serialization.workspaces.load(state, workspace);
      
      let code = javascriptGenerator.workspaceToCode(workspace);
      
      // 移除 Blockly 自动生成的变量声明
      code = code.replace(/^var\s+[^;]+;[\s\n]*/gm, '');
      
      // 检查是否是单个表达式（需要返回值）
      const topBlocks = workspace.getTopBlocks(false);
      if (topBlocks.length === 1 && topBlocks[0].outputConnection !== null) {
        const trimmedCode = code.trim();
        if (trimmedCode && !trimmedCode.startsWith('return')) {
          const statement = trimmedCode.endsWith(';') ? trimmedCode.slice(0, -1) : trimmedCode;
          code = `return ${statement};`;
        }
      }
      
      return code;
    } catch (error) {
      console.error('[Blockly] Failed to generate code:', error);
      
      if (error instanceof Error && error.message.includes('shadow')) {
        console.error('[Blockly] 提示：Blockly 工作区数据结构有问题。');
        console.error('[Blockly] 建议：在编辑器中重新创建此脚本，不要手写 JSON。');
      }
      
      return '';
    } finally {
      workspace.dispose();
      tempDiv.remove();
    }
  });
}

