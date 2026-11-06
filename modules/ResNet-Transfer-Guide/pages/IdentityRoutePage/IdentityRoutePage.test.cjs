// Run from the repository: node modules/ResNet-Transfer-Guide/pages/IdentityRoutePage/IdentityRoutePage.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, dependencies = {}) {
  const mod = { exports: {} };
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } });
  vm.runInNewContext(result.outputText, { module: mod, exports: mod.exports, require: id => id in dependencies ? dependencies[id]
    : id.endsWith('.css') ? {} : require(id) });
  return mod.exports;
}
const model = load(path.join(__dirname, 'identityConstruction.ts'));
const plain = value => JSON.parse(JSON.stringify(value));
const sharedRoot = path.resolve(__dirname, '../../../shared/react');
const utils = load(path.join(sharedRoot, 'utils.ts'));
const typography = load(path.join(sharedRoot, 'typography/Typography.tsx'), { '../utils': utils });
const shared = {
  ...typography,
  ...load(path.join(sharedRoot, 'controls/Button.tsx'), { '../typography/Typography': typography, '../utils': utils }),
  ...load(path.join(sharedRoot, 'layout/ContentBlock.tsx'), { '../typography/Typography': typography, '../utils': utils }),
  ...load(path.join(sharedRoot, 'feedback/NoticeStrip.tsx'), { '../typography/Typography': typography, '../utils': utils }),
  ...load(path.join(sharedRoot, 'learning/MathFormulaBlock.tsx'), { '../utils': utils }),
};
function elements(node, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, result));
  else if (node && typeof node === 'object' && node.props) { result.push(node); elements(node.props.children, result); }
  return result;
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function harness() {
  const state = [], refs = [], deps = [];
  let cursor, refCursor, effectCursor, effects, calls = 0;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
    useRef(initial) { const i = refCursor++; return refs[i] ??= { current: initial }; },
    useEffect(fn, next) { const i = effectCursor++; if (!deps[i] || next.some((value, j) => value !== deps[i][j])) { deps[i] = next; effects.push(fn); } },
  };
  const hook = load(path.resolve(__dirname, '../../hooks/useCompleteOnce.ts'), { react });
  const page = load(path.join(__dirname, 'IdentityRoutePage.tsx'), {
    react, '../../../shared/react': shared, '../../hooks/useCompleteOnce': hook, './identityConstruction': model,
    '../../assets/recycling/camera-views/bottle-front.png': { default: '/lesson-assets/bottle-upright.png' },
  });
  const onComplete = () => calls++;
  return { get calls() { return calls; }, render() {
    cursor = 0; refCursor = 0; effectCursor = 0; effects = [];
    const tree = page.IdentityRoutePage({ onComplete }); effects.forEach(fn => fn()); return tree;
  } };
}
const buttons = tree => elements(tree).filter(element => element.type === shared.Button);
function findButton(tree, label) {
  const button = buttons(tree).find(element => text(element.props.children) === label || element.props['aria-label'] === label);
  assert.ok(button, 'button: ' + label); return button;
}
function click(tree, label) {
  const button = findButton(tree, label); assert.ok(!button.props.disabled, label + ' must be enabled'); button.props.onClick();
}

