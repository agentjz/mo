# Contributing

墨水使用文档驱动开发。贡献前先阅读：

- `AGENTS.md`
- `spec.md`
- `plan.md`
- `.codex/skills/mo-development/SKILL.md`
- `.codex/skills/plan/SKILL.md`

## 工作流程

- 中大型改动先更新 `plan.md`。
- 写完计划，再动手。
- 新事实推翻计划，先改计划，再继续。
- 不把未实现能力写成当前产品事实。
- 不新增假接口、空实现、兼容转发或旧语义包装。
- 不提交真实用户数据、密钥、构建产物或打包输出。
- 不接入第三方引擎或库而不记录许可证边界。

## 验证

安装依赖：

```text
npm.cmd run install:all
```

完整验证：

```text
npm.cmd run verify
```

涉及 E2E 时，按 `frontend/playwright.config.ts` 启动前后端并运行：

```text
npm.cmd run test:e2e
```

## 交付标准

接到明确问题后，把 research、设计、实现、测试、文档同步和验证收成一个完整交付。

不交半成品。

把“顶尖标准”翻成可验收的终局，不写成“继续优化”。

把任务定成生产级封顶验收，不写成后续优化或逐步改进。
