/**
 * Catppuccin Mocha 主题插件
 * 职责：提供Catppuccin的深暗色Mocha配色方案
 */

import { ThemePlugin, type ThemeDefinition } from './ThemePlugin';
import type { PluginMetadata } from '../plugin/types';

export class CatppuccinMochaThemePlugin extends ThemePlugin {
  metadata: PluginMetadata = {
    id: 'theme.catppuccin.mocha',
    name: 'Catppuccin Mocha',
    version: '1.0.0',
    description: '深邃的暗黑主题，减少屏幕眩光，极致护眼',
    author: 'Catppuccin Community',
    category: 'theme',
    tags: ['暗色', '深邃', 'Catppuccin'],
    conflicts: ['theme.light', 'theme.dark', 'theme.catppuccin.latte', 'theme.catppuccin.frappe', 'theme.catppuccin.macchiato']
  };

  config = {
    enabled: false,
    settings: {}
  };

  getThemeDefinition(): ThemeDefinition {
    return {
      id: 'catppuccin-mocha',
      name: 'Catppuccin Mocha',
      description: '深邃的暗黑主题',
      isDark: true,
      colors: {
        backgroundPrimary: '#1e1e2e',     // base
        backgroundSecondary: '#181825',   // mantle
        backgroundGradient: 'linear-gradient(180deg, #1e1e2e 0%, #11111b 100%)',
        
        textPrimary: '#cdd6f4',           // text
        textSecondary: '#bac2de',         // subtext1
        textMuted: '#a6adc8',             // subtext0
        
        brandPrimary: '#f5c2e7',          // pink
        brandSecondary: '#cba6f7',        // mauve
        brandGradient: 'linear-gradient(135deg, #f5c2e7 0%, #cba6f7 100%)',
        
        success: '#a6e3a1',               // green
        warning: '#f9e2af',               // yellow
        danger: '#f38ba8',                // red
        info: '#89b4fa',                  // blue
        
        border: '#585b70',                // surface2
        borderLight: '#45475a',           // surface1
        borderFocus: '#f5c2e7',           // pink
        
        hover: 'rgba(245, 194, 231, 0.12)',
        active: 'rgba(245, 194, 231, 0.18)',
        selected: 'rgba(245, 194, 231, 0.22)',
        
        shadow: 'rgba(0, 0, 0, 0.45)',
        shadowLight: 'rgba(0, 0, 0, 0.25)',
        shadowHeavy: 'rgba(0, 0, 0, 0.6)'
      },
      customCSS: `
        /* ===== Catppuccin Mocha 主题 ===== */
        .theme-dark {
          color-scheme: dark;
        }
        
        /* === 全局样式 === */
        .theme-dark body {
          background: linear-gradient(180deg, #1e1e2e 0%, #11111b 100%);
          color: #cdd6f4;
        }
        
        /* === 按钮样式 === */
        .theme-dark .btn-primary {
          background: linear-gradient(135deg, #f5c2e7 0%, #cba6f7 100%);
          box-shadow: 0 2px 8px rgba(245, 194, 231, 0.45);
          color: #1e1e2e;
        }
        
        .theme-dark .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #e9b0da 0%, #bb94ed 100%);
          box-shadow: 0 4px 12px rgba(245, 194, 231, 0.6);
        }
        
        .theme-dark .btn-success {
          background: linear-gradient(135deg, #f5c2e7 0%, #cba6f7 100%);
          color: #1e1e2e;
          box-shadow: 0 2px 8px rgba(245, 194, 231, 0.45);
        }
        
        .theme-dark .btn-success:hover:not(:disabled) {
          background: linear-gradient(135deg, #e9b0da 0%, #bb94ed 100%);
          box-shadow: 0 4px 12px rgba(245, 194, 231, 0.6);
        }
        
        .theme-dark .btn-secondary {
          background: #11111b;
          color: #bac2de;
          border: 1px solid #45475a;
        }
        
        .theme-dark .btn-secondary:hover:not(:disabled) {
          background: #181825;
          border-color: #585b70;
        }
        
        .theme-dark .btn-danger {
          background: linear-gradient(135deg, #c76d86 0%, #f38ba8 100%);
          color: #1e1e2e;
        }
        
        .theme-dark .btn-danger-confirm {
          background: linear-gradient(135deg, #f38ba8 0%, #eba0ac 100%);
          color: #1e1e2e;
          animation: pulse-danger 1s infinite;
        }
        
        /* === 表单组件 === */
        .theme-dark .form-group input,
        .theme-dark .form-group textarea,
        .theme-dark .form-group select {
          background: #11111b;
          color: #cdd6f4;
          border: 1px solid #45475a;
        }
        
        .theme-dark .form-group input::placeholder,
        .theme-dark .form-group textarea::placeholder {
          color: #a6adc8;
        }
        
        .theme-dark .form-group input:focus,
        .theme-dark .form-group textarea:focus,
        .theme-dark .form-group select:focus {
          border-color: #f5c2e7;
          box-shadow: 0 0 0 3px rgba(245, 194, 231, 0.15);
          background: #181825;
        }
        
        .theme-dark .form-group label {
          color: #bac2de;
        }
        
        .theme-dark select option {
          background: #11111b;
          color: #cdd6f4;
        }
        
        .theme-dark select option:hover,
        .theme-dark select option:checked {
          background: #181825;
          color: #f5c2e7;
        }
        
        /* === 卡片和面板 === */
        .theme-dark .section,
        .theme-dark .story-card,
        .theme-dark .plugin-card,
        .theme-dark .description-card,
        .theme-dark .login-card {
          background: #181825;
          border: 2px solid #313244;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
          color: #cdd6f4;
        }
        
        .theme-dark .section:hover,
        .theme-dark .story-card:hover,
        .theme-dark .plugin-card:hover {
          border-color: #f5c2e7;
          box-shadow: 0 8px 24px rgba(245, 194, 231, 0.18);
        }
        
        /* === Dashboard 页面 === */
        .theme-dark .dashboard {
          background: #1e1e2e;
        }
        
        .theme-dark .dashboard-header h1,
        .theme-dark .hero-title,
        .theme-dark .hero-title-inline,
        .theme-dark .community-title {
          color: #cdd6f4 !important;
          background: none !important;
          -webkit-background-clip: unset !important;
          -webkit-text-fill-color: #cdd6f4 !important;
          background-clip: unset !important;
        }
        
        .theme-dark .subtitle,
        .theme-dark .hero-subtitle,
        .theme-dark .hero-description {
          color: #bac2de;
        }
        
        .theme-dark .dashboard-user,
        .theme-dark .user-name,
        .theme-dark .user-email {
          color: #a6adc8;
        }
        
        .theme-dark .dashboard-user button:hover {
          color: #f5c2e7;
        }
        
        .theme-dark .story-card h3 {
          color: #f5c2e7;
        }
        
        .theme-dark .story-description,
        .theme-dark .story-desc,
        .theme-dark .story-meta {
          color: #bac2de;
        }
        
        .theme-dark .story-stats {
          color: #a6adc8;
          border-top: 1px solid #313244;
        }
        
        .theme-dark .empty-state {
          color: #a6adc8;
        }
        
        /* === 编辑器样式 === */
        .theme-dark .editor-container {
          background: #1e1e2e;
        }
        
        .theme-dark .editor-sidebar {
          background: linear-gradient(180deg, #181825 0%, #11111b 100%);
          border-right: 2px solid #313244;
        }
        
        .theme-dark .sidebar-title {
          background: linear-gradient(135deg, #f5c2e7 0%, #cba6f7 50%, #b4befe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .theme-dark .section h3 {
          color: #cdd6f4;
        }
        
        .theme-dark .btn-back {
          background: #11111b;
          border: 1px solid #45475a;
          color: #bac2de;
        }
        
        .theme-dark .btn-back:hover {
          background: #181825;
          border-color: #f5c2e7;
        }
        
        /* === 故事节点 === */
        .theme-dark .story-node {
          background: #ffffff;
          border: 2px solid #585b70;
          color: #4c4f69;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
        }
        
        .theme-dark .story-node:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.75);
          border-color: #89b4fa;
        }
        
        .theme-dark .react-flow__node.selected .story-node {
          border-color: #89b4fa;
          box-shadow: 0 0 0 8px rgba(137, 180, 250, 0.22);
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
          stroke: #6c7086 !important;
        }
        
        .theme-dark .react-flow__edge:hover .react-flow__edge-path,
        .theme-dark .react-flow__edge.selected .react-flow__edge-path {
          stroke: #89b4fa !important;
        }
        
        .theme-dark .react-flow__edge markerEnd,
        .theme-dark .react-flow__edge marker {
          fill: #6c7086 !important;
        }
        
        .theme-dark .react-flow__edge:hover markerEnd,
        .theme-dark .react-flow__edge:hover marker,
        .theme-dark .react-flow__edge.selected markerEnd,
        .theme-dark .react-flow__edge.selected marker {
          fill: #89b4fa !important;
        }
        
        /* === 编辑面板 === */
        .theme-dark .edit-panel {
          background: #181825;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        }
        
        .theme-dark .panel-header {
          border-bottom: 1px solid #313244;
        }
        
        .theme-dark .panel-header h2 {
          color: #cdd6f4;
        }
        
        .theme-dark .close-btn {
          color: #a6adc8;
        }
        
        .theme-dark .close-btn:hover {
          background: rgba(243, 139, 168, 0.18);
          color: #f38ba8;
        }
        
        /* === 模态框 === */
        .theme-dark .modal-overlay {
          background: rgba(0, 0, 0, 0.8);
        }
        
        .theme-dark .modal-content {
          background: #181825;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75);
        }
        
        .theme-dark .modal-header {
          border-bottom: 1px solid #313244;
        }
        
        .theme-dark .modal-header h2 {
          color: #cdd6f4;
        }
        
        .theme-dark .modal-close {
          color: #a6adc8;
        }
        
        .theme-dark .modal-close:hover {
          color: #bac2de;
        }
        
        .theme-dark .modal-description,
        .theme-dark .description-text {
          color: #bac2de;
        }
        
        .theme-dark .modal-hint,
        .theme-dark .form-hint {
          color: #a6adc8;
        }
        
        /* === 节点分析和标签 === */
        .theme-dark .node-count-badge {
          background: #11111b;
          color: #bac2de;
          border: 1px solid #45475a;
        }
        
        .theme-dark .stat-item {
          background: #11111b;
          border: 1px solid #45475a;
        }
        
        .theme-dark .stat-label {
          color: #a6adc8;
        }
        
        .theme-dark .stat-value {
          color: #cdd6f4;
        }
        
        .theme-dark .analysis-detail {
          border-top: 1px solid #313244;
        }
        
        .theme-dark .analysis-detail h4 {
          color: #cdd6f4;
        }
        
        .theme-dark .analysis-hint,
        .theme-dark .layout-hint {
          color: #a6adc8;
        }
        
        .theme-dark .node-search-input {
          background: #11111b;
          color: #cdd6f4;
          border: 1px solid #45475a;
        }
        
        .theme-dark .node-search-input::placeholder {
          color: #a6adc8;
        }
        
        .theme-dark .search-stats {
          background: #11111b;
          color: #bac2de;
          border: 1px solid #45475a;
        }
        
        .theme-dark .no-results {
          color: #a6adc8;
        }
        
        .theme-dark .toggle-list-btn {
          background: #11111b;
          color: #cdd6f4;
          border: 1px solid #45475a;
        }
        
        .theme-dark .toggle-list-btn:hover {
          background: #181825;
          border-color: #f5c2e7;
        }
        
        .theme-dark .all-nodes-list {
          background: #11111b;
          border: 1px solid #45475a;
        }
        
        /* === 节点标签颜色 === */
        .theme-dark .node-tag-decision {
          background: #4a2a30;
          color: #f2cdcd;
          border-color: #f38ba8;
        }
        
        .theme-dark .node-tag-decision:hover {
          background: #5a353b;
          border-color: #eba0ac;
        }
        
        .theme-dark .node-tag-loop {
          background: #2a354a;
          color: #b4befe;
          border-color: #89b4fa;
        }
        
        .theme-dark .node-tag-loop:hover {
          background: #354055;
          border-color: #89dceb;
        }
        
        .theme-dark .node-tag-start {
          background: #2d4035;
          color: #a6e3a1;
          border-color: #94e2d5;
        }
        
        .theme-dark .node-tag-start:hover {
          background: #374d40;
          border-color: #a6e3a1;
        }
        
        .theme-dark .node-tag-ending {
          background: #4a422c;
          color: #f9e2af;
          border-color: #fab387;
        }
        
        .theme-dark .node-tag-ending:hover {
          background: #5a4f37;
          border-color: #f9e2af;
        }
        
        .theme-dark .node-tag-normal {
          background: #313244;
          color: #bac2de;
          border-color: #585b70;
        }
        
        .theme-dark .node-tag-normal:hover {
          background: #45475a;
          border-color: #6c7086;
        }
        
        /* === 验证结果 === */
        .theme-dark .validation-result {
          background: #181825;
          border: 1px solid #313244;
        }
        
        .theme-dark .validation-result.valid {
          border-color: rgba(166, 227, 161, 0.4);
          background: rgba(166, 227, 161, 0.12);
        }
        
        .theme-dark .validation-result.invalid {
          border-color: rgba(243, 139, 168, 0.4);
          background: rgba(243, 139, 168, 0.12);
        }
        
        .theme-dark .help ul li,
        .theme-dark .help div {
          color: #a6adc8;
        }
        
        .theme-dark .help ul li::before {
          color: #f5c2e7;
        }
        
        /* === 滚动条 === */
        .theme-dark ::-webkit-scrollbar-track {
          background: #11111b;
        }
        
        .theme-dark ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #45475a 0%, #585b70 100%);
        }
        
        .theme-dark ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #585b70 0%, #6c7086 100%);
        }
        
        /* === 插件商店 === */
        .theme-dark .plugin-store-container {
          background: #1e1e2e;
        }
        
        .theme-dark .plugin-store-header h1 {
          background: linear-gradient(135deg, #f5c2e7 0%, #cba6f7 50%, #b4befe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .theme-dark .plugin-store-header .subtitle {
          color: #bac2de;
        }
        
        .theme-dark .plugin-filter-bar {
          background: #181825;
          border: 2px solid #313244;
        }
        
        .theme-dark .filter-btn {
          background: #11111b;
          color: #cdd6f4;
          border: 1px solid #45475a;
        }
        
        .theme-dark .filter-btn.search-input {
          background: #11111b;
          color: #cdd6f4;
        }
        
        .theme-dark .filter-btn.search-input::placeholder {
          color: #a6adc8;
        }
        
        .theme-dark .filter-btn:hover {
          background: #181825;
          border-color: #f5c2e7;
        }
        
        .theme-dark .filter-btn.active {
          background: linear-gradient(135deg, #f5c2e7 0%, #cba6f7 100%);
          color: #1e1e2e;
          border-color: transparent;
        }
        
        .theme-dark .filter-divider {
          background: #313244;
        }
        
        .theme-dark .plugin-category {
          margin-bottom: 40px;
        }
        
        .theme-dark .category-title {
          color: #cdd6f4;
        }
        
        .theme-dark .category-badge {
          background: linear-gradient(135deg, #f5c2e7 0%, #cba6f7 100%);
          color: #1e1e2e;
        }
        
        .theme-dark .plugin-card {
          background: #181825;
          border: 2px solid #313244;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
        }
        
        .theme-dark .plugin-card:hover {
          border-color: #f5c2e7;
          box-shadow: 0 8px 24px rgba(245, 194, 231, 0.18);
        }
        
        .theme-dark .plugin-card.enabled {
          border-color: #a6e3a1;
          background: #181825;
        }
        
        .theme-dark .plugin-card.disabled {
          opacity: 0.6;
        }
        
        .theme-dark .plugin-icon {
          background: linear-gradient(135deg, #f5c2e7 0%, #cba6f7 100%);
          color: #1e1e2e;
          box-shadow: 0 2px 4px rgba(245, 194, 231, 0.35);
        }
        
        .theme-dark .theme-icon {
          background: linear-gradient(135deg, #f2cdcd 0%, #f5c2e7 100%);
        }
        
        .theme-dark .plugin-name {
          color: #cdd6f4;
        }
        
        .theme-dark .plugin-version {
          color: #a6adc8;
        }
        
        .theme-dark .toggle-slider {
          background-color: #585b70;
        }
        
        .theme-dark .toggle-slider:before {
          background-color: #cdd6f4;
        }
        
        .theme-dark .toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, #f5c2e7 0%, #cba6f7 100%);
        }
        
        .theme-dark .plugin-description {
          color: #bac2de;
        }
        
        .theme-dark .plugin-meta {
          color: #a6adc8;
        }
        
        .theme-dark .plugin-author {
          color: #a6adc8;
        }
        
        .theme-dark .plugin-tag {
          background: #11111b;
          color: #f5c2e7;
          border: 1px solid #45475a;
        }
        
        .theme-dark .plugin-requires {
          background: rgba(249, 226, 175, 0.12);
          border: 1px solid rgba(249, 226, 175, 0.3);
          color: #f9e2af;
        }
        
        .theme-dark .theme-notice {
          color: #f9e2af;
        }
        
        .theme-dark .empty-state {
          color: #a6adc8;
        }
        
        .theme-dark .btn-icon {
          background: #11111b;
          border: 1px solid #45475a;
          color: #bac2de;
        }
        
        .theme-dark .btn-icon:hover {
          background: #181825;
          border-color: #f5c2e7;
        }
        
        .theme-dark .btn-icon.btn-danger {
          background: rgba(243, 139, 168, 0.12);
          border-color: rgba(243, 139, 168, 0.35);
          color: #f2cdcd;
        }
        
        .theme-dark .btn-icon.btn-danger:hover {
          background: rgba(243, 139, 168, 0.22);
          border-color: #f38ba8;
        }
        
        .theme-dark .btn-delete-small {
          background: rgba(243, 139, 168, 0.12);
          color: #f2cdcd;
        }
        
        .theme-dark .btn-delete-small:hover {
          background: rgba(243, 139, 168, 0.22);
        }
        
        /* === Landing 页面 === */
        .theme-dark .landing {
          background-color: #1e1e2e;
        }
        
        .theme-dark .qr-container {
          background: #181825;
          border: 2px solid #313244;
        }
        
        /* === 登录标签页 === */
        .theme-dark .login-tabs {
          border-bottom: 1px solid #313244;
        }
        
        .theme-dark .login-tab {
          color: #a6adc8;
        }
        
        .theme-dark .login-tab.active {
          color: #f5c2e7;
          border-bottom: 2px solid #f5c2e7;
        }
        
        .theme-dark .login-hint {
          color: #bac2de;
          background: rgba(245, 194, 231, 0.12);
        }
        
        .theme-dark .login-divider::before,
        .theme-dark .login-divider::after {
          background: #313244;
        }
        
        .theme-dark .login-divider span,
        .theme-dark .login-note {
          color: #a6adc8;
        }
        
        /* === 自动保存提示 === */
        .theme-dark .auto-save-hint {
          color: #a6adc8;
          background: #11111b;
        }

        /* === 移动端适配 === */
        @media (max-width: 768px) {
          .theme-dark .mobile-menu-btn {
            background: #181825;
            border: 2px solid #313244;
            color: #f5c2e7;
          }
          
          .theme-dark .mobile-menu-btn:hover {
            background: #1e1e2e;
            border-color: #f5c2e7;
          }
          
          .theme-dark .mobile-close-btn {
            background: #11111b;
            border: 1px solid #45475a;
            color: #f5c2e7;
          }
          
          .theme-dark .mobile-close-btn:hover {
            background: #181825;
          }
        }
      `
    };
  }
}

