# 墨水 - 互动叙事游戏编辑器

> 为空间叙事游戏而生

**在线使用：** [https://luckymaomi.github.io/mo/](https://luckymaomi.github.io/mo/)

[![React](https://img.shields.io/badge/React-18.2.0-00D8FF?style=plastic&logo=react&logoColor=00D8FF&labelColor=282c34)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?style=plastic&logo=typescript&logoColor=white&labelColor=0F1419)](https://www.typescriptlang.org/)
[![React Flow](https://img.shields.io/badge/React_Flow-11.10.4-FF6B6B?style=plastic&logoColor=white&labelColor=2D2D2D)](https://reactflow.dev/)
[![Blockly](https://img.shields.io/badge/Blockly-13.2.0-4AB8FF?style=plastic&logoColor=white&labelColor=1A1A1A)](https://developers.google.com/blockly)
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

**十二套播放器模板** - 保留视觉小说与聊天体验，并提供书页、剧场、档案、手账等不同叙事结构。

**单文件导出** - 生成独立 HTML 文件，无需服务器，双击即可游玩。

**整库备份** - 把当前浏览器中的全部作品、图片和设置导出为一个 ZIP，也可以用 ZIP 完整覆盖恢复工作区。

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
4. 点击播放，体验你的第一个分支故事。

故事就这样开始了。

## 本地使用

```powershell
npm.cmd install
npm.cmd run start
```

## 文档

- `spec.md`：当前产品事实、架构边界和验收标准。
- `AGENTS.md`：协作规则和生产级交付标准。
- `plan.md`：当前任务执行合同。
- `SECURITY.md`：安全和敏感数据边界。
- `CONTRIBUTING.md`：贡献流程。

## 许可证

MIT License。
