import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Fit the real 49 → 24 → 4 network to the existing Q-learning snapshot.
// This is offline supervised regression for the architecture illustration,
// not a claim that these weights were learned by the subsequent DQN lesson.
const snapshotUrl = new URL('../pages/QTablePage/qTableSnapshot.json', import.meta.url);
const sourceText = await readFile(snapshotUrl, 'utf8'), snapshot = JSON.parse(sourceText);
const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL('../dqnSimulation.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022' });
const { createDqnNetwork, dqnForward, DQN_HIDDEN, evaluateDqn } = await import(
  'data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const inputCount = 49, hiddenBias = inputCount * DQN_HIDDEN;
const outputWeights = hiddenBias + DQN_HIDDEN, outputBias = outputWeights + 4 * DQN_HIDDEN;
const walls = new Set(['2:2', '3:2', '3:4', '4:4', '5:3']), terminals = new Set(['5:5', '6:3']);
const examples = Object.entries(snapshot.q).filter(([key]) => !walls.has(key) && !terminals.has(key))
  .map(([key, targets]) => { const [row, col] = key.split(':').map(Number); return { position: { row, col }, targets }; });
assert.equal(examples.length, 42);
const network = createDqnNetwork(), mean = new Float64Array(network.length), variance = mean.slice();
assert.equal(network.length, outputBias + 4);
const gradientOf = weights => {
  const gradient = new Float64Array(weights.length); let squaredError = 0;
  for (const { position, targets } of examples) {
    const { state, hidden, values } = dqnForward(weights, position);
    const deltas = values.map((value, action) => (value - targets[action]) / (examples.length * 4));
    for (let action = 0; action < 4; action++) {
      squaredError += (values[action] - targets[action]) ** 2;
      gradient[outputBias + action] += deltas[action];
      for (let j = 0; j < DQN_HIDDEN; j++) gradient[outputWeights + action * DQN_HIDDEN + j] += deltas[action] * hidden[j];
    }
    for (let j = 0; j < DQN_HIDDEN; j++) if (hidden[j] > 0) {
      const delta = deltas.reduce((sum, value, action) => sum + value * weights[outputWeights + action * DQN_HIDDEN + j], 0);
      gradient[j * inputCount + state] += delta; gradient[hiddenBias + j] += delta;
    }
  }
  return { gradient, halfMse: squaredError / (examples.length * 8) };
};
// Numerical differentiation verifies the regression gradients before fitting.
const initial = gradientOf(network);
for (const index of [36, hiddenBias, outputWeights, outputBias, outputBias + 3]) {
  const plus = network.slice(), minus = network.slice(); plus[index] += 1e-5; minus[index] -= 1e-5;
  const derivative = (gradientOf(plus).halfMse - gradientOf(minus).halfMse) / 2e-5;
  assert.ok(Math.abs(initial.gradient[index] - derivative) < 1e-7);
}
const errorsOf = () => examples.flatMap(({ position, targets }) => dqnForward(network, position).values.map((value, action) => value - targets[action]));
let steps = 0, maxError = Infinity;
const maxSteps = 12000;
for (let step = 1; step <= maxSteps; step++) {
  const { gradient } = gradientOf(network);
  // The late, smaller step size avoids oscillation near the Q-table targets.
  const rate = step <= 2500 ? .01 : step <= 6000 ? .002 : .0003;
  const meanCorrection = 1 - .9 ** step, varianceCorrection = 1 - .999 ** step;
  for (let i = 0; i < network.length; i++) {
    mean[i] = .9 * mean[i] + .1 * gradient[i]; variance[i] = .999 * variance[i] + .001 * gradient[i] ** 2;
    network[i] -= rate * (mean[i] / meanCorrection) / (Math.sqrt(variance[i] / varianceCorrection) + 1e-8);
  }
  steps = step;
  if (step % 100 === 0) {
    maxError = Math.max(...errorsOf().map(Math.abs));
    if (maxError < .00001) break;
  }
}
const errors = errorsOf(), greedy = evaluateDqn(network);
assert.ok(maxError < .0001, `Regression has not converged: ${maxError}`);
assert.ok(network.every(Number.isFinite));
assert.equal(greedy.outcome, 'delivered'); assert.equal(greedy.actions.length, 10);
assert.ok(!greedy.route.some(p => p.row === 6 && p.col === 3));
const fitted = {
  source: 'QTablePage/qTableSnapshot.json', sourceSha256: createHash('sha256').update(sourceText).digest('hex'),
  qLearningUpdates: snapshot.training.updates,
  fit: { method: 'Supervised full-batch Adam regression to the Q-learning estimates; not DQN training',
    positions: examples.length, targets: examples.length * 4, initializationSeed: 71, steps,
    maxAbsoluteError: Math.max(...errors.map(Math.abs)), rmse: Math.sqrt(errors.reduce((sum, value) => sum + value * value, 0) / errors.length) },
  weights: Array.from(network), greedy,
};
const destination = new URL('../pages/DqnArchitecturePage/qTableFittedNetwork.json', import.meta.url);
if (process.argv.includes('--check')) assert.deepEqual(JSON.parse(await readFile(destination, 'utf8')), fitted);
else await writeFile(destination, JSON.stringify(fitted, null, 2) + '\n');
console.log(JSON.stringify({ verified: process.argv.includes('--check'), qLearningUpdates: fitted.qLearningUpdates, ...fitted.fit,
  greedySteps: greedy.actions.length, startValues: dqnForward(network, { row: 5, col: 1 }).values }));
