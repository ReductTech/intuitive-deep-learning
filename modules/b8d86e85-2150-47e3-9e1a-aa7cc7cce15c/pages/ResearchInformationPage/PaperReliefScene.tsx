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

  return <div shuku-edit-id="e-b58aa838-5932-4791-81f6-41aa6b14ae81" ref={roomRef} className="aipe-paper-room" data-pose={pose} data-paper-count={count} aria-busy={!ready && !failed.size}>
    {assets.map(name => <img shuku-edit-id="e-42a8ad44-b899-4c81-aa0e-22f912f021eb" key={`${name}-${retry}`} src={image(name)}
      className={`aipe-paper-asset aipe-paper-${name === 'images/paper-relief/room-calm.jpg' ? 'background' : name.includes('/paper-top-') ? 'texture' : name.split('/').pop()!.replace(/\.[^.]+$/, '')}${name === `images/paper-relief/reader-${pose}.png` ? ' is-active' : ''}`}
      alt="" aria-hidden="true" draggable={false}
      onLoad={event => {
        const node = event.currentTarget;
        void node.decode().then(() => setLoaded(old => old.has(name) ? old : new Set(old).add(name)))
          .catch(() => setFailed(old => new Set(old).add(name)));
      }}
      onError={() => setFailed(old => new Set(old).add(name))}
    />)}
    <span shuku-edit-id="e-c0d8e12d-4145-421b-aacd-435d073841f2" className="aipe-paper-scene-description" role="img" aria-label={`${year} 年，${count.toLocaleString('en-US')} 篇投稿；人物${poseLabels[pose]}，论文在桌面和地面的固定位置逐渐堆高。`} />
    {size && stacks.map((slot, stackIndex) => {
      const width = slot.width / 100 * size.width;
      const frontY = slot.y / 100 * size.height - slot.height / 650 * size.height;
      const plane = projectPaperPage(width, slot.x / 100 * size.width, frontY,
        size.width / 2, -size.height * .79);
      const topSheet = topSheets[(stackIndex * 3 + Math.floor(stackIndex / topSheets.length)) % topSheets.length];
      return <div shuku-edit-id="e-dc589a77-e9ad-4627-a739-db905c6dcc0f" key={slot.id} className={`aipe-paper-pile${plane.showsLeftSide ? ' shows-left-side' : ''}`}
      data-stack-id={slot.id} data-surface={slot.surface} data-papers={slot.papers} data-height={slot.height} data-top-sheet={topSheet.split('/').pop()!.replace(/\.[^.]+$/, '')}
      aria-hidden="true" style={{
        left:`${slot.x}%`, bottom:`${100-slot.y}%`, width:`${slot.width}%`,
        zIndex:slot.layer, opacity:slot.papers > 0 ? 1 : 0,
        '--pile-height':slot.height / 650 * 100,
        '--pile-depth':`${plane.depth}px`,
        '--pile-side':`${plane.sideWidth}px`,
      } as CSSProperties}>
      <div shuku-edit-id="e-2ea78ba9-86fd-4657-819d-f70f5b441afe" className="aipe-paper-pile-front" />
      <div shuku-edit-id="e-d7ef12b2-0125-4ec2-a3a4-887fa693f79d" className="aipe-paper-pile-side" />
      <div shuku-edit-id="e-d334a0ed-6931-4ec6-9955-11115bb75887" className="aipe-paper-pile-top" style={{height:plane.sourceHeight,
        transform:plane.transform,backgroundImage:`url("${image(topSheet)}")`}} />
    </div>;})}
    {size && <div shuku-edit-id="e-2df306e4-203a-4ee0-b35b-fb3435c24244" className="aipe-paper-reading-page" aria-hidden="true">
      {(['images/paper-relief/paper-top-double-a.jpg','images/paper-relief/paper-top-single-figure.jpg'] as const).map((sheet,i) => {
        const plane = projectPaperPage(size.width * .075, size.width * (.465 + i * .075),
          size.height * .43, size.width / 2, -size.height * .79);
        return <div shuku-edit-id="e-8cb08795-6bff-4395-a1ce-d13422250fdb" key={sheet} className="aipe-paper-reading-sheet" style={{left:`${i*50}%`,
          height:plane.sourceHeight,transform:plane.transform,backgroundImage:`url("${image(sheet)}")`}} />;
      })}
    </div>}
    <div shuku-edit-id="e-da92fe66-8227-4dd2-933c-37b967667df1" className="aipe-iclr-calendar" aria-label={`案头日历：${year} 年`}>
      <div shuku-edit-id="e-7d223d17-a76a-4d6a-979c-3ad1cd5e85ee" className="aipe-iclr-calendar-sheet">
        <Typography shuku-edit-id="e-a43bfcd3-8cb1-468b-aff0-b649e00320d8" as="span" variant="h2" tone="inherit">{year}</Typography>
      </div>
      {previousYear !== null && <div shuku-edit-id="e-a80c0370-a851-41b1-86ee-9141dc6ccb85" key={year} className="aipe-iclr-calendar-flip" aria-hidden="true">
        <Typography shuku-edit-id="e-ab68ce3a-536c-4ab3-9a57-a068faf60050" as="span" variant="h2" tone="inherit">{previousYear}</Typography>
      </div>}
    </div>
    {failed.size > 0 && <div shuku-edit-id="e-516d62af-6fb1-4aba-a5b7-a1f36913f7f6" className="aipe-iclr-asset-status" role="alert">
      <Typography shuku-edit-id="e-2bafccca-5c53-4983-a6a5-2636d5af575e" variant="bodySmall" tone="muted">场景未能加载</Typography>
      <Button onClick={() => {setLoaded(new Set());setFailed(new Set());setRetry(n=>n+1);}}>重新加载</Button>
    </div>}
  </div>;
}
