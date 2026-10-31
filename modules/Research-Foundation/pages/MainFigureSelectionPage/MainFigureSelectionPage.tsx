import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
import { moduleIdentity } from '../../outlines.json';
import { useRecordingDemo } from '../../components/RecordingDemo';
import { elements, PAPER_PAGES, SELECTED_PAGES, pageDuration } from './paperFilmData';
import './MainFigureSelectionPage.css';

type Stage='pages'|'assemble'|'detect'|'focus';
const asset=(file:string)=>moduleAssetUrl(moduleIdentity.id,`research-papers/dinov3/${file}`);
const pageAsset=(index:number)=>asset(`pages/page-${String(SELECTED_PAGES[index]).padStart(2,'0')}.jpg`);
const copy={
 pages:['图表检测与提取','逐页定位论文中的图与表'],
 assemble:['汇聚论文中的图与表','从完整论文到候选视觉元素'],
 detect:['自研论文核心视觉元素识别算法','识别最能代表研究核心内容的图与表'],
 focus:['聚焦论文核心内容，加速理解','代表性方法图 · DINOv3，Figure 12'],
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
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setStage('focus');setFound(elements.map((_,i)=>i));}
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
  setStage('detect');await demo.wait(2300);
  setStage('focus');await demo.wait(5200);
  onComplete?.();
 },{enabled:ready});
 const currentElements=elements.filter(e=>e.page===SELECTED_PAGES[page]);
 return <section ref={root} className={`rf-page rf-paper-film stage-${stage} rf-recording-demo`} data-film-stage={stage} data-paper-page={SELECTED_PAGES[page]} data-sample-index={page+1} data-extracted={found.length} aria-label="逐页检测论文图表，提取候选视觉元素并聚焦代表性主图的自动影片">
  <div className="rf-paper-film-viewport" data-ppt-viewport="电影镜头取景窗口：论文轮播与立体图表的进出画面">
   <div className="rf-paper-film-room"/>
   <Typography className="rf-paper-film-source" variant="bodySmall" tone="muted">DINOv3 · 2025</Typography>
   <div className="rf-paper-reel" aria-label="精选15张压缩JPG论文页，逐页检测">
    {[page-1,page,page+1].filter(i=>i>=0&&i<PAPER_PAGES).map(i=><div key={i} className={`rf-paper-sheet ${i===page?'is-current':i<page?'is-previous':'is-next'}`}>
     <img src={pageAsset(i)} alt={`DINOv3原文第${SELECTED_PAGES[i]}页`} draggable={false}/>
     {i===page&&<div className="rf-paper-detection"><i className="rf-paper-scan"/>{currentElements.map(e=><div key={e.file} className="rf-paper-region" style={{left:`${e.box[0]/612*100}%`,top:`${e.box[1]/792*100}%`,width:`${(e.box[2]-e.box[0])/612*100}%`,height:`${(e.box[3]-e.box[1])/792*100}%`}}><Typography as="span" variant="bodySmall" tone="inherit">{e.label}</Typography></div>)}</div>}
    </div>)}
    <Typography className="rf-paper-film-page" variant="bodySmall" tone="muted">精选页 {String(page+1).padStart(2,'0')} / {PAPER_PAGES}</Typography>
   </div>
   <div className="rf-paper-film-gallery" aria-label="检测提取的论文图与表">
    {elements.map((e,i)=>{
     const fx=580+e.box[0]/612*440,fy=65+e.box[1]/792*569;
     const fs=((e.box[2]-e.box[0])/612*440)/e.width;
     return <figure key={e.file} className={`rf-film-poster ${i===0?'is-primary':''} ${found.includes(i)?'is-found':''}`} style={{'--poster-w':`${e.width}px`,'--poster-h':`${e.height}px`,'--gx':`${e.gx}px`,'--gy':`${e.gy}px`,'--gs':e.scale,'--gr':`${e.rotate}deg`,'--rx':`${1165+(i%2)*65}px`,'--ry':`${85+i*75}px`,'--rs':i===0?.20:.29,'--fx':`${fx}px`,'--fy':`${fy}px`,'--fs':fs} as CSSProperties}>
      <img src={asset('pdf-elements/'+e.file)} alt={`从原文第${e.page}页提取的${e.label}`} draggable={false}/>
      <i className="rf-film-corner top-left"/><i className="rf-film-corner top-right"/><i className="rf-film-corner bottom-left"/><i className="rf-film-corner bottom-right"/>
     </figure>;
    })}
   </div>
   <div className="rf-core-detector" aria-hidden="true"><i/><i/></div>
  </div>
  <div className="rf-paper-film-copy" aria-live="polite" key={stage}>
   <Typography as="h2" variant="h2" tone="inherit">{copy[stage][0]}</Typography>
   <Typography variant="subtitle" tone="muted">{copy[stage][1]}</Typography>
  </div>
  {failed&&<Typography className="rf-paper-film-error" variant="bodySmall" tone="muted">部分论文素材加载失败，请重新进入此页。</Typography>}
 </section>;
}
