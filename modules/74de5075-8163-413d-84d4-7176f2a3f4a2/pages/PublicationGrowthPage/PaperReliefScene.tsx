import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { allocatePaperStacks, readerPose } from './paperStacks';
import { projectPaperPage } from './paperPerspective';

const topSheets = ["images/research-background/paper-relief/paper-top-single-a.webp", "images/research-background/paper-relief/paper-top-double-a.webp",
  "images/research-background/paper-relief/paper-top-single-figure.webp", "images/research-background/paper-relief/paper-top-double-table.webp"] as const;
const assets = ["images/research-background/paper-relief/room-calm.webp","images/research-background/paper-relief/desk.webp",...topSheets,"images/research-background/paper-relief/calendar-stand.webp","images/research-background/paper-relief/reader-relaxed.webp","images/research-background/paper-relief/reader-focused.webp","images/research-background/paper-relief/reader-defeated.webp"] as const;
type Asset = typeof assets[number];
const image = (file: Asset) => moduleAssetUrl(file);
const poseLabels = { relaxed:'挠着后脑勺靠在椅子上', focused:'认真地俯身写字', defeated:'无奈地瘫在椅子上，放弃抵抗' };

export function PaperReliefScene({year,previousYear,count,onReadyChange}:{year:number;previousYear:number|null;count:number;onReadyChange:(ready:boolean)=>void}) {
  const [loaded,setLoaded] = useState<Set<Asset>>(() => new Set());
  const [failed,setFailed] = useState<Set<Asset>>(() => new Set());
  const [retry,setRetry] = useState(0);
  const roomRef = useRef<HTMLDivElement>(null);
  const [size,setSize] = useState<{width:number;height:number}|null>(null);
  useLayoutEffect(() => {
    const node = roomRef.current;
    if (!node) return;
    const measure = () => setSize({width:node.clientWidth,height:node.clientHeight});
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  },[]);
  const pose = readerPose(year);
  const stacks = allocatePaperStacks(count);
  const ready = loaded.size === assets.length && !failed.size && size !== null;
  useEffect(() => { onReadyChange(ready); }, [ready,onReadyChange]);

  return <div shuku-edit-id="e-2afd9095-3153-45d6-b51b-d24675c3ad30" ref={roomRef} className="rie-paper-room" data-pose={pose} data-paper-count={count} aria-busy={!ready && !failed.size}>
    {assets.map(name => <img shuku-edit-id="e-7739ed50-586f-47dd-a38d-652a59f335df" key={`${name}-${retry}`} src={image(name)}
      className={`rie-paper-asset rie-paper-${name === 'images/research-background/paper-relief/room-calm.webp' ? 'background' : name.includes('/paper-top-') ? 'texture' : name.split('/').pop()!.replace(/\.[^.]+$/, '')}${name === `images/research-background/paper-relief/reader-${pose}.webp` ? ' is-active' : ''}`}
      alt="" aria-hidden="true" draggable={false}
      onLoad={event => {
        const node = event.currentTarget;
        void node.decode().then(() => setLoaded(old => old.has(name) ? old : new Set(old).add(name)))
          .catch(() => setFailed(old => new Set(old).add(name)));
      }}
      onError={() => setFailed(old => new Set(old).add(name))}
    />)}
    <span shuku-edit-id="e-2d2b988e-0efc-4976-a3cf-2e6f8d7a95c1" className="rie-paper-scene-description" role="img" aria-label={`${year} 年，${count.toLocaleString('en-US')} 篇投稿；人物${poseLabels[pose]}，论文在桌面和地面的固定位置逐渐堆高。`} />
    {size && stacks.map((slot, stackIndex) => {
      const width = slot.width / 100 * size.width;
      const frontY = slot.y / 100 * size.height - slot.height / 650 * size.height;
      const plane = projectPaperPage(width, slot.x / 100 * size.width, frontY,
        size.width / 2, -size.height * .79);
      const topSheet = topSheets[(stackIndex * 3 + Math.floor(stackIndex / topSheets.length)) % topSheets.length];
      return <div shuku-edit-id="e-9848e052-87a9-4011-a139-258dec5a06d8" key={slot.id} className={`rie-paper-pile${plane.showsLeftSide ? ' shows-left-side' : ''}`}
      data-stack-id={slot.id} data-surface={slot.surface} data-papers={slot.papers} data-height={slot.height} data-top-sheet={topSheet.split('/').pop()!.replace(/\.[^.]+$/, '')}
      aria-hidden="true" style={{
        left:`${slot.x}%`, bottom:`${100-slot.y}%`, width:`${slot.width}%`,
        zIndex:slot.layer, opacity:slot.papers > 0 ? 1 : 0,
        '--pile-height':slot.height / 650 * 100,
        '--pile-depth':`${plane.depth}px`,
        '--pile-side':`${plane.sideWidth}px`,
      } as CSSProperties}>
      <div shuku-edit-id="e-be2e4a1d-975a-42e2-85ed-de3376faa736" className="rie-paper-pile-front" />
      <div shuku-edit-id="e-b1368e22-b6ad-4b3d-ac59-5516220b247a" className="rie-paper-pile-side" />
      <div shuku-edit-id="e-b64f8747-47c1-4a63-8eb1-b7d7b5cda14e" className="rie-paper-pile-top" style={{height:plane.sourceHeight,
        transform:plane.transform,backgroundImage:`url("${image(topSheet)}")`}} />
    </div>;})}
    {size && <div shuku-edit-id="e-e1047f3c-50d1-44d0-9aa0-f308da3b925f" className="rie-paper-reading-page" aria-hidden="true">
      {(["images/research-background/paper-relief/paper-top-double-a.webp","images/research-background/paper-relief/paper-top-single-figure.webp"] as const).map((sheet,i) => {
        const plane = projectPaperPage(size.width * .075, size.width * (.465 + i * .075),
          size.height * .43, size.width / 2, -size.height * .79);
        return <div shuku-edit-id="e-b6b6b3a3-a1d4-4827-be29-080da30b3858" key={sheet} className="rie-paper-reading-sheet" style={{left:`${i*50}%`,
          height:plane.sourceHeight,transform:plane.transform,backgroundImage:`url("${image(sheet)}")`}} />;
      })}
    </div>}
    <div shuku-edit-id="e-2fba9eb7-38c7-4cb1-b6fc-21c2967fbb27" className="rie-iclr-calendar" aria-label={`案头日历：${year} 年`}>
      <div shuku-edit-id="e-5222e4a8-0e44-413c-9fd3-60ad9f5076fa" className="rie-iclr-calendar-sheet">
        <Typography shuku-edit-id="e-004d1209-4229-4749-be06-8580e7e4a546" as="span" variant="h2" tone="inherit">{year}</Typography>
      </div>
      {previousYear !== null && <div shuku-edit-id="e-548afca2-1d6f-41dd-a36e-a0e82922e3fe" key={year} className="rie-iclr-calendar-flip" aria-hidden="true">
        <Typography shuku-edit-id="e-d9a21a03-fac6-44dd-ab0e-6b9d423cadc6" as="span" variant="h2" tone="inherit">{previousYear}</Typography>
      </div>}
    </div>
    {failed.size > 0 && <div shuku-edit-id="e-00ba6102-7814-445f-bbe0-701d9e9522ac" className="rie-iclr-asset-status" role="alert">
      <Typography shuku-edit-id="e-7b66b5f3-e5a0-4b53-b85e-c28f6d36a5a2" variant="bodySmall" tone="muted">场景未能加载</Typography>
      <Button onClick={() => {setLoaded(new Set());setFailed(new Set());setRetry(n=>n+1);}}>重新加载</Button>
    </div>}
  </div>;
}
