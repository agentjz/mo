import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  AuthoringSession,
  type AuthoringBatch,
  type AuthoringResult,
  type AuthoringSnapshot,
} from '../application/authoring/AuthoringSession.ts';
import {
  BrowserAuthoringPort,
  type AuthoringReview,
  type AuthoringSchemaDescription,
  type ReviewSelection,
} from '../application/authoring/BrowserAuthoringPort.ts';
import { type SaveState, type SaveSnapshot, StorySaveCoordinator } from '../application/editor/StorySaveCoordinator.ts';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';
import type { StoryDocument } from '../domain/story/document.ts';
import type { StoryEditorState } from '../domain/story/editorState.ts';
import type { StoryWriteLockHandle } from '../platform/storage/StoryWriteLock.ts';
import {
  composeEditorState,
  composeStoryDocument,
  projectEditorMeta,
  projectStoryGraph,
} from '../ui/editor/storyFlowAdapter.ts';
import notification from '../utils/notification.ts';
import type { BottomEditPanelRef } from '../components/BottomEditPanel.tsx';
import { useStoryEditor } from './useStoryEditor.ts';

type StoryEditor = ReturnType<typeof useStoryEditor>;

interface BrowserAuthoringApi {
  query(storyId: string): Promise<AuthoringSnapshot>;
  schema(): Promise<AuthoringSchemaDescription>;
  submit(batch: AuthoringBatch & { storyId: string }): Promise<AuthoringReview>;
  accept(storyId: string, reviewId: string, selection?: ReviewSelection): Promise<AuthoringResult>;
  reject(storyId: string, reviewId: string): Promise<void>;
  undo(storyId: string): Promise<AuthoringResult>;
  redo(storyId: string): Promise<AuthoringResult>;
}

declare global {
  interface Window {
    moAuthoring?: BrowserAuthoringApi;
  }
}

interface Options {
  storyId?: string;
  editor: StoryEditor;
  nodeEditPanelRef: RefObject<BottomEditPanelRef>;
  navigate: NavigateFunction;
}

