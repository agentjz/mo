# Contributing

墨水使用文档驱动开发。贡献前先阅读：

- `AGENTS.md`
- `spec.md`
- `plan.md`
- `plan.example.md`
- `.agents/skills/mo-development/SKILL.md`
- `.agents/skills/plan/SKILL.md`

## 工作流程

- 中大型改动先更新 `plan.md`，再实现并随进度维护 checklist。
- 新事实推翻计划时先改计划，不用口头说明代替计划更新。
- 当前代码只服务当前实现，不新增兼容转发、旧别名、历史语义包装或空接口。
- 下层模块不得反向依赖页面、组件、Context 或组合根。
- 不提交真实作品、图片、浏览器数据、密钥、日志、构建和测试产物。
- 保留页面的可见文案和视觉变化必须有明确产品依据。

## 本地运行

```powershell
npm.cmd install
npm.cmd run start
```

`npm.cmd run start` 是 owner 保留的本地构建与 `/mo/` 预览入口。开发热更新使用：

```powershell
npm.cmd run dev
```

## 验证

日常门禁：

```powershell
npm.cmd run verify
```

浏览器和常规压力是独立验收，不得加入日常门禁：

```powershell
npm.cmd run test:e2e
npm.cmd run test:stress
```

浏览器链路和性能边界的人工全量验收使用：

```powershell
npm.cmd run verify:full
```

## 当前合同

- 作品事实使用 `mo.story` version 2 的 `StoryDocument`，编辑器坐标与视口单独保存在 `StoryEditorState`。当前格式不读取旧 schema。
- 工作区数据交换只使用 `mo.workspace` version 2 的整库 ZIP；导入先完整校验，再以单个事务覆盖全部作品、资源和设置。单作品只保留独立 HTML 发布产物。
- 本地播放器模板包使用 `mo.player-template` version 1，必须包含 manifest、`template.html` 和 `template.css`，并通过路径、大小、哈希、标记和远程内容校验。
- 插件通过 manifest、事件、Data Store 和类型化贡献接入。新增能力应进入现有贡献合同，不向 PlayerKernel 或页面加入插件 ID 分支。

## 体验保护

- `09d8d2f` 是现有页面、文案、视觉资产、交互路径以及视觉小说和聊天播放器的冻结基线。
- 模板入口只允许在既有播放器设置附近增量扩展。视觉失败必须修实现，不得更新基线、放宽像素阈值或删除断言。
- 涉及保留页面或播放器时，除日常门禁外还应运行对应 E2E、`tests/visual/experience-baseline.spec.ts` 和模板三视口矩阵。

## 交付标准

把 research、设计、实现、测试、文档同步和验证收成一次完整交付。明确记录真实命令、结果、未验证内容和剩余风险。commit 或 push 前必须得到 owner 当前明确授权。
