import { z } from 'zod';
import {
  cloneStoryDocument,
  parseStoryDocument,
  type Choice,
  type RuleDocument,
  type Scene,
  type StoryDocument,
  type VariableDefinition,
} from '../../domain/story/document.ts';
import {
  parseStoryEditorState,
  type StoryEditorState,
} from '../../domain/story/editorState.ts';

const positionSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const versionSchema = z.literal(1);

export const authoringCommandSchema = z.discriminatedUnion('type', [
  z.object({ version: versionSchema, type: z.literal('update-meta'), patch: z.object({
    title: z.string().min(1).max(300).optional(),
    author: z.string().max(200).optional(),
    description: z.string().max(20_000).optional(),
  }).strict() }).strict(),
  z.object({ version: versionSchema, type: z.literal('add-scene'), scene: z.unknown(), position: positionSchema }).strict(),
  z.object({ version: versionSchema, type: z.literal('update-scene'), sceneId: z.string().min(1), patch: z.unknown() }).strict(),
  z.object({ version: versionSchema, type: z.literal('delete-scene'), sceneId: z.string().min(1) }).strict(),
  z.object({ version: versionSchema, type: z.literal('add-choice'), sceneId: z.string().min(1), choice: z.unknown() }).strict(),
  z.object({ version: versionSchema, type: z.literal('update-choice'), sceneId: z.string().min(1), choiceId: z.string().min(1), patch: z.unknown() }).strict(),
  z.object({ version: versionSchema, type: z.literal('delete-choice'), sceneId: z.string().min(1), choiceId: z.string().min(1) }).strict(),
  z.object({ version: versionSchema, type: z.literal('set-choice-target'), sceneId: z.string().min(1), choiceId: z.string().min(1), targetSceneId: z.string().min(1) }).strict(),
  z.object({ version: versionSchema, type: z.literal('set-entry-scene'), sceneId: z.string().min(1) }).strict(),
  z.object({ version: versionSchema, type: z.literal('set-variables'), variables: z.array(z.unknown()) }).strict(),
  z.object({ version: versionSchema, type: z.literal('set-rules'), rules: z.array(z.unknown()) }).strict(),
  z.object({ version: versionSchema, type: z.literal('set-presentation'), templateId: z.string().min(1).optional(), settings: z.record(z.string(), z.unknown()).optional(), sceneVariants: z.record(z.string(), z.string()).optional() }).strict(),
  z.object({ version: versionSchema, type: z.literal('replace-document'), document: z.unknown() }).strict(),
  z.object({ version: versionSchema, type: z.literal('replace-editor-state'), editorState: z.unknown() }).strict(),
  z.object({ version: versionSchema, type: z.literal('move-scene'), sceneId: z.string().min(1), position: positionSchema }).strict(),
  z.object({ version: versionSchema, type: z.literal('set-viewport'), viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number().positive() }).strict() }).strict(),
  z.object({ version: versionSchema, type: z.literal('select-editor'), sceneId: z.string().nullable(), choiceId: z.string().nullable() }).strict(),
]);

export type AuthoringCommand = z.infer<typeof authoringCommandSchema>;

export interface AuthoringBatch {
  expectedRevision: number;
  commands: AuthoringCommand[];
  dryRun?: boolean;
}

export interface AuthoringSnapshot {
  document: StoryDocument;
  editorState: StoryEditorState;
  revision: number;
}

export interface AuthoringDiffEntry {
  path: string;
  before: unknown;
  after: unknown;
}

export interface AuthoringResult extends AuthoringSnapshot {
  committed: boolean;
  diff: AuthoringDiffEntry[];
}

interface SessionState {
  document: StoryDocument;
  editorState: StoryEditorState;
}

