---
name: mo-development
description: 维护墨水项目时使用。适用于修改互动叙事编辑器、React/Vite 前端、Express 后端、节点流引擎、插件系统、游戏模组、Blockly、变量系统、保存逻辑、图片热区、独立 HTML 导出、Windows 打包、README、spec、AGENTS.md、tests 或运行配置；要求先 research，再写 plan，再按生产级验收闭环交付。
---

# Mo Development

每次接手都当作新项目。

先看事实，再做判断，最后行动。

事实来自当前 `spec.md`、`AGENTS.md`、`plan.md`、`README.md`、`.codex/skills/`、`frontend/`、`backend/`、`player-standalone/`、`packager-win/`、`tests`、配置文件、git 状态、命令结果和工具反馈。

## 铁律

- 先 research，再计划，再实现。
- 没有完成主链路调查，不动局部代码。
- 禁止兼容转发、旧别名导出、旧语义包装和历史命名适配层。
- 禁止把未实现能力写成当前产品事实。
- 禁止用根目录 `.cmd` 作为开发主入口；统一入口看根 `package.json`。
- 不交半成品。架构、类型、测试、文档和验证必须在同一交付闭环内完成。

## 当前产品主干

当前产品是互动叙事游戏编辑器：

- 节点流编辑是主线。
- 图片热区支持空间探索。
- 变量系统和 Blockly 条件驱动分支。
- 插件系统扩展编辑器和播放器能力。
- 独立 HTML 导出是核心发布路径。
- Windows 便携版打包是当前工程能力。

当前技术边界：

- `frontend/`：React、Vite、TypeScript、React Flow、Blockly。
- `backend/`：Express、TypeScript、JWT、文件系统仓储、原子写入。
- `player-standalone/`：独立播放器模板构建。
- `packager-win/`：Windows 便携版打包。

## 架构纪律

- Engine 层只管理节点跳转、选择、历史、存档和事件。
- Plugin 层通过 Hook、Event、Data Store 扩展能力。
- UI 层只负责呈现和交互。
- RuntimePlugin 是运行时变量唯一写入口。
- 模板只读变量，不修改变量。
- Blockly 代码生成器只能生成对 `fns` 的调用。
- 保存逻辑必须避免闭包旧值、异步竞态和写入损坏。
- 后端业务逻辑放 Service，数据访问放 Repository，文件写入等能力放 Infrastructure。

## 数据纪律

- `.env` 不进入版本控制。
- 用户数据、构建产物、打包输出、日志和临时文件不进入版本控制。
- 测试夹具放在 `frontend/tests/fixtures/`，不放根目录。
- 不把私有路径、真实密钥、用户草稿或上传图片写入文档事实。

## 验证

完整验证命令：

```text
npm.cmd run verify
```

依赖未安装时先执行：

```text
npm.cmd run install:all
```

涉及 E2E 时执行：

```text
npm.cmd run test:e2e
```

## 交付标准

接到明确问题后，把 research、设计、实现、测试、文档同步和验证收成一个完整交付。

不交半成品。

把“顶尖标准”翻成可验收的终局，不写成“继续优化”。

把任务定成生产级封顶验收，不写成后续优化或逐步改进。

不能一次闭环时，说明客观阻塞、已完成事实和剩余风险。

大改完成前运行项目完整验证命令。当前项目的完整验证命令必须在 `package.json` 中定义为：

```powershell
npm.cmd run verify
```

commit / push 只在项目所有者明确要求时执行。

## Caveman

短。准。硬。

少废话，不少判断。

少解释，不少证据。

少抽象，不少边界。

说不清，先别改。

## 文件职责审查

单一职责看变化原因，不看行数。

超过 300 行必须触发职责审查，但不是自动拆分理由。

职责混杂时按变化原因拆分：引擎规则、插件机制、UI 渲染、存储、打包、测试工具和文档事实必须有清晰边界。
