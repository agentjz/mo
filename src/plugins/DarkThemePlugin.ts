/**
 * 暗夜主题插件
 * 职责：提供专业的暗色主题设计，参照 N8N 设计系统
 */

import { ThemePlugin, type ThemeDefinition } from './ThemePlugin';
import type { PluginMetadata } from '../plugin/types';

export class DarkThemePlugin extends ThemePlugin {
  metadata: PluginMetadata = {
    id: 'theme.dark',
    name: '夜间模式',
    version: '1.0.0',
    description: '舒适护眼的夜间主题，适合长时间编辑',
    author: '墨水官方',
    category: 'theme',
    tags: ['暗色', '夜间', '护眼'],
    conflicts: ['theme.light']
  };

  config = {
    enabled: false,
    settings: {}
  };

  getThemeDefinition(): ThemeDefinition {
    return {
      id: 'dark',
      name: '夜间模式',
      description: '舒适护眼的夜间主题',
      isDark: true,
      colors: {
        // 背景色 - N8N gray-670/740/820
        backgroundPrimary: 'hsl(220, 2%, 33%)',    // gray-670
        backgroundSecondary: 'hsl(220, 2%, 26%)',  // gray-740  
        backgroundGradient: 'linear-gradient(180deg, hsl(220, 2%, 33%) 0%, hsl(220, 1%, 18%) 100%)',
        
        // 文字颜色 - N8N gray-040/200/320 (浅色)
        textPrimary: 'hsl(220, 40%, 96%)',    // gray-040
        textSecondary: 'hsl(220, 18%, 80%)',  // gray-200
        textMuted: 'hsl(220, 10%, 68%)',      // gray-320
        
        // 品牌色
        brandPrimary: '#FF6D5A',
        brandSecondary: '#E85A48',
        brandGradient: 'linear-gradient(135deg, #FF6D5A 0%, #FF9472 100%)',
        
        // 功能色
        success: '#22c55e',
        warning: '#f97316',
        danger: 'hsl(355, 100%, 69%)',  // N8N dark mode error
        info: '#3b82f6',
        
        // 边框 - N8N gray-670/540
        border: 'hsl(220, 2%, 33%)',      // gray-670
        borderLight: 'hsl(220, 4%, 46%)', // gray-540
        borderFocus: '#FF6D5A',
        
        // 交互状态
        hover: 'hsla(220, 2%, 26%, 0.8)',   // gray-740 with alpha
        active: 'hsla(220, 1%, 18%, 0.9)',  // gray-820 with alpha
        selected: 'rgba(255, 109, 90, 0.2)',
        
        // 阴影
        shadow: 'rgba(0, 0, 0, 0.4)',
        shadowLight: 'rgba(0, 0, 0, 0.2)',
        shadowHeavy: 'rgba(0, 0, 0, 0.6)'
      },
      customCSS: `
        /* ===== 夜间模式 ===== */
        .theme-dark {
          color-scheme: dark;
        }
        
        /* === 全局样式 === */
        .theme-dark body {
          background: linear-gradient(180deg, hsl(220, 2%, 33%) 0%, hsl(220, 1%, 18%) 100%);
          color: hsl(220, 40%, 96%);
        }
        
        /* === 按钮样式 === */
        .theme-dark .btn-primary {
          background: linear-gradient(135deg, #FF6D5A 0%, #FF9472 100%);
          box-shadow: 0 2px 8px rgba(255, 109, 90, 0.4);
          color: #ffffff;
        }
        
        .theme-dark .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #E85A48 0%, #FF6D5A 100%);
          box-shadow: 0 4px 12px rgba(255, 109, 90, 0.6);
        }
        
        .theme-dark .btn-success {
          background: linear-gradient(135deg, #FF6D5A 0%, #FF9472 100%);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(255, 109, 90, 0.4);
        }
        
        .theme-dark .btn-success:hover:not(:disabled) {
          background: linear-gradient(135deg, #E85A48 0%, #FF6D5A 100%);
          box-shadow: 0 4px 12px rgba(255, 109, 90, 0.6);
        }
        
        .theme-dark .btn-secondary {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          color: hsl(220, 32%, 93%);      /* gray-070 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .btn-secondary:hover:not(:disabled) {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border-color: hsl(220, 4%, 46%);  /* gray-540 */
        }
        
        .theme-dark .btn-danger {
          background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
          color: #ffffff;
        }
        
        .theme-dark .btn-danger-confirm {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          animation: pulse-danger 1s infinite;
        }
        
        /* === 表单组件 === */
        .theme-dark .form-group input,
        .theme-dark .form-group textarea,
        .theme-dark .form-group select {
          background: hsl(220, 1%, 18%);    /* gray-820 */
          color: hsl(220, 40%, 96%);        /* gray-040 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .form-group input::placeholder,
        .theme-dark .form-group textarea::placeholder {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .form-group input:focus,
        .theme-dark .form-group textarea:focus,
        .theme-dark .form-group select:focus {
          border-color: #FF6D5A;
          box-shadow: 0 0 0 3px rgba(255, 109, 90, 0.2);
          background: hsl(220, 2%, 26%);  /* gray-740 */
        }
        
        .theme-dark .form-group label {
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        /* 下拉列表 option 样式 */
        .theme-dark select option {
          background: hsl(220, 1%, 18%);    /* gray-820 */
          color: hsl(220, 40%, 96%);        /* gray-040 */
        }
        
        .theme-dark select option:hover,
        .theme-dark select option:checked {
          background: hsl(220, 2%, 26%);    /* gray-740 */
          color: #FF6D5A;
        }
        
        /* === 卡片和面板 === */
        .theme-dark .section,
        .theme-dark .story-card,
        .theme-dark .plugin-card,
        .theme-dark .description-card,
        .theme-dark .login-card {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border: 2px solid hsl(220, 2%, 33%);  /* gray-670 */
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          color: hsl(220, 40%, 96%);  /* gray-040 - 设置默认文字颜色 */
        }
        
        .theme-dark .section:hover,
        .theme-dark .story-card:hover,
        .theme-dark .plugin-card:hover {
          border-color: #FF6D5A;
          box-shadow: 0 8px 24px rgba(255, 109, 90, 0.2);
        }
        
        /* === Dashboard 页面 === */
        .theme-dark .dashboard {
          background: hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .dashboard-header h1,
        .theme-dark .hero-title,
        .theme-dark .hero-title-inline,
        .theme-dark .community-title {
          color: #fae3e3 !important;
          background: none !important;
          -webkit-background-clip: unset !important;
          -webkit-text-fill-color: #fae3e3 !important;
          background-clip: unset !important;
        }
        
        .theme-dark .subtitle,
        .theme-dark .hero-subtitle,
        .theme-dark .hero-description {
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        .theme-dark .dashboard-user,
        .theme-dark .user-name,
        .theme-dark .user-email {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .dashboard-user button:hover {
          color: #FF6D5A;
        }
        
        .theme-dark .story-card h3 {
          color: #FF6D5A;
        }
        
        .theme-dark .story-description,
        .theme-dark .story-desc,
        .theme-dark .story-meta {
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        .theme-dark .story-stats {
          color: hsl(220, 10%, 68%);  /* gray-320 */
          border-top: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .empty-state {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        /* === 编辑器样式 === */
        .theme-dark .editor-container {
          background: hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .editor-sidebar {
          background: linear-gradient(180deg, hsl(220, 2%, 26%) 0%, hsl(220, 1%, 18%) 100%);
          border-right: 2px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .sidebar-title {
          background: linear-gradient(135deg, #FF6D5A 0%, #FF9472 50%, #FFB088 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .theme-dark .section h3 {
          color: hsl(220, 40%, 96%);  /* gray-040 */
        }
        
        .theme-dark .btn-back {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        .theme-dark .btn-back:hover {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border-color: #FF6D5A;
        }
        
        /* === 故事节点 (保持浅色以便阅读) === */
        .theme-dark .story-node {
          background: #ffffff;
          border: 2px solid hsl(220, 4%, 46%);  /* gray-540 */
          color: #1e293b;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
        }
        
        .theme-dark .story-node:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.8);
          border-color: #3b82f6;
        }
        
        .theme-dark .react-flow__node.selected .story-node {
          border-color: #3b82f6;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.25);
        }
        
        .theme-dark .node-header {
          border-bottom: 1px solid #e2e8f0;
        }
        
        .theme-dark .node-title {
          color: #1e293b;
        }
        
        .theme-dark .node-content {
          color: #475569;
        }
        
        .theme-dark .choice-item {
          background: rgba(248, 250, 252, 0.9);
          border: 1px solid #e2e8f0;
          color: #404040;
        }
        
        .theme-dark .choice-item:hover {
          background: rgba(241, 245, 249, 0.95);
          border-color: #cbd5e1;
        }
        
        .theme-dark .choice-text {
          color: #404040;
        }
        
        /* === React Flow === */
        .theme-dark .react-flow__edge-path {
          stroke: hsl(220, 4%, 58%) !important;  /* gray-420 */
        }
        
        .theme-dark .react-flow__edge:hover .react-flow__edge-path,
        .theme-dark .react-flow__edge.selected .react-flow__edge-path {
          stroke: #3b82f6 !important;
        }
        
        .theme-dark .react-flow__edge markerEnd,
        .theme-dark .react-flow__edge marker {
          fill: hsl(220, 4%, 58%) !important;  /* gray-420 */
        }
        
        .theme-dark .react-flow__edge:hover markerEnd,
        .theme-dark .react-flow__edge:hover marker,
        .theme-dark .react-flow__edge.selected markerEnd,
        .theme-dark .react-flow__edge.selected marker {
          fill: #3b82f6 !important;
        }
        
        /* === 编辑面板 === */
        .theme-dark .edit-panel {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        }
        
        .theme-dark .panel-header {
          border-bottom: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .panel-header h2 {
          color: hsl(220, 40%, 96%);  /* gray-040 */
        }
        
        .theme-dark .close-btn {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        /* === 模态框 === */
        .theme-dark .modal-overlay {
          background: rgba(0, 0, 0, 0.8);
        }
        
        .theme-dark .modal-content {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        }
        
        .theme-dark .modal-header {
          border-bottom: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .modal-header h2 {
          color: hsl(220, 40%, 96%);  /* gray-040 */
        }
        
        .theme-dark .modal-close {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .modal-close:hover {
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        .theme-dark .modal-description,
        .theme-dark .description-text {
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        .theme-dark .modal-hint,
        .theme-dark .form-hint {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        /* === 节点分析和标签 === */
        .theme-dark .node-count-badge {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          color: hsl(220, 18%, 80%);  /* gray-200 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .stat-item {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .stat-label {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .stat-value {
          color: hsl(220, 40%, 96%);  /* gray-040 */
        }
        
        .theme-dark .analysis-detail {
          border-top: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .analysis-detail h4 {
          color: hsl(220, 40%, 96%);  /* gray-040 */
        }
        
        .theme-dark .analysis-hint,
        .theme-dark .layout-hint {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .node-search-input {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          color: hsl(220, 40%, 96%);  /* gray-040 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .node-search-input::placeholder {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .search-stats {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          color: hsl(220, 18%, 80%);  /* gray-200 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .no-results {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .toggle-list-btn {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          color: hsl(220, 40%, 96%);  /* gray-040 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .toggle-list-btn:hover {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border-color: #FF6D5A;
        }
        
        .theme-dark .all-nodes-list {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        /* === 节点标签颜色 (保持区分度) === */
        .theme-dark .node-tag-decision {
          background: #7f1d1d;
          color: #fca5a5;
          border-color: #991b1b;
        }
        
        .theme-dark .node-tag-decision:hover {
          background: #991b1b;
          border-color: #b91c1c;
        }
        
        .theme-dark .node-tag-loop {
          background: #1e3a8a;
          color: #93c5fd;
          border-color: #1e40af;
        }
        
        .theme-dark .node-tag-loop:hover {
          background: #1e40af;
          border-color: #2563eb;
        }
        
        .theme-dark .node-tag-start {
          background: #14532d;
          color: #86efac;
          border-color: #166534;
        }
        
        .theme-dark .node-tag-start:hover {
          background: #166534;
          border-color: #15803d;
        }
        
        .theme-dark .node-tag-ending {
          background: #713f12;
          color: #fcd34d;
          border-color: #854d0e;
        }
        
        .theme-dark .node-tag-ending:hover {
          background: #854d0e;
          border-color: #a16207;
        }
        
        .theme-dark .node-tag-normal {
          background: hsl(220, 2%, 33%);  /* gray-670 */
          color: hsl(220, 18%, 80%);  /* gray-200 */
          border-color: hsl(220, 4%, 46%);  /* gray-540 */
        }
        
        .theme-dark .node-tag-normal:hover {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border-color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        /* === 验证结果 === */
        .theme-dark .validation-result {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .validation-result.valid {
          border-color: rgba(34, 197, 94, 0.5);
          background: rgba(20, 83, 45, 0.3);
        }
        
        .theme-dark .validation-result.invalid {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(127, 29, 29, 0.3);
        }
        
        .theme-dark .help ul li,
        .theme-dark .help div {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .help ul li::before {
          color: #FF6D5A;
        }
        
        /* === 滚动条 === */
        .theme-dark ::-webkit-scrollbar-track {
          background: hsl(220, 1%, 18%);  /* gray-820 */
        }
        
        .theme-dark ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, hsl(220, 2%, 33%) 0%, hsl(220, 4%, 46%) 100%);
        }
        
        .theme-dark ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, hsl(220, 4%, 46%) 0%, hsl(220, 4%, 58%) 100%);
        }
        
        /* === 插件商店 === */
        .theme-dark .plugin-store-container {
          background: hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .plugin-store-header h1 {
          background: linear-gradient(135deg, #FF6D5A 0%, #FF9472 50%, #FFB088 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .theme-dark .plugin-store-header .subtitle {
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        .theme-dark .plugin-filter-bar {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border: 2px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .filter-btn {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          color: hsl(220, 40%, 96%);  /* gray-040 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .filter-btn.search-input {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          color: hsl(220, 40%, 96%);  /* gray-040 */
        }
        
        .theme-dark .filter-btn.search-input::placeholder {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .filter-btn:hover {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border-color: #FF6D5A;
        }
        
        .theme-dark .filter-btn.active {
          background: linear-gradient(135deg, #FF6D5A 0%, #FF9472 100%);
          color: #ffffff;
          border-color: transparent;
        }
        
        .theme-dark .filter-divider {
          background: hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .plugin-category {
          margin-bottom: 40px;
        }
        
        .theme-dark .category-title {
          color: hsl(220, 40%, 96%);  /* gray-040 */
        }
        
        .theme-dark .category-badge {
          background: linear-gradient(135deg, #FF6D5A 0%, #FF9472 100%);
          color: #ffffff;
        }
        
        .theme-dark .plugin-card {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border: 2px solid hsl(220, 2%, 33%);  /* gray-670 */
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        
        .theme-dark .plugin-card:hover {
          border-color: #FF6D5A;
          box-shadow: 0 8px 24px rgba(255, 109, 90, 0.2);
        }
        
        .theme-dark .plugin-card.enabled {
          border-color: #22c55e;
          background: hsl(220, 2%, 26%);  /* gray-740 */
        }
        
        .theme-dark .plugin-card.disabled {
          opacity: 0.6;
        }
        
        .theme-dark .plugin-icon {
          background: linear-gradient(135deg, #FF6D5A 0%, #FF9472 100%);
          color: #ffffff;
          box-shadow: 0 2px 4px rgba(255, 109, 90, 0.3);
        }
        
        .theme-dark .theme-icon {
          background: linear-gradient(135deg, #fda4af 0%, #f87171 100%);
        }
        
        .theme-dark .plugin-name {
          color: hsl(220, 40%, 96%);  /* gray-040 */
        }
        
        .theme-dark .plugin-version {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .toggle-slider {
          background-color: hsl(220, 4%, 46%);  /* gray-540 */
        }
        
        .theme-dark .toggle-slider:before {
          background-color: hsl(220, 25%, 88%);  /* gray-120 */
        }
        
        .theme-dark .toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, #FF6D5A 0%, #FF9472 100%);
        }
        
        .theme-dark .plugin-description {
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        .theme-dark .plugin-meta {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .plugin-author {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .plugin-tag {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          color: #FF6D5A;
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .plugin-requires {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #fbbf24;
        }
        
        .theme-dark .theme-notice {
          color: #fbbf24;
        }
        
        .theme-dark .empty-state {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .btn-icon {
          background: hsl(220, 1%, 18%);  /* gray-820 */
          border: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
          color: hsl(220, 18%, 80%);  /* gray-200 */
        }
        
        .theme-dark .btn-icon:hover {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border-color: #FF6D5A;
        }
        
        .theme-dark .btn-icon.btn-danger {
          background: rgba(127, 29, 29, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
          color: #fca5a5;
        }
        
        .theme-dark .btn-icon.btn-danger:hover {
          background: rgba(153, 27, 27, 0.5);
          border-color: #dc2626;
        }
        
        .theme-dark .btn-delete-small {
          background: rgba(127, 29, 29, 0.3);
          color: #fca5a5;
        }
        
        .theme-dark .btn-delete-small:hover {
          background: rgba(153, 27, 27, 0.5);
        }
        
        /* === Landing 页面 === */
        .theme-dark .landing {
          background-color: hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .qr-container {
          background: hsl(220, 2%, 26%);  /* gray-740 */
          border: 2px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        /* === 登录标签页 === */
        .theme-dark .login-tabs {
          border-bottom: 1px solid hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .login-tab {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        .theme-dark .login-tab.active {
          color: #FF6D5A;
          border-bottom: 2px solid #FF6D5A;
        }
        
        .theme-dark .login-hint {
          color: hsl(220, 18%, 80%);  /* gray-200 */
          background: rgba(255, 109, 90, 0.1);
        }
        
        .theme-dark .login-divider::before,
        .theme-dark .login-divider::after {
          background: hsl(220, 2%, 33%);  /* gray-670 */
        }
        
        .theme-dark .login-divider span,
        .theme-dark .login-note {
          color: hsl(220, 10%, 68%);  /* gray-320 */
        }
        
        /* === 自动保存提示 === */
        .theme-dark .auto-save-hint {
          color: hsl(220, 10%, 68%);  /* gray-320 */
          background: hsl(220, 1%, 18%);  /* gray-820 */
        }

        /* === 移动端适配 === */
        @media (max-width: 768px) {
          .theme-dark .mobile-menu-btn {
            background: hsl(220, 2%, 26%);
            border: 2px solid hsl(220, 2%, 33%);
            color: #FF6D5A;
          }
          
          .theme-dark .mobile-menu-btn:hover {
            background: hsl(220, 2%, 33%);
            border-color: #FF6D5A;
          }
          
          .theme-dark .mobile-close-btn {
            background: hsl(220, 1%, 18%);
            border: 1px solid hsl(220, 2%, 33%);
            color: #FF6D5A;
          }
          
          .theme-dark .mobile-close-btn:hover {
            background: hsl(220, 2%, 26%);
          }
        }
      `
    };
  }
}
