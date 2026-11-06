export const WIDTH=22,HEIGHT=18;
export type Operation='erode'|'dilate'|'open'|'close'|'components';
export function makeSource(){
  const a=new Uint8Array(WIDTH*HEIGHT);const rect=(x0:number,y0:number,w:number,h:number)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)a[y*WIDTH+x]=1;};
  rect(3,3,6,6);a[5*WIDTH+5]=0; // A small hole for closing.
  rect(13,3,6,6);for(let y=3;y<9;y++)a[y*WIDTH+16]=0; // A narrow gap.
  rect(3,12,6,4);rect(11,12,3,4);rect(9,13,2,1); // Thin bridge for opening.
  rect(16,12,2,2);rect(18,14,2,2); // Diagonal contact: different 4/8 connectivity.
  a[6*WIDTH+11]=1;a[10*WIDTH+4]=1; // Small foreground specks.
  return a;
}
export const at=(a:Uint8Array,x:number,y:number)=>x>=0&&x<WIDTH&&y>=0&&y<HEIGHT?a[y*WIDTH+x]:0;
export function morph(a:Uint8Array,op:'erode'|'dilate'){
  const b=new Uint8Array(a.length);
  // Centered, symmetric full 3x3 structuring element; outside the image is zero.
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    let value=op==='erode'?1:0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)value=op==='erode'?value&at(a,x+dx,y+dy):value|at(a,x+dx,y+dy);
    b[y*WIDTH+x]=value;
  }
  return b;
}
export function transform(a:Uint8Array,op:Operation){
  if(op==='open')return morph(morph(a,'erode'),'dilate');
  if(op==='close')return morph(morph(a,'dilate'),'erode');
  return op==='components'?a.slice():morph(a,op);
}
export function components(a:Uint8Array,connectivity:4|8){
  const labels=new Uint16Array(a.length);let count=0;
  const offsets=connectivity===4?[[0,-1],[1,0],[0,1],[-1,0]]:[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  for(let i=0;i<a.length;i++){
    if(!a[i]||labels[i])continue;count++;labels[i]=count;const queue=[i];
    for(let q=0;q<queue.length;q++){const current=queue[q],x=current%WIDTH,y=Math.floor(current/WIDTH);
      for(const [dx,dy] of offsets){const nx=x+dx,ny=y+dy,n=ny*WIDTH+nx;if(at(a,nx,ny)&&!labels[n]){labels[n]=count;queue.push(n);}}
    }
  }
  return {labels,count};
}
