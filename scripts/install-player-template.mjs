import { copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'player-dist/visual-novel-player.html');
const destination = resolve(root, 'public/templates/visual-novel-player.html');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
await rm(resolve(root, 'player-dist'), { recursive: true, force: true });
