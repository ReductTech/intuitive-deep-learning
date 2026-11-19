import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { BrainCircuit } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './PdfVisualExtractionPage.css';
import { useRecordingDemo } from '../../components/RecordingDemo';
const crops=[
 [60,1280,1009,340],[60,2820,1009,290],[60,4455,1009,380],
 [60,6050,1009,550],[60,7880,1009,680],[590,1280,479,340],
 [550,4455,519,380],[60,6050,490,350],[550,7880,519,420],
];


export function Figure({index}:{index:number}){
 const clipId=useId();
 const [x,y,w,h]=crops[index];
 return <div shuku-edit-id="e-c21bf458-8c02-44de-a399-dac791f7e49d" className="rf-pve-figure" data-ppt-viewport="候选论文图表示例裁切" style={{aspectRatio:`${w}/${h}`}}><svg shuku-edit-id="e-14b5feae-18cf-48bc-87c5-20fa1b906d15" width="100%" height="100%" viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={`候选图表 ${index+1} 示例`}><defs shuku-edit-id="e-226839a4-4f97-4d54-adce-a38b133f20ca"><clipPath shuku-edit-id="e-5ee8e11a-bd6f-4781-ba7b-671a7a4171fb" id={clipId}><rect shuku-edit-id="e-40a8b518-e1b9-499c-bac1-505249904eab" x={x} y={y} width={w} height={h}/></clipPath></defs><image shuku-edit-id="e-7c97ee70-e2fa-4dde-83cb-a66469cfe0c1" clipPath={`url(#${clipId})`} href={moduleAssetUrl("images/recommendation-app/feed-reference.webp")} width="1129" height="9064"/></svg></div>;
}
export function Lines(){return <div shuku-edit-id="e-add4d535-24f6-4bcb-b56f-27a6ef5654a7" className="rf-pve-lines" aria-hidden="true"><i shuku-edit-id="e-431cd066-8ccc-4dbf-81b3-3d0383bc114f"/><i shuku-edit-id="e-1df4eadc-a4bd-42ff-a433-d943d1a4b2aa"/><i shuku-edit-id="e-f6b46938-c05d-42e8-b047-071c27b6ae55"/><i shuku-edit-id="e-58937ec0-1d08-43a1-8f6f-7fa0a67a34de"/></div>}
const fields=['正文与章节','作者与机构','关键词','文章总结'];
/** Local explanatory animation; no OCR or database request is made. */
export function PdfVisualExtractionPage({onComplete}:{onComplete?:()=>void}){
 const root=useRef<HTMLElement>(null);
 const [phase,setPhase]=useState(()=>typeof window!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches?5:0),locked=useRef(false),timer=useRef<number|undefined>(undefined);
 const [delays]=useState(()=>{
  const order=[0,1,2,3,4];
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  return order.map(n=>n*140);
 });
 useEffect(()=>()=>window.clearTimeout(timer.current),[]);
 useRecordingDemo(root,async demo=>{
  setPhase(0);await demo.wait(1000);
  setPhase(1);await demo.wait(1300);
  setPhase(2);await demo.wait(1100);
  setPhase(3);await demo.wait(1400);
  setPhase(4);await demo.wait(1900);
  setPhase(5);await demo.wait(1700);
  onComplete?.();
 });
 function advance(){
  if(locked.current)return;
  if(phase===5){onComplete?.();return}
  locked.current=true;
  setPhase(phase+1);
  timer.current=window.setTimeout(()=>{locked.current=false},phase===3?1700:850);
 }
 const boxStyle=(i:number)=>({'--rf-box-delay':`${delays[i]}ms`} as CSSProperties);
 return <section shuku-edit-id="e-cf6a9e0a-96df-42c8-8cee-d5277ad0d475" ref={root} className={`rf-page rf-pve rf-pve-video rf-recording-demo phase-${phase} ${phase>=1?'boxes-on':''}`} data-phase={phase} onClick={event=>{if(event.button===0){event.stopPropagation();advance()}}} aria-label="自动演示论文识别、模型分析和持久化入库，点击可接管并逐步推进">
  <div shuku-edit-id="e-1b7d9351-e097-4ae1-88af-e76950e55c19" className="rf-pve-document">
   <Typography shuku-edit-id="e-20cea4de-0a4e-4c4f-8232-86e1a033d2fa" variant="body" className="rf-pve-paper-name">研究论文</Typography>
   <div shuku-edit-id="e-ad615498-bb35-42f4-a331-450f21530f2e" className="rf-pve-region title" style={boxStyle(0)}><Lines/><Typography shuku-edit-id="e-54f2225b-3563-4f8c-9156-2df5d487c187" as="span" variant="body">标题</Typography></div>
   <div shuku-edit-id="e-54772fa4-4f3d-44c0-8f38-34adb0ae829e" className="rf-pve-region author" style={boxStyle(1)}><Lines/><Typography shuku-edit-id="e-98d0fda1-1068-4b1d-805c-66c0c1a3cd7b" as="span" variant="body">机构</Typography></div>
   <div shuku-edit-id="e-87c1cff8-fd55-4a30-a95b-7bdbb911e294" className="rf-pve-paper-columns"><div shuku-edit-id="e-2fb43ea8-12f9-45fc-8583-09893a97ba76" className="rf-pve-region text" style={boxStyle(2)}><Lines/><Lines/><Lines/><Lines/><Typography shuku-edit-id="e-97ed27ff-53bc-4be2-8203-15ec9fd31090" as="span" variant="body">正文</Typography></div><div shuku-edit-id="e-5ed35d53-f914-4e59-bafd-2a92f2d8a145" className="rf-pve-paper-figures rf-pve-region figure" style={boxStyle(3)}><Figure index={2}/><Figure index={5}/><Typography shuku-edit-id="e-37c86cb4-8622-4762-9360-4e01f1a2ec01" as="span" variant="body">图表</Typography></div></div>
   <div shuku-edit-id="e-cd8f238f-cf5b-40d6-a241-11ef5e30e51a" className="rf-pve-paper-bottom rf-pve-region" style={boxStyle(4)}><Lines/><Lines/><Lines/><Typography shuku-edit-id="e-cbfb41c3-7ec4-4209-90ce-cd7f55cc0570" as="span" variant="body">正文</Typography></div>
  </div>
  {phase>=2&&<><svg shuku-edit-id="e-73d6d843-d40f-4c54-91b8-2ebd1aa10285" className="rf-pve-model-input" viewBox="0 0 1600 900" aria-hidden="true"><path shuku-edit-id="e-3c750a87-154f-4262-9dff-61ed4711ee90" d="M545 450 C565 450,575 450,595 450"/></svg><section shuku-edit-id="e-4d2082cb-61c7-40d6-bb55-a09d2ab53cd4" className="rf-pve-model-layer"><BrainCircuit size={66} strokeWidth={1.4}/><Typography shuku-edit-id="e-6475ad00-6ae8-49c9-8116-0a78d1b0282f" variant="body" align="center">多模态<br shuku-edit-id="e-ff6fbb30-9cfb-4894-b425-e4852bdcdc41"/>大模型分析</Typography></section></>}
  {phase>=3&&<><svg shuku-edit-id="e-17698963-0180-4b4b-be7f-54029054aaf6" className="rf-pve-streams" viewBox="0 0 1600 900" aria-hidden="true"><defs shuku-edit-id="e-6da6af91-ca7f-4580-8c5f-1c7de2a67667"><marker shuku-edit-id="e-ebbe9f3d-e27f-489c-90e9-dfa06b861ec0" id="rf-pve-flow-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-87e5e37d-a0ad-4648-8d87-e15f81bd645b" d="M0 0L8 4L0 8" fill="#69a6df"/></marker></defs>{[237,407,577,747].map((y,i)=><g shuku-edit-id="e-b306f40b-bb98-4565-9ff6-c5f9bd797168" key={y}><path shuku-edit-id="e-099627e8-68e1-4702-8029-d9e5f3c1e010" d={`M755 450 C770 450,765 ${y},790 ${y}`}/>{phase>=4&&<path shuku-edit-id="e-1d4e7885-923f-42fe-a558-5cf8283bbe51" className="to-record" d={`M1020 ${y} C1050 ${y},1060 ${298.5+i*125},1110 ${298.5+i*125}`} markerEnd="url(#rf-pve-flow-tip)"/>}<circle shuku-edit-id="e-7d652abe-f0c5-4f2b-af65-f67f65d84404" r="4" className="rf-pve-particle"><animateMotion shuku-edit-id="e-c25a0702-6247-4b1b-a4cd-7c3b3834413c" dur=".8s" repeatCount="1" fill="freeze" path={`M755 450 C770 450,765 ${y},790 ${y}`}/></circle></g>)}</svg>
  <div shuku-edit-id="e-ce2492b8-b58c-4ed7-a280-6bcaba0a1f4a" className="rf-pve-fragments">{fields.map((field,i)=><div shuku-edit-id="e-d848fe52-5a48-4528-8935-10020d572fdd" className="rf-pve-fragment" key={field}><Typography shuku-edit-id="e-d8c592ac-6cd0-4e53-a293-ecb0963cde98" variant="body">{field}</Typography><div shuku-edit-id="e-a59c38d0-25e1-4adf-945a-64e3e8d3b44e" className="rf-pve-fragment-paper">{i===2?<div shuku-edit-id="e-74a5225b-9c79-441d-a91d-f171df9090af" className="rf-pve-keywords"><i shuku-edit-id="e-0bb359bf-7bca-4214-9948-2d05e5d889e0"/><i shuku-edit-id="e-6680e1bf-f432-486c-8be5-c67adb26f637"/><i shuku-edit-id="e-a49d6440-e29e-49cb-a8ac-b8f45d48a89a"/></div>:<Lines/>}</div></div>)}</div></>}
  {phase>=4&&<section shuku-edit-id="e-262f7f4b-a96e-4a8f-806c-3e550c4f51c1" className="rf-pve-record" aria-label="结构化记录"><Typography shuku-edit-id="e-20ef4707-4a9e-4e8b-87b4-6ddde83376bd" variant="h3">结构化记录</Typography><div shuku-edit-id="e-b307017b-8708-4154-9f1c-aa35322dc15f" className="rf-pve-record-rows">{fields.map((field,i)=><div shuku-edit-id="e-48bc5dc1-e178-49d5-a6ad-8258820ec09e" className="rf-pve-record-row" key={field} style={{animationDelay:`${i*350}ms`}}><i shuku-edit-id="e-9d70225f-afad-40db-8e81-e7382095346e"/><Typography shuku-edit-id="e-fbc9eeea-dbe6-4acf-b74a-4b43fd3f2efd" variant="body">{field}</Typography><div shuku-edit-id="e-ca1637ca-c54a-487b-b31d-0dbe99b604c2">{i===2?<div shuku-edit-id="e-fe7a9f0c-2fd7-4003-a920-a4181f5a6355" className="rf-pve-keywords"><i shuku-edit-id="e-7163bba7-5c0b-438c-9890-8e8d3d4c026d"/><i shuku-edit-id="e-83c4ef14-707d-41a6-8109-2e27943e2850"/><i shuku-edit-id="e-9c4e0bfa-5477-4192-a3ee-e18826cd8310"/></div>:<Lines/>}</div></div>)}</div>{phase>=5&&<div shuku-edit-id="e-9db82bb6-7d22-4135-aa2e-33eb454a645d" className="rf-pve-stamp" role="status"><Typography shuku-edit-id="e-5dfef9e2-945b-41c7-9847-203294d23e93" variant="body" tone="inherit">持久化入库</Typography></div>}</section>}
 </section>;
}
