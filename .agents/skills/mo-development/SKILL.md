---
name: mo-development
description: 维护墨水纯前端本地优先互动叙事编辑器时使用。适用于 React/Vite、节点流、插件、游戏模组、Blockly、变量、保存、图片热区、导入导出、独立 HTML、PWA、GitHub Pages、文档、测试和运行配置；要求先 research，再写 plan，再按生产级验收闭环交付。
---

# Mo Development

每次接手都先看当前事实，再判断，最后行动。

事实来自 `AGENTS.md`、`spec.md`、`plan.md`、`README.md`、`.agents/skills/`、`src/`、`tests/`、`scripts/`、配置文件、git 状态和可复现命令结果。

## 铁律

- 先 research，再计划，再实现。
- 没完成主链路调查，不动局部代码。
- 禁止兼容转发、旧别名、旧语义包装和历史命名适配层。
- 禁止把未实现能力或旧架构写成当前产品事实。
- 不交半成品；架构、类型、测试、文档和验证必须闭环。
- 保留页面的可见文案、图片和视觉设计不得无依据删除或改写。

## 当前产品主干

- 仓库根目录是唯一 React + Vite + TypeScript 应用。
- 节点流、图片热区、变量和 Blockly 条件驱动互动叙事创作。
- IndexedDB 保存作品、图片、设置和插件配置。
- 插件系统扩展编辑器和播放器能力。
- 网页预览与独立 HTML 共用播放器源码。
- HashRouter、`/mo/` base、PWA 和 GitHub Pages 是部署边界。
- `start_index.py` 与 `npm.cmd run start` 是 owner 保留的本地入口。

当前不做账号、邮件、云同步、在线作品库、公开发布、固定分享链接、Windows 便携包和远程插件安装。

## 架构纪律

- 依赖方向是 `domain -> application -> platform -> UI -> composition root`。
- Engine 只管理节点跳转、选择、历史、存档和事件。
- PluginSystem 是 Hook、Event、Data Store、贡献、配置和健康状态的唯一 owner。
- RuntimePlugin 是运行时变量唯一写入口；模板只读变量。
- UI 不直接访问 IndexedDB、文件格式或插件实例内部。
- 保存使用 revision、写锁和广播，旧版本不得覆盖新版本。
- 导入先完整校验，再事务提交；失败不得写入半成品。

## 数据纪律

- 浏览器用户数据、构建、测试产物、日志和导出文件不进入版本控制。
- 测试夹具放在 `tests/fixtures/`。
- 不把私有路径、密钥、真实作品或图片写入文档事实。

## 验证

依赖未安装时：

```text
npm.cmd install
```

日常门禁：

```text
npm.cmd run verify
```

独立验收：

```text
npm.cmd run test:e2e
npm.cmd run test:stress
```

日常 `verify` 不得隐式执行浏览器或压力测试。`verify:full` 只用于人工全量验收。

## 交付标准

把 research、设计、实现、测试、文档和验证收成一个完整交付。把“顶尖标准”翻成可验收终局，不写“继续优化”。不能闭环时说明客观阻塞、已完成事实和剩余风险。

commit 或 push 只在 owner 当前明确授权后执行。

## 文件职责

单一职责看变化原因，不看行数。超过 300 行必须触发职责审查；引擎规则、插件机制、UI、存储、导出、测试工具和文档事实职责混杂时按变化原因拆分。
