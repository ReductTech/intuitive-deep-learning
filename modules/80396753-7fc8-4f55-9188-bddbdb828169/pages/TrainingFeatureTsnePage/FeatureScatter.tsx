import {useEffect,useRef,useState} from 'react';
import {Typography} from '../../../shared/react';
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
 return <div className="vfl-tsne-scatter"><svg viewBox="0 0 500 436" role="group" aria-label={title}>
  <rect x="1" y="1" width="498" height="434" rx="6" fill="#fff"/>
  {[86,172,258,344].map(v=><path key={v} d={`M12 ${v}H488`} stroke="#edf2f8"/>) }
  {[100,200,300,400].map(v=><path key={v} d={`M${v} 12V424`} stroke="#edf2f8"/>) }
  {shown.map((p,i)=>{const sample=samples[i];if(!sample)return null;const [cx,cy]=project(p,extent);return <circle key={sample.id} cx={cx} cy={cy} r={selected===sample.id?6.5:4.4} fill={digitColors[sample.label]} fillOpacity={(selected===null||selected===sample.id) ? .87 : .48} stroke={selected===sample.id?'#17365d':'#fff'} strokeWidth={selected===sample.id?2.3:.6} role="button" tabIndex={0} aria-label={`查看数字 ${sample.label}，样本 ${sample.id+1}`} onClick={()=>onSelect(sample.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(sample.id);}}}><title>{`数字 ${sample.label} · 样本 ${sample.id+1}`}</title></circle>;})}
 </svg>{!points.length&&<Typography className="vfl-tsne-empty" variant="bodySmall" tone="muted">等待训练数据…</Typography>}</div>;
}
