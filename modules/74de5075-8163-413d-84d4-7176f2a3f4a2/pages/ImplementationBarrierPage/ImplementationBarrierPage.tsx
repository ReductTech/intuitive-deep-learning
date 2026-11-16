import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { WishfulBridgeScene } from './WishfulBridgeScene';
import './ImplementationBarrierPage.css';

const supports = [{id:'method',title:'知识储备'},{id:'skill',title:'动手能力'},{id:'effort',title:'人力资源'}] as const;
type Phase = 'intact' | 'falling' | 'gap';
function BridgeStone({ id }: { id: string }) {
  return <svg shuku-edit-id="e-3452475f-156a-42a8-afbc-f82bc68fb8cb" className="rie-bridge-stone" viewBox="0 0 260 154" aria-hidden="true"><defs shuku-edit-id="e-4272da86-8917-4c4f-b25e-f90a6e3b73cf">
    <linearGradient shuku-edit-id="e-fb941e8c-e4d7-4d4b-8d5e-d27ff31d22f9" id={`${id}-top`} x1="0" y1="0" x2="0.3" y2="1"><stop shuku-edit-id="e-1352793e-26fa-4128-b19d-21f9ac3a4976" offset="0" stopColor="#f4f7fc"/><stop shuku-edit-id="e-50256e27-cb81-43d0-bfca-0183a0101d30" offset="1" stopColor="#c3d5ea"/></linearGradient>
    <linearGradient shuku-edit-id="e-3b31eae0-3ec9-44ae-bd37-ef7decfee463" id={`${id}-side`} x1="0" y1="0" x2="0" y2="1"><stop shuku-edit-id="e-2814c699-4bc6-4dcd-9af4-53f082013f12" offset="0" stopColor="#a5bfdc"/><stop shuku-edit-id="e-768d8f5e-2894-48c4-ad9a-5da1e730e8ad" offset="1" stopColor="#7e9fc6"/></linearGradient>
  </defs>
    <path shuku-edit-id="e-1453b445-9b19-4183-bc2d-a8005b3cc401" d="M5 117 Q130 86 255 117 L255 149 Q130 118 5 149Z" fill={`url(#${id}-side)`} stroke="#9eb5d0"/>
    <path shuku-edit-id="e-0c632514-731e-474f-a031-c6e1814dbeff" d="M5 24 Q130 -5 255 24 L255 117 Q130 86 5 117Z" fill={`url(#${id}-top)`} stroke="#bccfe5" strokeWidth="2"/>
    <path shuku-edit-id="e-fbdb286e-d97f-4d9a-bb0c-86c781e4f225" d="M16 29 Q130 4 244 29" fill="none" stroke="#fff" strokeWidth="3" opacity=".8"/>
    <path shuku-edit-id="e-551e61a2-e740-485c-95a8-d238560ca221" d="M22 56l14 9 8-5m172 25-11 7 4 12M73 28l8 10-5 8m100 56 8-8 10 4" fill="none" stroke="#a8bfd9" opacity=".35"/>
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
  return <ContentBlock shuku-edit-id="e-6072894b-980e-4b55-9e4f-7317a33a580c" title="AI 正在改变研究想法的实现方式" subtitle={aiEnabled?'AI 参与知识获取、动手实践与任务协作':'一个想法落地，需要知识储备、动手能力和人力资源'} headingLevel={1} className="rie-barrier" data-scene-id="aee1a1a1-9e6c-4d7c-90e3-25d418c52c4f" data-ai-enabled={aiEnabled} data-bridge-state={phase} data-capture-ready={aiEnabled||phase!=='falling'}>
    <img shuku-edit-id="e-2b5c2031-1cd2-4bdc-bda2-4663533c5175" className="rie-bridge-islands" src={moduleAssetUrl('images/research-background/idea-bridge-islands-v1.jpg')} alt="左岸的想法灯泡与右岸的结果文稿，由研究过程连接"/>
    <div shuku-edit-id="e-b56b7c38-d76b-4d54-95a1-065977ac95f4" className="rie-ai-controls">
      <Button className="rie-ai-toggle" role="switch" aria-checked={aiEnabled} aria-label="AI 协作" onClick={toggle}><Typography shuku-edit-id="e-57dc4850-bd40-496a-b115-7c195fedf775" as="span" variant="h3" tone="accent">{aiEnabled?'关闭 AI 协作':'开启 AI 协作'}</Typography><span shuku-edit-id="e-f5a0f815-8cc5-4417-9df4-3a65283ce791" className="rie-ai-switch-track" aria-hidden="true"><span shuku-edit-id="e-e65aa757-13d8-46a4-8554-309be016c553"/></span></Button>
      <div shuku-edit-id="e-79261904-8155-4ed7-acdb-b3f3ca44973b" className="rie-ai-controls-hint"><Typography shuku-edit-id="e-faa97c5d-0642-4d4f-a465-16974edb42f6" variant="bodySmall" tone="muted">{aiEnabled?'对话修改示意':'点击桥块，观察缺少条件的影响'}</Typography><Button className="rie-bridge-reset" onClick={reset} aria-label={aiEnabled?'重新演示 AI 协作':'恢复完整桥面'}>{aiEnabled?'重播':'重置'}</Button></div>
    </div>
    <div shuku-edit-id="e-2118c4ec-b6aa-440a-8cca-c7bdc13fe785" className="rie-bridge-scene" data-ppt-viewport="研究路径演示：桥块坠落后离开桥面">
      {aiEnabled?<WishfulBridgeScene key={attempt} reducedMotion={reducedMotion}/>:<>
        <Typography shuku-edit-id="e-f48b6ec6-06e7-45c6-b14c-aa4dbd9be090" variant="h2" tone="accent" className="rie-bridge-start">有一个想法</Typography><Typography shuku-edit-id="e-623f9768-a32c-414f-bbe2-cfe2e2238514" variant="h2" tone="accent" className="rie-bridge-end">把它做出来</Typography>
        {supports.map((support,index)=><button shuku-edit-id="e-7ec8087e-10f9-4e58-a19c-bd85b4ada329" key={support.id} type="button" className={`rie-bridge-piece rie-bridge-piece--${index}`} aria-label={`移除${support.title}`} data-support={support.id} onClick={()=>{setRemoved(index);setAttempt(v=>v+1);setPhase('falling');}}>
          <span shuku-edit-id="e-f127167a-70d0-43a6-ac29-23b673b20f22" key={attempt} className={`rie-original-stone${removed!==null?' is-dropped':''}`} style={{'--fall-delay':`${removed===index?0:100+Math.abs(index-(removed??index))*70}ms`} as CSSProperties}><BridgeStone id={`${gradient}-${index}`}/><span shuku-edit-id="e-96f24a24-569b-477f-a68e-fbc745ae41d7" className="rie-bridge-piece-copy"><Typography shuku-edit-id="e-699c797d-dd89-44c3-8209-4e489da0f764" as="span" variant="h2" tone="accent">{support.title}</Typography></span></span>
        </button>)}
      </>}
    </div>
    <div shuku-edit-id="e-af7bce6b-dc11-44ca-a0bc-0b938e4007f8" className="rie-bridge-message"><Typography shuku-edit-id="e-af1fc7b0-a64e-43aa-99d2-d3c113194414" variant="display" tone="accent">{aiEnabled?'“许愿式科研”时代':'“古法科研”时代'}</Typography></div>
  </ContentBlock>;
}
