import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { useEffect, useRef } from 'react';
import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './WeightSharingAblation.css';
const generatedImages = ['without-structure-v2.webp','without-interaction-v2.webp','without-visual-v2.webp','without-format-v2.webp'].map(name=>creatorGuideAssetUrl(outline.moduleIdentity.id, `images/skill-ablation/${name}`));
const constraintNames = ['内容结构','交互行为','视觉风格','页面规范'];
export function WeightSharingAblation({category}:{category:number}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(()=>{
    const media=video.current;
    if(!media)return;
    let resume=false;
    const update=()=>{
      if(document.hidden){resume=!media.paused;media.pause();}
      else if(resume){resume=false;void media.play().catch(()=>{});}
    };
    document.addEventListener('visibilitychange',update);
    return ()=>{document.removeEventListener('visibilitychange',update);media.pause();};
  },[]);
  return <div shuku-edit-id="e-060349ae-7e94-468e-904b-c229c7e31d22" className="aipe-replay-cg-weight-ablation">
    <div shuku-edit-id="e-9b519d66-6f30-47df-b7ac-be27279d858c" className="aipe-replay-cg-constraints-preview-labels"><Typography shuku-edit-id="e-d8c9180d-f1d7-4eb3-8b7a-add2aa67757d" variant="bodySmall" tone="muted">未启用</Typography><Typography shuku-edit-id="e-ed3c33f6-a5ca-4f44-ad36-5d6e064adc75" variant="bodySmall" tone="inherit">已启用</Typography></div>
    <div shuku-edit-id="e-de3582f6-4219-4b04-afbe-2037d1371cb5" className="aipe-replay-cg-weight-ablation-pair">
      <img shuku-edit-id="e-0717072a-f9c5-4650-bf6b-6b17ea81e38c" className="aipe-replay-cg-weight-generated" src={generatedImages[category]} alt={`缺少${constraintNames[category]}的概念示意`}/>
      <video shuku-edit-id="e-d2664988-926b-4fbe-b200-330bb7828ed8" ref={video} className="aipe-replay-cg-weight-original" src={creatorGuideAssetUrl(outline.moduleIdentity.id,'videos/weight-sharing.mp4')} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="启用技能后的原动态知识呈现作品" onLoadedMetadata={event=>{const media=event.currentTarget;media.currentTime=0;void media.play().catch(()=>{});}}/>
    </div>
  </div>;
}
