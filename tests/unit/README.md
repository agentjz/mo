# 单元测试说明

## 📁 测试文件

- `CoreEngine.test.ts` - 核心引擎测试（25个测试）
- `PluginSystem.test.ts` - 插件系统测试（16个测试）
- `StoryAnalyzer.test.ts` - 结构分析测试（13个测试）
- `PlayerCore.test.ts` - 播放器核心测试（17个测试）

**总计：71个单元测试**

---

## 🚀 快速运行

```bash
cd frontend

# 交互模式（推荐，自动监听文件变化）
npm run test

# UI模式（可视化界面）
npm run test:ui

# 运行一次
npm run test:run
```

---

## ⚡ 特点

- **超快**：71个测试在1-2秒内完成
- **自动监听**：修改代码自动重新测试
- **可视化**：`npm run test:ui` 打开浏览器界面
- **不需要启动服务**：不需要启动前后端

---

## 📝 测试覆盖

### CoreEngine（核心引擎）
- ✅ 节点跳转逻辑
- ✅ 选择系统
- ✅ 历史管理
- ✅ 回退功能
- ✅ 存档/加载
- ✅ 事件系统

### PluginSystem（插件系统）
- ✅ 插件注册/卸载
- ✅ 依赖管理
- ✅ 冲突检测
- ✅ 互斥规则
- ✅ 钩子系统
- ✅ 启用/禁用

### StoryAnalyzer（结构分析）
- ✅ 深度计算
- ✅ 循环检测
- ✅ SCC分析
- ✅ 可达性分析
- ✅ 关键决策点识别

### PlayerCore（播放器核心）
- ✅ 游戏初始化
- ✅ 选择处理
- ✅ 消息管理
- ✅ 存档系统（3个槽位）
- ✅ 加载/重启

---

## 🎯 为什么需要单元测试？

**对比**：

| 类型 | 单元测试 | E2E测试 |
|------|---------|---------|
| 速度 | ⚡ 1-2秒 | 🐢 2-5分钟 |
| 定位问题 | ✅ 精确到函数 | ⚠️ 不确定哪里出错 |
| 日常使用 | ✅ 每次修改代码 | ⚠️ 发布前 |

**单元测试的好处**：
1. 快速反馈：1-2秒就知道代码是否正确
2. 精确定位：直接告诉你哪个函数有问题
3. 重构信心：修改代码后立即验证没有破坏功能
4. 文档作用：测试代码展示如何使用各个模块

---

## 📚 技术栈

- **测试框架**：Vitest（比Jest快5-10倍）
- **断言库**：Vitest内置（兼容Jest API）
- **模拟功能**：vi.fn()（模拟函数调用）
- **浏览器环境**：jsdom（模拟浏览器API）

---

## 💡 如何添加新测试

```typescript
// 1. 创建测试文件：MyModule.test.ts
import { describe, test, expect } from 'vitest';
import { MyModule } from '../../src/path/MyModule';

describe('MyModule', () => {
  test('should work correctly', () => {
    const result = MyModule.doSomething();
    expect(result).toBe('expected value');
  });
});

// 2. 运行测试
npm run test
```

---

## 🔍 调试技巧

### 1. 只运行一个测试

```typescript
test.only('this test only', () => {
  // 只运行这个测试
});
```

### 2. 跳过某个测试

```typescript
test.skip('skip this test', () => {
  // 跳过这个测试
});
```

### 3. 查看详细输出

```bash
npm run test -- --reporter=verbose
```

### 4. 查看覆盖率

```bash
npm run test -- --coverage
```

---

完整项目验证入口见根目录 `README.md` 和 `package.json`。

