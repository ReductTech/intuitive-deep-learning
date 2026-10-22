import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(moduleRoot, '../..');
const outline = JSON.parse(fs.readFileSync(path.join(moduleRoot, 'outlines.json'), 'utf8'));
const entry = path.join(repositoryRoot, 'assets', outline.moduleIdentity.id);
if (!fs.statSync(entry, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error('Course assets are missing from the repository-root UUID directory.');
}
console.log('Policy-Gradient UUID asset directory is ready; no link is required.');
