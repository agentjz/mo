/**
 * 游戏模组文档类型定义
 */

export interface GameModFunction {
  name: string;
  params: string;
  returns: string;
  description: string;
  example: string;
}

export interface GameModDocs {
  name: string;
  description: string;
  variables: {
    name: string;
    description: string;
    example: string;
  }[];
  functions: GameModFunction[];
  usage?: {
    setup?: string[];      // 设置步骤
    textUsage?: string[];  // 在文本中使用
    scriptUsage?: string[]; // 在脚本中使用
    examples?: string[];    // 完整示例
  };
}

