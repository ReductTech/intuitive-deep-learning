import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, UserRound } from './SupplyIcons';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { FLOW_DURATION, PAPER_COUNT, flightKeyframes, flowPaperTransform, paperFlight } from './paperFlow';
import './PersonalizedResearchSupplyPage.css';

const textures=["images/paper-relief/paper-top-single-a.webp","images/paper-relief/paper-top-double-a.webp","images/paper-relief/paper-top-single-figure.webp","images/paper-relief/paper-top-double-table.webp"] as const;
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

  return <ContentBlock shuku-edit-id="e-169ece1c-3205-4711-9742-112a5c9b0e24" className="aipe-supply-page" headingLevel={1} title={outline.pages.find(page => page.id === '1c673e39-9fd4-4402-858e-67185f3125dd')!.title}
    subtitle="依据论文价值与个人目标，筛选值得关注的研究" bodyClassName="aipe-supply-body">
    <div shuku-edit-id="e-5d153f66-2826-492a-ba83-5a997090cc97" ref={worldRef} className={'aipe-flow-world'+(reduced?' is-reduced':'')}
      data-flow-running={ready&&visible&&!reduced} data-flow-ready={ready}
      aria-busy={!ready&&!failed}>
      {textures.map((name,i)=><img shuku-edit-id="e-b180faa5-2a6d-4a1f-b517-06d672638c04" key={name+'-'+retry} className="aipe-flow-preload"
        src={activeTexture(i)} alt="" aria-hidden="true"
        onLoad={event=>{const image=event.currentTarget;void image.decode().then(()=>{
          if(image.isConnected)setLoaded(old=>old.has(i)?old:new Set(old).add(i));
        }).catch(()=>setFailed(true));}}
        onError={()=>setFailed(true)}/>)}
      <div shuku-edit-id="e-763d0451-5968-4437-8ffc-762a082af7ee" className="aipe-flow-scene-description" role="img"
        aria-label="平台按照论文价值、个人兴趣与研究目标筛选论文。论文逐篇进入滤网，精选论文继续向右飞行并逐张落入托盘，其余论文回落至待选区。流程自动循环播放。"/>

      <Typography shuku-edit-id="e-95cd9448-5e39-43bd-8214-f3fc005474b7" as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-input-title">海量论文</Typography>
      <div shuku-edit-id="e-57b8484e-cdef-408c-a0f8-9c5989dd5c2d" className="aipe-flow-goal"><UserRound aria-hidden="true"/>
        <Typography shuku-edit-id="e-b68f5cea-5d93-4ee0-a288-0871adc1c1f5" as="p" variant="bodySmall" tone="inherit">个人兴趣与研究目标</Typography>
        <ArrowDown className="aipe-flow-goal-arrow" aria-hidden="true"/>
      </div>
      <Typography shuku-edit-id="e-83d2af3e-3e1c-46bf-9af5-fced5d4894e5" as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-output-title">精选论文</Typography>

      <div shuku-edit-id="e-61c07645-c747-4a38-ad8e-d3b75ece8b63" className="aipe-flow-source-shadow" aria-hidden="true"/>
      {sourcePapers.map((paper,i)=><div shuku-edit-id="e-05c4575e-8fef-4873-97e4-28d485f4a324" key={i} className="aipe-flow-source-paper" aria-hidden="true"
        style={{left:paper.x,top:paper.y,transform:'rotate('+paper.angle+'deg)',backgroundImage:'url("'+activeTexture(i)+'")'} as CSSProperties}/>)}
      <div shuku-edit-id="e-0bd579bc-93b6-421f-858a-c092845d3992" className="aipe-flow-trail aipe-flow-trail-before" aria-hidden="true"/>
      <div shuku-edit-id="e-928bd7a6-c8c4-40d9-b557-2de49729f62a" className="aipe-flow-trail aipe-flow-trail-after" aria-hidden="true"/>

      <div shuku-edit-id="e-e2488ee8-62d5-4ce1-9044-8958dbc4dd02" className="aipe-flow-mesh-shadow" aria-hidden="true"/>
      <div shuku-edit-id="e-b6622dc7-eb3c-4976-914b-37ee5d5f960d" className="aipe-flow-mesh-foot" aria-hidden="true"/>
      <div shuku-edit-id="e-ba773381-a9c9-4155-a977-5fcc0392c645" className="aipe-flow-mesh" aria-hidden="true">
        <div shuku-edit-id="e-f5220a18-e456-4457-ad84-060c730dee47" className="aipe-flow-mesh-plane"><div shuku-edit-id="e-3d29f150-e5c8-4b33-ae0d-3267c1513a34" className="aipe-flow-mesh-scan"/></div>
      </div>
      <div shuku-edit-id="e-251b6d66-0ed8-4076-a963-209d15d3ae0c" className="aipe-flow-tray-back" aria-hidden="true"/>
      <div shuku-edit-id="e-4ab7b520-5e9a-4837-a76f-11a5a04b4df3" className="aipe-flow-tray-floor" aria-hidden="true"/>
      {flights.map(plan=><div shuku-edit-id="e-24e70afc-497a-4678-bd3a-84d8f5de5aff" key={plan.id} data-flight-id={plan.id} data-selected={plan.selected}
        className={'aipe-flow-paper'+(plan.selected?' is-selected':'')} aria-hidden="true"
        style={{backgroundImage:'url("'+activeTexture(plan.id)+'")'}}>
        {plan.selected&&<span shuku-edit-id="e-f8de6714-9bf2-4b57-ac68-cbda7fbbd4b2" className="aipe-flow-check"><svg shuku-edit-id="e-a9c029e6-5e54-49f0-90e7-8d06a38d3d3e" viewBox="0 0 24 24"><path shuku-edit-id="e-2eabb205-be7b-46d0-a074-1c1db5feb1ed" d="m5 12 4.5 4.5L19 7"/></svg></span>}
      </div>)}
      <div shuku-edit-id="e-73d4a08c-6c7c-4b31-a691-1d3d7027900d" className="aipe-flow-tray-front" aria-hidden="true"/>

      <Typography shuku-edit-id="e-6525addd-e3b0-4f7e-b025-ab0caefc517e" as="p" variant="bodySmall" tone="muted" align="center" className="aipe-flow-input-caption">每天自动分析数百篇</Typography>
      <Typography shuku-edit-id="e-b7898ca8-9a28-45bf-a5c9-1e9d3a6d9ccb" as="h2" variant="h2" tone="accent" align="center" className="aipe-flow-platform-title">平台分析与筛选</Typography>
      <Typography shuku-edit-id="e-1df0a395-f2d3-4bbb-b439-9dec71eeab86" as="p" variant="bodySmall" tone="muted" align="center" className="aipe-flow-methods">论文分析 · 创新性评价 · 个性化推荐</Typography>
      <Typography shuku-edit-id="e-b2265332-b5b8-43a6-9457-0d88c3a81358" as="p" variant="bodySmall" tone="accent" align="center" className="aipe-flow-output-caption">高质量 · 与个人目标匹配</Typography>
      {!ready&&<div shuku-edit-id="e-40de6d05-db2d-431f-8408-148ee280867d" className="aipe-flow-status" role={failed&&retry>=2?'alert':'status'}>
        <Typography shuku-edit-id="e-e4d58e57-efde-495d-8bb9-513512e5fd1b" as="p" variant="bodySmall" tone="muted">{failed&&retry>=2?'论文素材暂未加载，请稍后重新进入此页。':'正在准备论文素材…'}</Typography>
      </div>}
    </div>
    <Typography shuku-edit-id="e-662071c4-cac6-4006-a416-b09080c1ac2f" as="p" variant="h2" tone="accent" align="center" className="aipe-flow-conclusion">
      让有限时间，用在<span shuku-edit-id="e-36181205-7d59-475f-ba82-b30c219157c9">值得关注的研究</span>上
    </Typography>
  </ContentBlock>;
}
