import { useMemo, useRef, useState, useEffect } from 'react';
import { Button, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './SurfaceDiagram.css';

export type Landmark = { x:number; y:number; value:number; kind:'global'|'local'|'saddle'|'maximum' };
type V = {x:number;y:number;z:number};
const names={global:'全局最优',local:'局部最优',saddle:'鞍点',maximum:'局部极大'};
const colors={global:'#009eaa',local:'#f07e47',saddle:'#7955c8',maximum:'#64748b'};
const stops=[[0,[46,124,241]],[.3,[108,175,250]],[.6,[192,221,247]],[.8,[245,235,205]],[1,[248,169,124]]] as const;
function color(z:number) {
  for(let i=1;i<stops.length;i++) if(z<=stops[i][0]) {
    const [a,ca]=stops[i-1],[b,cb]=stops[i],t=Math.max(0,(z-a)/(b-a));
    return `rgb(${ca.map((v,j)=>Math.round(v+(cb[j]-v)*t)).join(',')})`;
  }
  return 'rgb(248,169,124)';
}
/** Samples an actual function; orthographic 3D projection and depth ordering update on orbit. */
export function SurfaceDiagram({height, landmarks, axes=['w','b'], nonconvex=false, revision=0}:{height:(x:number,y:number)=>number;landmarks:Landmark[];axes?:string[];nonconvex?:boolean;revision?:number}) {
  const [view,setView]=useState({yaw:.65,pitch:1.02,zoom:1});
  const [selected,setSelected]=useState(0);
  const drag=useRef<{x:number;y:number;view:typeof view}|null>(null);
  const svg=useRef<SVGSVGElement>(null);
  useEffect(()=>{setSelected(0);if(nonconvex&&landmarks[0])setView({yaw:Math.atan2(landmarks[0].x,landmarks[0].y),pitch:1.12,zoom:1});},[revision,nonconvex]);
  const select=(index:number)=>{setSelected(index);const p=landmarks[index];if(nonconvex&&p)setView(v=>({...v,yaw:Math.atan2(p.x,p.y),pitch:1.12}));};
  useEffect(()=>{const el=svg.current;if(!el)return;const wheel=(e:WheelEvent)=>{e.preventDefault();setView(v=>({...v,zoom:Math.max(.75,Math.min(1.18,v.zoom-e.deltaY*.0005))}));};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);},[]);
  const mesh=useMemo(()=>{
    const n=42,range=nonconvex?1.35:1.55,grid:V[][]=[];let min=Infinity,max=-Infinity;
    for(let i=0;i<=n;i++){grid[i]=[];for(let j=0;j<=n;j++){const x=-range+2*range*i/n,y=-range+2*range*j/n,z=height(x,y);min=Math.min(min,z);max=Math.max(max,z);grid[i][j]={x,y,z};}}
    const faces=[];for(let i=0;i<n;i++)for(let j=0;j<n;j++)faces.push([grid[i][j],grid[i+1][j],grid[i+1][j+1],grid[i][j+1]]);
    const contours:V[][]=[];
    for(let l=1;l<=7;l++){const level=min+(max-min)*l/9;for(const face of faces){const crossings:V[]=[];for(let k=0;k<4;k++){const a=face[k],b=face[(k+1)%4];if((a.z<level)!==(b.z<level)){const t=(level-a.z)/(b.z-a.z);crossings.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y),z:min-(max-min)*.12});}}for(let k=0;k+1<crossings.length;k+=2)contours.push(crossings.slice(k,k+2));}}
    return {faces,contours,min,max};
  },[height,nonconvex]);
  const project=(p:V)=>{
    const u=p.x*Math.cos(view.yaw)-p.y*Math.sin(view.yaw),d=p.x*Math.sin(view.yaw)+p.y*Math.cos(view.yaw);
    const h=(p.z-mesh.min)/(mesh.max-mesh.min||1)*245;
    return {x:400+u*154*view.zoom,y:360+(d*154*Math.cos(view.pitch)-h*Math.sin(view.pitch))*view.zoom,depth:d*154*Math.sin(view.pitch)+h*Math.cos(view.pitch)};
  };
  const path=(points:V[])=>points.map((p,i)=>{const q=project(p);return `${i?'L':'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`;}).join(' ');
  const floor=mesh.min-(mesh.max-mesh.min)*.12;
  const base=[{x:-1.7,y:-1.7,z:floor},{x:1.7,y:-1.7,z:floor},{x:1.7,y:1.7,z:floor},{x:-1.7,y:1.7,z:floor}];
  const active=landmarks[selected]||landmarks[0];
  const tip=active?project({x:active.x,y:active.y,z:active.value}):null;
  const shown=landmarks.filter(p=>p.kind!=='maximum');
  return <div className="rl-surface-viewer" data-revision={revision} data-yaw={view.yaw} data-zoom={view.zoom} data-selected-kind={active?.kind}>
    <svg ref={svg} viewBox="0 0 800 540" className="rl-surface-svg" role="img" aria-label="三维损失曲面：拖动旋转，滚轮缩放" onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,view};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(d)setView({...d.view,yaw:d.view.yaw+(e.clientX-d.x)*.004,pitch:Math.max(.72,Math.min(1.3,d.view.pitch+(e.clientY-d.y)*.003))});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <path d={path(base)+'Z'} fill="#e9f3ff" fillOpacity=".75" stroke="#c5dafa" strokeWidth="1"/>
      {mesh.contours.map((c,i)=><path key={`c${i}`} d={path(c)} fill="none" stroke="#93bcf0" strokeWidth=".8" opacity=".6"/>)}
      {mesh.faces.map(f=>({f,depth:f.reduce((a,p)=>a+project(p).depth,0)/4})).sort((a,b)=>a.depth-b.depth).map(({f},i)=><path key={i} d={path(f)+'Z'} fill={color((f.reduce((a,p)=>a+p.z,0)/4-mesh.min)/(mesh.max-mesh.min||1))} stroke="rgba(48,103,168,.22)" strokeWidth=".55" strokeLinejoin="round"/>)}
      {shown.map((p,i)=>{const q=project({x:p.x,y:p.y,z:p.value});return <g key={i} role="button" tabIndex={0} aria-label={`选择${names[p.kind]}${i+1}`} onPointerDown={e=>e.stopPropagation()} onClick={()=>select(landmarks.indexOf(p))} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(landmarks.indexOf(p));}}} className="rl-surface-marker"><circle cx={q.x} cy={q.y} r={p===active?14:8} fill={colors[p.kind]} opacity={p===active?.23:1}/><circle cx={q.x} cy={q.y} r={p===active?8:6} fill={colors[p.kind]} stroke="white" strokeWidth="2"/><circle cx={q.x} cy={q.y} r="17" fill="transparent"/></g>;})}
      {tip&&active&&<foreignObject x={Math.max(5,Math.min(645,tip.x-75))} y={Math.max(4,tip.y-50)} width="150" height="42" pointerEvents="none"><div className="rl-surface-point-label" style={{color:colors[active.kind]}}><Typography variant="bodySmall" tone="inherit">{nonconvex?names[active.kind]:'最低点'}</Typography></div></foreignObject>}
      {[base.reduce((a,b)=>project(a).x>project(b).x?a:b),base.reduce((a,b)=>project(a).x<project(b).x?a:b)].map((p,i)=>{const q=project(p);return <foreignObject key={i} x={Math.max(0,Math.min(720,q.x-30))} y={Math.min(475,q.y+4)} width="70" height="52"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={axes[i]} /></MathFormulaBlock></foreignObject>;})}
    </svg>
    <div className="rl-surface-toolbar"><Typography variant="bodySmall" tone="muted">拖动旋转 · 滚轮缩放</Typography><Button onClick={()=>setView({yaw:nonconvex?Math.atan2(landmarks[0].x,landmarks[0].y):.65,pitch:nonconvex?1.12:1.02,zoom:1})}>复位视角</Button></div>
    {nonconvex&&<div className="rl-surface-legend">{(['global','local','saddle'] as const).map(kind=><Button key={kind} aria-pressed={active?.kind===kind} onClick={()=>select(landmarks.findIndex(p=>p.kind===kind))}><i className="rl-surface-swatch" style={{background:colors[kind]}}/>{names[kind]}</Button>)}</div>}
  </div>;
}
