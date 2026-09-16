import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import postcss from 'postcss';

const moduleRoot = path.resolve('modules/Neuron-Guide');
const pagesRoot = path.join(moduleRoot, 'pages');
const sourceCss = [
  execFileSync('git', ['show', 'HEAD:modules/Neuron-Guide/pages/GuidePage.css'], { encoding: 'utf8' }),
  execFileSync('git', ['show', 'HEAD:modules/Neuron-Guide/pages/SlidePage.css'], { encoding: 'utf8' }),
].join('\n');

const pageNames = fs.readdirSync(pagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(pagesRoot, entry.name, entry.name + '.tsx')))
  .map((entry) => entry.name)
  .sort();

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  return [base, base + '.tsx', base + '.ts', path.join(base, 'index.tsx'), path.join(base, 'index.ts')]
    .find((candidate) => fs.existsSync(candidate)) || null;
}

function collectSource(entryFile, seen = new Set()) {
  const file = path.resolve(entryFile);
  if (seen.has(file) || !file.startsWith(moduleRoot) || !fs.existsSync(file)) return '';
  seen.add(file);
  const source = fs.readFileSync(file, 'utf8');
  let combined = source;
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const dependency = resolveImport(file, match[1]);
    if (dependency) combined += '\n' + collectSource(dependency, seen);
  }
  return combined;
}

const classesByPage = new Map(pageNames.map((page) => {
  const entry = path.join(pagesRoot, page, page + '.tsx');
  const source = collectSource(entry);
  const names = new Set(Array.from(source.matchAll(/(?:ng|af|edu|dl)-[A-Za-z0-9_-]+/g), (match) => match[0]));
  return [page, names];
}));

const pageRules = new Map(pageNames.map((page) => [page, new Set()]));
const sharedRules = new Set();
const keyframes = new Map();
const tree = postcss.parse(sourceCss);

function wrappedRule(rule) {
  let text = rule.toString();
  let parent = rule.parent;
  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule' && parent.name.toLowerCase() !== 'keyframes') {
      const heading = '@' + parent.name + (parent.params ? ' ' + parent.params : '');
      text = heading + ' {\n' + text.split('\n').map((line) => '  ' + line).join('\n') + '\n}';
    }
    parent = parent.parent;
  }
  return text;
}

function normalized(text) {
  return text
    .replaceAll('.ng-guide-shell', '.guide-shell')
    .replaceAll('.ng-ppt-body', '.ppt-body')
    .replaceAll('.ng-ppt-root', '.ppt-root')
    .replaceAll('.ng-ppt-canvas', '.ppt-canvas')
    .replaceAll('.ng-ppt-header', '.ppt-header')
    .replaceAll('.ng-ppt-slide-viewport', '.ppt-slide-viewport')
    .replaceAll('.ng-ppt-slide-surface', '.ppt-slide-surface');
}

tree.walkAtRules(/^keyframes$/i, (rule) => {
  keyframes.set(rule.params.trim(), normalized(rule.toString()));
});

tree.walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && rule.parent.name.toLowerCase() === 'keyframes') return;
  const selectorClasses = Array.from(rule.selector.matchAll(/\.([A-Za-z_-][\w-]*)/g), (match) => match[1]);
  const owners = pageNames.filter((page) => selectorClasses.some((name) => classesByPage.get(page).has(name)));
  if (!owners.length) return;
  const text = normalized(wrappedRule(rule));
  const isNeutralShared = owners.length >= 3 && !/ng-/i.test(text);
  if (isNeutralShared) {
    sharedRules.add(text);
    return;
  }
  for (const owner of owners) pageRules.get(owner).add(text);
});

for (const [name, frame] of keyframes) {
  for (const page of pageNames) {
    if (Array.from(pageRules.get(page)).some((rule) => rule.includes(name))) pageRules.get(page).add(frame);
  }
  if (!/ng-/i.test(name) && Array.from(sharedRules).some((rule) => rule.includes(name))) sharedRules.add(frame);
}

const base = [
  '/* Cross-course primitives only: page-specific teaching layouts stay beside each page. */',
  '.guide-shell .edu-lesson-flow { display: grid; width: 100%; gap: 24px; }',
  '.guide-shell .edu-lesson-flow-step { width: 100%; min-width: 0; }',
  '.lesson-canvas-frame { position: relative; width: 100%; aspect-ratio: 1600 / 900; min-width: 0; overflow: hidden; }',
  '.lesson-canvas-surface { position: absolute; inset: 0 auto auto 0; box-sizing: border-box; width: 1600px; height: 900px; transform-origin: top left; }',
  '.ppt-body { width: 100vw; height: 100vh; overflow: hidden; background: #111827; }',
  '.ppt-body #root, .ppt-body .app-router { width: 100%; height: 100%; }',
  '.ppt-root { position: fixed; inset: 0; overflow: hidden; background: #111827; }',
  '.ppt-canvas { position: absolute; top: 50%; left: 50%; box-sizing: border-box; width: 1600px; height: 900px; overflow: hidden; background: radial-gradient(circle at 90% 3%, rgba(240,126,71,.08), transparent 25%), #f4f7fb; transform-origin: center; }',
  '.ppt-slide-surface { position: absolute; inset: 0; box-sizing: border-box; width: 1600px; height: 900px; }',
  '.ppt-slide-surface > .edu-content-block, .ppt-slide-surface > .edu-stage { box-sizing: border-box; width: 100%; height: 100%; min-width: 0; max-width: 100%; border: 0; border-radius: 0; background: transparent; box-shadow: none; }',
  '.ppt-slide-surface img, .ppt-slide-surface video, .ppt-slide-surface svg, .ppt-slide-surface canvas, .ppt-slide-surface model-viewer { max-width: 100%; }',
].join('\n');

const sharedText = base + (sharedRules.size ? '\n\n' + Array.from(sharedRules).join('\n\n') : '') + '\n';
if (/ng-/i.test(sharedText)) throw new Error('shared.css would contain an ng- name');
fs.writeFileSync(path.join(pagesRoot, 'shared.css'), sharedText);

for (const page of pageNames) {
  const cssFile = path.join(pagesRoot, page, page + '.css');
  const text = Array.from(pageRules.get(page)).join('\n\n');
  fs.writeFileSync(cssFile, text + (text ? '\n' : ''));
}

console.log(JSON.stringify({
  sharedLines: sharedText.split('\n').length,
  pageLines: Object.fromEntries(pageNames.map((page) => [page, fs.readFileSync(path.join(pagesRoot, page, page + '.css'), 'utf8').split('\n').length])),
}));
