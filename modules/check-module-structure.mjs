import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const modules = path.join(root, 'modules');
const errors = [];
const ids = new Set();
const routes = new Set();
const extensions = ['', '.ts', '.tsx', '.js', '.mjs', '.json', '.css', '/index.ts', '/index.tsx'];
const media = /\.(png|jpe?g|svg|webp|gif|mp4|m4a)$/i;
const runtime = /\.(tsx?|jsx?|mjs|css)$/;
const fail = (file, message) => errors.push(`${path.relative(root, file)}: ${message}`);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const file = path.join(directory, item.name);
    return item.isDirectory() ? walk(file) : [file];
  });
}
function checkEntry(directory, entry, label) {
  if (typeof entry !== 'string' || !/^[^/\\]+\.tsx$/.test(entry)) return fail(directory, `${label} must name a root TSX adapter`);
  const file = path.join(directory, entry);
  if (!fs.existsSync(file)) return fail(file, `${label} does not exist`);
  const source = fs.readFileSync(file, 'utf8');
  const base = entry.replace(/\.tsx$/, '');
  const expected = base[0].toUpperCase() + base.slice(1);
  if (![base, expected].some(name => new RegExp(`\\bexport\\s+(?:function|const|class)\\s+${name}\\b|\\bexport\\s*\\{[^}]*\\b${name}\\b`).test(source))) {
    fail(file, `missing named export ${expected}`);
  }
  if (label === 'ppt.entry' && !/\bexport\s+(?:const\s+deck|\{[^}]*\bdeck\b)/.test(source)) fail(file, 'PPT adapter must export deck');
}
let count = 0;
for (const item of fs.readdirSync(modules, { withFileTypes: true })) {
  if (!item.isDirectory() || item.name === 'shared') continue;
  count++;
  const directory = path.join(modules, item.name);
  const outlineFile = path.join(directory, 'outlines.json');
  if (!fs.existsSync(outlineFile)) { fail(directory, 'unregistered draft belongs in module-drafts/'); continue; }
  const outline = JSON.parse(fs.readFileSync(outlineFile, 'utf8'));
  for (const field of ['id', 'title', 'path', 'entry', 'moduleType', 'difficulty', 'audience']) if (!outline[field]) fail(outlineFile, `missing ${field}`);
  if (ids.has(outline.id)) fail(outlineFile, `duplicate id ${outline.id}`);
  if (routes.has(outline.path)) fail(outlineFile, `duplicate route ${outline.path}`);
  ids.add(outline.id); routes.add(outline.path);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(outline.moduleIdentity?.id || '')) fail(outlineFile, 'missing stable module UUID');
  checkEntry(directory, outline.entry, 'entry');
  if (outline.ppt) checkEntry(directory, outline.ppt.entry, 'ppt.entry');
  if (!fs.existsSync(path.join(directory, 'README.md'))) fail(directory, 'missing README.md');
  const pageIds = new Set();
  for (const page of outline.pages || []) {
    for (const field of ['id', 'title', 'goal', 'summary']) if (!page[field]) fail(outlineFile, `page ${page.id || '?'} missing ${field}`);
    if (pageIds.has(page.id)) fail(outlineFile, `duplicate page ${page.id}`);
    pageIds.add(page.id);
  }
  if (!pageIds.size) fail(outlineFile, 'no implemented page index');
  for (const file of walk(directory)) {
    const relative = path.relative(directory, file).split(path.sep);
    if (relative.includes('assets') || relative.includes('review-dist')) continue;
    if (media.test(file)) fail(file, 'course media belongs in assets/');
    if (!runtime.test(file) || file.endsWith('.css')) continue;
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isStringLiteral(node) && /(?:^|\/)modules-legacy\//.test(node.text)) fail(file, 'runtime reference to modules-legacy/');
      const spec = ts.isImportDeclaration(node) || ts.isExportDeclaration(node) ? node.moduleSpecifier
        : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? node.arguments[0] : null;
      if (spec && ts.isStringLiteral(spec) && spec.text.startsWith('.')) {
        const target = path.resolve(path.dirname(file), spec.text.split('?')[0]);
        if (!extensions.some(extension => fs.existsSync(target + extension))) fail(file, `missing import ${spec.text}`);
        const owner = path.relative(modules, target).split(path.sep)[0];
        if (owner !== item.name && owner !== 'shared') fail(file, `import leaves its module: ${spec.text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  const manifest = path.join(directory, 'assets/manifest.json');
  if (fs.existsSync(manifest)) for (const file of JSON.parse(fs.readFileSync(manifest, 'utf8'))) {
    if (!fs.existsSync(path.join(directory, 'assets', file))) fail(manifest, `missing asset ${file}`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Module structure OK: ${count} active modules; entries, page IDs, asset ownership and import boundaries verified.`);
