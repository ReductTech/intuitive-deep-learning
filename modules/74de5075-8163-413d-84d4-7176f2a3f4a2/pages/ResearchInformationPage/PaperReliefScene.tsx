import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { allocatePaperStacks, readerPose } from './paperStacks';
import { projectPaperPage } from './paperPerspective';

const topSheets = ['images/paper-relief/paper-top-single-a.jpg', 'images/paper-relief/paper-top-double-a.jpg',
  'images/paper-relief/paper-top-single-figure.jpg', 'images/paper-relief/paper-top-double-table.jpg'] as const;
const assets = ['images/paper-relief/room-calm.jpg','images/paper-relief/desk.png',...topSheets,'images/paper-relief/calendar-stand.png','images/paper-relief/reader-relaxed.png','images/paper-relief/reader-focused.png','images/paper-relief/reader-defeated.png'] as const;
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

  return <div shuku-edit-id="e-7046b810-22a3-43e2-80b5-ed4fb9b379f6" ref={roomRef} className="aipe-paper-room" data-pose={pose} data-paper-count={count} aria-busy={!ready && !failed.size}>
    {assets.map(name => <img shuku-edit-id="e-cee3d0e6-3fb0-4951-b4f9-cf8c1e887334" key={`${name}-${retry}`} src={image(name)}
      className={`aipe-paper-asset aipe-paper-${name === 'images/paper-relief/room-calm.jpg' ? 'background' : name.includes('/paper-top-') ? 'texture' : name.split('/').pop()!.replace(/\.[^.]+$/, '')}${name === `images/paper-relief/reader-${pose}.png` ? ' is-active' : ''}`}
      alt="" aria-hidden="true" draggable={false}
      onLoad={event => {
        const node = event.currentTarget;
        void node.decode().then(() => setLoaded(old => old.has(name) ? old : new Set(old).add(name)))
          .catch(() => setFailed(old => new Set(old).add(name)));
      }}
      onError={() => setFailed(old => new Set(old).add(name))}
    />)}
    <span shuku-edit-id="e-07ed722c-acbb-4de0-ae8c-75648118a6df" className="aipe-paper-scene-description" role="img" aria-label={`${year} 年，${count.toLocaleString('en-US')} 篇投稿；人物${poseLabels[pose]}，论文在桌面和地面的固定位置逐渐堆高。`} />
    {size && stacks.map((slot, stackIndex) => {
      const width = slot.width / 100 * size.width;
      const frontY = slot.y / 100 * size.height - slot.height / 650 * size.height;
      const plane = projectPaperPage(width, slot.x / 100 * size.width, frontY,
        size.width / 2, -size.height * .79);
      const topSheet = topSheets[(stackIndex * 3 + Math.floor(stackIndex / topSheets.length)) % topSheets.length];
      return <div shuku-edit-id="e-5bdc0917-7d9c-478a-8978-e049ccc31ec1" key={slot.id} className={`aipe-paper-pile${plane.showsLeftSide ? ' shows-left-side' : ''}`}
      data-stack-id={slot.id} data-surface={slot.surface} data-papers={slot.papers} data-height={slot.height} data-top-sheet={topSheet.split('/').pop()!.replace(/\.[^.]+$/, '')}
      aria-hidden="true" style={{
        left:`${slot.x}%`, bottom:`${100-slot.y}%`, width:`${slot.width}%`,
        zIndex:slot.layer, opacity:slot.papers > 0 ? 1 : 0,
        '--pile-height':slot.height / 650 * 100,
        '--pile-depth':`${plane.depth}px`,
        '--pile-side':`${plane.sideWidth}px`,
      } as CSSProperties}>
      <div shuku-edit-id="e-85086d0c-01ce-4738-9c63-232ff4d5adae" className="aipe-paper-pile-front" />
      <div shuku-edit-id="e-685d90cd-0ce6-40ca-922e-8c49e104e6f8" className="aipe-paper-pile-side" />
      <div shuku-edit-id="e-7d153490-99c4-4c6b-b71e-2a36a2c7087d" className="aipe-paper-pile-top" style={{height:plane.sourceHeight,
        transform:plane.transform,backgroundImage:`url("${image(topSheet)}")`}} />
    </div>;})}
    {size && <div shuku-edit-id="e-fd497aa3-b120-4305-9c47-026543f267cf" className="aipe-paper-reading-page" aria-hidden="true">
      {(['images/paper-relief/paper-top-double-a.jpg','images/paper-relief/paper-top-single-figure.jpg'] as const).map((sheet,i) => {
        const plane = projectPaperPage(size.width * .075, size.width * (.465 + i * .075),
          size.height * .43, size.width / 2, -size.height * .79);
        return <div shuku-edit-id="e-158f8a56-c9b5-4def-85ba-c6d6d31a5cc5" key={sheet} className="aipe-paper-reading-sheet" style={{left:`${i*50}%`,
          height:plane.sourceHeight,transform:plane.transform,backgroundImage:`url("${image(sheet)}")`}} />;
      })}
    </div>}
    <div shuku-edit-id="e-e08096a4-f464-4aa0-a2a1-7fc161a72765" className="aipe-iclr-calendar" aria-label={`案头日历：${year} 年`}>
      <div shuku-edit-id="e-0ed439c7-5187-46e1-88d6-4e286569a257" className="aipe-iclr-calendar-sheet">
        <Typography shuku-edit-id="e-7b4a1ddf-e0bd-48e4-9286-ebd1776521ca" as="span" variant="h2" tone="inherit">{year}</Typography>
      </div>
      {previousYear !== null && <div shuku-edit-id="e-66bf6cbc-75fc-4e28-8059-d7097dc29f49" key={year} className="aipe-iclr-calendar-flip" aria-hidden="true">
        <Typography shuku-edit-id="e-75e62028-a55c-4142-ab11-d29be3d63607" as="span" variant="h2" tone="inherit">{previousYear}</Typography>
      </div>}
    </div>
    {failed.size > 0 && <div shuku-edit-id="e-bdcfdb88-e84c-4283-a902-f9cd6d4c55c1" className="aipe-iclr-asset-status" role="alert">
      <Typography shuku-edit-id="e-f0e62b65-d2cb-45cf-bd47-ae7501b2cb0b" variant="bodySmall" tone="muted">场景未能加载</Typography>
      <Button onClick={() => {setLoaded(new Set());setFailed(new Set());setRetry(n=>n+1);}}>重新加载</Button>
    </div>}
  </div>;
}
