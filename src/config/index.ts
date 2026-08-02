/**
 * 前端配置文件
 * 职责：集中管理所有配置项
 * 
 */

const isDevelopment = import.meta.env.MODE === 'development';

interface AppConfig {
  name: string;
  subtitle: string;
  version: string;
  isDevelopment: boolean;
}

interface EditorConfig {
  autoSaveDelay: number;
  maxHistoryLength: number;
  node: {
    defaultWidth: number;
    defaultHeight: number;
  };
}

interface StorageConfig {
  saveKeyPrefix: string;
}

interface NotificationConfig {
  defaultDuration: number;
  position: {
    top: string;
    right: string;
  };
  styles: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}

interface NodeColors {
  border: string;
  background: string;
}

interface UIConfig {
  nodeColors: {
    start: NodeColors;
    normal: NodeColors;
    ending: NodeColors;
  };
  edge: {
    color: string;
    width: number;
    markerWidth: number;
    markerHeight: number;
  };
}

interface Config {
  app: AppConfig;
  editor: EditorConfig;
  storage: StorageConfig;
  notification: NotificationConfig;
  ui: UIConfig;
}

const config: Config = {
  // 应用配置
  app: {
    name: '互动小说编辑器',
    subtitle: '氛围型文学创作工具',
    version: '1.0.0',
    isDevelopment,
  },

  // 编辑器配置
  editor: {
    autoSaveDelay: 3000,
    maxHistoryLength: 50,
    
    node: {
      defaultWidth: 280,
      defaultHeight: 200,
    },
  },

  // 存储配置
  storage: {
    saveKeyPrefix: 'story_save_',
  },

  // 通知配置
  notification: {
    defaultDuration: 3000,
    position: {
      top: '20px',
      right: '20px',
    },
    styles: {
      success: 'background: rgba(224, 242, 254, 0.95); color: #0369a1; border: 2px solid rgba(125, 211, 252, 0.5);',
      error: 'background: rgba(254, 226, 226, 0.95); color: #dc2626; border: 2px solid rgba(252, 165, 165, 0.5);',
      warning: 'background: rgba(254, 249, 195, 0.95); color: #a16207; border: 2px solid rgba(253, 224, 71, 0.5);',
      info: 'background: rgba(224, 242, 254, 0.95); color: #0369a1; border: 2px solid rgba(125, 211, 252, 0.5);',
    },
  },

  // UI配置
  ui: {
    nodeColors: {
      start: {
        border: '#7dd3fc',
        background: '#e0f2fe',
      },
      normal: {
        border: '#5eead4',
        background: '#ccfbf1',
      },
      ending: {
        border: '#fda4af',
        background: '#ffe4e6',
      },
    },
    edge: {
      color: '#6366f1',
      width: 2.5,
      markerWidth: 20,
      markerHeight: 20,
    },
  },
};

export default config;

