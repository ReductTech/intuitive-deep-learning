import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, List, Pause, Play, RotateCcw, X } from 'lucide-react';
import { Button, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import papers from './papers.json';
import './ResearchMethodsPage.css';

const DURATION = 11000;
export function ResearchMethodsPage() {
 const root = useRef<HTMLElement>(null);
 const [index,setIndex] = useState(0), [playing,setPlaying] = useState(true), [directory,setDirectory] = useState(false);
 const [available,setAvailable] = useState(false), [reduced,setReduced] = useState(false), [progress,setProgress] = useState(0);
 const elapsed = useRef(0), frame = useRef(0);
 const paper = papers[index];
 useEffect(() => {
  const node = root.current; if (!node) return;
  let intersecting = false;
  const update = () => setAvailable(intersecting && !document.hidden);
  const observer = new IntersectionObserver(([entry]) => {intersecting=entry.isIntersecting;update();});
  observer.observe(node); document.addEventListener('visibilitychange',update);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => {setReduced(media.matches); if(media.matches)setPlaying(false);}; motion(); media.addEventListener('change',motion);
  return () => {observer.disconnect();document.removeEventListener('visibilitychange',update);media.removeEventListener('change',motion);};
 },[]);
 useEffect(() => {
  if(!playing || !available || directory)return;
  let last = performance.now();
  const tick = (now:number) => {
   elapsed.current += Math.min(now-last,100); last=now;
   if(elapsed.current >= DURATION){elapsed.current=0;setProgress(0);setIndex(i=>(i+1)%papers.length);}
   else setProgress(elapsed.current/DURATION);
   frame.current=requestAnimationFrame(tick);
  };
  frame.current=requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame.current);
 },[playing,available,directory]);
 function go(next:number){elapsed.current=0;setProgress(0);setIndex((next+papers.length)%papers.length);}
 function choose(next:number){go(next);setDirectory(false);setPlaying(false);}
 return <section ref={root} className="rf-page rf-cinema" aria-label="研究基础二：代表性论文循环介绍" data-paper-id={paper.id} data-paper-index={index} data-playing={playing} data-reduced-motion={reduced}>
  <header className="rf-cinema-header">
   <Typography variant="bodySmall" className="rf-cinema-eyebrow"><span/>研究基础二 <span className="rf-cinema-header-sep">/</span> 代表性科研成果</Typography>
   <Typography variant="bodySmall" tone="muted">程明明团队 · 南开大学</Typography>
  </header>
  <main className="rf-cinema-stage" key={paper.id} aria-live={playing?'off':'polite'}>
   <div className="rf-cinema-copy">
    <Typography variant="h1" className="rf-cinema-area">{paper.area}</Typography>
    <Typography as="h2" variant="display" className={'rf-cinema-name'+(paper.name.length>16?' is-long':'')}><strong>{paper.name}</strong></Typography>
    <Typography variant="h2" className="rf-cinema-topic">{paper.topic}</Typography>
    <Typography variant="body" className="rf-cinema-intro">{paper.intro}</Typography>
    <Typography variant="bodySmall" tone="muted" className="rf-cinema-detail">{paper.detail}</Typography>
    <div className="rf-cinema-evidence">
     <Typography variant="h2" className="rf-cinema-venue"><strong>{paper.venue}</strong><span>{paper.year}</span></Typography>
     {paper.citations!==null ? <div className="rf-cinema-citations"><Typography variant="display"><strong>{paper.citations.toLocaleString('en-US')}{paper.id==='mstcn'?'*':''}</strong></Typography><Typography variant="bodySmall">次引用</Typography></div>:<Typography variant="bodySmall" tone="muted">{paper.area} · 代表性研究</Typography>}
    </div>
    <a href={paper.url} target="_blank" rel="noreferrer" className="rf-cinema-source"><Typography as="span" variant="bodySmall">阅读论文原文</Typography><ArrowUpRight size={20}/></a>
   </div>
   <figure className="rf-cinema-visual">
    <div className="rf-cinema-paper">{paper.id==='tokens'?<div className="rf-cinema-abstract"><Typography variant="bodySmall">International Journal of Computer Vision · 2026</Typography><Typography variant="h1"><strong>Token Evolution</strong></Typography><Typography variant="h3">持续学习中的多模态表征演化</Typography><div>{['Token 演化','语义迁移','知识保留'].map(text=><Typography key={text} variant="body">{text}</Typography>)}</div><Typography variant="bodySmall" tone="muted">Xusheng Cao et al. · Ming-Ming Cheng</Typography></div>:<img src={moduleAssetUrl(outline.moduleIdentity.id,`research-papers/${paper.id}.png`)} alt={paper.title+'，论文原稿首页'} />}</div>
    <figcaption><Typography variant="bodySmall" tone="muted">{paper.title}</Typography></figcaption>
   </figure>
  </main>
  <footer className="rf-cinema-footer" onKeyDown={event=>event.stopPropagation()}>
   <div className="rf-cinema-timeline" aria-label="全部 12 篇论文">{papers.map((item,i)=><button key={item.id} onClick={()=>choose(i)} aria-label={`第 ${i+1} 篇：${item.name}`} aria-pressed={i===index} className={i===index?'is-current':''}><span style={{transform:`scaleX(${i===index?progress:i<index?1:0})`}}/><Typography as="span" variant="bodySmall">{String(i+1).padStart(2,'0')}</Typography></button>)}</div>
   <div className="rf-cinema-footer-row">
    <Typography variant="bodySmall" tone="muted">{String(index+1).padStart(2,'0')} / {papers.length} <span className="rf-cinema-source-note">{paper.citations!==null?'引用：用户提供的 Scholar 快照；* 保留原标记':'论文信息：作者主页与论文原稿'}</span></Typography>
    <div className="rf-cinema-controls">
     <Button onClick={()=>setDirectory(true)} aria-label="全部论文目录"><List size={19}/><Typography as="span" variant="bodySmall">全部论文</Typography></Button>
     <Button onClick={()=>{setPlaying(false);go(index-1);}} aria-label="上一篇论文"><ChevronLeft size={22}/></Button>
     <Button variant="primary" onClick={()=>setPlaying(v=>!v)} aria-label={playing?'暂停轮播':'播放轮播'}>{playing?<Pause size={20}/>:<Play size={20}/>}</Button>
     <Button onClick={()=>{setPlaying(false);go(index+1);}} aria-label="下一篇论文"><ChevronRight size={22}/></Button>
     <Button onClick={()=>{go(0);setPlaying(false);}} aria-label="重置轮播"><RotateCcw size={18}/></Button>
    </div>
   </div>
  </footer>
  {directory&&<div className="rf-cinema-directory" role="dialog" aria-modal="true" aria-label="全部论文目录" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setDirectory(false);}}>
   <header><Typography variant="h1">12 篇代表性研究</Typography><Button autoFocus onClick={()=>setDirectory(false)} aria-label="关闭论文目录"><X/></Button></header>
   <div className="rf-cinema-directory-grid">{papers.map((item,i)=><button key={item.id} onClick={()=>choose(i)}><Typography variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')} · {item.area}</Typography><Typography variant="h3"><strong>{item.name}</strong></Typography><Typography variant="bodySmall">{item.topic}</Typography><Typography variant="bodySmall" className="rf-cinema-venue"><strong>{item.venue} · {item.year}</strong></Typography></button>)}</div>
  </div>}
 </section>;
}
