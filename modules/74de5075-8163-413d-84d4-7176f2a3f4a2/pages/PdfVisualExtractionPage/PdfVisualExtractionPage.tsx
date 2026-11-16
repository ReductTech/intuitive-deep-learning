import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useId, useRef, useState, type CSSProperties } from 'react';
import { BrainCircuit } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './PdfVisualExtractionPage.css';
import { useClickSteps } from '../../components/useClickSteps';
const crops=[
 [60,1280,1009,340],[60,2820,1009,290],[60,4455,1009,380],
 [60,6050,1009,550],[60,7880,1009,680],[590,1280,479,340],
 [550,4455,519,380],[60,6050,490,350],[550,7880,519,420],
];


export function Figure({index}:{index:number}){
 const clipId=useId();
 const [x,y,w,h]=crops[index];
 return <div shuku-edit-id="e-cd46739a-4b3c-47b3-bbce-1302e5876b6f" className="rf-pve-figure" data-ppt-viewport="候选论文图表示例裁切" style={{aspectRatio:`${w}/${h}`}}><svg shuku-edit-id="e-a21e5f15-501c-476e-906c-6702b1d5e328" width="100%" height="100%" viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={`候选图表 ${index+1} 示例`}><defs shuku-edit-id="e-b9e852f6-b12d-4f13-bce6-86789ee539e4"><clipPath shuku-edit-id="e-26f61ab6-490b-4008-82d7-bf8c4d4a2b01" id={clipId}><rect shuku-edit-id="e-3c98fb73-519d-4aff-812d-bc23891fa882" x={x} y={y} width={w} height={h}/></clipPath></defs><image shuku-edit-id="e-68b4e4f9-1a10-4938-9716-de2c31d9ff33" clipPath={`url(#${clipId})`} href={moduleAssetUrl('research-foundation/images/recommendation-app/feed-reference.jpg')} width="1129" height="9064"/></svg></div>;
}
export function Lines(){return <div shuku-edit-id="e-0c9ef6b5-8e62-4768-bee5-d4cc815eab8a" className="rf-pve-lines" aria-hidden="true"><i shuku-edit-id="e-0ddd8991-cac1-40c1-9345-ac8ddf236478"/><i shuku-edit-id="e-99776d5d-680f-4378-acdc-cf2395d94f6d"/><i shuku-edit-id="e-2c802b15-f4e7-41ac-835d-ff590f6fc7be"/><i shuku-edit-id="e-b8eb8818-b462-4b9d-9de2-1d769c574890"/></div>}
const fields=['正文与章节','作者与机构','关键词','文章总结'];
/** Local explanatory animation; no OCR or database request is made. */
export function PdfVisualExtractionPage({onComplete}:{onComplete?:()=>void}){
 const root=useRef<HTMLElement>(null);
 const [phase,setPhase]=useState(0);
 const [delays]=useState(()=>{
  const order=[0,1,2,3,4];
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  return order.map(n=>n*140);
 });
 useClickSteps(root, async animation => {
  if(phase===5){onComplete?.();return;}
  if(phase===1){
   setPhase(2);await animation.wait(500);
   setPhase(3);await animation.wait(1000);return;
  }
  if(phase===3){
   setPhase(4);await animation.wait(1700);
   setPhase(5);await animation.wait(900);return;
  }
  setPhase(phase+1);
  await animation.wait(850);
 });
 const boxStyle=(i:number)=>({'--rf-box-delay':`${delays[i]}ms`} as CSSProperties);
 return <ContentBlock shuku-edit-id="e-79048e2a-bd48-4970-9a0c-bd1cca84990d" ref={root} className="rf-foundation-titled" headingLevel={1} title={outline.pages.find(page=>page.id==='2c29b4b8-4039-45ed-9d2a-a780654b131c')!.title} bodyClassName="rf-foundation-titled-body">
 <div shuku-edit-id="e-ad5708e1-57ca-4a98-a7bb-e530537ee720" className="rf-foundation-full-scene">
 <section shuku-edit-id="e-cdca2d51-7517-4a62-96fd-fbbe360fe978" className={`rf-page rf-pve rf-pve-video rf-recording-demo phase-${phase} ${phase>=1?'boxes-on':''}`} data-phase={phase} aria-label="点击或按空格，逐步演示论文识别、模型分析和持久化入库">
  <div shuku-edit-id="e-7726a16e-21c3-4cb0-8819-8a3c9ff56738" className="rf-pve-document">
   <Typography shuku-edit-id="e-f876453e-7e1e-40c9-a222-9307488ca5c7" variant="body" className="rf-pve-paper-name">研究论文</Typography>
   <div shuku-edit-id="e-dc930e7e-3bd4-4063-8374-5abb3b40c48a" className="rf-pve-region title" style={boxStyle(0)}><Lines/><Typography shuku-edit-id="e-ec261375-7d79-4ac8-9f05-95645a23cbe7" as="span" variant="body">标题</Typography></div>
   <div shuku-edit-id="e-aa57a48e-7003-42eb-8069-cd7aa5b97454" className="rf-pve-region author" style={boxStyle(1)}><Lines/><Typography shuku-edit-id="e-4c770163-991d-48c9-9ed6-602267806f13" as="span" variant="body">机构</Typography></div>
   <div shuku-edit-id="e-5ffd9683-fcaa-4fde-af88-8747a02041a2" className="rf-pve-paper-columns"><div shuku-edit-id="e-c148b30e-c2f8-4cd8-b5ec-00e79d0369a8" className="rf-pve-region text" style={boxStyle(2)}><Lines/><Lines/><Lines/><Lines/><Typography shuku-edit-id="e-93ac1984-649c-4a13-ab65-e350ed79c140" as="span" variant="body">正文</Typography></div><div shuku-edit-id="e-92cc5d25-7aa8-4064-8b92-1af681e39f5c" className="rf-pve-paper-figures rf-pve-region figure" style={boxStyle(3)}><Figure index={2}/><Figure index={5}/><Typography shuku-edit-id="e-659f39cc-c6b9-4b34-bd96-e361bce7523f" as="span" variant="body">图表</Typography></div></div>
   <div shuku-edit-id="e-20debd8b-b5d7-415a-b105-18a14a866acc" className="rf-pve-paper-bottom rf-pve-region" style={boxStyle(4)}><Lines/><Lines/><Lines/><Typography shuku-edit-id="e-8e10e237-df0c-4d06-9046-b57ae8a4d61c" as="span" variant="body">正文</Typography></div>
  </div>
  {phase>=2&&<><svg shuku-edit-id="e-177e6a9c-ac6c-4f8a-9e5b-ca91a4be09f7" className="rf-pve-model-input" viewBox="0 0 1600 900" aria-hidden="true"><path shuku-edit-id="e-726d73e8-3089-44ab-a6ad-9b9369f78c52" d="M545 450 C565 450,575 450,595 450"/></svg><section shuku-edit-id="e-97e30d2d-a13f-4570-8f1f-1e19b3129d9a" className="rf-pve-model-layer"><BrainCircuit size={66} strokeWidth={1.4}/><Typography shuku-edit-id="e-85045dda-a44a-4ad3-a2ea-179f627c50a1" variant="body" align="center">多模态<br shuku-edit-id="e-8645fd47-f341-476f-ae9b-757975fc1d58"/>大模型分析</Typography></section></>}
  {phase>=3&&<><svg shuku-edit-id="e-4a2dbad4-6611-4f8b-8b7f-024440ddc050" className="rf-pve-streams" viewBox="0 0 1600 900" aria-hidden="true"><defs shuku-edit-id="e-de9fe25a-82b9-45fd-aaf9-88f72cb9aac4"><marker shuku-edit-id="e-4fbc5e26-75b5-489a-9607-ba65c083e664" id="rf-pve-flow-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-e1c8ea9e-c5ff-440e-a611-5abb13b3b79d" d="M0 0L8 4L0 8" fill="#69a6df"/></marker></defs>{[237,407,577,747].map((y,i)=><g shuku-edit-id="e-ff53b62d-8935-4942-8010-70f5249da1bf" key={y}><path shuku-edit-id="e-d8d5baf3-ddc9-4714-965a-7035ea1bbfa5" d={`M755 450 C770 450,765 ${y},790 ${y}`}/>{phase>=4&&<path shuku-edit-id="e-43ba8408-1de0-41a3-8f06-54e0ff665f76" className="to-record" d={`M1020 ${y} C1050 ${y},1060 ${298.5+i*125},1110 ${298.5+i*125}`} markerEnd="url(#rf-pve-flow-tip)"/>}<circle shuku-edit-id="e-c078d22c-b859-47d3-a8ff-51cd1e0abfb3" r="4" className="rf-pve-particle"><animateMotion shuku-edit-id="e-f80afe7b-e4c6-48f1-973c-5dc1088d5d6a" dur=".8s" repeatCount="1" fill="freeze" path={`M755 450 C770 450,765 ${y},790 ${y}`}/></circle></g>)}</svg>
  <div shuku-edit-id="e-97c90274-3063-4128-a5b9-768d555dc770" className="rf-pve-fragments">{fields.map((field,i)=><div shuku-edit-id="e-0d2ee128-1ef7-4c46-b572-1e0a0c434eb1" className="rf-pve-fragment" key={field}><Typography shuku-edit-id="e-de0f5340-b318-4b11-9b0f-6fb94de6f3b3" variant="body">{field}</Typography><div shuku-edit-id="e-1ec64a9e-2cab-4ccc-88ed-91db6fd3b488" className="rf-pve-fragment-paper">{i===2?<div shuku-edit-id="e-76859dff-d11f-46a2-a2ee-cc145ff72d7b" className="rf-pve-keywords"><i shuku-edit-id="e-b372838a-5fdf-4525-b4df-029ad68122c6"/><i shuku-edit-id="e-1fba542a-d6e5-40cd-a0d0-4c2af73493b7"/><i shuku-edit-id="e-f72c8af2-80af-455d-878e-8b09c7aada68"/></div>:<Lines/>}</div></div>)}</div></>}
  {phase>=4&&<section shuku-edit-id="e-0dadd66b-c627-4ed6-9ae7-05dc87e86af4" className="rf-pve-record" aria-label="结构化记录"><Typography shuku-edit-id="e-c14196b7-d7b6-409e-9a78-8ad97b6636e6" variant="h3">结构化记录</Typography><div shuku-edit-id="e-b730f591-e467-45af-92c6-50cbce01da9e" className="rf-pve-record-rows">{fields.map((field,i)=><div shuku-edit-id="e-374f40d4-6567-4051-9ded-8508804a9d93" className="rf-pve-record-row" key={field} style={{animationDelay:`${i*350}ms`}}><i shuku-edit-id="e-232b6056-c79a-4163-bd22-bf7825df82b6"/><Typography shuku-edit-id="e-82961c1e-5cdb-4b6f-8fe4-6359b123dc78" variant="body">{field}</Typography><div shuku-edit-id="e-25a2f4b8-9015-4d7a-93b4-2e8509fd5160">{i===2?<div shuku-edit-id="e-8e76700b-8bc7-4a69-a2ee-4454c50c689a" className="rf-pve-keywords"><i shuku-edit-id="e-cede750d-0c52-4421-91f5-78eeb3793d18"/><i shuku-edit-id="e-a1d7c474-7014-412c-9e8c-b65f456d4fdf"/><i shuku-edit-id="e-1c7d5062-9468-4154-9fed-65cc0d18dfef"/></div>:<Lines/>}</div></div>)}</div>{phase>=5&&<div shuku-edit-id="e-a7e152ff-bd31-4d47-afee-a9f33107a2eb" className="rf-pve-stamp" role="status"><Typography shuku-edit-id="e-d3f25077-18d3-49d0-a965-6651edb3847a" variant="body" tone="inherit">持久化入库</Typography></div>}</section>}
 </section>
 </div>
 </ContentBlock>;
}
