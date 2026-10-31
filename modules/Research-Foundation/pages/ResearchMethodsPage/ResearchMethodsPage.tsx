import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import sourcePapers from './papers.json';
import './ResearchMethodsPage.css';

const venues: Record<string,string> = {
 'AAAI':'AAAI Conference on Artificial Intelligence', 'ICLR':'International Conference on Learning Representations',
 'NeurIPS':'Conference on Neural Information Processing Systems', 'IJCV':'International Journal of Computer Vision',
 'CVPR':'IEEE/CVF Conference on Computer Vision and Pattern Recognition', 'IEEE TPAMI':'IEEE Transactions on Pattern Analysis and Machine Intelligence',
 'ICCV · Spotlight':'IEEE International Conference on Computer Vision · Spotlight', 'IJCAI':'International Joint Conference on Artificial Intelligence',
 'Computational Visual Media':'Computational Visual Media',
};
const order=['naip','naipv2','tempsamp','realign','tokens','gmm','res2net','attention','segnext','smeasure','emeasure','mstcn'];
const papers=order.map(id=>sourcePapers.find(paper=>paper.id===id)!);
const INTERVAL=2500, TURN=700;
const wrap=(n:number)=>((n%papers.length)+papers.length)%papers.length;
const smooth=(t:number)=>t*t*(3-2*t);
function PaperImage({paper}:{paper:typeof papers[number]}) {
 return paper.id==='tokens'?<div className="rf-wheel-specimen"><Typography variant="bodySmall">International Journal of Computer Vision</Typography><Typography variant="h2">{paper.title}</Typography><Typography variant="bodySmall">2026 · 持续学习</Typography></div>:<img draggable={false} src={moduleAssetUrl(outline.moduleIdentity.id,`research-papers/${paper.id}.png`)} alt={`${paper.name} 论文原稿首页`}/>;
}
export function ResearchMethodsPage() {
 const root=useRef<HTMLElement>(null),elapsed=useRef(0);
 const [phase,setPhase]=useState(0),[available,setAvailable]=useState(false),[reduced,setReduced]=useState(false);
 const active=wrap(Math.round(phase)),paper=papers[active];
 useEffect(()=>{
  const element=root.current;if(!element)return;
  let intersecting=false;
  const visible=()=>setAvailable(intersecting&&!document.hidden);
  const observer=new IntersectionObserver(([entry])=>{intersecting=entry.isIntersecting;visible();});observer.observe(element);
  document.addEventListener('visibilitychange',visible);
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>setReduced(media.matches);motion();media.addEventListener('change',motion);
  return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visible);media.removeEventListener('change',motion);};
 },[]);
 useEffect(()=>{
  if(!available)return;
  let frame=0,last=performance.now();
  const tick=(now:number)=>{
   elapsed.current+=Math.max(0,Math.min(now-last,100));
   const slot=Math.floor(elapsed.current/INTERVAL),local=elapsed.current%INTERVAL;
   const progress=Math.max(0,(local-(INTERVAL-TURN))/TURN);
   setPhase(wrap(slot+(reduced?(progress>=.5?1:0):smooth(progress))));
   last=now;frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[available,reduced]);
 return <section ref={root} className="rf-page rf-wheel" aria-label="连续研究积累：论文轮盘" data-paper-id={paper.id} data-paper-index={active} data-phase={phase.toFixed(3)} data-playing={available}>
  <header className="rf-wheel-heading"><Typography as="h1" variant="h1">连续研究积累</Typography><Typography variant="bodySmall" tone="muted">知识评价 · 视频理解 · 图文对齐 · 持续适配</Typography></header>
  <div className="rf-wheel-stage" aria-label="旋转论文轮盘">
   {papers.map((item,i)=>{
    const angle=(i-phase)*Math.PI*2/papers.length,depth=(Math.cos(angle)+1)/2;
    const difference=Math.abs(wrap(i-phase+papers.length/2)-papers.length/2);
    const focus=Math.max(0,1-difference/.85),isActive=i===active;
    const scale=.28+.72*depth;
    const style:CSSProperties={transform:`translate(-50%,-50%) translate(${Math.sin(angle)*330}px,${Math.cos(angle)*115}px) rotateY(${-Math.sin(angle)*14}deg) scale(${scale})`,zIndex:Math.round(depth*100),opacity:.13+depth*.16+focus*.71,filter:`blur(${(1-focus)*3}px)`};
    return <article key={item.id} className={`rf-wheel-paper${isActive?' is-active':''}`} style={style} aria-hidden={!isActive} data-wheel-paper={item.id}>
     <figure className="rf-wheel-image"><PaperImage paper={item}/></figure>
     <div className="rf-wheel-copy"><Typography variant="bodySmall" className="rf-wheel-area">{item.topic}</Typography><Typography as="h2" variant="h2" className="rf-wheel-title">{item.title}</Typography><Typography variant="bodySmall" className="rf-wheel-publication">{venues[item.venue]??item.venue}</Typography><Typography variant="h3" className="rf-wheel-year"><strong>{item.venue} · {item.year}</strong></Typography></div>
    </article>;
   })}
  </div>

 </section>;
}
