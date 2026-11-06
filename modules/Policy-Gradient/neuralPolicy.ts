import { DIRECTIONS, START, GOAL, transition, probabilities, random, returns, type Step } from './mazeModel';
export interface Network { w1:number[][]; w2:number[][] }
export interface NeuralRun { network:Network; seed:number; episodes:number; returns:number[]; last:Step[] }
export const RATE=.0003;
export const copyNetwork=(m:Network):Network=>JSON.parse(JSON.stringify(m));
export function createNetwork(seed=123):Network{
 let r=seed; const value=()=>{let u;[u,r]=random(r);return (u-.5)*.8;};
 return {w1:Array.from({length:8},()=>Array.from({length:16},value)),w2:Array.from({length:4},()=>Array.from({length:8},value))};
}
export function forward(m:Network,s:number){const h=m.w1.map(row=>Math.tanh(row[s]));const z=m.w2.map(row=>row.reduce((v,w,j)=>v+w*h[j],0));return {h,z,p:probabilities(z)};}
export function episode(m:Network,seed:number,greedy=false):[Step[],number]{let s=START,r=seed;const path:Step[]=[];for(let t=0;t<30;t++){const {p}=forward(m,s);let u;[u,r]=random(r);let a=greedy?p.indexOf(Math.max(...p)):0;if(!greedy){while(a<3&&u>=p[a]){u-=p[a];a++;}}const result=transition(s,DIRECTIONS[a]);path.push({state:s,action:DIRECTIONS[a],probability:p[a],...result});s=result.next;if(s===GOAL)break;}return [path,r];}
export function gradient(m:Network,path:Step[]){const g:Network={w1:Array.from({length:8},()=>Array(16).fill(0)),w2:Array.from({length:4},()=>Array(8).fill(0))};const gs=returns(path);let loss=0;
 path.forEach((step,t)=>{const {h,p}=forward(m,step.state);const a=DIRECTIONS.indexOf(step.action);loss-=gs[t]*Math.log(p[a]);const dz=p.map((v,j)=>gs[t]*(v-(j===a?1:0)));const dh=h.map((v,j)=>m.w2.reduce((sum,row,k)=>sum+row[j]*dz[k],0)*(1-v*v));dz.forEach((v,k)=>{h.forEach((v2,j)=>g.w2[k][j]+=v*v2);});dh.forEach((v,j)=>{g.w1[j][step.state]+=v;});});return {g,loss};}
export function updateNetwork(m:Network,path:Step[],rate=RATE){const {g,loss}=gradient(m,path);const after=copyNetwork(m);for(const key of ['w1','w2'] as const)after[key]=m[key].map((row,j)=>row.map((v,k)=>v-rate*g[key][j][k]));return {after,g,loss};}
export function newNeuralRun(seed=123):NeuralRun{return {network:createNetwork(seed),seed:seed+100,episodes:0,returns:[],last:[]};}
export function trainNeural(run:NeuralRun,count:number):NeuralRun{let {network,seed,last}=run;const scores=[...run.returns];for(let i=0;i<count;i++){[last,seed]=episode(network,seed);scores.push(returns(last)[0]);network=updateNetwork(network,last).after;}return {network,seed,last,returns:scores,episodes:run.episodes+count};}
// Fixed draws deliberately select a simple successful example, not a training initializer.
export const DEMO=createNetwork(123);
export const DEMO_ACTIONS=[3,3,0,0,0,3];
export const DEMO_DRAWS:number[]=[];
export const DEMO_PATH:Step[]=[];
let cell=START;
for(const a of DEMO_ACTIONS){const {p}=forward(DEMO,cell);DEMO_DRAWS.push(p.slice(0,a).reduce((x,y)=>x+y,0)+p[a]/2);const result=transition(cell,DIRECTIONS[a]);DEMO_PATH.push({state:cell,action:DIRECTIONS[a],probability:p[a],...result});cell=result.next;}
