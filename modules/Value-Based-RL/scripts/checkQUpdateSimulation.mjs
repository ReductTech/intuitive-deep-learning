import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

async function load(relative) {
  const { outputFiles } = await build({
    entryPoints: [fileURLToPath(new URL(relative, import.meta.url))],
    bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022',
  });
  return import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
}
const { createQUpdateLab, observeStep, PRETRAINING_STEPS, ALPHA, GAMMA, TRAP } = await load('../pages/QUpdatePage/qUpdateSimulation.ts');
const { createSimulation, advanceSimulation } = await load('../pages/QLearningLoopPage/qLearningSimulation.ts');
const { GOAL, BLOCKED, GRID, keyOf } = await load('../model.ts');
let simulation = createSimulation();
for (let step = 0; step < PRETRAINING_STEPS; step++) simulation = advanceSimulation(simulation);
const lab = createQUpdateLab();
assert.deepEqual(lab.q, simulation.q);
assert.equal(lab.updates, 0);
const sample = observeStep(lab.q, lab.position, 2);
assert.equal(sample.before[2], -.75);
assert.equal(sample.nextMax, 5);
assert.equal(sample.target, 3.5);
assert.equal(sample.after[2], 1.375);
assert.equal(sample.error, 4.25);

// Compare with the exact slide 13 transition on the same Q table and position.
for (const position of [{ row: 3, col: 5 }, { row: 4, col: 5 }, { row: 6, col: 2 }, { row: 0, col: 0 }]) {
  const original = { ...simulation, position, restart: false };
  const advanced = advanceSimulation(original);
  const observed = observeStep(original.q, position, advanced.last.action);
  assert.deepEqual(observed.tableAfter, advanced.q);
  assert.equal(observed.target, advanced.last.target);
  assert.deepEqual(observed.next, advanced.last.next);
}

let transitions = 0;
const terminals = [keyOf(GOAL), keyOf(TRAP)];
for (let row = 0; row < GRID; row++) for (let col = 0; col < GRID; col++) {
  const position = { row, col }, key = keyOf(position);
  if (BLOCKED.includes(key) || terminals.includes(key)) continue;
  for (let action = 0; action < 4; action++) {
    const before = JSON.stringify(lab.q);
    const update = observeStep(lab.q, position, action);
    assert.equal(JSON.stringify(lab.q), before, 'Observing must not commit an update.');
    const changed = [];
    for (const state of Object.keys(lab.q)) for (let column = 0; column < 4; column++) {
      if (lab.q[state][column] !== update.tableAfter[state][column]) changed.push([state, column]);
    }
    assert.deepEqual(changed, [[key, action]], 'Exactly one Q table entry changes.');
    assert.equal(update.target, update.reward + (update.done ? 0 : GAMMA * Math.max(...lab.q[keyOf(update.next)])));
    assert.equal(update.after[action], update.before[action] + ALPHA * update.error);
    if (keyOf(update.next) !== key) assert.equal(update.tableAfter[keyOf(update.next)], lab.q[keyOf(update.next)]);
    if (update.hit) {
      assert.deepEqual(update.next, position);
      assert.equal(update.reward, -3);
      assert.equal(update.done, false);
    }
    transitions++;
  }
}
// A terminal estimate, even if accidentally large, contributes no future value.
const poisoned = { ...lab.q, [keyOf(GOAL)]: [999, 999, 999, 999], [keyOf(TRAP)]: [999, 999, 999, 999] };
for (const [position, action, reward] of [[{ row: 4, col: 5 }, 2, 10], [{ row: 6, col: 2 }, 1, -10]]) {
  const update = observeStep(poisoned, position, action);
  assert.equal(update.target, reward);
  assert.equal(update.nextMax, 0);
  assert.equal(update.done, true);
}
assert.throws(() => observeStep(lab.q, GOAL, 0));
assert.throws(() => observeStep(lab.q, TRAP, 0));
assert.deepEqual(createQUpdateLab(), lab);
console.log(JSON.stringify({ passed: true, trainingSteps: PRETRAINING_STEPS, transitions,
  default: { from: sample.from, next: sample.next, before: sample.before[2], target: sample.target, after: sample.after[2] },
  matchesSlide13: true, terminalsExcludeFuture: true }));
