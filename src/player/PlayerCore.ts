/**
 * 播放器核心（基于插件系统重构）
 * 职责：游戏逻辑、消息管理、命令处理
 */

import type { Story, CurrentNode, ChoiceWithTarget, SaveSlot, VisitedNodeInfo } from '../types/index.js';
import { CoreEngine } from '../core/CoreEngine.js';
import { PluginSystem } from '../plugin/PluginSystem.js';
import { createBuiltinPlayerPlugins } from '../plugins/index.js';

export interface PlayerMessage {
  text: string;
  type: 'sys' | 'out' | 'prompt' | 'inp' | 'err' | 'image';
  isHtml?: boolean;
  imageData?: string;
}

export interface PlayerConfig {
  saveKeyPrefix?: string;
  onMessagesChange?: (messages: PlayerMessage[]) => void;
  onChoicesChange?: (choices: ChoiceWithTarget[]) => void;
  onNodeChange?: (node: CurrentNode) => void;
  onExit?: () => void;
}

export class PlayerCore {
  private engine: CoreEngine | null = null;
  private pluginSystem: PluginSystem;
  private messages: PlayerMessage[] = [];
  private currentChoices: ChoiceWithTarget[] = [];
  private saveKey: string = '';
  private config: PlayerConfig;
  private pluginsInitialized: boolean = false;
  private currentStory: Story | null = null;
  private visitedNodesMap: Map<string, { count: number; firstVisit: Date; lastVisit: Date }> = new Map();

  constructor(config: PlayerConfig = {}) {
    this.config = {
      saveKeyPrefix: 'game_save_',
      ...config
    };

    this.pluginSystem = new PluginSystem();
  }

  /**
   * 初始化插件
   */
  private async initializePlugins(displayMode: 'visual-novel'): Promise<void> {
    if (this.pluginsInitialized) return;
    
    const allPlugins = createBuiltinPlayerPlugins();
    
    // 过滤兼容的样式插件
    const stylePluginIds = allPlugins
      .filter(p => p.metadata.compatibleWith)
      .filter(p => p.metadata.compatibleWith!.includes(displayMode))
      .map(p => p.metadata.id);
    
    console.log(`[PlayerCore] Compatible style plugins for ${displayMode}:`, stylePluginIds);
    
    for (const plugin of allPlugins) {
      try {
        await this.pluginSystem.register(plugin);
      } catch (error) {
        console.error(`Failed to register plugin ${plugin.metadata.id}:`, error);
      }
    }

    const { initializeBlockly } = await import('../utils/blocklyInit.js');
    initializeBlockly(this.pluginSystem);
    
    // 检查是否有启用的样式插件
    const enabledStylePlugins = stylePluginIds.filter(id => {
      const pluginEntry = this.pluginSystem.getPlugin(id);
      return pluginEntry && pluginEntry.enabled;
    });
    
    // 如果没有启用的样式插件，自动启用第一个兼容的
    if (enabledStylePlugins.length === 0 && stylePluginIds.length > 0) {
      const defaultStyleId = stylePluginIds[0];
      console.log(`[PlayerCore] No style plugin enabled, auto-enabling: ${defaultStyleId}`);
      
      const pluginEntry = this.pluginSystem.getPlugin(defaultStyleId);
      if (pluginEntry) {
        try {
          await this.pluginSystem.enable(defaultStyleId);
        } catch (error) {
          console.error(`[PlayerCore] Failed to auto-enable ${defaultStyleId}:`, error);
        }
      }
    }
    
    this.pluginsInitialized = true;
  }

