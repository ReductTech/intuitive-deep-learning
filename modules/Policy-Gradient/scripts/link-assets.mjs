import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(moduleRoot, '../..');
const source = path.join(moduleRoot, 'assets');
const entry = path.join(repositoryRoot, 'assets/policy-gradient');
if (!fs.existsSync(source)) throw new Error('Module assets directory is missing.');
if (fs.existsSync(entry) || fs.lstatSync(entry, { throwIfNoEntry: false })) {
  if (fs.realpathSync(entry) !== fs.realpathSync(source)) {
    throw new Error('Public asset entry already points elsewhere; no files were replaced.');
  }
} else {
  fs.mkdirSync(path.dirname(entry), { recursive: true });
  fs.symlinkSync(process.platform === 'win32' ? source : path.relative(path.dirname(entry), source), entry, process.platform === 'win32' ? 'junction' : 'dir');
}
console.log('Policy-Gradient asset entry is ready.');
