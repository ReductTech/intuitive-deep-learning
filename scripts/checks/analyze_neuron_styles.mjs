import fs from 'node:fs';
import path from 'node:path';

const moduleRoot = path.resolve('modules/Neuron-Guide');
const pagesRoot = path.join(moduleRoot, 'pages');
const pageFiles = fs.readdirSync(pagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(pagesRoot, entry.name, `${entry.name}.tsx`))
  .filter(fs.existsSync);

function collectSources(file, seen = new Set()) {
  const resolved = path.resolve(file);
  if (seen.has(resolved) || !fs.existsSync(resolved)) return [];
  seen.add(resolved);
  const source = fs.readFileSync(resolved, 'utf8');
  const sources = [source];
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) continue;
    const base = path.resolve(path.dirname(resolved), specifier);
    const candidate = [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(fs.existsSync);
    if (candidate && candidate.startsWith(moduleRoot)) sources.push(...collectSources(candidate, seen));
  }
  return sources;
}

function classesFromSource(source) {
  const classes = new Set();
  for (const match of source.matchAll(/(?:className|classNames\()?[\s\S]{0,40}?['"`]([^'"`]+)['"`]/g)) {
    for (const token of match[1].split(/\s+/)) if (/^[a-zA-Z_-][\w-]*$/.test(token)) classes.add(token);
  }
  for (const match of source.matchAll(/['"`]((?:ng|af|edu)-[a-zA-Z0-9_-]+)['"`]/g)) classes.add(match[1]);
  return classes;
}

const usage = new Map();
for (const file of pageFiles) {
  const page = path.basename(path.dirname(file));
  const classes = new Set(collectSources(file).flatMap((source) => [...classesFromSource(source)]));
  for (const className of classes) {
    if (!usage.has(className)) usage.set(className, new Set());
    usage.get(className).add(page);
  }
}

const common = [...usage.entries()]
  .filter(([, pages]) => pages.size >= 3)
  .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
for (const [className, pages] of common) console.log(`${pages.size}\t${className}\t${[...pages].join(',')}`);
