/**
 * 运行时插件（基础）
 * 职责：提供变量存储、模板替换等运行时能力
 * 
 * v3.0 Blockly重构说明：
 * - 移除 ActionConfig 执行逻辑（改用 Blockly）
 * - 保留变量存储和模板替换功能
 */

import { PluginBase } from '../../plugin/PluginBase.js';
import type { PluginMetadata, PluginHook, PluginHookHandler } from '../../plugin/types.js';
import { BlocklyExecutor } from '../../core/BlocklyExecutor.js';
import type { NodeScripts, ChoiceScripts } from '../../types/blockly.js';
import type { PluginContributions, RuntimeFunction } from '../../plugin/contributions.ts';

export class RuntimePlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'basicmod.runtime',
    name: '基础运行时',
    version: '3.0.0',
    author: '墨水官方',
    description: '提供变量存储和模板替换功能',
    icon: 'RT',
    category: 'basicmod',
    tags: ['基础模组', 'runtime', 'variables', 'template']
  };

  private variables: Record<string, any> = {};
  private helperFunctions: Record<string, Function> = {};

  getContributions(): PluginContributions {
    return {
      runtime: {
        variables: {
          get: path => this.get(path),
          set: (path, value) => this.set(path, value),
          registerFunction: (name, fn) => this.registerFunction(name, fn),
          variables: () => this.variables,
        },
      },
    };
  }

  hooks: Partial<Record<PluginHook, PluginHookHandler>> = {
    'node:before-enter': this.handleNodeEnter.bind(this),
    'node:before-leave': this.handleNodeLeave.bind(this),
    'choice:filter': this.handleChoiceFilter.bind(this),
    'choice:before-select': this.handleChoiceSelect.bind(this),
    'content:process': this.handleContentProcess.bind(this),
    'data:save': this.handleSave.bind(this),
    'data:load': this.handleLoad.bind(this)
  };

  protected async onInstall(): Promise<void> {
    this.variables = this.getData('$variables') || {};
    this.registerBuiltinHelpers();
  }

  private registerBuiltinHelpers(): void {
    this.helperFunctions = {
      random: (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      
      clamp: (value: number, min: number, max: number): number => {
        return Math.max(min, Math.min(max, value));
      },
      
      abs: (value: number): number => {
        return Math.abs(value);
      },
      
      floor: (value: number): number => {
        return Math.floor(value);
      },
      
      ceil: (value: number): number => {
        return Math.ceil(value);
      },
      
      round: (value: number): number => {
        return Math.round(value);
      },
      
      min: (...values: number[]): number => {
        return Math.min(...values);
      },
      
      max: (...values: number[]): number => {
        return Math.max(...values);
      }
    };
  }

  /**
   * 处理模板字符串（{{$vars.xxx}}）
   */
  public processTemplate(text: string): string {
    let result = text;
    let lastResult = '';
    let maxIterations = 10;
    let iteration = 0;
    
    while (result !== lastResult && iteration < maxIterations) {
      lastResult = result;
      result = this.processSinglePass(result);
      iteration++;
    }
    
    return result;
  }

  private processSinglePass(text: string): string {
    const pattern = /\{\{([^{}]+)\}\}/g;
    
    return text.replace(pattern, (match, expr) => {
      try {
        // 解析表达式
        const value = this.evaluateExpression(expr.trim());
        return value !== undefined && value !== null ? String(value) : match;
      } catch (error) {
        console.error('[RuntimePlugin] Template processing error:', error);
        console.error('Expression:', expr);
        return match;
      }
    });
  }

  /**
   * 计算表达式（简单的变量访问和三元运算符）
   */
  private evaluateExpression(expr: string): any {
    // 处理三元运算符: condition ? value1 : value2
    const ternaryMatch = expr.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
    if (ternaryMatch) {
      const [, condition, trueValue, falseValue] = ternaryMatch;
      const condResult = this.evaluateExpression(condition);
      return condResult ? this.evaluateExpression(trueValue) : this.evaluateExpression(falseValue);
    }
    
    // 处理字符串字面量
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }
    if (expr.startsWith("'") && expr.endsWith("'")) {
      return expr.slice(1, -1);
    }
    
    // 处理数字字面量
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return parseFloat(expr);
    }
    
    // 处理布尔字面量
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (expr === 'undefined') return undefined;
    
    // 处理变量访问: $vars.xxx 或 $vars.xxx.yyy
    if (expr.startsWith('$vars.')) {
      const path = expr.substring(6);
      return this.resolvePath(this.variables, path);
    }
    
    // 处理函数调用: $fn.xxx(...) 或直接 xxx(...)
    const funcMatch = expr.match(/^(?:\$fn\.)?(\w+)\((.*)\)$/);
    if (funcMatch) {
      const [, funcName, argsStr] = funcMatch;
      const func = this.helperFunctions[funcName];
      if (func) {
        const args = argsStr ? argsStr.split(',').map(a => this.evaluateExpression(a.trim())) : [];
        return func(...args);
      }
    }
    
    // 默认尝试作为变量名访问（兼容旧语法）
    if (this.variables[expr] !== undefined) {
      return this.variables[expr];
    }
    
    // 默认返回undefined
    return undefined;
  }

  private resolvePath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key];
        if (Array.isArray(current)) {
          current = current[parseInt(index)];
        } else {
          return undefined;
        }
      } else {
        current = current[part];
      }
    }
    
    return current;
  }

  private handleContentProcess(data: any, _context: any): any {
    const processedText = this.processTemplate(data.text);
    return { ...data, text: processedText };
  }

  private handleSave(saveData: any, _context: any): any {
    return {
      ...saveData,
      $variables: this.variables
    };
  }

  private handleLoad(saveData: any, _context: any): any {
    if (saveData.$variables) {
      this.variables = saveData.$variables;
      this.setData('$variables', this.variables);
    }
    return saveData;
  }

  // ========== 公共 API ==========

  /**
   * 获取所有变量
   */
  public getAllVariables(): Record<string, any> {
    return { ...this.variables };
  }

  /**
   * 重置所有变量
   */
  public reset(): void {
    this.variables = {};
    this.setData('$variables', this.variables);
    this.emit('variable:reset', {});
  }

  /**
   * 获取变量值
   */
  public get(path: string): any {
    return this.resolvePath(this.variables, path);
  }

  /**
   * 设置变量值
   */
  public set(path: string, value: any): void {
    this.setPath(this.variables, path, value);
    this.setData('$variables', this.variables);
    this.emit('variable:change', { path, value });
  }

  private setPath(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop();
    
    if (!last) return;
    
    let current = obj;
    for (const part of parts) {
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        if (!current[key]) {
          current[key] = [];
        }
        current = current[key];
        const idx = parseInt(index);
        if (!current[idx]) {
          current[idx] = {};
        }
        current = current[idx];
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
    
    const arrayMatch = last.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      if (!current[key]) {
        current[key] = [];
      }
      current[key][parseInt(index)] = value;
    } else {
      current[last] = value;
    }
  }

  /**
   * 注册辅助函数（内部使用）
   */
  public registerHelper(name: string, fn: Function): void {
    this.helperFunctions[name] = fn;
  }

  /**
   * 注册自定义函数（供游戏模组使用）
   * 这些函数可以在 Blockly 脚本中被调用
   */
  public registerFunction(name: string, fn: RuntimeFunction): void {
    console.log(`[RuntimePlugin] Registering custom function: ${name}`);
    this.helperFunctions[name] = fn;
  }

  /**
   * 获取所有辅助函数
   */
  public getHelperFunctions(): Record<string, Function> {
    return { ...this.helperFunctions };
  }
  
  /**
   * 获取变量对象（供游戏模组使用）
   * 允许游戏模组直接操作变量
   */
  public get vars(): Record<string, any> {
    return this.variables;
  }

  // ========== Blockly 脚本执行钩子 ==========

  /**
   * 节点进入时执行 Blockly 脚本
   */
  private handleNodeEnter(data: any, _context: any): any {
    const node = this.context.engine.getNode(data.nodeId);
    if (!node) return data;

    const nodeData = node.data as any;
    const blocklyScripts = nodeData.pluginData?.['blockly.scripts'] as NodeScripts | undefined;
    
    if (blocklyScripts?.onEnter) {
      try {
        BlocklyExecutor.execute(blocklyScripts.onEnter, {
          vars: this.variables,
          functions: this.helperFunctions
        });
        
        // 执行后更新变量存储
        this.setData('$variables', this.variables);
      } catch (error) {
        console.error('[RuntimePlugin] Failed to execute onEnter script:', error);
      }
    }
    
    return data;
  }

  /**
   * 节点离开时执行 Blockly 脚本
   */
  private handleNodeLeave(data: any, _context: any): any {
    const nodeId = data.nodeId;
    const node = this.context.engine.getNode(nodeId);
    if (!node) return data;
    
    const nodeData = node.data as any;
    const blocklyScripts = nodeData.pluginData?.['blockly.scripts'] as NodeScripts | undefined;
    
    if (blocklyScripts?.onLeave) {
      try {
        BlocklyExecutor.execute(blocklyScripts.onLeave, {
          vars: this.variables,
          functions: this.helperFunctions
        });
        
        // 执行后更新变量存储
        this.setData('$variables', this.variables);
      } catch (error) {
        console.error('[RuntimePlugin] Failed to execute onLeave script:', error);
      }
    }
    
    return data;
  }

  /**
   * 过滤选项（根据条件）
   */
  private handleChoiceFilter(data: any, _context: any): any {
    const nodeId = data.nodeId;
    const node = this.context.engine.getNode(nodeId);
    
    if (!node) return data;
    
    const filteredChoices = data.choices.filter((choice: any) => {
      const originalChoice = node.data.choices.find((c: any) => c.id === choice.id);
      
      if (!originalChoice) return true;
      
      const choiceScripts = (originalChoice as any).pluginData?.['blockly.scripts'] as ChoiceScripts | undefined;
      
      if (choiceScripts?.condition) {
        try {
          const result = BlocklyExecutor.execute(choiceScripts.condition, {
            vars: this.variables,
            functions: this.helperFunctions
          });
          return Boolean(result);
        } catch (error) {
          console.error('[RuntimePlugin] Failed to execute choice condition:', error);
          return true;
        }
      }
      
      return true;
    });
    
    return { ...data, choices: filteredChoices };
  }

  /**
   * 选择选项时执行 Blockly 脚本
   */
  private handleChoiceSelect(data: any, _context: any): any {
    const currentNodeId = this.context.engine.getCurrentNodeId();
    if (!currentNodeId) return data;
    
    const node = this.context.engine.getNode(currentNodeId);
    if (!node) return data;
    
    const choice = node.data.choices.find((c: any) => c.id === data.choiceId);
    
    if (choice) {
      const choiceScripts = (choice as any).pluginData?.['blockly.scripts'] as ChoiceScripts | undefined;
      
      if (choiceScripts?.onSelect) {
        try {
          BlocklyExecutor.execute(choiceScripts.onSelect, {
            vars: this.variables,
            functions: this.helperFunctions,
            choiceId: data.choiceId,
            nodeId: currentNodeId
          });
          
          // 执行后更新变量存储
          this.setData('$variables', this.variables);
        } catch (error) {
          console.error('[RuntimePlugin] Failed to execute onSelect script:', error);
        }
      }
    }
    
    return data;
  }
}
