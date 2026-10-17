import { useEffect, useRef, useState } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './WeightSharingAblation.css';

const generatedImages = [
  new URL('../assets/constraint-examples/weight-sharing/without-structure-v2.png', import.meta.url).href,
  new URL('../assets/constraint-examples/weight-sharing/without-interaction-v2.png', import.meta.url).href,
  new URL('../assets/constraint-examples/weight-sharing/without-visual-v2.png', import.meta.url).href,
  new URL('../assets/constraint-examples/weight-sharing/without-format-v2.png', import.meta.url).href,
];
const constraintNames = ['内容结构','交互行为','视觉风格','页面规范'];
const REFERENCE_TIME = 0;

export function WeightSharingAblation({category}:{category:number}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing,setPlaying] = useState(false);
  const [enlarged,setEnlarged] = useState(false);
  useEffect(()=>{
    const media=video.current;
    if(!media)return;
    let resume=false;
    const update=()=>{
      if(document.hidden){resume=!media.paused;media.pause();}
      else if(resume){resume=false;void media.play().catch(()=>setPlaying(false));}
    };
    document.addEventListener('visibilitychange',update);
    return ()=>{document.removeEventListener('visibilitychange',update);media.pause();};
  },[]);
  const alignReference = () => {
    const media = video.current;
    if (!media) return;
    media.pause();
    media.currentTime = REFERENCE_TIME;
  };
  const togglePlayback = () => {
    const media = video.current;
    if (!media) return;
    if (media.paused) void media.play().catch(()=>setPlaying(false));
    else media.pause();
  };
  return <div className={`cg-weight-ablation${enlarged?' is-enlarged':''}`}>
    <div className="cg-weight-ablation-controls">
      <Typography variant="bodySmall" tone="muted">左侧生成效果图 · 右侧原动态课件</Typography>
      <div><Button onClick={alignReference}><Typography as="span" variant="bodySmall" tone="inherit">回到视频开头</Typography></Button><Button onClick={togglePlayback}><Typography as="span" variant="bodySmall" tone="inherit">{playing?'暂停原视频':'播放原视频'}</Typography></Button><Button onClick={()=>setEnlarged(!enlarged)}><Typography as="span" variant="bodySmall" tone="inherit">{enlarged?'收起对比':'放大对比'}</Typography></Button></div>
    </div>
    <div className="cg-constraints-preview-labels"><Typography variant="bodySmall" tone="warning">未使用{constraintNames[category]}约束 · 生成图</Typography><Typography variant="bodySmall" tone="success">使用约束 · 原课件动态</Typography></div>
    <div className="cg-weight-ablation-pair">
      <img className="cg-weight-generated" src={generatedImages[category]} alt={`重新设计的权重共享课件：推演缺少${constraintNames[category]}约束的效果`}/>
      <video ref={video} className="cg-weight-original" src={moduleAssetUrl(outline.moduleIdentity.id,'videos/weight-sharing.mp4')} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="原权重共享动态课件，完整约束基准" onLoadedMetadata={event=>{const media=event.currentTarget;media.currentTime=REFERENCE_TIME;void media.play().catch(()=>setPlaying(false));}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>
    </div>
    <Typography variant="bodySmall" tone="muted" className="cg-weight-ablation-step">同一教学主题的两种呈现：左侧重新生成缺少当前约束的课件，右侧保留原动态课件。</Typography>
  </div>;
}
