import type { StoryDocument } from './document.ts';

export interface StoryNodeAnalysis {
  sceneId: string;
  depth: number;
  componentId: number;
  isInLoop: boolean;
  maxDepthToEnd: number;
  outDegree: number;
  inDegree: number;
  choiceCount: number;
  isKeyDecision: boolean;
  reachableEndings: string[];
}

export interface StoryComponent {
  id: number;
  nodes: string[];
  isLoop: boolean;
}

export interface StoryAnalysis {
  nodes: Map<string, StoryNodeAnalysis>;
  maxDepth: number;
  startNodeId: string | null;
  endingNodeIds: string[];
  hasCycles: boolean;
  sccs: StoryComponent[];
  cycles: Array<{ nodes: string[] }>;
}

function stronglyConnectedComponents(ids: string[], adjacency: Map<string, string[]>): StoryComponent[] {
  let index = 0;
  const indices = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: StoryComponent[] = [];

  const visit = (id: string): void => {
    indices.set(id, index);
    lowLinks.set(id, index);
    index += 1;
    stack.push(id);
    onStack.add(id);
    for (const target of adjacency.get(id) ?? []) {
      if (!indices.has(target)) {
        visit(target);
        lowLinks.set(id, Math.min(lowLinks.get(id)!, lowLinks.get(target)!));
      } else if (onStack.has(target)) {
        lowLinks.set(id, Math.min(lowLinks.get(id)!, indices.get(target)!));
      }
    }
    if (lowLinks.get(id) !== indices.get(id)) return;
    const nodes: string[] = [];
    let member: string;
    do {
      member = stack.pop()!;
      onStack.delete(member);
      nodes.push(member);
    } while (member !== id);
    const isSelfLoop = nodes.length === 1 && (adjacency.get(nodes[0]) ?? []).includes(nodes[0]);
    components.push({ id: components.length, nodes, isLoop: nodes.length > 1 || isSelfLoop });
  };

  for (const id of ids) if (!indices.has(id)) visit(id);
  return components;
}

export function analyzeStoryDocument(document: StoryDocument): StoryAnalysis {
  const ids = document.scenes.map(scene => scene.id);
  const adjacency = new Map(ids.map(id => [id, [] as string[]]));
  const reverse = new Map(ids.map(id => [id, [] as string[]]));
  for (const scene of document.scenes) {
    for (const target of [
      ...scene.choices.map(choice => choice.targetSceneId),
      ...(scene.media.hotspots ?? []).map(hotspot => hotspot.targetSceneId),
    ]) {
      adjacency.get(scene.id)!.push(target);
      reverse.get(target)?.push(scene.id);
    }
  }

  const components = stronglyConnectedComponents(ids, adjacency);
  const componentOf = new Map<string, number>();
  for (const component of components) for (const id of component.nodes) componentOf.set(id, component.id);
  const successors = new Map(components.map(component => [component.id, new Set<number>()]));
  const predecessors = new Map(components.map(component => [component.id, new Set<number>()]));
  for (const [source, targets] of adjacency) {
    const sourceComponent = componentOf.get(source)!;
    for (const target of targets) {
      const targetComponent = componentOf.get(target)!;
      if (sourceComponent === targetComponent) continue;
      successors.get(sourceComponent)!.add(targetComponent);
      predecessors.get(targetComponent)!.add(sourceComponent);
    }
  }

  const inDegree = new Map(components.map(component => [component.id, predecessors.get(component.id)!.size]));
  const queue = components.filter(component => inDegree.get(component.id) === 0).map(component => component.id);
  const topological: number[] = [];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const componentId = queue[cursor];
    topological.push(componentId);
    for (const target of successors.get(componentId)!) {
      const next = inDegree.get(target)! - 1;
      inDegree.set(target, next);
      if (next === 0) queue.push(target);
    }
  }

  const depths = new Map<number, number>();
  const startComponent = componentOf.get(document.entrySceneId);
  if (startComponent !== undefined) depths.set(startComponent, 0);
  for (const componentId of topological) {
    const depth = depths.get(componentId);
    if (depth === undefined) continue;
    for (const target of successors.get(componentId)!) depths.set(target, Math.min(depths.get(target) ?? Infinity, depth + 1));
  }

  const endingNodeIds = document.scenes.filter(scene => scene.type === 'ending').map(scene => scene.id);
  const endingByComponent = new Map<number, Set<string>>();
  const maxDepthToEnd = new Map<number, number>();
  for (const endingId of endingNodeIds) {
    const componentId = componentOf.get(endingId)!;
    const values = endingByComponent.get(componentId) ?? new Set<string>();
    values.add(endingId);
    endingByComponent.set(componentId, values);
    maxDepthToEnd.set(componentId, 0);
  }
  for (const componentId of [...topological].reverse()) {
    const endings = endingByComponent.get(componentId) ?? new Set<string>();
    let maximum = maxDepthToEnd.get(componentId) ?? 0;
    for (const target of successors.get(componentId)!) {
      for (const ending of endingByComponent.get(target) ?? []) endings.add(ending);
      if ((endingByComponent.get(target)?.size ?? 0) > 0) maximum = Math.max(maximum, (maxDepthToEnd.get(target) ?? 0) + 1);
    }
    endingByComponent.set(componentId, endings);
    maxDepthToEnd.set(componentId, maximum);
  }

  const result = new Map<string, StoryNodeAnalysis>();
  for (const scene of document.scenes) {
    const componentId = componentOf.get(scene.id)!;
    result.set(scene.id, {
      sceneId: scene.id,
      depth: depths.get(componentId) ?? Infinity,
      componentId,
      isInLoop: components[componentId].isLoop,
      maxDepthToEnd: maxDepthToEnd.get(componentId) ?? 0,
      outDegree: adjacency.get(scene.id)!.length,
      inDegree: reverse.get(scene.id)!.length,
      choiceCount: scene.choices.length,
      isKeyDecision: scene.choices.length >= 3,
      reachableEndings: [...(endingByComponent.get(componentId) ?? [])].sort(),
    });
  }
  const finiteDepths = [...depths.values()].filter(Number.isFinite);
  const loopComponents = components.filter(component => component.isLoop);
  return {
    nodes: result,
    maxDepth: finiteDepths.length ? Math.max(...finiteDepths) : 0,
    startNodeId: document.entrySceneId,
    endingNodeIds,
    hasCycles: loopComponents.length > 0,
    sccs: components,
    cycles: loopComponents.slice(0, 10).map(component => ({ nodes: [...component.nodes] })),
  };
}
