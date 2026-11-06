import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, UserRound } from './SupplyIcons';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import { FLOW_DURATION, PAPER_COUNT, flightKeyframes, flowPaperTransform, paperFlight } from './paperFlow';
import './PersonalizedResearchSupplyPage.css';

const textures=['paper-top-single-a','paper-top-double-a','paper-top-single-figure','paper-top-double-table'] as const;
const textureUrl=(i:number)=>moduleAssetUrl(outline.moduleIdentity.id,'images/paper-relief/'+textures[i%textures.length]+'.png');
const flights=Array.from({length:PAPER_COUNT},(_,id)=>paperFlight(id));
const sourcePapers=Array.from({length:23},(_,i)=>({
  x:35+(i%5)*62+(Math.floor(i/5)%2)*19,
  y:225+Math.floor(i/5)*36,
  angle:-18+(i*13)%34,
}));

export function PersonalizedResearchSupplyPage(){
  const worldRef=useRef<HTMLDivElement>(null);
  const animations=useRef<Animation[]>([]);
  const [loaded,setLoaded]=useState<Set<number>>(()=>new Set());
  const [failed,setFailed]=useState(false);
  const [retry,setRetry]=useState(0);
  const [visible,setVisible]=useState(false);
  const [reduced,setReduced]=useState(false);
  const ready=loaded.size===textures.length&&!failed;
  const activeTexture=(i:number)=>textureUrl(i)+(retry?'?retry='+retry:'');

  useEffect(()=>{
    const node=worldRef.current;
    if(!node)return;
    let inView=false;
    const update=()=>setVisible(inView&&!document.hidden);
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;update();},{threshold:.1});
    observer.observe(node);
    document.addEventListener('visibilitychange',update);
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const motion=()=>setReduced(media.matches);
    motion();media.addEventListener('change',motion);
    return ()=>{observer.disconnect();document.removeEventListener('visibilitychange',update);media.removeEventListener('change',motion);};
  },[]);

  useEffect(()=>{
    if(!failed||retry>=2)return;
    const timer=setTimeout(()=>{setLoaded(new Set());setFailed(false);setRetry(n=>n+1);},1000);
    return ()=>clearTimeout(timer);
  },[failed,retry]);

  useEffect(()=>{
    const node=worldRef.current;
    if(!node||!ready)return;
    const created:Animation[]=[];
    node.querySelectorAll<HTMLElement>('[data-flight-id]').forEach(paper=>{
      const plan=flights[Number(paper.dataset.flightId)];
      const mark=paper.querySelector<HTMLElement>('.aipe-flow-check');
      if(reduced){
        paper.style.transform=flowPaperTransform(plan.landed);
        paper.style.opacity=plan.selected?'1':'0';
        paper.style.zIndex='18';
        if(mark)mark.style.opacity='1';
        return;
      }
      paper.style.removeProperty('transform');paper.style.removeProperty('opacity');paper.style.removeProperty('z-index');
      const animation=paper.animate(flightKeyframes(plan),{duration:FLOW_DURATION,delay:plan.delay,iterations:Infinity,fill:'both'});
      created.push(animation);
      if(mark)created.push(mark.animate([
        {offset:0,opacity:0,transform:'scale(.5)'},{offset:1900/FLOW_DURATION,opacity:0,transform:'scale(.5)'},
        {offset:2250/FLOW_DURATION,opacity:1,transform:'scale(1.12)'},{offset:2450/FLOW_DURATION,opacity:1,transform:'scale(1)'},
        {offset:11000/FLOW_DURATION,opacity:1},{offset:11900/FLOW_DURATION,opacity:0},{offset:1,opacity:0},
      ],{duration:FLOW_DURATION,delay:plan.delay,iterations:Infinity,fill:'both'}));
    });
    animations.current=created;
    created.forEach(animation=>animation.pause());
    return ()=>{created.forEach(animation=>animation.cancel());animations.current=[];};
  },[ready,reduced]);

  useEffect(()=>{
    animations.current.forEach(animation=>{if(ready&&visible&&!reduced)animation.play();else animation.pause();});
  },[ready,visible,reduced]);

  return <ContentBlock className="aipe-supply-page" headingLevel={1} title={outline.pages[5].title}
    subtitle="依据论文价值与个人目标，筛选值得关注的研究" bodyClassName="aipe-supply-body">
    <div ref={worldRef} className={'aipe-flow-world'+(reduced?' is-reduced':'')}
      data-flow-running={ready&&visible&&!reduced} data-flow-ready={ready}
      aria-busy={!ready&&!failed}>
      {textures.map((name,i)=><img key={name+'-'+retry} className="aipe-flow-preload"
        src={activeTexture(i)} alt="" aria-hidden="true"
        onLoad={event=>{const image=event.currentTarget;void image.decode().then(()=>{
          if(image.isConnected)setLoaded(old=>old.has(i)?old:new Set(old).add(i));
        }).catch(()=>setFailed(true));}}
        onError={()=>setFailed(true)}/>)}
      <div className="aipe-flow-scene-description" role="img"
        aria-label="平台按照论文价值、个人兴趣与研究目标筛选论文。论文逐篇进入滤网，精选论文继续向右飞行并逐张落入托盘，其余论文回落至待选区。流程自动循环播放。"/>

      <Typography as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-input-title">海量论文</Typography>
      <div className="aipe-flow-goal"><UserRound aria-hidden="true"/>
        <Typography as="p" variant="bodySmall" tone="inherit">个人兴趣与研究目标</Typography>
        <ArrowDown className="aipe-flow-goal-arrow" aria-hidden="true"/>
      </div>
      <Typography as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-output-title">精选论文</Typography>

      <div className="aipe-flow-source-shadow" aria-hidden="true"/>
      {sourcePapers.map((paper,i)=><div key={i} className="aipe-flow-source-paper" aria-hidden="true"
        style={{left:paper.x,top:paper.y,transform:'rotate('+paper.angle+'deg)',backgroundImage:'url("'+activeTexture(i)+'")'} as CSSProperties}/>)}
      <div className="aipe-flow-trail aipe-flow-trail-before" aria-hidden="true"/>
      <div className="aipe-flow-trail aipe-flow-trail-after" aria-hidden="true"/>

      <div className="aipe-flow-mesh-shadow" aria-hidden="true"/>
      <div className="aipe-flow-mesh-foot" aria-hidden="true"/>
      <div className="aipe-flow-mesh" aria-hidden="true">
        <div className="aipe-flow-mesh-plane"><div className="aipe-flow-mesh-scan"/></div>
      </div>
      <div className="aipe-flow-tray-back" aria-hidden="true"/>
      <div className="aipe-flow-tray-floor" aria-hidden="true"/>
      {flights.map(plan=><div key={plan.id} data-flight-id={plan.id} data-selected={plan.selected}
        className={'aipe-flow-paper'+(plan.selected?' is-selected':'')} aria-hidden="true"
        style={{backgroundImage:'url("'+activeTexture(plan.id)+'")'}}>
        {plan.selected&&<span className="aipe-flow-check"><svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg></span>}
      </div>)}
      <div className="aipe-flow-tray-front" aria-hidden="true"/>

      <Typography as="p" variant="bodySmall" tone="muted" align="center" className="aipe-flow-input-caption">每天自动分析数百篇</Typography>
      <Typography as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-platform-title">平台分析与筛选</Typography>
      <Typography as="p" variant="bodySmall" tone="muted" align="center" className="aipe-flow-methods">论文分析 · 创新性评价 · 个性化推荐</Typography>
      <Typography as="p" variant="bodySmall" tone="accent" align="center" className="aipe-flow-output-caption">高质量 · 与个人目标匹配</Typography>
      {!ready&&<div className="aipe-flow-status" role={failed&&retry>=2?'alert':'status'}>
        <Typography as="p" variant="bodySmall" tone="muted">{failed&&retry>=2?'论文素材暂未加载，请稍后重新进入此页。':'正在准备论文素材…'}</Typography>
      </div>}
    </div>
    <Typography as="p" variant="h2" tone="accent" align="center" className="aipe-flow-conclusion">
      让有限时间，用在<span>值得关注的研究</span>上
    </Typography>
  </ContentBlock>;
}
