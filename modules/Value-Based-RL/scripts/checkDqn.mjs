import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL('../dqnSimulation.ts', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'esm' });
const m = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const key = p => p.row + ':' + p.col, walls = ['2:2', '3:2', '3:4', '4:4', '5:3'];
const deltas = [[-1, 0], [0, 1], [1, 0], [0, -1]];
function verify(entry) {
  const [dr, dc] = deltas[entry.action], candidate = { row: entry.s.row + dr, col: entry.s.col + dc };
  const hit = candidate.row < 0 || candidate.row >= 7 || candidate.col < 0 || candidate.col >= 7 || walls.includes(key(candidate));
  const next = hit ? entry.s : candidate, goal = key(next) === '5:5', trap = key(next) === '6:3';
  assert.deepEqual(entry.next, next); assert.equal(entry.reward, trap ? -10 : goal ? 10 : hit ? -3 : -1);
  assert.equal(entry.done, goal || trap); assert.equal(entry.hit, hit); assert.equal(entry.trapped, trap);
}
let fixed = m.createTargetExperiment(); fixed.batch.forEach(verify);
assert.deepEqual(fixed.batch.map(e => e.id), [9, 10, 12, 13]);
const frozen = fixed.target.slice(), originalBatch = JSON.stringify(fixed.batch), originalOnline = fixed.online.slice();
let trained = m.updateTargetExperiment(fixed, 10);
assert.deepEqual(fixed.online, originalOnline); assert.deepEqual(trained.target, frozen); assert.notDeepEqual(trained.online, originalOnline);
assert.equal(JSON.stringify(trained.batch), originalBatch); assert.equal(trained.updates, 10); assert.equal(trained.syncs, 0);
for (const observation of trained.history) assert.deepEqual(observation.frozen, fixed.history[0].frozen);
assert.notDeepEqual(trained.history.at(-1).moving, fixed.history[0].moving);
const synced = m.syncTargetExperiment(trained);
assert.deepEqual(synced.online, trained.online); assert.deepEqual(synced.target, trained.online); assert.notEqual(synced.target, synced.online);
assert.equal(synced.updates, 10); assert.equal(synced.lastSync, 10); assert.equal(synced.syncs, 1);
for (const entry of synced.batch.filter(e => e.done)) near(m.dqnTarget(synced.target, entry), entry.reward);
assert.deepEqual(synced.history.at(-1).frozen, synced.history.at(-1).moving);

// Independent numerical differentiation of the held-target loss checks hidden, output and bias gradients.
const batch = fixed.batch, targets = batch.map(entry => m.dqnTarget(fixed.target, entry));
const loss = network => batch.reduce((sum, entry, i) => { const e = m.dqnForward(network, entry.s).values[entry.action] - targets[i]; return sum + (Math.abs(e) <= 1 ? .5 * e * e : Math.abs(e) - .5); }, 0) / batch.length;
const result = m.trainDqnBatch(fixed.online, fixed.target, m.createDqnOptimizer(), batch);
for (const index of [0, batch[0].s.row * 7 + batch[0].s.col, 49 * 24, 49 * 24 + 24, fixed.online.length - 1, fixed.online.length - 2]) {
  const plus = fixed.online.slice(), minus = fixed.online.slice(); plus[index] += 1e-6; minus[index] -= 1e-6;
  near(result.optimizer.mean[index] / .1, (loss(plus) - loss(minus)) / 2e-6, 2e-6);
}
near(result.update.lossBefore, loss(fixed.online)); near(result.update.lossAfter, loss(result.network));
assert.ok(result.update.lossAfter < result.update.lossBefore);

