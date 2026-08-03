import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredModules = [
  'src/domain/story/document.ts',
  'src/domain/story/editorState.ts',
  'src/domain/rules/RuleEngine.ts',
  'src/application/authoring/AuthoringSession.ts',
  'src/application/player/PlayerKernel.ts',
  'src/application/templates/TemplateRegistry.ts',
  'src/application/templates/TemplateCompiler.ts',
  'src/application/authoring/BrowserAuthoringPort.ts',
];

for (const file of requiredModules) {
  if (!existsSync(path.join(root, file))) failures.push(`缺少目标架构模块: ${file}`);
}

async function collect(directory) {
  if (!existsSync(directory)) return [];
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await collect(target));
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) result.push(target);
  }
  return result;
}

async function source(file) {
  return readFile(file, 'utf8');
}

for (const file of await collect(path.join(root, 'src/domain'))) {
  const text = await source(file);
  if (/from\s+["'][^"']*(?:reactflow|react|pages|components|contexts|platform)/.test(text)) {
    failures.push(`Domain 反向依赖框架或上层: ${path.relative(root, file)}`);
  }
  if (/\b(?:window|indexedDB|localStorage|BroadcastChannel)\b|\b(?:globalThis\.)?document\.(?:querySelector|createElement|getElementById|body)\b/.test(text)) {
    failures.push(`Domain 依赖浏览器运行时: ${path.relative(root, file)}`);
  }
}

const sharedTypes = path.join(root, 'src/types/index.ts');
if (existsSync(sharedTypes)) {
  const text = await source(sharedTypes);
  if (/reactflow/.test(text) || /\bStoryEdge\b/.test(text)) failures.push('共享领域类型仍以 React Flow Node/Edge 为事实');
}

for (const file of await collect(path.join(root, 'src/pages'))) {
  const text = await source(file);
  if (/platform\/storage\/WorkspaceRepository|indexedDB/.test(text)) {
    failures.push(`页面直接访问存储实现: ${path.relative(root, file)}`);
  }
}

for (const file of await collect(path.join(root, 'src/components'))) {
  const text = await source(file);
  if (/platform\/storage\/WorkspaceRepository|indexedDB/.test(text)) {
    failures.push(`组件直接访问存储实现: ${path.relative(root, file)}`);
  }
}

const forbiddenLegacy = [
  'src/core/CoreEngine.ts',
  'src/player/PlayerCore.ts',
  'src/pages/PlayerRouter.tsx',
  'src/player-standalone/main.tsx',
  'scripts/install-player-template.mjs',
  'visual-novel-player.html',
  'vite.player.config.ts',
];
for (const file of forbiddenLegacy) {
  if (existsSync(path.join(root, file))) failures.push(`并行核心或固定播放器入口仍存在: ${file}`);
}

for (const directory of ['src/application/player', 'src/application/templates', 'src/domain']) {
  for (const file of await collect(path.join(root, directory))) {
    const text = await source(file);
    if (/['"](?:visual-novel|chat|template-0[1-9]|template-1[0-2])['"]/.test(text)) {
      failures.push(`核心包含具体模板 ID 分支: ${path.relative(root, file)}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map(failure => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('目标架构静态检查通过');
}
