# 墨水 - 互动叙事游戏编辑器

> 为空间叙事游戏而生

[![React](https://img.shields.io/badge/React-18.2.0-00D8FF?style=plastic&logo=react&logoColor=00D8FF&labelColor=282c34)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?style=plastic&logo=typescript&logoColor=white&labelColor=0F1419)](https://www.typescriptlang.org/)
[![React Flow](https://img.shields.io/badge/React_Flow-11.10.4-FF6B6B?style=plastic&logoColor=white&labelColor=2D2D2D)](https://reactflow.dev/)
[![Blockly](https://img.shields.io/badge/Blockly-11.1.1-4AB8FF?style=plastic&logoColor=white&labelColor=1A1A1A)](https://developers.google.com/blockly)
[![Express](https://img.shields.io/badge/Express-Backend-FFFFFF?style=plastic&logo=express&logoColor=white&labelColor=000000)](https://expressjs.com/)
![License](https://img.shields.io/badge/License-MIT-00C853?style=plastic&logoColor=white&labelColor=1B5E20)

## 这是什么

墨水是一个互动叙事游戏编辑器。

创作一个分支故事，不应该先从代码开始。你可以把场景写成节点，把选择连成路径，把图片变成可以探索的空间，再用变量和条件控制故事走向。故事的结构会像地图一样展开，你能直接看见它如何分岔、回环、抵达结局。

## 核心特性

**节点流编辑** - 拖拽节点，连接选项，看清整个故事结构。

**图片热区** - 在图片上绘制可点击区域，让房间、地图、物件和线索真正参与叙事。

**变量系统** - 记录玩家选择、状态和访问轨迹，让故事拥有记忆。

**Blockly 条件** - 用可视化积木配置条件分支和节点脚本，不需要手写代码。

**插件和模组** - 扩展编辑器、播放器和运行时规则，让作品不止一种玩法。

**视觉小说播放器** - 背景图、角色立绘、对话框和选项组成沉浸式阅读体验。

**单文件导出** - 生成独立 HTML 文件，无需服务器，双击即可游玩。

**Windows 便携版** - 打包成可分发的桌面版压缩包。

## 适合创作什么

如果你想做的游戏核心是探索未知空间、在压力下做选择、用文字和氛围推动情绪，那么墨水就是为这种作品准备的。

- 探索类游戏：Backrooms、SCP、废弃设施、梦境空间。
- 生存选择游戏：避难所、荒野、末日、封闭空间。
- 解谜推理游戏：侦探调查、线索拼图、真相回收。
- 多结局分支叙事：时间线分裂、人物命运、钻石型结构。
- 视觉小说：角色对话、场景切换、状态驱动剧情。

## 第一个故事

1. 创建开始节点，写下“你站在岔路口”。
2. 添加两个选项：“向左”和“向右”。
3. 创建两个新节点，把选项连接过去。
4. 点击预览，体验你的第一个分支故事。

故事就这样开始了。

## 项目结构

```text
frontend/           编辑器、在线播放器和插件系统
backend/            Express API、认证、故事数据和图片持久化
player-standalone/  独立播放器模板构建
packager-win/       Windows 便携版打包工具
```

当前结构保持直接命名：`frontend`、`backend`、`player-standalone`、`packager-win`。这些名字对应真实职责，今天不做无收益的大迁移。

## 快速开始

安装全部依赖：

```powershell
npm.cmd run install:all
```

启动前端：

```powershell
npm.cmd run dev:frontend
```

启动后端：

```powershell
npm.cmd run dev:backend
```

完整验证：

```powershell
npm.cmd run verify
```

Windows 便携版打包：

```powershell
npm.cmd run build:desktop
```

## 文档

- `spec.md`：当前产品事实、架构边界和验收标准。
- `AGENTS.md`：协作规则和生产级交付标准。
- `plan.md`：当前任务执行合同。
- `SECURITY.md`：安全和敏感数据边界。
- `CONTRIBUTING.md`：贡献流程。

## 许可证

MIT License。
