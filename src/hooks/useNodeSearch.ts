/**
 * 节点搜索Hook
 * 职责：管理节点搜索逻辑
 * 
 * 设计原则：
 * - 单一职责：只处理搜索过滤逻辑
 * - 可扩展：未来可以添加标签搜索、章节搜索等
 * - 性能优化：使用useMemo缓存搜索结果
 */

import { useState, useMemo } from 'react';

interface SearchableNode {
  id: string;
  nodeId: number;
  nodeType: string;
  text?: string;         // 节点文本内容
  tags?: string[];       // 未来：节点标签
  chapter?: string;      // 未来：所属章节
}

export function useNodeSearch(allNodes: SearchableNode[]) {
  const [searchText, setSearchText] = useState<string>('');

  /**
   * 过滤节点（搜索文本内容）
   */
  const filteredNodes = useMemo(() => {
    const trimmed = searchText.trim();
    if (!trimmed) return allNodes;

    const lowerSearch = trimmed.toLowerCase();

    return allNodes.filter(node => {
      // 1. 搜索节点编号
      if (node.nodeId.toString().includes(trimmed)) {
        return true;
      }

      // 2. 搜索文本内容（核心功能）
      if (node.text && node.text.toLowerCase().includes(lowerSearch)) {
        return true;
      }

      // 3. 搜索标签
      if (node.tags && node.tags.some(tag => tag.toLowerCase().includes(lowerSearch))) {
        return true;
      }

      return false;
    });
  }, [allNodes, searchText]);

  /**
   * 清空搜索
   */
  const clearSearch = () => {
    setSearchText('');
  };

  /**
   * 搜索结果统计
   */
  const searchStats = useMemo(() => {
    if (!searchText.trim()) return null;
    
    const byType = filteredNodes.reduce((acc, node) => {
      acc[node.nodeType] = (acc[node.nodeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: filteredNodes.length,
      byType: {
        start: byType.start || 0,
        normal: byType.normal || 0,
        ending: byType.ending || 0,
      }
    };
  }, [searchText, filteredNodes]);

  return {
    searchText,
    setSearchText,
    filteredNodes,
    clearSearch,
    searchStats,
  };
}

