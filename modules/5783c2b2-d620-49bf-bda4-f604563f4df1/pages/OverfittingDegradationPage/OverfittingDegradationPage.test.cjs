// Run from the repository: node modules/ResNet-Transfer-Guide/pages/OverfittingDegradationPage/OverfittingDegradationPage.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { module: mod, exports: mod.exports, require: id => id in dependencies ? dependencies[id]
    : id.endsWith('.css') ? {} : require(id) });
  return mod.exports;
}
const { defaultTheme } = load(path.resolve(__dirname, '../../../shared/react/theme.ts'));
const model = load(path.join(__dirname, 'comparisonChart.ts'), { '../../../shared/react': { defaultTheme } });
function elements(node, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, result));
  else if (node && typeof node === 'object' && node.props) {
    result.push(node); elements(node.props.children, result);
  }
  return result;
}

test('curve colors have fixed meanings and only line style changes for network depth', () => {
  const train = defaultTheme.colors.find(color => color.token === '--ui-accent').value;
  const heldOut = defaultTheme.colors.find(color => color.token === '--ui-accent-alt').value;
  for (const kind of ['overfitting', 'degradation']) for (const visible of [false, true]) {
    const option = model.buildComparisonChart(kind, visible);
    assert.equal(option.series.length, visible ? 2 : 1);
    assert.equal(option.series[0].lineStyle.color, train);
    assert.equal(option.series[0].lineStyle.type, 'solid');
    assert.equal(option.animation, false);
    assert.equal(option.tooltip.show, false);
    assert.equal(option.yAxis.axisLabel.show, false);
    if (visible) {
      assert.equal(option.series[1].lineStyle.color, kind === 'overfitting' ? heldOut : train);
      assert.equal(option.series[1].lineStyle.type, kind === 'overfitting' ? 'solid' : 'dashed');
    }
  }
  const { training, test: heldOutCurve, deepTraining } = model.conceptualCurves;
  for (let i = 0; i < training.length; i++) {
    for (const curve of [training, heldOutCurve, deepTraining]) {
      assert.ok(curve[i].every(Number.isFinite));
      assert.ok(curve[i][1] >= 0 && curve[i][1] <= 1);
    }
    if (i) {
      assert.ok(training[i][1] < training[i - 1][1]);
      assert.ok(deepTraining[i][1] > training[i][1]);
    }
  }
  assert.ok(heldOutCurve.at(-1)[1] > heldOutCurve[20][1]);
  assert.ok(heldOutCurve[0][1] > heldOutCurve[20][1]);
});

test('actual vendored ECharts renders all four comparison states as SVG with the specified colors and dashes', () => {
  // This browser UMD asset lives in an ESM package; provide its documented UMD exports explicitly.
  const echartsModule = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../../shared/vendor/echarts/5.6.0/echarts.min.js'), 'utf8'),
    { module: echartsModule, exports: echartsModule.exports, console, setTimeout, clearTimeout });
  const echarts = echartsModule.exports;
  for (const kind of ['overfitting', 'degradation']) for (const visible of [false, true]) {
    const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width: 850, height: 330 });
    try {
      chart.setOption(model.buildComparisonChart(kind, visible));
      const svg = chart.renderToSVGString().toLowerCase();
      assert.ok(svg.startsWith('<svg'));
      assert.ok(svg.includes(model.comparisonColors.training.toLowerCase()));
      assert.equal(svg.includes(model.comparisonColors.test.toLowerCase()), kind === 'overfitting' && visible);
      if (kind === 'degradation' && visible) assert.ok(svg.includes('stroke-dasharray'));
    } finally { chart.dispose(); }
  }
});

