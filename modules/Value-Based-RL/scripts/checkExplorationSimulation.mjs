import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const load=async(relative)=>{
 const {outputFiles}=await build({entryPoints:[fileURLToPath(new URL(relative,import.meta.url))],bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
};
const {createExplorationQ,evaluateExploration,actionProbabilities,SNAPSHOT_UPDATES,TRIALS}=await load('../pages/ExplorationPage/explorationSimulation.ts');
const {createSimulation,advanceSimulation,warehouseStep,EPISODE_LIMIT}=await load('../pages/QLearningLoopPage/qLearningSimulation.ts');
const {START,keyOf,chooseAction,seededRandom}=await load('../model.ts');
let training=createSimulation();for(let step=0;step<SNAPSHOT_UPDATES;step++)training=advanceSimulation(training);
const q=createExplorationQ(),frozen=JSON.stringify(q);assert.deepEqual(q,training.q);
assert.deepEqual(actionProbabilities([1,4,2,3],0),[0,1,0,0]);
assert.deepEqual(actionProbabilities([1,4,2,3],1),[.25,.25,.25,.25]);
assert.deepEqual(actionProbabilities([1,4,2,3],.25),[.0625,.8125,.0625,.0625]);
assert.deepEqual(actionProbabilities([4,4,2,3],.2),[.45,.45,.05,.05]);
assert.deepEqual(actionProbabilities([0,0,0,0],.4),[.25,.25,.25,.25]);
const reports=[];for(const epsilon of [0,.25,.5,1]){
 const result=evaluateExploration(q,epsilon);assert.equal(JSON.stringify(q),frozen);assert.deepEqual(evaluateExploration(q,epsilon),result);
 assert.equal(result.records.length,TRIALS);const visited=new Set();
 for(const record of result.records){assert.deepEqual(record.route[0],START);assert.equal(record.rewards.length,record.route.length-1);assert.ok(record.rewards.length<=EPISODE_LIMIT);
  record.route.forEach(p=>visited.add(keyOf(p)));let last;
  for(let step=0;step<record.rewards.length;step++){
   const from=record.route[step],next=record.route[step+1],reward=record.rewards[step];
   const matches=[0,1,2,3].map(action=>warehouseStep(from,action)).filter(out=>keyOf(out.next)===keyOf(next)&&out.reward===reward);
   assert.ok(matches.length,'Every recorded movement and reward comes from the actual warehouse.');last=matches[0];
   if(step<record.rewards.length-1)assert.equal(last.done,false,'No transition follows a terminal state.');
  }
  if(record.outcome==='limit'){assert.equal(last.done,false);assert.equal(record.rewards.length,EPISODE_LIMIT);}
  else{assert.equal(last.done,true);assert.equal(last.trapped,record.outcome==='trap');}
 }
 assert.equal(result.coverage,visited.size);assert.equal(result.deliveries,result.records.filter(r=>r.outcome==='delivered').length);assert.equal(result.traps,result.records.filter(r=>r.outcome==='trap').length);
 reports.push({epsilon,coverage:result.coverage,deliveries:result.deliveries,traps:result.traps});
}
// Compare displayed probabilities with the behavior sampler, including tied maxima.
for(const values of [[1,4,2,3],[4,4,2,3]]){
 const random=seededRandom(11),counts=[0,0,0,0],expected=actionProbabilities(values,.25);
 for(let i=0;i<100000;i++)counts[chooseAction(values,.25,random)]++;
 counts.forEach((count,action)=>assert.ok(Math.abs(count/100000-expected[action])<.006));
}
console.log(JSON.stringify({passed:true,sourceUpdates:SNAPSHOT_UPDATES,snapshotUnmodified:true,actualTransitions:true,samplerMatchesProbabilities:true,reports}));
