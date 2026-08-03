/**
 * 编辑器页面（基于插件系统重构）
 * 职责：可视化编辑故事节点
 */

import { useState, useCallback, useMemo, useRef } from 'react';
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

import { usePluginSystem } from '../contexts/PluginContext.tsx';
import StoryNodeComponent from '../components/StoryNode.tsx';
import EditorSidebar from '../components/EditorSidebar.tsx';
import BottomEditPanel, { type BottomEditPanelRef } from '../components/BottomEditPanel.tsx';
import EdgeEditPanel from '../components/EdgeEditPanel.tsx';
import Loading from '../components/ui/Loading.tsx';
import notification from '../utils/notification.ts';
import { useStoryEditor } from '../hooks/useStoryEditor.ts';
import { useEditorSession } from '../hooks/useEditorSession.ts';
import '../styles/editor.css';
import '../styles/editor-tabs.css';

const nodeTypes = {
  storyNode: StoryNodeComponent,
};

function Editor(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pluginSystem = usePluginSystem();
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [storyAnalysis, setStoryAnalysis] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const editor = useStoryEditor();
  const nodeEditPanelRef = useRef<BottomEditPanelRef>(null);
  const {
    loading,
    readOnly,
    saveState,
    canUndo,
    canRedo,
    createStorySnapshot,
    undo: handleUndo,
    redo: handleRedo,
    flushAndNavigate,
    queueSnapshot,
  } = useEditorSession({ storyId: id, editor, nodeEditPanelRef, navigate });

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

  const performAnalysis = useCallback(() => {
    const snapshot = createStorySnapshot();
    return snapshot ? pluginSystem.getContribution('analyzer', 'story')?.analyze(snapshot.document) ?? null : null;
  }, [createStorySnapshot, pluginSystem]);

  const handleValidate = useCallback(() => {
    const validator = pluginSystem.getContribution('validator', 'story');
    if (!validator) {
      notification.warning('验证器插件未启用');
      return;
    }
    
    const snapshot = createStorySnapshot();
    if (!snapshot) return;
    const result = validator.validate(snapshot.document);
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
  }, [createStorySnapshot, pluginSystem]);

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
      
      const snapshot = createStorySnapshot();
      if (!snapshot) return;
      const layoutedState = layout.layout(snapshot.document, snapshot.editorState, analysis);
      editor.setNodes(nodes => nodes.map(node => ({
        ...node,
        position: layoutedState.scenePositions[node.id] ?? node.position,
      })));
      
      setAnalysisStatus('布局完成');
      setTimeout(() => setAnalysisStatus(''), 2000);
    }, 50);
  }, [storyAnalysis, pluginSystem, editor, performAnalysis, createStorySnapshot]);

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
        onUndo={() => { if (!readOnly) handleUndo(); }}
        onRedo={() => { if (!readOnly) handleRedo(); }}
        canUndo={!readOnly && canUndo}
        canRedo={!readOnly && canRedo}
        tagFilter={tagFilter}
        allTags={allTags}
        onTagFilterChange={setTagFilter}
        selectedSceneId={editor.selectedNode?.id ?? null}
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
          onDraftChange={queueSnapshot}
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
