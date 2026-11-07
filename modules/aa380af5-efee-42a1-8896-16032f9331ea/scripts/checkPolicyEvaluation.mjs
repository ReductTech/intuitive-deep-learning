import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL('../components/policyEvaluation.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022' });
const m = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const { sampleDelivery, policyProbabilities, experienceMean, EVALUATION_GAMMA: gamma, EVALUATION_STATES: states } = m;
const blocked = ['2:2','3:2','3:4','4:4','5:3'], goal = '5:5', trap = '6:3', key=p=>p.row+':'+p.col;
const terminal = p => key(p) === goal || key(p) === trap;
const deltas=[[-1,0],[0,1],[1,0],[0,-1]], near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
function environment(position, action) {
  const delta=deltas[action], candidate={row:position.row+delta[0],col:position.col+delta[1]};
  const hit=candidate.row<0||candidate.row>=7||candidate.col<0||candidate.col>=7||blocked.includes(key(candidate));
  const next=hit?position:candidate, trapped=key(next)===trap, done=terminal(next);
  return {next,hit,done,trapped,reward:trapped?-10:done?10:hit?-3:-1};
}
let experiences=0;
for(const policy of ['safe','random'])for(const position of states){
  const probabilities=policyProbabilities(policy,position);
  near(probabilities.reduce((a,b)=>a+b,0),terminal(position)?0:1);
  if(policy==='safe')for(let a=0;a<4;a++)if(environment(position,a).hit||environment(position,a).trapped)assert.equal(probabilities[a],0);
  for(let index=0;index<20;index++)for(const forced of [undefined,0,1,2,3]){
    const sample=sampleDelivery(policy,index,forced,position);experiences++;
    assert.deepEqual(sample,sampleDelivery(policy,index,forced,position));
    assert.equal(sample.positions.length,sample.actions.length+1);assert.ok(sample.actions.length<=80);
    if(forced!==undefined&&!terminal(position))assert.equal(sample.actions[0],forced);
    let sum=0;
    for(let step=0;step<sample.actions.length;step++){
      const out=environment(sample.positions[step],sample.actions[step]);
      assert.deepEqual(out.next,sample.positions[step+1]);assert.equal(out.reward,sample.rewards[step]);
      assert.equal(out.hit,sample.collisions[step]);sum+=gamma**step*out.reward;
      if(out.done)assert.equal(step,sample.actions.length-1);
      if(step>0||forced===undefined)assert.ok(policyProbabilities(policy,sample.positions[step])[sample.actions[step]]>0);
    }
    near(sum,sample.value);assert.equal(sample.delivered,key(sample.positions.at(-1))===goal);
    assert.equal(sample.trapped,key(sample.positions.at(-1))===trap);
    assert.ok(sample.value>=-30&&sample.value<=10);
  }
}
// Evaluate the same fixed policy independently; compare Monte Carlo estimates with Bellman expectations.
function policyValues(policy){
  let v=Object.fromEntries(states.map(p=>[key(p),0]));
  for(let round=0;round<240;round++)v=Object.fromEntries(states.map(p=>[key(p),terminal(p)?0:policyProbabilities(policy,p).reduce((sum,prob,a)=>{
    const out=environment(p,a);return sum+prob*(out.reward+(out.done?0:gamma*v[key(out.next)]));
  },0)]));
  return v;
}
const safeV=policyValues('safe'), randomV=policyValues('random'), count=6000;
const samples=policy=>Array.from({length:count},(_,i)=>sampleDelivery(policy,i));
near(experienceMean(samples('safe')),safeV['5:1'],.10);
near(experienceMean(samples('random')),randomV['5:1'],.25);
assert.ok(safeV['5:1']>randomV['5:1']);
const q=Array.from({length:4},(_,a)=>experienceMean(Array.from({length:count},(_,i)=>sampleDelivery('safe',i,a))));
for(let a=0;a<4;a++){
  const out=environment({row:5,col:1},a), exact=out.reward+gamma*safeV[key(out.next)];
  near(q[a],exact,.10);
}
near(policyProbabilities('safe',{row:5,col:1}).reduce((sum,p,a)=>sum+p*q[a],0),safeV['5:1'],.10);
assert.equal(experienceMean([]),undefined);
assert.equal(sampleDelivery('safe',0,undefined,{row:5,col:5}).value,0);
assert.equal(sampleDelivery('random',0,undefined,{row:6,col:3}).value,0);
assert.equal(sampleDelivery('safe',0,1,{row:6,col:2}).value,-10);
assert.equal(sampleDelivery('safe',0,1,{row:6,col:2}).actions.length,1);
assert.ok(new Set(samples('safe').slice(0,20).map(sample=>sample.value)).size>1);
console.log(JSON.stringify({passed:true,experiences,policyUnchangedAfterFirstAction:true,terminalFutureExcluded:true,
  exactV:{safe:safeV['5:1'],random:randomV['5:1']},sampleQ:q,VEqualsPolicyWeightedQ:true,truncationTailBound:30*gamma**80}));