  /**
   * 初始化并开始游戏
   */
  async start(story: Story, startNodeId?: string): Promise<void> {
    const displayMode = story.meta.displayMode || 'visual-novel';
    await this.initializePlugins(displayMode);
    this.pluginSystem.clearData();
    
    // 确保 variables 是数组
    if (!Array.isArray(story.variables)) {
      story.variables = [];
    }
    
    // 保存完整的story对象，供后续使用
    this.currentStory = story;
    
    // 初始化全局变量（根据 story.variables 定义）
    if (story.variables.length > 0) {
      const runtime = this.pluginSystem.getContribution('runtime', 'variables');
      if (runtime) {
        // 为每个定义的变量设置初始值
        story.variables.forEach(varDef => {
          runtime.set(varDef.id, varDef.defaultValue);
        });
        
        console.log(`[PlayerCore] Initialized ${story.variables.length} variables`);
      }
    }
    
    this.engine = new CoreEngine(story);
    this.saveKey = `${this.config.saveKeyPrefix}${story.id}`;
    
    // 注入引擎到插件系统
    this.pluginSystem.updateContext({
      engine: {
        getNode: (id) => this.engine!.getNode(id),
        getAllNodes: () => this.engine!.getAllNodes(),
        getEdges: () => this.engine!.getEdges(),
        getCurrentNodeId: () => this.engine!.getCurrentNodeId(),
        moveTo: (nodeId: string) => {
          const nextNode = this.engine!.jumpToNode(nodeId);
          this.displayNode(nextNode);
        }
      }
    });

    // 设置事件发射器
    this.engine.setEventEmitter({
      emit: (event, data) => { this.pluginSystem.trigger(event, data); },
      trigger: (hook, data) => this.pluginSystem.trigger(hook, data),
    });

    const firstNode = startNodeId ? this.engine.start(startNodeId) : this.engine.start();
    
    this.appendMessage('游戏已载入', 'sys');
    this.appendMessage(`作者：${story.meta.author}`, 'sys');
    if (startNodeId) {
      this.appendMessage('从指定节点开始播放', 'sys');
    }
    this.appendMessage('点击选项按钮进行选择，或输入 help 查看帮助', 'sys');
    this.appendMessage('', 'out');
    
    this.displayNode(firstNode);
  }

  getMessages(): PlayerMessage[] {
    return this.messages;
  }

  getChoices(): ChoiceWithTarget[] {
    return this.currentChoices;
  }

  private appendMessage(
    text: string, 
    type: PlayerMessage['type'] = 'out', 
    isHtml: boolean = false, 
    imageData?: string
  ): void {
    this.messages.push({ text, type, isHtml, imageData });
    this.config.onMessagesChange?.(this.messages);
  }

  private setChoices(choices: ChoiceWithTarget[]): void {
    this.currentChoices = choices;
    this.config.onChoicesChange?.(this.currentChoices);
  }

  private displayNode(node: CurrentNode): void {
    this.trackNodeVisit(node.id);
    
    // 触发内容渲染钩子
    const rendered = this.pluginSystem.trigger<{
      text: string;
      nodeId: string;
      availableChoices: ChoiceWithTarget[];
      story: Story | null;
      renderedHTML?: string;
    }>('content:render', {
      text: node.text,
      nodeId: node.id,
      availableChoices: node.choices,
      story: this.currentStory
    });
    
    const htmlContent = rendered.renderedHTML || node.text;
    this.appendMessage(htmlContent, 'out', true);
    this.appendMessage('', 'out');
    
    node.renderedHTML = htmlContent;
    
    this.config.onNodeChange?.(node);
    
    if (node.type === 'ending') {
      this.appendMessage('━━━ 游戏结束 ━━━', 'sys');
      this.appendMessage('', 'out');
      this.appendMessage('输入 restart 重新开始，或 exit 退出', 'sys');
      this.setChoices([]);
      return;
    }
    
    if (node.choices && node.choices.length > 0) {
      // 过滤掉已经内嵌在文本中的选项
      const choiceEmbedding = this.pluginSystem.getContribution('choiceEmbedding', 'story');
      let choicesToDisplay = node.choices;
      
      if (choiceEmbedding) {
        const embeddedIds = choiceEmbedding.getEmbeddedChoiceIds(node.id);
        if (embeddedIds.length > 0) {
          choicesToDisplay = node.choices.filter(c => !embeddedIds.includes(c.id));
        }
      }
      
      this.setChoices(choicesToDisplay);
    } else {
      this.setChoices([]);
    }
  }

  makeChoice(choiceId: string): void {
    if (!this.engine) return;
    
    try {
      // 先在currentChoices中查找（底部按钮）
      let choice = this.currentChoices.find(c => c.id === choiceId);
      
      // 如果没找到，说明可能是内嵌的选项，从engine的当前节点获取
      if (!choice) {
        const currentNode = this.engine.getCurrentNode();
        choice = currentNode.choices.find(c => c.id === choiceId);
      }
      
      if (!choice) {
        this.appendMessage('无效的选择', 'err');
        return;
      }
      
      this.appendMessage(`> ${choice.text}`, 'inp');
      this.appendMessage('', 'out');
      
      const nextNode = this.engine.makeChoice(choice.id);
      this.displayNode(nextNode);
      
    } catch (error) {
      console.error('选择失败:', error);
      this.appendMessage('选择失败，请重试', 'err');
    }
  }

  /**
   * 直接跳转到指定节点（用于图片热区等场景）
   * 不需要通过choice和edge，直接指定目标节点ID
   */
  jumpToNode(targetNodeId: string): void {
    if (!this.engine) return;
    
    try {
      const nextNode = this.engine.jumpToNode(targetNodeId);
      this.displayNode(nextNode);
    } catch (error) {
      console.error('跳转失败:', error);
      this.appendMessage('跳转失败，请重试', 'err');
    }
  }

