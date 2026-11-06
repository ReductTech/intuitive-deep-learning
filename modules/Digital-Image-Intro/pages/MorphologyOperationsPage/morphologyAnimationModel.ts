export const W=26,H=16;
export type MorphMode='erode'|'dilate'|'open'|'close';
export function initialShape(){const a=new Uint8Array(W*H);const fill=(x0:number,y0:number,w:number,h:number)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)a[y*W+x]=1;};fill(7,4,10,8);fill(9,3,6,1);fill(9,12,5,1);fill(17,5,4,1);fill(6,9,1,2);fill(15,12,1,2);a[7*W+11]=0;a[8*W+11]=0;return a;}
export function neighborhood(a:Uint8Array,index:number){const x=index%W,y=Math.floor(index/W);return Array.from({length:9},(_,k)=>{const nx=x+k%3-1,ny=y+Math.floor(k/3)-1;return nx<0||nx>=W||ny<0||ny>=H?0:a[ny*W+nx];});}
export function applyMorph(a:Uint8Array,op:'erode'|'dilate'){return a.map((_,i)=>Number(op==='erode'?neighborhood(a,i).every(Boolean):neighborhood(a,i).some(Boolean)));}
export function makePasses(source:Uint8Array,mode:MorphMode){
 const operations:('erode'|'dilate')[]=mode==='open'?['erode','dilate']:mode==='close'?['dilate','erode']:[mode];
 let input=source,start=0;
 return operations.map(op=>{const output=applyMorph(input,op),order=Array.from(input,(_,i)=>i).filter(i=>input[i]||output[i]);const pass={op,input,output,order,start,end:start+order.length};start+=order.length;input=output;return pass;});
}
