import { MathFormulaBlock, MathFormulaStatic } from '../../../shared/react';
export function SaddleDiagram() {
  const project=(x:number,y:number)=>({x:150+(x-y)*50,y:65+(x+y)*18-(x*x-y*y)*32});
  const faces=Array.from({length:144},(_,i)=>{const x=-1+(i%12)/6,y=-1+Math.floor(i/12)/6;return {x,y,depth:x+y};}).sort((a,b)=>a.depth-b.depth);
  const section=(xDirection:boolean)=>Array.from({length:41},(_,i)=>{const t=-1+i/20,p=project(xDirection?t:0,xDirection?0:t);return `${i?'L':'M'}${p.x} ${p.y}`;}).join(' ');
  return <div className="rl-nonconvex-saddle"><svg viewBox="0 0 300 140" role="img" aria-label="鞍点示意：g(u,v)=u²-v²，在原点梯度为零，但沿u方向是谷底，沿v方向是峰顶">{faces.map(({x,y},i)=><path key={i} d={[[x,y],[x+1/6,y],[x+1/6,y+1/6],[x,y+1/6]].map(([a,b],j)=>{const p=project(a,b);return `${j?'L':'M'}${p.x} ${p.y}`;}).join(' ')+'Z'} fill="#c2dcff" stroke="#82afea" strokeWidth=".7"/>)}<path d={section(true)} fill="none" stroke="#367de8" strokeWidth="2.8"/><path d={section(false)} fill="none" stroke="#f07e47" strokeWidth="2.8"/><circle cx="150" cy="65" r="4" fill="#27446e"/></svg><div><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="g(u,v)=u^2-v^2" /></MathFormulaBlock><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="\nabla g(0,0)=0" /></MathFormulaBlock></div></div>;
}
