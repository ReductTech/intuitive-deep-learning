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
  return <div shuku-edit-id="e-29592483-411f-4155-aac5-cc653dbffe61" className="cg-weight-ablation">
    <div shuku-edit-id="e-8c838e85-b52d-4bbd-bd9a-4757d6907eee" className="cg-constraints-preview-labels"><Typography shuku-edit-id="e-b3b55df4-ac71-4403-8330-4ae30e81e3f0" variant="bodySmall" tone="muted">未启用</Typography><Typography shuku-edit-id="e-4fd56543-e158-4306-997a-a0bb96321b63" variant="bodySmall" tone="inherit">已启用</Typography></div>
    <div shuku-edit-id="e-4ee16034-ff1b-4b48-a33d-f6e9dadeac59" className="cg-weight-ablation-pair">
      <img shuku-edit-id="e-6b4c0041-9c85-49e7-afd1-15c42b59a48b" className="cg-weight-generated" src={generatedImages[category]} alt={`缺少${constraintNames[category]}的概念示意`}/>
      <video shuku-edit-id="e-b005a1cf-a283-45ea-a3c1-35a41064b87f" ref={video} className="cg-weight-original" src={moduleAssetUrl('videos/weight-sharing.mp4')} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="启用技能后的原动态知识呈现作品" onLoadedMetadata={event=>{const media=event.currentTarget;media.currentTime=0;void media.play().catch(()=>{});}}/>
    </div>
  </div>;
}
