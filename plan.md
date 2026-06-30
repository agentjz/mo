# 全局代码体检和立整立改 Plan

## 1. 需求文档

用户要求对 `mo` 做整体代码体检。该项目此前由较弱模型生成，必须从架构、职责、命名、类型、验证和真实浏览器行为上做一轮生产级整理；发现确定问题直接修复，最后完整测试通过，并补充 Playwright 真实浏览器 E2E 验证。

业务完成标准：修掉本轮体检发现的确定工程硬伤；不保留假接口、空接口、历史兼容层和无意义回退；不做机械替换；不做为了行数而拆文件；完整验证命令 `npm.cmd run verify` 通过；Playwright E2E 打开真实浏览器通过；文档同步当前事实。

## 2. 当前事实

- 根目录已经补齐 `AGENTS.md`、`spec.md`、`plan.md`、`plan.example.md`、`LICENSE`、`SECURITY.md`、`CONTRIBUTING.md`、`.gitignore`、项目 skill 和根 `package.json`。
- `npm.cmd run verify` 已通过：前端类型检查、后端构建、前端单元测试、前端构建、独立播放器构建均通过。
- `npm.cmd run test:e2e` 已改为显式有头模式入口，实际执行命令为 `playwright test --headed --project=chromium`。
- Playwright 有头 E2E 已通过：14 passed，1 skipped。跳过项是测试文件中主动跳过的 1000 节点压力测试。
- 子项目 `frontend`、`backend`、`player-standalone`、`player-standalone/visual-novel`、`packager-win` 的依赖里出现 `mo-workspace: file:..` 或 `file:../..`，导致 `node_modules/mo-workspace` 指回仓库根，文件扫描出现递归。
- `build:player` 生成 `frontend/public/templates/visual-novel-player.html`，当前文件处于未跟踪状态；该文件是 HTML 导出运行时需要的模板资源。
- `frontend/src/core/StoryEngine.ts` 已删除，它是未引用的历史兼容层。
- `frontend/src/utils/blocklyInit.ts` 的乱码注释已修复。
- 大文件扫描显示多个超过 300 行文件，需要职责审查。超过 300 行不是自动拆分理由。
- 当前发现真实空实现集中在 ThemeContext、PluginSystem 默认能力、多个 effect 清理函数。effect 空清理函数属于 React API 形态，不等于假接口；ThemeContext 和 PluginSystem 默认能力需要审查。
- 职责审查结论：`backend/src/constants/templates/*` 是模板常量，`packager-win/build-portable-win.js` 是单一打包流程脚本，本轮不按行数拆；`NodeVisualPanel`、`Dashboard`、`Editor`、`PlayerCore` 确实偏大，但本轮先修确定缺陷，后续拆分必须围绕表单状态、导入导出动作、保存流程和播放器会话这些变化原因拆，不做机械分割。
- `PlayerCore` 的插件 `moveTo` 已接到真实 `CoreEngine.jumpToNode`；`PluginSystem` 默认 `moveTo` 改为明确失败；`ThemeContext` 不再提供空 `switchTheme`。
- 编辑器自动保存已从连续保存两次改为保存前构造准确节点快照，一次保存包含当前面板数据。
- Playwright E2E 已在真实 Chromium 有头浏览器中运行通过。

## 3. 失败测试

以下任一情况视为失败：

- 任一子项目继续依赖 `mo-workspace: file:..` 或 `file:../..`。
- 文件扫描继续因为 `node_modules/mo-workspace` 递归而失真。
- `frontend/public/templates/visual-novel-player.html` 的生成和版本边界不明确。
- 已确认无引用的历史兼容层残留。
- 空接口、假接口或未实现警告继续作为当前主路径存在。
- `AGENTS.md`、项目 skill、`spec.md`、`README.md` 与当前实现不一致。
- `npm.cmd run verify` 失败。
- Playwright E2E 未运行或失败。

## 4. 目标

- 移除子项目对根工作区的错误 file 依赖，并重新生成 lockfile。
- 清理由错误 file 依赖造成的递归 `node_modules/mo-workspace`。
- 明确独立播放器模板的产物边界，避免靠隐式本地残留。
- 审查超过 300 行文件，按变化原因判断是否需要本轮拆分。
- 修掉本轮确定的空实现、假实现、历史包袱和类型边界问题。
- 运行完整验证和 Playwright E2E。
- 更新 `plan.md` 收口，记录已完成事实和剩余风险。

## 5. 不做范围

- 不重写产品功能。
- 不做 UI 大改版。
- 不做前后端目录大迁移。
- 不因为文件超过 300 行就强拆。
- 不执行 git commit 或 push，除非 owner 明确要求。

## 6. 设计

工程边界：

- 根 `package.json` 只做统一入口，不作为子项目运行时依赖。
- 子项目依赖只保留真实运行依赖和开发依赖。
- 生成产物如果是运行时必须资源，要么纳入源码边界，要么在验证命令里先生成再验证引用。当前采用明确纳入 `frontend/public/templates/` 的方式，因为前端运行时通过 `/templates/visual-novel-player.html` 读取。
- 文件职责审查看变化原因：UI 渲染、状态管理、规则计算、数据访问、构建打包、模板常量、插件注册分别判断。
- E2E 使用 `npm.cmd run test:e2e`，脚本显式传入 `--headed --project=chromium`，打开真实 Chromium 浏览器验证主要用户路径。

## 7. 实施任务

- [x] T001 运行结构整理后的完整验证，确认当前基线。
- [x] T002 扫描大文件、空实现、历史包袱、`any` 集中点和控制台日志。
- [x] T003 移除各子项目错误的 `mo-workspace` file 依赖并重新生成 lockfile。
- [x] T004 清理递归 `node_modules/mo-workspace` 目录。
- [x] T005 明确 `frontend/public/templates/visual-novel-player.html` 版本边界。
- [x] T006 审查超过 300 行文件，记录本轮拆分或不拆分理由。
- [x] T007 修复本轮确定的空实现、假实现、历史包袱和类型边界问题。
- [x] T008 运行 `npm.cmd run verify`。
- [x] T009 运行 Playwright E2E 真实浏览器测试。
- [x] T010 更新 `spec.md`、`README.md` 或项目规则中需要同步的事实。
- [x] T011 更新收口记录。

## 8. 验证计划

```powershell
rg -n 'file:\.\.|\.\./\.\.' frontend/package.json backend/package.json player-standalone/package.json player-standalone/visual-novel/package.json packager-win/package.json frontend/package-lock.json backend/package-lock.json player-standalone/package-lock.json player-standalone/visual-novel/package-lock.json packager-win/package-lock.json
npm.cmd run verify
npm.cmd run test:e2e
```

必要时单独运行：

```powershell
npm.cmd --prefix frontend run type-check
npm.cmd --prefix backend run build
```

## 9. 收口

- `npm.cmd run verify` 通过。
- `npm.cmd run test:e2e` 通过，脚本实际执行 `playwright test --headed --project=chromium`；结果为 14 passed，1 skipped。
- 已扫描错误 workspace file 依赖，无命中。
- 已扫描明确假实现、空实现和历史兼容标记，无命中。
- 已检查 `5173` 和 `3001` 端口，没有 `LISTENING` 常驻进程。
- 剩余风险：E2E 中 1000 节点压力测试仍按测试文件设计跳过；Vite 构建存在大 chunk 警告，但本轮验证通过。
