# 单元测试说明

单元测试使用 Vitest，默认在 jsdom 中运行，不需要启动本地服务。测试数据使用确定性夹具；涉及 IndexedDB 的用例使用 `fake-indexeddb`。

## 当前覆盖

- StoryDocument、StoryEditorState、结构验证、分析和 React Flow 投影。
- AuthoringSession 与 BrowserAuthoringPort 的原子命令、dry-run、revision、审阅、撤销和重做。
- PlayerKernel、RuleEngine、RuntimePlugin、内容渲染和三个存档槽合同。
- PluginSystem 的注册、依赖、冲突、事件、数据、贡献、健康状态与配置回滚。
- TemplateRegistry、TemplateCompiler、TemplatePackageService 和十二模板 catalog。
- WorkspaceRepository、StorySaveCoordinator、整库 ZIP 与独立 HTML 导出。
- 体验基线、静态架构和 F001-F018 验收入口合同。

当前目录包含 19 个测试文件、65 个测试。实际数量以命令输出为准，不在验证脚本中写死。

## 运行

全部单元测试：

```powershell
npm.cmd run test:unit
```

单个测试文件：

```powershell
npm.cmd run test:unit -- tests/unit/PlayerKernel.test.ts
```

监听模式：

```powershell
npm.cmd run test
```

日常完整门禁仍使用：

```powershell
npm.cmd run verify
```

浏览器、视觉和压力验收不属于单元测试，入口见根 `CONTRIBUTING.md`、`spec.md` 和 `package.json`。
