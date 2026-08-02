/**
 * 历史记录管理Hook
 * 职责：管理撤销/重做功能
 */

import { useState, useCallback } from 'react';
import type { StoryNode, StoryEdge } from '../types/index.ts';

interface HistorySnapshot {
  nodes: StoryNode[];
  edges: StoryEdge[];
}

const MAX_HISTORY_LENGTH = 10;

export function useHistory() {
  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);

  const saveSnapshot = useCallback((nodes: StoryNode[], edges: StoryEdge[]) => {
    const snapshot: HistorySnapshot = {
      nodes: [...nodes],
      edges: [...edges]
    };
    
    setPast((prev: HistorySnapshot[]) => [...prev, snapshot].slice(-MAX_HISTORY_LENGTH));
    setFuture([]);
  }, []);

  const undo = useCallback((
    currentNodes: StoryNode[], 
    currentEdges: StoryEdge[]
  ): HistorySnapshot | null => {
    if (past.length === 0) return null;
    
    const currentSnapshot: HistorySnapshot = {
      nodes: [...currentNodes],
      edges: [...currentEdges]
    };
    
    const previousSnapshot = past[past.length - 1];
    const newPast = past.slice(0, -1);
    
    setPast(newPast);
    setFuture((prev: HistorySnapshot[]) => [currentSnapshot, ...prev].slice(0, MAX_HISTORY_LENGTH));
    
    return previousSnapshot;
  }, [past]);

  const redo = useCallback((
    currentNodes: StoryNode[], 
    currentEdges: StoryEdge[]
  ): HistorySnapshot | null => {
    if (future.length === 0) return null;
    
    const currentSnapshot: HistorySnapshot = {
      nodes: [...currentNodes],
      edges: [...currentEdges]
    };
    
    const nextSnapshot = future[0];
    const newFuture = future.slice(1);
    
    setFuture(newFuture);
    setPast((prev: HistorySnapshot[]) => [...prev, currentSnapshot].slice(-MAX_HISTORY_LENGTH));
    
    return nextSnapshot;
  }, [future]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    saveSnapshot,
    undo,
    redo,
    canUndo,
    canRedo
  };
}

