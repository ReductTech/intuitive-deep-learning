import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Run the exact simulation behind slide 13. Do not adjust or round its Q values.
const simulationPath = fileURLToPath(new URL('../pages/QLearningLoopPage/qLearningSimulation.ts', import.meta.url));
const { outputFiles } = await build({
  entryPoints: [simulationPath], bundle: true, write: false,
  platform: 'node', format: 'esm', target: 'es2022',
});
const {
  createSimulation, advanceSimulation, traceGreedyPolicy,
  ALPHA, GAMMA, EPSILON, EPISODE_LIMIT, TRAP,
} = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);

let simulation = createSimulation();
const initialSeed = simulation.randomSeed;
for (let step = 0; step < 20000; step++) simulation = advanceSimulation(simulation);
const greedy = traceGreedyPolicy(simulation.q);
assert.equal(simulation.updates, 20000);
assert.equal(Object.values(simulation.visits).reduce((sum, count) => sum + count, 0), simulation.updates);
assert.equal(greedy.outcome, 'delivered');
assert.ok(!greedy.route.some(position => position.row === TRAP.row && position.col === TRAP.col));

const snapshot = {
  source: 'QLearningLoopPage/qLearningSimulation.ts',
  training: {
    initialSeed, updates: simulation.updates, episodes: simulation.episodes,
    deliveries: simulation.deliveries, traps: simulation.traps,
    alpha: ALPHA, gamma: GAMMA, epsilon: EPSILON, episodeLimit: EPISODE_LIMIT,
  },
  q: simulation.q, visits: simulation.visits, greedy,
};
const snapshotPath = new URL('../pages/QTablePage/qTableSnapshot.json', import.meta.url);
if (process.argv.includes('--check')) {
  assert.deepEqual(JSON.parse(await readFile(snapshotPath, 'utf8')), snapshot);
} else {
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
}
const values = Object.values(snapshot.q).flat();
console.log(JSON.stringify({ verified: process.argv.includes('--check'), ...snapshot.training, visitedStates: Object.keys(snapshot.visits).length, range: [Math.min(...values), Math.max(...values)], greedySteps: greedy.route.length - 1, startQ: snapshot.q['5:1'] }));
