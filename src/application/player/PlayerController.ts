import type { StoryDocument } from '../../domain/story/document.ts';
import { PlayerKernel, type PlayerSnapshot } from './PlayerKernel.ts';
import { LocalPlayerSaveAdapter, type PlayerSaveAdapter, type PlayerSaveSlot } from './PlayerSaveAdapter.ts';
import { renderPlayerContent } from './contentRenderer.ts';
import type { RulePackContribution } from '../../plugin/contributions.ts';
import type { RuntimeVariableOwner } from '../../domain/rules/RuleEngine.ts';

export interface PlayerDisplayVariable {
  id: string;
  label: string;
  value: string | number | boolean;
  type: 'number' | 'string' | 'boolean';
}

export interface PlayerVisitedScene {
  sceneId: string;
  sceneName: string;
  visitCount: number;
}

export interface PlayerControllerCallbacks {
  onSnapshot(snapshot: PlayerSnapshot, renderedContent: string): void | Promise<void>;
}

export class PlayerController {
  private readonly kernel: PlayerKernel;
  private readonly saves: PlayerSaveAdapter;

  constructor(
    readonly document: StoryDocument,
    private readonly callbacks: PlayerControllerCallbacks,
    saves: PlayerSaveAdapter = new LocalPlayerSaveAdapter(`mo_save_${document.id}_`),
    rulePacks: RulePackContribution[] = [],
    runtime?: RuntimeVariableOwner,
  ) {
    this.kernel = new PlayerKernel(document, runtime);
    this.saves = saves;
    for (const pack of rulePacks) {
      for (const [id, fn] of Object.entries(pack.functions)) {
        this.kernel.registerRuntimeFunction(id, (...args) => fn(this.kernel.runtimeVariables(), ...args));
      }
    }
  }

  start(sceneId?: string): PlayerSnapshot {
    return this.publish(this.kernel.dispatch({ type: 'start', sceneId }));
  }

  choose(choiceId: string): PlayerSnapshot {
    return this.publish(this.kernel.dispatch({ type: 'choose', choiceId }));
  }

  jump(sceneId: string): PlayerSnapshot {
    return this.publish(this.kernel.dispatch({ type: 'jump', sceneId }));
  }

  useHotspot(hotspotId: string): PlayerSnapshot {
    return this.publish(this.kernel.dispatch({ type: 'hotspot', hotspotId }));
  }

  restart(): PlayerSnapshot {
    return this.publish(this.kernel.dispatch({ type: 'restart' }));
  }

  back(): PlayerSnapshot {
    return this.publish(this.kernel.dispatch({ type: 'back' }));
  }

  saveSlot(slotId: number): boolean {
    try {
      const save = this.kernel.save();
      const scene = this.document.scenes.find(candidate => candidate.id === save.sceneId);
      this.saves.write(slotId, save, scene?.content.speaker || scene?.tags[0] || `场景 ${save.sceneId}`);
      return true;
    } catch {
      return false;
    }
  }

  loadSlot(slotId: number): PlayerSnapshot | null {
    const save = this.saves.read(slotId);
    return save ? this.publish(this.kernel.load(save)) : null;
  }

  listSaveSlots(): PlayerSaveSlot[] {
    return this.saves.list();
  }

  listVisitedScenes(): PlayerVisitedScene[] {
    return this.kernel.snapshot().visits.map(visit => {
      const scene = this.document.scenes.find(candidate => candidate.id === visit.sceneId);
      return {
        sceneId: visit.sceneId,
        sceneName: scene?.tags[0] || scene?.content.speaker || `场景 ${visit.sceneId}`,
        visitCount: visit.count,
      };
    });
  }

  listDisplayVariables(): PlayerDisplayVariable[] {
    const snapshot = this.kernel.snapshot();
    return this.document.variables
      .filter(variable => variable.displayInPlayer)
      .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
      .map(variable => ({ ...variable, value: snapshot.variables[variable.id] }));
  }

  snapshot(): PlayerSnapshot {
    return this.kernel.snapshot();
  }

  private publish(snapshot: PlayerSnapshot): PlayerSnapshot {
    const text = this.interpolate(snapshot.scene?.content.text ?? '', snapshot.variables);
    const rendered = renderPlayerContent(text, snapshot.availableChoices);
    void this.callbacks.onSnapshot(snapshot, rendered);
    return snapshot;
  }

  private interpolate(text: string, variables: Record<string, string | number | boolean>): string {
    return text.replace(/\{\{\$vars\.([\w.-]+)\}\}/g, (_match, id: string) => String(variables[id] ?? ''));
  }
}
