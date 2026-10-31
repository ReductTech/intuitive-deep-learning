// Run from the repository: node modules/ResNet-Transfer-Guide/pages/DegradationProblemPage/DegradationProblemPage.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function elements(node, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, result));
  else if (node && typeof node === 'object' && node.props) {
    result.push(node);
    elements(node.props.children, result);
  }
  return result;
}

function harness(mode) {
  let current;
  const frame = () => ({ state: [], cursor: 0, effects: [] });
  const react = {
    useState(initial) {
      const owner = current, i = owner.cursor++;
      if (!(i in owner.state)) owner.state[i] = typeof initial === 'function' ? initial() : initial;
      return [owner.state[i], value => { owner.state[i] = typeof value === 'function' ? value(owner.state[i]) : value; }];
    },
    useRef(initial) { const i = current.cursor++; return current.state[i] ??= { current: initial }; },
    useId() { const i = current.cursor++; return current.state[i] ??= 'test-question-' + i; },
    useMemo(fn) { return fn(); },
    useEffect(fn, deps) {
      const owner = current, i = owner.cursor++;
      if (!owner.state[i] || deps.some((value, j) => value !== owner.state[i][j])) {
        owner.state[i] = deps;
        owner.effects.push(fn);
      }
    },
  };
  function load(file, dependencies = {}) {
    const mod = { exports: {} };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText, { module: mod, exports: mod.exports, require: id => id === 'react' ? react
      : id in dependencies ? dependencies[id] : id.endsWith('.css') ? {}
      : id.endsWith('.png') ? '/original-training-curve.png' : require(id) });
    return mod.exports;
  }
  function render(owner, fn) {
    current = owner; owner.cursor = 0; owner.effects = [];
    const tree = fn(); current = null;
    owner.effects.forEach(effect => effect());
    return tree;
  }
  const shared = Object.fromEntries(['Button', 'ContentBlock', 'NoticeStrip', 'Typography'].map(name => [name, () => null]));
  // Use the real Shared Question implementation; only external telemetry and non-question presentation are stubbed.
  const { Question } = load(path.resolve(__dirname, '../../../shared/react/learning/Question.tsx'), {
    '../controls/Button': { Button: shared.Button }, '../feedback/Feedback': { Feedback: () => null },
    '../typography/Typography': { Typography: shared.Typography },
    '../utils': { classNames: (...parts) => parts.filter(Boolean).join(' ') },
    '../telemetry': { emitTelemetry() {}, getTelemetryState: async () => null },
    './QuestionMode': { useQuestionMode: () => mode }, './reviewShortAnswer': { reviewShortAnswer() { throw Error('Prediction must not request LLM review'); } },
  });
  shared.Question = Question;
  const hook = load(path.resolve(__dirname, '../../hooks/useCompleteOnce.ts'));
  const { DegradationProblemPage } = load(path.join(__dirname, 'DegradationProblemPage.tsx'), {
    '../../../shared/react': shared, '../../hooks/useCompleteOnce': hook,
  });
  const parent = frame();
  let child, childKey, calls = 0;
  const onComplete = () => calls++;
  return {
    shared, Question, get calls() { return calls; },
    render() {
      const tree = render(parent, () => DegradationProblemPage({ onComplete }));
      const question = elements(tree).find(element => element.type === Question);
      let questionTree;
      if (question) {
        if (!child || childKey !== question.key) { child = frame(); childKey = question.key; }
        questionTree = render(child, () => Question(question.props));
      } else { child = null; }
      return { tree, question, questionTree };
    },
  };
}

test('real Shared Question keeps default A/B/C options and any prediction reveals the experiment in Guide and PPT', async () => {
  for (const mode of ['guide', 'ppt']) for (const value of ['plain20', 'plain56', 'same']) {
    const h = harness(mode);
    let view = h.render();
    assert.equal(view.tree.props['data-phase'], 'prediction');
    assert.equal(view.question.props.className, undefined);
    assert.equal(view.questionTree.props.className, 'dl-question dl-question--choice');
    assert.equal(view.questionTree.props['data-submit-mode'], 'instant');
    const options = elements(view.questionTree).filter(element => element.props['data-value']);
    assert.equal(options.length, 3);
    assert.deepEqual(elements(view.questionTree).filter(element => element.props.className === 'dl-option-key')
      .map(element => element.props.children), ['A', 'B', 'C']);
    assert.equal(elements(view.tree).filter(element => element.type === 'img').length, 0);
    const oldKey = view.question.props.persistenceKey;
    options.find(option => option.props['data-value'] === value).props.onClick();
    await Promise.resolve();
    view = h.render();
    assert.equal(view.tree.props['data-prediction'], value);
    assert.equal(view.tree.props['data-phase'], 'explanation');
    assert.equal(view.question, undefined);
    assert.equal(elements(view.tree).filter(element => element.type === 'img').length, 1);
    assert.ok(elements(view.tree).some(element => element.props.id === 'rtg-degradation-conclusion'));
    assert.equal(h.calls, 1);
    const reset = elements(view.tree).find(element => element.type === h.shared.Button);
    reset.props.onClick();
    view = h.render();
    assert.equal(view.tree.props['data-phase'], 'prediction');
    assert.notEqual(view.question.props.persistenceKey, oldKey);
    assert.ok(elements(view.questionTree).filter(element => element.props['data-value']).every(element => !element.props['aria-pressed']));
    elements(view.questionTree).find(element => element.props['data-value'] === 'plain20').props.onClick();
    await Promise.resolve(); h.render();
    assert.equal(h.calls, 1);
  }
});

test('page CSS does not replace Shared question styles and old custom choices/evidence quiz are absent', () => {
  const css = fs.readFileSync(path.join(__dirname, 'DegradationProblemPage.css'), 'utf8');
  const source = fs.readFileSync(path.join(__dirname, 'DegradationProblemPage.tsx'), 'utf8');
  assert.ok(!/dl-question|dl-option|font-size|font-weight|line-height|__choices|__choice-label/.test(css));
  assert.ok(!/RtgQuestion|data-prediction-option|证据判断|判断关键证据|<button/.test(source));
  const h = harness('ppt'), view = h.render();
  for (const key of [' ', 'Enter']) {
    let stopped = false;
    view.tree.props.onKeyDown({ key, target: { closest: () => ({}) }, stopPropagation() { stopped = true; } });
    assert.equal(stopped, true);
  }
});
