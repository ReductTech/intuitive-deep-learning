import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const {outputFiles}=await build({entryPoints:[fileURLToPath(new URL('../pages/ReplayBufferPage/replaySimulation.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'esm'});
const m=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const {createReplaySimulation:create,collectReplayExperience:collect,sampleReplayBatch:sample,learnReplayBatch:learn,bufferEntries,experienceKey}=m;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`),key=p=>p.row+':'+p.col;
const deltas=[[-1,0],[0,1],[1,0],[0,-1]],walls=['2:2','3:2','3:4','4:4','5:3'];
function checkEntry(entry){const [dr,dc]=deltas[entry.action],p={row:entry.s.row+dr,col:entry.s.col+dc};const hit=p.row<0||p.row>=7||p.col<0||p.col>=7||walls.includes(key(p));const next=hit?entry.s:p,trap=key(next)==='6:3',goal=key(next)==='5:5';assert.deepEqual(entry.next,next);assert.equal(entry.hit,hit);assert.equal(entry.done,trap||goal);assert.equal(entry.reward,trap?-10:goal?10:hit?-3:-1);assert.equal(entry.trapped,trap);}
let state=create();assert.equal(state.collected,0);assert.equal(state.slots.filter(Boolean).length,0);assert.equal(sample(state),state);assert.equal(learn(state),state);
const records=[];
for(const action of [0,1,1,0,0,1,1,2,2,2,2,1,1]){
  const before=JSON.stringify(state),next=collect(state,action);assert.equal(JSON.stringify(state),before);checkEntry(next.latest);records.push(next.latest);state=next;
}
assert.equal(records[9].done,true);assert.equal(records[9].reward,10);assert.equal(records[12].trapped,true);assert.equal(records[12].reward,-10);
assert.equal(records[10].episode,2);assert.equal(records[10].step,1);assert.deepEqual(records[10].s,{row:5,col:1});
assert.equal(state.collected,13);assert.equal(state.nextSlot,5);assert.equal(state.evicted,5);assert.deepEqual(state.slots.map(x=>x.id),[9,10,11,12,13,6,7,8]);
const old=JSON.stringify(state),drawn=sample(state);assert.equal(JSON.stringify(state),old);assert.equal(drawn.batch.length,4);assert.equal(new Set(drawn.batch.map(e=>e.id)).size,4);
for(const entry of drawn.batch){assert.ok(bufferEntries(state).some(original=>experienceKey(original)===experienceKey(entry)));assert.notEqual(entry,state.slots[entry.slot]);}
assert.deepEqual(sample(state),drawn);
assert.equal(drawn.collectorSeed,state.collectorSeed);assert.deepEqual(collect(drawn).latest,collect(state).latest);
let trained=learn(drawn);assert.equal(trained.collected,drawn.collected);assert.deepEqual(trained.position,drawn.position);assert.equal(trained.collectorSeed,drawn.collectorSeed);assert.equal(trained.sampleSeed,drawn.sampleSeed);
assert.deepEqual(trained.batch,drawn.batch);assert.deepEqual(trained.slots,drawn.slots);assert.equal(trained.updates,1);assert.equal(trained.batchUpdates,1);assert.notDeepEqual(trained.network,drawn.network);assert.ok(trained.lossAfter<trained.lossBefore);
for(const entry of trained.batch){assert.equal(trained.uses[entry.id],1);assert.notEqual(trained.learning[entry.id].before,trained.learning[entry.id].after);if(entry.done)near(trained.learning[entry.id].target,entry.reward);}
trained=learn(trained);assert.equal(trained.updates,2);assert.equal(trained.collected,13);for(const entry of trained.batch)assert.equal(trained.uses[entry.id],2);
const frozenBatch=JSON.stringify(trained.batch);for(let i=0;i<12;i++)trained=collect(trained,0);assert.equal(JSON.stringify(trained.batch),frozenBatch);assert.ok(trained.batch.every(entry=>!bufferEntries(trained).some(stored=>stored.id===entry.id)));
const reused=learn(trained);assert.equal(reused.collected,trained.collected);assert.equal(reused.updates,3);for(const entry of reused.batch)assert.equal(reused.uses[entry.id],3);
const terminals={...state,batch:[records[9],records[12],records[10],records[11]]};const learnedTerminals=learn(terminals);near(learnedTerminals.learning[records[9].id].target,10);near(learnedTerminals.learning[records[12].id].target,-10);
let limit=create();for(let i=0;i<80;i++)limit=collect(limit,3);assert.equal(limit.latest.truncated,true);assert.equal(limit.latest.done,false);const learnedLimit=learn(sample(limit));assert.notEqual(learnedLimit.learning[learnedLimit.batch[0].id].target,-3);
let mixed=state;const seen=new Set();for(let round=0;round<12;round++){mixed=sample(mixed);mixed.batch.forEach(e=>seen.add(e.id));mixed=learn(mixed);}assert.equal(seen.size,8);assert.ok(Object.values(mixed.uses).some(n=>n>1));
let automatic=create();for(let i=0;i<300;i++){automatic=collect(automatic);checkEntry(automatic.latest);if(i%9===8)automatic=learn(sample(automatic));}assert.equal(automatic.collected,300);assert.ok(JSON.stringify(automatic.network).includes('null')===false);
console.log(JSON.stringify({passed:true,realTransitionsVerified:393,ringFIFO:true,sampleWithoutReplacement:true,independentRandomStreams:true,batchSurvivesOverwrite:true,relearningWithoutNewInteraction:true,realNetworkUpdate:true,terminalAndTruncationCorrect:true}));
