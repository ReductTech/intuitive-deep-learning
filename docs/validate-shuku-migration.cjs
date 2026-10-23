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
for (const boundary of ['backend/src/shuku_backend/', 'idl_backend` 不导入', '减论 UUID 全局唯一', '任务状态：实施中', '进程内任务', '不新增面向用户的 ZIP 上传入口', '数据库与文件成套备份恢复']) {
  assert.ok(task.includes(boundary), 'task guide omits boundary: ' + boundary);
}
console.log('PASS: 8 implementation tasks cover all 13 scopes, dependency boundaries and task document references.');

for (const doc of [text, task]) {
  assert.ok(doc.includes('第一阶段') && doc.includes('后续') && doc.includes('共用密码') && doc.includes('测试账号'), 'both guides must permit demo authentication before Jianlun integration');
  assert.ok(!doc.includes('不迁移共用测试密码、测试账号') && !doc.includes('不迁移 Demo 测试用户'), 'remove superseded ban on demo login');
}
for (const behavior of ['登录会话', '退出', '失败次数限制', 'SHUKU_DEMO_PASSWORD', 'SHUKU_AUTH_PROVIDER=demo|jianlun', '不在接口故障时自动降级']) {
  assert.ok(task.includes(behavior), 'phased authentication task omits: ' + behavior);
}
console.log('PASS: Demo authentication first, replaceable identity provider and later Jianlun integration.');

const progress = fs.readFileSync(path.join(__dirname, '术库后端迁移进度.md'), 'utf8');
assert.ok(task.includes('](术库后端迁移进度.md)'), 'task must link actual progress');
assert.ok(progress.includes('T02 部分完成') && progress.includes('T05 共创本地闭环已实现') && progress.includes('T06 部分完成') && progress.includes('T03 基础交接已完成'), 'distinguish completed local publication from pending collaboration and governance');
assert.ok(fs.existsSync(path.join(root, 'backend/src/shuku_backend/migrations/001_foundation.sql')), 'foundation migration resource missing');
console.log('PASS: implementation progress distinguishes verified foundation from pending business integration.');

for (const file of ['docs/术库后端迁移进度.md', 'backend/src/shuku_backend/README.md']) {
  const full = path.join(root, file), value = fs.readFileSync(full, 'utf8');
  for (const match of value.matchAll(/\]\(([^)]+)\)/g)) {
    const target = path.resolve(path.dirname(full), match[1]);
    assert.ok(target.startsWith(root + path.sep) && fs.existsSync(target), file + ': invalid local reference ' + match[1]);
  }
}

assert.ok(fs.existsSync(path.join(root, 'backend/src/shuku_backend/migrations/002_revisions.sql')), 'revision migration missing');
assert.ok(fs.existsSync(path.join(root, 'scripts/check-shuku-workflow.mjs')), 'browser workflow acceptance missing');

assert.ok(fs.existsSync(path.join(root, 'backend/src/shuku_backend/migrations/003_collaboration.sql')), 'collaboration migration missing');

assert.ok(fs.existsSync(path.join(root, 'backend/src/shuku_backend/migrations/004_governance.sql')), 'governance migration missing');
