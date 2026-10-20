import { useEffect, useRef } from 'react';
import { Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './WeightSharingAblation.css';
const generatedImages = ['without-structure-v2.png','without-interaction-v2.png','without-visual-v2.png','without-format-v2.png'].map(name=>moduleAssetUrl(outline.moduleIdentity.id, `images/skill-ablation/${name}`));
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
      <video ref={video} className="cg-weight-original" src={moduleAssetUrl(outline.moduleIdentity.id,'videos/weight-sharing.mp4')} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="启用技能后的原动态课件" onLoadedMetadata={event=>{const media=event.currentTarget;media.currentTime=0;void media.play().catch(()=>{});}}/>
    </div>
  </div>;
}
