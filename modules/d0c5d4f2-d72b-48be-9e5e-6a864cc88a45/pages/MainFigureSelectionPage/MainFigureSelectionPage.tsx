import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import { useRecordingDemo } from '../../components/RecordingDemo';
import { elements, PAPER_PAGES, SELECTED_PAGES, pageDuration } from './paperFilmData';
import './MainFigureSelectionPage.css';

type Stage='pages'|'assemble'|'detect'|'confirm'|'focus'|'result'|'complete';
const asset=(file:string)=>moduleAssetUrl(`research-papers/dinov3/${file}`);
const pageAsset=(index:number)=>asset(`pages/page-${String(SELECTED_PAGES[index]).padStart(2,'0')}.webp`);
const copy={
 pages:['图表检测与提取','逐页定位论文中的图与表'],
 assemble:['汇聚论文中的图与表','从完整论文到候选视觉元素'],
 detect:['自研论文核心视觉元素识别算法','扫描候选图表，识别核心视觉元素'],
 confirm:['已识别代表性方法图','锁定能够展示研究方法的关键图表'],
 focus:['放大核心方法图','从候选图表聚焦研究方法'],
 result:['用关键图表，加速论文理解','为论文概览与深入阅读提供入口'],
 complete:['用关键图表，加速论文理解','为论文概览与深入阅读提供入口'],
} as const;
/** The PDF pages and detection coordinates are prepared offline for a smooth local film. */
export function MainFigureSelectionPage({onComplete}:{onComplete?:()=>void}){
 const root=useRef<HTMLElement>(null),decoded=useRef(new Set<number>()),imageCache=useRef<HTMLImageElement[]>([]);
 const [page,setPage]=useState(0),[stage,setStage]=useState<Stage>('pages'),[found,setFound]=useState<number[]>([]);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
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
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setStage('result');setFound(elements.map((_,i)=>i));}
  return()=>{cancelled=true;imageCache.current=[];};
 },[]);
 useRecordingDemo(root,async demo=>{
  setStage('pages');setFound([]);
  const seen=new Set<number>();
  for(let i=0;i<PAPER_PAGES;i++){
   await demo.until(()=>decoded.current.has(i));
   setPage(i);
   let scanned=false;
   await demo.animate(pageDuration(i),t=>{
    root.current?.style.setProperty('--scan',String(t*100));
    if(t>.52&&!scanned){
     scanned=true;
     elements.forEach((e,k)=>{if(e.page===SELECTED_PAGES[i])seen.add(k);});
     setFound(current=>current.length===seen.size?current:[...seen]);
    }
   });
  }
  setFound(elements.map((_,i)=>i));setStage('assemble');await demo.wait(2800);
  setStage('detect');await demo.wait(1250);
  setStage('confirm');await demo.wait(950);
  setStage('focus');await demo.wait(3200);
  setStage('result');await demo.wait(1500);
  setStage('complete');await demo.wait(500);
  onComplete?.();
 },{enabled:ready});
 const visualStage=stage==='result'||stage==='complete'?'focus':stage;
 const currentElements=elements.filter(e=>e.page===SELECTED_PAGES[page]);
 return <section shuku-edit-id="e-c2630927-6a5b-42d3-9d46-bca82ce7adad" ref={root} className={`rf-page rf-paper-film stage-${visualStage} caption-${stage} rf-recording-demo`} data-film-stage={stage} data-paper-page={SELECTED_PAGES[page]} data-sample-index={page+1} data-extracted={found.length} aria-label="逐页检测论文图表，提取候选视觉元素并聚焦代表性主图的自动影片">
  <div shuku-edit-id="e-47065d7e-0c2e-4ab6-9844-968ac10c9faa" className="rf-paper-film-viewport" data-ppt-viewport="电影镜头取景窗口：论文轮播与立体图表的进出画面">
   <div shuku-edit-id="e-757677dd-bc1c-4ebd-91dc-392ed43aa0ab" className="rf-paper-film-room"/>
   <Typography shuku-edit-id="e-43880cbf-30cd-4307-ad7c-31182f025e8d" className="rf-paper-film-source" variant="bodySmall" tone="muted">DINOv3 · 2025</Typography>
   <div shuku-edit-id="e-e590a449-065d-466c-ab7e-02cb9b21eb92" className="rf-paper-reel" aria-label="精选15张压缩JPG论文页，逐页检测">
    {[page-1,page,page+1].filter(i=>i>=0&&i<PAPER_PAGES).map(i=><div shuku-edit-id="e-7e466f33-2387-4077-95d8-e4956d897f61" key={i} className={`rf-paper-sheet ${i===page?'is-current':i<page?'is-previous':'is-next'}`}>
     <img shuku-edit-id="e-cd7a1979-578b-406f-a72e-84a5ff1bf00f" src={pageAsset(i)} alt={`DINOv3原文第${SELECTED_PAGES[i]}页`} draggable={false}/>
     {i===page&&<div shuku-edit-id="e-3bdb70ff-1a91-45ed-88f1-0610749dec2d" className="rf-paper-detection"><i shuku-edit-id="e-364acbcc-cf51-4e50-8c78-b07826a91001" className="rf-paper-scan"/>{currentElements.map(e=><div shuku-edit-id="e-33e191df-8e37-4080-8280-d58bea3211b2" key={e.file} className="rf-paper-region" style={{left:`${e.box[0]/612*100}%`,top:`${e.box[1]/792*100}%`,width:`${(e.box[2]-e.box[0])/612*100}%`,height:`${(e.box[3]-e.box[1])/792*100}%`}}><Typography shuku-edit-id="e-3482130a-fd3b-4e71-affc-f1577f83c02e" as="span" variant="bodySmall" tone="inherit">{e.label}</Typography></div>)}</div>}
    </div>)}
   </div>
   <div shuku-edit-id="e-93aedf43-b7a0-417c-9644-8ba1c01e5f30" className="rf-paper-film-gallery" aria-label="检测提取的论文图与表">
    {elements.map((e,i)=>{
     const fx=580+e.box[0]/612*440,fy=65+e.box[1]/792*569;
     const fs=((e.box[2]-e.box[0])/612*440)/e.width;
     return <figure shuku-edit-id="e-18bada83-e849-4e8b-8a88-7c3452870111" key={e.file} className={`rf-film-poster ${i===0?'is-primary':''} ${found.includes(i)?'is-found':''}`} style={{'--poster-w':`${e.width}px`,'--poster-h':`${e.height}px`,'--gx':`${e.gx}px`,'--gy':`${e.gy}px`,'--gs':e.scale,'--gr':`${e.rotate}deg`,'--rx':`${1165+(i%2)*65}px`,'--ry':`${85+i*75}px`,'--rs':i===0?.20:.29,'--fx':`${fx}px`,'--fy':`${fy}px`,'--fs':fs} as CSSProperties}>
      <img shuku-edit-id="e-9d120da5-d883-4e7f-bcf1-41d166764f10" src={asset('pdf-elements/'+e.file)} alt={`从原文第${e.page}页提取的${e.label}`} draggable={false}/>
      <div shuku-edit-id="e-90444bbc-0eda-4f2d-b44b-21cfbfdb008a" className="rf-film-scan-surface" aria-hidden="true"><i shuku-edit-id="e-19c45c8b-0f0f-479d-b6ba-94528c5e26a4" className="rf-film-scan-band"/></div>
      {i===0&&<div shuku-edit-id="e-93da7adf-8c73-4519-914e-a655095b6374" className="rf-method-check" role="img" aria-label="已识别代表性方法图"><Check aria-hidden="true" strokeWidth={3.4}/></div>}
      <i shuku-edit-id="e-3f2e6cd1-8d7f-4b48-b016-5bf8a73e9b47" className="rf-film-corner top-left"/><i shuku-edit-id="e-133ec4ae-08fa-4c60-9126-6c9df1875da1" className="rf-film-corner top-right"/><i shuku-edit-id="e-5681b6d7-723e-4517-b3e8-4536650fb874" className="rf-film-corner bottom-left"/><i shuku-edit-id="e-4e50e4c1-a575-438e-be29-a90a57476d9f" className="rf-film-corner bottom-right"/>
     </figure>;
    })}
   </div>
  </div>
  <div shuku-edit-id="e-eaddc0c9-fa28-4da2-bc7f-c4143a5fe601" className={`rf-paper-film-copy ${stage==='complete'?'is-complete':''}`} aria-hidden={stage==='complete'} aria-live="polite" key={copy[stage][0]}>
   <Typography shuku-edit-id="e-d8842860-c5d9-4ea0-8f56-b5c5aa763a93" as="h2" variant="h2" tone="inherit">{copy[stage][0]}</Typography>
   <Typography shuku-edit-id="e-15ebb8bb-a8cd-442f-8216-14847932d424" variant="subtitle" tone="muted">{copy[stage][1]}</Typography>
  </div>
  {failed&&<Typography shuku-edit-id="e-8c875e03-0be8-4ec7-94ba-c7bbcf048da9" className="rf-paper-film-error" variant="bodySmall" tone="muted">部分论文素材加载失败，请重新进入此页。</Typography>}
 </section>;
}
