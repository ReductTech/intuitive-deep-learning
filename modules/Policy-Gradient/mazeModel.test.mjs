import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('./mazeModel.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const m = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('the classroom episode is produced by displayed probability draws', () => {
  const path = m.sampleWithDraws(m.initialPolicy(), m.REFERENCE_DRAWS);
  assert.deepEqual(path, m.REFERENCE);
  assert.deepEqual(path.map(step => step.action), ['R', 'U', 'R', 'U', 'U', 'U', 'R']);
  assert.deepEqual(path.map(step => step.reward), [-1, -1, -1, -1, -1, -1, 10]);
  near(path[1].probability, .1);
  near(path[2].probability, .7);
  assert.equal(path[1].wall, true);
  assert.equal(path[1].state, path[1].next);
  assert.equal(path.at(-1).terminal, true);
});

test('ordinary, wall and terminal transitions follow the same rules as the game', () => {
  assert.deepEqual(m.transition(m.A, 'U'), { next: m.A, reward: -1, wall: true, terminal: false });
  assert.equal(m.transition(m.START, 'R').next, m.A);
  assert.deepEqual(m.transition(2, 'R'), { next: m.GOAL, reward: 10, wall: false, terminal: true });
});

test('reward-to-go differs from immediate reward', () => {
  assert.deepEqual(m.returns(m.REFERENCE), [4, 5, 6, 7, 8, 9, 10]);
  assert.equal(m.REFERENCE[1].reward, -1);
});

test('two visits to A accumulate before one REINFORCE update', () => {
  const original = m.initialPolicy(), update = m.mcUpdates(m.REFERENCE, original).find(item => item.state === m.A);
  assert.deepEqual(update.visits, [1, 2]);
  assert.deepEqual(update.weights, [5, 6]);
  const wall = m.score(original, m.A, 'U'), exit = m.score(original, m.A, 'R');
  for (let i = 0; i < 4; i++) near(update.delta[i], .05 * (5 * wall[i] + 6 * exit[i]));
  near(update.oldProbs[0], .1);
  assert.ok(update.newProbs[0] > update.oldProbs[0]);
  assert.ok(update.newProbs[3] < update.oldProbs[3]);
});

test('repeated training samples from the current policy and is reproducible', () => {
  const first = m.train(m.newTrain(123), 10), second = m.train(m.newTrain(123), 10);
  assert.deepEqual(first, second);
  assert.equal(first.episodes, 10);
  assert.equal(first.returns.length, 10);
  assert.ok(first.last.length <= 30);
  near(m.probabilities(first.policy[m.A]).reduce((a, b) => a + b), 1);
});

test('analytic episode gradient matches finite differences of the weighted log probability', () => {
  const p=m.initialPolicy(), path=m.REFERENCE, G=m.returns(path), u=m.mcUpdates(path,p,.05).find(x=>x.state===m.A);
  const objective=policy=>path.reduce((sum,s,i)=>sum+G[i]*Math.log(m.probabilities(policy[s.state])[m.DIRECTIONS.indexOf(s.action)]),0);
  for(let j=0;j<4;j++) { const plus=m.clonePolicy(p),minus=m.clonePolicy(p),eps=1e-5; plus[m.A][j]+=eps;minus[m.A][j]-=eps;const derivative=(objective(plus)-objective(minus))/(2*eps);assert.ok(Math.abs(derivative-u.delta[j]/.05)<1e-7); }
});

test('uniform network initialization really trains without prescribed routes',()=>{
  const p=m.initialPolicy();Object.keys(p).forEach(c=>p[c]=[0,0,0,0]);const run=m.train({policy:p,seed:123,episodes:0,returns:[],last:[]},100);
  assert.equal(run.episodes,100);assert.notDeepEqual(run.policy[m.A],p[m.A]);assert.equal(run.returns.length,100);
  for(const z of Object.values(run.policy)){const ps=m.probabilities(z);near(ps.reduce((a,b)=>a+b,0),1);assert.ok(ps.every(v=>Number.isFinite(v)&&v>0));}
});
