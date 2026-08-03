/**
 * Blockly 完整初始化工具
 * 职责：注册 Blockly 内置积木块、自定义积木块和工具箱配置
 */

import * as Blockly from 'blockly';

// 导入 Blockly 内置 blocks，会自动注册到 Blockly.Blocks。
import 'blockly/blocks';

// 导入中文语言包。
import * as ZhHans from 'blockly/msg/zh-hans';

import type { PluginSystem } from '../plugin/PluginSystem';
import { 
  registerCustomBlocks, 
  registerCodeGenerators, 
  overrideVariableBlockGenerators, 
  injectCodeGenerator 
} from '../blockly/BlocklyCore';

let isInitialized = false;

/**
 * 初始化 Blockly。
 * 只需要调用一次。
 * 
 * @param pluginSystem - 插件系统实例。通过钩子收集所有插件的积木定义。
 */
export function initializeBlockly(pluginSystem: PluginSystem): void {
  if (isInitialized) {
    console.log('[Blockly] Already initialized, skipping');
    return;
  }
  
  console.log('[Blockly] Starting initialization with PluginSystem...');

  // ============= 0. 设置中文语言 =============
  Blockly.setLocale(ZhHans as any);

  // ============= 1. 注册 Blockly 所有内置 blocks =============
  // 这些 blocks 来自 NPM 包，直接引用即可。
  // 包括 logic、loops、math、text、lists、variables、procedures 等。
  
  // Blockly.Blocks 会自动包含所有内置块定义
  // 我们只需要确保导入了 blocks 模块
  console.log('[Blockly] Loading all built-in blocks (中文)...');
  
  // 记录当前使用的内置块类型。
  const builtinBlockTypes = [
    // Logic blocks
    'controls_if', 'controls_ifelse', 'logic_compare', 'logic_operation', 
    'logic_negate', 'logic_boolean', 'logic_null', 'logic_ternary',
    
    // Loop blocks
    'controls_repeat_ext', 'controls_repeat', 'controls_whileUntil',
    'controls_for', 'controls_forEach', 'controls_flow_statements',
    
    // Math blocks
    'math_number', 'math_arithmetic', 'math_single', 'math_trig',
    'math_constant', 'math_number_property', 'math_round',
    'math_on_list', 'math_modulo', 'math_constrain', 'math_random_int',
    'math_random_float',
    
    // Text blocks
    'text', 'text_join', 'text_append', 'text_length',
    'text_isEmpty', 'text_indexOf', 'text_charAt', 'text_getSubstring',
    'text_changeCase', 'text_trim', 'text_count', 'text_replace',
    'text_reverse',
    
    // List blocks
    'lists_create_empty', 'lists_create_with', 'lists_repeat',
    'lists_length', 'lists_isEmpty', 'lists_indexOf', 'lists_getIndex',
    'lists_setIndex', 'lists_getSublist', 'lists_split', 'lists_sort',
    'lists_reverse',
    
    // Variable blocks
    'variables_get', 'variables_set',
    
    // Procedure blocks (函数定义)
    'procedures_defnoreturn', 'procedures_defreturn',
    'procedures_callnoreturn', 'procedures_callreturn',
    'procedures_ifreturn'
  ];

  console.log(`[Blockly] Built-in blocks available: ${builtinBlockTypes.length} types`);

  // ============= 2. 注册自定义积木块（互动小说专用 + 游戏模组）============
  console.log('[Blockly] Step 2: Collecting custom blocks from plugins...');
  
  const rulePacks = pluginSystem.listContributions('rulePack').map(item => item.value);
  const allCustomBlocks = rulePacks.flatMap(pack => pack.blockly.blocks);
  console.log(`[Blockly] Collected ${allCustomBlocks.length} custom blocks`);
  
  const allCustomGenerators = Object.assign({}, ...rulePacks.map(pack => pack.blockly.generators));
  console.log(`[Blockly] Collected ${Object.keys(allCustomGenerators).length} code generators`);
  
  // 批量注册积木块。
  console.log('[Blockly] Registering blocks to Blockly.Blocks...');
  registerCustomBlocks(allCustomBlocks);
  console.log(`[Blockly]   Registered ${allCustomBlocks.length} blocks`);

  // ============= 3. 注册代码生成器 =============
  console.log('[Blockly] Step 3: Registering code generators...');
  registerCodeGenerators(allCustomGenerators);
  console.log(`[Blockly]   Registered ${Object.keys(allCustomGenerators).length} generators`);

  // ============= 4. 重写内置变量块的代码生成器 =============
  overrideVariableBlockGenerators();

  // ============= 5. 注入代码生成器到 BlocklyExecutor =============
  injectCodeGenerator();

  isInitialized = true;
  console.log('[Blockly] Initialization complete!');
  console.log(`[Blockly] Total custom blocks: ${allCustomBlocks.length}`);
  console.log(`[Blockly] Total custom generators: ${Object.keys(allCustomGenerators).length}`);
  console.log('[Blockly] Ready to use!');
}

