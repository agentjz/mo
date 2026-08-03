import {
  parseStoryDocument,
  type Choice,
  type Scene,
  type StoryDocument,
} from '../../domain/story/document.ts';
import {
  createRuleRuntime,
  type RuntimeFunction,
  type RuntimeValue,
  type RuntimeVariableAccess,
  type RuntimeVariableOwner,
} from '../../domain/rules/RuleEngine.ts';
import { createPlayerStateMachine, type PlayerStateMachine } from './playerStateMachine.ts';

export type PlayerStatus = 'idle' | 'running' | 'ended';

export interface PlayerVisit {
  sceneId: string;
  count: number;
  firstIndex: number;
  lastIndex: number;
}

export interface PlayerSnapshot {
  status: PlayerStatus;
  scene: Scene | null;
  availableChoices: Choice[];
  history: string[];
  visits: PlayerVisit[];
  variables: Record<string, RuntimeValue>;
}

export interface PlayerSave {
  version: 1;
  sceneId: string;
  status: PlayerStatus;
  history: string[];
  visits: PlayerVisit[];
  variables: Record<string, RuntimeValue>;
}

export type PlayerCommand =
  | { type: 'start'; sceneId?: string }
  | { type: 'choose'; choiceId: string }
  | { type: 'jump'; sceneId: string }
  | { type: 'hotspot'; hotspotId: string }
  | { type: 'back' }
  | { type: 'restart' };

export class PlayerKernel {
  private readonly machine: PlayerStateMachine;

  constructor(input: StoryDocument, runtime?: RuntimeVariableOwner) {
    const document = parseStoryDocument(input);
    this.machine = createPlayerStateMachine(document, runtime, createRuleRuntime);
  }

  dispatch(command: PlayerCommand): PlayerSnapshot {
    return this.machine.dispatch(command);
  }

  registerRuntimeFunction(id: string, fn: RuntimeFunction): () => void {
    return this.machine.registerRuntimeFunction(id, fn);
  }

  runtimeVariables(): RuntimeVariableAccess {
    return this.machine.runtimeVariables();
  }

  snapshot(): PlayerSnapshot {
    return this.machine.snapshot();
  }

  save(): PlayerSave {
    return this.machine.save();
  }

  load(save: PlayerSave): PlayerSnapshot {
    return this.machine.load(save);
  }
}
