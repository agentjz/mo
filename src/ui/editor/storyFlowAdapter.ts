import type { RuleDocument, StoryDocument } from '../../domain/story/document.ts';
import type { StoryEditorState } from '../../domain/story/editorState.ts';
import type { BlocklyWorkspaceState, ChoiceScripts, NodeScripts } from '../../types/blockly.ts';
import type {
  EditorCharacterImage,
  EditorCharacterImages,
  EditorChoice,
  EditorImage,
  EditorStoryMeta,
  StoryFlowEdge,
  StoryFlowNode,
  StoryFlowNodeData,
} from './flowTypes.ts';

export interface StoryFlowGraph {
  nodes: StoryFlowNode[];
  edges: StoryFlowEdge[];
}

interface EditorHotspot {
  id: string;
  label: string;
  targetNodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function toEditorImage(asset: NonNullable<StoryDocument['scenes'][number]['media']['background']>): EditorImage {
  return {
    imagePath: asset.assetId,
    fileName: asset.fileName,
    fileSize: asset.size,
    originalFormat: asset.mimeType.split('/')[1] ?? asset.mimeType,
    hash: asset.hash,
    width: asset.width,
    height: asset.height,
    position: asset.position,
    sceneName: asset.label,
    scale: asset.scale,
  };
}

function toCharacterImage(asset: NonNullable<StoryDocument['scenes'][number]['media']['characters']>[number]): EditorCharacterImage {
  return {
    ...toEditorImage(asset),
    horizontalPosition: asset.horizontalPosition,
    verticalPosition: asset.verticalPosition,
  };
}

function toDomainImage(image: EditorImage) {
  return {
    assetId: image.imagePath,
    fileName: image.fileName,
    mimeType: `image/${image.originalFormat.replace(/^image\//, '')}`,
    size: image.fileSize,
    hash: image.hash,
    width: image.width,
    height: image.height,
    position: image.position,
    scale: image.scale,
    label: image.sceneName,
  };
}

function withoutProjectionData(pluginData: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!pluginData) return {};
  const result = structuredClone(pluginData);
  delete result['image-hotspots'];
  delete result['blockly.scripts'];
  return result;
}

function isBlocklyRule(rule: RuleDocument | undefined): boolean {
  return rule?.extensionData?.['blockly.owner'] === true;
}

function blocklyWorkspace(rule: RuleDocument | undefined): BlocklyWorkspaceState | undefined {
  const workspace = rule?.extensionData?.['blockly.workspace'];
  return workspace && typeof workspace === 'object' ? structuredClone(workspace) as BlocklyWorkspaceState : undefined;
}

function createBlocklyRule(
  id: string,
  trigger: RuleDocument['trigger'],
  sceneId: string,
  workspace: BlocklyWorkspaceState,
  choiceId?: string,
): RuleDocument {
  const code = workspace.generatedCode ?? '';
  return {
    id,
    trigger,
    scope: { sceneId, choiceId },
    condition: trigger === 'choice-visible'
      ? { type: 'function', functionId: 'blockly.evaluate', arguments: [code] }
      : undefined,
    actions: trigger === 'choice-visible'
      ? []
      : [{ type: 'call-function', functionId: 'blockly.execute', arguments: [code] }],
    extensionData: { 'blockly.owner': true, 'blockly.workspace': structuredClone(workspace) },
  };
}

