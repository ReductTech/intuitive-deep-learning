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
  assert.equal(items[11].id, 'a1d23748-fd53-49f7-93a6-9ed439d92efd');
  assert.equal(items[12].id, '73dd859f-dc1e-4ab1-a3fb-b16b4338e660');
  assert.equal(items[13].id, 'd00bd957-dda5-4933-bd9f-55f41b5faff3');
  assert.equal(items[14].id, 'ad198f4a-7cb6-4dee-b49c-7c0096a8f152');
  assert.equal(items[15].id, 'c7c016d8-8eb6-4880-8631-da52f831ff3f');
  assert.equal(items[16].id, 'a708ba3c-e0f6-4730-8a1a-6c8d2eeee892');
  assert.equal(items[17].id, '9db13104-04c6-4e6c-95a9-0f7a2d51a463');
  assert.equal(items[21].id, '0765ad30-c2ed-472c-8d1e-4e3894fe1f72');
  assert.equal(items[22].id, '59fca0aa-209a-42a9-b4d8-f8718fa394ef');
  assert.equal(items[26].id, 'b3d92411-5648-4463-94a0-cee32935f379');
  assert.ok(!items.some(item => item.id === '22b-transfer-check'));
  assert.ok(!fs.readFileSync(path.join(__dirname, 'course.tsx'), 'utf8').includes('ResidualLearningPage'));
});
test('Guide, PPT and outline agree on the reordered pages without renaming their identities', () => {
  const items = courseItems();
  const outline = JSON.parse(fs.readFileSync(path.join(__dirname, 'outlines.json'), 'utf8'));
  assert.ok(!outline.pages.some(page => page.id === '13-residual-learning'));
  const active = new Set(items.map(item => item.id));
  assert.deepEqual(outline.pages.filter(page => active.has(page.id)).map(page => page.id), Array.from(items, item => item.id));
  assert.ok(outline.pages.find(page => page.id === 'a1d23748-fd53-49f7-93a6-9ed439d92efd').next.includes('残差块'));
  assert.ok(outline.pages.find(page => page.id === '73dd859f-dc1e-4ab1-a3fb-b16b4338e660').next.includes('相加'));
  assert.ok(outline.pages.find(page => page.id === 'ad198f4a-7cb6-4dee-b49c-7c0096a8f152').next.includes('输出零'));
  assert.ok(outline.pages.find(page => page.id === 'c7c016d8-8eb6-4880-8631-da52f831ff3f').next.includes('超分辨率'));
  assert.ok(outline.pages.find(page => page.id === 'a708ba3c-e0f6-4730-8a1a-6c8d2eeee892').next.includes('梯度'));
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
