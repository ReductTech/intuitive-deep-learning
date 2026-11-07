export type Connectivity=4|8;
export const neighbors=(connectivity:Connectivity)=>connectivity===4?[[0,-1],[1,0],[0,1],[-1,0]]:[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
export function traceComponents(mask:Uint8Array,width:number,height:number,connectivity:Connectivity){
  const labels=new Uint32Array(mask.length),order:number[]=[],regions:{id:number;area:number;x:number;y:number;w:number;h:number;start:number;end:number}[]=[];
  for(let seed=0;seed<mask.length;seed++){
    if(!mask[seed]||labels[seed])continue;
    const id=regions.length+1,queue=[seed],start=order.length;labels[seed]=id;
    let minX=width,minY=height,maxX=0,maxY=0;
    // Label on enqueue: each pixel enters the queue exactly once. Record dequeue order
    // for a true breadth-first flood, not a raster reveal of precolored regions.
    for(let head=0;head<queue.length;head++){
      const i=queue[head],x=i%width,y=Math.floor(i/width);order.push(i);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const [dx,dy] of neighbors(connectivity)){const nx=x+dx,ny=y+dy,j=ny*width+nx;if(nx>=0&&nx<width&&ny>=0&&ny<height&&mask[j]&&!labels[j]){labels[j]=id;queue.push(j);}}
    }
    regions.push({id,area:queue.length,x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,start,end:order.length});
  }
  return {labels,order,regions};
}
export function filteredMask(mask:Uint8Array,width:number,height:number,connectivity:Connectivity,minArea:number){
  if(!minArea)return mask;
  const result=traceComponents(mask,width,height,connectivity),keep=new Set(result.regions.filter(r=>r.area>=minArea).map(r=>r.id));
  return mask.map((v,i)=>v&&keep.has(result.labels[i])?1:0);
}
export function diagonalExample(){const a=new Uint8Array(12*12);for(let y=3;y<6;y++)for(let x=3;x<6;x++)a[y*12+x]=1;for(let y=6;y<9;y++)for(let x=6;x<9;x++)a[y*12+x]=1;return a;}