export function projectStoryGraph(document: StoryDocument, editorState: StoryEditorState): StoryFlowGraph {
  const rules = new Map(document.rules.map(rule => [rule.id, rule]));
  return {
    nodes: document.scenes.map((scene, index) => {
      const characters: EditorCharacterImages = {};
      for (const asset of scene.media.characters ?? []) {
        const position = asset.horizontalPosition ?? 'center';
        characters[position] = toCharacterImage(asset);
      }
      const pluginData = structuredClone(scene.extensionData);
      const nodeScripts: NodeScripts = {};
      for (const ruleId of scene.ruleIds.onEnter) {
        const workspace = blocklyWorkspace(rules.get(ruleId));
        if (workspace) nodeScripts.onEnter = workspace;
      }
      for (const ruleId of scene.ruleIds.onLeave) {
        const workspace = blocklyWorkspace(rules.get(ruleId));
        if (workspace) nodeScripts.onLeave = workspace;
      }
      if (nodeScripts.onEnter || nodeScripts.onLeave) pluginData['blockly.scripts'] = nodeScripts;
      if (scene.media.hotspots?.length) {
        pluginData['image-hotspots'] = scene.media.hotspots.map(hotspot => ({
          id: hotspot.id,
          label: hotspot.label,
          targetNodeId: hotspot.targetSceneId,
          x: hotspot.x,
          y: hotspot.y,
          width: hotspot.width,
          height: hotspot.height,
        } satisfies EditorHotspot));
      }
      const data: StoryFlowNodeData = {
        nodeId: index + 1,
        text: scene.content.text,
        speaker: scene.content.speaker,
        choices: scene.choices.map(choice => {
          const choiceScripts: ChoiceScripts = {};
          const condition = blocklyWorkspace(choice.visibilityRuleId ? rules.get(choice.visibilityRuleId) : undefined);
          if (condition) choiceScripts.condition = condition;
          for (const ruleId of choice.selectRuleIds ?? []) {
            const workspace = blocklyWorkspace(rules.get(ruleId));
            if (workspace) choiceScripts.onSelect = workspace;
          }
          const choicePluginData = structuredClone(choice.extensionData ?? {});
          if (choiceScripts.condition || choiceScripts.onSelect) choicePluginData['blockly.scripts'] = choiceScripts;
          return {
            id: choice.id,
            text: choice.text,
            targetSceneId: choice.targetSceneId,
            visibilityRuleId: choice.visibilityRuleId,
            selectRuleIds: choice.selectRuleIds,
            pluginData: choicePluginData,
          };
        }),
        nodeType: scene.type,
        image: scene.media.background ? toEditorImage(scene.media.background) : undefined,
        characterImages: Object.keys(characters).length ? characters : undefined,
        tags: [...scene.tags],
        typewriterSpeed: scene.content.typewriterSpeed,
        pluginData,
      };
      return {
        id: scene.id,
        type: 'storyNode',
        position: editorState.scenePositions[scene.id] ?? { x: 100 + index * 360, y: 100 },
        data,
      };
    }),
    edges: document.scenes.flatMap(scene => scene.choices.map(choice => ({
      id: `${scene.id}:${choice.id}`,
      source: scene.id,
      sourceHandle: choice.id,
      target: choice.targetSceneId,
      type: 'default',
    }))),
  };
}

export function projectEditorMeta(document: StoryDocument): EditorStoryMeta {
  const entryIndex = document.scenes.findIndex(scene => scene.id === document.entrySceneId);
  return {
    ...document.meta,
    start_node: entryIndex + 1,
    renderStyle: document.presentation.templateId === 'builtin.chat' ? 'chat' : 'visual-novel',
    stylePluginId: typeof document.presentation.settings.stylePluginId === 'string'
      ? document.presentation.settings.stylePluginId
      : undefined,
    templateId: document.presentation.templateId,
    templateSettings: structuredClone(document.presentation.settings),
    templateSceneVariants: structuredClone(document.presentation.sceneVariants),
  };
}

