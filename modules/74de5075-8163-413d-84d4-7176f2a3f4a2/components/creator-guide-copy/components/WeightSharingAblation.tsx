import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { useEffect, useRef } from 'react';
import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './WeightSharingAblation.css';
const generatedImages = ['without-structure-v2.jpg','without-interaction-v2.jpg','without-visual-v2.jpg','without-format-v2.jpg'].map(name=>creatorGuideAssetUrl(outline.moduleIdentity.id, `images/skill-ablation/${name}`));
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
  return <div shuku-edit-id="e-6dfb5b3c-850c-4ae4-a6da-0b0a502a4a0d" className="aipe-replay-cg-weight-ablation">
    <div shuku-edit-id="e-4352dcbe-31cd-4f97-af41-fb03345d1e21" className="aipe-replay-cg-constraints-preview-labels"><Typography shuku-edit-id="e-ef1b8a43-b1f7-447b-95b1-af8aafe5307a" variant="bodySmall" tone="muted">未启用</Typography><Typography shuku-edit-id="e-781f1d68-6734-4402-8c75-b0c2a3b90502" variant="bodySmall" tone="inherit">已启用</Typography></div>
    <div shuku-edit-id="e-5249cbc5-35eb-47e9-a4d3-f196ff4a0b82" className="aipe-replay-cg-weight-ablation-pair">
      <img shuku-edit-id="e-9e235b0e-1bed-43f5-b8fb-f18dd86c2b7a" className="aipe-replay-cg-weight-generated" src={generatedImages[category]} alt={`缺少${constraintNames[category]}的概念示意`}/>
      <video shuku-edit-id="e-3caf2d39-f72a-428d-96b1-a6884244d82b" ref={video} className="aipe-replay-cg-weight-original" src={creatorGuideAssetUrl(outline.moduleIdentity.id,'videos/weight-sharing.mp4')} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="启用技能后的原动态知识呈现作品" onLoadedMetadata={event=>{const media=event.currentTarget;media.currentTime=0;void media.play().catch(()=>{});}}/>
    </div>
  </div>;
}
