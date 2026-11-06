// node modules/ResNet-Transfer-Guide/course-order.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function courseItems() {
  const source = fs.readFileSync(path.join(__dirname, 'course.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: id => {
    if (id.startsWith('./pages/')) return { [path.basename(id)]: () => null };
    return require(id);
  } });
  return module.exports.resNetTransferCourse;
}
test('addition and projection follow page13 in order; all remaining identities stay unique', () => {
  const items = courseItems();
  assert.equal(items.length, 27);
  assert.ok(!items.some(item => item.id === '13-residual-learning'));
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.equal(items[11].id, '12b-residual-idea');
  assert.equal(items[12].id, '14-basic-block');
  assert.equal(items[13].id, '15-elementwise-addition');
  assert.equal(items[14].id, '18-projection-shortcut');
  assert.equal(items[15].id, '16-zero-residual');
  assert.equal(items[16].id, '14b-super-resolution');
  assert.equal(items[17].id, '17-shortcut-gradient');
  assert.equal(items[21].id, '22-transferable-visual-experience');
  assert.equal(items[22].id, '23-replace-head');
  assert.equal(items[26].id, '28-build-training-plan');
  assert.ok(!items.some(item => item.id === '22b-transfer-check'));
  assert.ok(!fs.readFileSync(path.join(__dirname, 'course.tsx'), 'utf8').includes('ResidualLearningPage'));
});
test('Guide, PPT and outline agree on the reordered pages without renaming their identities', () => {
  const items = courseItems();
  const outline = JSON.parse(fs.readFileSync(path.join(__dirname, 'outlines.json'), 'utf8'));
  assert.ok(!outline.pages.some(page => page.id === '13-residual-learning'));
  const active = new Set(items.map(item => item.id));
  assert.deepEqual(outline.pages.filter(page => active.has(page.id)).map(page => page.id), Array.from(items, item => item.id));
  assert.ok(outline.pages.find(page => page.id === '12b-residual-idea').next.includes('残差块'));
  assert.ok(outline.pages.find(page => page.id === '14-basic-block').next.includes('相加'));
  assert.ok(outline.pages.find(page => page.id === '18-projection-shortcut').next.includes('输出零'));
  assert.ok(outline.pages.find(page => page.id === '16-zero-residual').next.includes('超分辨率'));
  assert.ok(outline.pages.find(page => page.id === '14b-super-resolution').next.includes('梯度'));
  for (const file of ['GuidePage.tsx', 'ResNetTransferPpt.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    assert.ok(source.includes("from './course'"));
    assert.ok(source.includes('resNetTransferCourse.map('));
  }
  const precedingPage = fs.readFileSync(path.join(__dirname, 'pages/ResidualIdeaPage/ResidualIdeaPage.tsx'), 'utf8');
  assert.ok(!precedingPage.includes('下一页继续比较修改量'));
  assert.ok(precedingPage.includes('下一页认识残差块的两条路线'));
});

function reconcileProgress(value, ids) {
  const source = fs.readFileSync(path.join(__dirname, 'services/guideProgress.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports });
  return JSON.parse(JSON.stringify(module.exports.reconcileGuideProgress(value, ids)));
}

test('retained completion unlocks the following page even when the host starts visibility at one', () => {
  const ids = ['intro', 'pixels', 'features'];
  assert.deepEqual(reconcileProgress({ completedIds: ['intro'], visibleCount: 1 }, ids), {
    completedIds: ['intro'], visibleCount: 2, completed: false,
  });
  assert.equal(reconcileProgress({ completedIds: ['intro', 'pixels'], visibleCount: 1 }, ids).visibleCount, 3);
  assert.equal(reconcileProgress({ completedIds: ['features'], visibleCount: 1 }, ids).visibleCount, 3);
});

test('resume keeps a later visible page and ignores removed or duplicate completion IDs', () => {
  const ids = ['intro', 'pixels', 'features'];
  assert.deepEqual(reconcileProgress({ completedIds: ['intro', 'removed', 'intro'], visibleCount: 3 }, ids), {
    completedIds: ['intro'], visibleCount: 3, completed: false,
  });
  assert.equal(reconcileProgress(null, ids).visibleCount, 1);
});