  handleCommand(command: string): void {
    const trimmedCmd = command.trim();
    if (!trimmedCmd) return;
    
    this.appendMessage(`> ${trimmedCmd}`, 'inp');
    
    const lowerCmd = trimmedCmd.toLowerCase();
    
    if (lowerCmd === 'exit' || lowerCmd === 'quit') {
      if (this.config.onExit) {
        this.config.onExit();
      } else {
        this.appendMessage('感谢游玩！', 'sys');
      }
      return;
    }
    
    if (lowerCmd === 'help') {
      this.showHelp();
      return;
    }
    
    if (!this.engine) {
      this.appendMessage('游戏引擎未初始化', 'err');
      return;
    }
    
    if (lowerCmd === 'back') {
      const prevNode = this.engine.goBack();
      if (prevNode) {
        this.appendMessage('━━━ 返回上一步 ━━━', 'sys');
        this.appendMessage('', 'out');
        this.displayNode(prevNode);
      } else {
        this.appendMessage('已在起点，无法回退', 'err');
      }
      return;
    }
    
    if (lowerCmd === 'restart') {
      const firstNode = this.engine.start();
      this.appendMessage('━━━ 重新开始 ━━━', 'sys');
      this.appendMessage('', 'out');
      this.displayNode(firstNode);
      return;
    }
    
    if (lowerCmd === 'save') {
      this.save();
      return;
    }
    
    if (lowerCmd === 'load') {
      this.load();
      return;
    }
    
    this.appendMessage(`未知命令: ${trimmedCmd}`, 'err');
    this.appendMessage('输入 help 查看可用命令', 'out');
  }

  private save(): void {
    if (!this.engine) return;
    
    try {
      const saveData = this.engine.save();
      localStorage.setItem(this.saveKey, JSON.stringify(saveData));
      this.appendMessage('✓ 进度已保存', 'sys');
    } catch (error) {
      console.error('保存失败:', error);
      this.appendMessage('保存失败', 'err');
    }
  }

  private load(): void {
    if (!this.engine) return;
    
    const savedData = localStorage.getItem(this.saveKey);
    
    if (!savedData) {
      this.appendMessage('没有找到存档', 'err');
      return;
    }
    
    try {
      const saveData = JSON.parse(savedData);
      const loadedNode = this.engine.load(saveData);
      
      this.appendMessage('✓ 进度已加载', 'sys');
      this.appendMessage('', 'out');
      this.displayNode(loadedNode);
    } catch (error) {
      console.error('加载失败:', error);
      this.appendMessage('加载存档失败', 'err');
    }
  }

  private showHelp(): void {
    this.appendMessage('━━━ 可用命令 ━━━', 'sys');
    this.appendMessage('', 'out');
    this.appendMessage('点击选项按钮  - 进行选择', 'out');
    this.appendMessage('back          - 返回上一步', 'out');
    this.appendMessage('save          - 保存当前进度', 'out');
    this.appendMessage('load          - 加载已保存的进度', 'out');
    this.appendMessage('restart       - 重新开始游戏', 'out');
    this.appendMessage('exit/quit     - 退出游戏', 'out');
    this.appendMessage('help          - 显示此帮助信息', 'out');
    this.appendMessage('', 'out');
  }

  getPluginSystem(): PluginSystem {
    return this.pluginSystem;
  }

  /**
   * 执行返回操作（纯逻辑，无UI）
   */
  executeBack(): CurrentNode | null {
    if (!this.engine) return null;
    
    const prevNode = this.engine.goBack();
    if (prevNode) {
      this.displayNode(prevNode);
    }
    return prevNode;
  }