function construct(app) {
  let tree = app.render(); click(tree, '保留原有网络 ↓'); tree = app.render();
  for (let index = 1; index <= 3; index++) { click(tree, '追加第' + index + '层恒等映射'); tree = app.render(); }
  return tree;
}
test('all stages and classifier parameters are copied independently and the inserted layers preserve nonnegative features', () => {
  let state = model.transitionConstruction(model.initialConstruction, { type: 'copy' });
  assert.deepEqual(plain(state.parameters), plain(model.ORIGINAL)); assert.notEqual(state.parameters, model.ORIGINAL);
  for (let index = 0; index < 4; index++) assert.notEqual(state.parameters[index], model.ORIGINAL[index]);
  assert.equal(model.constructedOutput(state), null);
  for (const index of [0, 1, 2]) state = model.transitionConstruction(state, { type: 'identity', index });
  assert.equal(state.verified, false); assert.ok(model.canVerify(state));
  for (let index = 0; index < 150; index++) {
    const input = [index / 7, (index % 5) / 3, index % 11];
    assert.deepEqual(plain(model.constructedOutput(state, input)), plain(model.originalRoute(input).output));
  }
  assert.notDeepEqual(plain(model.constructedOutput(state, [-1, 2, 3])), plain(model.originalRoute([-1, 2, 3]).output));
});
test('verification requires copied parameters and actual identity construction, with numeric comparison, undo and reset', () => {
  const next = model.transitionConstruction, initial = model.initialConstruction;
  Object.freeze(initial); Object.freeze(initial.identities);
  for (const action of [{ type: 'verify' }, { type: 'conclusion' }, { type: 'identity', index: 0 }]) assert.equal(next(initial, action), initial);
  let state = next(initial, { type: 'copy' });
  assert.equal(next(state, { type: 'identity', index: 2 }), state);
  for (const index of [0, 1, 2]) state = next(state, { type: 'identity', index });
  assert.equal(next(state, { type: 'conclusion' }), state);
  const parameters = plain(state.parameters); parameters[3][0][0] = 999;
  const corrupt = { ...state, parameters }; assert.equal(next(corrupt, { type: 'verify' }), corrupt);
  state = next(state, { type: 'verify' }); assert.equal(state.verified, true);
  state = next(state, { type: 'conclusion' }); assert.equal(state.conclusion, true); assert.equal(state.optimizationSeen, true);
  state = next(state, { type: 'review' }); assert.equal(state.conclusion, false); assert.equal(state.optimizationSeen, true);
  state = next(state, { type: 'identity', index: 1 }); state = next(state, { type: 'undo' });
  assert.equal(state.verified, false); assert.equal(state.optimizationSeen, false); assert.deepEqual(plain(state.identities), [true, false, false]);
  state = next(state, { type: 'reset' }); assert.equal(state.parameters, null); assert.deepEqual(plain(state.identities), [false, false, false]);
});
test('real page handlers enforce construction and explicit verification, not progress labels, and completion reports once', () => {
  const app = harness(); let tree = app.render();
  assert.equal(tree.props['data-complete'], false);
  assert.ok(findButton(tree, '追加第1层恒等映射').props.disabled);
  findButton(tree, '追加第1层恒等映射').props.onClick(); tree = app.render();
  assert.equal(tree.props['data-copied'], false);
  click(tree, '保留原有网络 ↓'); tree = app.render();
  assert.ok(findButton(tree, '追加第2层恒等映射').props.disabled);
  for (let index = 1; index <= 3; index++) { click(tree, '追加第' + index + '层恒等映射'); tree = app.render(); }
  assert.equal(app.calls, 0); assert.equal(tree.props['data-verified'], false);
  click(tree, '验证输出一致'); tree = app.render(); assert.equal(tree.props['data-verified'], true); assert.equal(tree.props['data-complete'], false); assert.equal(app.calls, 0);
  click(tree, '有这样的解，为什么还没训练好？ →'); tree = app.render(); assert.equal(tree.props['data-conclusion'], true); assert.equal(tree.props['data-complete'], true); assert.equal(app.calls, 1);
  click(tree, '返回恒等验证'); tree = app.render(); assert.equal(tree.props['data-complete'], true);
  click(tree, '撤销本层及后续'); tree = app.render(); assert.equal(tree.props['data-complete'], false);
  click(tree, '追加第3层恒等映射'); tree = app.render();
  click(tree, '验证输出一致'); tree = app.render(); assert.equal(app.calls, 1); assert.equal(tree.props['data-complete'], false);
  click(tree, '有这样的解，为什么还没训练好？ →'); tree = app.render(); assert.equal(app.calls, 1); assert.equal(tree.props['data-complete'], true);
  click(tree, '重新开始'); tree = app.render(); assert.equal(tree.props['data-copied'], false); assert.equal(tree.props['data-complete'], false);
  for (const key of [' ', 'Enter']) {
    let stopped = false, prevented = false;
    tree.props.onKeyDown({ key, repeat: true, target: { closest: () => ({}) }, stopPropagation() { stopped = true; }, preventDefault() { prevented = true; } });
    assert.ok(stopped); assert.ok(prevented);
  }
});
test('actual Shared SSR renders aligned network stages, one local witness, only verified green, and delayed conclusion', () => {
  const app = harness(); let tree = app.render();
  const check = () => {
    const html = renderToStaticMarkup(tree);
    assert.ok(html.includes('edu-content-head')); assert.ok(html.includes('多加几层，也能保留原结果吗？'));
    assert.ok(!html.includes('[object Object]')); assert.ok(!html.includes('NaN'));
    if (!tree.props['data-conclusion']) {
      assert.equal((html.match(/alt="同一张塑料瓶输入照片"/g) || []).length, 1);
      assert.ok(html.includes('原有特征提取层')); assert.ok(html.includes('末尾追加三层恒等映射')); assert.ok(html.includes('原分类头'));
    }
    assert.ok(!/阶段 [ABC]/.test(html));
    assert.ok(!html.includes('同维度、非负特征的手工构造；并非论文实际训练流程。输出条不是分类概率。'));
    assert.ok(!html.includes('rtg-identity-route__boundary'));
    assert.ok(!html.includes('resnet-figure1'));
    const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), match => match[1]); assert.equal(ids.length, new Set(ids).size);
    return html;
  };
  assert.ok(!check().includes('tone-success'));
  click(tree, '保留原有网络 ↓'); tree = app.render(); assert.ok(check().includes('原有层与分类头的参数全部保留'));
  click(tree, '追加第1层恒等映射'); tree = app.render(); let html = check();
  assert.ok(html.includes('进入新增层的表示：0.8、0.25、0.3')); assert.ok(html.includes('离开新增层的表示：0.8、0.25、0.3'));
  assert.ok(!html.includes('tone-success')); assert.ok(!html.includes('能表示出来'));
  for (const index of [2, 3]) { click(tree, '追加第' + index + '层恒等映射'); tree = app.render(); check(); }
  assert.ok(!check().includes('tone-success'));
  click(tree, '验证输出一致'); tree = app.render(); assert.ok(check().includes('tone-success')); assert.ok(check().includes('输出一致'));
  click(tree, '有这样的解，为什么还没训练好？ →'); tree = app.render(); html = check();
  for (const phrase of ['好解存在，不等于训练能找到', '手工构造', '训练寻找', '当前参数', '计算损失', '梯度更新', '初始化', '优化困难，难在寻找参数', '更深普通网络的训练误差反而更高', '返回恒等验证']) assert.ok(html.includes(phrase), phrase);
  const emphasisHeading = elements(tree).find(node => 'data-reasoning-heading' in node.props);
  assert.equal(emphasisHeading.type, shared.Typography); assert.equal(emphasisHeading.props.as, 'h2'); assert.equal(emphasisHeading.props.variant, 'h1');
  const evidence = elements(tree).find(node => node.props.className === 'rtg-identity-route__optimization-evidence');
  const statements = elements(evidence).filter(node => node.type === shared.Typography);
  assert.equal(statements[0].props.as, 'h3'); assert.equal(statements[0].props.variant, 'h2'); assert.equal(statements[0].props.tone, 'accent');
  assert.equal(statements[1].props.variant, 'body'); assert.equal(statements[1].props.tone, 'muted');
  assert.ok(!html.includes('下一步：让保留输入更直接'));
  assert.ok(!html.includes('rtg-identity-route__finding')); // No empty full-width transition row remains.
  assert.ok(html.includes('rtg-identity-route__review'));
  assert.ok(!html.includes('rtg-identity-route__comparison')); // Expanded reasoning replaces the network, not another stacked block.
});
test('page is after the overfitting comparison, old numeric lesson is replaced, and layout constraints are retained', () => {
  const root = path.resolve(__dirname, '../..');
  const outline = JSON.parse(fs.readFileSync(path.join(root, 'outlines.json'), 'utf8'));
  assert.deepEqual(outline.pages.slice(8, 12).map(page => page.id), ['11-degradation-problem', '11b-overfitting-vs-degradation', '12-identity-route', '12b-residual-idea']);
  assert.equal(outline.pages[10].title, harness().render().props.title);
  const course = fs.readFileSync(path.join(root, 'course.tsx'), 'utf8');
  const ids = Array.from(course.matchAll(/id: '([^']+)'/g), match => match[1]);
  assert.deepEqual(ids.slice(8, 12), outline.pages.slice(8, 12).map(page => page.id));
  assert.equal(ids.length, new Set(ids).size);
  const source = fs.readFileSync(path.join(__dirname, 'IdentityRoutePage.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'IdentityRoutePage.css'), 'utf8');
  require('postcss').parse(css);
  assert.ok(!/font-size|font-weight|line-height|overflow\s*:|#[0-9a-f]{3,8}\b/i.test(css));
  assert.ok(css.includes('prefers-reduced-motion')); assert.ok(css.includes('minmax(0,'));
  assert.ok(!/HAND_SET_LAYERS|trainingCurve|Question|localStorage|modules-legacy/.test(source));
  for (const match of css.matchAll(/\.rtg-identity-route__([a-z-]+)/g)) assert.ok(source.includes("'" + match[1] + "'"), 'unused CSS class: ' + match[1]);
  assert.ok(fs.existsSync(path.join(root, 'assets/recycling/camera-views/bottle-front.png')));
});


test('identities follow all original feature layers; a signed intermediate is not clamped prematurely', () => {
  let state = model.transitionConstruction(model.initialConstruction, { type: 'copy' });
  for (const index of [0, 1, 2]) state = model.transitionConstruction(state, { type: 'identity', index });
  // Original layers temporarily negate, then restore a feature. Interspersed ReLU would destroy it.
  const I = [[1,0,0],[0,1,0],[0,0,1]], neg = [[-1,0,0],[0,1,0],[0,0,1]];
  state = { ...state, parameters: [neg,neg,I,I] };
  assert.deepEqual(plain(model.constructedOutput(state)), [.3,.8,.5]);
});
