import { useEffect, useRef, useState } from 'react';
import { Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './PresentationComparisonPage.css';

const versions = [1, 2, 3, 4, 5];
const asset = (path: string) => moduleAssetUrl(outline.moduleIdentity.id, path);
export function PresentationComparisonPage() {
  const [active, setActive] = useState(3);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!visible || pointerInside || focusInside) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(current => current % 5 + 1);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [visible, pointerInside, focusInside]);
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const node = root.current;
    const media = video.current;
    if (!node || !media) return;
    let inView = false;
    const update = () => {
      if (inView && !document.hidden) void media.play().catch(() => {});
      else media.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; setVisible(inView); update(); }, { threshold: 0.15 });
    observer.observe(node);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); media.pause(); };
  }, []);
  return <article className="cg-case-page cg-creator-typography" ref={root} aria-labelledby="cg-case-title">
    <header><Typography as="h1" variant="display" tone="inherit" id="cg-case-title">同一个知识点，不同的呈现方式</Typography></header>
    <Typography as="h2" variant="h3" tone="inherit" className="cg-case-label cg-case-label-left">AI 生成</Typography>
    <div className="cg-case-carousel" onPointerEnter={() => setPointerInside(true)} onPointerLeave={() => setPointerInside(false)} onFocus={() => setFocusInside(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false); }}>
      <svg className="cg-case-orbit" viewBox="0 0 730 730" aria-hidden="true"><path d="M486 12C69 55-87 425 476 706" fill="none" stroke="#7aaeff" strokeWidth="1.3"/></svg>
      {versions.map(version => <div key={version} className={`cg-case-art cg-case-art-${(version - active + 7) % 5}${active === version ? ' is-active' : ''}`}>
        <img src={asset(`images/weight-sharing/version-${version}.png`)} alt={`权重共享 AI 生成方案，版本 ${version}`} draggable={false}/>
      </div>)}
      {versions.map((_, index) => { const version = (active + index + 2) % 5 + 1; return <button type="button" key={index} className={`cg-case-target cg-case-target-${index}`} aria-label={`查看版本 ${version}`} aria-pressed={active === version} onPointerEnter={() => setActive(version)} onFocus={() => setActive(version)} onClick={() => setActive(version)}/>; })}
    </div>
    <div className="cg-case-video-region"><div className="cg-case-video-heading"><Typography as="h2" variant="h3" tone="inherit">使用 Creators Skill 制作</Typography></div><div className="cg-case-video-frame"><video ref={video} src={asset('videos/weight-sharing.mp4')} autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="权重共享工程课件演示，静音循环播放"/></div></div>
    <svg className="cg-case-flow" viewBox="0 0 95 64" aria-hidden="true"><defs><linearGradient id="cg-case-flow-color"><stop stopColor="#dceaff"/><stop offset="1" stopColor="#79a6f7"/></linearGradient></defs><path d="M5 51Q37 18 77 19M64 7l15 12-13 16" fill="none" stroke="url(#cg-case-flow-color)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </article>;
}
