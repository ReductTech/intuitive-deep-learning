import type { Point } from './model';
export interface TreeSpec extends Point { id:string; height:number; angle:number; variant:number }
let cached:TreeSpec[]|null=null;
const route=[[-45,13],[-24,14],[-11,10.5],[-10.5,-3],[0,-8],[11,-6.8],[21,-7.5],[27,-15],[30,-20.4],[43,-27]];
const clear=[[-18,13,2.8],[-11,10.5,2.2],[-10.5,-3,2.2],[21,-7.5,2.2],[-6,3,2.3],[-17,-11,2.3],[27,10,2.3],[30,-20.4,4.5]];
export function segmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
export function forest(river:(z:number)=>number):TreeSpec[]{
 if(cached)return cached;
 let seed=274018;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const trees:TreeSpec[]=[];
 for(let z=-69;z<69;z+=2.4)for(let x=-89;x<89;x+=2.4){const p={x:x+random()*1.9,z:z+random()*1.9};const blocked=Math.abs(p.x-river(p.z))<4.3||clear.some(([a,b,r])=>Math.hypot(p.x-a,p.z-b)<r)||route.some(([a,b],i)=>i>0&&segmentDistance(p,{x:a,z:b},{x:route[i-1][0],z:route[i-1][1]})<1.45)||(p.x>-45&&p.x<-23&&p.z>-6&&p.z<8)||(p.x>31&&p.x<45&&p.z>2&&p.z<13);
  if(blocked||random()>.7)continue;const burned=p.x<-22&&p.z<11&&p.z>-13,variant=burned?5+Math.floor(random()*2):random()<.82?Math.floor(random()*3):3+Math.floor(random()*2);
  trees.push({...p,id:`tree-${trees.length}`,height:burned?2+random()*1.6:2.5+random()*2.1,angle:random()*Math.PI*2,variant});
 }
 return cached=trees;
}
