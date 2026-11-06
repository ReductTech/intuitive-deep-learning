// Run from the repository: node modules/ResNet-Transfer-Guide/pages/DepthCapacityPage/compositionModel.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, 'compositionModel.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
{ module: moduleUnderTest, exports: moduleUnderTest.exports });
const m = moduleUnderTest.exports;

test('all 16 input/position cases agree with an independent sparse-filter reference at all 9 output positions', () => {
  for (let mask = 0; mask < 8; mask++) for (const misplaced of [false, true]) {
    const state = m.createCompositionState();
    m.CLUES.forEach((id, i) => { state.enabled[id] = Boolean(mask & (1 << i)); });
    state.misplaced = misplaced;
    const result = m.calculateComposition(state);
    const desired = { rim: [0, 1], leftArc: [1, 0], rightArc: [1, 2] };
    for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) {
      let sum = -2;
      for (const id of m.CLUES) {
        const p = m.cluePosition(id, misplaced), [dy, dx] = desired[id];
        if (state.enabled[id] && p.row === row + dy && p.column === column + dx) sum += 1;
      }
      assert.equal(result.preactivation[row][column], sum);
      assert.equal(result.output[row][column], Math.max(0, sum));
    }
    assert.equal(result.center, mask === 7 && !misplaced ? 1 : 0);
  }
});

test('changing positions preserves the three channel responses but changes their weighted contributions', () => {
  let state = m.compositionReducer(m.createCompositionState(), { type: 'toggle', id: 'rightArc' });
  assert.equal(m.calculateComposition(state).center, 1);
  const before = m.calculateComposition(state);
  state = m.compositionReducer(state, { type: 'move' });
  const after = m.calculateComposition(state);
  for (const id of m.CLUES) {
    assert.equal(before.channels[id].flat().reduce((a, b) => a + b, 0), 1);
    assert.equal(after.channels[id].flat().reduce((a, b) => a + b, 0), 1);
  }
  assert.equal(after.contributions.rim, 1);
  assert.equal(after.contributions.leftArc, 0);
  assert.equal(after.contributions.rightArc, 0);
  assert.equal(after.preactivation[1][1], -1);
  assert.equal(after.center, 0);
});

test('guided actions produce the intended controlled interventions and complete only after restoration', () => {
  let state = m.createCompositionState();
  const responses = [];
  for (let i = 0; i < 5; i++) {
    state = m.compositionReducer(state, m.nextCompositionAction(state).action);
    responses.push(m.calculateComposition(state).center);
    assert.equal(m.compositionComplete(state), i === 4);
  }
  assert.deepEqual(responses, [1, 0, 1, 0, 1]);
  const reset = m.compositionReducer(state, { type: 'reset' });
  assert.equal(m.compositionComplete(reset), false);
  assert.equal(reset.enabled.rightArc, false);
  assert.equal(reset.misplaced, false);
});

test('manual cue removal follows the same logic, transitions do not mutate earlier state, and premature movement is blocked', () => {
  const initial = m.createCompositionState(), snapshot = JSON.stringify(initial);
  assert.equal(m.compositionReducer(initial, { type: 'move' }), initial);
  let state = m.compositionReducer(initial, { type: 'toggle', id: 'rightArc' });
  assert.equal(JSON.stringify(initial), snapshot);
  state = m.compositionReducer(state, { type: 'toggle', id: 'rim' });
  assert.equal(state.evidence.removed, true);
  assert.equal(m.calculateComposition(state).center, 0);
  state = m.compositionReducer(state, m.nextCompositionAction(state).action);
  assert.equal(m.calculateComposition(state).center, 1);
  state = m.compositionReducer(state, { type: 'move' });
  state = m.compositionReducer(state, { type: 'restore' });
  assert.equal(m.compositionComplete(state), true);
});

test('the rendered ReLU term has one LaTeX command slash in every input state', () => {
  // A quoted JSX attribute does not unescape backslashes like a JS string does.
  // Inspect the actual transpiled component props, not just a source-text match.
  const source = fs.readFileSync(path.join(__dirname, 'FeatureCompositionLab.tsx'), 'utf8');
  const componentModule = { exports: {} };
  const shared = Object.fromEntries(['Button', 'MathFormulaBlock', 'MathFormulaStatic', 'MathFormulaTerm', 'Typography']
    .map(name => [name, Object.assign(() => null, { displayName: name })]));
  const requireComponent = id => id === '../../../shared/react' ? shared
    : id === './compositionModel' ? m : id.endsWith('.css') ? {} : require(id);
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { module: componentModule, exports: componentModule.exports, require: requireComponent });

  function descendants(element, result = []) {
    if (Array.isArray(element)) element.forEach(child => descendants(child, result));
    else if (element && typeof element === 'object' && element.props) {
      result.push(element);
      descendants(element.props.children, result);
    }
    return result;
  }
  for (let mask = 0; mask < 8; mask++) for (const misplaced of [false, true]) {
    const state = m.createCompositionState();
    m.CLUES.forEach((id, i) => { state.enabled[id] = Boolean(mask & (1 << i)); });
    state.misplaced = misplaced;
    const elements = descendants(componentModule.exports.FeatureCompositionLab({ state, onAction() {} }));
    const terms = elements.filter(element => element.type === shared.MathFormulaTerm);
    assert.equal(terms.length, 1);
    assert.equal(terms[0].props.latex, String.raw`\operatorname{ReLU}`);
    assert.match(terms[0].props.ariaLabel, /负数归零，正数保留/);
    assert.ok(elements.some(element => element.props.children === 'ReLU：负数归零，正数保留'));
    for (const element of elements.filter(element => typeof element.props.latex === 'string')) {
      assert.ok(!element.props.latex.includes('\\\\'), 'formula must not contain an accidental LaTeX line break');
    }
    const response = m.calculateComposition(state);
    const expectedFormula = '(' + m.CLUES.map(id => response.contributions[id]).join('+') + '-2)=' + response.center;
    assert.ok(elements.some(element => element.type === shared.MathFormulaStatic && element.props.latex === expectedFormula));
  }
});
