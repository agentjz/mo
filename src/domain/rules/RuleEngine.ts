import type {
  RuleAction,
  RuleCondition,
  RuleDocument,
  RuleTrigger,
  VariableDefinition,
} from '../story/document.ts';

export type RuntimeValue = string | number | boolean;
export type RuntimeFunction = (...args: RuntimeValue[]) => RuntimeValue | void;

export interface RuntimeVariableAccess {
  get(id: string): RuntimeValue;
  set(id: string, value: RuntimeValue): void;
  snapshot(): Record<string, RuntimeValue>;
  call(id: string, ...args: RuntimeValue[]): RuntimeValue | void;
}

export interface RuntimeVariableOwner extends RuntimeVariableAccess {
  initialize(definitions: VariableDefinition[], initial?: Record<string, RuntimeValue>): void;
}

function assertVariableValue(definition: VariableDefinition, value: RuntimeValue): void {
  if (definition.type === 'number' && typeof value !== 'number') throw new Error(`变量 ${definition.id} 需要数字值`);
  if (definition.type === 'string' && typeof value !== 'string') throw new Error(`变量 ${definition.id} 需要文本值`);
  if (definition.type === 'boolean' && typeof value !== 'boolean') throw new Error(`变量 ${definition.id} 需要真假值`);
}

export class RuntimeVariableStore implements RuntimeVariableOwner {
  private readonly definitions = new Map<string, VariableDefinition>();
  private readonly values = new Map<string, RuntimeValue>();

  constructor(definitions: VariableDefinition[] = [], initial?: Record<string, RuntimeValue>) {
    this.initialize(definitions, initial);
  }

  initialize(definitions: VariableDefinition[], initial?: Record<string, RuntimeValue>): void {
    this.definitions.clear();
    this.values.clear();
    for (const definition of definitions) {
      if (this.definitions.has(definition.id)) throw new Error(`变量 ID 重复: ${definition.id}`);
      assertVariableValue(definition, definition.defaultValue);
      this.definitions.set(definition.id, structuredClone(definition));
      this.values.set(definition.id, definition.defaultValue);
    }
    for (const [id, value] of Object.entries(initial ?? {})) this.set(id, value);
  }

  get(id: string): RuntimeValue {
    if (!this.values.has(id)) throw new Error(`变量不存在: ${id}`);
    return this.values.get(id)!;
  }

  set(id: string, value: RuntimeValue): void {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`变量不存在: ${id}`);
    assertVariableValue(definition, value);
    this.values.set(id, value);
  }

  changeNumber(id: string, amount: number): void {
    const current = this.get(id);
    if (typeof current !== 'number') throw new Error(`变量 ${id} 不是数字`);
    this.set(id, current + amount);
  }

  snapshot(): Record<string, RuntimeValue> {
    return Object.fromEntries(this.values);
  }

  call(id: string): RuntimeValue | void {
    throw new Error(`运行函数不存在: ${id}`);
  }
}

export interface RuleContext {
  sceneId: string;
  choiceId?: string;
}

export interface RuleRuntime {
  registerFunction(id: string, fn: RuntimeFunction): () => void;
  run(trigger: RuleTrigger, context: RuleContext): void;
  evaluateChoice(sceneId: string, choiceId: string): boolean;
}

export function createRuleRuntime(rules: RuleDocument[], variables: RuntimeVariableAccess): RuleRuntime {
  const functions = new Map<string, RuntimeFunction>();
  const matching = (trigger: RuleTrigger, context: RuleContext) => rules.filter(rule => (
    rule.trigger === trigger
    && rule.scope.sceneId === context.sceneId
    && (rule.scope.choiceId === undefined || rule.scope.choiceId === context.choiceId)
  ));
  const evaluate = (condition: RuleCondition | undefined): boolean => {
    if (!condition) return true;
    if (condition.type === 'function') {
      const fn = functions.get(condition.functionId);
      if (!fn) throw new Error(`规则函数不存在: ${condition.functionId}`);
      return Boolean(fn(...(condition.arguments ?? [])));
    }
    const actual = variables.get(condition.variableId);
    switch (condition.operator) {
      case 'equals': return actual === condition.value;
      case 'not-equals': return actual !== condition.value;
      case 'greater-than': return typeof actual === 'number' && typeof condition.value === 'number' && actual > condition.value;
      case 'less-than': return typeof actual === 'number' && typeof condition.value === 'number' && actual < condition.value;
      case 'greater-or-equal': return typeof actual === 'number' && typeof condition.value === 'number' && actual >= condition.value;
      case 'less-or-equal': return typeof actual === 'number' && typeof condition.value === 'number' && actual <= condition.value;
      case 'truthy': return Boolean(actual);
      case 'falsy': return !actual;
    }
  };
  const execute = (action: RuleAction): void => {
    switch (action.type) {
      case 'set-variable': variables.set(action.variableId, action.value); return;
      case 'change-number': {
        const current = variables.get(action.variableId);
        if (typeof current !== 'number') throw new Error(`变量 ${action.variableId} 不是数字`);
        variables.set(action.variableId, current + action.amount);
        return;
      }
      case 'call-function': {
        const fn = functions.get(action.functionId);
        if (!fn) throw new Error(`规则函数不存在: ${action.functionId}`);
        fn(...(action.arguments ?? []));
      }
    }
  };
  return {
    registerFunction(id, fn) {
      if (functions.has(id)) throw new Error(`规则函数重复: ${id}`);
      functions.set(id, fn);
      return () => functions.delete(id);
    },
    run(trigger, context) {
      for (const rule of matching(trigger, context)) {
        if (!evaluate(rule.condition)) continue;
        for (const action of rule.actions) execute(action);
      }
    },
    evaluateChoice(sceneId, choiceId) {
      return matching('choice-visible', { sceneId, choiceId }).every(rule => evaluate(rule.condition));
    },
  };
}

export class RuleEngine {
  private readonly runtime: RuleRuntime;

  constructor(
    rules: RuleDocument[],
    variables: RuntimeVariableAccess,
  ) {
    this.runtime = createRuleRuntime(rules, variables);
  }

  registerFunction(id: string, fn: RuntimeFunction): () => void {
    return this.runtime.registerFunction(id, fn);
  }

  run(trigger: RuleTrigger, context: RuleContext): void {
    this.runtime.run(trigger, context);
  }

  evaluateChoice(sceneId: string, choiceId: string): boolean {
    return this.runtime.evaluateChoice(sceneId, choiceId);
  }
}
