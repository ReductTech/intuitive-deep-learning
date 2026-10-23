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

const taskName = '术库后端独立模块迁移任务.md';
const task = fs.readFileSync(path.join(__dirname, taskName), 'utf8');
assert.ok(text.includes('](' + taskName + ')'), 'scope guide must link implementation tasks');
assert.equal((task.match(/^```/gm) || []).length % 2, 0, 'task guide has unclosed code fence');
for (const match of task.matchAll(/\]\(([^)]+)\)/g)) {
  const target = path.resolve(__dirname, decodeURIComponent(match[1]));
  const relative = path.relative(root, target);
  assert.ok(relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative), 'task guide cross-repository link');
  assert.ok(fs.existsSync(target), 'task guide missing reference: ' + match[1]);
}
assert.deepEqual([...task.matchAll(/^\| (T\d{2}) /gm)].map(m => m[1]), Array.from({length: 8}, (_, i) => 'T' + String(i + 1).padStart(2, '0')), 'task sequence must be complete');
const taskRows = [...task.matchAll(/^\| T\d{2} .*$/gm)].map(m => m[0]).join('\n');
for (const scope of scopes) assert.ok(taskRows.includes(scope), 'implementation task omits scope: ' + scope);
for (const boundary of ['backend/src/shuku_backend/', 'idl_backend` 不导入', '减论 UUID 全局唯一', '本次仅确定任务', '进程内任务', '不新增面向用户的 ZIP 上传入口', '数据库与文件成套备份恢复']) {
  assert.ok(task.includes(boundary), 'task guide omits boundary: ' + boundary);
}
console.log('PASS: 8 implementation tasks cover all 13 scopes, dependency boundaries and task document references.');
