import {useEffect,useRef,useState} from 'react';
import { Typography } from "@shuku/course-style/react";
import type {ProjectionSample} from '../../services/digitNetworkTraining';

export const digitColors=['#4388db','#ed9845','#65b66d','#e45f69','#9b72c8','#9c725c','#786ace','#ec85aa','#bfab35','#39adb4'];
const project=(point:number[],extent:number)=>[250+point[0]*200/extent,218-point[1]*200/extent];

/** Interpolation is only a presentation transition between measured checkpoints. */
export function FeatureScatter({points,samples,selected,onSelect,animate=false,title,extent}:{points:number[][];samples:ProjectionSample[];selected:number|null;onSelect:(id:number)=>void;animate?:boolean;title:string;extent:number}){
 const [shown,setShown]=useState(points),current=useRef(points);
 useEffect(()=>{
  let frame=0;const start=performance.now(),from=current.current;
  if(!animate||from.length!==points.length){current.current=points;setShown(points);return;}
  const tick=(now:number)=>{const t=Math.min(1,(now-start)/1200),e=t*t*(3-2*t);const next=points.map((p,i)=>[from[i][0]+(p[0]-from[i][0])*e,from[i][1]+(p[1]-from[i][1])*e]);current.current=next;setShown(next);if(t<1)frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[points,animate]);
 return <div shuku-edit-id="e-cabb3bfd-6d49-4b7f-98d8-d27e6d1484ad" className="vfl-tsne-scatter"><svg shuku-edit-id="e-2108e17c-b8e2-439a-85c8-660893945a0f" viewBox="0 0 500 436" role="group" aria-label={title}>
  <rect shuku-edit-id="e-5b471bda-288e-4de6-b70f-5a714916233f" x="1" y="1" width="498" height="434" rx="6" fill="#fff"/>
  {[86,172,258,344].map(v=><path shuku-edit-id="e-b513aa17-819a-438a-b984-c0a79a0c92c0" key={v} d={`M12 ${v}H488`} stroke="#edf2f8"/>) }
  {[100,200,300,400].map(v=><path shuku-edit-id="e-a9c83c6f-3aea-4958-a876-b6fc0511f6a2" key={v} d={`M${v} 12V424`} stroke="#edf2f8"/>) }
  {shown.map((p,i)=>{const sample=samples[i];if(!sample)return null;const [cx,cy]=project(p,extent);return <circle shuku-edit-id="e-ee24da7a-e709-4286-bb1a-3da52606d775" key={sample.id} cx={cx} cy={cy} r={selected===sample.id?6.5:4.4} fill={digitColors[sample.label]} fillOpacity={(selected===null||selected===sample.id) ? .87 : .48} stroke={selected===sample.id?'#17365d':'#fff'} strokeWidth={selected===sample.id?2.3:.6} role="button" tabIndex={0} aria-label={`查看数字 ${sample.label}，样本 ${sample.id+1}`} onClick={()=>onSelect(sample.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(sample.id);}}}><title>{`数字 ${sample.label} · 样本 ${sample.id+1}`}</title></circle>;})}
 </svg>{!points.length&&<Typography shuku-edit-id="e-ad919863-2055-4175-9ca9-09d661b720eb" className="vfl-tsne-empty" variant="bodySmall" tone="muted">等待训练数据…</Typography>}</div>;
}
