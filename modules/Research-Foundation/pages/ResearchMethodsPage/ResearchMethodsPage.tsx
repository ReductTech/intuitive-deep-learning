import { useEffect, useState } from 'react';
import { ContentBlock, Button, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import { PlaybackBar, usePlayback } from '../../Playback';
import './ResearchMethodsPage.css';

const papers=[
 {title:'From Words to Worth: Newborn Article Impact Prediction with LLM',venue:'AAAI 2025',area:'知识评价',description:'论文影响力预测',use:'为科研知识价值分析提供算法积累。'},
 {title:'NAIPv2: Debiased Pairwise Learning for Efficient Paper Quality Estimation',venue:'ICLR 2026',area:'知识评价',description:'论文质量估计',use:'为内容质量评价提供方法积累。'},
 {title:'TempSamp-R1: Effective Temporal Sampling with Reinforcement Fine-Tuning for Video LLMs',venue:'NeurIPS 2025',area:'视频理解',description:'视频大模型的时序采样',use:'为理解教学视频中的时序信息提供方法基础。'},
 {title:'Re-Aligning Language to Visual Objects with an Agentic Workflow',venue:'ICLR 2025',area:'图文对齐',description:'语言与视觉对象对齐',use:'为组织图文对应的教育内容提供方法基础。'},
 {title:'Towards Understanding Token Evolution in Continual Learning of MLLMs',venue:'IJCV 2026',area:'持续学习',description:'多模态模型持续学习',use:'为模型面对新知识时的持续适应提供研究积累。'},
 {title:'Generative Multi-modal Models are Good Class-Incremental Learners',venue:'CVPR 2024',area:'持续学习',description:'多模态模型的类别增量学习',use:'为多模态知识更新提供研究积累。'},
];
const areas=['知识评价','视频理解','图文对齐','持续学习'];
const shortTitles=['From Words to Worth','NAIPv2','TempSamp-R1','Language ↔ Visual Objects','Token Evolution','Class-Incremental Learning'];
export function ResearchMethodsPage(){
 const p=usePlayback(6,4800), [details,setDetails]=useState(false);
 useEffect(()=>setDetails(false),[p.step,p.revision]);
 const active=papers[p.step];
 return <ContentBlock className="rf-page rf-methods" title={outline.pages[1].title}>
  <div className="rf-method-body">
   <div className="rf-tabs">{areas.map(area=><Button key={area} active={active.area===area} onClick={()=>p.go(papers.findIndex(paper=>paper.area===area))}>{area}</Button>)}</div>
   <aside className="rf-method-detail rf-fade" key={active.area}><Typography variant="display">{active.area}</Typography><Typography variant="body" tone="muted">{active.use}</Typography></aside>
   <section className="rf-paper-list">
    <div className="rf-paper-rows">{papers.map((paper,i)=>paper.area===active.area&&<button key={paper.title} className={`rf-paper-row ${i===p.step?'is-selected':''}`} onClick={()=>p.go(i)} aria-pressed={i===p.step} aria-label={`查看论文 ${i+1}`}><Typography variant="bodySmall" tone="muted">{paper.venue} · CCF-A</Typography><Typography variant="h2">{shortTitles[i]}</Typography><Typography variant="body" tone="muted">{paper.description}</Typography></button>)}</div>
    <Button className="rf-paper-detail-toggle" onClick={()=>setDetails(!details)} aria-expanded={details}>{details?'收起完整题目':'查看完整题目'}</Button>
    {details&&<div className="rf-full-title rf-fade"><Typography variant="bodySmall">{active.title}</Typography></div>}
   </section>
  </div>
  <PlaybackBar playback={p} label="逐项讲解"/>
 </ContentBlock>;
}
