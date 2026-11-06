import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import { allocatePaperStacks, readerPose } from './paperStacks';
import { projectPaperPage } from './paperPerspective';

const topSheets = ['paper-top-single-a', 'paper-top-double-a',
  'paper-top-single-figure', 'paper-top-double-table'] as const;
const assets = ['room','desk',...topSheets,'calendar-stand','reader-relaxed','reader-focused','reader-defeated'] as const;
type Asset = typeof assets[number];
const image = (name: Asset) => moduleAssetUrl(outline.moduleIdentity.id, `images/paper-relief/${name === 'room' ? 'room-calm' : name}.png`);
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

  return <div ref={roomRef} className="rie-paper-room" data-pose={pose} data-paper-count={count} aria-busy={!ready && !failed.size}>
    {assets.map(name => <img key={`${name}-${retry}`} src={image(name)}
      className={`rie-paper-asset rie-paper-${name === 'room' ? 'background' : name.startsWith('paper-top-') ? 'texture' : name}${name === `reader-${pose}` ? ' is-active' : ''}`}
      alt="" aria-hidden="true" draggable={false}
      onLoad={event => {
        const node = event.currentTarget;
        void node.decode().then(() => setLoaded(old => old.has(name) ? old : new Set(old).add(name)))
          .catch(() => setFailed(old => new Set(old).add(name)));
      }}
      onError={() => setFailed(old => new Set(old).add(name))}
    />)}
    <span className="rie-paper-scene-description" role="img" aria-label={`${year} 年，${count.toLocaleString('en-US')} 篇投稿；人物${poseLabels[pose]}，论文在桌面和地面的固定位置逐渐堆高。`} />
    {size && stacks.map((slot, stackIndex) => {
      const width = slot.width / 100 * size.width;
      const frontY = slot.y / 100 * size.height - slot.height / 650 * size.height;
      const plane = projectPaperPage(width, slot.x / 100 * size.width, frontY,
        size.width / 2, -size.height * .79);
      const topSheet = topSheets[(stackIndex * 3 + Math.floor(stackIndex / topSheets.length)) % topSheets.length];
      return <div key={slot.id} className={`rie-paper-pile${plane.showsLeftSide ? ' shows-left-side' : ''}`}
      data-stack-id={slot.id} data-surface={slot.surface} data-papers={slot.papers} data-height={slot.height} data-top-sheet={topSheet}
      aria-hidden="true" style={{
        left:`${slot.x}%`, bottom:`${100-slot.y}%`, width:`${slot.width}%`,
        zIndex:slot.layer, opacity:slot.papers > 0 ? 1 : 0,
        '--pile-height':slot.height / 650 * 100,
        '--pile-depth':`${plane.depth}px`,
        '--pile-side':`${plane.sideWidth}px`,
      } as CSSProperties}>
      <div className="rie-paper-pile-front" />
      <div className="rie-paper-pile-side" />
      <div className="rie-paper-pile-top" style={{height:plane.sourceHeight,
        transform:plane.transform,backgroundImage:`url("${image(topSheet)}")`}} />
    </div>;})}
    {size && <div className="rie-paper-reading-page" aria-hidden="true">
      {(['paper-top-double-a','paper-top-single-figure'] as const).map((sheet,i) => {
        const plane = projectPaperPage(size.width * .075, size.width * (.465 + i * .075),
          size.height * .43, size.width / 2, -size.height * .79);
        return <div key={sheet} className="rie-paper-reading-sheet" style={{left:`${i*50}%`,
          height:plane.sourceHeight,transform:plane.transform,backgroundImage:`url("${image(sheet)}")`}} />;
      })}
    </div>}
    <div className="rie-iclr-calendar" aria-label={`案头日历：${year} 年`}>
      <div className="rie-iclr-calendar-sheet">
        <Typography as="span" variant="h2" tone="inherit">{year}</Typography>
      </div>
      {previousYear !== null && <div key={year} className="rie-iclr-calendar-flip" aria-hidden="true">
        <Typography as="span" variant="h2" tone="inherit">{previousYear}</Typography>
      </div>}
    </div>
    {failed.size > 0 && <div className="rie-iclr-asset-status" role="alert">
      <Typography variant="bodySmall" tone="muted">场景未能加载</Typography>
      <Button onClick={() => {setLoaded(new Set());setFailed(new Set());setRetry(n=>n+1);}}>重新加载</Button>
    </div>}
  </div>;
}
