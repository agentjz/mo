/**
 * 插件商店页面
 * 职责：展示所有可用插件，管理插件启用/禁用状态
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePluginSystem } from '../contexts/PluginContext.tsx';
import type { RegisteredPlugin } from '../plugin/types';
import '../styles/plugin-store.css';

function PluginStore() {
  const pluginSystem = usePluginSystem();
  const navigate = useNavigate();
  const [plugins, setPlugins] = useState<RegisteredPlugin[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = () => {
    const allPlugins = pluginSystem.getAllPlugins();
    setPlugins(allPlugins);
  };

  const handleToggle = async (pluginId: string, currentlyEnabled: boolean) => {
    try {
      const plugin = plugins.find(p => p.plugin.metadata.id === pluginId);
      
      if (currentlyEnabled) {
        // 检查是否是主题类别的最后一个启用插件
        if (plugin?.plugin.metadata.category === 'theme' || plugin?.plugin.metadata.category === 'enhance') {
          const sameCategory = plugins.filter(p => 
            p.plugin.metadata.category === plugin.plugin.metadata.category && p.enabled
          );
          if (sameCategory.length === 1) {
            alert('至少需要保持一个主题启用');
            return;
          }
        }
        await pluginSystem.disable(pluginId);
      } else {
        // 启用插件，系统会自动处理冲突
        await pluginSystem.enable(pluginId);
      }
      loadPlugins();
    } catch (error) {
      console.error('Toggle plugin failed:', error);
      alert('插件切换失败：' + (error as Error).message);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'tool': '工具',
      'basicmod': '基础模组',
      'gamemod': '游戏模组',
      'theme': '编辑器主题',
      'enhance': '播放器主题',
      'community': '社区'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'tool': '#5eead4',
      'basicmod': '#c084fc',
      'gamemod': '#fbbf24',
      'theme': '#fda4af',
      'enhance': '#6ee7b7',
      'community': '#86efac'
    };
    return colors[category] || '#5eead4';
  };

  const filteredPlugins = plugins.filter(p => {
    let matchesFilter = true;
    let matchesSearch = true;

    if (filter === 'all') {
      matchesFilter = true;
    } else if (filter === 'enabled') {
      matchesFilter = p.enabled;
    } else if (filter === 'disabled') {
      matchesFilter = !p.enabled;
    } else {
      matchesFilter = p.plugin.metadata.category === filter;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch = 
        p.plugin.metadata.name.toLowerCase().includes(query) ||
        p.plugin.metadata.description.toLowerCase().includes(query) ||
        p.plugin.metadata.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        false;
    }

    return matchesFilter && matchesSearch;
  });

  const groupedPlugins = filteredPlugins.reduce((acc, p) => {
    const category = p.plugin.metadata.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(p);
    return acc;
  }, {} as Record<string, RegisteredPlugin[]>);

  return (
    <div className="plugin-store-container">
      <div className="plugin-store-header">
        <h1>插件商店</h1>
        <p className="subtitle">管理编辑器功能模块，按需启用所需插件</p>
        <button className="btn btn-secondary btn-small" onClick={() => navigate('/app')}>
          返回仪表盘
        </button>
      </div>

      <div className="plugin-filter-bar">
        <input
          type="text"
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="filter-btn search-input"
          style={{
            minWidth: '200px',
            textAlign: 'left',
            cursor: 'text'
          }}
        />
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          全部 ({plugins.length})
        </button>
        <button 
          className={filter === 'enabled' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('enabled')}
        >
          已启用 ({plugins.filter(p => p.enabled).length})
        </button>
        <button 
          className={filter === 'disabled' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('disabled')}
        >
          已禁用 ({plugins.filter(p => !p.enabled).length})
        </button>
        <div className="filter-divider"></div>
        <button 
          className={filter === 'tool' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('tool')}
        >
          工具
        </button>
        <button 
          className={filter === 'basicmod' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('basicmod')}
        >
          基础模组
        </button>
        <button 
          className={filter === 'gamemod' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('gamemod')}
        >
          游戏模组
        </button>
        <button 
          className={filter === 'theme' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('theme')}
        >
          编辑器主题
        </button>
        <button 
          className={filter === 'enhance' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('enhance')}
        >
          播放器主题
        </button>
      </div>

      <div className="plugin-list">
        {Object.entries(groupedPlugins).map(([category, categoryPlugins]) => (
          <div key={category} className="plugin-category">
            <h2 className="category-title">
              <span 
                className="category-badge" 
                style={{ backgroundColor: getCategoryColor(category) }}
              >
                {getCategoryLabel(category)}
              </span>
              {categoryPlugins.length} 个插件
            </h2>

            <div className="plugin-grid">
              {categoryPlugins.map(registered => {
                const { plugin, enabled } = registered;
                const { metadata } = plugin;

                return (
                  <div 
                    key={metadata.id} 
                    className={`plugin-card ${enabled ? 'enabled' : 'disabled'}`}
                  >
                    <div className="plugin-card-header">
                      <div className="plugin-info">
                        {metadata.icon && (
                          <span className="plugin-icon">{metadata.icon}</span>
                        )}
                        {!metadata.icon && metadata.category === 'theme' && (
                          <span className="plugin-icon theme-icon">{metadata.category.toUpperCase()}</span>
                        )}
                        <div>
                          <h3 className="plugin-name">{metadata.name}</h3>
                          <p className="plugin-version">v{metadata.version}</p>
                        </div>
                      </div>
                      
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => handleToggle(metadata.id, enabled)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <p className="plugin-description">
                      {metadata.description}
                      {metadata.category === 'theme' && (
                        <span className="theme-notice"> (推荐)</span>
                      )}
                    </p>

                    <div className="plugin-meta">
                      <span className="plugin-author">作者: {metadata.author}</span>
                      {metadata.tags && metadata.tags.length > 0 && (
                        <div className="plugin-tags">
                          {metadata.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="plugin-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {metadata.requires && metadata.requires.length > 0 && (
                      <div className="plugin-requires">
                        依赖: {metadata.requires.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredPlugins.length === 0 && (
        <div className="empty-state">
          <p>没有找到符合条件的插件</p>
        </div>
      )}
    </div>
  );
}

export default PluginStore;

