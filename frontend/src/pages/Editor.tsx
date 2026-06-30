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

import api from '../services/api.ts';
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
  const [saving, setSaving] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [tagFilter, setTagFilter] = useState<string>('all');

  const editor = useStoryEditor();
  const nodeEditPanelRef = useRef<BottomEditPanelRef>(null);
  const autoSavingRef = useRef<boolean>(false); // 自动保存锁
  const handleSaveRef = useRef<(showNotification?: boolean, isAutoSave?: boolean) => Promise<boolean>>();

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
    
    const username = localStorage.getItem('username');
    
    if (!username) {
      notification.error('请先登录');
      navigate('/app');
      return;
    }
    
    try {
      const remoteStory = await api.drafts.getById(id);
      editor.loadStoryData(remoteStory.nodes, remoteStory.edges, remoteStory.meta, remoteStory.variables);
      setLoading(false);
    } catch (error) {
      console.error('加载失败:', error);
      notification.error('加载故事失败');
      navigate('/app');
      setLoading(false);
    }
  }, [id, editor.loadStoryData, navigate]);

  const handleSave = useCallback(async (showNotification: boolean = true, isAutoSave: boolean = false): Promise<boolean> => {
    if (!id || loading) return false;
    
    // 手动保存时检查自动保存锁
    if (!isAutoSave && autoSavingRef.current) {
      notification.warning('正在自动保存中，请稍候');
      return false;
    }
    
    // 自动保存跳过 saving 检查，因为自动保存用 autoSavingRef 做锁
    if (!isAutoSave && saving) return false;
    
    setSaving(true);
    
    let nodesForSave = editor.nodes;

    // 如果编辑面板打开，先生成包含面板数据的本地快照，再保存。
    if (editor.selectedNode && nodeEditPanelRef.current) {
      const editingNodeData = nodeEditPanelRef.current.applyChanges();
      if (editingNodeData) {
        editor.updateNodeData(editor.selectedNode.id, editingNodeData);
        nodesForSave = editor.nodes.map(node => {
          if (node.id !== editor.selectedNode!.id) {
            return node;
          }

          return {
            ...node,
            data: {
              ...node.data,
              ...editingNodeData
            }
          };
        });
      }
    }
    
    // 清洗数据：只保留需要保存的字段
    const currentNodes = nodesForSave.map(node => ({
      id: node.id,
      type: 'storyNode' as const,
      position: node.position,
      data: node.data as any
    }));
    
    const currentEdges = editor.edges.map(edge => ({
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
    
    const story = {
      id,
      meta: editor.storyMeta,
      nodes: currentNodes,
      edges: currentEdges as any,
      variables: editor.variables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await api.drafts.save(story);
      if (showNotification) {
        notification.success('保存成功');
      }
      
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('保存失败:', error);
      if (showNotification) {
        notification.error('保存失败，请检查网络连接');
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [id, saving, loading, editor]);

  const performAnalysis = useCallback(() => {
    const analyzerPlugin = pluginSystem.getPlugin('tool.analyzer');
    if (!analyzerPlugin || !analyzerPlugin.enabled) {
      return null;
    }
    
    const plugin = analyzerPlugin.plugin as any;
    return plugin.analyze(pureNodes, pureEdges);
  }, [pluginSystem, pureNodes, pureEdges]);

  const handleValidate = useCallback(() => {
    const validatorPlugin = pluginSystem.getPlugin('tool.validator');
    if (!validatorPlugin || !validatorPlugin.enabled) {
      notification.warning('验证器插件未启用');
      return;
    }
    
    const plugin = validatorPlugin.plugin as any;
    const result = plugin.validate(pureNodes, pureEdges);
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

      const pluginId = layoutType === 'hierarchical' 
        ? 'tool.layout.hierarchical' 
        : 'tool.layout.radial';
      
      const layoutPlugin = pluginSystem.getPlugin(pluginId);
      if (!layoutPlugin || !layoutPlugin.enabled) {
        setAnalysisStatus('');
        notification.warning(`${layoutName}布局插件未启用`);
        return;
      }
      
      const plugin = layoutPlugin.plugin as any;
      const layoutMethod = layoutType === 'hierarchical' ? 'layoutByDepth' : 'layoutRadial';
      const layoutedNodes = plugin[layoutMethod](pureNodes, pureEdges, analysis);
      editor.setNodes(layoutedNodes as any);
      
      setAnalysisStatus('布局完成');
      setTimeout(() => setAnalysisStatus(''), 2000);
    }, 50);
  }, [storyAnalysis, pluginSystem, pureNodes, pureEdges, editor, performAnalysis]);

  useEffect(() => {
    if (id) {
      loadStory();
    }
  }, [id, loadStory]);

  // 更新 handleSaveRef
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // 防抖式自动保存
  useEffect(() => {
    // 初始加载时不触发
    if (loading || !hasUnsavedChanges) return;
    
    // 设置0.1秒防抖定时器
    const timer = setTimeout(async () => {
      if (!handleSaveRef.current) return;
      
      autoSavingRef.current = true; // 加锁
      
      try {
        await handleSaveRef.current(false, true);
      } catch (error) {
        console.error('[自动保存] 保存失败:', error);
      } finally {
        autoSavingRef.current = false; // 解锁
      }
    }, 100);
    
    // 清理函数：状态再次变化时清除旧定时器
    return () => {
      clearTimeout(timer);
    };
  }, [editor.nodes, editor.edges, editor.storyMeta, editor.variables, loading, hasUnsavedChanges]);

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
    // 限制：面板开着时，禁止切换到其他节点
    if (editor.selectedNode && node.id !== editor.selectedNode.id) {
      notification.warning('请先关闭当前编辑面板');
      return;
    }
    
    editor.setSelectedNode(node as any);
    editor.setSelectedEdge(null);
    setHighlightNodeId(node.id);
  }, [editor]);

  // 监听节点和边的变化，标记为未保存
  useEffect(() => {
    if (!loading && editor.nodes.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [editor.nodes, editor.edges, editor.storyMeta, editor.variables, loading]);

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    // 限制：节点编辑面板开着时，禁止操作边
    if (editor.selectedNode) {
      notification.warning('请先关闭当前编辑面板');
      return;
    }
    
    editor.setSelectedEdge(edge as any);
    editor.setSelectedNode(null);
  }, [editor]);

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
        onMetaChange={editor.setStoryMeta}
        onVariablesChange={editor.setVariables}
        onAddNode={() => editor.addNode(reactFlowInstance)}
        onDeleteNode={editor.deleteNode}
        onValidate={handleValidate}
        onAutoLayout={handleAutoLayout}
        onJumpToNode={handleJumpToNode}
        onBackToDashboard={() => navigate('/app')}
        onPlay={() => navigate(`/play/${id}`)}
        hasSelectedNode={!!editor.selectedNode}
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
        onUndo={editor.undo}
        onRedo={editor.redo}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
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
          onNodesChange={editor.onNodesChange}
          onEdgesChange={editor.onEdgesChange}
          onConnect={editor.onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onEdgesDelete={editor.onEdgesDelete}
          onInit={setReactFlowInstance}
          onPaneClick={() => setHighlightNodeId(null)}
          nodeTypes={nodeTypes}
          deleteKeyCode={null}
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
      </div>

      {editor.selectedNode && (
        <BottomEditPanel
          ref={nodeEditPanelRef}
          node={editor.selectedNode}
          allNodes={pureNodes as any}
          onUpdate={editor.updateNodeData}
          onClose={() => editor.setSelectedNode(null)}
          onDeleteChoice={editor.deleteChoice}
          globalVariables={editor.variables}
          storyMeta={editor.storyMeta}
        />
      )}

      {editor.selectedEdge && (
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
