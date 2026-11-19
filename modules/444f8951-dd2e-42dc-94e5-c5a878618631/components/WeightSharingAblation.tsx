import without_structure_v2Asset0 from "../assets/images/skill-ablation/without-structure-v2.webp";
import without_interaction_v2Asset1 from "../assets/images/skill-ablation/without-interaction-v2.webp";
import without_visual_v2Asset2 from "../assets/images/skill-ablation/without-visual-v2.webp";
import without_format_v2Asset3 from "../assets/images/skill-ablation/without-format-v2.webp";
import weight_sharingAsset4 from '../assets/videos/weight-sharing.mp4';
import { useEffect, useRef } from 'react';
import { Typography } from "@shuku/course-style/react";
import './WeightSharingAblation.css';
const generatedImages = [without_structure_v2Asset0,without_interaction_v2Asset1,without_visual_v2Asset2,without_format_v2Asset3];
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
  return <div shuku-edit-id="e-8296534d-6023-4209-9a7f-802544b9c2dc" className="cg-weight-ablation">
    <div shuku-edit-id="e-73122b11-cb5e-4912-ba01-765121d0aa27" className="cg-constraints-preview-labels"><Typography shuku-edit-id="e-1a9ed6d6-1538-4ce2-8442-99ef25d45eef" variant="bodySmall" tone="muted">未启用</Typography><Typography shuku-edit-id="e-b6378fa0-403b-4d94-96fc-8978f432e8e0" variant="bodySmall" tone="inherit">已启用</Typography></div>
    <div shuku-edit-id="e-479ce941-7a00-4c36-97e0-ce46cb44980b" className="cg-weight-ablation-pair">
      <img shuku-edit-id="e-811bb868-bd60-484f-b884-5e3733035b64" className="cg-weight-generated" src={generatedImages[category]} alt={`缺少${constraintNames[category]}的概念示意`}/>
      <video shuku-edit-id="e-5b1cee2e-81e2-49a2-91fe-ffe052e2e1f9" ref={video} className="cg-weight-original" src={weight_sharingAsset4} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="启用技能后的原动态知识呈现作品" onLoadedMetadata={event=>{const media=event.currentTarget;media.currentTime=0;void media.play().catch(()=>{});}}/>
    </div>
  </div>;
}
