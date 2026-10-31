import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, FileText, Image as ImageIcon, ListTree, Users } from 'lucide-react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './PdfVisualExtractionPage.css';

const crops=[
 [60,1280,1009,340],[60,2820,1009,290],[60,4455,1009,380],
 [60,6050,1009,550],[60,7880,1009,680],[590,1280,479,340],
 [550,4455,519,380],[60,6050,490,350],[550,7880,519,420],
];
const regions=[['标题',900],['作者与机构',1700],['正文',2600],['图表',3500],['正文',4400],['图表',5300]] as const;
function Figure({index}:{index:number}){
 const [x,y,w,h]=crops[index];
 return <div className="rf-pve-figure" data-ppt-viewport="候选论文图表示例裁切" style={{aspectRatio:`${w}/${h}`}}><img draggable={false} src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/feed-reference.jpg')} alt={`候选图表 ${index+1} 示例`} style={{width:`${1129/w*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/></div>;
}
function Lines(){return <div className="rf-pve-lines" aria-hidden="true"><i/><i/><i/><i/></div>}
/** Animation illustrates the supplied technique; it does not run OCR or rank real papers. */
export function PdfVisualExtractionPage(){
 const [elapsed,setElapsed]=useState(0),root=useRef<HTMLElement>(null),visible=useRef(true);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setElapsed(28000);return}
  const observer=new IntersectionObserver(([entry])=>{visible.current=entry.isIntersecting});
  if(root.current)observer.observe(root.current);
  let time=0,last=performance.now();
  const timer=window.setInterval(()=>{
   const now=performance.now();
   if(visible.current&&!document.hidden){time=Math.min(28000,time+Math.max(0,now-last));setElapsed(time)}
   last=now;
   if(time>=28000)clearInterval(timer);
  },100);
  return()=>{clearInterval(timer);observer.disconnect()};
 },[]);
 const phase=elapsed<7000?0:elapsed<19000?1:elapsed<25000?2:3;
 const scanning=phase===1?Math.min(8,Math.floor((elapsed-7800)/1050)):-1;
 const seen=regions.filter(([,at])=>elapsed>=at).length;
 return <ContentBlock ref={root} className={`rf-page rf-pve phase-${phase}`} title="从整篇 PDF 中，找到最有代表性的图表" data-phase={phase} data-boxes={seen}>
  <div className="rf-pve-scene">
   <section className="rf-pve-source"><Typography variant="bodySmall" tone="muted">论文 PDF</Typography><div className="rf-pve-paper">
    <div className={`rf-pve-region r0 ${elapsed>=regions[0][1]?'detected':''}`}><Typography variant="h3" align="center">Research Paper</Typography><span>标题</span></div>
    <div className={`rf-pve-region r1 ${elapsed>=regions[1][1]?'detected':''}`}><Typography variant="bodySmall" align="center">Authors · Research Institute</Typography><span>作者与机构</span></div>
    <div className="rf-pve-paper-columns"><div className={`rf-pve-region r2 ${elapsed>=regions[2][1]?'detected':''}`}><Typography variant="bodySmall">Abstract</Typography><Lines/><Typography variant="bodySmall">1 Introduction</Typography><Lines/><Lines/><span>正文</span></div>
     <div className={`rf-pve-region r3 figure ${elapsed>=regions[3][1]?'detected':''}`}><Figure index={2}/><Typography variant="bodySmall">Figure 1</Typography><span>图表</span></div>
     <div className={`rf-pve-region r4 ${elapsed>=regions[4][1]?'detected':''}`}><Typography variant="bodySmall">2 Method</Typography><Lines/><Lines/><span>正文</span></div>
     <div className={`rf-pve-region r5 figure ${elapsed>=regions[5][1]?'detected':''}`}><Figure index={5}/><Typography variant="bodySmall">Figure 2</Typography><span>图表</span></div>
    </div>
   </div><Typography variant="bodySmall" tone="muted">论文版面示意</Typography></section>
   <ArrowRight size={32} className="rf-pve-arrow"/>
   <section className="rf-pve-process">
    <Typography variant="h2" key={phase} className="rf-pve-stage-title">{phase===0?'OCR 与版面分析':phase===1?'从候选图表中识别主图':phase===2?'选出最具代表性的图表':'形成结构化研究材料'}</Typography>
    <div className="rf-pve-workspace">
     {phase===0?<div className="rf-pve-ocr-output">{regions.map(([label,at],i)=><div key={i} className={elapsed>=at?'recognized':''}><span>{elapsed>=at?<Check size={18}/>:null}</span><Typography variant="body">{label}</Typography>{elapsed>=at&&<div className="rf-pve-extracted-text"><Lines/></div>}</div>)}</div>:<>
      <div className="rf-pve-candidate-grid">{crops.map((_,i)=><div key={i} className={`rf-pve-candidate ${scanning===i?'inspecting':''} ${phase>=2&&i===2?'chosen':''}`} style={{animationDelay:`${i*80}ms`}}><div className="rf-pve-candidate-image"><Figure index={i}/></div><Typography variant="bodySmall" tone="muted">Fig. {String(i+1).padStart(2,'0')}</Typography>{phase>=2&&i===2&&<Check size={16}/>}</div>)}</div>
      {phase>=2&&<div className="rf-pve-hero"><div className="rf-pve-hero-head"><ImageIcon size={24}/><Typography variant="h3">代表性主图</Typography><span><Check size={20}/></span></div><Figure index={2}/></div>}
     </>}
    </div>
    {phase===1&&<Typography variant="bodySmall" tone="muted" className="rf-pve-process-note">候选图表逐一识别</Typography>}
    {phase===2&&<Typography variant="bodySmall" tone="muted" className="rf-pve-process-note">从多个候选中，保留表达论文核心内容的主图</Typography>}
    {phase===3&&<div className="rf-pve-structured">{[[FileText,'正文与章节'],[ImageIcon,'代表性主图'],[ListTree,'大纲与总结'],[Users,'作者与机构']].map(([Icon,label])=>{const I=Icon as typeof FileText;return <div key={String(label)}><I size={21}/><Typography variant="bodySmall">{String(label)}</Typography></div>})}</div>}
   </section>
  </div>
  <Typography variant="bodySmall" tone="muted" className="rf-pve-footnote">技术流程动画示意</Typography>
 </ContentBlock>;
}
