/**
 * 时间系统 - Blockly 代码生成器
 */

export const TIME_GENERATORS = {
  time_add: function(block: any, generator: any) {
    const minutes = generator.valueToCode(block, 'MINUTES', generator.ORDER_NONE) || '0';
    return `fns.addTime(${minutes});\n`;
  },
  
  time_format: function(_block: any, generator: any) {
    return [`fns.formatTime()`, generator.ORDER_ATOMIC];
  }
};

