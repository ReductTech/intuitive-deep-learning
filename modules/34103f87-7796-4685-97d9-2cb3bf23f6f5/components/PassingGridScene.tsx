import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useLayoutEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../outlines.json';
import { deformableDemo, type DeformableTarget } from '../model/deformableDemo';
import './PassingGridScene.css';
export type PassingMode='full'|'window'|'shift'|'deform';
export const PASSING_IMAGE_SIZE=[1672,941] as const;
const [W,H]=PASSING_IMAGE_SIZE;const asset=moduleAssetUrl("observation/passing-poster.webp");
export const passingWindowOrigin=(target:DeformableTarget,shift=false)=>{const c=deformableDemo(target).cell;return shift?[Math.floor((c[0]-1)/2)*2+1,Math.floor((c[1]-1)/2)*2+1]:[Math.floor(c[0]/2)*2,Math.floor(c[1]/2)*2];};
export function PassingGridScene({mode,target='black-ball',selected=0,onTarget,onSelect}:{mode:PassingMode;target?:DeformableTarget;selected?:number;onTarget?:(t:DeformableTarget)=>void;onSelect?:(i:number)=>void}){
 const outer=useRef<HTMLDivElement>(null);const [size,setSize]=useState([0,0]);const [loaded,setLoaded]=useState(false);const [failed,setFailed]=useState(false);const [attempt,setAttempt]=useState(0);const data=deformableDemo(target);const p=data.reference;const window=passingWindowOrigin(target,mode==='shift');
 useLayoutEffect(()=>{const el=outer.current;if(!el)return;const measure=()=>{const width=Math.max(0,Math.min(el.clientWidth,el.clientHeight*W/H));setSize(old=>Math.abs(old[0]-width)>.1?[width,width*H/W]:old);};const observer=new ResizeObserver(measure);observer.observe(el);measure();return()=>observer.disconnect();},[]);
 const points=mode==='deform'?data.samples:mode==='full'?Array.from({length:60},(_,i)=>[(i%10+.5)/10,(Math.floor(i/10)+.5)/6]):Array.from({length:4},(_,i)=>[(window[0]+i%2+.5)/10,(window[1]+Math.floor(i/2)+.5)/6]);
 const ready=size[0]>0&&(loaded||failed);
 return <div shuku-edit-id="e-b40a24e5-6e86-4b6f-a7c1-38a2af836cd8" ref={outer} className="attn-passing-scene" role="group" aria-label="体育馆传球画面的空间读取示意" data-capture-ready={ready} aria-busy={!ready} data-passing-mode={mode} data-passing-target={target} data-reference={JSON.stringify(p)} data-sample-positions={JSON.stringify(data.samples)} data-sample-weights={JSON.stringify(data.weights)}>
  <div shuku-edit-id="e-c610a477-45c7-43a6-8be4-99f7a292ef34" className="attn-passing-frame" style={{width:size[0],height:size[1]}}>
   <img shuku-edit-id="e-acc52dcc-ae01-4881-bd87-ff1e02b9c973" key={attempt} src={attempt?asset+(asset.includes('?')?'&':'?')+'retry='+attempt:asset} alt="同一张体育馆画面：三名白衣队员、三名黑衣队员，两队各持一个橙色篮球。" draggable={false} onLoad={()=>{setLoaded(true);setFailed(false);}} onError={()=>setFailed(true)}/>
   {failed?<div shuku-edit-id="e-705c0fef-1d7e-4326-b63b-90439dea7444" className="attn-passing-error"><Typography shuku-edit-id="e-74d14b5f-23de-454f-a1d3-b8516b1de0d6" variant="bodySmall">场景暂时无法加载。</Typography><Button onClick={()=>{setFailed(false);setLoaded(false);setAttempt(n=>n+1);}}>重新加载</Button></div>:loaded&&<>
    <svg shuku-edit-id="e-8150d10d-9153-40d5-a02c-ee76552c48e4" className="attn-passing-overlay" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
     {Array.from({length:9},(_,i)=><line shuku-edit-id="e-0b2c1e0b-6e1c-4aca-b5e2-6dee22eaca5b" key={'x'+i} x1={(i+1)*W/10} x2={(i+1)*W/10} y1={0} y2={H} className="attn-passing-grid"/>)}
     {Array.from({length:5},(_,i)=><line shuku-edit-id="e-4fe3766d-a8f0-471b-80e4-ef3e0176bf75" key={'y'+i} x1={0} x2={W} y1={(i+1)*H/6} y2={(i+1)*H/6} className="attn-passing-grid"/>)}
     {(mode==='window'||mode==='shift')&&<><rect shuku-edit-id="e-63e111e6-dcde-4eab-aa96-a6dd17b904f2" data-window-origin={JSON.stringify(window)} x={window[0]*W/10} y={window[1]*H/6} width={2*W/10} height={2*H/6} className="attn-passing-window"/>{Array.from({length:mode==='shift'?5:4},(_,i)=><line shuku-edit-id="e-06d0bfbf-89c0-4586-a37a-496370e7d5da" key={i} x1={(mode==='shift'?1+2*i:2+2*i)*W/10} x2={(mode==='shift'?1+2*i:2+2*i)*W/10} y1={0} y2={H} className="attn-passing-partition"/>)}{Array.from({length:mode==='shift'?3:2},(_,i)=><line shuku-edit-id="e-255e6549-baa1-4ddd-935f-4b2be2891a9e" key={'p'+i} x1={0} x2={W} y1={(mode==='shift'?1+2*i:2+2*i)*H/6} y2={(mode==='shift'?1+2*i:2+2*i)*H/6} className="attn-passing-partition"/>)}</>}
     <rect shuku-edit-id="e-cba2700c-83b7-4a84-91cc-a3edbd3e974a" data-query-cell x={data.cell[0]*W/10} y={data.cell[1]*H/6} width={W/10} height={H/6} className="attn-passing-query-cell"/>
     {points.map(([x,y],i)=><g shuku-edit-id="e-67078122-e2dd-4675-9dc1-c373cdb212b3" key={i}><line shuku-edit-id="e-d4f02e87-af25-4c8b-9cf5-53bf3d175f32" data-passing-ray x1={p[0]*W} y1={p[1]*H} x2={x*W} y2={y*H} stroke="var(--ui-accent)" opacity={mode==='full'?.3:.8} strokeWidth={mode==='deform'?3+10*data.weights[i]:2.5}/><circle shuku-edit-id="e-e4c625aa-68c7-43dd-a8ed-7c8d40e533d3" data-passing-point={i} data-x={x} data-y={y} cx={x*W} cy={y*H} r={mode==='full'?6:11} fill="var(--ui-accent)" stroke="var(--ui-bg-card)" strokeWidth={2}/></g>)}
     <path shuku-edit-id="e-9a7f575f-3baa-476d-88c6-fff7c6755fe6" data-query-marker d={`M${p[0]*W} ${p[1]*H-22}l22 22 -22 22 -22 -22Z`} fill="var(--ui-accent)" stroke="var(--ui-bg-card)" strokeWidth={3}/>
     <foreignObject shuku-edit-id="e-680a4400-64a9-4fef-bac5-72318662cca6" x={p[0]*W-20} y={p[1]*H-19} width={40} height={40}><Typography shuku-edit-id="e-15176624-ffb0-45ef-a5af-c4a183d5ee29" variant="bodySmall" tone="light" align="center">Q</Typography></foreignObject>
    </svg>
    {onTarget&&(['white-ball','black-ball'] as const).map(t=>{const d=deformableDemo(t);return <Button key={t} className="attn-passing-target" active={t===target} aria-pressed={t===target} aria-label={(t==='white-ball'?'白衣队':'黑衣队')+'持球处格点'} onClick={()=>onTarget(t)} style={{left:`${d.reference[0]*100}%`,top:`${d.reference[1]*100}%`,width:'10%',height:`${100/6}%`}}/>;})}
    {mode==='deform'&&points.map(([x,y],i)=>onSelect?<Button key={i} className="attn-passing-sample" active={selected===i} aria-pressed={selected===i} aria-label={'采样点 '+(i+1)} onClick={()=>onSelect(i)} style={{left:`${x*100}%`,top:`${y*100}%`}}><Typography shuku-edit-id="e-bdc67ce0-3ba4-4aa1-837e-05622e14129c" as="span" variant="bodySmall" tone="inherit">{i+1}</Typography></Button>:<Typography shuku-edit-id="e-2eaa25a5-22f1-4155-b0f1-95f8e76e93fb" as="span" key={i} className="attn-passing-sample-label" variant="bodySmall" tone="light" align="center" style={{left:`${x*100}%`,top:`${y*100}%`}}>{i+1}</Typography>)}
   </>}
  </div>
 </div>;
}
