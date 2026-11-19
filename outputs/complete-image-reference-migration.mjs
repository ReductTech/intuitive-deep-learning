import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const {loadTypeScript} = await import(pathToFileURL(path.join(root, '../creator-skill/scripts/media/rewrite_asset_paths.mjs')));
const ts = loadTypeScript(root);
const conversions = JSON.parse(fs.readFileSync(path.join(root, 'outputs/images-in-place.json'), 'utf8')).images;
const maps = new Map();
for (const row of conversions.filter(row => row.status === 'converted' && row.source !== row.target)) {
  const parts = row.source.split('/'), course = parts[1];
  const map = maps.get(course) ?? new Map();
  map.set(parts.slice(2).join('/'), row.target.split('/').slice(2).join('/'));
  maps.set(course, map);
}
const slash = value => value.replaceAll('\\', '/');
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const updates = [], records = [];
function walk(folder) {
  return fs.readdirSync(folder, {withFileTypes:true}).flatMap(item => {
    if (['shared', '_scratchpad', 'node_modules', '__pycache__'].includes(item.name)) return [];
    const file = path.join(folder, item.name);
    return item.isDirectory() ? walk(file) : /\.(?:[cm]?[jt]sx?|json|gltf)$/i.test(item.name) ? [file] : [];
  });
}
for (const [id, mappings] of maps) {
  const course = path.join(root, 'modules', id);
  for (const file of walk(course)) {
    const before = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, before, ts.ScriptTarget.Latest, true,
      /\.(json|gltf)$/.test(file) ? ts.ScriptKind.JSON : undefined);
    const edits = [];
    function literal(value) {
      if (/^(?:https?:|data:|blob:|\/\/)/i.test(value)) return null;
      const split = value.search(/[?#]/), clean = split < 0 ? value : value.slice(0, split), suffix = split < 0 ? '' : value.slice(split);
      if (!/\.(png|jpe?g|gif|bmp|tiff?|avif)$/i.test(clean)) return null;
      if (mappings.has(clean)) return mappings.get(clean) + suffix;
      if (mappings.has('assets/' + clean)) return mappings.get('assets/' + clean).slice(7) + suffix;
      const resolved = slash(path.relative(course, path.resolve(path.dirname(file), clean)));
      if (mappings.has(resolved)) {
        let next = slash(path.relative(path.dirname(file), path.join(course, mappings.get(resolved))));
        if (clean.startsWith('./') && !next.startsWith('.')) next = './' + next;
        return next + suffix;
      }
      // A short basename is safe only when every matching source has the same new basename.
      if (!clean.includes('/')) {
        const selected = [...mappings].filter(([old]) => path.posix.basename(old) === clean);
        const targets = new Set(selected.map(([,next]) => path.posix.basename(next)));
        if (selected.length && targets.size === 1) return [...targets][0] + suffix;
      }
      return null;
    }
    function visit(node) {
      if (ts.isStringLiteralLike(node)) {
        const next = literal(node.text);
        if (next && next !== node.text) {
          edits.push({start:node.getStart(source)+1, end:node.getEnd()-1, value:next});
          records.push({file:slash(path.relative(root,file)),before:node.text,after:next});
        }
      } else if (ts.isTemplateExpression(node)) {
        const parts = [node.head.text, ...node.templateSpans.map(span => span.literal.text)];
        const pattern = new RegExp('^assets/' + parts.map(escape).join('.*?') + '$');
        const selected = [...mappings].filter(([old]) => pattern.test(old));
        if (selected.length && selected.every(([old,next]) => old.replace(/\.[^.]+$/,'.webp') === next)) {
          const raw = node.getText(source), next = raw.replace(/\.(png|jpe?g|gif|bmp|tiff?|avif)`$/i,'.webp`');
          if (next !== raw) {
            edits.push({start:node.getStart(source),end:node.getEnd(),value:next});
            records.push({file:slash(path.relative(root,file)),before:raw,after:next});
            return;
          }
        }
      }
      ts.forEachChild(node,visit);
    }
    visit(source);
    if (!edits.length) continue;
    let after = before;
    for (const edit of edits.sort((a,b) => b.start-a.start)) after = after.slice(0,edit.start)+edit.value+after.slice(edit.end);
    const checked = ts.createSourceFile(file,after,ts.ScriptTarget.Latest,true,/\.(json|gltf)$/.test(file)?ts.ScriptKind.JSON:undefined);
    if (checked.parseDiagnostics.length > source.parseDiagnostics.length) throw Error('New syntax error: ' + file);
    updates.push({file,before,after});
  }
}
for (const row of updates) if(fs.readFileSync(row.file,'utf8')!==row.before) throw Error('Source changed: '+row.file);
for (const row of updates) fs.writeFileSync(row.file,row.after);
fs.writeFileSync(path.join(root,'outputs/image-reference-supplement.json'),JSON.stringify({files:updates.length,records},null,2));
console.log(JSON.stringify({files:updates.length,references:records.length}));
