# 墨水 Spec

`spec.md` 记录当前产品事实、业务边界、技术边界、架构约束、验收标准和开源协议。未实现能力不能写成当前能力。

## 产品定位

墨水是互动叙事游戏编辑器，服务于空间探索、视觉小说、分支剧情和多结局叙事创作。

它解决四个问题：

- 创作者想用节点流看清故事结构。
- 创作者想用图片、热区、变量和条件分支组织可探索场景。
- 创作者想预览和发布可游玩的视觉小说式作品。
- 创作者想导出不依赖服务器的独立 HTML，或打包成 Windows 便携版。

## 当前事实

- `frontend/` 是 React + Vite + TypeScript 编辑器、播放器和插件系统。
- `backend/` 是 Express + TypeScript API，负责认证、作者数据、故事草稿、图片和持久化。
- `player-standalone/` 构建独立播放器模板，用于 HTML 导出。
- `packager-win/` 构建 Windows 便携版，包含 Node.js 便携运行时、后端、前端、播放器和启动器。
- 当前前端核心库包含 React Flow、Blockly、JSZip、marked。
- 当前后端使用 JWT、bcryptjs、nodemailer、文件系统仓储和原子写入。
- 当前测试包含前端 Vitest 单元测试和 Playwright E2E 测试；E2E 使用 Chromium 有头模式打开真实浏览器。
- 当前完整验证命令是 `npm.cmd run verify`。

## 用户路径

### 创作故事

用户进入编辑器，创建故事，添加节点、选项和连接线。节点流展示故事结构，用户可以编辑文本、节点类型、选项、标签、打字机速度、背景图、角色立绘、热区和节点脚本。

### 空间探索

用户在节点图片上绘制矩形热区，配置热区名称和目标节点。播放器渲染热区覆盖层，点击热区后直接跳转到目标节点。

### 变量和条件

用户定义变量，设置默认值和显示规则。播放器启动时把 `story.variables` 初始化到 RuntimePlugin。模板只能读取变量；Blockly 脚本通过 RuntimePlugin 注册函数修改变量。

### 插件和游戏模组

插件通过 Hook、Event 和 Data Store 扩展编辑器与播放器。游戏模组把 Blockly 积木定义、代码生成器、变量定义和运行时逻辑拆开，保证编辑器、播放器和导出 HTML 都能复用。

### 保存和发布

编辑器使用防抖式自动保存，用户停止编辑后保存当前故事。后端以文件系统仓储持久化草稿、发布作品和图片。独立 HTML 导出生成可双击运行的作品文件。

### Windows 便携版

打包工具构建前端、后端和播放器，下载 Node.js 便携版，生成启动器和 ZIP 包。用户解压后双击启动脚本即可打开编辑器。

## 架构边界

### 前端分层

- Engine 层：节点跳转、选择、历史、存档和事件，不包含变量、条件、模板或业务逻辑。
- Plugin 层：通过 Hook、Event、Data Store 扩展功能。
- UI 层：React 组件，只负责呈现和交互。

### 后端分层

- Service 层：业务逻辑，不关心数据来源。
- Repository 层：数据访问，封装文件系统存储。
- Infrastructure 层：原子写入、邮件发送、图片处理等基础设施。

依赖方向：

```text
UI -> PluginSystem -> CoreEngine
Service -> Repository -> Infrastructure
```

依赖只能单向。下层不知道上层存在。

## 保存逻辑

保存逻辑遵循傻瓜式、零陷阱原则。

- 监听 `editor.nodes`、`editor.edges`、`editor.storyMeta`、`editor.variables`。
- 用户停止编辑后通过防抖定时器触发保存。
- 保存前先收集编辑面板数据，再更新内存状态，再从单一数据源读取。
- `editor.nodes` 和 `editor.edges` 是保存时的唯一真相来源。
- 使用锁避免自动保存重入。
- 后端写入使用临时文件加原子重命名，崩溃不损坏原文件。

## 变量系统

变量是单向数据流：

```text
定义 -> 初始化 -> 读取 -> 修改 -> 保存
```

- 变量定义保存在 `story.variables`。
- 播放器启动时 RuntimePlugin 根据变量定义初始化运行时变量。
- 模板语法读取变量，例如 `{{$vars.health}}`。
- Blockly 脚本通过 `fns.setVar`、`fns.addTime` 等注册函数修改运行时变量。
- 模板只读，不允许修改变量。
- 禁止绕过 RuntimePlugin 直接修改运行时变量。

## 图片热区

热区是图片上的可点击矩形区域：

- 数据保存在节点 `pluginData['image-hotspots']`。
- 热区包含 `id`、`label`、`targetNodeId` 和矩形坐标。
- 编辑器在 NodeVisualPanel 中绘制和管理热区。
- 播放器把热区渲染为图片覆盖层。
- 热区跳转使用直接节点跳转，不依赖 edge。

热区适用于房间调查、地图导航、迷宫方向、Backrooms 门和通道等空间探索场景。

## 插件系统

插件通过以下机制扩展产品：

- 同步数据转换钩子：`content:process`、`choice:filter`、`content:render`。
- 异步事件通知：`node:before-enter`、`node:after-enter`、`choice:select`。
- Blockly 扩展钩子：注册积木块、代码生成器和工具箱分类。
- 插件数据钩子：提供预定义变量和使用文档。

插件注册流程：

```text
register -> install -> enable
```

`theme` 和 `enhance` 类型插件同时只能启用一个。声明冲突的插件必须自动禁用。

## 游戏模组

游戏模组必须数据与逻辑分离：

```text
gamemods/
  mod-name/
    blocks.ts
    generators.ts
    variables.ts
    docs.ts
    ModPlugin.ts
    index.ts
```

- `blocks.ts`、`generators.ts`、`variables.ts`、`docs.ts` 是纯数据。
- `ModPlugin.ts` 负责运行时函数、钩子和状态逻辑。
- 代码生成器只能生成对 `fns` 的调用。
- 运行时函数必须通过 RuntimePlugin 注册。
- Blockly 执行环境不得访问 `window`、`document` 或插件类实例。

## 数据边界

- 用户数据目录、运行日志、构建产物和打包输出不进入版本控制。
- `.env` 不进入版本控制。
- 示例配置使用 `.env.example` 或 `production.env.txt`。
- 上传图片和故事数据默认保存在 `userdata/`。
- 导出 HTML 只包含作品运行所需数据，不包含作者私有凭据。

## 当前不做

- 即时战斗引擎。
- 复杂数值养成系统。
- 实时竞技。
- 云同步平台。
- 商城或素材市场。
- 移动端原生应用。

## 验收标准

- `npm.cmd run verify` 通过。
- `npm.cmd run typecheck` 通过。
- 前端单元测试通过。
- 前端构建通过。
- 后端 TypeScript 构建通过。
- 独立播放器构建通过。
- E2E 相关改动必须运行 `npm.cmd run test:e2e`；该命令必须以有头模式打开真实浏览器，无法运行时说明具体原因。
- 根目录不保留临时 `.cmd`、`rm.py`、`howtotest.md`、散落 Nginx 文档或重复 README。

## 开源协议

本项目代码选择 MIT License。

第三方依赖遵循各自许可证，包括 React、Vite、React Flow、Blockly、Express、JWT、bcryptjs、nodemailer、JSZip、marked、Playwright、Vitest、archiver、node-fetch 等。
