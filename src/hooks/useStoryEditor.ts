/**
 * 故事编辑器核心Hook
 * 职责：管理节点、边、元数据的状态和操作
 */

import { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge, MarkerType, type ReactFlowInstance } from 'reactflow';
import type { Connection } from 'reactflow';
import type {
  EditorChoice as Choice,
  EditorStoryMeta as StoryMeta,
  StoryFlowEdge as StoryEdge,
  StoryFlowNode as StoryNode,
  StoryFlowNodeData as NodeData,
  VariableDefinition,
} from '../ui/editor/flowTypes.ts';
import config from '../config/index.ts';

const DEFAULT_META: StoryMeta = {
  id: 'story',
  title: '我的互动小说',
  author: '作者',
  description: '',
  start_node: 1,
  templateId: 'builtin.visual-novel',
  templateSettings: {},
  templateSceneVariants: {},
};

export function useStoryEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<StoryEdge | null>(null);
  const [storyMeta, setStoryMeta] = useState<StoryMeta>(DEFAULT_META);
  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  
  const loadStoryData = useCallback((nodes: StoryNode[], edges: StoryEdge[], meta: StoryMeta, vars?: VariableDefinition[]) => {
    setNodes(nodes);
    setEdges(edges);
    setStoryMeta(meta);
    setVariables(vars || []);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.sourceHandle || !params.target) return;
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
      setEdges(eds => addEdge(edge, eds.filter(candidate => (
        candidate.source !== params.source || candidate.sourceHandle !== params.sourceHandle
      ))));
      setNodes(items => items.map(node => node.id !== params.source ? node : ({
        ...node,
        data: {
          ...node.data,
          choices: node.data.choices.map(choice => choice.id === params.sourceHandle
            ? { ...choice, targetSceneId: params.target! }
            : choice),
        },
      })));
    },
    [setEdges, setNodes]
  );

  const addNode = useCallback((reactFlowInstance?: ReactFlowInstance) => {
    const nextNumber = Math.max(0, ...nodes.map(node => node.data.nodeId)) + 1;
    const newNodeId = String(nextNumber);
    
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
        nodeId: nextNumber,
        text: '新的故事节点...',
        choices: [],
        nodeType: 'normal'
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  const deleteNode = useCallback(() => {
    if (!selectedNode || selectedNode.data.nodeType === 'start') return;
    
    setNodes(nds => nds.filter(n => n.id !== selectedNode.id).map(node => ({
      ...node,
      data: {
        ...node.data,
        choices: node.data.choices.filter(choice => choice.targetSceneId !== selectedNode.id),
      },
    })));
    setEdges((eds) => eds.filter(
      (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
    ));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

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
    
    const originalChoices = targetNode.data.choices;
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
    setEdges(items => items.filter(edge => edge.source !== nodeId || edge.sourceHandle !== _deletedChoice.id));
  }, [nodes, setNodes, setEdges]);

  const deleteEdge = useCallback((edgeId: string) => {
    const edge = edges.find(candidate => candidate.id === edgeId);
    setEdges(eds => eds.filter(candidate => candidate.id !== edgeId));
    if (edge?.sourceHandle) {
      setNodes(items => items.map(node => node.id !== edge.source ? node : ({
        ...node,
        data: {
          ...node.data,
          choices: node.data.choices.filter(choice => choice.id !== edge.sourceHandle),
        },
      })));
    }
    setSelectedEdge(null);
  }, [edges, setEdges, setNodes]);

  const onEdgesDelete = useCallback(() => {
    console.log('Delete键已禁用，请使用界面按钮删除');
  }, []);

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
  };
}
