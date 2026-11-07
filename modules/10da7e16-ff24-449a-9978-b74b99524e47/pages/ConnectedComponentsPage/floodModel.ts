import { neighbors,type Connectivity } from './connectedModel';
export const GRID_W=28,GRID_H=18;
export function makeTeachingShape(variant:number){
 const a=new Uint8Array(GRID_W*GRID_H);let state=variant+19;
 const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 const runs=[[4,7,10],[5,6,12],[6,5,12],[7,5,13],[8,6,13],[9,6,12],[10,7,12],[11,8,12],[12,13,16],[13,13,18],[14,14,19],[15,15,18]];
 for(const [y,left,right] of runs){const l=y===11||y===12?left:left+Math.floor(random()*2),r=y===11||y===12?right:right-Math.floor(random()*2);for(let x=l;x<=r;x++)a[y*GRID_W+x]=1;}
 // The two lobes touch only at (12,11)/(13,12): identical shape, different 4/8 reachability.
 return a;
}
export function floodFrom(mask:Uint8Array,width:number,height:number,seed:number,connectivity:Connectivity){
 const seen=new Uint8Array(mask.length),steps:{pixel:number;added:number[]}[]=[];
 if(!mask[seed])return {steps,seen};
 const queue=[seed];seen[seed]=1;
 for(let head=0;head<queue.length;head++){
  const i=queue[head],x=i%width,y=Math.floor(i/width),added:number[]=[];
  for(const [dx,dy] of neighbors(connectivity)){const nx=x+dx,ny=y+dy,j=ny*width+nx;if(nx>=0&&nx<width&&ny>=0&&ny<height&&mask[j]&&!seen[j]){seen[j]=1;queue.push(j);added.push(j);}}
  steps.push({pixel:i,added});
 }
 return {steps,seen};
}
