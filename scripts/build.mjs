import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Script } from 'node:vm';
import config from '../addon.config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { directoryName, ...metadata } = config;
if (!/^[a-zA-Z0-9_-]+$/.test(directoryName)) throw new Error('Invalid addon directory name');
const output = path.join(root, 'dist', directoryName);
const script = await readFile(path.join(root, 'src/main.js'), 'utf8');
new Script(script, { filename: 'script.js' });
JSON.parse(await readFile(path.join(root, 'addon/handleEvents.json'), 'utf8'));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
await writeFile(path.join(output, 'script.js'), script);
await copyFile(path.join(root, 'src/styles.css'), path.join(output, 'style.css'));
for (const name of ['handleEvents.json', 'README.md', 'CHANGELOG.md']) {
  await copyFile(path.join(root, 'addon', name), path.join(output, name));
}
console.log(`Built ${metadata.name} ${metadata.version}: ${output}`);
