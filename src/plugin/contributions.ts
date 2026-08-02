import type { StoryAnalysis } from '../utils/engine/storyAnalyzer.ts';
import type { StoryEdge, StoryNode, ValidationResult } from '../types/index.ts';

export interface ValidatorContribution {
  validate(nodes: StoryNode[], edges: StoryEdge[]): ValidationResult;
}

export interface AnalyzerContribution {
  analyze(nodes: StoryNode[], edges: StoryEdge[]): StoryAnalysis;
}

export interface LayoutContribution {
  layout(nodes: StoryNode[], edges: StoryEdge[], analysis: StoryAnalysis): StoryNode[];
}

export interface EditorThemeContribution {
  id: string;
  definition(): unknown;
}

export interface PlayerStyleContribution {
  compatibleWith: 'visual-novel';
  css(): string;
}

export type RuntimeFunction = (...args: never[]) => unknown;

export interface RuntimeContribution {
  get(path: string): unknown;
  set(path: string, value: unknown): void;
  registerFunction(name: string, fn: RuntimeFunction): void;
  variables(): Record<string, unknown>;
}

export interface ChoiceEmbeddingContribution {
  getEmbeddedChoiceIds(nodeId: string): string[];
}

export interface PluginContributionMap {
  validator: ValidatorContribution;
  analyzer: AnalyzerContribution;
  layout: LayoutContribution;
  editorTheme: EditorThemeContribution;
  playerStyle: PlayerStyleContribution;
  runtime: RuntimeContribution;
  choiceEmbedding: ChoiceEmbeddingContribution;
}

export type PluginContributions = Partial<{
  [Kind in keyof PluginContributionMap]: Record<string, PluginContributionMap[Kind]>;
}>;

interface RegisteredContribution<T> {
  ownerPluginId: string;
  value: T;
}

export class ContributionRegistry {
  private readonly slots = new Map<keyof PluginContributionMap, Map<string, RegisteredContribution<unknown>>>();

  register(ownerPluginId: string, contributions: PluginContributions | undefined): void {
    if (!contributions) return;
    const pending: Array<{ kind: keyof PluginContributionMap; key: string; value: unknown }> = [];
    for (const [kind, values] of Object.entries(contributions) as Array<[
      keyof PluginContributionMap,
      Record<string, unknown>,
    ]>) {
      for (const [key, value] of Object.entries(values)) {
        if (this.slots.get(kind)?.has(key)) throw new Error(`Contribution ${kind}:${key} is already registered`);
        pending.push({ kind, key, value });
      }
    }
    for (const item of pending) {
      const slot = this.slots.get(item.kind) ?? new Map<string, RegisteredContribution<unknown>>();
      slot.set(item.key, { ownerPluginId, value: item.value });
      this.slots.set(item.kind, slot);
    }
  }

  unregisterOwner(ownerPluginId: string): void {
    for (const slot of this.slots.values()) {
      for (const [key, registered] of slot) {
        if (registered.ownerPluginId === ownerPluginId) slot.delete(key);
      }
    }
  }

  get<Kind extends keyof PluginContributionMap>(kind: Kind, key: string): PluginContributionMap[Kind] | undefined {
    return this.slots.get(kind)?.get(key)?.value as PluginContributionMap[Kind] | undefined;
  }

  list<Kind extends keyof PluginContributionMap>(kind: Kind): Array<{
    key: string;
    ownerPluginId: string;
    value: PluginContributionMap[Kind];
  }> {
    return [...(this.slots.get(kind)?.entries() ?? [])].map(([key, registered]) => ({
      key,
      ownerPluginId: registered.ownerPluginId,
      value: registered.value as PluginContributionMap[Kind],
    }));
  }
}
