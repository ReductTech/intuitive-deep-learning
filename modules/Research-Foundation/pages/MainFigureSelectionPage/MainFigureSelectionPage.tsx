import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
import { moduleIdentity } from '../../outlines.json';
import { useRecordingDemo } from '../../components/RecordingDemo';
import './MainFigureSelectionPage.css';

const candidates=[
 {file:'figure-02.png',label:'Figure 2 · 模型性能对比',x:64,y:95,w:354,h:218,r:-4},
 {file:'figure-05.png',label:'Figure 5 · 训练过程分析',x:1180,y:88,w:348,h:230,r:4},
 {file:'table-02.png',label:'Table 2 · 实验数据表',x:82,y:382,w:354,h:235,r:-3},
 {file:'figure-12.png',label:'Figure 12 · 蒸馏方法',x:1168,y:391,w:362,h:230,r:3},
 {file:'figure-04.png',label:'Figure 4 · 高分辨率特征',x:460,y:505,w:325,h:171,r:-2},
 {file:'figure-08.png',label:'Figure 8 · 方法效果分析',x:811,y:514,w:322,h:166,r:2},
];
const main='figure-01.png';
const asset=(file:string)=>moduleAssetUrl(moduleIdentity.id,`research-papers/dinov3/${file}`);
/** Preselected paper visuals illustrate the recognition workflow; no live inference runs here. */
export function MainFigureSelectionPage({onComplete}:{onComplete?:()=>void}){
 const root=useRef<HTMLElement>(null);
 const [phase,setPhase]=useState(0);
 const [loaded,setLoaded]=useState<Set<string>>(()=>new Set());
 const [failed,setFailed]=useState(false);
 const ready=loaded.size===candidates.length+1;
 useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)setPhase(2);},[]);
 const markLoaded=(file:string)=>setLoaded(current=>new Set(current).add(file));
 useRecordingDemo(root,async demo=>{
  setPhase(0);
  await demo.wait(2800);setPhase(1);
  await demo.wait(2400);setPhase(2);
  await demo.wait(7800);
  onComplete?.();
 },{enabled:ready});
 return <section ref={root} className={`rf-page rf-main-figure phase-${phase} rf-recording-demo`} data-phase={phase} aria-label="自研论文核心视觉元素识别算法，自动聚焦真实论文代表性图表">
  <div className="rf-visual-stage" aria-label="DINOv3论文图表候选与代表性主图">
   <Typography className="rf-visual-paper" variant="bodySmall" tone="muted">论文示例 / DINOv3 · 2025</Typography>
   <div className="rf-visual-gallery">
    {candidates.map(c=><figure key={c.file} className="rf-visual-candidate" style={{'--card-x':`${c.x}px`,'--card-y':`${c.y}px`,'--card-w':`${c.w}px`,'--card-h':`${c.h}px`,'--card-r':`${c.r}deg`} as CSSProperties}>
     <img src={asset(c.file)} alt={c.label} draggable={false} onLoad={()=>markLoaded(c.file)} onError={()=>setFailed(true)}/>
    </figure>)}
    <figure className="rf-visual-selected" aria-label="代表性主图：DINOv3 Figure 1">
     <img src={asset(main)} alt="DINOv3 Figure 1：自监督学习性能、稠密任务对比，以及自然图像与遥感图像的特征可视化" draggable={false} onLoad={()=>markLoaded(main)} onError={()=>setFailed(true)}/>
     <i className="rf-visual-corner top-left"/><i className="rf-visual-corner top-right"/><i className="rf-visual-corner bottom-left"/><i className="rf-visual-corner bottom-right"/>
    </figure>
   </div>
  </div>
  <div className="rf-visual-copy" aria-live="polite">
   <div className={`rf-visual-copy-intro ${phase===2?'is-out':''}`} aria-hidden={phase===2}>
    <Typography as="h2" variant="h2" tone="inherit">自研论文核心视觉元素识别算法</Typography>
    <Typography variant="subtitle" tone="muted">自动识别最能代表论文核心内容的图与表</Typography>
   </div>
   <div className={`rf-visual-copy-result ${phase===2?'is-in':''}`} aria-hidden={phase!==2}>
    <Typography as="h2" variant="h2" tone="inherit">聚焦论文核心内容，加速理解</Typography>
    <Typography variant="subtitle" tone="muted">代表性主图 · DINOv3，Figure 1</Typography>
   </div>
  </div>
  {failed&&<Typography className="rf-visual-load-error" variant="bodySmall" tone="muted">论文素材未能加载，请重新进入此页。</Typography>}
 </section>;
}