export function useEditorSession({ storyId, editor, nodeEditPanelRef, navigate }: Options) {
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [readOnly, setReadOnly] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const coordinatorRef = useRef<StorySaveCoordinator | null>(null);
  const writeLockRef = useRef<StoryWriteLockHandle | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const documentRef = useRef<StoryDocument | null>(null);
  const editorStateRef = useRef<StoryEditorState | null>(null);
  const revisionRef = useRef(0);
  const authoringSessionRef = useRef<AuthoringSession | null>(null);
  const authoringPortRef = useRef<BrowserAuthoringPort | null>(null);
  const skipInitialSaveRef = useRef(true);
  const mountedRef = useRef(true);
  const loadStoryData = editor.loadStoryData;

  const loadStory = useCallback(async () => {
    if (!storyId) return;
    try {
      const writeLock = await workspaceService.acquireWriteLock(storyId);
      if (!mountedRef.current) {
        writeLock.release();
        return;
      }
      writeLockRef.current = writeLock;
      setReadOnly(!writeLock.acquired);
      const stored = await workspaceService.getStoredStory(storyId);
      if (!stored) throw new Error('故事不存在');
      documentRef.current = stored.document;
      editorStateRef.current = stored.editorState;
      revisionRef.current = stored.revision;
      authoringSessionRef.current = new AuthoringSession(stored.document, stored.editorState, stored.revision);
      authoringPortRef.current = new BrowserAuthoringPort(authoringSessionRef.current);
      setCanUndo(false);
      setCanRedo(false);
      const graph = projectStoryGraph(stored.document, stored.editorState);
      loadStoryData(graph.nodes, graph.edges, projectEditorMeta(stored.document), stored.document.variables);
      coordinatorRef.current = workspaceService.createSaveCoordinator(stored.revision, {
        onStateChange: setSaveState,
        onSaved: saved => {
          documentRef.current = saved.document;
          editorStateRef.current = saved.editorState;
          revisionRef.current = saved.revision;
        },
        onError: error => {
          if (error instanceof Error && error.name === 'RevisionConflictError') {
            notification.error('作品已在其他标签页更新，当前页面已停止保存');
          } else {
            notification.error(error instanceof Error ? error.message : '保存失败');
          }
        },
      });
      unsubscribeRef.current = workspaceService.subscribeToStoryChanges((changedStoryId, revision) => {
        if (changedStoryId !== storyId) return;
        coordinatorRef.current?.markExternalRevision(revision);
        if (coordinatorRef.current?.currentState === 'conflict') notification.warning('检测到其他标签页的更新');
      });
      skipInitialSaveRef.current = true;
      setLoading(false);
    } catch (error) {
      console.error('加载失败:', error);
      notification.error('加载故事失败');
      navigate('/app');
      setLoading(false);
    }
  }, [loadStoryData, navigate, storyId]);

  const createStorySnapshot = useCallback((): SaveSnapshot | null => {
    const session = authoringSessionRef.current;
    if (!storyId || !session) return null;
    const base = session.query();
    let nodes = editor.nodes;
    if (editor.selectedNode && nodeEditPanelRef.current) {
      const editingData = nodeEditPanelRef.current.applyChanges();
      if (editingData) {
        nodes = nodes.map(node => node.id === editor.selectedNode?.id
          ? { ...node, data: { ...node.data, ...editingData } }
          : node);
      }
    }
    const document = composeStoryDocument(base.document, editor.storyMeta, editor.variables, nodes, editor.edges);
    const editorState = composeEditorState(base.editorState, nodes);
    const result = session.submit({
      expectedRevision: base.revision,
      commands: [
        { version: 1, type: 'replace-document', document },
        { version: 1, type: 'replace-editor-state', editorState },
      ],
    });
    documentRef.current = result.document;
    editorStateRef.current = result.editorState;
    revisionRef.current = result.revision;
    setCanUndo(session.canUndo);
    setCanRedo(session.canRedo);
    return { document: result.document, editorState: result.editorState, revision: result.revision };
  }, [editor.edges, editor.nodes, editor.selectedNode, editor.storyMeta, editor.variables, nodeEditPanelRef, storyId]);

  const applyAuthoringResult = useCallback((result: AuthoringResult) => {
    documentRef.current = result.document;
    editorStateRef.current = result.editorState;
    revisionRef.current = result.revision;
    const graph = projectStoryGraph(result.document, result.editorState);
    loadStoryData(graph.nodes, graph.edges, projectEditorMeta(result.document), result.document.variables);
    coordinatorRef.current?.queue({ document: result.document, editorState: result.editorState, revision: result.revision });
    const session = authoringSessionRef.current;
    setCanUndo(session?.canUndo ?? false);
    setCanRedo(session?.canRedo ?? false);
  }, [loadStoryData]);

  const undo = useCallback(() => {
    createStorySnapshot();
    const session = authoringSessionRef.current;
    if (session?.canUndo) applyAuthoringResult(session.undo());
  }, [applyAuthoringResult, createStorySnapshot]);

  const redo = useCallback(() => {
    const session = authoringSessionRef.current;
    if (session?.canRedo) applyAuthoringResult(session.redo());
  }, [applyAuthoringResult]);

  const flushAndNavigate = useCallback(async (target: string) => {
    if (!readOnly) {
      const snapshot = createStorySnapshot();
      if (snapshot) coordinatorRef.current?.queue(snapshot);
      await coordinatorRef.current?.flush();
      if (coordinatorRef.current?.currentState === 'error' || coordinatorRef.current?.currentState === 'conflict') return;
    }
    navigate(target);
  }, [createStorySnapshot, navigate, readOnly]);

  const queueSnapshot = useCallback(() => {
    const snapshot = createStorySnapshot();
    if (snapshot) coordinatorRef.current?.queue(snapshot);
  }, [createStorySnapshot]);

  useEffect(() => {
    const port = authoringPortRef.current;
    if (loading || !storyId || !port) return;
    const assertStory = (candidate: string): void => {
      if (candidate !== storyId) throw new Error(`当前编辑会话不包含作品: ${candidate}`);
    };
    const api: BrowserAuthoringApi = {
      query: async candidate => { assertStory(candidate); return port.query(); },
      schema: async () => port.schema(),
      submit: async input => {
        assertStory(input.storyId);
        const { storyId: _storyId, ...batch } = input;
        return port.submit(batch);
      },
      accept: async (candidate, reviewId, selection) => {
        assertStory(candidate);
        const result = port.accept(reviewId, selection);
        applyAuthoringResult(result);
        return result;
      },
      reject: async (candidate, reviewId) => { assertStory(candidate); port.reject(reviewId); },
      undo: async candidate => {
        assertStory(candidate);
        const result = port.undo();
        applyAuthoringResult(result);
        return result;
      },
      redo: async candidate => {
        assertStory(candidate);
        const result = port.redo();
        applyAuthoringResult(result);
        return result;
      },
    };
    window.moAuthoring = api;
    return () => {
      if (window.moAuthoring === api) delete window.moAuthoring;
    };
  }, [applyAuthoringResult, loading, storyId]);

  useEffect(() => {
    mountedRef.current = true;
    if (storyId) void loadStory();
    return () => {
      mountedRef.current = false;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      const coordinator = coordinatorRef.current;
      const writeLock = writeLockRef.current;
      coordinatorRef.current = null;
      writeLockRef.current = null;
      if (coordinator) {
        void coordinator.flush().finally(() => {
          coordinator.dispose();
          writeLock?.release();
        });
      } else {
        writeLock?.release();
      }
    };
  }, [loadStory, storyId]);

  useEffect(() => {
    if (loading || readOnly || !coordinatorRef.current) return;
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }
    const snapshot = createStorySnapshot();
    if (snapshot) coordinatorRef.current.queue(snapshot);
  }, [createStorySnapshot, editor.edges, editor.nodes, editor.storyMeta, editor.variables, loading, readOnly]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!coordinatorRef.current?.hasPendingWrite) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    loading,
    readOnly,
    saveState,
    canUndo,
    canRedo,
    createStorySnapshot,
    applyAuthoringResult,
    undo,
    redo,
    flushAndNavigate,
    queueSnapshot,
  };
}
