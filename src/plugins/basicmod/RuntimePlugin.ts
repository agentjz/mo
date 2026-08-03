import type { VariableDefinition } from '../../domain/story/document.ts';
import {
  RuntimeVariableStore,
  type RuntimeValue,
} from '../../domain/rules/RuleEngine.ts';
import { PluginBase } from '../../plugin/PluginBase.ts';
import type { PluginContributions } from '../../plugin/contributions.ts';
import type { PluginMetadata } from '../../plugin/types.ts';

export class RuntimePlugin extends PluginBase {
  metadata: PluginMetadata = {
    id: 'basicmod.runtime', name: '基础运行时', version: '3.0.0', author: '墨水官方',
    description: '提供变量存储和模板替换功能', icon: 'RT', category: 'basicmod',
    tags: ['基础模组', 'runtime', 'variables'],
  };

  private readonly store = new RuntimeVariableStore();

  getContributions(): PluginContributions {
    return {
      runtime: {
        variables: {
          initialize: (definitions, initial) => this.initialize(definitions, initial),
          get: id => this.get(id),
          set: (id, value) => this.set(id, value),
          snapshot: () => this.snapshot(),
          call: id => { throw new Error(`运行函数不存在: ${id}`); },
        },
      },
    };
  }

  initialize(definitions: VariableDefinition[], initial?: Record<string, RuntimeValue>): void {
    this.store.initialize(definitions, initial);
  }

  get(id: string): RuntimeValue {
    return this.store.get(id);
  }

  set(id: string, value: RuntimeValue): void {
    this.store.set(id, value);
    this.emit('variable:change', { id, value });
  }

  snapshot(): Record<string, RuntimeValue> {
    return this.store.snapshot();
  }
}
