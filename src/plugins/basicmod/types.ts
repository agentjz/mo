/**
 * 基础插件类型定义
 */

/**
 * 变量定义
 */
export interface VariableDefinition {
  id: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  defaultValue: number | string | boolean;
  description?: string;
  source?: 'user' | 'plugin';
  pluginId?: string;
}

/**
 * 变量注册表
 */
export interface VariableRegistry {
  variables: VariableDefinition[];
}

/**
 * 比较操作符
 */
export type CompareOperator = '>' | '>=' | '<' | '<=' | '===' | '!==';

/**
 * 变量操作类型
 */
export type VariableOperation = 'set' | 'add' | 'subtract' | 'multiply' | 'divide';

