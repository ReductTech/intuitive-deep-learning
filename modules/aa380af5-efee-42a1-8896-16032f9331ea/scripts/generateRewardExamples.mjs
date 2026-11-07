import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL('../pages/FailureModesPage/failureSimulation.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022',
});
const source = outputFiles[0].text;
const simulation = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const { defaultWorld, trainFailureWorld, evaluateFailurePolicy, failurePolicy,
  TRAINING_EPISODES, TRAINING_SEED, ALPHA, GAMMA, EPSILON, EPISODE_LIMIT } = simulation;
const worlds = {
  movement: defaultWorld('movement'),
  danger: defaultWorld('danger'),
  aligned: { ...defaultWorld('movement'), movement: -1 },
};
const runs = Object.fromEntries(Object.entries(worlds).map(([id, world]) => {
  const trained = trainFailureWorld(world);
  return [id, { world, q: trained.q, policy: failurePolicy(trained.q, world),
    trace: evaluateFailurePolicy(trained.q, world), updates: trained.updates }];
}));
assert.equal(runs.movement.trace.outcome, 'undelivered');
assert.equal(runs.movement.trace.score, 160);
assert.equal(runs.danger.trace.outcome, 'danger');
assert.equal(runs.danger.trace.score, 4.5);
assert.equal(runs.aligned.trace.outcome, 'safe');
assert.equal(runs.aligned.trace.score, 1);
const snapshot = {
  source: 'FailureModesPage/failureSimulation.ts',
  sourceHash: createHash('sha256').update(source).digest('hex'),
  training: { episodes: TRAINING_EPISODES, seed: TRAINING_SEED, alpha: ALPHA, gamma: GAMMA, epsilon: EPSILON, episodeLimit: EPISODE_LIMIT },
  runs,
};
const destination = new URL('../pages/FailureModesPage/rewardExamples.json', import.meta.url);
if (process.argv.includes('--check')) assert.deepEqual(JSON.parse(await readFile(destination, 'utf8')), snapshot);
else await writeFile(destination, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ verified: process.argv.includes('--check'), training: snapshot.training,
  runs: Object.fromEntries(Object.entries(runs).map(([id, run]) => [id, { updates: run.updates, outcome: run.trace.outcome,
    steps: run.trace.actions.length, score: run.trace.score, dangerEntries: run.trace.dangerEntries }])) }));
