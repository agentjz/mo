import type { RichText } from './types.ts';

export type StatementBlock =
  | { type: 'paragraph'; content: RichText }
  | { type: 'list'; items: readonly string[] };

interface StatementSection {
  title: string;
  blocks: readonly StatementBlock[];
}

export const statementContent = {
  backLabel: '返回首页',
  title: '重要声明 / Important Notice',
  sections: [
    {
      title: '这个编辑器适合做什么 / What This Editor Is Designed For',
      blocks: [
        {
          type: 'paragraph',
          content: [{ text: '墨水是为空间叙事游戏而生的编辑器。如果你的游戏核心是探索未知空间、在压力下做艰难选择、用文字和氛围制造情感，那么这个工具就是为你准备的。' }],
        },
        {
          type: 'paragraph',
          content: [{ text: "MO is an editor designed for spatial narrative games. If your game's core is about exploring unknown spaces, making difficult choices under pressure, or creating emotions through text and atmosphere, then this tool is made for you.", emphasis: 'em' }],
        },
        {
          type: 'paragraph',
          content: [
            { text: '适合的游戏类型', emphasis: 'strong' },
            { text: '：' },
          ],
        },
        {
          type: 'list',
          items: [
            '探索类游戏（Backrooms、SCP收容失效）',
            '生存选择游戏（核避难所、废土生存）',
            '解谜推理游戏（侦探调查、真相拼图）',
            '多结局分支叙事（时间线分裂、钻石型叙事）',
          ],
        },
        {
          type: 'paragraph',
          content: [
            { text: 'Suitable Game Types', emphasis: 'strong' },
            { text: ':' },
          ],
        },
        {
          type: 'list',
          items: [
            'Exploration games (Backrooms, SCP containment breach)',
            'Survival choice games (Nuclear shelter, Wasteland survival)',
            'Puzzle mystery games (Detective investigation, Truth piecing)',
            'Multi-ending branching narratives (Timeline splitting, Diamond-shaped narratives)',
          ],
        },
        {
          type: 'paragraph',
          content: [
            { text: '不适合的类型', emphasis: 'strong' },
            { text: '：即时战斗、复杂的数值养成、实时竞技类游戏。' },
          ],
        },
        {
          type: 'paragraph',
          content: [{ text: 'Unsuitable Types: Real-time combat, complex numerical progression, or competitive multiplayer games.', emphasis: 'em' }],
        },
      ],
    },
    {
      title: '关于保存 / About Saving',
      blocks: [
        {
          type: 'paragraph',
          content: [
            { text: '系统会自动保存你的作品，但需要你配合触发保存机制。' },
            { text: '记得在编辑过程中时不时点击一下画面空白区域', emphasis: 'strong' },
            { text: '，这个简单的动作能确保你的修改被及时保存。养成这个习惯，可以避免意外丢失创作内容。' },
          ],
        },
        {
          type: 'paragraph',
          content: [{ text: 'The system will auto-save your work, but you need to help trigger the save mechanism. Remember to occasionally click on blank areas of the canvas during editing—this simple action ensures your changes are saved promptly. Developing this habit can prevent accidental loss of your creative content.', emphasis: 'em' }],
        },
      ],
    },
    {
      title: '设备要求 / Device Requirements',
      blocks: [
        {
          type: 'paragraph',
          content: [
            { text: '本编辑器面向电脑端设计，涉及大量拖拽节点、连线、复杂编辑等操作。' },
            { text: '强烈建议在电脑上使用', emphasis: 'strong' },
            { text: '，移动端体验会很差。' },
          ],
        },
        {
          type: 'paragraph',
          content: [{ text: 'This editor is designed for desktop use, involving extensive node dragging, connecting, and complex editing operations. It is strongly recommended to use it on a computer—the mobile experience will be poor.', emphasis: 'em' }],
        },
      ],
    },
    {
      title: '加入社区 / Join the Community',
      blocks: [
        {
          type: 'paragraph',
          content: [{ text: '编辑器完全免费开放使用，包括用于商业用途。如果你想获取本地版本、交流创作经验或反馈问题，欢迎点击"本地使用"加入创作者社区。' }],
        },
        {
          type: 'paragraph',
          content: [{ text: 'The editor is completely free and open for use, including for commercial purposes. If you want to get the local version, exchange creative experiences, or provide feedback, feel free to click "Local Use" to join the creator community.', emphasis: 'em' }],
        },
        {
          type: 'paragraph',
          content: [{ text: '本地版的数据存储在你自己的电脑上，完全由你掌控。社区会提供使用教程和技术支持，帮助你更好地创作作品。' }],
        },
        {
          type: 'paragraph',
          content: [{ text: 'The local version stores data on your own computer, giving you complete control. The community provides tutorials and technical support to help you create better works.', emphasis: 'em' }],
        },
      ],
    },
    {
      title: '开始创作 / Start Creating',
      blocks: [
        {
          type: 'paragraph',
          content: [{ text: '编辑器默认采用日间模式主题，可以在插件商店切换其他主题风格。' }],
        },
        {
          type: 'paragraph',
          content: [{ text: 'The editor uses a light theme by default, and you can switch to other theme styles in the plugin store.', emphasis: 'em' }],
        },
        {
          type: 'paragraph',
          content: [{ text: '基础的文本创作使用节点流编辑即可。如需启用游戏化逻辑系统（变量管理、条件判断等高级功能），可在插件商店激活 Blockly 可视化编程模组。' }],
        },
        {
          type: 'paragraph',
          content: [{ text: 'Basic text creation uses node-flow editing. If you need to enable game logic systems (variable management, conditional logic, and other advanced features), you can activate the Blockly visual programming module in the plugin store.', emphasis: 'em' }],
        },
        {
          type: 'paragraph',
          content: [{ text: '现在，开始讲述你的故事吧。' }],
        },
        {
          type: 'paragraph',
          content: [{ text: 'Now, begin telling your story.', emphasis: 'em' }],
        },
      ],
    },
  ] satisfies readonly StatementSection[],
} as const;
