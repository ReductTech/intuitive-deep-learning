import { GOAL, seededRandom, type Position } from './model';
export interface TinyQNetwork { w1:number[][]; b1:number[]; w2:number[][]; b2:number[]; }
export const encodeState=(p:Position)=>[p.col/6,p.row/6,(GOAL.col-p.col)/6,(GOAL.row-p.row)/6];
export function createNetwork():TinyQNetwork {const random=seededRandom(71);return{w1:Array.from({length:6},()=>Array.from({length:4},()=>random()-.3)),b1:Array(6).fill(.2),w2:Array.from({length:4},()=>Array.from({length:6},()=>random()-.5)),b2:[1.2,2,1,.3]};}
export const cloneNetwork=(n:TinyQNetwork):TinyQNetwork=>({w1:n.w1.map(r=>[...r]),b1:[...n.b1],w2:n.w2.map(r=>[...r]),b2:[...n.b2]});
export function forward(n:TinyQNetwork,x:readonly number[]) {const z=n.w1.map((r,j)=>r.reduce((s,w,i)=>s+w*x[i],n.b1[j]));const hidden=z.map(v=>Math.max(0,v));const values=n.w2.map((r,a)=>r.reduce((s,w,j)=>s+w*hidden[j],n.b2[a]));return{z,hidden,values};}
/** A semi-gradient Huber step: the scalar target is held constant. */
export function trainNetwork(n:TinyQNetwork,x:readonly number[],action:number,target:number,lr=.05) {const copy=cloneNetwork(n);const {z,hidden,values}=forward(n,x);const delta=Math.max(-1,Math.min(1,values[action]-target));for(let j=0;j<6;j++){copy.w2[action][j]-=lr*delta*hidden[j];const dh=delta*n.w2[action][j]*(z[j]>0?1:0);for(let i=0;i<4;i++)copy.w1[j][i]-=lr*dh*x[i];copy.b1[j]-=lr*dh;}copy.b2[action]-=lr*delta;return copy;}
export function trainBatch(n:TinyQNetwork,samples:{x:number[];action:number;target:number}[],lr=.05) {
 const result=cloneNetwork(n);for(const sample of samples){const update=trainNetwork(n,sample.x,sample.action,sample.target,lr/samples.length);for(let j=0;j<6;j++){result.b1[j]+=update.b1[j]-n.b1[j];for(let i=0;i<4;i++)result.w1[j][i]+=update.w1[j][i]-n.w1[j][i];}for(let a=0;a<4;a++){result.b2[a]+=update.b2[a]-n.b2[a];for(let j=0;j<6;j++)result.w2[a][j]+=update.w2[a][j]-n.w2[a][j];}}return result;
}
