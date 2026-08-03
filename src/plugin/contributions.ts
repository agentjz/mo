import type { StoryAnalysis } from '../domain/story/analysis.ts';
import type { StoryDocument, VariableDefinition } from '../domain/story/document.ts';
import type { StoryEditorState } from '../domain/story/editorState.ts';
import type { ValidationResult } from '../domain/story/validation.ts';
import type { PlayerTemplateEntry } from '../domain/templates/contracts.ts';
import type { RuntimeVariableAccess, RuntimeVariableOwner, RuntimeValue } from '../domain/rules/RuleEngine.ts';

export interface ValidatorContribution {
  validate(document: StoryDocument): ValidationResult;
}

export interface AnalyzerContribution {
  analyze(document: StoryDocument): StoryAnalysis;
}

export interface LayoutContribution {
  layout(document: StoryDocument, state: StoryEditorState, analysis: StoryAnalysis): StoryEditorState;
}

export interface EditorThemeContribution {
  id: string;
  definition(): unknown;
}

export type RuntimeFunction = (...args: unknown[]) => unknown;

export type RuntimeContribution = RuntimeVariableOwner;

export interface RulePackContribution {
  variables: VariableDefinition[];
  functions: Record<string, (runtime: RuntimeVariableAccess, ...args: RuntimeValue[]) => RuntimeValue | void>;
  blockly: { blocks: unknown[]; generators: Record<string, unknown>; toolbox: unknown[] };
  docs: Record<string, unknown>;
}

export interface ContentRenderInput {
  html: string;
  text: string;
  sceneId: string;
  choices: Array<{ id: string; text: string }>;
}

export interface ContentRendererContribution {
  order: number;
  render(input: ContentRenderInput): ContentRenderInput;
}

export interface EditorToolContribution {
  id: string;
  label: string;
  run(input: unknown): unknown;
}

export interface PluginContributionMap {
  validator: ValidatorContribution;
  analyzer: AnalyzerContribution;
  layout: LayoutContribution;
  editorTheme: EditorThemeContribution;
  runtime: RuntimeContribution;
  rulePack: RulePackContribution;
  playerTemplate: PlayerTemplateEntry;
  contentRenderer: ContentRendererContribution;
  editorTool: EditorToolContribution;
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
    for (const [kind, values] of Object.entries(contributions) as Array<[keyof PluginContributionMap, Record<string, unknown>]>) {
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
      for (const [key, registered] of slot) if (registered.ownerPluginId === ownerPluginId) slot.delete(key);
    }
  }

  get<Kind extends keyof PluginContributionMap>(kind: Kind, key: string): PluginContributionMap[Kind] | undefined {
    return this.slots.get(kind)?.get(key)?.value as PluginContributionMap[Kind] | undefined;
  }

  list<Kind extends keyof PluginContributionMap>(kind: Kind): Array<{ key: string; ownerPluginId: string; value: PluginContributionMap[Kind] }> {
    return [...(this.slots.get(kind)?.entries() ?? [])].map(([key, registered]) => ({
      key,
      ownerPluginId: registered.ownerPluginId,
      value: registered.value as PluginContributionMap[Kind],
    }));
  }
}