  /**
   * 执行保存操作（纯逻辑，无UI）
   */
  executeSave(): boolean {
    if (!this.engine) return false;
    
    try {
      const saveData = this.engine.save();
      localStorage.setItem(this.saveKey, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('保存失败:', error);
      return false;
    }
  }

  /**
   * 执行加载操作（纯逻辑，无UI）
   */
  executeLoad(): CurrentNode | null {
    if (!this.engine) return null;
    
    const savedData = localStorage.getItem(this.saveKey);
    if (!savedData) return null;
    
    try {
      const saveData = JSON.parse(savedData);
      const loadedNode = this.engine.load(saveData);
      this.displayNode(loadedNode);
      return loadedNode;
    } catch (error) {
      console.error('加载失败:', error);
      return null;
    }
  }

  /**
   * 执行重启操作（纯逻辑，无UI）
   */
  executeRestart(): CurrentNode | null {
    if (!this.engine) return null;
    
    this.visitedNodesMap.clear();
    const firstNode = this.engine.start();
    this.displayNode(firstNode);
    return firstNode;
  }

  private trackNodeVisit(nodeId: string): void {
    const now = new Date();
    const existing = this.visitedNodesMap.get(nodeId);
    
    if (existing) {
      existing.count++;
      existing.lastVisit = now;
    } else {
      this.visitedNodesMap.set(nodeId, {
        count: 1,
        firstVisit: now,
        lastVisit: now
      });
    }
  }

  getVisitedNodes(): VisitedNodeInfo[] {
    if (!this.engine) return [];
    
    const result: VisitedNodeInfo[] = [];
    
    for (const [nodeId, visitInfo] of this.visitedNodesMap.entries()) {
      const node = this.engine.getNode(nodeId);
      if (!node) continue;
      
      const nodeText = node.data.text || '';
      const nodeName = node.data.image?.sceneName || 
                       (nodeText.length > 20 ? nodeText.substring(0, 20) + '...' : nodeText);
      
      result.push({
        nodeId,
        nodeName,
        visitCount: visitInfo.count,
        firstVisit: visitInfo.firstVisit.toISOString(),
        lastVisit: visitInfo.lastVisit.toISOString()
      });
    }
    
    return result.sort((a, b) => 
      new Date(a.firstVisit).getTime() - new Date(b.firstVisit).getTime()
    );
  }

  getSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    
    for (let slotId = 1; slotId <= 3; slotId++) {
      const slotKey = `${this.saveKey}_slot_${slotId}`;
      const savedData = localStorage.getItem(slotKey);
      
      if (savedData) {
        try {
          const saveData = JSON.parse(savedData);
          const node = this.engine?.getNode(saveData.currentNodeId);
          const nodeText = node?.data.text || '';
          
          slots.push({
            slotId,
            exists: true,
            saveTime: saveData.saveTime,
            nodeName: nodeText.length > 30 ? nodeText.substring(0, 30) + '...' : nodeText,
            nodeText: nodeText,
            saveData
          });
        } catch (e) {
          slots.push({ slotId, exists: false });
        }
      } else {
        slots.push({ slotId, exists: false });
      }
    }
    
    return slots;
  }

  saveToSlot(slotId: number): boolean {
    if (!this.engine) return false;
    
    try {
      const saveData = this.engine.save();
      const savePayload = {
        ...saveData,
        saveTime: new Date().toISOString(),
        visitedNodes: Array.from(this.visitedNodesMap.keys())
      };
      
      const slotKey = `${this.saveKey}_slot_${slotId}`;
      localStorage.setItem(slotKey, JSON.stringify(savePayload));
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }

  loadFromSlot(slotId: number): CurrentNode | null {
    if (!this.engine) return null;
    
    const slotKey = `${this.saveKey}_slot_${slotId}`;
    const savedData = localStorage.getItem(slotKey);
    
    if (!savedData) return null;
    
    try {
      const saveData = JSON.parse(savedData);
      
      if (saveData.visitedNodes) {
        this.visitedNodesMap.clear();
        const now = new Date();
        saveData.visitedNodes.forEach((nodeId: string) => {
          this.visitedNodesMap.set(nodeId, {
            count: 1,
            firstVisit: now,
            lastVisit: now
          });
        });
      }
      
      const loadedNode = this.engine.load(saveData);
      this.displayNode(loadedNode);
      return loadedNode;
    } catch (error) {
      console.error('Load failed:', error);
      return null;
    }
  }

  getDisplayVariables(): Array<{id: string, label: string, value: unknown, order?: number}> {
    if (!this.currentStory) return [];
    
    const varsToDisplay = this.currentStory.variables?.filter(v => v.displayInPlayer) || [];
    if (varsToDisplay.length === 0) return [];
    
    const runtime = this.pluginSystem.getContribution('runtime', 'variables');
    if (!runtime) return [];
    
    const displayVars = varsToDisplay.map(varDef => ({
      id: varDef.id,
      label: varDef.label,
      value: runtime.get(varDef.id),
      order: varDef.displayOrder
    }));
    
    displayVars.sort((a, b) => {
      const hasOrderA = a.order !== undefined && a.order !== null;
      const hasOrderB = b.order !== undefined && b.order !== null;
      
      if (hasOrderA && hasOrderB) return a.order! - b.order!;
      if (hasOrderA) return -1;
      if (hasOrderB) return 1;
      return 0;
    });
    
    return displayVars;
  }

  getCurrentStory(): Story | null {
    return this.currentStory;
  }
}
