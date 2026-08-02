/**
 * 生存游戏模组 - Blockly 积木块定义
 */

export const SURVIVAL_BLOCKS = [
  // 修改属性
  {
    type: 'survival_modify_stat',
    message0: '%1 %2 %3',
    args0: [
      {
        type: 'field_dropdown',
        name: 'STAT',
        options: [
          ['生命值', 'health'],
          ['饥饿度', 'hunger'],
          ['口渴度', 'thirst']
        ]
      },
      {
        type: 'field_dropdown',
        name: 'OPERATION',
        options: [
          ['增加', 'add'],
          ['减少', 'sub']
        ]
      },
      {
        type: 'input_value',
        name: 'VALUE',
        check: 'Number'
      }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 120,
    tooltip: '修改生存属性（生命/饥饿/口渴），自动限制在0-100范围',
    helpUrl: ''
  },
  
  // 检查属性
  {
    type: 'survival_get_stat',
    message0: '获取 %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'STAT',
        options: [
          ['生命值', 'health'],
          ['饥饿度', 'hunger'],
          ['口渴度', 'thirst']
        ]
      }
    ],
    output: 'Number',
    colour: 120,
    tooltip: '获取当前属性值',
    helpUrl: ''
  }
];

