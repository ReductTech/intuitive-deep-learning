import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'bellman-check-'));
try {
  for (const [name, source] of [
    ['model', 'model.ts'],
    ['qLearningSimulation', 'pages/QLearningLoopPage/qLearningSimulation.ts'],
    ['bellmanSimulation', 'pages/BellmanPage/bellmanSimulation.ts'],
  ]) {
    const output = ts.transpileModule(fs.readFileSync(path.join(root, source), 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText.replaceAll("from '../../model'", "from './model.mjs'")
      .replaceAll("from '../QLearningLoopPage/qLearningSimulation'", "from './qLearningSimulation.mjs'");
    fs.writeFileSync(path.join(temporary, name + '.mjs'), output);
  }
  const load = name => import(pathToFileURL(path.join(temporary, name + '.mjs')).href);
  const { START, GOAL, keyOf, returnOf } = await load('model');
  const { warehouseStep } = await load('qLearningSimulation');
  const {
    GAMMA, TRAP, BELLMAN_ROUTE, WAREHOUSE_STATES, isTerminal, actionBackups, createLocalBellman,
    localBackup, applyLocalBackup, moveLocalBackward, createPropagation, propagateRound, deliveryDistances,
  } = await load('bellmanSimulation');
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, actual + ' != ' + expected);

  // A complete backward pass agrees with the discounted return of the real safe route.
  let local = createLocalBellman();
  assert.equal(moveLocalBackward(local), local);
  const localTargets = [];
  for (let index = BELLMAN_ROUTE.length - 2; index >= 0; index--) {
    const before = JSON.stringify(local);
    const backup = localBackup(local);
    assert.equal(backup.trapped, false);
    assert.equal(backup.hit, false);
    near(backup.target, returnOf([...Array(BELLMAN_ROUTE.length - index - 2).fill(-1), 10], GAMMA));
    const updated = applyLocalBackup(local);
    assert.equal(JSON.stringify(local), before);
    assert.equal(updated.updates, local.updates + 1);
    const changed = Object.keys(updated.values).filter(key => updated.values[key] !== local.values[key]);
    assert.deepEqual(changed, [keyOf(backup.current)]);
    assert.equal(applyLocalBackup(updated), updated);
    localTargets.push(backup.target);
    local = moveLocalBackward(updated);
  }
  near(localTargets[0], 10); near(localTargets[1], 8); near(localTargets[2], 6.2);
  near(local.values[keyOf(START)], -2.25159022);

  // Even deliberately corrupted terminal estimates cannot be counted a second time.
  const poisoned = { [keyOf(GOAL)]: 999, [keyOf(TRAP)]: 999 };
  for (const [position, action, reward] of [[{ row: 4, col: 5 }, 2, 10], [{ row: 6, col: 2 }, 1, -10]]) {
    const backup = actionBackups(position, poisoned)[action];
    assert.equal(backup.done, true); assert.equal(backup.nextValue, 0); assert.equal(backup.target, reward);
  }

  // Independently find graph distances by reverse breadth-first search.
  const predecessors = {};
  for (const position of WAREHOUSE_STATES.filter(position => !isTerminal(position))) {
    for (let action = 0; action < 4; action++) {
      const result = warehouseStep(position, action);
      if (!result.trapped && !result.hit) (predecessors[keyOf(result.next)] ??= []).push(keyOf(position));
    }
  }
  const distances = { [keyOf(GOAL)]: 0 };
  const queue = [keyOf(GOAL)];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const previous of predecessors[queue[cursor]] ?? []) {
      if (distances[previous] !== undefined) continue;
      distances[previous] = distances[queue[cursor]] + 1;
      queue.push(previous);
    }
  }
  assert.deepEqual(deliveryDistances(), distances);
  assert.equal(distances[keyOf(START)], 10);
  const maxDistance = Math.max(...Object.values(distances));

  // Compare against a world with no delivery reward. The first influence must
  // arrive at exactly the graph distance, never earlier through an in-place sweep.
  let state = createPropagation();
  let withoutDelivery = { ...state.values };
  const firstInfluence = {};
  for (let round = 1; round <= maxDistance + 2; round++) {
    const previousState = state;
    const original = JSON.stringify(state);
    const originalValues = state.values;
    state = propagateRound(state);
    assert.equal(JSON.stringify(previousState), original);
    assert.equal(state.previous, originalValues);
    const counterfactual = {};
    for (const position of WAREHOUSE_STATES) {
      const key = keyOf(position);
      counterfactual[key] = isTerminal(position) ? 0 : Math.max(...Array.from({ length: 4 }, (_, action) => {
        const result = warehouseStep(position, action);
        const reward = keyOf(result.next) === keyOf(GOAL) ? 0 : result.reward;
        return reward + (result.done ? 0 : GAMMA * withoutDelivery[keyOf(result.next)]);
      }));
      if (Math.abs(state.values[key] - counterfactual[key]) > 1e-9 && firstInfluence[key] === undefined) firstInfluence[key] = round;
    }
    withoutDelivery = counterfactual;
    assert.equal(state.values[keyOf(GOAL)], 0); assert.equal(state.values[keyOf(TRAP)], 0);
    for (const key of state.changed) assert.ok(Math.abs(state.values[key] - state.previous[key]) > 1e-9);
    assert.ok(Object.values(state.values).every(Number.isFinite));
  }
  for (const position of WAREHOUSE_STATES.filter(position => !isTerminal(position))) {
    const key = keyOf(position), distance = distances[key];
    assert.equal(firstInfluence[key], distance);
    near(state.values[key], returnOf([...Array(distance - 1).fill(-1), 10], GAMMA));
  }
  assert.equal(state.delta, 0);
  near(state.values[keyOf(START)], local.values[keyOf(START)]);
  console.log(JSON.stringify({ passed: true, localTargets, states: WAREHOUSE_STATES.length,
    firstDeliveryInfluenceAtStart: firstInfluence[keyOf(START)], maxDistance, finalStartValue: state.values[keyOf(START)] }));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