let state = m.createDqnSimulation(); assert.equal(state.collected, 0); assert.equal(state.slots.filter(Boolean).length, 0);
assert.equal(m.sampleDqnBatch(state), state); assert.equal(m.updateDqnSimulation(state), state);
const records = [];
for (const action of [0, 1, 1, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 3, 3, 3]) {
  const previous = state; state = m.collectDqnExperience(state, action); verify(state.latest); records.push(state.latest);
  assert.equal(previous.collected + 1, state.collected); assert.equal(previous.slots.filter(Boolean).length + 1, state.slots.filter(Boolean).length);
}
assert.equal(records[9].reward, 10); assert.equal(records[12].reward, -10); assert.equal(records[13].episode, 3);
state = m.sampleDqnBatch(state); assert.equal(state.batch.length, 16); assert.equal(new Set(state.batch.map(e => e.id)).size, 16);
for (const entry of state.batch) { assert.deepEqual(entry, state.slots[entry.slot]); assert.notEqual(entry, state.slots[entry.slot]); }
assert.deepEqual(m.collectDqnExperience(state).latest, m.collectDqnExperience({ ...state, sampleSeed: 700, batch: [] }).latest);
const collected = state.collected, position = { ...state.position }, beforeTarget = state.target.slice();
for (let i = 1; i <= 100; i++) {
  state = m.updateDqnSimulation(state); assert.equal(state.collected, collected); assert.deepEqual(state.position, position);
  if (i < 100) assert.deepEqual(state.target, beforeTarget);
}
assert.deepEqual(state.target, state.online); assert.equal(state.syncs, 1); assert.equal(state.lastSync, 100);
const terminalIndices = state.batch.flatMap((e, i) => e.done ? [i] : []);
for (const i of terminalIndices) near(state.lastUpdate.targets[i], state.batch[i].reward);

let limit = m.createDqnSimulation(); for (let i = 0; i < 80; i++) limit = m.collectDqnExperience(limit, 3);
assert.equal(limit.latest.truncated, true); assert.equal(limit.latest.done, false);
near(m.dqnTarget(limit.target, limit.latest), limit.latest.reward + .9 * Math.max(...m.dqnForward(limit.target, limit.latest.next).values));
limit = m.collectDqnExperience(limit, 0); assert.deepEqual(limit.latest.s, { row: 5, col: 1 }); assert.equal(limit.latest.step, 1);
let ring = m.createDqnSimulation(); for (let i = 0; i < 1100; i++) ring = m.collectDqnExperience(ring, 3);
assert.equal(ring.slots.filter(Boolean).length, 1024); assert.equal(Math.min(...ring.slots.map(e => e.id)), 77); assert.equal(ring.nextSlot, 76);

let live = m.createDqnSimulation(); const initial = m.evaluateDqn(live.online); assert.notEqual(initial.outcome, 'delivered');
live = m.advanceDqnTraining(live, 2000); const copied = live.online.slice(), seed = live.collectorSeed, sampleSeed = live.sampleSeed;
const evaluated = m.evaluateDqn(live.online); assert.equal(evaluated.outcome, 'delivered'); assert.equal(evaluated.actions.length, 10);
assert.equal(evaluated.total, 1); assert.deepEqual(live.online, copied); assert.equal(live.collected, 2000); assert.equal(live.collectorSeed, seed); assert.equal(live.sampleSeed, sampleSeed);
assert.equal(live.updates, 3970); assert.equal(live.syncs, 39); assert.ok(live.online.every(Number.isFinite));
for (let i = 0; i < evaluated.actions.length; i++) verify({ s: evaluated.route[i], action: evaluated.actions[i], next: evaluated.route[i + 1],
  reward: evaluated.rewards[i], done: i === evaluated.actions.length - 1, trapped: false, hit: false });
console.log(JSON.stringify({ passed: true, fixedBatchAndFrozenTarget: true, manualHardSync: true, finiteDifferenceGradients: true,
  actualTransitions: true, uniformDistinctBatch: true, terminalAndTruncation: true, automaticSync: true,
  noValidationSideEffects: true, realTraining: { collected: live.collected, updates: live.updates, deliveries: live.deliveries, greedySteps: evaluated.actions.length } }));
