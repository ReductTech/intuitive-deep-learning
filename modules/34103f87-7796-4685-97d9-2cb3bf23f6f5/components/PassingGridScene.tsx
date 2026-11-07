import { useLayoutEffect, useRef, useState } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../shared/react';
import { moduleIdentity } from '../outlines.json';
import { deformableDemo, type DeformableTarget } from '../model/deformableDemo';
import './PassingGridScene.css';
export type PassingMode='full'|'window'|'shift'|'deform';
export const PASSING_IMAGE_SIZE=[1672,941] as const;
const [W,H]=PASSING_IMAGE_SIZE;const asset=moduleAssetUrl(moduleIdentity.id,'observation/passing-poster.png');
export const passingWindowOrigin=(target:DeformableTarget,shift=false)=>{const c=deformableDemo(target).cell;return shift?[Math.floor((c[0]-1)/2)*2+1,Math.floor((c[1]-1)/2)*2+1]:[Math.floor(c[0]/2)*2,Math.floor(c[1]/2)*2];};
export function PassingGridScene({mode,target='black-ball',selected=0,onTarget,onSelect}:{mode:PassingMode;target?:DeformableTarget;selected?:number;onTarget?:(t:DeformableTarget)=>void;onSelect?:(i:number)=>void}){
 const outer=useRef<HTMLDivElement>(null);const [size,setSize]=useState([0,0]);const [loaded,setLoaded]=useState(false);const [failed,setFailed]=useState(false);const [attempt,setAttempt]=useState(0);const data=deformableDemo(target);const p=data.reference;const window=passingWindowOrigin(target,mode==='shift');
 useLayoutEffect(()=>{const el=outer.current;if(!el)return;const measure=()=>{const width=Math.max(0,Math.min(el.clientWidth,el.clientHeight*W/H));setSize(old=>Math.abs(old[0]-width)>.1?[width,width*H/W]:old);};const observer=new ResizeObserver(measure);observer.observe(el);measure();return()=>observer.disconnect();},[]);
 const points=mode==='deform'?data.samples:mode==='full'?Array.from({length:60},(_,i)=>[(i%10+.5)/10,(Math.floor(i/10)+.5)/6]):Array.from({length:4},(_,i)=>[(window[0]+i%2+.5)/10,(window[1]+Math.floor(i/2)+.5)/6]);
 const ready=size[0]>0&&(loaded||failed);
 return <div ref={outer} className="attn-passing-scene" role="group" aria-label="体育馆传球画面的空间读取示意" data-capture-ready={ready} aria-busy={!ready} data-passing-mode={mode} data-passing-target={target} data-reference={JSON.stringify(p)} data-sample-positions={JSON.stringify(data.samples)} data-sample-weights={JSON.stringify(data.weights)}>
  <div className="attn-passing-frame" style={{width:size[0],height:size[1]}}>
   <img key={attempt} src={attempt?asset+(asset.includes('?')?'&':'?')+'retry='+attempt:asset} alt="同一张体育馆画面：三名白衣队员、三名黑衣队员，两队各持一个橙色篮球。" draggable={false} onLoad={()=>{setLoaded(true);setFailed(false);}} onError={()=>setFailed(true)}/>
   {failed?<div className="attn-passing-error"><Typography variant="bodySmall">场景暂时无法加载。</Typography><Button onClick={()=>{setFailed(false);setLoaded(false);setAttempt(n=>n+1);}}>重新加载</Button></div>:loaded&&<>
    <svg className="attn-passing-overlay" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
     {Array.from({length:9},(_,i)=><line key={'x'+i} x1={(i+1)*W/10} x2={(i+1)*W/10} y1={0} y2={H} className="attn-passing-grid"/>)}
     {Array.from({length:5},(_,i)=><line key={'y'+i} x1={0} x2={W} y1={(i+1)*H/6} y2={(i+1)*H/6} className="attn-passing-grid"/>)}
     {(mode==='window'||mode==='shift')&&<><rect data-window-origin={JSON.stringify(window)} x={window[0]*W/10} y={window[1]*H/6} width={2*W/10} height={2*H/6} className="attn-passing-window"/>{Array.from({length:mode==='shift'?5:4},(_,i)=><line key={i} x1={(mode==='shift'?1+2*i:2+2*i)*W/10} x2={(mode==='shift'?1+2*i:2+2*i)*W/10} y1={0} y2={H} className="attn-passing-partition"/>)}{Array.from({length:mode==='shift'?3:2},(_,i)=><line key={'p'+i} x1={0} x2={W} y1={(mode==='shift'?1+2*i:2+2*i)*H/6} y2={(mode==='shift'?1+2*i:2+2*i)*H/6} className="attn-passing-partition"/>)}</>}
     <rect data-query-cell x={data.cell[0]*W/10} y={data.cell[1]*H/6} width={W/10} height={H/6} className="attn-passing-query-cell"/>
     {points.map(([x,y],i)=><g key={i}><line data-passing-ray x1={p[0]*W} y1={p[1]*H} x2={x*W} y2={y*H} stroke="var(--ui-accent)" opacity={mode==='full'?.3:.8} strokeWidth={mode==='deform'?3+10*data.weights[i]:2.5}/><circle data-passing-point={i} data-x={x} data-y={y} cx={x*W} cy={y*H} r={mode==='full'?6:11} fill="var(--ui-accent)" stroke="var(--ui-bg-card)" strokeWidth={2}/></g>)}
     <path data-query-marker d={`M${p[0]*W} ${p[1]*H-22}l22 22 -22 22 -22 -22Z`} fill="var(--ui-accent)" stroke="var(--ui-bg-card)" strokeWidth={3}/>
     <foreignObject x={p[0]*W-20} y={p[1]*H-19} width={40} height={40}><Typography variant="bodySmall" tone="light" align="center">Q</Typography></foreignObject>
    </svg>
    {onTarget&&(['white-ball','black-ball'] as const).map(t=>{const d=deformableDemo(t);return <Button key={t} className="attn-passing-target" active={t===target} aria-pressed={t===target} aria-label={(t==='white-ball'?'白衣队':'黑衣队')+'持球处格点'} onClick={()=>onTarget(t)} style={{left:`${d.reference[0]*100}%`,top:`${d.reference[1]*100}%`,width:'10%',height:`${100/6}%`}}/>;})}
    {mode==='deform'&&points.map(([x,y],i)=>onSelect?<Button key={i} className="attn-passing-sample" active={selected===i} aria-pressed={selected===i} aria-label={'采样点 '+(i+1)} onClick={()=>onSelect(i)} style={{left:`${x*100}%`,top:`${y*100}%`}}><Typography as="span" variant="bodySmall" tone="inherit">{i+1}</Typography></Button>:<Typography as="span" key={i} className="attn-passing-sample-label" variant="bodySmall" tone="light" align="center" style={{left:`${x*100}%`,top:`${y*100}%`}}>{i+1}</Typography>)}
   </>}
  </div>
 </div>;
}
