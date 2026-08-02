/**
 * 编辑器页面（基于插件系统重构）
 * 职责：可视化编辑故事节点
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  MarkerType,
  NodeMouseHandler,
  EdgeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { workspaceService } from '../application/workspace/WorkspaceService.ts';
import { StorySaveCoordinator, type SaveState } from '../application/editor/StorySaveCoordinator.ts';
import { workspaceRepository } from '../platform/storage/WorkspaceRepository.ts';
import { workspaceChannel } from '../platform/storage/WorkspaceChannel.ts';
import { acquireStoryWriteLock, type StoryWriteLockHandle } from '../platform/storage/StoryWriteLock.ts';
import type { Story } from '../types/index.ts';
import { usePluginSystem } from '../contexts/PluginContext.tsx';
import StoryNodeComponent from '../components/StoryNode.tsx';
import EditorSidebar from '../components/EditorSidebar.tsx';
import BottomEditPanel, { type BottomEditPanelRef } from '../components/BottomEditPanel.tsx';
import EdgeEditPanel from '../components/EdgeEditPanel.tsx';
import Loading from '../components/ui/Loading.tsx';
import notification from '../utils/notification.ts';
import { useStoryEditor } from '../hooks/useStoryEditor.ts';
import '../styles/editor.css';
import '../styles/editor-tabs.css';

const nodeTypes = {
  storyNode: StoryNodeComponent,
};

function Editor(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pluginSystem = usePluginSystem();
  const [loading, setLoading] = useState<boolean>(true);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [storyAnalysis, setStoryAnalysis] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [readOnly, setReadOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>('all');

  const editor = useStoryEditor();
  const nodeEditPanelRef = useRef<BottomEditPanelRef>(null);
  const coordinatorRef = useRef<StorySaveCoordinator | null>(null);
  const writeLockRef = useRef<StoryWriteLockHandle | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const createdAtRef = useRef<string>('');
  const skipInitialSaveRef = useRef(true);
  const mountedRef = useRef(true);

  const pureNodes = useMemo(() => {
    return editor.nodes.map(node => ({
      id: node.id,
      type: 'storyNode' as const,
      position: node.position,
      data: node.data as any
    }));
  }, [editor.nodes]);
  
  const pureEdges = useMemo(() => {
    return editor.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      animated: edge.animated,
      markerEnd: edge.markerEnd,
      style: edge.style
    }));
  }, [editor.edges]);

  // 收集所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    editor.nodes.forEach(node => {
      const nodeTags = (node.data as any).tags as string[] | undefined;
      nodeTags?.forEach(tag => tags.add(tag));
    });
    
    const result = ['all', ...Array.from(tags).sort()];
    
    // 检查是否有未分组节点
    const hasUntagged = editor.nodes.some(n => {
      const nodeTags = (n.data as any).tags as string[] | undefined;
      return !nodeTags || nodeTags.length === 0;
    });
    if (hasUntagged) result.push('未分组');
    
    return result;
  }, [editor.nodes]);

  // 过滤函数
  const filterNodesByTag = useCallback((nodes: any[]) => {
    if (tagFilter === 'all') return nodes;
    if (tagFilter === '未分组') {
      return nodes.filter(n => {
        const nodeTags = (n.data as any).tags as string[] | undefined;
        return !nodeTags || nodeTags.length === 0;
      });
    }
    return nodes.filter(n => {
      const nodeTags = (n.data as any).tags as string[] | undefined;
      return nodeTags?.includes(tagFilter);
    });
  }, [tagFilter]);

  const loadStory = useCallback(async () => {
    if (!id) return;

    try {
      const writeLock = await acquireStoryWriteLock(id);
      if (!mountedRef.current) {
        writeLock.release();
        return;
      }
      writeLockRef.current = writeLock;
      setReadOnly(!writeLock.acquired);

      const stored = await workspaceService.getStoredStory(id);
      if (!stored) throw new Error('故事不存在');
      createdAtRef.current = stored.story.createdAt;
      editor.loadStoryData(stored.story.nodes, stored.story.edges, stored.story.meta, stored.story.variables);
      coordinatorRef.current = new StorySaveCoordinator(
        stored.revision,
        workspaceRepository,
        workspaceChannel,
        {
          onStateChange: setSaveState,
          onError: error => {
            if (error instanceof Error && error.name === 'RevisionConflictError') {
              notification.error('作品已在其他标签页更新，当前页面已停止保存');
            } else {
              notification.error(error instanceof Error ? error.message : '保存失败');
            }
          },
        },
      );
      unsubscribeRef.current = workspaceChannel.subscribe(message => {
        if (message.storyId !== id) return;
        coordinatorRef.current?.markExternalRevision(message.revision);
        if (coordinatorRef.current?.currentState === 'conflict') {
          notification.warning('检测到其他标签页的更新');
        }
      });
      skipInitialSaveRef.current = true;
      setLoading(false);
    } catch (error) {
      console.error('加载失败:', error);
      notification.error('加载故事失败');
      navigate('/app');
      setLoading(false);
    }
  }, [id, editor.loadStoryData, navigate]);

  const createStorySnapshot = useCallback((): Story | null => {
    if (!id) return null;
    let nodes = editor.nodes;
    if (editor.selectedNode && nodeEditPanelRef.current) {
      const editingData = nodeEditPanelRef.current.applyChanges();
      if (editingData) {
        nodes = nodes.map(node => node.id === editor.selectedNode?.id
          ? { ...node, data: { ...node.data, ...editingData } }
          : node);
      }
    }
    const now = new Date().toISOString();
    return {
      id,
      meta: structuredClone(editor.storyMeta),
      nodes: nodes.map(node => ({
        id: node.id,
        type: 'storyNode' as const,
        position: node.position,
        data: node.data,
      })),
      edges: editor.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        animated: edge.animated,
        markerEnd: edge.markerEnd,
        style: edge.style,
      })),
      variables: structuredClone(editor.variables),
      createdAt: createdAtRef.current,
      updatedAt: now,
    };
  }, [editor.edges, editor.nodes, editor.selectedNode, editor.storyMeta, editor.variables, id]);

  const flushAndNavigate = useCallback(async (target: string) => {
    if (!readOnly) {
      const snapshot = createStorySnapshot();
      if (snapshot) coordinatorRef.current?.queue(snapshot);
      await coordinatorRef.current?.flush();
      if (coordinatorRef.current?.currentState === 'error' || coordinatorRef.current?.currentState === 'conflict') return;
    }
    navigate(target);
  }, [createStorySnapshot, navigate, readOnly]);

  const performAnalysis = useCallback(() => {
    return pluginSystem.getContribution('analyzer', 'story')?.analyze(pureNodes, pureEdges) ?? null;
  }, [pluginSystem, pureNodes, pureEdges]);

  const handleValidate = useCallback(() => {
    const validator = pluginSystem.getContribution('validator', 'story');
    if (!validator) {
      notification.warning('验证器插件未启用');
      return;
    }
    
    const result = validator.validate(pureNodes, pureEdges);
    setValidationResult(result);
    
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    
    if (errorCount === 0 && warningCount === 0) {
      notification.success('验证通过！没有发现任何问题');
    } else if (errorCount > 0) {
      notification.error(`发现 ${errorCount} 个错误${warningCount > 0 ? `，${warningCount} 个警告` : ''}`);
    } else {
      notification.warning(`发现 ${warningCount} 个警告`);
    }
  }, [pluginSystem, pureNodes, pureEdges]);

  const handleAutoLayout = useCallback((layoutType: 'hierarchical' | 'radial' = 'hierarchical') => {
    const layoutName = layoutType === 'hierarchical' ? '层次' : '辐射';
    setAnalysisStatus(`正在布局\n请等候`);
    
    // 短暂延迟让提示先显示
    setTimeout(() => {
      // 执行分析
      let analysis = storyAnalysis;
      if (!analysis) {
        analysis = performAnalysis();
        if (analysis) {
          setStoryAnalysis(analysis);
        }
      }
      
      if (!analysis) {
        setAnalysisStatus('');
        notification.warning('分析器插件未启用');
        return;
      }

      const layout = pluginSystem.getContribution('layout', layoutType);
      if (!layout) {
        setAnalysisStatus('');
        notification.warning(`${layoutName}布局插件未启用`);
        return;
      }
      
      const layoutedNodes = layout.layout(pureNodes, pureEdges, analysis);
      editor.setNodes(layoutedNodes as any);
      
      setAnalysisStatus('布局完成');
      setTimeout(() => setAnalysisStatus(''), 2000);
    }, 50);
  }, [storyAnalysis, pluginSystem, pureNodes, pureEdges, editor, performAnalysis]);

  useEffect(() => {
    mountedRef.current = true;
    if (id) {
      void loadStory();
    }
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
  }, [id, loadStory]);

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

  const highlightedNodes = useMemo(() => {
    if (!highlightNodeId) return new Set<string>();
    
    const connected = new Set<string>();
    connected.add(highlightNodeId);
    
    pureEdges.forEach(edge => {
      if (edge.source === highlightNodeId) {
        connected.add(edge.target);
      }
      if (edge.target === highlightNodeId) {
        connected.add(edge.source);
      }
    });
    
    return connected;
  }, [highlightNodeId, pureEdges]);

  const nodesWithAnalysis = useMemo(() => {
    // 先应用标签过滤
    const filteredNodes = filterNodesByTag(editor.nodes);
    
    if (!storyAnalysis) return filteredNodes;
    
    return filteredNodes.map(node => {
      const isHighlighted = highlightedNodes.has(node.id);
      const nodeAnalysis = storyAnalysis.nodes?.get(node.id);
      
      return {
        ...node,
        className: isHighlighted ? 'node-highlighted' : undefined,
        data: {
          ...node.data,
          analysis: nodeAnalysis
        }
      };
    });
  }, [editor.nodes, storyAnalysis, highlightedNodes, filterNodesByTag]);

  const edgesWithHighlight = useMemo(() => {
    // 获取可见节点的ID集合
    const visibleNodeIds = new Set(nodesWithAnalysis.map(n => n.id));
    
    // 只保留source和target都在可见节点中的边
    return editor.edges
      .filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map(edge => {
        const isHighlighted = highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target);
        
        if (edge.type === 'attachment') {
          return {
            ...edge,
            animated: isHighlighted,
            style: {
              ...edge.style,
              strokeDasharray: '5,5',
            }
          };
        }
        
        return {
          ...edge,
          animated: isHighlighted,
        };
      });
  }, [editor.edges, highlightedNodes, nodesWithAnalysis]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (readOnly) {
      notification.warning('当前作品已在其他标签页编辑，此页面为只读');
      return;
    }
    // 限制：面板开着时，禁止切换到其他节点
    if (editor.selectedNode && node.id !== editor.selectedNode.id) {
      notification.warning('请先关闭当前编辑面板');
      return;
    }
    
    editor.setSelectedNode(node as any);
    editor.setSelectedEdge(null);
    setHighlightNodeId(node.id);
  }, [editor, readOnly]);

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    if (readOnly) return;
    // 限制：节点编辑面板开着时，禁止操作边
    if (editor.selectedNode) {
      notification.warning('请先关闭当前编辑面板');
      return;
    }
    
    editor.setSelectedEdge(edge as any);
    editor.setSelectedNode(null);
  }, [editor, readOnly]);

  const handleJumpToNode = useCallback((nodeId: string) => {
    if (!reactFlowInstance) return;
    
    const node = editor.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // 限制：面板开着时，禁止跳转到其他节点
    if (editor.selectedNode && node.id !== editor.selectedNode.id) {
      notification.warning('请先关闭当前编辑面板');
      return;
    }
    
    editor.setSelectedNode(node as any);
    editor.setSelectedEdge(null);
    
    reactFlowInstance.setCenter(node.position.x + 140, node.position.y + 100, { zoom: 1.2, duration: 0 });
  }, [reactFlowInstance, editor]);

  if (loading) {
    return <Loading fullScreen message="加载编辑器..." />;
  }

  const stats = storyAnalysis ? {
    nodeCount: pureNodes.length,
    edgeCount: pureEdges.length,
    maxDepth: storyAnalysis.maxDepth,
    endingCount: storyAnalysis.endingNodeIds?.length || 0,
    hasCycles: storyAnalysis.hasCycles,
    cycleCount: storyAnalysis.cycles?.length || 0,
    sccCount: storyAnalysis.sccs?.length || 0,
    keyDecisionCount: 0
  } : null;

  const keyDecisionNodes = storyAnalysis ? 
    Array.from(storyAnalysis.nodes?.entries() || [])
      .filter((entry: any) => entry[1].isKeyDecision)
      .map((entry: any) => {
        const id = entry[0];
        const node = pureNodes.find(n => n.id === id);
        return { id, nodeId: node?.data.nodeId || 0 };
      }) : [];

  return (
    <div className="editor-container">
      <button 
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="打开菜单"
      >
        ☰
      </button>

      <EditorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storyId={id || ''}
        storyMeta={editor.storyMeta}
        variables={editor.variables}
        onMetaChange={meta => { if (!readOnly) editor.setStoryMeta(meta); }}
        onVariablesChange={variables => { if (!readOnly) editor.setVariables(variables); }}
        onAddNode={() => { if (!readOnly) editor.addNode(reactFlowInstance); }}
        onDeleteNode={() => { if (!readOnly) editor.deleteNode(); }}
        onValidate={handleValidate}
        onAutoLayout={layout => { if (!readOnly) handleAutoLayout(layout); }}
        onJumpToNode={handleJumpToNode}
        onBackToDashboard={() => void flushAndNavigate('/app')}
        onPlay={() => void flushAndNavigate(`/play/${id}`)}
        hasSelectedNode={!readOnly && !!editor.selectedNode}
        validationResult={validationResult}
        nodeCount={editor.nodes.length}
        allNodes={filterNodesByTag(pureNodes).map(node => ({
          id: node.id,
          nodeId: node.data.nodeId,
          nodeType: node.data.nodeType,
          text: node.data.text,
          tags: (node.data as any).tags,
          choices: node.data.choices
        }))}
        storyStats={stats}
        keyDecisionNodes={keyDecisionNodes}
        onUndo={() => { if (!readOnly) editor.undo(); }}
        onRedo={() => { if (!readOnly) editor.redo(); }}
        canUndo={!readOnly && editor.canUndo}
        canRedo={!readOnly && editor.canRedo}
        tagFilter={tagFilter}
        allTags={allTags}
        onTagFilterChange={setTagFilter}
      />

      <div 
        className="editor-canvas"
        style={{
          marginRight: editor.selectedNode ? '390px' : '0',
          transition: 'margin-right 0.3s ease'
        }}
      >
        <ReactFlow
          nodes={nodesWithAnalysis}
          edges={edgesWithHighlight}
          onNodesChange={readOnly ? undefined : editor.onNodesChange}
          onEdgesChange={readOnly ? undefined : editor.onEdgesChange}
          onConnect={readOnly ? undefined : editor.onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onEdgesDelete={editor.onEdgesDelete}
          onInit={setReactFlowInstance}
          onPaneClick={() => setHighlightNodeId(null)}
          nodeTypes={nodeTypes}
          deleteKeyCode={null}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          onlyRenderVisibleElements
          minZoom={0.1}
          maxZoom={4}
          defaultEdgeOptions={{
            type: 'default',
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
          }}
          fitView
        >
          <Controls />
          <MiniMap pannable={true} zoomable={true} />
          <Background variant={"dots" as any} gap={12} size={1} />
        </ReactFlow>
        
        {analysisStatus && (
          <div className="analysis-status-overlay">
            {analysisStatus}
          </div>
        )}

        {readOnly && (
          <div className="editor-readonly-banner">当前作品已在其他标签页编辑，此页面为只读</div>
        )}
        {(saveState === 'error' || saveState === 'conflict') && (
          <div className="editor-save-error">保存已停止，请处理存储或标签页冲突后刷新</div>
        )}
      </div>

      {!readOnly && editor.selectedNode && (
        <BottomEditPanel
          ref={nodeEditPanelRef}
          node={editor.selectedNode}
          allNodes={pureNodes as any}
          onUpdate={editor.updateNodeData}
          onClose={() => editor.setSelectedNode(null)}
          onDeleteChoice={editor.deleteChoice}
          globalVariables={editor.variables}
          storyMeta={editor.storyMeta}
          onDraftChange={() => {
            const snapshot = createStorySnapshot();
            if (snapshot) coordinatorRef.current?.queue(snapshot);
          }}
        />
      )}

      {!readOnly && editor.selectedEdge && (
        <EdgeEditPanel
          edge={editor.selectedEdge}
          nodes={pureNodes as any}
          onDelete={editor.deleteEdge}
          onClose={() => editor.setSelectedEdge(null)}
        />
      )}
    </div>
  );
}

export default Editor;
