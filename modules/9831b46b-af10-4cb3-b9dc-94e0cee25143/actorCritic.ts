import type recordData from './assets/precomputed/ac.json';
import {loadPrecomputed} from './precomputed';
const record=await loadPrecomputed<typeof recordData>('ac');
import { createNetwork, forward, gradient, type Network } from './neuralPolicy';
import { START, DIRECTIONS, random, transition, type Step } from './mazeModel';
// Q Actor-Critic, following DRL §7.5: independent preview action, no baseline.
export const ACTOR_RATE=.001, CRITIC_RATE=.02;
export interface ACRun {actor:Network;critic:Network;seed:number;episodes:number;scores:number[];last:ACStep[]}
export interface ACStep {step:Step;preview:number;terminal:boolean;q:number;nextQ:number;target:number;error:number;actorBefore:Network;actorAfter:Network;criticBefore:Network;criticAfter:Network}
export const qValues=(m:Network,s:number)=>forward(m,s).z;
export function drawAction(m:Network,s:number,seed:number):[number,number]{const p=forward(m,s).p;let u;[u,seed]=random(seed);let a=0;while(a<3&&u>=p[a])u-=p[a++];return[a,seed];}
export function criticGradient(m:Network,s:number,a:number,target:number){const {h,z}=forward(m,s),error=z[a]-target;const g:Network={w1:m.w1.map(row=>row.map(()=>0)),w2:m.w2.map(row=>row.map(()=>0))};h.forEach((v,j)=>{g.w2[a][j]=error*v;g.w1[j][s]=error*m.w2[a][j]*(1-v*v);});return{g,loss:.5*error*error};}
const descend=(m:Network,g:Network,rate:number):Network=>({w1:m.w1.map((row,i)=>row.map((v,j)=>v-rate*g.w1[i][j])),w2:m.w2.map((row,i)=>row.map((v,j)=>v-rate*g.w2[i][j]))});
export function acUpdate(actor:Network,critic:Network,step:Step,preview:number,terminal=step.terminal):ACStep{const a=DIRECTIONS.indexOf(step.action);const q=qValues(critic,step.state)[a],nextQ=terminal?0:qValues(critic,step.next)[preview],target=step.reward+nextQ;const cg=criticGradient(critic,step.state,a,target); // gamma=1; frozen target
 const ag=gradient(actor,[{...step,reward:q}]).g; // frozen old critic score, not TD error
 return{step,preview,terminal,q,nextQ,target,error:q-target,actorBefore:actor,actorAfter:descend(actor,ag,ACTOR_RATE),criticBefore:critic,criticAfter:descend(critic,cg.g,CRITIC_RATE)};}
export function newACRun(seed=123):ACRun{return{actor:createNetwork(seed),critic:createNetwork(seed+777),seed:seed+100,episodes:0,scores:[],last:[]};}
export function trainAC(run:ACRun,count:number):ACRun { const frames=record.frames as unknown as ACRun[];const frame=frames.find(f=>f.episodes>=run.episodes+count)??frames.at(-1)!;return structuredClone(frame); }
