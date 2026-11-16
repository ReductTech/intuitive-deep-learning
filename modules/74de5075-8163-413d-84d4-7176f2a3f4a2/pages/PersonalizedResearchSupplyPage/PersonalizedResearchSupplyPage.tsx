import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, UserRound } from './SupplyIcons';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { FLOW_DURATION, PAPER_COUNT, flightKeyframes, flowPaperTransform, paperFlight } from './paperFlow';
import './PersonalizedResearchSupplyPage.css';

const textures=['images/paper-relief/paper-top-single-a.jpg','images/paper-relief/paper-top-double-a.jpg','images/paper-relief/paper-top-single-figure.jpg','images/paper-relief/paper-top-double-table.jpg'] as const;
const textureUrl=(i:number)=>moduleAssetUrl(textures[i%textures.length]);
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

  return <ContentBlock shuku-edit-id="e-a0ec5d78-b06b-410d-a845-7e222fa02517" className="aipe-supply-page" headingLevel={1} title={outline.pages.find(page => page.id === '53c7df3e-7d4c-4501-86ff-459e78985dc7')!.title}
    subtitle="依据论文价值与个人目标，筛选值得关注的研究" bodyClassName="aipe-supply-body">
    <div shuku-edit-id="e-a4f54b6a-18ad-472d-804d-4202636392c5" ref={worldRef} className={'aipe-flow-world'+(reduced?' is-reduced':'')}
      data-flow-running={ready&&visible&&!reduced} data-flow-ready={ready}
      aria-busy={!ready&&!failed}>
      {textures.map((name,i)=><img shuku-edit-id="e-0f25e8d9-3960-4b82-aab9-0f7fdaa0a46d" key={name+'-'+retry} className="aipe-flow-preload"
        src={activeTexture(i)} alt="" aria-hidden="true"
        onLoad={event=>{const image=event.currentTarget;void image.decode().then(()=>{
          if(image.isConnected)setLoaded(old=>old.has(i)?old:new Set(old).add(i));
        }).catch(()=>setFailed(true));}}
        onError={()=>setFailed(true)}/>)}
      <div shuku-edit-id="e-c4d6acf2-853f-4765-b69d-b084b0b388d8" className="aipe-flow-scene-description" role="img"
        aria-label="平台按照论文价值、个人兴趣与研究目标筛选论文。论文逐篇进入滤网，精选论文继续向右飞行并逐张落入托盘，其余论文回落至待选区。流程自动循环播放。"/>

      <Typography shuku-edit-id="e-129e21e8-41c2-4bf0-9973-d1c565bb0c75" as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-input-title">海量论文</Typography>
      <div shuku-edit-id="e-b9fec0fc-b27c-40c1-a5ad-5d2cff84a18f" className="aipe-flow-goal"><UserRound aria-hidden="true"/>
        <Typography shuku-edit-id="e-1b7ee928-cc03-4838-81b9-08620e742336" as="p" variant="bodySmall" tone="inherit">个人兴趣与研究目标</Typography>
        <ArrowDown className="aipe-flow-goal-arrow" aria-hidden="true"/>
      </div>
      <Typography shuku-edit-id="e-ceb3228c-f600-4ec2-8ab4-538d4ecd969f" as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-output-title">精选论文</Typography>

      <div shuku-edit-id="e-24343161-523b-4124-8c26-64403cdf31da" className="aipe-flow-source-shadow" aria-hidden="true"/>
      {sourcePapers.map((paper,i)=><div shuku-edit-id="e-67e97fab-671b-4a27-a956-e8581c84519f" key={i} className="aipe-flow-source-paper" aria-hidden="true"
        style={{left:paper.x,top:paper.y,transform:'rotate('+paper.angle+'deg)',backgroundImage:'url("'+activeTexture(i)+'")'} as CSSProperties}/>)}
      <div shuku-edit-id="e-1c708f16-5de7-479c-9a11-12b647820120" className="aipe-flow-trail aipe-flow-trail-before" aria-hidden="true"/>
      <div shuku-edit-id="e-59f64134-f24c-4c07-81be-788320586176" className="aipe-flow-trail aipe-flow-trail-after" aria-hidden="true"/>

      <div shuku-edit-id="e-257d2f3f-6dbd-4303-85ff-529586549f60" className="aipe-flow-mesh-shadow" aria-hidden="true"/>
      <div shuku-edit-id="e-dc7cfd73-fbaa-43bb-9e46-38136be9053d" className="aipe-flow-mesh-foot" aria-hidden="true"/>
      <div shuku-edit-id="e-b14e3d35-70dd-4b2d-9df3-d0edd62b4611" className="aipe-flow-mesh" aria-hidden="true">
        <div shuku-edit-id="e-66e3f633-b263-4bdf-b807-831a5f268980" className="aipe-flow-mesh-plane"><div shuku-edit-id="e-fd8dc78e-b40c-4f66-8168-eccb9bf11cd4" className="aipe-flow-mesh-scan"/></div>
      </div>
      <div shuku-edit-id="e-f99ed76d-37bf-4b99-a465-15174e210c22" className="aipe-flow-tray-back" aria-hidden="true"/>
      <div shuku-edit-id="e-61c87816-01c8-474c-ab43-796e7639ebc6" className="aipe-flow-tray-floor" aria-hidden="true"/>
      {flights.map(plan=><div shuku-edit-id="e-9e84ace9-bc49-4d69-bf0a-c7f9fbf43575" key={plan.id} data-flight-id={plan.id} data-selected={plan.selected}
        className={'aipe-flow-paper'+(plan.selected?' is-selected':'')} aria-hidden="true"
        style={{backgroundImage:'url("'+activeTexture(plan.id)+'")'}}>
        {plan.selected&&<span shuku-edit-id="e-70f43c1c-f976-422d-a825-6703d0df61ce" className="aipe-flow-check"><svg shuku-edit-id="e-e13993ef-1a50-4f7b-bab4-5b3ac72c7d59" viewBox="0 0 24 24"><path shuku-edit-id="e-62475f5b-730d-4406-87df-55bc8139b5c4" d="m5 12 4.5 4.5L19 7"/></svg></span>}
      </div>)}
      <div shuku-edit-id="e-611bb56f-177d-4366-80a5-23139f5bb737" className="aipe-flow-tray-front" aria-hidden="true"/>

      <Typography shuku-edit-id="e-71ddcc7e-4d91-409e-9ed4-40ad766ba7c1" as="p" variant="bodySmall" tone="muted" align="center" className="aipe-flow-input-caption">每天自动分析数百篇</Typography>
      <Typography shuku-edit-id="e-9e7e7f52-51b2-4c1b-8a87-f46adcf5b33f" as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-platform-title">平台分析与筛选</Typography>
      <Typography shuku-edit-id="e-7664e75b-7edf-429c-bea8-e4356c9321f0" as="p" variant="bodySmall" tone="muted" align="center" className="aipe-flow-methods">论文分析 · 创新性评价 · 个性化推荐</Typography>
      <Typography shuku-edit-id="e-bd56c493-30b1-4bef-947c-113565ba2b47" as="p" variant="bodySmall" tone="accent" align="center" className="aipe-flow-output-caption">高质量 · 与个人目标匹配</Typography>
      {!ready&&<div shuku-edit-id="e-74218038-17de-4404-a2f4-5b6ac05e11fc" className="aipe-flow-status" role={failed&&retry>=2?'alert':'status'}>
        <Typography shuku-edit-id="e-25fd78eb-fb60-4775-9921-42edcae7e11d" as="p" variant="bodySmall" tone="muted">{failed&&retry>=2?'论文素材暂未加载，请稍后重新进入此页。':'正在准备论文素材…'}</Typography>
      </div>}
    </div>
    <Typography shuku-edit-id="e-de1be8a0-d38e-467d-9e71-a00a2dd4686d" as="p" variant="h2" tone="accent" align="center" className="aipe-flow-conclusion">
      让有限时间，用在<span shuku-edit-id="e-36aac3de-41be-4317-afba-a9db7edf5346">值得关注的研究</span>上
    </Typography>
  </ContentBlock>;
}
