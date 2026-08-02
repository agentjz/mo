/**
 * 插件注册表
 * 职责：提供插件的详细描述和使用指南
 */

export interface PluginDetail {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  usage: string;
  category: string;
  icon: string;
  screenshots?: string[];
  changelog?: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
}

export const PLUGIN_REGISTRY: Record<string, PluginDetail> = {
  'core.markdown': {
    id: 'core.markdown',
    name: 'Markdown渲染',
    description: '支持Markdown语法和自定义标签渲染',
    longDescription: 'Markdown渲染插件让你可以使用丰富的文本格式，包括粗体、斜体、标题、列表等。同时支持自定义标签如[color=red]彩色文字[/color]。',
    usage: '在节点文本中使用Markdown语法，如 **粗体** *斜体* # 标题等。使用[color=red]文字[/color]添加颜色。',
    category: 'core',
    icon: 'MD'
  },
  
  'tool.validator': {
    id: 'tool.validator',
    name: '故事验证器',
    description: '检测孤立节点、死胡同、未连接选项等结构问题',
    longDescription: '故事验证器会检查你的故事结构是否完整，包括：是否有孤立节点、死胡同、未连接的选项、无法到达的结局等。帮助你发现潜在的问题。',
    usage: '点击侧边栏的"验证"按钮执行检查。红色表示错误必须修复，黄色表示警告可以忽略。',
    category: 'tool',
    icon: 'CHECK'
  },
  
  'tool.analyzer': {
    id: 'tool.analyzer',
    name: '故事分析器',
    description: '分析故事拓扑结构、深度、循环、关键决策点',
    longDescription: '故事分析器会计算每个节点的深度、出度、入度，检测循环结构和关键决策点，帮助你理解故事的复杂度。分析结果会显示在节点上。',
    usage: '分析会自动进行，结果显示在节点的标签中。关键决策点（3个以上选项）会特殊标记。',
    category: 'tool',
    icon: 'STAT'
  },
  
  'tool.layout': {
    id: 'tool.layout',
    name: '自动布局',
    description: '根据故事结构自动排列节点，保持画布整洁',
    longDescription: '自动布局插件会根据故事的深度结构自动排列节点，同一深度的节点会排列在同一层，循环节点会特殊处理。',
    usage: '点击侧边栏的"整理画布"按钮执行自动布局。',
    category: 'tool',
    icon: 'LAY'
  },
  
  'tool.export-html': {
    id: 'tool.export-html',
    name: 'HTML导出',
    description: '将故事导出为独立的HTML文件，可离线运行',
    longDescription: '导出插件可以将你的故事打包成单个HTML文件，包含完整的视觉小说播放器和所有资源。导出的文件可以直接分享，不需要服务器。',
    usage: '在仪表盘中点击作品的"导出HTML"按钮。',
    category: 'export',
    icon: 'EXP'
  },
  
  'core.variable': {
    id: 'core.variable',
    name: '变量系统',
    description: '提供变量存储、脚本执行、条件判断等基础能力',
    longDescription: '变量系统是高级互动游戏的基础，提供JavaScript脚本执行、变量管理、条件判断等功能。支持在节点中编写脚本控制游戏状态，在选项中设置显示条件。',
    usage: '在节点编辑器的"高级设置"中编写脚本。使用$vars访问变量，$fn调用辅助函数。',
    category: 'core',
    icon: 'VAR'
  },
  
  'gamemod.base.time': {
    id: 'gamemod.base.time',
    name: '基础-时间',
    description: '提供日夜循环、季节变化等时间管理（通用模组）',
    longDescription: '时间系统基于变量系统，提供日夜循环、季节变化等功能。每次选择自动推进时间，提供isNight()、formatTime()等辅助函数。适合任何需要时间流逝的故事。',
    usage: '在节点脚本中使用 $fn.isNight() 判断时间，$fn.advanceTime(2) 推进2小时。在文本中用 {{$fn.formatTime()}} 显示当前时间。',
    category: 'gamemod',
    icon: 'TIME'
  },
  
  'gamemod.survival.resource': {
    id: 'gamemod.survival.resource',
    name: '荒野生存-资源',
    description: '管理生存资源（食物、水、木头、石头、肉、皮革）',
    longDescription: '资源系统提供生存游戏所需的资源管理功能。支持hasResource()、addResource()、removeResource()等辅助函数。专为荒野生存类故事设计。',
    usage: '在选择条件中使用 $fn.hasResource("wood", 2) 检查资源。在脚本中使用 $fn.addResource("wood", 3) 增加资源，$fn.removeResources({wood: 1, meat: 1}) 消耗多个资源。',
    category: 'gamemod',
    icon: 'RES'
  },
  
  'gamemod.survival.skill': {
    id: 'gamemod.survival.skill',
    name: '荒野生存-技能',
    description: '管理生存技能（砍树、打猎、制作、战斗、探索）',
    longDescription: '技能系统提供生存技能等级管理和技能检定功能。支持hasSkill()、addSkillExp()、skillCheck()等辅助函数。专为荒野生存类故事设计。',
    usage: '在选择条件中使用 $fn.hasSkill("combat", 10) 检查技能等级。在脚本中使用 $fn.addSkillExp("hunting", 5) 增加经验，$fn.skillCheck("hunting", 50) 进行技能检定。',
    category: 'gamemod',
    icon: 'SKILL'
  },
  
  'gamemod.survival.prey': {
    id: 'gamemod.survival.prey',
    name: '荒野生存-猎物',
    description: '管理可狩猎的动物及其战利品',
    longDescription: '猎物系统提供预定义的猎物（兔子、鹿、野猪）及其狩猎难度和战利品。狩猎成功自动获得战利品和技能经验。专为荒野生存类故事设计。',
    usage: '在脚本中使用 $fn.hunt("rabbit") 尝试狩猎兔子。使用 $fn.canHunt("boar") 检查是否有能力狩猎野猪。依赖技能系统和资源系统。',
    category: 'gamemod',
    icon: 'PREY'
  },
  
  'gamemod.survival.crafting': {
    id: 'gamemod.survival.crafting',
    name: '荒野生存-加工',
    description: '管理物品制作和配方系统',
    longDescription: '加工系统提供物品制作功能，包括预定义的配方（石斧、长矛、陷阱、木筏）。检查材料和技能要求，制作成功自动消耗材料并获得物品。专为荒野生存类故事设计。',
    usage: '在选择条件中使用 $fn.canCraft("stone_axe") 检查能否制作。在脚本中使用 $fn.craft("stone_axe") 制作石斧，$fn.hasCrafted("raft") 检查是否已制作木筏。',
    category: 'gamemod',
    icon: 'CRAFT'
  }
};
