/**
 * 故事编辑器核心Hook
 * 职责：管理节点、边、元数据的状态和操作
 */

import { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge, MarkerType } from 'reactflow';
import type { Connection } from 'reactflow';
import type { StoryNode, StoryEdge, StoryMeta, Choice, TextNodeData, NodeData, VariableDefinition } from '../types/index.ts';
import config from '../config/index.ts';
import { useHistory } from './useHistory.ts';

const DEFAULT_META: StoryMeta = {
  id: 'story',
  title: '我的互动小说',
  author: '作者',
  description: '',
  start_node: 1
};

export function useStoryEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<StoryEdge | null>(null);
  const [storyMeta, setStoryMeta] = useState<StoryMeta>(DEFAULT_META);
  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  
  const history = useHistory();

  const loadStoryData = useCallback((nodes: StoryNode[], edges: StoryEdge[], meta: StoryMeta, vars?: VariableDefinition[]) => {
    setNodes(nodes);
    setEdges(edges);
    setStoryMeta(meta);
    setVariables(vars || []);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const edgeConfig = config.ui.edge;
      
      const edge: StoryEdge = {
        ...params,
        id: `${params.source}-${params.target}-${params.sourceHandle || 'default'}`,
        source: params.source!,
        target: params.target!,
        type: 'default',
        animated: false,
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: edgeConfig.markerWidth,
          height: edgeConfig.markerHeight,
          color: edgeConfig.color
        },
      style: { 
          stroke: edgeConfig.color, 
          strokeWidth: edgeConfig.width
        }
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback((reactFlowInstance?: any) => {
    const newNodeId = (nodes.length + 1).toString();
    
    let position = { x: 100, y: 100 };
    
    if (reactFlowInstance && reactFlowInstance.project) {
      const bounds = document.querySelector('.react-flow')?.getBoundingClientRect();
      if (bounds) {
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        position = reactFlowInstance.project({ x: centerX, y: centerY });
      }
    } else {
      position = { 
        x: Math.random() * 500 + 100, 
        y: Math.random() * 500 + 100 
      };
    }
    
    const newNode: StoryNode = {
      id: newNodeId,
      type: 'storyNode',
      position,
      data: {
        nodeId: parseInt(newNodeId),
        text: '新的故事节点...',
        choices: [{ id: `c${newNodeId}_1`, text: '选项1' }],
        nodeType: 'normal'
      } as TextNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    
    history.saveSnapshot(nodes, edges);
    
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter(
      (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
    ));
    setSelectedNode(null);
  }, [selectedNode, nodes, edges, history, setNodes, setEdges]);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<StoryNode['data']>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: { ...node.data, ...newData },
          };
          
          // 如果是当前选中的节点，同步更新 selectedNode
          if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode(updatedNode);
          }
          
          return updatedNode;
        }
        return node;
      })
    );
  }, [setNodes, selectedNode, setSelectedNode]);

  const deleteChoice = useCallback((nodeId: string, choiceIndex: number, _deletedChoice: Choice) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;
    
    const originalChoices = (targetNode.data as any).choices;
    const newChoices = originalChoices.filter((_: Choice, i: number) => i !== choiceIndex);
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, choices: newChoices },
          };
        }
        return node;
      })
    );
  }, [nodes, setNodes]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
  }, [setEdges]);

  const onEdgesDelete = useCallback(() => {
    console.log('Delete键已禁用，请使用界面按钮删除');
  }, []);

  const handleUndo = useCallback(() => {
    const snapshot = history.undo(nodes, edges);
    if (snapshot) {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setSelectedNode(null);
    }
  }, [history, nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const snapshot = history.redo(nodes, edges);
    if (snapshot) {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setSelectedNode(null);
    }
  }, [history, nodes, edges, setNodes, setEdges]);

  return {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    storyMeta,
    variables,
    setNodes,
    setEdges,
    setSelectedNode,
    setSelectedEdge,
    setStoryMeta,
    setVariables,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onEdgesDelete,
    loadStoryData,
    addNode,
    deleteNode,
    updateNodeData,
    deleteEdge,
    deleteChoice,
    undo: handleUndo,
    redo: handleRedo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
