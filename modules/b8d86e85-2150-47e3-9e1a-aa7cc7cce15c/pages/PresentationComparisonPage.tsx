import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './PresentationComparisonPage.css';

const simplePrompt = '给我做一页 PPT，讲讲卷积里的权重共享。';
const designPrompt = '做一页权重共享 PPT，左右对比。窗口一起滑动：左边每到新位置换颜色，右边保持不变，表示复用同一套权重。';
type Phase = 'simple-ready' | 'simple-loading' | 'simple-preview' | 'simple-filing' | 'detail-typing' | 'detail-ready' | 'detail-loading' | 'detail-reveal' | 'done';
type Demo = { phase: Phase; elapsed: number; count: number };
const initial: Demo = { phase: 'simple-ready', elapsed: 0, count: 0 };
const durations: Record<Phase, number> = { 'simple-ready': Infinity, 'simple-loading': 1100, 'simple-preview': 750, 'simple-filing': 700, 'detail-typing': 1900, 'detail-ready': Infinity, 'detail-loading': 1300, 'detail-reveal': 650, done: Infinity };
function advance(state: Demo): Demo {
  const next: Partial<Record<Phase, Phase>> = { 'simple-loading': 'simple-preview', 'simple-preview': 'simple-filing', 'detail-typing': 'detail-ready', 'detail-loading': 'detail-reveal', 'detail-reveal': 'done' };
  if (state.phase === 'simple-filing') { const count = state.count + 1; return { count, elapsed: 0, phase: count === 5 ? 'detail-typing' : 'simple-preview' }; }
  return { ...state, elapsed: 0, phase: next[state.phase] ?? state.phase };
}
function reducer(state: Demo, action: 'tick' | 'start' | 'settle'): Demo {
  if (action === 'settle') {
    if (state.phase.startsWith('simple') && state.phase !== 'simple-ready') return { phase: 'detail-ready', count: 5, elapsed: 0 };
    if (state.phase === 'detail-typing') return { ...state, phase: 'detail-ready', elapsed: 0 };
    if (state.phase === 'detail-loading' || state.phase === 'detail-reveal') return { ...state, phase: 'done', elapsed: 0 };
    return state;
  }
  if (action === 'start') {
    if (state.phase === 'done') return initial;
    if (state.phase === 'simple-ready' || state.phase === 'detail-ready') return { ...state, elapsed: 0, phase: state.phase === 'simple-ready' ? 'simple-loading' : 'detail-loading' };
    return state;
  }
  if (!Number.isFinite(durations[state.phase])) return state;
  const updated = { ...state, elapsed: state.elapsed + 40 };
  return updated.elapsed >= durations[state.phase] ? advance(updated) : updated;
}
const asset = (path: string) => moduleAssetUrl(path);
const slots = [
  { x: 334, y: 0, width: 260, height: 147, angle: 5, z: 1 },
  { x: 202, y: 86, width: 286, height: 161, angle: 4, z: 2 },
  { x: 40, y: 142, width: 570, height: 322, angle: 0, z: 5 },
  { x: 204, y: 359, width: 286, height: 161, angle: -4, z: 3 },
  { x: 333, y: 400, width: 240, height: 136, angle: -5, z: 2 },
];
const stackStyle = (index: number): CSSProperties => ({ left: slots[index].x, top: slots[index].y, width: slots[index].width, height: slots[index].height, transform: `rotate(${slots[index].angle}deg)`, zIndex: slots[index].z });

