/**
 * Blockly 基础插件
 * 职责：定义互动小说专用的自定义积木块
 */

import { PluginBase } from '../../plugin/PluginBase.js';
import type { PluginMetadata } from '../../plugin/types.js';

export class BlocklyPlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'basicmod.blockly',
    name: 'Blockly基础积木',
    version: '1.0.0',
    author: '墨水官方',
    description: '提供互动小说专用的 Blockly 积木块定义',
    icon: 'BLOCKLY',
    category: 'basicmod',
    tags: ['基础模组', 'blockly', 'visual-programming'],
    requires: ['basicmod.runtime']
  };

  protected async onInstall(): Promise<void> {
    console.log('[BlocklyPlugin] Installed - blocks will be registered via hooks');
  }

  /**
   * 钩子：注册自定义积木块和工具箱类别
   */
  hooks = {
    'blockly:register-blocks': (blocks: any[]) => {
      console.log('[BlocklyPlugin] Registering custom blocks via hook...');
      
      const customBlocks = [
        {
          type: 'story_show_text',
          message0: '显示文本 %1',
          args0: [
            {
              type: 'input_value',
              name: 'TEXT',
              check: 'String'
            }
          ],
          previousStatement: null,
          nextStatement: null,
          colour: 270,
          tooltip: '在节点中显示文本（调试用）',
          helpUrl: ''
        },
        {
          type: 'story_random',
          message0: '随机数 从 %1 到 %2',
          args0: [
            {
              type: 'input_value',
              name: 'FROM',
              check: 'Number'
            },
            {
              type: 'input_value',
              name: 'TO',
              check: 'Number'
            }
          ],
          output: 'Number',
          colour: 90,
          tooltip: '生成指定范围内的随机整数',
          helpUrl: ''
        }
      ];
      
      console.log(`[BlocklyPlugin] Providing ${customBlocks.length} blocks`);
      return [...blocks, ...customBlocks];
    },
    
    'blockly:register-generators': (generators: Record<string, any>) => {
      console.log('[BlocklyPlugin] Registering code generators via hook...');
      
      const customGenerators = {
        story_show_text: function(block: any, generator: any) {
          const text = generator.valueToCode(block, 'TEXT', generator.ORDER_NONE) || '""';
          return `console.log(${text});\n`;
        },
        
        story_random: function(block: any, generator: any) {
          const from = generator.valueToCode(block, 'FROM', generator.ORDER_NONE) || '1';
          const to = generator.valueToCode(block, 'TO', generator.ORDER_NONE) || '10';
          return [`Math.floor(Math.random() * ((${to}) - (${from}) + 1)) + (${from})`, 99];
        }
      };
      
      console.log(`[BlocklyPlugin] Providing ${Object.keys(customGenerators).length} generators`);
      return { ...generators, ...customGenerators };
    },
    
    'blockly:register-toolbox-categories': (categories: any[]) => {
      console.log('[BlocklyPlugin] Registering toolbox category via hook...');
      
      const toolsCategory = {
        kind: 'category',
        name: '工具',
        colour: 90,
        contents: [
          { kind: 'block', type: 'story_random' },
          { kind: 'block', type: 'story_show_text' }
        ]
      };
      
      return [...categories, toolsCategory];
    }
  };

  /**
   * 获取自定义积木块定义（供前端使用）
   */
  static getCustomBlockDefinitions() {
    return {
      // 互动小说专用积木
      story: [
        {
          type: 'story_show_text',
          message0: '显示文本 %1',
          args0: [
            {
              type: 'input_value',
              name: 'TEXT',
              check: 'String'
            }
          ],
          previousStatement: null,
          nextStatement: null,
          colour: 270,
          tooltip: '在节点中显示文本（调试用）',
          helpUrl: ''
        },
        {
          type: 'story_random',
          message0: '随机数 从 %1 到 %2',
          args0: [
            {
              type: 'input_value',
              name: 'FROM',
              check: 'Number'
            },
            {
              type: 'input_value',
              name: 'TO',
              check: 'Number'
            }
          ],
          output: 'Number',
          colour: 90,
          tooltip: '生成指定范围内的随机整数',
          helpUrl: ''
        }
      ]
    };
  }

  /**
   * 获取代码生成器（供前端使用）
   */
  static getCodeGenerators() {
    return {
      story_show_text: function(block: any, generator: any) {
        const text = generator.valueToCode(block, 'TEXT', generator.ORDER_NONE) || '""';
        return `console.log(${text});\n`;
      },
      
      story_random: function(block: any, generator: any) {
        const from = generator.valueToCode(block, 'FROM', generator.ORDER_NONE) || '1';
        const to = generator.valueToCode(block, 'TO', generator.ORDER_NONE) || '10';
        return [`Math.floor(Math.random() * ((${to}) - (${from}) + 1)) + (${from})`, 99];
      }
    };
  }
}

