import { useId } from 'react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
import { useResearchAnimation } from '../../components/useResearchAnimation';
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
 const {elapsed,root}=useResearchAnimation(13000,onComplete);
 const phase=elapsed<2600?0:elapsed<5800?1:elapsed<9200?2:3;
 return <section ref={root} className={`rf-page rf-pve rf-pve-video phase-${phase}`} data-phase={phase} aria-label="论文信息识别与结构化保存动画">
  <div className="rf-pve-document">
   <Typography variant="body" className="rf-pve-paper-name">研究论文</Typography>
   <div className="rf-pve-region title"><Lines/><Typography as="span" variant="body">标题</Typography></div>
   <div className="rf-pve-region author"><Lines/><Typography as="span" variant="body">机构</Typography></div>
   <div className="rf-pve-paper-columns"><div className="rf-pve-region text"><Lines/><Lines/><Lines/><Lines/><Typography as="span" variant="body">正文</Typography></div><div className="rf-pve-paper-figures rf-pve-region figure"><Figure index={2}/><Figure index={5}/><Typography as="span" variant="body">图表</Typography></div></div>
   <div className="rf-pve-paper-bottom rf-pve-region"><Lines/><Lines/><Lines/><Typography as="span" variant="body">正文</Typography></div>
  </div>
  {phase>=1&&<><svg className="rf-pve-streams" viewBox="0 0 1600 900" aria-hidden="true"><defs><marker id="rf-pve-flow-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#69a6df"/></marker></defs>{[237,407,577,747].map((y,i)=><g key={y}><path d={`M570 ${225+i*100} C630 ${225+i*100},640 ${y},700 ${y}`}/>{phase>=2&&<path className="to-record" d={`M990 ${y} C1030 ${y},1055 ${298.5+i*125},1110 ${298.5+i*125}`} markerEnd="url(#rf-pve-flow-tip)"/>}<circle r="5" className="rf-pve-particle"><animateMotion dur={`${1.8+i*.15}s`} repeatCount="indefinite" path={`M570 ${225+i*100} C630 ${225+i*100},640 ${y},700 ${y}`}/></circle></g>)}</svg>
  <div className="rf-pve-fragments">{fields.map((field,i)=><div className="rf-pve-fragment" key={field}><Typography variant="body">{field}</Typography><div className="rf-pve-fragment-paper">{i===2?<div className="rf-pve-keywords"><i/><i/><i/></div>:<Lines/>}</div></div>)}</div></>}
  {phase>=2&&<section className="rf-pve-record" aria-label="结构化记录"><Typography variant="h3">结构化记录</Typography><div className="rf-pve-record-rows">{fields.map((field,i)=><div className="rf-pve-record-row" key={field} style={{animationDelay:`${i*350}ms`}}><i/><Typography variant="body">{field}</Typography><div>{i===2?<div className="rf-pve-keywords"><i/><i/><i/></div>:<Lines/>}</div></div>)}</div>{phase>=3&&<div className="rf-pve-stamp" role="status"><Typography variant="body" tone="inherit">持久化入库</Typography></div>}</section>}
 </section>;
}
