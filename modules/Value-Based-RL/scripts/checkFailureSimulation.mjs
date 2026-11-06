import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL('../pages/FailureModesPage/failureSimulation.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022',
});
const m = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const { originalWorld, defaultWorld, trainFailureWorld, evaluateFailurePolicy, createFailureTraining,
  trainFailureBatch, failureStep, canAddObstacle, goalReachable, worldKey, DANGER, GAMMA, TRAINING_EPISODES } = m;
const near = (a, b) => assert.ok(Math.abs(a-b)<1e-8, a+' != '+b);
function checkTrace(trace, world) {
  near(trace.score, trace.rewards.reduce((sum, reward)=>sum+reward,0));
  near(trace.discountedReturn, trace.rewards.reduce((sum,reward,index)=>sum+GAMMA**index*reward,0));
  assert.equal(trace.positions.length,trace.rewards.length+1);
  let danger=0,collisions=0;
  for(let index=0;index<trace.actions.length;index++){
    const actual=failureStep(world,trace.positions[index],trace.actions[index]);
    assert.deepEqual(actual.next,trace.positions[index+1]);
    assert.equal(actual.reward,trace.rewards[index]);
    danger+=Number(actual.danger);collisions+=Number(actual.hit);
    if(actual.done)assert.equal(index,trace.actions.length-1);
  }
  assert.equal(danger,trace.dangerEntries);assert.equal(collisions,trace.collisions);
}
const badWorld=defaultWorld('movement'), bad=trainFailureWorld(badWorld);
assert.equal(bad.episodes,TRAINING_EPISODES);
const loop=evaluateFailurePolicy(bad.q,badWorld);
assert.equal(loop.delivered,false);assert.equal(loop.rewards.length,80);assert.equal(loop.score,160);
assert.ok(loop.repeats>0);near(Math.max(...bad.q['5:1']),2/(1-GAMMA));
near(loop.discountedReturn,20*(1-GAMMA**80));checkTrace(loop,badWorld);
const fixedWorld={...badWorld,movement:-1},fixed=trainFailureWorld(fixedWorld);
const delivered=evaluateFailurePolicy(fixed.q,fixedWorld);
assert.equal(delivered.outcome,'safe');assert.equal(delivered.rewards.length,10);assert.equal(delivered.score,1);
assert.equal(evaluateFailurePolicy(bad.q,fixedWorld).score,-80);
checkTrace(delivered,fixedWorld);
const weakWorld=defaultWorld('danger'), weak=trainFailureWorld(weakWorld);
const shortcut=evaluateFailurePolicy(weak.q,weakWorld);
assert.equal(shortcut.outcome,'danger');assert.equal(shortcut.rewards.length,6);
assert.equal(shortcut.dangerEntries,1);near(shortcut.score,4.5);checkTrace(shortcut,weakWorld);
const safeWorld={...weakWorld,dangerPenalty:-8},safe=trainFailureWorld(safeWorld);
const detour=evaluateFailurePolicy(safe.q,safeWorld);
assert.equal(detour.outcome,'safe');assert.equal(detour.rewards.length,10);assert.equal(detour.score,1);
near(evaluateFailurePolicy(weak.q,safeWorld).score,-3);checkTrace(detour,safeWorld);
const original=trainFailureWorld(originalWorld('obstacle')), changedWorld=defaultWorld('obstacle');
const blocked=evaluateFailurePolicy(original.q,changedWorld);
assert.equal(blocked.delivered,false);assert.equal(blocked.collisions,80);assert.equal(blocked.score,-240);
assert.equal(goalReachable(changedWorld),true);
const adapted=trainFailureWorld(changedWorld), adaptedTrace=evaluateFailurePolicy(adapted.q,changedWorld);
assert.equal(adaptedTrace.outcome,'safe');assert.equal(adaptedTrace.score,1);
assert.ok(!adaptedTrace.positions.some(p=>changedWorld.added.includes(p.row+':'+p.col)));
checkTrace(blocked,changedWorld);checkTrace(adaptedTrace,changedWorld);
const isolated={...changedWorld,added:['4:1','5:2','6:1','5:0']};
assert.equal(goalReachable(isolated),false);
const impossible=evaluateFailurePolicy(trainFailureWorld(isolated).q,isolated);
assert.equal(impossible.outcome,'undelivered');checkTrace(impossible,isolated);
assert.equal(canAddObstacle({row:5,col:1}),false);assert.equal(canAddObstacle({row:5,col:5}),false);
assert.equal(canAddObstacle(DANGER),false);assert.equal(canAddObstacle({row:4,col:1}),true);
const danger=failureStep(weakWorld,{row:6,col:2},1);
assert.equal(danger.done,false);assert.equal(danger.danger,true);assert.equal(danger.reward,-1.5);
const goal=failureStep(badWorld,{row:5,col:4},1);
assert.equal(goal.done,true);assert.equal(goal.reward,10);
const terminalTraining=createFailureTraining(safeWorld);
terminalTraining.q['5:5']=[999,999,999,999];
trainFailureBatch(terminalTraining,TRAINING_EPISODES);
for(const key of Object.keys(safe.q))if(key!=='5:5')assert.deepEqual(terminalTraining.q[key],safe.q[key]);
const batched=createFailureTraining(safeWorld);
while(batched.episodes<batched.total)trainFailureBatch(batched,173);
assert.deepEqual(batched.q,safe.q);assert.equal(batched.updates,safe.updates);
const immutable=JSON.stringify(bad.q);evaluateFailurePolicy(bad.q,badWorld);assert.equal(JSON.stringify(bad.q),immutable);
assert.equal(worldKey({...safeWorld,added:['1:1','2:1']}),worldKey({...safeWorld,added:['2:1','1:1']}));
console.log(JSON.stringify({passed:true,episodes:TRAINING_EPISODES,actualUpdates:bad.updates,
  movement:{before:loop.score,delivered:loop.delivered,after:delivered.score},
  danger:{shortcut:shortcut.score,shortcutSteps:shortcut.rewards.length,detour:detour.score,detourSteps:detour.rewards.length},
  obstacle:{oldCollisions:blocked.collisions,newDelivered:adaptedTrace.delivered,unreachableIsNotRepairedByTraining:!impossible.delivered},
  batchingReproducible:true,terminalFutureExcluded:true}));