/**
 * 创建完整的工具箱配置
 * 包含 Blockly 所有内置类别和插件动态注册的类别。
 * 
 * @param pluginSystem - 插件系统实例，用于收集插件提供的工具箱类别。
 */
export function createCustomToolbox(pluginSystem: PluginSystem) {
  const pluginCategories = pluginSystem.listContributions('rulePack')
    .flatMap(item => item.value.blockly.toolbox);
  console.log(`[Blockly] Collected ${pluginCategories.length} plugin toolbox categories`);
  
  return {
    kind: 'categoryToolbox',
    contents: [
      // ==================== 插件类别（动态收集）====================
      ...pluginCategories,

      // ==================== Blockly 内置类别 ====================
      
      // 逻辑类别
      {
        kind: 'category',
        name: '逻辑',
        colour: 210,
        contents: [
          { kind: 'block', type: 'controls_if' },
          { kind: 'block', type: 'controls_ifelse' },
          { kind: 'block', type: 'logic_compare' },
          { kind: 'block', type: 'logic_operation' },
          { kind: 'block', type: 'logic_negate' },
          { kind: 'block', type: 'logic_boolean' },
          { kind: 'block', type: 'logic_null' },
          { kind: 'block', type: 'logic_ternary' }
        ]
      },

      // 循环类别
      {
        kind: 'category',
        name: '循环',
        colour: 120,
        contents: [
          { kind: 'block', type: 'controls_repeat_ext' },
          { kind: 'block', type: 'controls_whileUntil' },
          { kind: 'block', type: 'controls_for' },
          { kind: 'block', type: 'controls_forEach' },
          { kind: 'block', type: 'controls_flow_statements' }
        ]
      },

      // 数学类别
      {
        kind: 'category',
        name: '数学',
        colour: 230,
        contents: [
          { kind: 'block', type: 'math_number' },
          { kind: 'block', type: 'math_arithmetic' },
          { kind: 'block', type: 'math_single' },
          { kind: 'block', type: 'math_trig' },
          { kind: 'block', type: 'math_constant' },
          { kind: 'block', type: 'math_number_property' },
          { kind: 'block', type: 'math_round' },
          { kind: 'block', type: 'math_on_list' },
          { kind: 'block', type: 'math_modulo' },
          { kind: 'block', type: 'math_constrain' },
          { kind: 'block', type: 'math_random_int' },
          { kind: 'block', type: 'math_random_float' }
        ]
      },

      // 文本类别
      {
        kind: 'category',
        name: '文本',
        colour: 160,
        contents: [
          { kind: 'block', type: 'text' },
          { kind: 'block', type: 'text_join' },
          { kind: 'block', type: 'text_append' },
          { kind: 'block', type: 'text_length' },
          { kind: 'block', type: 'text_isEmpty' },
          { kind: 'block', type: 'text_indexOf' },
          { kind: 'block', type: 'text_charAt' },
          { kind: 'block', type: 'text_getSubstring' },
          { kind: 'block', type: 'text_changeCase' },
          { kind: 'block', type: 'text_trim' },
          { kind: 'block', type: 'text_count' },
          { kind: 'block', type: 'text_replace' },
          { kind: 'block', type: 'text_reverse' }
        ]
      },

      // 列表类别
      {
        kind: 'category',
        name: '列表',
        colour: 260,
        contents: [
          { kind: 'block', type: 'lists_create_empty' },
          { kind: 'block', type: 'lists_create_with' },
          { kind: 'block', type: 'lists_repeat' },
          { kind: 'block', type: 'lists_length' },
          { kind: 'block', type: 'lists_isEmpty' },
          { kind: 'block', type: 'lists_indexOf' },
          { kind: 'block', type: 'lists_getIndex' },
          { kind: 'block', type: 'lists_setIndex' },
          { kind: 'block', type: 'lists_getSublist' },
          { kind: 'block', type: 'lists_split' },
          { kind: 'block', type: 'lists_sort' },
          { kind: 'block', type: 'lists_reverse' }
        ]
      },

      // 变量类别仅使用侧边栏管理的全局变量。
      // 禁用 Blockly 内置变量管理 UI，用户只能使用侧边栏预定义的变量。
      // 这样可以确保单向数据流。
      {
        kind: 'category',
        name: '故事变量',
        colour: 330,
        contents: [
          { kind: 'block', type: 'variables_set' },
          { kind: 'block', type: 'variables_get' },
          { kind: 'block', type: 'math_change' }
        ]
      },

      // 函数类别（Procedures - 重要功能！）
      {
        kind: 'category',
        name: '函数',
        colour: 290,
        custom: 'PROCEDURE'
      }
    ]
  };
}



