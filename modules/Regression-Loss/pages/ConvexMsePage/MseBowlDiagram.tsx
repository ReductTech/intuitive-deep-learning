import { useMemo, useRef, useState } from 'react';
import { MathFormulaBlock, MathFormulaStatic } from '../../../shared/react';

type Point = { x:number; y:number; z:number };
const colorStops=[[0,[44,125,244]],[.28,[82,155,253]],[.6,[178,210,250]],[.82,[238,224,214]],[1,[255,153,125]]] as const;
function color(value:number) {
  for(let i=1;i<colorStops.length;i++) {
    if(value<=colorStops[i][0]) { const [a,ca]=colorStops[i-1],[b,cb]=colorStops[i]; const t=(value-a)/(b-a); return `rgb(${ca.map((v,j)=>Math.round(v+(cb[j]-v)*t)).join(',')})`; }
  }
  return 'rgb(255,153,125)';
}
/** A coordinate-free teaching illustration of a convex quadratic, not a numeric plot of the experiment. */
export function MseBowlDiagram({ unique }: { unique:boolean }) {
  const [tilt,setTilt]=useState(1);
  const [zoom,setZoom]=useState(1);
  const drag=useRef<{y:number;tilt:number}|null>(null);
  const project=(p:Point)=>({x:380+(p.x-p.y)*170,y:425+(p.x+p.y)*75*tilt-p.z*100});
  const height=(x:number,y:number)=>unique?(x*x+y*y):x*x;
  const paths=useMemo(()=> {
    const size=26;
    return Array.from({length:size*size},(_,i)=> {
      const ix=i%size,iy=Math.floor(i/size),x=-1+ix*2/size,y=-1+iy*2/size;
      const corners=[[x,y],[x+2/size,y],[x+2/size,y+2/size],[x,y+2/size]].map(([u,v])=>({x:u,y:v,z:height(u,v)}));
      // Cut away the nearest corner so the minimum stays visible, as in the reference.
      const points:Point[]=[];
      corners.forEach((a,j)=>{
        const b=corners[(j+1)%corners.length],inside=a.x+a.y<=1,nextInside=b.x+b.y<=1;
        if(inside) points.push(a);
        if(inside!==nextInside) { const t=(1-a.x-a.y)/(b.x+b.y-a.x-a.y),u=a.x+(b.x-a.x)*t,v=a.y+(b.y-a.y)*t;points.push({x:u,y:v,z:height(u,v)}); }
      });
      return {points,z:points.length?points.reduce((s,p)=>s+p.z,0)/points.length:0,depth:x+y};
    }).filter(face=>face.points.length>=3).sort((a,b)=>a.depth-b.depth);
  },[unique]);
  return <svg className="rl-convex-diagram" viewBox="0 0 760 620" role="img" aria-label="MSE凸性示意：蓝色碗状曲面、网格和底面等高线，红点标记最小值位置；上下拖动调整视角，滚轮缩放" onPointerDown={e=>{drag.current={y:e.clientY,tilt};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current)setTilt(Math.max(.8,Math.min(1.2,drag.current.tilt+(e.clientY-drag.current.y)*.002)));}} onPointerUp={e=>{drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{drag.current=null;}} onWheel={e=>setZoom(z=>Math.max(.85,Math.min(1.03,z-e.deltaY*.0004)))}>
    <defs><radialGradient id="rl-convex-ground"><stop offset="0" stopColor="#bddbff" stopOpacity=".55"/><stop offset="1" stopColor="#eaf4ff" stopOpacity=".04"/></radialGradient><marker id="rl-convex-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#505c69"/></marker></defs>
    <g transform={`translate(380 310) scale(${zoom}) translate(-380 -310)`}>
      <ellipse cx="380" cy="465" rx="308" ry={112*tilt} fill="url(#rl-convex-ground)" />
      {[.24,.4,.57,.74,.91].map(r=><ellipse key={r} cx="380" cy="465" rx={308*r} ry={112*tilt*r} fill="none" stroke="#a2c8fb" strokeWidth="1.1" opacity=".68"/>)}
      <path d={`M82 465L380 ${465+122*tilt}L686 465`} fill="none" stroke="#505c69" strokeWidth="1.8" markerEnd="url(#rl-convex-arrow)"/>
      <path d="M82 465V112" stroke="#505c69" strokeWidth="1.8" markerEnd="url(#rl-convex-arrow)"/>
      {paths.map(({points,z},index)=><path key={index} d={points.map((p,j)=>{const q=project(p);return `${j?'L':'M'}${q.x.toFixed(2)} ${q.y.toFixed(2)}`;}).join(' ')+'Z'} fill={color(z/2)} fillOpacity="1" stroke="rgba(66,111,172,.2)" strokeWidth=".65" strokeLinejoin="round"/>)}
      <circle cx="380" cy="425" r="11" fill="#ef3028"/>
      <foreignObject x="4" y="60" width="220" height="72"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="\mathrm{MSE}(w,b)" /></MathFormulaBlock></foreignObject>
      <foreignObject x="106" y="492" width="80" height="60"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="b" /></MathFormulaBlock></foreignObject>
      <foreignObject x="650" y="480" width="80" height="60"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="w" /></MathFormulaBlock></foreignObject>
    </g>
  </svg>;
}
