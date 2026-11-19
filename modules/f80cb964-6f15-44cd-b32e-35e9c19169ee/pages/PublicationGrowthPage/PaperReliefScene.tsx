import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { allocatePaperStacks, readerPose } from './paperStacks';
import { projectPaperPage } from './paperPerspective';

const topSheets = ["images/paper-relief/paper-top-single-a.webp", "images/paper-relief/paper-top-double-a.webp",
  "images/paper-relief/paper-top-single-figure.webp", "images/paper-relief/paper-top-double-table.webp"] as const;
const assets = ["images/paper-relief/room-calm.webp","images/paper-relief/desk.webp",...topSheets,"images/paper-relief/calendar-stand.webp","images/paper-relief/reader-relaxed.webp","images/paper-relief/reader-focused.webp","images/paper-relief/reader-defeated.webp"] as const;
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

  return <div shuku-edit-id="e-ceb90d9b-7aa0-4b5c-b3f7-e83466db9a6e" ref={roomRef} className="rie-paper-room" data-pose={pose} data-paper-count={count} aria-busy={!ready && !failed.size}>
    {assets.map(name => <img shuku-edit-id="e-9c10228b-b219-4fc7-9a2d-4b2d9aba42d3" key={`${name}-${retry}`} src={image(name)}
      className={`rie-paper-asset rie-paper-${name === 'images/paper-relief/room-calm.webp' ? 'background' : name.includes('/paper-top-') ? 'texture' : name.split('/').pop()!.replace(/\.[^.]+$/, '')}${name === `images/paper-relief/reader-${pose}.webp` ? ' is-active' : ''}`}
      alt="" aria-hidden="true" draggable={false}
      onLoad={event => {
        const node = event.currentTarget;
        void node.decode().then(() => setLoaded(old => old.has(name) ? old : new Set(old).add(name)))
          .catch(() => setFailed(old => new Set(old).add(name)));
      }}
      onError={() => setFailed(old => new Set(old).add(name))}
    />)}
    <span shuku-edit-id="e-81390185-34ef-4dfd-ad25-c1ef9522b539" className="rie-paper-scene-description" role="img" aria-label={`${year} 年，${count.toLocaleString('en-US')} 篇投稿；人物${poseLabels[pose]}，论文在桌面和地面的固定位置逐渐堆高。`} />
    {size && stacks.map((slot, stackIndex) => {
      const width = slot.width / 100 * size.width;
      const frontY = slot.y / 100 * size.height - slot.height / 650 * size.height;
      const plane = projectPaperPage(width, slot.x / 100 * size.width, frontY,
        size.width / 2, -size.height * .79);
      const topSheet = topSheets[(stackIndex * 3 + Math.floor(stackIndex / topSheets.length)) % topSheets.length];
      return <div shuku-edit-id="e-84ce98f7-77ca-40fa-ad78-b641b6ff8b2b" key={slot.id} className={`rie-paper-pile${plane.showsLeftSide ? ' shows-left-side' : ''}`}
      data-stack-id={slot.id} data-surface={slot.surface} data-papers={slot.papers} data-height={slot.height} data-top-sheet={topSheet.split('/').pop()!.replace(/\.[^.]+$/, '')}
      aria-hidden="true" style={{
        left:`${slot.x}%`, bottom:`${100-slot.y}%`, width:`${slot.width}%`,
        zIndex:slot.layer, opacity:slot.papers > 0 ? 1 : 0,
        '--pile-height':slot.height / 650 * 100,
        '--pile-depth':`${plane.depth}px`,
        '--pile-side':`${plane.sideWidth}px`,
      } as CSSProperties}>
      <div shuku-edit-id="e-ff170bbc-b3a5-402d-8812-143043d51551" className="rie-paper-pile-front" />
      <div shuku-edit-id="e-71726e58-1c97-49d2-81d7-58d90e7e873d" className="rie-paper-pile-side" />
      <div shuku-edit-id="e-3c9efac7-0410-4ea8-b89f-b2c7743db7dd" className="rie-paper-pile-top" style={{height:plane.sourceHeight,
        transform:plane.transform,backgroundImage:`url("${image(topSheet)}")`}} />
    </div>;})}
    {size && <div shuku-edit-id="e-5bfba7fd-4026-45a6-9539-797baeac99c9" className="rie-paper-reading-page" aria-hidden="true">
      {(["images/paper-relief/paper-top-double-a.webp","images/paper-relief/paper-top-single-figure.webp"] as const).map((sheet,i) => {
        const plane = projectPaperPage(size.width * .075, size.width * (.465 + i * .075),
          size.height * .43, size.width / 2, -size.height * .79);
        return <div shuku-edit-id="e-f1df8063-ebd7-43a0-83b5-c3174eca8bc9" key={sheet} className="rie-paper-reading-sheet" style={{left:`${i*50}%`,
          height:plane.sourceHeight,transform:plane.transform,backgroundImage:`url("${image(sheet)}")`}} />;
      })}
    </div>}
    <div shuku-edit-id="e-5aebab6d-0935-4009-bc80-8bdbe6958ca0" className="rie-iclr-calendar" aria-label={`案头日历：${year} 年`}>
      <div shuku-edit-id="e-65477764-4608-4ac2-8114-76a918c6aab7" className="rie-iclr-calendar-sheet">
        <Typography shuku-edit-id="e-1eb23c4d-314e-4f95-9703-9dc9c0a120a2" as="span" variant="h2" tone="inherit">{year}</Typography>
      </div>
      {previousYear !== null && <div shuku-edit-id="e-0e608e5d-d462-425b-9273-dfa658096c04" key={year} className="rie-iclr-calendar-flip" aria-hidden="true">
        <Typography shuku-edit-id="e-b4237573-37de-4369-96c1-f32713476b14" as="span" variant="h2" tone="inherit">{previousYear}</Typography>
      </div>}
    </div>
    {failed.size > 0 && <div shuku-edit-id="e-668cbd15-1e0b-42c7-a0b3-d17ae541d9fd" className="rie-iclr-asset-status" role="alert">
      <Typography shuku-edit-id="e-f7bd338e-873d-4215-ad5a-e924ec544486" variant="bodySmall" tone="muted">场景未能加载</Typography>
      <Button onClick={() => {setLoaded(new Set());setFailed(new Set());setRetry(n=>n+1);}}>重新加载</Button>
    </div>}
  </div>;
}
