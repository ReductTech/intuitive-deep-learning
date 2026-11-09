import without_structure_v2Asset0 from '../assets/images/skill-ablation/without-structure-v2.jpg';
import without_interaction_v2Asset1 from '../assets/images/skill-ablation/without-interaction-v2.jpg';
import without_visual_v2Asset2 from '../assets/images/skill-ablation/without-visual-v2.jpg';
import without_format_v2Asset3 from '../assets/images/skill-ablation/without-format-v2.jpg';
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
  return <div className="cg-weight-ablation">
    <div className="cg-constraints-preview-labels"><Typography variant="bodySmall" tone="muted">未启用</Typography><Typography variant="bodySmall" tone="inherit">已启用</Typography></div>
    <div className="cg-weight-ablation-pair">
      <img className="cg-weight-generated" src={generatedImages[category]} alt={`缺少${constraintNames[category]}的概念示意`}/>
      <video ref={video} className="cg-weight-original" src={weight_sharingAsset4} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="启用技能后的原动态知识呈现作品" onLoadedMetadata={event=>{const media=event.currentTarget;media.currentTime=0;void media.play().catch(()=>{});}}/>
    </div>
  </div>;
}
