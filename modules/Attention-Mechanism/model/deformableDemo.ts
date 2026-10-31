/** Encoder grid-query teaching demo: references are cell centers. Two-dimensional q summarizes feature + position. Not a detector checkpoint. Offsets are in feature-cell units. */
export type DeformableTarget='water'|'juice';
export const DEFORMABLE_GRID=[10,6] as const;
export const DEFORMABLE_QUERIES={water:[1,0],juice:[0,1]} as const;
export const DEFORMABLE_OFFSET_W=[[-1.3,-.7],[-.18,-.21],[-.25,.25],[.18,-.24],[1,-.4],[-.12,.36],[.2,.55],[.66,.54]];
export function deformableDemo(target:DeformableTarget){
  const q=DEFORMABLE_QUERIES[target],linear=(w:readonly number[])=>w[0]*q[0]+w[1]*q[1];
  const cell=target==='water'?[5,2]:[8,2];
  const reference=[(cell[0]+.5)/10,(cell[1]+.5)/6];
  const offsets=Array.from({length:4},(_,j)=>[linear(DEFORMABLE_OFFSET_W[j*2]),linear(DEFORMABLE_OFFSET_W[j*2+1])]);
  const scores=[[Math.log(.36),Math.log(.43)],[Math.log(.30),Math.log(.31)],[Math.log(.22),Math.log(.16)],[Math.log(.12),Math.log(.10)]].map(linear);
  const sum=scores.reduce((v,x)=>v+Math.exp(x),0),weights=scores.map(x=>Math.exp(x)/sum);
  const samples=offsets.map(([dx,dy])=>[reference[0]+dx/10,reference[1]+dy/6]);
  return {q,cell,reference,offsets,scores,weights,samples};
}

/** One shared, hand-set scalar V feature map for both queries (not an RGB image).
 * Coordinates follow align_corners=false: cell (x,y) is centered at
 * ((x+.5)/W,(y+.5)/H). Reference: the official Deformable-DETR MSDeformAttn.
 * https://github.com/fundamentalvision/Deformable-DETR/blob/main/models/ops/modules/ms_deform_attn.py
 */
export function deformableFeatureValue(x:number,y:number){
  return Number((.5+.1*x+.15*y+(x>=7&&y>=1&&y<=3?1.2:0)+(x>=3&&x<=6&&y>=1&&y<=3?.6:0)).toFixed(2));
}
export function bilinearDeformableRead(point:readonly number[]){
  const x=point[0]*DEFORMABLE_GRID[0]-.5,y=point[1]*DEFORMABLE_GRID[1]-.5;
  if(x<0||y<0||x>9||y>5)throw new RangeError('Teaching samples must remain inside the V feature grid.');
  const x0=Math.floor(x),y0=Math.floor(y),u=x-x0,v=y-y0;
  const corners=[[x0,y0,(1-u)*(1-v)],[Math.min(9,x0+1),y0,u*(1-v)],[x0,Math.min(5,y0+1),(1-u)*v],[Math.min(9,x0+1),Math.min(5,y0+1),u*v]].map(([column,row,coefficient])=>({column,row,coefficient,value:deformableFeatureValue(column,row)}));
  const value=corners.reduce((sum,corner)=>sum+corner.coefficient*corner.value,0);
  return {x,y,u,v,corners,value};
}
export function deformableValueReadout(target:DeformableTarget){
  const demo=deformableDemo(target);
  const reads=demo.samples.map(bilinearDeformableRead);
  const contributions=reads.map((read,index)=>demo.weights[index]*read.value);
  return {...demo,reads,contributions,context:contributions.reduce((sum,value)=>sum+value,0)};
}
