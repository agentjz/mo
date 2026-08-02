/**
 * 时间系统 - Blockly 积木块定义
 */

export const TIME_BLOCKS = [
  {
    type: 'time_add',
    message0: '时间流逝 %1 分钟',
    args0: [
      {
        type: 'input_value',
        name: 'MINUTES',
        check: 'Number'
      }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 45,
    tooltip: '增加游戏时间，自动处理进位（60分→1时，24时→1天，30天→1月）',
    helpUrl: ''
  },
  
  {
    type: 'time_format',
    message0: '当前时间',
    output: 'String',
    colour: 45,
    tooltip: '返回格式化的时间字符串，例如："第3月 第15天 14:30"',
    helpUrl: ''
  }
];

