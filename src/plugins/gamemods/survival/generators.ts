/**
 * 生存游戏模组 - Blockly 代码生成器
 */

export const SURVIVAL_GENERATORS = {
  survival_modify_stat: function(block: any, generator: any) {
    const stat = block.getFieldValue('STAT');
    const operation = block.getFieldValue('OPERATION');
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '0';
    const actualValue = operation === 'sub' ? `-(${value})` : value;
    return `fns.modifyStat('${stat}', ${actualValue});\n`;
  },
  
  survival_get_stat: function(block: any, generator: any) {
    const stat = block.getFieldValue('STAT');
    return [`fns.getStat('${stat}')`, generator.ORDER_ATOMIC];
  }
};

