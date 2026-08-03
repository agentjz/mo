import type { Edge, Node } from 'reactflow';
import type { VariableDefinition } from '../../domain/story/document.ts';

export interface EditorImage {
  imagePath: string;
  fileName: string;
  fileSize: number;
  originalFormat: string;
  hash: string;
  width: number;
  height: number;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right';
  sceneName?: string;
  scale?: number;
}

export interface EditorCharacterImage extends EditorImage {
  horizontalPosition?: 'left' | 'center' | 'right';
  verticalPosition?: 'top' | 'center' | 'bottom';
}

export interface EditorCharacterImages {
  left?: EditorCharacterImage;
  center?: EditorCharacterImage;
  right?: EditorCharacterImage;
}

export interface EditorChoice {
  id: string;
  text: string;
  targetSceneId: string;
  visibilityRuleId?: string;
  selectRuleIds?: string[];
  pluginData?: Record<string, unknown>;
}

export interface StoryFlowNodeData {
  nodeId: number;
  text: string;
  choices: EditorChoice[];
  nodeType: 'start' | 'normal' | 'ending';
  image?: EditorImage;
  characterImages?: EditorCharacterImages;
  tags?: string[];
  typewriterSpeed?: number;
  speaker?: string;
  pluginData?: Record<string, unknown>;
}

export type StoryFlowNode = Node<StoryFlowNodeData>;
export type StoryFlowEdge = Edge;

export interface EditorStoryMeta {
  id?: string;
  title: string;
  author: string;
  description: string;
  start_node: number;
  displayMode?: 'visual-novel';
  renderStyle?: 'visual-novel' | 'chat';
  stylePluginId?: string;
  templateId: string;
  templateSettings: Record<string, unknown>;
  templateSceneVariants: Record<string, string>;
}

export type { VariableDefinition };
