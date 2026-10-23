import fs from 'node:fs';
import path from 'node:path';

import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
const {values} = parseArgs({options:{module:{type:'string',default:'Neuron-Guide'},help:{type:'boolean'}}});
if(values.help){console.log('Read-only heuristic style sharing analysis: --module <directory>. Does not remove CSS.');process.exit(0);}
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const moduleRoot = path.resolve(repoRoot, 'modules', values.module);
if(path.dirname(moduleRoot) !== path.join(repoRoot,'modules')) throw new Error('Module must be a direct child of modules/.');
const pagesRoot = path.join(moduleRoot, 'pages');
function pageSources(directory) {
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const file=path.join(directory,entry.name);
    return entry.isDirectory()?pageSources(file):entry.name.endsWith('.tsx')?[file]:[];
  });
}
const pageFiles = pageSources(pagesRoot);

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
    const candidate = [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (candidate && candidate.startsWith(moduleRoot)) sources.push(...collectSources(candidate, seen));
  }
  return sources;
}

function classesFromSource(source) {
  const classes = new Set();
  for (const match of source.matchAll(/className\s*=\s*(?:\{\s*)?(['"`])([\s\S]*?)\1/g)) {
    for (const token of match[2].replace(/\$\{[^}]*\}/g,' ').split(/\s+/)) if (/^[a-zA-Z_-][\w-]*$/.test(token)) classes.add(token);
  }
  // Dynamic class branches: only class-like hyphenated tokens, never arbitrary x/y/text strings.
  for (const match of source.matchAll(/['"`]([a-zA-Z_][\w-]*(?:\s+[\w-]+)*)['"`]/g)) {
    for (const token of match[1].split(/\s+/)) if (token.includes('-')) classes.add(token);
  }
  return classes;
}

const usage = new Map();
for (const file of pageFiles) {
  const page = path.relative(pagesRoot,file).replace(/\.tsx$/, '');
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
