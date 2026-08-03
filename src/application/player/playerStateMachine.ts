import type { StoryDocument, VariableDefinition } from '../../domain/story/document.ts';
import type {
  RuleRuntime,
  RuntimeFunction,
  RuntimeValue,
  RuntimeVariableAccess,
  RuntimeVariableOwner,
} from '../../domain/rules/RuleEngine.ts';
import type {
  PlayerCommand,
  PlayerSave,
  PlayerSnapshot,
  PlayerStatus,
  PlayerVisit,
} from './PlayerKernel.ts';

export interface PlayerStateMachine {
  dispatch(command: PlayerCommand): PlayerSnapshot;
  snapshot(): PlayerSnapshot;
  save(): PlayerSave;
  load(save: PlayerSave): PlayerSnapshot;
  registerRuntimeFunction(id: string, fn: RuntimeFunction): () => void;
  runtimeVariables(): RuntimeVariableAccess;
}

export type RuleRuntimeFactory = (
  rules: StoryDocument['rules'],
  variables: RuntimeVariableAccess,
) => RuleRuntime;

export function createPlayerStateMachine(
  input: StoryDocument,
  runtimeOwner: RuntimeVariableOwner | undefined,
  createRules: RuleRuntimeFactory,
): PlayerStateMachine {
  const document = structuredClone(input);
  const scenes = new Map(document.scenes.map(scene => [scene.id, scene]));
  const runtimeFunctions = new Map<string, RuntimeFunction>();
  const internalDefinitions = new Map<string, VariableDefinition>();
  const internalValues = new Map<string, RuntimeValue>();
  const assertValue = (definition: VariableDefinition, value: RuntimeValue) => {
    if (definition.type === 'number' && typeof value !== 'number') throw new Error(`变量 ${definition.id} 需要数字值`);
    if (definition.type === 'string' && typeof value !== 'string') throw new Error(`变量 ${definition.id} 需要文本值`);
    if (definition.type === 'boolean' && typeof value !== 'boolean') throw new Error(`变量 ${definition.id} 需要真假值`);
  };
  const internalOwner: RuntimeVariableOwner = {
    initialize(definitions, initial) {
      internalDefinitions.clear();
      internalValues.clear();
      for (const definition of definitions) {
        if (internalDefinitions.has(definition.id)) throw new Error(`变量 ID 重复: ${definition.id}`);
        assertValue(definition, definition.defaultValue);
        internalDefinitions.set(definition.id, structuredClone(definition));
        internalValues.set(definition.id, definition.defaultValue);
      }
      for (const [id, value] of Object.entries(initial ?? {})) this.set(id, value);
    },
    get(id) {
      if (!internalValues.has(id)) throw new Error(`变量不存在: ${id}`);
      return internalValues.get(id)!;
    },
    set(id, value) {
      const definition = internalDefinitions.get(id);
      if (!definition) throw new Error(`变量不存在: ${id}`);
      assertValue(definition, value);
      internalValues.set(id, value);
    },
    snapshot: () => Object.fromEntries(internalValues),
    call(id, ...args) {
      const fn = runtimeFunctions.get(id);
      if (!fn) throw new Error(`运行函数不存在: ${id}`);
      return fn(...args);
    },
  };
  const variables = runtimeOwner ?? internalOwner;
  let rules = createRules(document.rules, variables);
  let status: PlayerStatus = 'idle';
  let sceneId: string | null = null;
  let history: string[] = [];
  let visits = new Map<string, PlayerVisit>();
  let visitSequence = 0;

  const resetRuntime = (initial?: Record<string, RuntimeValue>) => {
    variables.initialize(document.variables, initial);
    rules = createRules(document.rules, variables);
    for (const [id, fn] of runtimeFunctions) rules.registerFunction(id, fn);
  };
  const currentScene = () => sceneId ? scenes.get(sceneId) ?? null : null;
  const requireCurrentScene = () => {
    const scene = currentScene();
    if (!scene) throw new Error('播放器尚未开始');
    return scene;
  };
  const snapshot = (): PlayerSnapshot => {
    const scene = currentScene();
    return {
      status,
      scene: scene ? structuredClone(scene) : null,
      availableChoices: scene
        ? scene.choices.filter(choice => rules.evaluateChoice(scene.id, choice.id)).map(choice => structuredClone(choice))
        : [],
      history: [...history],
      visits: [...visits.values()].map(visit => ({ ...visit })),
      variables: variables.snapshot(),
    };
  };
  const enter = (nextSceneId: string, appendHistory: boolean): PlayerSnapshot => {
    const scene = scenes.get(nextSceneId);
    if (!scene) throw new Error(`目标场景不存在: ${nextSceneId}`);
    sceneId = nextSceneId;
    if (appendHistory) history.push(nextSceneId);
    const existing = visits.get(nextSceneId);
    if (existing) {
      existing.count += 1;
      existing.lastIndex = visitSequence;
    } else {
      visits.set(nextSceneId, { sceneId: nextSceneId, count: 1, firstIndex: visitSequence, lastIndex: visitSequence });
    }
    visitSequence += 1;
    rules.run('scene-enter', { sceneId: nextSceneId });
    status = scene.type === 'ending' ? 'ended' : 'running';
    return snapshot();
  };
  const start = (nextSceneId = document.entrySceneId): PlayerSnapshot => {
    resetRuntime();
    history = [];
    visits.clear();
    visitSequence = 0;
    status = 'running';
    sceneId = null;
    return enter(nextSceneId, true);
  };
  const moveTo = (nextSceneId: string): PlayerSnapshot => {
    if (!sceneId) return start(nextSceneId);
    const scene = requireCurrentScene();
    rules.run('scene-leave', { sceneId: scene.id });
    return enter(nextSceneId, true);
  };
  const choose = (choiceId: string): PlayerSnapshot => {
    const scene = requireCurrentScene();
    const choice = scene.choices.find(candidate => candidate.id === choiceId);
    if (!choice) throw new Error(`选项不存在: ${choiceId}`);
    if (!rules.evaluateChoice(scene.id, choiceId)) throw new Error(`选项当前不可用: ${choiceId}`);
    rules.run('choice-select', { sceneId: scene.id, choiceId });
    return moveTo(choice.targetSceneId);
  };
  const dispatch = (command: PlayerCommand): PlayerSnapshot => {
    switch (command.type) {
      case 'start': return start(command.sceneId);
      case 'choose': return choose(command.choiceId);
      case 'jump': return moveTo(command.sceneId);
      case 'hotspot': {
        const scene = requireCurrentScene();
        const hotspot = (scene.media.hotspots ?? []).find(candidate => candidate.id === command.hotspotId);
        if (!hotspot) throw new Error(`热区不存在: ${command.hotspotId}`);
        return moveTo(hotspot.targetSceneId);
      }
      case 'back': {
        if (history.length <= 1) return snapshot();
        history.pop();
        const previous = history[history.length - 1];
        sceneId = previous;
        status = scenes.get(previous)?.type === 'ending' ? 'ended' : 'running';
        return snapshot();
      }
      case 'restart': return start();
    }
  };

  resetRuntime();
  return {
    dispatch,
    snapshot,
    save() {
      if (!sceneId) throw new Error('播放器尚未开始');
      return { version: 1, sceneId, status, history: [...history], visits: [...visits.values()].map(visit => ({ ...visit })), variables: variables.snapshot() };
    },
    load(save) {
      if (save.version !== 1) throw new Error('存档版本不受支持');
      if (!scenes.has(save.sceneId)) throw new Error(`存档目标场景不存在: ${save.sceneId}`);
      for (const id of save.history) if (!scenes.has(id)) throw new Error(`存档历史场景不存在: ${id}`);
      resetRuntime(save.variables);
      sceneId = save.sceneId;
      status = save.status;
      history = [...save.history];
      visits = new Map(save.visits.map(visit => [visit.sceneId, { ...visit }]));
      visitSequence = save.visits.reduce((max, visit) => Math.max(max, visit.lastIndex), -1) + 1;
      return snapshot();
    },
    registerRuntimeFunction(id, fn) {
      if (runtimeFunctions.has(id)) throw new Error(`运行函数重复: ${id}`);
      runtimeFunctions.set(id, fn);
      const unregister = rules.registerFunction(id, fn);
      return () => { unregister(); runtimeFunctions.delete(id); };
    },
    runtimeVariables: () => ({
      get: id => variables.get(id),
      set: (id, value) => variables.set(id, value),
      snapshot: () => variables.snapshot(),
      call: (id, ...args) => {
        const fn = runtimeFunctions.get(id);
        if (!fn) throw new Error(`运行函数不存在: ${id}`);
        return fn(...args);
      },
    }),
  };
}
