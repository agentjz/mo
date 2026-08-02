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

## 交付标准

把 research、设计、实现、测试、文档同步和验证收成一次完整交付。明确记录真实命令、结果、未验证内容和剩余风险。commit 或 push 前必须得到 owner 当前明确授权。
