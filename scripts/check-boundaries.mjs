import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const obsoleteRoots = ['.codex', 'backend', 'frontend', 'packager-win', 'player-standalone'];
for (const directory of obsoleteRoots) {
  if (existsSync(path.join(root, directory))) {
    failures.push(`仓库根目录仍存在已下线目录: ${directory}`);
  }
}

const obsoletePaths = [
  'public/content',
  'src/components/MarkdownViewer.tsx',
  'src/pages/StatementPage.tsx',
  'src/styles/markdown-viewer.css',
  'src/styles/statement.css',
  'tests/stress/editor.extreme.spec.ts',
];
for (const obsoletePath of obsoletePaths) {
  if (existsSync(path.join(root, obsoletePath))) {
    failures.push(`仓库仍存在已下线文件或目录: ${obsoletePath}`);
  }
}

const protectedFiles = [
  '.agents/skills/mo-development/SKILL.md',
  '.agents/skills/plan/SKILL.md',
  'src/content/landing.ts',
  'src/content/statement.ts',
  'src/assets/wechat-person.png',
  'src/assets/wechat-qr.png',
  'start_index.py',
];
for (const file of protectedFiles) {
  if (!existsSync(path.join(root, file))) failures.push(`必须保留的文件缺失: ${file}`);
}

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const verifyScript = packageJson.scripts?.verify ?? '';
for (const forbidden of ['playwright', 'test:e2e', 'test:stress', 'verify:full']) {
  if (verifyScript.includes(forbidden)) {
    failures.push(`日常 verify 不得包含 ${forbidden}`);
  }
}
if (packageJson.scripts?.start !== 'python -X utf8 start_index.py') {
  failures.push('根 start 脚本必须继续使用 start_index.py');
}
if ('test:stress:extreme' in (packageJson.scripts ?? {})) {
  failures.push('package.json 不得保留已取消的极限压力命令');
}

const forbiddenPackages = [
  'express',
  'jsonwebtoken',
  'bcrypt',
  'bcryptjs',
  'nodemailer',
  'electron',
];
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
for (const dependency of forbiddenPackages) {
  if (dependency in dependencies) failures.push(`package.json 仍依赖 ${dependency}`);
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(target));
    else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

const runtimePatterns = [
  { label: '后端 API 路径', pattern: /\/api(?:\/|["'`])/ },
  { label: '服务器用户目录', pattern: /\/userdata(?:\/|["'`])/ },
  { label: 'JWT', pattern: /\bJWT\b|jsonwebtoken/ },
  { label: 'Express', pattern: /\bexpress\b/i },
  { label: '账号令牌读取', pattern: /localStorage\.getItem\(["'](?:token|username)["']\)/ },
  { label: '旧 API service', pattern: /services\/api/ },
  { label: 'BrowserRouter', pattern: /\bBrowserRouter\b/ },
  { label: '静态页面 Markdown 加载', pattern: /MarkdownViewer|content\/(?:home|version|statement)\.md/ },
];

for (const file of await collectFiles(path.join(root, 'src'))) {
  const source = await readFile(file, 'utf8');
  for (const { label, pattern } of runtimePatterns) {
    if (pattern.test(source)) failures.push(`${path.relative(root, file)} 命中 ${label}`);
  }
}

const forbiddenLayerImports = /from\s+["'][^"']*\/(?:app|pages|features|components|contexts)(?:\/|["'])/;
for (const layer of ['domain', 'application', 'platform']) {
  const directory = path.join(root, 'src', layer);
  if (!existsSync(directory)) continue;
  for (const file of await collectFiles(directory)) {
    const source = await readFile(file, 'utf8');
    if (forbiddenLayerImports.test(source)) {
      failures.push(`${path.relative(root, file)} 反向依赖 UI/组合层`);
    }
  }
}

const viteConfig = await readFile(path.join(root, 'vite.config.ts'), 'utf8');
if (!/base:\s*["']\/mo\/["']/.test(viteConfig)) failures.push('Vite base 不是 /mo/');

const distIndex = path.join(root, 'dist', 'index.html');
if (existsSync(distIndex)) {
  const builtHtml = await readFile(distIndex, 'utf8');
  if (!builtHtml.includes('/mo/')) failures.push('生产 index.html 未使用 /mo/ 资源路径');
  const distStats = await stat(distIndex);
  if (distStats.size === 0) failures.push('生产 index.html 为空');
}

if (failures.length > 0) {
  console.error(failures.map(failure => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('静态边界检查通过');
}
