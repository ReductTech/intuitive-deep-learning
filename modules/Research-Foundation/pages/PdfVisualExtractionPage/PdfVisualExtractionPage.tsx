import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Check, CloudUpload, Database, FileText, Link, Sparkles } from 'lucide-react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './PdfVisualExtractionPage.css';

const crops=[
 [60,1280,1009,340],[60,2820,1009,290],[60,4455,1009,380],
 [60,6050,1009,550],[60,7880,1009,680],[590,1280,479,340],
 [550,4455,519,380],[60,6050,490,350],[550,7880,519,420],
];
const regions=[['标题',900],['作者与机构',1700],['正文',2600],['图表',3500],['正文',4400],['图表',5300]] as const;
const scores=[72,81,96,65,78,83,69,75,88];
function Figure({index}:{index:number}){
 const clipId=useId();
 const [x,y,w,h]=crops[index];
 return <div className="rf-pve-figure" data-ppt-viewport="候选论文图表示例裁切" style={{aspectRatio:`${w}/${h}`}}><svg width="100%" height="100%" viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={`候选图表 ${index+1} 示例`}><defs><clipPath id={clipId}><rect x={x} y={y} width={w} height={h}/></clipPath></defs><image clipPath={`url(#${clipId})`} href={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/feed-reference.jpg')} width="1129" height="9064"/></svg></div>;
}
function Lines(){return <div className="rf-pve-lines" aria-hidden="true"><i/><i/><i/><i/></div>}
/** Animation illustrates the supplied technique; it does not run OCR or rank real papers. */
export function PdfVisualExtractionPage(){
 const [elapsed,setElapsed]=useState(0),root=useRef<HTMLElement>(null),visible=useRef(true);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setElapsed(30000);return}
  const observer=new IntersectionObserver(([entry])=>{visible.current=entry.isIntersecting});
  if(root.current)observer.observe(root.current);
  let time=0,last=performance.now();
  const timer=window.setInterval(()=>{
   const now=performance.now();
   if(visible.current&&!document.hidden){time=Math.min(30000,time+Math.max(0,now-last));setElapsed(time)}
   last=now;
   if(time>=30000)clearInterval(timer);
  },100);
  return()=>{clearInterval(timer);observer.disconnect()};
 },[]);
 const phase=elapsed<6500?0:elapsed<9500?1:elapsed<12500?2:elapsed<17500?3:elapsed<23000?4:5;
 const scored=phase>=2,selected=phase>=3,uploading=phase>=4,stored=phase>=5;
 const seen=regions.filter(([,at])=>elapsed>=at).length;
 return <ContentBlock ref={root} className={`rf-page rf-pve phase-${phase}`} title="从论文 PDF 到结构化研究资产" data-phase={phase} data-boxes={seen}>
  <div className="rf-pve-scene">
   <section className="rf-pve-source"><Typography variant="body" tone="muted">OCR · 版面分析</Typography><div className="rf-pve-paper">
    <div className={`rf-pve-region r0 ${elapsed>=regions[0][1]?'detected':''}`}><Typography variant="body" align="center">论文标题</Typography><Typography as="span" variant="body">标题</Typography></div>
    <div className={`rf-pve-region r1 ${elapsed>=regions[1][1]?'detected':''}`}><Lines/><Typography as="span" variant="body">作者与机构</Typography></div>
    <div className="rf-pve-paper-columns"><div className={`rf-pve-region r2 ${elapsed>=regions[2][1]?'detected':''}`}><Lines/><Lines/><Lines/><Typography as="span" variant="body">正文</Typography></div>
     <div className={`rf-pve-region r3 figure ${elapsed>=regions[3][1]?'detected':''}`}><Figure index={2}/><Typography as="span" variant="body">图表</Typography></div>
     <div className={`rf-pve-region r4 ${elapsed>=regions[4][1]?'detected':''}`}><Lines/><Lines/><Typography as="span" variant="body">正文</Typography></div>
     <div className={`rf-pve-region r5 figure ${elapsed>=regions[5][1]?'detected':''}`}><Figure index={5}/><Typography as="span" variant="body">图表</Typography></div>
    </div>
   </div><Typography variant="body" tone="muted">论文版面示意</Typography></section>
   <ArrowRight className={`rf-pve-flow-arrow ${phase>=1?'active':''}`}/>
   <section className={`rf-pve-evaluation ${phase>=1?'revealed':''}`}>
    <div className="rf-pve-model"><Sparkles size={23}/><Typography variant="h3">模型统一评价</Typography></div>
    <div className="rf-pve-candidate-grid">{crops.map((_,i)=><div key={i} className={`rf-pve-candidate ${selected&&i===2?'chosen':''}`}>
     <div className="rf-pve-candidate-image"><Figure index={i}/></div>
     <div className="rf-pve-candidate-caption"><Typography variant="body" tone={selected&&i===2?'accent':'muted'}>{selected&&i===2?'主图':`图 ${i+1}`}</Typography>{scored&&<Typography variant="body" className="rf-pve-score" data-score={scores[i]}>{scores[i]}</Typography>}</div>
    </div>)}</div>
    <Typography variant="body" tone="muted" className="rf-pve-evaluation-note">{phase<2?'提取候选图表':phase===2?'统一评分':'最高分 → 代表性主图'}</Typography>
   </section>
   <ArrowRight className={`rf-pve-flow-arrow ${uploading?'active':''}`}/>
   <section className={`rf-pve-storage ${uploading?'revealed':''}`}>
    <Typography variant="h3">图片与内容分别存储</Typography>
    <div className={`rf-pve-upload ${uploading?'transferring':''}`}>
     <div className="rf-pve-upload-images">{[2,0,4].map(i=><div key={i}><Figure index={i}/></div>)}<Typography variant="body" tone="muted">全部图表图片</Typography></div>
     <div className="rf-pve-upload-arrow"><ArrowRight size={34}/><span/><span/><span/></div>
     <div className="rf-pve-oss"><CloudUpload size={72} strokeWidth={1.4}/><Typography variant="body">OSS</Typography><Typography variant="body" tone="muted">图片存储{stored?' ✓':''}</Typography></div>
    </div>
    <div className={`rf-pve-url ${stored?'received':''}`}><ArrowDown size={28}/><div><Link size={24}/><Typography variant="body">{stored?'已返回图片链接':'返回图片链接'}</Typography></div></div>
    <div className={`rf-pve-database-row ${stored?'committed':''}`}>
     <div className="rf-pve-text-record"><FileText size={40}/><Typography variant="body">正文 / 大纲<br/>作者与机构</Typography></div><ArrowRight size={26}/>
     <div className="rf-pve-db"><Database size={68} strokeWidth={1.4}/><Typography variant="body">结构化数据库</Typography>{stored&&<Check className="rf-pve-db-check" size={22}/>}</div>
    </div>
    <div className={`rf-pve-record ${stored?'committed':''}`}>
     {[['图片链接','全部图表'],['主图链接','最高分图表'],['文本信息','正文·大纲·机构']].map(([key,value])=><div key={key}><Typography variant="body" tone="muted">{key}</Typography><Typography variant="body">{value}</Typography></div>)}
    </div>
   </section>
  </div>
  <div className="rf-pve-footer"><Typography variant="body" tone="muted">{stored?'OSS 存图片 · 数据库存链接与内容':uploading?'图片上传 OSS，链接与内容入库':''}</Typography><Typography variant="body" tone="muted">流程与评分示意</Typography></div>
 </ContentBlock>;
}

