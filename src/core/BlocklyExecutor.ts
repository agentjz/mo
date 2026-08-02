/**
 * Blockly 脚本执行器
 * 职责：执行 Blockly 工作区脚本
 * 
 * 注意：此文件在浏览器环境中运行
 */

import type { BlocklyWorkspaceState } from '../types/blockly.js';

/**
 * 执行上下文
 */
export interface BlocklyExecutionContext {
  vars: Record<string, any>;      // 变量存储
  functions?: Record<string, Function>;  // 辅助函数
  [key: string]: any;             // 其他上下文数据
}

/**
 * Blockly 脚本执行器
 */
export class BlocklyExecutor {
  /**
   * 执行 Blockly 脚本
   * @param state Blockly 工作区状态
   * @param context 执行上下文
   * @returns 执行结果
   */
  static execute(
    state: BlocklyWorkspaceState | undefined,
    context: BlocklyExecutionContext
  ): any {
    if (!state || !state.blocks || state.blocks.blocks.length === 0) {
      return undefined;
    }

    // 检查是否在浏览器环境
    if (typeof (globalThis as any).window === 'undefined') {
      console.warn('[BlocklyExecutor] Blockly execution is only supported in browser');
      return undefined;
    }

    try {
      // 动态导入 Blockly（仅在浏览器环境）
      const code = this.generateCode(state);
      if (!code) return undefined;

      // 执行生成的代码
      return this.executeCode(code, context);
    } catch (error) {
      console.error('[BlocklyExecutor] Execution error:', error);
      return undefined;
    }
  }

  /**
   * 从 Blockly 状态生成 JavaScript 代码
   */
  private static generateCode(_state: BlocklyWorkspaceState): string {
    // 这个方法会在运行时被前端的实现覆盖
    // 因为需要访问 Blockly 库
    console.warn('[BlocklyExecutor] Code generation not implemented');
    return '';
  }

  /**
   * 执行生成的 JavaScript 代码
   */
  private static executeCode(code: string, context: BlocklyExecutionContext): any {
    try {
      // 创建安全的执行环境
      const vars = context.vars;
      const fns = context.functions || {};

      // 使用 Function 构造函数执行代码
      const fn = new Function('vars', 'fns', 'context', code);
      return fn(vars, fns, context);
    } catch (error) {
      console.error('[BlocklyExecutor] Code execution error:', error);
      console.error('Code:', code);
      throw error;
    }
  }

  /**
   * 设置代码生成器（由前端注入）
   */
  static setCodeGenerator(generator: (state: BlocklyWorkspaceState) => string): void {
    this.generateCode = generator;
  }
}

