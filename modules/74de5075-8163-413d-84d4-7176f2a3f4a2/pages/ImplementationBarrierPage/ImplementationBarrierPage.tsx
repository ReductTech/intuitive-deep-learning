import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { WishfulBridgeScene } from './WishfulBridgeScene';
import './ImplementationBarrierPage.css';

const supports = [{id:'method',title:'知识储备'},{id:'skill',title:'动手能力'},{id:'effort',title:'人力资源'}] as const;
type Phase = 'intact' | 'falling' | 'gap';
function BridgeStone({ id }: { id: string }) {
  return <svg className="rie-bridge-stone" viewBox="0 0 260 154" aria-hidden="true"><defs>
    <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#f4f7fc"/><stop offset="1" stopColor="#c3d5ea"/></linearGradient>
    <linearGradient id={`${id}-side`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a5bfdc"/><stop offset="1" stopColor="#7e9fc6"/></linearGradient>
  </defs>
    <path d="M5 117 Q130 86 255 117 L255 149 Q130 118 5 149Z" fill={`url(#${id}-side)`} stroke="#9eb5d0"/>
    <path d="M5 24 Q130 -5 255 24 L255 117 Q130 86 5 117Z" fill={`url(#${id}-top)`} stroke="#bccfe5" strokeWidth="2"/>
    <path d="M16 29 Q130 4 244 29" fill="none" stroke="#fff" strokeWidth="3" opacity=".8"/>
    <path d="M22 56l14 9 8-5m172 25-11 7 4 12M73 28l8 10-5 8m100 56 8-8 10 4" fill="none" stroke="#a8bfd9" opacity=".35"/>
  </svg>;
}
export function ImplementationBarrierPage() {
  const [removed,setRemoved]=useState<number|null>(null);
  const [aiEnabled,setAiEnabled]=useState(false);
  const [phase,setPhase]=useState<Phase>('intact');
  const [attempt,setAttempt]=useState(0);
  const [reducedMotion,setReducedMotion]=useState(false);
  const gradient=useId().replaceAll(':','');
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReducedMotion(media.matches);
    update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    if(aiEnabled||phase!=='falling')return;
    const timer=window.setTimeout(()=>setPhase('gap'),reducedMotion?0:900);return()=>window.clearTimeout(timer);
  },[aiEnabled,phase,reducedMotion,attempt]);
  useEffect(()=>{
    if(aiEnabled||phase!=='gap')return;
    const timer=window.setTimeout(()=>{setRemoved(null);setPhase('intact');setAttempt(v=>v+1);},2500);return()=>window.clearTimeout(timer);
  },[aiEnabled,phase,attempt]);
  function reset(){setRemoved(null);setPhase('intact');setAttempt(v=>v+1);}
  function toggle(){reset();setAiEnabled(v=>!v);}
  return <ContentBlock title="AI 正在改变研究想法的实现方式" subtitle={aiEnabled?'AI 参与知识获取、动手实践与任务协作':'一个想法落地，需要知识储备、动手能力和人力资源'} headingLevel={1} className="rie-barrier" data-scene-id="aee1a1a1-9e6c-4d7c-90e3-25d418c52c4f" data-ai-enabled={aiEnabled} data-bridge-state={phase} data-capture-ready={aiEnabled||phase!=='falling'}>
    <img className="rie-bridge-islands" src={moduleAssetUrl('images/research-background/idea-bridge-islands-v1.jpg')} alt="左岸的想法灯泡与右岸的结果文稿，由研究过程连接"/>
    <div className="rie-ai-controls">
      <Button className="rie-ai-toggle" role="switch" aria-checked={aiEnabled} aria-label="AI 协作" onClick={toggle}><Typography as="span" variant="h3" tone="accent">{aiEnabled?'关闭 AI 协作':'开启 AI 协作'}</Typography><span className="rie-ai-switch-track" aria-hidden="true"><span/></span></Button>
      <div className="rie-ai-controls-hint"><Typography variant="bodySmall" tone="muted">{aiEnabled?'对话修改示意':'点击桥块，观察缺少条件的影响'}</Typography><Button className="rie-bridge-reset" onClick={reset} aria-label={aiEnabled?'重新演示 AI 协作':'恢复完整桥面'}>{aiEnabled?'重播':'重置'}</Button></div>
    </div>
    <div className="rie-bridge-scene" data-ppt-viewport="研究路径演示：桥块坠落后离开桥面">
      {aiEnabled?<WishfulBridgeScene key={attempt} reducedMotion={reducedMotion}/>:<>
        <Typography variant="h2" tone="accent" className="rie-bridge-start">有一个想法</Typography><Typography variant="h2" tone="accent" className="rie-bridge-end">把它做出来</Typography>
        {supports.map((support,index)=><button key={support.id} type="button" className={`rie-bridge-piece rie-bridge-piece--${index}`} aria-label={`移除${support.title}`} data-support={support.id} onClick={()=>{setRemoved(index);setAttempt(v=>v+1);setPhase('falling');}}>
          <span key={attempt} className={`rie-original-stone${removed!==null?' is-dropped':''}`} style={{'--fall-delay':`${removed===index?0:100+Math.abs(index-(removed??index))*70}ms`} as CSSProperties}><BridgeStone id={`${gradient}-${index}`}/><span className="rie-bridge-piece-copy"><Typography as="span" variant="h2" tone="accent">{support.title}</Typography></span></span>
        </button>)}
      </>}
    </div>
    <div className="rie-bridge-message"><Typography variant="display" tone="accent">{aiEnabled?'“许愿式科研”时代':'“古法科研”时代'}</Typography></div>
  </ContentBlock>;
}
