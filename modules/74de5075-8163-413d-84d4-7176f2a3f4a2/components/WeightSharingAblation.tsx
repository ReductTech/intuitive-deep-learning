import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef } from 'react';
import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './WeightSharingAblation.css';
const generatedImages = ['without-structure-v2.webp','without-interaction-v2.webp','without-visual-v2.webp','without-format-v2.webp'].map(name=>moduleAssetUrl(`images/skill-ablation/${name}`));
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
  return <div shuku-edit-id="e-3b0166fa-e22a-402e-a4a9-7ec2e132468d" className="cg-weight-ablation">
    <div shuku-edit-id="e-7b957fb6-3c65-47c6-b8d4-0b8ecdf195f0" className="cg-constraints-preview-labels"><Typography shuku-edit-id="e-6425746b-e83b-46ee-91b2-d003b5994573" variant="bodySmall" tone="muted">未启用</Typography><Typography shuku-edit-id="e-4dec66f5-8ba6-4135-ab77-70fbc0e8e2c6" variant="bodySmall" tone="inherit">已启用</Typography></div>
    <div shuku-edit-id="e-52796044-7f6a-49ce-82a8-0b6411d93391" className="cg-weight-ablation-pair">
      <img shuku-edit-id="e-abda4bac-7cef-4e07-910f-386ae5ea902e" className="cg-weight-generated" src={generatedImages[category]} alt={`缺少${constraintNames[category]}的概念示意`}/>
      <video shuku-edit-id="e-223b7523-d7d0-49d9-a40a-5f346cb9f449" ref={video} className="cg-weight-original" src={moduleAssetUrl('videos/weight-sharing.mp4')} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="启用技能后的原动态知识呈现作品" onLoadedMetadata={event=>{const media=event.currentTarget;media.currentTime=0;void media.play().catch(()=>{});}}/>
    </div>
  </div>;
}