export function PresentationComparisonPage() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [state, dispatch] = useReducer(reducer, initial);
  const [active, setActive] = useState(3);
  const [stackHovered, setStackHovered] = useState(false);
  const running = visible && foreground;
  const { phase, count, elapsed } = state;
  const detailed = phase.startsWith('detail') || phase === 'done';
  const prompt = detailed ? designPrompt : simplePrompt;
  const typing = phase.endsWith('typing');
  const text = typing ? prompt.slice(0, Math.floor(prompt.length * Math.min(1, elapsed / (durations[phase] - 100)))) : prompt;
  const loading = phase.endsWith('loading');
  const flying = phase === 'simple-preview' || phase === 'simple-filing';
  const result = phase === 'detail-reveal' || phase === 'done';
  const slot = slots[Math.min(count, 4)];
  const busy = typing || loading || flying || phase === 'detail-reveal';

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    observer.observe(node);
    const update = () => setForeground(!document.hidden);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(preference.matches);
    motion(); preference.addEventListener('change', motion); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (!running) return;
    if (!Number.isFinite(durations[phase])) return;
    if (reducedMotion) { dispatch('settle'); return; }
    const timer = window.setInterval(() => dispatch('tick'), 40);
    return () => window.clearInterval(timer);
  }, [running, reducedMotion, phase]);
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    if (running && result && !reducedMotion) void media.play().catch(() => {});
    else media.pause();
  }, [running, result, reducedMotion]);
  useEffect(() => {
    if (!running || count !== 5 || stackHovered || reducedMotion) return;
    const timer = window.setInterval(() => setActive(value => value % 5 + 1), 3200);
    return () => window.clearInterval(timer);
  }, [running, count, stackHovered, reducedMotion]);
  const start = () => {
    if (phase === 'done') { setActive(3); setStackHovered(false); if (video.current) video.current.currentTime = 0; }
    dispatch('start');
  };

  return <article shuku-edit-id="e-8b373426-a215-4f53-b2f8-3efb18f4d8ed" className={`cg-case-page cg-creator-typography${running ? '' : ' cg-case-paused'}`} ref={root} aria-labelledby="cg-case-title" data-demo-phase={phase} data-generated-count={count}>
    <header shuku-edit-id="e-df93d410-5dc3-4f0a-bb1e-2fc838a03722"><Typography shuku-edit-id="e-4593d39c-0fe7-4503-b429-eb64773a26d4" as="h1" variant="display" tone="inherit" id="cg-case-title">把专业理解，变成具体的讲解设计</Typography><Typography shuku-edit-id="e-694b49e2-5788-4a90-8e43-d542474658c3" variant="bodySmall" tone="muted">用权重共享的例子，看看人的设计如何影响 AI 的呈现。</Typography></header>
    {count === 5 && <Typography shuku-edit-id="e-6d1639c4-0d90-421f-a5f4-0c87239cc230" as="h2" variant="h3" tone="inherit" className="cg-case-heading cg-case-heading-left">AI 自行生成的图示</Typography>}
    {phase === 'done' && <Typography shuku-edit-id="e-d88ad9ed-90d4-4b5e-97eb-b888c2e6ff74" as="h2" variant="h3" tone="inherit" className="cg-case-heading cg-case-heading-right">融入人的教学设计</Typography>}
    {phase === 'simple-ready' && <div shuku-edit-id="e-3fddb34b-b665-4da0-862a-110e92b5288a" className="cg-case-opening">
      <svg shuku-edit-id="e-9a800f97-fa35-4b10-a7c7-8ab02d4004c6" viewBox="0 0 340 200" fill="none" aria-hidden="true"><rect shuku-edit-id="e-1b7abec4-3e96-4711-b472-4153ea788fde" x="57" y="20" width="240" height="150" rx="12" stroke="#c9dcf6" strokeWidth="1.5" transform="rotate(6 177 95)"/><rect shuku-edit-id="e-77009ecb-26b3-47d1-a1f6-d8856095ef92" x="34" y="29" width="240" height="150" rx="12" fill="#ffffff90" stroke="#9fc2ef" strokeWidth="1.5"/><path shuku-edit-id="e-244c92f3-1248-4ef4-998c-1b87be74317d" d="M54 57h97M54 68h64" stroke="#bdd5f4" strokeWidth="4" strokeLinecap="round"/>{Array.from({ length: 9 }, (_, i) => <rect shuku-edit-id="e-85a80c7e-f654-4a8b-9c2d-9306534fd246" key={i} x={60 + i % 3 * 22} y={93 + Math.floor(i / 3) * 20} width="18" height="16" rx="2" fill={i === 4 ? '#a5c9f4' : '#e2edfb'}/>)}<path shuku-edit-id="e-66dcc075-1758-4016-b107-b5b0bd4ec2d2" d="M141 120h30m-6-5 6 5-6 5" stroke="#bdd5f4" strokeWidth="2"/><path shuku-edit-id="e-72065b4c-e313-4681-9c65-6c9374488aa7" d="M193 142V98m17 44v-27m17 27V86" stroke="#c1d8f5" strokeWidth="10" strokeLinecap="round"/></svg>
      <Typography shuku-edit-id="e-292ba730-c74b-4644-815e-3b4a4fff45f6" variant="h3" tone="inherit">从一句需求开始</Typography>
    </div>}
    <section shuku-edit-id="e-ba2d2651-c6e9-48c3-90aa-5f44c61812cd" className="cg-case-stack" aria-label="一次生成的五张图示依次在左侧叠放" onPointerEnter={() => setStackHovered(true)} onPointerLeave={() => setStackHovered(false)} onFocusCapture={() => setStackHovered(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setStackHovered(false); }}>
      {[1,2,3,4,5].filter(version => version <= count).map((version, index) => <button shuku-edit-id="e-554b8fd8-0a81-473d-815a-20b8ac706e1a" type="button" className="cg-case-stack-card" key={version} style={stackStyle(count === 5 ? (version - active + 7) % 5 : index)} aria-label={`查看生成方案 ${version}`} aria-pressed={count === 5 && active === version} onPointerEnter={() => { if (count === 5) setActive(version); }} onFocus={() => { if (count === 5) setActive(version); }} onClick={() => { if (count === 5) setActive(version); }}><img shuku-edit-id="e-99cf25d1-71a5-4f36-b42a-98d379fd84db" src={asset(`images/weight-sharing/version-${version}.webp`)} alt={`权重共享图示方案 ${version}`} draggable={false}/></button>)}
    </section>
    {flying && <div shuku-edit-id="e-5501f9ae-f781-41fd-bcfd-e5f2a0c57d26" key={count} className={`cg-case-flying${phase === 'simple-filing' ? ' is-filing' : ''}`} style={{ '--target-x': `${45 + slot.x}px`, '--target-y': `${205 + slot.y}px`, '--target-width': `${slot.width}px`, '--target-height': `${slot.height}px`, '--target-angle': `${slot.angle}deg` } as CSSProperties}><img shuku-edit-id="e-6ccb7d2f-1f83-4299-9e65-5bf9bbc80490" src={asset(`images/weight-sharing/version-${count + 1}.webp`)} alt={`第 ${count + 1} 张生成图示，随后移至左侧`}/></div>}
    <section shuku-edit-id="e-a1912aaa-c2ce-48a6-818b-2d96ab214a07" className={`cg-case-result${result ? ' is-ready' : ''}`} aria-label="加入具体设计要求后的知识呈现作品效果" aria-hidden={!result}>
      <video shuku-edit-id="e-b6eb65a6-e511-4fb9-8b34-5da4eeec6525" ref={video} src={asset('videos/weight-sharing.mp4')} muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="权重共享知识呈现作品：窗口同步滑动，对比不同位置使用的权重"/>
    </section>
    {loading && <div shuku-edit-id="e-5cd9722f-0a59-4108-8102-0fe96e1499e6" className="cg-case-loading" role="status"><span shuku-edit-id="e-7953cebf-aa28-47a7-9a28-855ba99263a6" className="cg-case-spinner" aria-hidden="true"/><Typography shuku-edit-id="e-70b8f146-2416-4bd7-885f-825a709107fc" variant="bodySmall" tone="muted">正在制作中…</Typography></div>}
    <section shuku-edit-id="e-73f65e03-12a2-42b1-817f-2eaca52939ab" className="cg-case-composer" aria-label="共用创作输入窗口">
      <div shuku-edit-id="e-4b7a155c-8cf2-42aa-949b-ed569d20b6e9" className="cg-case-input-copy"><Typography shuku-edit-id="e-e9fd99e4-5ca4-4ac0-ba61-440abae2cf80" variant="bodySmall" tone="inherit"><span shuku-edit-id="e-fc9503d4-d046-4963-8507-4b697b57fb90" aria-hidden="true" data-typed-copy>{text}</span>{typing && <span shuku-edit-id="e-63628393-529f-46c0-b34a-0f04d0d9588e" className="cg-case-caret" aria-hidden="true"/>}<span shuku-edit-id="e-ac015ba6-b207-4aff-a626-828c5c5df6e4" className="cg-case-sr-only">{prompt}</span></Typography></div>
      <div shuku-edit-id="e-8e738bd7-1277-48f2-99ab-58ef61b7648e" className="cg-case-action"><Button className="cg-case-start" onClick={start} disabled={busy} aria-label={phase === 'done' ? '重播创作演示' : '开始模拟生成'}><Typography shuku-edit-id="e-094d9ee4-1c54-47bc-8da3-339a655794c3" as="span" variant="body" tone="inherit">{phase === 'done' ? '重播' : '开始'}</Typography></Button></div>
    </section>
  </article>;
}
