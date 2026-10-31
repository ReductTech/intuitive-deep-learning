import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { BrainCircuit } from 'lucide-react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './PdfVisualExtractionPage.css';
const crops=[
 [60,1280,1009,340],[60,2820,1009,290],[60,4455,1009,380],
 [60,6050,1009,550],[60,7880,1009,680],[590,1280,479,340],
 [550,4455,519,380],[60,6050,490,350],[550,7880,519,420],
];


export function Figure({index}:{index:number}){
 const clipId=useId();
 const [x,y,w,h]=crops[index];
 return <div className="rf-pve-figure" data-ppt-viewport="候选论文图表示例裁切" style={{aspectRatio:`${w}/${h}`}}><svg width="100%" height="100%" viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={`候选图表 ${index+1} 示例`}><defs><clipPath id={clipId}><rect x={x} y={y} width={w} height={h}/></clipPath></defs><image clipPath={`url(#${clipId})`} href={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/feed-reference.jpg')} width="1129" height="9064"/></svg></div>;
}
export function Lines(){return <div className="rf-pve-lines" aria-hidden="true"><i/><i/><i/><i/></div>}
const fields=['正文与章节','作者与机构','关键词','文章总结'];
/** Local explanatory animation; no OCR or database request is made. */
export function PdfVisualExtractionPage({onComplete}:{onComplete?:()=>void}){
 const [phase,setPhase]=useState(0),locked=useRef(false),timer=useRef<number|undefined>(undefined);
 const [delays]=useState(()=>{
  const order=[0,1,2,3,4];
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  return order.map(n=>n*140);
 });
 useEffect(()=>()=>window.clearTimeout(timer.current),[]);
 function advance(){
  if(locked.current)return;
  if(phase===5){onComplete?.();return}
  locked.current=true;
  setPhase(phase+1);
  timer.current=window.setTimeout(()=>{locked.current=false},phase===3?1700:850);
 }
 const boxStyle=(i:number)=>({'--rf-box-delay':`${delays[i]}ms`} as CSSProperties);
 return <section className={`rf-page rf-pve rf-pve-video phase-${phase} ${phase>=1?'boxes-on':''}`} data-phase={phase} onClick={event=>{if(event.button===0){event.stopPropagation();advance()}}} aria-label="左键逐步演示论文识别、模型分析和持久化入库">
  <div className="rf-pve-document">
   <Typography variant="body" className="rf-pve-paper-name">研究论文</Typography>
   <div className="rf-pve-region title" style={boxStyle(0)}><Lines/><Typography as="span" variant="body">标题</Typography></div>
   <div className="rf-pve-region author" style={boxStyle(1)}><Lines/><Typography as="span" variant="body">机构</Typography></div>
   <div className="rf-pve-paper-columns"><div className="rf-pve-region text" style={boxStyle(2)}><Lines/><Lines/><Lines/><Lines/><Typography as="span" variant="body">正文</Typography></div><div className="rf-pve-paper-figures rf-pve-region figure" style={boxStyle(3)}><Figure index={2}/><Figure index={5}/><Typography as="span" variant="body">图表</Typography></div></div>
   <div className="rf-pve-paper-bottom rf-pve-region" style={boxStyle(4)}><Lines/><Lines/><Lines/><Typography as="span" variant="body">正文</Typography></div>
  </div>
  {phase>=2&&<><svg className="rf-pve-model-input" viewBox="0 0 1600 900" aria-hidden="true"><path d="M545 450 C565 450,575 450,595 450"/></svg><section className="rf-pve-model-layer"><BrainCircuit size={66} strokeWidth={1.4}/><Typography variant="body" align="center">多模态<br/>大模型分析</Typography></section></>}
  {phase>=3&&<><svg className="rf-pve-streams" viewBox="0 0 1600 900" aria-hidden="true"><defs><marker id="rf-pve-flow-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#69a6df"/></marker></defs>{[237,407,577,747].map((y,i)=><g key={y}><path d={`M755 450 C770 450,765 ${y},790 ${y}`}/>{phase>=4&&<path className="to-record" d={`M1020 ${y} C1050 ${y},1060 ${298.5+i*125},1110 ${298.5+i*125}`} markerEnd="url(#rf-pve-flow-tip)"/>}<circle r="4" className="rf-pve-particle"><animateMotion dur=".8s" repeatCount="1" fill="freeze" path={`M755 450 C770 450,765 ${y},790 ${y}`}/></circle></g>)}</svg>
  <div className="rf-pve-fragments">{fields.map((field,i)=><div className="rf-pve-fragment" key={field}><Typography variant="body">{field}</Typography><div className="rf-pve-fragment-paper">{i===2?<div className="rf-pve-keywords"><i/><i/><i/></div>:<Lines/>}</div></div>)}</div></>}
  {phase>=4&&<section className="rf-pve-record" aria-label="结构化记录"><Typography variant="h3">结构化记录</Typography><div className="rf-pve-record-rows">{fields.map((field,i)=><div className="rf-pve-record-row" key={field} style={{animationDelay:`${i*350}ms`}}><i/><Typography variant="body">{field}</Typography><div>{i===2?<div className="rf-pve-keywords"><i/><i/><i/></div>:<Lines/>}</div></div>)}</div>{phase>=5&&<div className="rf-pve-stamp" role="status"><Typography variant="body" tone="inherit">持久化入库</Typography></div>}</section>}
 </section>;
}