test('only two comparisons unlock sequentially; the second reveal completes without an optimization step', () => {
  const state = [], refs = [], deps = [];
  let cursor, refCursor, effectCursor, effects, calls = 0;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
    useRef(initial) { const i = refCursor++; return refs[i] ??= { current: initial }; },
    useMemo(fn) { return fn(); },
    useEffect(fn, next) { const i = effectCursor++; if (!deps[i] || next.some((value, j) => value !== deps[i][j])) { deps[i] = next; effects.push(fn); } },
  };
  const shared = Object.fromEntries(['Button', 'ContentBlock', 'EChartsChart', 'NoticeStrip', 'Typography'].map(name => [name, () => null]));
  const hook = load(path.resolve(__dirname, '../../hooks/useCompleteOnce.ts'), { react });
  const { OverfittingDegradationPage } = load(path.join(__dirname, 'OverfittingDegradationPage.tsx'), {
    react, '../../../shared/react': shared, '../../hooks/useCompleteOnce': hook, './comparisonChart': model,
  });
  const onComplete = () => calls++;
  const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node);
  const render = () => {
    cursor = 0; refCursor = 0; effectCursor = 0; effects = [];
    const tree = OverfittingDegradationPage({ onComplete }); effects.forEach(fn => fn());
    assert.ok(!text(tree).includes('曲线仅为教学示意，非实测数据。先确认比较对象，再观察差异。'));
    const notices = elements(tree).filter(node => node.type === shared.NoticeStrip);
    assert.equal(notices.length, tree.props['data-complete'] ? 1 : 0, 'removed footnote must not leave an empty strip');
    if (tree.props['data-complete']) assert.ok(text(notices[0]).includes('两种现象可以同时存在'));
    assert.ok(!/优化|梯度|SGD/.test(tree.props.subtitle + text(tree)));
    assert.equal(elements(tree).filter(node => node.type === 'nav')[0].props['aria-label'], '逐步比较过拟合与退化');
    return tree;
  };
  const buttons = tree => elements(tree).filter(element => element.type === shared.Button);
  const chart = tree => elements(tree).find(element => element.type === shared.EChartsChart);
  const next = tree => buttons(tree).find(element => element.props.variant === 'primary').props.onClick();
  let tree = render();
  assert.equal(tree.props['data-step'], 0);
  assert.equal(chart(tree).props.option.series.length, 1);
  buttons(tree)[1].props.onClick(); tree = render(); assert.equal(tree.props['data-step'], 0);
  next(tree); tree = render();
  assert.equal(chart(tree).props.option.series.length, 2); assert.equal(calls, 0);
  next(tree); tree = render();
  assert.equal(tree.props['data-step'], 1); assert.equal(chart(tree).props.option.series.length, 1);
  next(tree); tree = render();
  assert.equal(tree.props['data-step'], 1); assert.equal(chart(tree).props.option.series.length, 2);
  assert.equal(tree.props['data-complete'], true); assert.equal(calls, 1);
  assert.ok(!buttons(tree).some(element => element.props.variant === 'primary'));
  buttons(tree)[0].props.onClick(); tree = render(); assert.equal(chart(tree).props.option.series.length, 2);
  buttons(tree)[1].props.onClick(); tree = render(); assert.equal(calls, 1);
  buttons(tree).find(element => element.props.className === 'rtg-error-compare__reset').props.onClick();
  tree = render(); assert.equal(tree.props['data-step'], 0); assert.equal(tree.props['data-test-visible'], false);
  assert.equal(tree.props['data-deep-visible'], false); assert.equal(chart(tree).props.option.series.length, 1);
  next(tree); tree = render(); next(tree); tree = render(); next(tree); tree = render();
  assert.equal(tree.props['data-complete'], true); assert.equal(calls, 1);
  for (const key of [' ', 'Enter']) {
    let stopped = false;
    tree.props.onKeyDown({ key, target: { closest: () => ({}) }, stopPropagation() { stopped = true; } });
    assert.equal(stopped, true);
  }
  const css = fs.readFileSync(path.join(__dirname, 'OverfittingDegradationPage.css'), 'utf8');
  require('postcss').parse(css);
  assert.ok(!/font-size|font-weight|line-height|overflow\s*:|#[0-9a-f]{3,8}\b/i.test(css));
  assert.ok(!/optimization|__process|__repeat/.test(css));
});
