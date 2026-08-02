/**
 * Catppuccin Frappé 主题插件
 * 职责：提供Catppuccin的中性暗色Frappé配色方案
 */

import { ThemePlugin, type ThemeDefinition } from './ThemePlugin';
import type { PluginMetadata } from '../plugin/types';

export class CatppuccinFrappeThemePlugin extends ThemePlugin {
  metadata: PluginMetadata = {
    id: 'theme.catppuccin.frappe',
    name: 'Catppuccin Frappé',
    version: '1.0.0',
    description: '柔和的中性暗色主题，低对比度护眼设计',
    author: 'Catppuccin Community',
    category: 'theme',
    tags: ['暗色', '柔和', 'Catppuccin'],
    conflicts: ['theme.light', 'theme.dark', 'theme.catppuccin.latte', 'theme.catppuccin.macchiato', 'theme.catppuccin.mocha']
  };

  config = {
    enabled: false,
    settings: {}
  };

  getThemeDefinition(): ThemeDefinition {
    return {
      id: 'catppuccin-frappe',
      name: 'Catppuccin Frappé',
      description: '柔和的中性暗色主题',
      isDark: true,
      colors: {
        backgroundPrimary: '#303446',     // base
        backgroundSecondary: '#292c3c',   // mantle
        backgroundGradient: 'linear-gradient(180deg, #303446 0%, #232634 100%)',
        
        textPrimary: '#c6d0f5',           // text
        textSecondary: '#b5bfe2',         // subtext1
        textMuted: '#a5adce',             // subtext0
        
        brandPrimary: '#f4b8e4',          // pink
        brandSecondary: '#ca9ee6',        // mauve
        brandGradient: 'linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 100%)',
        
        success: '#a6d189',               // green
        warning: '#e5c890',               // yellow
        danger: '#e78284',                // red
        info: '#8caaee',                  // blue
        
        border: '#626880',                // surface2
        borderLight: '#51576d',           // surface1
        borderFocus: '#f4b8e4',           // pink
        
        hover: 'rgba(244, 184, 228, 0.12)',
        active: 'rgba(244, 184, 228, 0.18)',
        selected: 'rgba(244, 184, 228, 0.22)',
        
        shadow: 'rgba(0, 0, 0, 0.35)',
        shadowLight: 'rgba(0, 0, 0, 0.18)',
        shadowHeavy: 'rgba(0, 0, 0, 0.5)'
      },
      customCSS: `
        /* ===== Catppuccin Frappé 主题 ===== */
        .theme-dark {
          color-scheme: dark;
        }
        
        /* === 全局样式 === */
        .theme-dark body {
          background: linear-gradient(180deg, #303446 0%, #232634 100%);
          color: #c6d0f5;
        }
        
        /* === 按钮样式 === */
        .theme-dark .btn-primary {
          background: linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 100%);
          box-shadow: 0 2px 8px rgba(244, 184, 228, 0.35);
          color: #303446;
        }
        
        .theme-dark .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #e8a5d8 0%, #bba0dc 100%);
          box-shadow: 0 4px 12px rgba(244, 184, 228, 0.5);
        }
        
        .theme-dark .btn-success {
          background: linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 100%);
          color: #303446;
          box-shadow: 0 2px 8px rgba(244, 184, 228, 0.35);
        }
        
        .theme-dark .btn-success:hover:not(:disabled) {
          background: linear-gradient(135deg, #e8a5d8 0%, #bba0dc 100%);
          box-shadow: 0 4px 12px rgba(244, 184, 228, 0.5);
        }
        
        .theme-dark .btn-secondary {
          background: #232634;
          color: #b5bfe2;
          border: 1px solid #51576d;
        }
        
        .theme-dark .btn-secondary:hover:not(:disabled) {
          background: #292c3c;
          border-color: #626880;
        }
        
        .theme-dark .btn-danger {
          background: linear-gradient(135deg, #c85a5c 0%, #e78284 100%);
          color: #303446;
        }
        
        .theme-dark .btn-danger-confirm {
          background: linear-gradient(135deg, #e78284 0%, #ea999c 100%);
          color: #303446;
          animation: pulse-danger 1s infinite;
        }
        
        /* === 表单组件 === */
        .theme-dark .form-group input,
        .theme-dark .form-group textarea,
        .theme-dark .form-group select {
          background: #232634;
          color: #c6d0f5;
          border: 1px solid #51576d;
        }
        
        .theme-dark .form-group input::placeholder,
        .theme-dark .form-group textarea::placeholder {
          color: #a5adce;
        }
        
        .theme-dark .form-group input:focus,
        .theme-dark .form-group textarea:focus,
        .theme-dark .form-group select:focus {
          border-color: #f4b8e4;
          box-shadow: 0 0 0 3px rgba(244, 184, 228, 0.15);
          background: #292c3c;
        }
        
        .theme-dark .form-group label {
          color: #b5bfe2;
        }
        
        .theme-dark select option {
          background: #232634;
          color: #c6d0f5;
        }
        
        .theme-dark select option:hover,
        .theme-dark select option:checked {
          background: #292c3c;
          color: #f4b8e4;
        }
        
        /* === 卡片和面板 === */
        .theme-dark .section,
        .theme-dark .story-card,
        .theme-dark .plugin-card,
        .theme-dark .description-card,
        .theme-dark .login-card {
          background: #292c3c;
          border: 2px solid #414559;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          color: #c6d0f5;
        }
        
        .theme-dark .section:hover,
        .theme-dark .story-card:hover,
        .theme-dark .plugin-card:hover {
          border-color: #f4b8e4;
          box-shadow: 0 8px 24px rgba(244, 184, 228, 0.18);
        }
        
        /* === Dashboard 页面 === */
        .theme-dark .dashboard {
          background: #303446;
        }
        
        .theme-dark .dashboard-header h1,
        .theme-dark .hero-title,
        .theme-dark .hero-title-inline,
        .theme-dark .community-title {
          color: #c6d0f5 !important;
          background: none !important;
          -webkit-background-clip: unset !important;
          -webkit-text-fill-color: #c6d0f5 !important;
          background-clip: unset !important;
        }
        
        .theme-dark .subtitle,
        .theme-dark .hero-subtitle,
        .theme-dark .hero-description {
          color: #b5bfe2;
        }
        
        .theme-dark .dashboard-user,
        .theme-dark .user-name,
        .theme-dark .user-email {
          color: #a5adce;
        }
        
        .theme-dark .dashboard-user button:hover {
          color: #f4b8e4;
        }
        
        .theme-dark .story-card h3 {
          color: #f4b8e4;
        }
        
        .theme-dark .story-description,
        .theme-dark .story-desc,
        .theme-dark .story-meta {
          color: #b5bfe2;
        }
        
        .theme-dark .story-stats {
          color: #a5adce;
          border-top: 1px solid #414559;
        }
        
        .theme-dark .empty-state {
          color: #a5adce;
        }
        
        /* === 编辑器样式 === */
        .theme-dark .editor-container {
          background: #303446;
        }
        
        .theme-dark .editor-sidebar {
          background: linear-gradient(180deg, #292c3c 0%, #232634 100%);
          border-right: 2px solid #414559;
        }
        
        .theme-dark .sidebar-title {
          background: linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 50%, #babbf1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .theme-dark .section h3 {
          color: #c6d0f5;
        }
        
        .theme-dark .btn-back {
          background: #232634;
          border: 1px solid #51576d;
          color: #b5bfe2;
        }
        
        .theme-dark .btn-back:hover {
          background: #292c3c;
          border-color: #f4b8e4;
        }
        
        /* === 故事节点 === */
        .theme-dark .story-node {
          background: #ffffff;
          border: 2px solid #626880;
          color: #4c4f69;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        
        .theme-dark .story-node:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.65);
          border-color: #8caaee;
        }
        
        .theme-dark .react-flow__node.selected .story-node {
          border-color: #8caaee;
          box-shadow: 0 0 0 8px rgba(140, 170, 238, 0.22);
        }
        
        .theme-dark .node-header {
          border-bottom: 1px solid #e6e9ef;
        }
        
        .theme-dark .node-title {
          color: #4c4f69;
        }
        
        .theme-dark .node-content {
          color: #5c5f77;
        }
        
        .theme-dark .choice-item {
          background: rgba(248, 250, 252, 0.9);
          border: 1px solid #e2e8f0;
          color: #4c4f69;
        }
        
        .theme-dark .choice-item:hover {
          background: rgba(241, 245, 249, 0.95);
          border-color: #cbd5e1;
        }
        
        .theme-dark .choice-text {
          color: #4c4f69;
        }
        
        /* === React Flow === */
        .theme-dark .react-flow__edge-path {
          stroke: #737994 !important;
        }
        
        .theme-dark .react-flow__edge:hover .react-flow__edge-path,
        .theme-dark .react-flow__edge.selected .react-flow__edge-path {
          stroke: #8caaee !important;
        }
        
        .theme-dark .react-flow__edge markerEnd,
        .theme-dark .react-flow__edge marker {
          fill: #737994 !important;
        }
        
        .theme-dark .react-flow__edge:hover markerEnd,
        .theme-dark .react-flow__edge:hover marker,
        .theme-dark .react-flow__edge.selected markerEnd,
        .theme-dark .react-flow__edge.selected marker {
          fill: #8caaee !important;
        }
        
        /* === 编辑面板 === */
        .theme-dark .edit-panel {
          background: #292c3c;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }
        
        .theme-dark .panel-header {
          border-bottom: 1px solid #414559;
        }
        
        .theme-dark .panel-header h2 {
          color: #c6d0f5;
        }
        
        .theme-dark .close-btn {
          color: #a5adce;
        }
        
        .theme-dark .close-btn:hover {
          background: rgba(231, 130, 132, 0.18);
          color: #e78284;
        }
        
        /* === 模态框 === */
        .theme-dark .modal-overlay {
          background: rgba(0, 0, 0, 0.7);
        }
        
        .theme-dark .modal-content {
          background: #292c3c;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.65);
        }
        
        .theme-dark .modal-header {
          border-bottom: 1px solid #414559;
        }
        
        .theme-dark .modal-header h2 {
          color: #c6d0f5;
        }
        
        .theme-dark .modal-close {
          color: #a5adce;
        }
        
        .theme-dark .modal-close:hover {
          color: #b5bfe2;
        }
        
        .theme-dark .modal-description,
        .theme-dark .description-text {
          color: #b5bfe2;
        }
        
        .theme-dark .modal-hint,
        .theme-dark .form-hint {
          color: #a5adce;
        }
        
        /* === 节点分析和标签 === */
        .theme-dark .node-count-badge {
          background: #232634;
          color: #b5bfe2;
          border: 1px solid #51576d;
        }
        
        .theme-dark .stat-item {
          background: #232634;
          border: 1px solid #51576d;
        }
        
        .theme-dark .stat-label {
          color: #a5adce;
        }
        
        .theme-dark .stat-value {
          color: #c6d0f5;
        }
        
        .theme-dark .analysis-detail {
          border-top: 1px solid #414559;
        }
        
        .theme-dark .analysis-detail h4 {
          color: #c6d0f5;
        }
        
        .theme-dark .analysis-hint,
        .theme-dark .layout-hint {
          color: #a5adce;
        }
        
        .theme-dark .node-search-input {
          background: #232634;
          color: #c6d0f5;
          border: 1px solid #51576d;
        }
        
        .theme-dark .node-search-input::placeholder {
          color: #a5adce;
        }
        
        .theme-dark .search-stats {
          background: #232634;
          color: #b5bfe2;
          border: 1px solid #51576d;
        }
        
        .theme-dark .no-results {
          color: #a5adce;
        }
        
        .theme-dark .toggle-list-btn {
          background: #232634;
          color: #c6d0f5;
          border: 1px solid #51576d;
        }
        
        .theme-dark .toggle-list-btn:hover {
          background: #292c3c;
          border-color: #f4b8e4;
        }
        
        .theme-dark .all-nodes-list {
          background: #232634;
          border: 1px solid #51576d;
        }
        
        /* === 节点标签颜色 === */
        .theme-dark .node-tag-decision {
          background: #4a2a2d;
          color: #eebebe;
          border-color: #e78284;
        }
        
        .theme-dark .node-tag-decision:hover {
          background: #5a3538;
          border-color: #ea999c;
        }
        
        .theme-dark .node-tag-loop {
          background: #2a364a;
          color: #babbf1;
          border-color: #8caaee;
        }
        
        .theme-dark .node-tag-loop:hover {
          background: #354152;
          border-color: #99d1db;
        }
        
        .theme-dark .node-tag-start {
          background: #2d4033;
          color: #a6d189;
          border-color: #81c8be;
        }
        
        .theme-dark .node-tag-start:hover {
          background: #374d3e;
          border-color: #a6d189;
        }
        
        .theme-dark .node-tag-ending {
          background: #4a422a;
          color: #e5c890;
          border-color: #ef9f76;
        }
        
        .theme-dark .node-tag-ending:hover {
          background: #5a4f35;
          border-color: #e5c890;
        }
        
        .theme-dark .node-tag-normal {
          background: #414559;
          color: #b5bfe2;
          border-color: #626880;
        }
        
        .theme-dark .node-tag-normal:hover {
          background: #51576d;
          border-color: #737994;
        }
        
        /* === 验证结果 === */
        .theme-dark .validation-result {
          background: #292c3c;
          border: 1px solid #414559;
        }
        
        .theme-dark .validation-result.valid {
          border-color: rgba(166, 209, 137, 0.4);
          background: rgba(166, 209, 137, 0.12);
        }
        
        .theme-dark .validation-result.invalid {
          border-color: rgba(231, 130, 132, 0.4);
          background: rgba(231, 130, 132, 0.12);
        }
        
        .theme-dark .help ul li,
        .theme-dark .help div {
          color: #a5adce;
        }
        
        .theme-dark .help ul li::before {
          color: #f4b8e4;
        }
        
        /* === 滚动条 === */
        .theme-dark ::-webkit-scrollbar-track {
          background: #232634;
        }
        
        .theme-dark ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #51576d 0%, #626880 100%);
        }
        
        .theme-dark ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #626880 0%, #737994 100%);
        }
        
        /* === 插件商店 === */
        .theme-dark .plugin-store-container {
          background: #303446;
        }
        
        .theme-dark .plugin-store-header h1 {
          background: linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 50%, #babbf1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .theme-dark .plugin-store-header .subtitle {
          color: #b5bfe2;
        }
        
        .theme-dark .plugin-filter-bar {
          background: #292c3c;
          border: 2px solid #414559;
        }
        
        .theme-dark .filter-btn {
          background: #232634;
          color: #c6d0f5;
          border: 1px solid #51576d;
        }
        
        .theme-dark .filter-btn.search-input {
          background: #232634;
          color: #c6d0f5;
        }
        
        .theme-dark .filter-btn.search-input::placeholder {
          color: #a5adce;
        }
        
        .theme-dark .filter-btn:hover {
          background: #292c3c;
          border-color: #f4b8e4;
        }
        
        .theme-dark .filter-btn.active {
          background: linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 100%);
          color: #303446;
          border-color: transparent;
        }
        
        .theme-dark .filter-divider {
          background: #414559;
        }
        
        .theme-dark .plugin-category {
          margin-bottom: 40px;
        }
        
        .theme-dark .category-title {
          color: #c6d0f5;
        }
        
        .theme-dark .category-badge {
          background: linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 100%);
          color: #303446;
        }
        
        .theme-dark .plugin-card {
          background: #292c3c;
          border: 2px solid #414559;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }
        
        .theme-dark .plugin-card:hover {
          border-color: #f4b8e4;
          box-shadow: 0 8px 24px rgba(244, 184, 228, 0.18);
        }
        
        .theme-dark .plugin-card.enabled {
          border-color: #a6d189;
          background: #292c3c;
        }
        
        .theme-dark .plugin-card.disabled {
          opacity: 0.6;
        }
        
        .theme-dark .plugin-icon {
          background: linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 100%);
          color: #303446;
          box-shadow: 0 2px 4px rgba(244, 184, 228, 0.25);
        }
        
        .theme-dark .theme-icon {
          background: linear-gradient(135deg, #eebebe 0%, #f4b8e4 100%);
        }
        
        .theme-dark .plugin-name {
          color: #c6d0f5;
        }
        
        .theme-dark .plugin-version {
          color: #a5adce;
        }
        
        .theme-dark .toggle-slider {
          background-color: #626880;
        }
        
        .theme-dark .toggle-slider:before {
          background-color: #c6d0f5;
        }
        
        .theme-dark .toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, #f4b8e4 0%, #ca9ee6 100%);
        }
        
        .theme-dark .plugin-description {
          color: #b5bfe2;
        }
        
        .theme-dark .plugin-meta {
          color: #a5adce;
        }
        
        .theme-dark .plugin-author {
          color: #a5adce;
        }
        
        .theme-dark .plugin-tag {
          background: #232634;
          color: #f4b8e4;
          border: 1px solid #51576d;
        }
        
        .theme-dark .plugin-requires {
          background: rgba(229, 200, 144, 0.12);
          border: 1px solid rgba(229, 200, 144, 0.3);
          color: #e5c890;
        }
        
        .theme-dark .theme-notice {
          color: #e5c890;
        }
        
        .theme-dark .empty-state {
          color: #a5adce;
        }
        
        .theme-dark .btn-icon {
          background: #232634;
          border: 1px solid #51576d;
          color: #b5bfe2;
        }
        
        .theme-dark .btn-icon:hover {
          background: #292c3c;
          border-color: #f4b8e4;
        }
        
        .theme-dark .btn-icon.btn-danger {
          background: rgba(231, 130, 132, 0.12);
          border-color: rgba(231, 130, 132, 0.35);
          color: #eebebe;
        }
        
        .theme-dark .btn-icon.btn-danger:hover {
          background: rgba(231, 130, 132, 0.22);
          border-color: #e78284;
        }
        
        .theme-dark .btn-delete-small {
          background: rgba(231, 130, 132, 0.12);
          color: #eebebe;
        }
        
        .theme-dark .btn-delete-small:hover {
          background: rgba(231, 130, 132, 0.22);
        }
        
        /* === Landing 页面 === */
        .theme-dark .landing {
          background-color: #303446;
        }
        
        .theme-dark .qr-container {
          background: #292c3c;
          border: 2px solid #414559;
        }
        
        /* === 登录标签页 === */
        .theme-dark .login-tabs {
          border-bottom: 1px solid #414559;
        }
        
        .theme-dark .login-tab {
          color: #a5adce;
        }
        
        .theme-dark .login-tab.active {
          color: #f4b8e4;
          border-bottom: 2px solid #f4b8e4;
        }
        
        .theme-dark .login-hint {
          color: #b5bfe2;
          background: rgba(244, 184, 228, 0.12);
        }
        
        .theme-dark .login-divider::before,
        .theme-dark .login-divider::after {
          background: #414559;
        }
        
        .theme-dark .login-divider span,
        .theme-dark .login-note {
          color: #a5adce;
        }
        
        /* === 自动保存提示 === */
        .theme-dark .auto-save-hint {
          color: #a5adce;
          background: #232634;
        }

        /* === 移动端适配 === */
        @media (max-width: 768px) {
          .theme-dark .mobile-menu-btn {
            background: #292c3c;
            border: 2px solid #414559;
            color: #f4b8e4;
          }
          
          .theme-dark .mobile-menu-btn:hover {
            background: #303446;
            border-color: #f4b8e4;
          }
          
          .theme-dark .mobile-close-btn {
            background: #232634;
            border: 1px solid #51576d;
            color: #f4b8e4;
          }
          
          .theme-dark .mobile-close-btn:hover {
            background: #292c3c;
          }
        }
      `
    };
  }
}