function cloneState(state: SessionState): SessionState {
  return {
    document: cloneStoryDocument(state.document),
    editorState: structuredClone(state.editorState),
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('命令 patch 必须是对象');
  return value as Record<string, unknown>;
}

function sceneById(document: StoryDocument, sceneId: string): Scene {
  const scene = document.scenes.find(candidate => candidate.id === sceneId);
  if (!scene) throw new Error(`场景不存在: ${sceneId}`);
  return scene;
}

function choiceById(scene: Scene, choiceId: string): Choice {
  const choice = scene.choices.find(candidate => candidate.id === choiceId);
  if (!choice) throw new Error(`选项不存在: ${choiceId}`);
  return choice;
}

function applyCommand(state: SessionState, command: AuthoringCommand): void {
  switch (command.type) {
    case 'update-meta':
      state.document.meta = { ...state.document.meta, ...command.patch };
      return;
    case 'add-scene':
      state.document.scenes.push(structuredClone(command.scene) as Scene);
      state.editorState.scenePositions[(command.scene as { id?: string }).id ?? ''] = command.position;
      return;
    case 'update-scene': {
      const scene = sceneById(state.document, command.sceneId);
      Object.assign(scene, objectValue(command.patch));
      return;
    }
    case 'delete-scene': {
      if (state.document.entrySceneId === command.sceneId) throw new Error('不能删除入口场景');
      if (state.document.scenes.some(scene => scene.choices.some(choice => choice.targetSceneId === command.sceneId))) {
        throw new Error(`场景 ${command.sceneId} 仍被选项目标引用`);
      }
      if (state.document.scenes.some(scene => (scene.media.hotspots ?? []).some(hotspot => hotspot.targetSceneId === command.sceneId))) {
        throw new Error(`场景 ${command.sceneId} 仍被热区目标引用`);
      }
      state.document.scenes = state.document.scenes.filter(scene => scene.id !== command.sceneId);
      delete state.editorState.scenePositions[command.sceneId];
      if (state.editorState.selectedSceneId === command.sceneId) state.editorState.selectedSceneId = null;
      return;
    }
    case 'add-choice':
      sceneById(state.document, command.sceneId).choices.push(structuredClone(command.choice) as Choice);
      return;
    case 'update-choice':
      Object.assign(choiceById(sceneById(state.document, command.sceneId), command.choiceId), objectValue(command.patch));
      return;
    case 'delete-choice': {
      const scene = sceneById(state.document, command.sceneId);
      choiceById(scene, command.choiceId);
      scene.choices = scene.choices.filter(choice => choice.id !== command.choiceId);
      if (state.editorState.selectedChoiceId === command.choiceId) state.editorState.selectedChoiceId = null;
      return;
    }
    case 'set-choice-target':
      choiceById(sceneById(state.document, command.sceneId), command.choiceId).targetSceneId = command.targetSceneId;
      return;
    case 'set-entry-scene':
      state.document.entrySceneId = command.sceneId;
      return;
    case 'set-variables':
      state.document.variables = structuredClone(command.variables) as VariableDefinition[];
      return;
    case 'set-rules':
      state.document.rules = structuredClone(command.rules) as RuleDocument[];
      return;
    case 'set-presentation':
      state.document.presentation = {
        templateId: command.templateId ?? state.document.presentation.templateId,
        settings: command.settings ?? state.document.presentation.settings,
        sceneVariants: command.sceneVariants ?? state.document.presentation.sceneVariants,
      };
      return;
    case 'replace-document': {
      const replacement = parseStoryDocument(command.document);
      if (replacement.id !== state.document.id) throw new Error('不能通过创作命令替换作品 ID');
      state.document = replacement;
      return;
    }
    case 'replace-editor-state':
      state.editorState = parseStoryEditorState(command.editorState);
      return;
    case 'move-scene':
      sceneById(state.document, command.sceneId);
      state.editorState.scenePositions[command.sceneId] = command.position;
      return;
    case 'set-viewport':
      state.editorState.viewport = command.viewport;
      return;
    case 'select-editor':
      state.editorState.selectedSceneId = command.sceneId;
      state.editorState.selectedChoiceId = command.choiceId;
      return;
  }
}

function diffValues(before: unknown, after: unknown, path = ''): AuthoringDiffEntry[] {
  if (Object.is(before, after)) return [];
  if (Array.isArray(before) || Array.isArray(after)) {
    if (JSON.stringify(before) === JSON.stringify(after)) return [];
    return [{ path, before, after }];
  }
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    const left = before as Record<string, unknown>;
    const right = after as Record<string, unknown>;
    return [...new Set([...Object.keys(left), ...Object.keys(right)])].flatMap(key => (
      diffValues(left[key], right[key], path ? `${path}.${key}` : key)
    ));
  }
  return [{ path, before, after }];
}

function diffState(before: SessionState, after: SessionState): AuthoringDiffEntry[] {
  return [
    ...diffValues(before.document, after.document),
    ...diffValues(before.editorState, after.editorState, 'editorState'),
  ];
}

export class AuthoringSession {
  private state: SessionState;
  private revision: number;
  private readonly undoStack: SessionState[] = [];
  private readonly redoStack: SessionState[] = [];

  constructor(document: StoryDocument, editorState: StoryEditorState, revision = 0) {
    this.state = {
      document: parseStoryDocument(document),
      editorState: parseStoryEditorState(editorState),
    };
    this.revision = revision;
  }

  query(): AuthoringSnapshot {
    const state = cloneState(this.state);
    return { ...state, revision: this.revision };
  }

  submit(input: AuthoringBatch): AuthoringResult {
    if (!Number.isInteger(input.expectedRevision) || input.expectedRevision !== this.revision) {
      throw new Error(`expected revision ${input.expectedRevision} 与当前 revision ${this.revision} 不一致`);
    }
    const commands = z.array(authoringCommandSchema).parse(input.commands);
    const before = cloneState(this.state);
    const candidate = cloneState(this.state);
    for (const command of commands) applyCommand(candidate, command);
    candidate.document = parseStoryDocument(candidate.document);
    candidate.editorState = parseStoryEditorState(candidate.editorState);
    let diff = diffState(before, candidate);

    if (input.dryRun || diff.length === 0) {
      return { ...this.query(), committed: false, diff };
    }

    candidate.document.updatedAt = new Date().toISOString();
    candidate.document = parseStoryDocument(candidate.document);
    diff = diffState(before, candidate);

    this.undoStack.push(before);
    this.redoStack.length = 0;
    this.state = candidate;
    this.revision += 1;
    return { ...this.query(), committed: true, diff };
  }

  undo(): AuthoringResult {
    const previous = this.undoStack.pop();
    if (!previous) throw new Error('没有可撤销的创作事务');
    const current = cloneState(this.state);
    this.redoStack.push(current);
    this.state = previous;
    this.revision += 1;
    return { ...this.query(), committed: true, diff: diffState(current, previous) };
  }

  redo(): AuthoringResult {
    const next = this.redoStack.pop();
    if (!next) throw new Error('没有可重做的创作事务');
    const current = cloneState(this.state);
    this.undoStack.push(current);
    this.state = next;
    this.revision += 1;
    return { ...this.query(), committed: true, diff: diffState(current, next) };
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
