/**
 * PluginSystem 单元测试
 * 测试插件系统的注册、启用、禁用、贡献和失败回滚
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { PluginSystem } from '../../src/plugin/PluginSystem';
import type { Plugin, PluginContext } from '../../src/plugin/types';

describe('PluginSystem - 基础功能', () => {
  let pluginSystem: PluginSystem;
  
  beforeEach(() => {
    pluginSystem = new PluginSystem();
  });

  test('能创建插件系统实例', () => {
    expect(pluginSystem).toBeDefined();
  });

  test('register() 应该成功注册插件', async () => {
    const testPlugin: Plugin = {
      metadata: {
        id: 'test.plugin',
        name: '测试插件',
        version: '1.0.0',
        author: '测试',
        description: '测试用插件',
        category: 'tool'
      },
      install: async (context: PluginContext) => {
        // 安装逻辑
      }
    };
    
    await pluginSystem.register(testPlugin);
    
    const registered = pluginSystem.getPlugin('test.plugin');
    expect(registered).toBeDefined();
    expect(registered!.enabled).toBe(true);
  });

  test('register() 重复注册应该抛出错误', async () => {
    const testPlugin: Plugin = {
      metadata: {
        id: 'test.plugin',
        name: '测试插件',
        version: '1.0.0',
        author: '测试',
        description: '测试',
        category: 'tool'
      },
      install: async () => {}
    };
    
    await pluginSystem.register(testPlugin);
    
    await expect(pluginSystem.register(testPlugin)).rejects.toThrow('already registered');
  });

  test('hasPlugin() 应该正确判断插件是否已注册', async () => {
    const testPlugin: Plugin = {
      metadata: {
        id: 'test.plugin',
        name: '测试插件',
        version: '1.0.0',
        author: '测试',
        description: '测试',
        category: 'tool'
      },
      install: async () => {}
    };
    
    expect(pluginSystem.hasPlugin('test.plugin')).toBe(false);
    
    await pluginSystem.register(testPlugin);
    
    expect(pluginSystem.hasPlugin('test.plugin')).toBe(true);
  });

  test('isPluginEnabled() 应该正确判断插件是否启用', async () => {
    const testPlugin: Plugin = {
      metadata: {
        id: 'test.plugin',
        name: '测试插件',
        version: '1.0.0',
        author: '测试',
        description: '测试',
        category: 'tool'
      },
      install: async () => {}
    };
    
    await pluginSystem.register(testPlugin);
    
    expect(pluginSystem.isPluginEnabled('test.plugin')).toBe(true);
  });
});

describe('PluginSystem - 依赖管理', () => {
  let pluginSystem: PluginSystem;
  
  beforeEach(() => {
    pluginSystem = new PluginSystem();
  });

  test('register() 缺少依赖时应该抛出错误', async () => {
    const pluginA: Plugin = {
      metadata: {
        id: 'plugin.a',
        name: '插件A',
        version: '1.0.0',
        author: '测试',
        description: '需要插件B',
        category: 'tool',
        requires: ['plugin.b']
      },
      install: async () => {}
    };
    
    await expect(pluginSystem.register(pluginA)).rejects.toThrow('requires plugin.b');
  });

  test('register() 有依赖时应该成功注册', async () => {
    const pluginB: Plugin = {
      metadata: {
        id: 'plugin.b',
        name: '插件B',
        version: '1.0.0',
        author: '测试',
        description: '基础插件',
        category: 'tool'
      },
      install: async () => {}
    };
    
    const pluginA: Plugin = {
      metadata: {
        id: 'plugin.a',
        name: '插件A',
        version: '1.0.0',
        author: '测试',
        description: '需要插件B',
        category: 'tool',
        requires: ['plugin.b']
      },
      install: async () => {}
    };
    
    await pluginSystem.register(pluginB);
    await pluginSystem.register(pluginA);
    
    expect(pluginSystem.hasPlugin('plugin.a')).toBe(true);
  });
});

describe('PluginSystem - 冲突管理', () => {
  let pluginSystem: PluginSystem;
  
  beforeEach(() => {
    pluginSystem = new PluginSystem();
  });

  test('register() 有冲突的已启用插件时应该抛出错误', async () => {
    const pluginB: Plugin = {
      metadata: {
        id: 'plugin.b',
        name: '插件B',
        version: '1.0.0',
        author: '测试',
        description: '基础插件',
        category: 'tool'
      },
      install: async () => {}
    };
    
    const pluginA: Plugin = {
      metadata: {
        id: 'plugin.a',
        name: '插件A',
        version: '1.0.0',
        author: '测试',
        description: '与B冲突',
        category: 'tool',
        conflicts: ['plugin.b']
      },
      install: async () => {}
    };
    
    // 先注册并启用插件B
    await pluginSystem.register(pluginB);
    expect(pluginSystem.isPluginEnabled('plugin.b')).toBe(true);
    
    // 注册插件A时应该抛出错误（因为B已启用且冲突）
    await expect(pluginSystem.register(pluginA)).rejects.toThrow('conflicts with plugin.b');
  });

  test('enable() 有冲突时应该自动禁用冲突插件', async () => {
    const pluginB: Plugin = {
      metadata: {
        id: 'plugin.b',
        name: '插件B',
        version: '1.0.0',
        author: '测试',
        description: '基础插件',
        category: 'tool'
      },
      install: async () => {}
    };
    
    const pluginA: Plugin = {
      metadata: {
        id: 'plugin.a',
        name: '插件A',
        version: '1.0.0',
        author: '测试',
        description: '与B冲突',
        category: 'tool',
        conflicts: ['plugin.b']
      },
      install: async () => {},
      config: { enabled: false }  // 先注册为禁用状态
    };
    
    // 先注册并启用插件B
    await pluginSystem.register(pluginB);
    expect(pluginSystem.isPluginEnabled('plugin.b')).toBe(true);
    
    // 注册插件A（禁用状态）
    await pluginSystem.register(pluginA);
    expect(pluginSystem.isPluginEnabled('plugin.a')).toBe(false);
    
    // 启用插件A，应该自动禁用插件B
    await pluginSystem.enable('plugin.a');
    
    expect(pluginSystem.isPluginEnabled('plugin.a')).toBe(true);
    expect(pluginSystem.isPluginEnabled('plugin.b')).toBe(false);
  });
});

describe('PluginSystem - 互斥规则', () => {
  let pluginSystem: PluginSystem;
  
  beforeEach(() => {
    pluginSystem = new PluginSystem();
  });

  test('同category的theme插件应该互斥', async () => {
    const themeA: Plugin = {
      metadata: {
        id: 'theme.a',
        name: '主题A',
        version: '1.0.0',
        author: '测试',
        description: '主题A',
        category: 'theme'
      },
      install: async () => {}
    };
    
    const themeB: Plugin = {
      metadata: {
        id: 'theme.b',
        name: '主题B',
        version: '1.0.0',
        author: '测试',
        description: '主题B',
        category: 'theme'
      },
      install: async () => {},
      config: { enabled: false }  // 先注册为禁用状态
    };
    
    // 注册主题A（默认启用）
    await pluginSystem.register(themeA);
    expect(pluginSystem.isPluginEnabled('theme.a')).toBe(true);
    
    // 注册主题B（禁用状态）
    await pluginSystem.register(themeB);
    expect(pluginSystem.isPluginEnabled('theme.b')).toBe(false);
    
    // 启用主题B，应该自动禁用主题A（互斥规则）
    await pluginSystem.enable('theme.b');
    
    expect(pluginSystem.isPluginEnabled('theme.b')).toBe(true);
    expect(pluginSystem.isPluginEnabled('theme.a')).toBe(false);
  });
});

describe('PluginSystem - 启用/禁用', () => {
  let pluginSystem: PluginSystem;
  
  beforeEach(() => {
    pluginSystem = new PluginSystem();
  });

  test('disable() 应该禁用插件', async () => {
    const plugin: Plugin = {
      metadata: {
        id: 'test.plugin',
        name: '测试插件',
        version: '1.0.0',
        author: '测试',
        description: '测试',
        category: 'tool'
      },
      install: async () => {}
    };
    
    await pluginSystem.register(plugin);
    expect(pluginSystem.isPluginEnabled('test.plugin')).toBe(true);
    
    await pluginSystem.disable('test.plugin');
    
    expect(pluginSystem.isPluginEnabled('test.plugin')).toBe(false);
  });

  test('enable() 应该启用插件', async () => {
    const plugin: Plugin = {
      metadata: {
        id: 'test.plugin',
        name: '测试插件',
        version: '1.0.0',
        author: '测试',
        description: '测试',
        category: 'tool'
      },
      install: async () => {},
      config: { enabled: false }
    };
    
    await pluginSystem.register(plugin);
    expect(pluginSystem.isPluginEnabled('test.plugin')).toBe(false);
    
    await pluginSystem.enable('test.plugin');
    
    expect(pluginSystem.isPluginEnabled('test.plugin')).toBe(true);
  });

});

describe('PluginSystem - 生命周期隔离', () => {
  test('安装失败后不残留事件和贡献', async () => {
    const pluginSystem = new PluginSystem();
    let eventCalls = 0;
    const plugin: Plugin = {
      metadata: {
        id: 'plugin.broken',
        name: '故障插件',
        version: '1.0.0',
        author: '测试',
        description: '测试安装回滚',
        category: 'tool',
      },
      install: async context => {
        context.events.on('test:event', () => { eventCalls += 1; });
        throw new Error('install failed');
      },
      getContributions: () => ({
        validator: {
          broken: { validate: () => ({ valid: true, errors: [], warnings: [] }) },
        },
      }),
    };

    await expect(pluginSystem.register(plugin)).rejects.toThrow('install failed');
    pluginSystem.getEventAPI().emit('test:event');

    expect(eventCalls).toBe(0);
    expect(pluginSystem.getContribution('validator', 'broken')).toBeUndefined();
    expect(pluginSystem.hasPlugin('plugin.broken')).toBe(false);
  });

  test('存在启用依赖方时禁止禁用依赖项', async () => {
    const pluginSystem = new PluginSystem();
    const dependency: Plugin = {
      metadata: {
        id: 'plugin.dependency', name: '依赖', version: '1.0.0', author: '测试',
        description: '基础依赖', category: 'tool',
      },
      install: async () => {},
    };
    const dependent: Plugin = {
      metadata: {
        id: 'plugin.dependent', name: '依赖方', version: '1.0.0', author: '测试',
        description: '使用基础依赖', category: 'tool', requires: ['plugin.dependency'],
      },
      install: async () => {},
    };
    await pluginSystem.register(dependency);
    await pluginSystem.register(dependent);

    await expect(pluginSystem.disable('plugin.dependency')).rejects.toThrow('required by plugin.dependent');
    expect(pluginSystem.isPluginEnabled('plugin.dependency')).toBe(true);
  });

  test('冲突插件启用失败时恢复原插件', async () => {
    const pluginSystem = new PluginSystem();
    const stable: Plugin = {
      metadata: {
        id: 'theme.stable', name: '稳定主题', version: '1.0.0', author: '测试',
        description: '稳定主题', category: 'theme',
      },
      install: async () => {},
    };
    const broken: Plugin = {
      metadata: {
        id: 'theme.broken', name: '故障主题', version: '1.0.0', author: '测试',
        description: '故障主题', category: 'theme',
      },
      config: { enabled: false },
      install: async () => { throw new Error('activation failed'); },
    };
    await pluginSystem.register(stable);
    await pluginSystem.register(broken);

    await expect(pluginSystem.enable('theme.broken')).rejects.toThrow('activation failed');
    expect(pluginSystem.isPluginEnabled('theme.stable')).toBe(true);
    expect(pluginSystem.getPlugin('theme.broken')?.health).toBe('degraded');
  });

  test('贡献随插件启停注册和移除', async () => {
    const pluginSystem = new PluginSystem();
    const plugin: Plugin = {
      metadata: {
        id: 'plugin.validator', name: '验证贡献', version: '1.0.0', author: '测试',
        description: '验证贡献', category: 'tool',
      },
      install: async () => {},
      getContributions: () => ({
        validator: {
          story: { validate: () => ({ valid: true, errors: [], warnings: [] }) },
        },
      }),
    };
    await pluginSystem.register(plugin);
    expect(pluginSystem.getContribution('validator', 'story')).toBeDefined();

    await pluginSystem.disable('plugin.validator');
    expect(pluginSystem.getContribution('validator', 'story')).toBeUndefined();

    await pluginSystem.enable('plugin.validator');
    expect(pluginSystem.getContribution('validator', 'story')).toBeDefined();
  });

  test('插件状态变更等待异步配置持久化完成', async () => {
    const pluginSystem = new PluginSystem();
    const plugin: Plugin = {
      metadata: {
        id: 'plugin.persisted', name: '持久化插件', version: '1.0.0', author: '测试',
        description: '验证异步配置持久化', category: 'tool',
      },
      config: { enabled: false },
      install: async () => {},
    };
    await pluginSystem.register(plugin);

    let releasePersistence!: () => void;
    const persistenceGate = new Promise<void>(resolve => {
      releasePersistence = resolve;
    });
    let persisted = false;
    pluginSystem.onConfigChange(async () => {
      await persistenceGate;
      persisted = true;
    });

    const enabling = pluginSystem.enable('plugin.persisted');
    await Promise.resolve();
    expect(persisted).toBe(false);

    releasePersistence();
    await enabling;
    expect(persisted).toBe(true);
  });

  test('设置校验或持久化失败时恢复原设置', async () => {
    const pluginSystem = new PluginSystem();
    let settings = { density: 1 };
    const plugin: Plugin = {
      metadata: {
        id: 'plugin.settings', name: '设置插件', version: '1.0.0', author: '测试',
        description: '设置回滚', category: 'tool',
      },
      install: async () => {},
      getSettings: () => ({ ...settings }),
      updateSettings: next => {
        if (typeof next.density !== 'number' || next.density < 1) throw new Error('density invalid');
        settings = { density: next.density };
      },
    };
    await pluginSystem.register(plugin);

    await expect(pluginSystem.updatePluginSettings('plugin.settings', { density: 0 })).rejects.toThrow('density invalid');
    expect(settings).toEqual({ density: 1 });

    pluginSystem.onConfigChange(() => { throw new Error('persistence failed'); });
    await expect(pluginSystem.updatePluginSettings('plugin.settings', { density: 2 })).rejects.toThrow('persistence failed');
    expect(settings).toEqual({ density: 1 });
  });
});

