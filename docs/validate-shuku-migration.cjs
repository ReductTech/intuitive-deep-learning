// Run: node docs/validate-shuku-migration.cjs
// Documentation only: no services, database or external repository required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const name = '术库业务逻辑迁移范围.md';
const text = fs.readFileSync(path.join(__dirname, name), 'utf8');
assert.equal((text.match(/^```/gm) || []).length % 2, 0, 'unclosed code fence');
for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
  const target = path.resolve(__dirname, decodeURIComponent(match[1]));
  const relative = path.relative(root, target);
  assert.ok(relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative), 'cross-repository link');
  assert.ok(fs.existsSync(target), 'missing reference: ' + match[1]);
}
const scopes = [...text.matchAll(/^\| (M\d{2}) \|/gm)].map(row => row[1]);
assert.deepEqual(scopes, Array.from({length: 13}, (_, i) => 'M' + String(i + 1).padStart(2, '0')), 'missing or duplicated migration scope');
assert.ok(fs.readFileSync(path.join(root, 'README.md'), 'utf8').includes('docs/' + name), 'missing project index link');
console.log('PASS: 13 migration scopes, portable references, project index and Markdown fences.');
