import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const {outputFiles}=await build({entryPoints:[fileURLToPath(new URL('../pages/EpsilonSchedulePage/epsilonSimulation.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'esm'});
const m=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const key=p=>p.row+':'+p.col, blocked=['2:2','3:2','3:4','4:4','5:3'], deltas=[[-1,0],[0,1],[1,0],[0,-1]];
function env(p,a){const [dr,dc]=deltas[a],candidate={row:p.row+dr,col:p.col+dc};const hit=candidate.row<0||candidate.row>=7||candidate.col<0||candidate.col>=7||blocked.includes(key(candidate));const next=hit?p:candidate,trap=key(next)==='6:3',goal=key(next)==='5:5';return {next,hit,done:trap||goal,reward:trap?-10:goal?10:hit?-3:-1,outcome:trap?'trap':goal?'delivered':'limit'};}
function rng(seed){let state=seed>>>0;return()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};}
function choose(q,eps,random){const explored=random()<eps;if(explored)return [Math.floor(random()*4),true];const max=Math.max(...q),tied=q.flatMap((v,i)=>Math.abs(v-max)<1e-8?[i]:[]);return [tied[Math.floor(random()*tied.length)],false];}
const summaries=[];
for(const preset of m.SCHEDULE_PRESETS){
  const run=m.trainSchedule(preset.schedule),q=Object.fromEntries(Array.from({length:49},(_,i)=>[Math.floor(i/7)+':'+i%7,[0,0,0,0]])),random=rng(m.SCHEDULE_SEED),visited=new Set();
  assert.equal(run.records.length,m.SCHEDULE_EPISODES);let updates=0;
  for(const record of run.records){
    near(record.epsilon,m.epsilonAt(run.schedule,record.episode));
    let score=0,hits=0;
    for(let t=0;t<record.training.actions.length;t++){
      const p=record.training.positions[t];visited.add(key(p));const [action,explored]=choose(q[key(p)],record.epsilon,random);
      assert.equal(record.training.actions[t],action);assert.equal(record.training.explorations[t],explored);
      const out=env(p,action);assert.deepEqual(record.training.positions[t+1],out.next);assert.equal(record.training.rewards[t],out.reward);
      const target=out.reward+(out.done?0:m.GAMMA*Math.max(...q[key(out.next)]));q[key(p)][action]+=m.ALPHA*(target-q[key(p)][action]);
      score+=out.reward;hits+=Number(out.hit);updates++;
      if(out.done){assert.equal(t,record.training.actions.length-1);assert.equal(record.training.outcome,out.outcome);}
    }
    assert.deepEqual(record.q,q);assert.equal(record.training.score,score);assert.equal(record.training.collisions,hits);
    assert.equal(record.coverage,visited.size);assert.equal(record.updates,updates);
    const snapshot=JSON.stringify(record.q);assert.deepEqual(record.greedy,m.evaluateSchedulePolicy(record.q));assert.equal(JSON.stringify(record.q),snapshot);
    for(const mode of ['training','greedy']){
      const trace=record[mode];assert.equal(trace.positions.length,trace.actions.length+1);assert.ok(trace.actions.length<=80);
      near(trace.score,trace.rewards.reduce((a,b)=>a+b,0));
      if(mode==='greedy')assert.ok(trace.explorations.every(value=>!value));
      for(let i=0;i<trace.actions.length;i++){const out=env(trace.positions[i],trace.actions[i]);assert.deepEqual(out.next,trace.positions[i+1]);assert.equal(out.reward,trace.rewards[i]);}
    }
  }
  const eps=run.records.map(r=>r.epsilon);assert.ok(eps.every((value,i)=>value>=.05&&value<=1&&(!i||value<=eps[i-1])));
  const rolling=m.rollingReturns(run,'training');for(const i of [0,5,14,80,239]){const rows=run.records.slice(Math.max(0,i-14),i+1);near(rolling[i],rows.reduce((sum,r)=>sum+r.training.score,0)/rows.length);}
  const batched=m.createScheduleTraining(preset.schedule);while(batched.records.length<240)m.advanceScheduleTraining(batched,7);assert.deepEqual(batched.records,run.records);
  assert.deepEqual(m.trainSchedule(preset.schedule),run);
  const poisoned=m.createScheduleTraining(preset.schedule);poisoned.q['5:5']=[999,999,999,999];poisoned.q['6:3']=[999,999,999,999];m.advanceScheduleTraining(poisoned,240);
  for(const k of Object.keys(q))if(!['5:5','6:3'].includes(k))assert.deepEqual(poisoned.q[k],q[k]);
  summaries.push({label:preset.label,firstGreedyDelivery:run.records.find(r=>r.greedy.outcome==='delivered')?.episode,
    lateTrainingMean:rolling.at(-1),finalGreedy:run.records.at(-1).greedy.outcome,coverage:visited.size,updates});
}
assert.deepEqual(m.normalizeSchedule({start:-20,end:900}),{start:1,end:240});assert.deepEqual(m.normalizeSchedule({start:240,end:2}),{start:239,end:240});
assert.equal(m.epsilonAt({start:20,end:160},20),1);assert.equal(m.epsilonAt({start:20,end:160},160),.05);
const late=m.trainSchedule({start:180,end:230});assert.ok(late.records.some(r=>r.greedy.outcome==='delivered'&&r.training.outcome!=='delivered'&&r.epsilon>.8));
console.log(JSON.stringify({passed:true,episodesVerified:720,exactTDReplay:true,independentNonLearningValidation:true,terminalFutureExcluded:true,batchingReproducible:true,doesNotForceEarlyFailure:true,summaries}));
