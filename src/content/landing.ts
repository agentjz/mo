import type { RichText } from './types.ts';

interface LandingParagraph {
  content: RichText;
}

export const landingContent = {
  title: '墨水',
  descriptionLabel: '墨水介绍',
  paragraphs: [
    {
      content: [
        { text: '墨水 / MO', emphasis: 'strong' },
        { text: ' 是一个互动叙事游戏编辑器。创作简单的游戏不需要编写任何代码，拖拽节点、连接选项，故事的分支结构会像地图一样展现在你眼前。当你准备好时，可以用变量、条件判断、图片、热区交互来扩展你的故事。' },
      ],
    },
    {
      content: [
        { text: "MO is an interactive narrative game editor. Creating simple games requires no coding—just drag nodes and connect choices, and your story's branching structure will unfold like a map before your eyes. When you're ready, you can expand your story with variables, conditional logic, images, and hotspot interactions.", emphasis: 'em' },
      ],
    },
    {
      content: [
        { text: '如果你想做的游戏核心是探索未知空间、在压力下做艰难选择、用文字和氛围制造情感，那么 墨水 就是为你准备的。它适合创作探索类游戏、生存选择、解谜推理和多结局分支叙事。相反，如果你需要即时战斗、复杂的数值系统或实时竞技玩法，可能需要其他更专业的引擎。' },
      ],
    },
    {
      content: [
        { text: "If your game's core revolves around exploring unknown spaces, making difficult choices under pressure, or evoking emotions through text and atmosphere, then MO is designed for you. It's ideal for creating exploration games, survival choices, puzzle mysteries, and multi-ending branching narratives. However, if you need real-time combat, complex numerical systems, or competitive gameplay, you may need other more specialized engines.", emphasis: 'em' },
      ],
    },
    {
      content: [
        { text: '墨水 可以直接导出为 HTML 文件，因此你可以将作品发布到几乎任何地方。你用墨水创作的任何内容都可以完全免费使用，包括用于商业用途。' },
      ],
    },
    {
      content: [
        { text: 'MO can export directly to HTML files, so you can publish your work almost anywhere. Everything you create with MO can be used completely free of charge, including for commercial purposes.', emphasis: 'em' },
      ],
    },
  ] satisfies readonly LandingParagraph[],
  actions: {
    label: '首页操作',
    local: '本地版本',
    editor: '在线使用',
    statement: '重要声明',
  },
  version: {
    prefix: '墨水 的最新版本是 ',
    number: 'v2.0',
    suffix: '，发布于 2025年11月7日。',
  },
  qrCode: {
    closeLabel: '关闭二维码',
    title: '扫码加入微信群',
    subtitle: '获取本地版和技术支持',
    imageAlt: '微信群二维码',
  },
} as const;
