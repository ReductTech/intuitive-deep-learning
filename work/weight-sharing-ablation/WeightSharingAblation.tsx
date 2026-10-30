import { useEffect, useRef, useState } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './WeightSharingAblation.css';

const generatedImages = [
  new URL('../assets/constraint-examples/weight-sharing/without-structure.png', import.meta.url).href,
  new URL('../assets/constraint-examples/weight-sharing/without-interaction.png', import.meta.url).href,
  new URL('../assets/constraint-examples/weight-sharing/without-visual.png', import.meta.url).href,
  new URL('../assets/constraint-examples/weight-sharing/without-format.png', import.meta.url).href,
];
const constraintNames = ['内容结构','交互行为','视觉风格','页面规范'];
const REFERENCE_TIME = 3;

export function WeightSharingAblation({category}:{category:number}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing,setPlaying] = useState(true);
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
      <div><Button onClick={alignReference}><Typography as="span" variant="bodySmall" tone="inherit">对齐参考帧</Typography></Button><Button onClick={togglePlayback}><Typography as="span" variant="bodySmall" tone="inherit">{playing?'暂停原视频':'播放原视频'}</Typography></Button><Button onClick={()=>setEnlarged(!enlarged)}><Typography as="span" variant="bodySmall" tone="inherit">{enlarged?'收起对比':'放大对比'}</Typography></Button></div>
    </div>
    <div className="cg-constraints-preview-labels"><Typography variant="bodySmall" tone="warning">未使用{constraintNames[category]}约束 · 生成图</Typography><Typography variant="bodySmall" tone="success">使用约束 · 原课件动态</Typography></div>
    <div className="cg-weight-ablation-pair">
      <img className="cg-weight-generated" src={generatedImages[category]} alt={`参考原权重共享页面生成的缺少${constraintNames[category]}约束的效果示意`}/>
      <video ref={video} className="cg-weight-original" src={moduleAssetUrl(outline.moduleIdentity.id,'videos/weight-sharing.mp4')} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="原权重共享动态课件，完整约束基准" onLoadedMetadata={event=>{event.currentTarget.currentTime=REFERENCE_TIME;}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>
    </div>
    <Typography variant="bodySmall" tone="muted" className="cg-weight-ablation-step">生成图以原视频的同一帧为参考，仅表现当前约束缺失时的效果；可暂停视频对照查看。</Typography>
  </div>;
}
