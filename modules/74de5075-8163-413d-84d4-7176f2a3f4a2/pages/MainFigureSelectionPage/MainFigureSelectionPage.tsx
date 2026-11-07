import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline, { moduleIdentity } from '../../outlines.json';
import { useClickSteps } from '../../components/useClickSteps';
import { elements, PAPER_PAGES, SELECTED_PAGES, pageDuration } from './paperFilmData';
import './MainFigureSelectionPage.css';

type Stage='pages'|'assemble'|'detect'|'confirm'|'focus'|'result'|'complete';
const asset=(file:string)=>moduleAssetUrl(moduleIdentity.id,`research-foundation/research-papers/dinov3/${file}`);
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
 return <ContentBlock ref={root} className="rf-foundation-titled" headingLevel={1} title={outline.pages.find(page=>page.id==='94bba564-d4ec-4aa2-9bcb-a8c40142f634')!.title} bodyClassName="rf-foundation-titled-body">
 <div className="rf-foundation-full-scene">
 <section className={`rf-page spp-rf-paper-film stage-${visualStage} caption-${stage} rf-recording-demo`} data-scanning={busy&&stage==='pages'} data-scan-complete={scanComplete} data-film-stage={stage} data-paper-page={SELECTED_PAGES[page]} data-sample-index={page+1} data-extracted={found.length} aria-label="点击或按空格，逐段演示图表检测、汇聚、主图识别与放大">
  <div className="spp-rf-paper-film-viewport" data-ppt-viewport="电影镜头取景窗口：论文轮播与立体图表的进出画面">
   <div className="spp-rf-paper-film-room"/>
   <div className="spp-rf-paper-reel" aria-label="精选15张压缩JPG论文页，逐页检测">
    {[page-1,page,page+1].filter(i=>i>=0&&i<PAPER_PAGES).map(i=><div key={i} className={`spp-rf-paper-sheet ${i===page?'is-current':i<page?'is-previous':'is-next'}`}>
     <img src={pageAsset(i)} alt={`DINOv3原文第${SELECTED_PAGES[i]}页`} draggable={false}/>
     {i===page&&<div className="spp-rf-paper-detection"><i className="spp-rf-paper-scan"/>{currentElements.map(e=><div key={e.file} className="spp-rf-paper-region" style={{left:`${e.box[0]/612*100}%`,top:`${e.box[1]/792*100}%`,width:`${(e.box[2]-e.box[0])/612*100}%`,height:`${(e.box[3]-e.box[1])/792*100}%`}}><Typography as="span" variant="bodySmall" tone="inherit">{e.label}</Typography></div>)}</div>}
    </div>)}
   </div>
   <div className="spp-rf-paper-film-gallery" aria-label="检测提取的论文图与表">
    {elements.map((e,i)=>{
     const fx=580+e.box[0]/612*440,fy=165+e.box[1]/792*569;
     const fs=((e.box[2]-e.box[0])/612*440)/e.width;
     return <figure key={e.file} className={`spp-rf-film-poster ${i===0?'is-primary':''} ${found.includes(i)?'is-found':''}`} style={{'--poster-w':`${e.width}px`,'--poster-h':`${e.height}px`,'--gx':`${e.gx}px`,'--gy':`${e.gy}px`,'--gs':e.scale,'--gr':`${e.rotate}deg`,'--rx':`${1165+(i%2)*65}px`,'--ry':`${85+i*75}px`,'--rs':i===0?.20:.29,'--fx':`${fx}px`,'--fy':`${fy}px`,'--fs':fs} as CSSProperties}>
      <img src={asset('pdf-elements/'+e.file)} alt={`从原文第${e.page}页提取的${e.label}`} draggable={false}/>
      <div className="spp-rf-film-scan-surface" aria-hidden="true"><i className="spp-rf-film-scan-band"/></div>
      {i===0&&<div className="spp-rf-method-check" role="img" aria-label="已识别代表性方法图"><Check aria-hidden="true" strokeWidth={3.4}/></div>}
      <i className="spp-rf-film-corner top-left"/><i className="spp-rf-film-corner top-right"/><i className="spp-rf-film-corner bottom-left"/><i className="spp-rf-film-corner bottom-right"/>
     </figure>;
    })}
   </div>
  </div>
  <div className="spp-rf-paper-film-copy" role={stage==='complete'?'status':undefined} aria-live="polite" key={copy[stage][0]}>
   <Typography variant="subtitle" tone="muted">{copy[stage][1]}</Typography>
  </div>
  {failed&&<Typography className="spp-rf-paper-film-error" variant="bodySmall" tone="muted">部分论文素材加载失败，请重新进入此页。</Typography>}
 </section>
 </div>
 </ContentBlock>;
}
