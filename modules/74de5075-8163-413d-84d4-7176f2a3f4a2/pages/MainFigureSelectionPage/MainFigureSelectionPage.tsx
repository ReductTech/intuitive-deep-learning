import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline, { moduleIdentity } from '../../outlines.json';
import { useClickSteps } from '../../components/useClickSteps';
import { elements, PAPER_PAGES, SELECTED_PAGES, pageDuration } from './paperFilmData';
import './MainFigureSelectionPage.css';

type Stage='pages'|'assemble'|'detect'|'confirm'|'focus'|'result'|'complete';
const asset=(file:string)=>moduleAssetUrl(`research-foundation/research-papers/dinov3/${file}`);
const pageAsset=(index:number)=>asset(`pages/page-${String(SELECTED_PAGES[index]).padStart(2,'0')}.jpg`);
const copy={
 pages:['图表检测与提取','逐页定位论文中的图与表'],
 assemble:['汇聚论文中的图与表','从完整论文到候选视觉元素'],
 detect:['自研论文核心视觉元素识别算法','扫描候选图表，识别核心视觉元素'],
 confirm:['已识别代表性方法图','锁定能够展示研究方法的关键图表'],
 focus:['放大核心方法图','从候选图表聚焦研究方法'],
 result:['用关键图表，加速论文理解','为论文概览与深入阅读提供入口'],
 complete:['主图识别完成','已定位代表性方法图，为论文概览与深入阅读提供入口'],
} as const;
/** The PDF pages and detection coordinates are prepared offline for a smooth local film. */
export function MainFigureSelectionPage({onComplete}:{onComplete?:()=>void}){
 const root=useRef<HTMLElement>(null),decoded=useRef(new Set<number>()),imageCache=useRef<HTMLImageElement[]>([]);
 const [page,setPage]=useState(0),[stage,setStage]=useState<Stage>('pages'),[found,setFound]=useState<number[]>([]);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[scanComplete,setScanComplete]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  decoded.current.clear();imageCache.current=[];
  const load=(url:string)=>new Promise<void>((resolve,reject)=>{
   const image=new window.Image();imageCache.current.push(image);
   image.onload=()=>{image.decode().then(()=>resolve()).catch(()=>resolve());};image.onerror=reject;image.src=url;
  });
  const pageLoads=Array.from({length:PAPER_PAGES},(_,i)=>load(pageAsset(i)).then(()=>{decoded.current.add(i);}));
  const artLoads=elements.map(e=>load(asset('pdf-elements/'+e.file)));
  // Start on the first page; remaining page images preload while the early scans play.
  void Promise.all([pageLoads[0],...artLoads]).then(()=>{if(!cancelled)setReady(true);}).catch(()=>{if(!cancelled)setFailed(true);});
  void Promise.all(pageLoads).catch(()=>{if(!cancelled)setFailed(true);});
  return()=>{cancelled=true;imageCache.current=[];};
 },[]);
 const {busy}=useClickSteps(root,async animation=>{
  if(stage==='complete'){onComplete?.();return;}
  if(stage==='pages'&&!scanComplete){
   const seen=new Set<number>();
   for(let i=0;i<PAPER_PAGES;i++){
    await animation.until(()=>decoded.current.has(i));
    setPage(i);let scanned=false;
    await animation.animate(pageDuration(i),progress=>{
     root.current?.style.setProperty('--scan',String(progress*100));
     if(progress>.52&&!scanned){scanned=true;elements.forEach((element,index)=>{if(element.page===SELECTED_PAGES[i])seen.add(index);});setFound([...seen]);}
    });
   }
   setScanComplete(true);setStage('assemble');await animation.wait(2800);return;
  }
  if(stage==='assemble'){
   setStage('detect');await animation.wait(1250);
   setStage('confirm');await animation.wait(950);
   setStage('focus');await animation.wait(3200);setStage('complete');
  }
 },ready);
 const visualStage=stage==='result'||stage==='complete'?'focus':stage;
 const currentElements=elements.filter(e=>e.page===SELECTED_PAGES[page]);
 return <ContentBlock shuku-edit-id="e-085effe0-0a0f-41d9-95ca-40702992b795" ref={root} className="rf-foundation-titled" headingLevel={1} title={outline.pages.find(page=>page.id==='94bba564-d4ec-4aa2-9bcb-a8c40142f634')!.title} bodyClassName="rf-foundation-titled-body">
 <div shuku-edit-id="e-54661190-5e51-4669-b427-8442569a6122" className="rf-foundation-full-scene">
 <section shuku-edit-id="e-a57ed050-8632-4337-979e-d3ff55d85781" className={`rf-page spp-rf-paper-film stage-${visualStage} caption-${stage} rf-recording-demo`} data-scanning={busy&&stage==='pages'} data-scan-complete={scanComplete} data-film-stage={stage} data-paper-page={SELECTED_PAGES[page]} data-sample-index={page+1} data-extracted={found.length} aria-label="点击或按空格，逐段演示图表检测、汇聚、主图识别与放大">
  <div shuku-edit-id="e-13886f75-f64e-42e1-abb2-5b1853d03ca4" className="spp-rf-paper-film-viewport" data-ppt-viewport="电影镜头取景窗口：论文轮播与立体图表的进出画面">
   <div shuku-edit-id="e-046c59eb-5e63-44cd-9bd9-2f3a2b25f62e" className="spp-rf-paper-film-room"/>
   <div shuku-edit-id="e-6e7c631f-e3db-40d6-b9f1-41f6fe3a8a18" className="spp-rf-paper-reel" aria-label="精选15张压缩JPG论文页，逐页检测">
    {[page-1,page,page+1].filter(i=>i>=0&&i<PAPER_PAGES).map(i=><div shuku-edit-id="e-88c53b9d-e0bd-41cc-b3a0-e95e318af2ae" key={i} className={`spp-rf-paper-sheet ${i===page?'is-current':i<page?'is-previous':'is-next'}`}>
     <img shuku-edit-id="e-fbfecb1e-cee6-4c59-b857-a3dffbbac3d7" src={pageAsset(i)} alt={`DINOv3原文第${SELECTED_PAGES[i]}页`} draggable={false}/>
     {i===page&&<div shuku-edit-id="e-feb0907d-c6ca-4b56-82c5-a79cde2e3403" className="spp-rf-paper-detection"><i shuku-edit-id="e-d1882a7a-b297-4a1e-a95f-f646c62d0d7a" className="spp-rf-paper-scan"/>{currentElements.map(e=><div shuku-edit-id="e-cdae96d6-bb12-4b41-b1b3-86077f2c3ed5" key={e.file} className="spp-rf-paper-region" style={{left:`${e.box[0]/612*100}%`,top:`${e.box[1]/792*100}%`,width:`${(e.box[2]-e.box[0])/612*100}%`,height:`${(e.box[3]-e.box[1])/792*100}%`}}><Typography shuku-edit-id="e-a51f314d-fb69-4f79-8a18-55948a8e97cb" as="span" variant="bodySmall" tone="inherit">{e.label}</Typography></div>)}</div>}
    </div>)}
   </div>
   <div shuku-edit-id="e-f75dda60-e05c-40c1-8093-4d86b13d96fc" className="spp-rf-paper-film-gallery" aria-label="检测提取的论文图与表">
    {elements.map((e,i)=>{
     const fx=580+e.box[0]/612*440,fy=165+e.box[1]/792*569;
     const fs=((e.box[2]-e.box[0])/612*440)/e.width;
     return <figure shuku-edit-id="e-e38bdd5f-2158-42c3-bba3-937bdc06994d" key={e.file} className={`spp-rf-film-poster ${i===0?'is-primary':''} ${found.includes(i)?'is-found':''}`} style={{'--poster-w':`${e.width}px`,'--poster-h':`${e.height}px`,'--gx':`${e.gx}px`,'--gy':`${e.gy}px`,'--gs':e.scale,'--gr':`${e.rotate}deg`,'--rx':`${1165+(i%2)*65}px`,'--ry':`${85+i*75}px`,'--rs':i===0?.20:.29,'--fx':`${fx}px`,'--fy':`${fy}px`,'--fs':fs} as CSSProperties}>
      <img shuku-edit-id="e-8cd9f8aa-d87e-4855-8db9-d91a0f767f25" src={asset('pdf-elements/'+e.file)} alt={`从原文第${e.page}页提取的${e.label}`} draggable={false}/>
      <div shuku-edit-id="e-d96c9d8d-d631-451d-8b11-67965f5968cc" className="spp-rf-film-scan-surface" aria-hidden="true"><i shuku-edit-id="e-7528f816-bb5e-4ae2-accb-197aa450a678" className="spp-rf-film-scan-band"/></div>
      {i===0&&<div shuku-edit-id="e-df3ce543-7f5d-49c7-ac84-d1f224568eb9" className="spp-rf-method-check" role="img" aria-label="已识别代表性方法图"><Check aria-hidden="true" strokeWidth={3.4}/></div>}
      <i shuku-edit-id="e-ef74344a-4ff3-49ab-b167-f1e7b425b710" className="spp-rf-film-corner top-left"/><i shuku-edit-id="e-06ab9257-de4e-45d5-9a16-fbf02ca95627" className="spp-rf-film-corner top-right"/><i shuku-edit-id="e-4228ef43-9465-45c7-a9b1-55e37fd73eec" className="spp-rf-film-corner bottom-left"/><i shuku-edit-id="e-eb3326d1-d5b8-47e5-b6f9-868d6b0dd32b" className="spp-rf-film-corner bottom-right"/>
     </figure>;
    })}
   </div>
  </div>
  <div shuku-edit-id="e-799afb07-d58e-4dc0-81e2-9eee5b4ad332" className="spp-rf-paper-film-copy" role={stage==='complete'?'status':undefined} aria-live="polite" key={copy[stage][0]}>
   <Typography shuku-edit-id="e-e34926b6-1d8d-471e-a499-0d51a5683449" variant="subtitle" tone="muted">{copy[stage][1]}</Typography>
  </div>
  {failed&&<Typography shuku-edit-id="e-ea2b378d-37b6-410c-b7dc-30695bb0a592" className="spp-rf-paper-film-error" variant="bodySmall" tone="muted">部分论文素材加载失败，请重新进入此页。</Typography>}
 </section>
 </div>
 </ContentBlock>;
}