export function composeStoryDocument(
  base: StoryDocument,
  meta: EditorStoryMeta,
  variables: StoryDocument['variables'],
  nodes: StoryFlowNode[],
  edges: StoryFlowEdge[],
): StoryDocument {
  const nodeIdToSceneId = new Map(nodes.map(node => [node.data.nodeId, node.id]));
  const edgeTargets = new Map(edges.map(edge => [`${edge.source}:${edge.sourceHandle ?? ''}`, edge.target]));
  const existing = new Map(base.scenes.map(scene => [scene.id, scene]));
  const blocklyRules: RuleDocument[] = [];
  const scenes: StoryDocument['scenes'] = nodes.map(node => {
    const previous = existing.get(node.id);
    const data = node.data;
    const hotspotValue = data.pluginData?.['image-hotspots'];
    const hotspots = Array.isArray(hotspotValue) ? hotspotValue.map(value => {
      const hotspot = value as EditorHotspot;
      return {
        id: hotspot.id,
        label: hotspot.label,
        targetSceneId: hotspot.targetNodeId,
        x: hotspot.x,
        y: hotspot.y,
        width: hotspot.width,
        height: hotspot.height,
      };
    }) : [];
    const characters = Object.values(data.characterImages ?? {}).filter((image): image is EditorCharacterImage => Boolean(image)).map(image => ({
      ...toDomainImage(image),
      horizontalPosition: image.horizontalPosition,
      verticalPosition: image.verticalPosition,
    }));
    const nodeScripts = data.pluginData?.['blockly.scripts'] as NodeScripts | undefined;
    const onEnter = (previous?.ruleIds.onEnter ?? []).filter(ruleId => !isBlocklyRule(base.rules.find(rule => rule.id === ruleId)!));
    const onLeave = (previous?.ruleIds.onLeave ?? []).filter(ruleId => !isBlocklyRule(base.rules.find(rule => rule.id === ruleId)!));
    if (nodeScripts?.onEnter) {
      const rule = createBlocklyRule(`blockly:${node.id}:enter`, 'scene-enter', node.id, nodeScripts.onEnter);
      blocklyRules.push(rule);
      onEnter.push(rule.id);
    }
    if (nodeScripts?.onLeave) {
      const rule = createBlocklyRule(`blockly:${node.id}:leave`, 'scene-leave', node.id, nodeScripts.onLeave);
      blocklyRules.push(rule);
      onLeave.push(rule.id);
    }
    return {
      id: node.id,
      type: data.nodeType,
      content: { text: data.text, typewriterSpeed: data.typewriterSpeed, speaker: data.speaker },
      choices: data.choices.map((choice: EditorChoice) => {
        const scripts = choice.pluginData?.['blockly.scripts'] as ChoiceScripts | undefined;
        let visibilityRuleId = choice.visibilityRuleId && !isBlocklyRule(base.rules.find(rule => rule.id === choice.visibilityRuleId)!)
          ? choice.visibilityRuleId
          : undefined;
        const selectRuleIds = (choice.selectRuleIds ?? []).filter(ruleId => !isBlocklyRule(base.rules.find(rule => rule.id === ruleId)!));
        if (scripts?.condition) {
          const rule = createBlocklyRule(`blockly:${node.id}:${choice.id}:visible`, 'choice-visible', node.id, scripts.condition, choice.id);
          blocklyRules.push(rule);
          visibilityRuleId = rule.id;
        }
        if (scripts?.onSelect) {
          const rule = createBlocklyRule(`blockly:${node.id}:${choice.id}:select`, 'choice-select', node.id, scripts.onSelect, choice.id);
          blocklyRules.push(rule);
          selectRuleIds.push(rule.id);
        }
        return {
          id: choice.id,
          text: choice.text,
          targetSceneId: edgeTargets.get(`${node.id}:${choice.id}`) ?? choice.targetSceneId,
          visibilityRuleId,
          selectRuleIds: selectRuleIds.length ? selectRuleIds : undefined,
          extensionData: withoutProjectionData(choice.pluginData),
        };
      }),
      media: {
        background: data.image ? toDomainImage(data.image) : undefined,
        characters: characters.length ? characters : undefined,
        hotspots: hotspots.length ? hotspots : undefined,
      },
      tags: data.tags ?? [],
      ruleIds: { onEnter, onLeave },
      extensionData: withoutProjectionData(data.pluginData),
    };
  });
  const entrySceneId = nodeIdToSceneId.get(meta.start_node) ?? base.entrySceneId;
  const templateId = meta.templateId;
  const settings = { ...meta.templateSettings };
  if (meta.stylePluginId) settings.stylePluginId = meta.stylePluginId;
  else delete settings.stylePluginId;
  return {
    ...base,
    meta: { title: meta.title, author: meta.author, description: meta.description },
    entrySceneId,
    scenes,
    variables: structuredClone(variables),
    rules: [...base.rules.filter(rule => !isBlocklyRule(rule)), ...blocklyRules],
    presentation: { ...base.presentation, templateId, settings, sceneVariants: structuredClone(meta.templateSceneVariants) },
    updatedAt: base.updatedAt,
  };
}

export function composeEditorState(base: StoryEditorState, nodes: StoryFlowNode[]): StoryEditorState {
  const sceneIds = new Set(nodes.map(node => node.id));
  return {
    ...base,
    scenePositions: Object.fromEntries(nodes.map(node => [node.id, { ...node.position }])),
    selectedSceneId: base.selectedSceneId && sceneIds.has(base.selectedSceneId) ? base.selectedSceneId : null,
  };
}
