import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL('../pages/TransitionLoopPage/transitionLesson.ts', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'esm' });
const { TRANSITION_CASES, createTransitionLesson: create, chooseTransitionAction: choose, chooseTransitionPolicy: policy, transitionActionProbabilities: probabilities, advanceTransitionLesson: advance } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const key = p => p.row + ':' + p.col;
const walls = ['2:2', '3:2', '3:4', '4:4', '5:3'], deltas = [[-1, 0], [0, 1], [1, 0], [0, -1]];
function expected(from, action) {
  const [dr, dc] = deltas[action], candidate = { row: from.row + dr, col: from.col + dc };
  const hit = candidate.row < 0 || candidate.row > 6 || candidate.col < 0 || candidate.col > 6 || walls.includes(key(candidate));
  const next = hit ? from : candidate, trapped = key(next) === '6:3', delivered = key(next) === '5:5';
  return { next, reward: trapped ? -10 : delivered ? 10 : hit ? -3 : -1, done: trapped || delivered, hit, trapped };
}
let verified = 0;
for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
  const from = { row, col }; if ([...walls, '5:5', '6:3'].includes(key(from))) continue;
  for (let action = 0; action < 4; action++) {
    const start = { ...create(), from, position: from }, original = JSON.stringify(start);
    const selected = choose(start, action), ready = advance(selected);
    assert.equal(JSON.stringify(start), original, 'selection must not mutate state');
    assert.equal(ready.result, null); assert.equal(ready.interactions, 0); assert.deepEqual(ready.position, from);
    assert.equal(choose(ready, (action + 1) % 4), ready, 'an executing action cannot change');
    const feedback = advance(ready), truth = expected(from, action);
    for (const field of Object.keys(truth)) assert.deepEqual(feedback.result[field], truth[field], field);
    assert.deepEqual(feedback.position, truth.next); assert.equal(feedback.interactions, 1);
    const linked = advance(feedback); assert.deepEqual(linked.result, feedback.result); assert.equal(linked.interactions, 1);
    const continued = advance(linked); assert.equal(continued.phase, 0); assert.equal(continued.result, null);
    assert.equal(continued.interactions, 1, 'linking or restarting must not collect an experience');
    assert.deepEqual(continued.from, truth.done ? { row: 5, col: 1 } : truth.next);
    assert.equal(continued.episode, truth.done ? 2 : 1); assert.equal(continued.steps, truth.done ? 0 : 1);
    verified++;
  }
}
const cases = [];
for (const scenario of TRANSITION_CASES) {
  const start = create(scenario.id), end = advance(advance(start));
  cases.push({ id: scenario.id, from: key(start.from), to: key(end.position), reward: end.result.reward, done: end.result.done });
}
assert.deepEqual(cases, [
  { id: 'move', from: '5:1', to: '5:2', reward: -1, done: false },
  { id: 'collision', from: '5:2', to: '5:2', reward: -3, done: false },
  { id: 'delivery', from: '4:5', to: '5:5', reward: 10, done: true },
  { id: 'trap', from: '6:2', to: '6:3', reward: -10, done: true },
]);
assert.deepEqual(probabilities(choose(create(), 3)), [0, 0, 0, 1]);
let random = policy(create(), 'random');
assert.deepEqual(probabilities(random), [.25, .25, .25, .25]);
assert.equal(choose(random, 2), random, 'direction controls cannot override a random policy');
const counts = [0, 0, 0, 0], sequence = [];
for (let i = 0; i < 1000; i++) {
  const selected = advance(random); counts[selected.action]++; sequence.push(selected.action);
  assert.equal(selected.interactions, random.interactions, 'sampling an action does not execute it');
  assert.equal(selected.result, null);
  assert.equal(policy(selected, 'direction'), selected, 'policy stays fixed within one experience');
  const feedback = advance(selected), truth = expected(random.from, selected.action);
  assert.equal(feedback.interactions, random.interactions + 1);
  for (const field of Object.keys(truth)) assert.deepEqual(feedback.result[field], truth[field]);
  random = advance(advance(feedback));
  assert.equal(random.policy, 'random');
}
assert(counts.every(count => count >= 200 && count <= 300));
let replay = create('move', 'random');
for (const action of sequence) { assert.equal(advance(replay).action, action); replay = advance(advance(advance(advance(replay)))); }
console.log(JSON.stringify({ passed: true, verified, cases, oneInteractionPerAction: true, terminalRestart: true, immutable: true, policyCounts: counts, reproduciblePolicySampling: true }));
