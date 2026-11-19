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

  return <article shuku-edit-id="e-95d99b72-445d-4d3d-9a35-18a60484fb65" className={`cg-case-page cg-creator-typography${running ? '' : ' cg-case-paused'}`} ref={root} aria-labelledby="cg-case-title" data-demo-phase={phase} data-generated-count={count}>
    <header shuku-edit-id="e-af1d1bb9-0f08-43e1-802c-48c61dd49aa7"><Typography shuku-edit-id="e-e9f5821b-1533-42a5-aa54-46e51e1b67bf" as="h1" variant="display" tone="inherit" id="cg-case-title">把专业理解，变成具体的讲解设计</Typography><Typography shuku-edit-id="e-283fd99e-46d3-4849-873b-7b7e558da1d8" variant="bodySmall" tone="muted">用权重共享的例子，看看人的设计如何影响 AI 的呈现。</Typography></header>
    {count === 5 && <Typography shuku-edit-id="e-8b99b6c7-6507-40ae-bab0-0a041db3bb75" as="h2" variant="h3" tone="inherit" className="cg-case-heading cg-case-heading-left">AI 自行生成的图示</Typography>}
    {phase === 'done' && <Typography shuku-edit-id="e-ae785ac2-badb-4572-804b-15f46ff40914" as="h2" variant="h3" tone="inherit" className="cg-case-heading cg-case-heading-right">融入人的教学设计</Typography>}
    {phase === 'simple-ready' && <div shuku-edit-id="e-12c70e38-03b2-4a3f-a666-9e6bcd183067" className="cg-case-opening">
      <svg shuku-edit-id="e-d04cc20b-f3b2-4c3c-8d97-43d43277bae3" viewBox="0 0 340 200" fill="none" aria-hidden="true"><rect shuku-edit-id="e-11eacd5f-d6ca-4471-ae94-7413f421fcab" x="57" y="20" width="240" height="150" rx="12" stroke="#c9dcf6" strokeWidth="1.5" transform="rotate(6 177 95)"/><rect shuku-edit-id="e-37985102-7052-4502-a03b-c101f43cfd5c" x="34" y="29" width="240" height="150" rx="12" fill="#ffffff90" stroke="#9fc2ef" strokeWidth="1.5"/><path shuku-edit-id="e-f81df933-f2ae-437f-894f-230b4e04b99f" d="M54 57h97M54 68h64" stroke="#bdd5f4" strokeWidth="4" strokeLinecap="round"/>{Array.from({ length: 9 }, (_, i) => <rect shuku-edit-id="e-6567ca7a-d1ea-4cdb-b842-7787f536145c" key={i} x={60 + i % 3 * 22} y={93 + Math.floor(i / 3) * 20} width="18" height="16" rx="2" fill={i === 4 ? '#a5c9f4' : '#e2edfb'}/>)}<path shuku-edit-id="e-64f3a4b3-7c99-4c47-8371-073608d71c77" d="M141 120h30m-6-5 6 5-6 5" stroke="#bdd5f4" strokeWidth="2"/><path shuku-edit-id="e-b822afb4-66ef-4835-9279-42a865b495e6" d="M193 142V98m17 44v-27m17 27V86" stroke="#c1d8f5" strokeWidth="10" strokeLinecap="round"/></svg>
      <Typography shuku-edit-id="e-30d4c138-53e4-46b0-afe8-824acbb19087" variant="h3" tone="inherit">从一句需求开始</Typography>
    </div>}
    <section shuku-edit-id="e-e75b2f6b-e7ad-4d2d-ad96-83a4322ed618" className="cg-case-stack" aria-label="一次生成的五张图示依次在左侧叠放" onPointerEnter={() => setStackHovered(true)} onPointerLeave={() => setStackHovered(false)} onFocusCapture={() => setStackHovered(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setStackHovered(false); }}>
      {[1,2,3,4,5].filter(version => version <= count).map((version, index) => <button shuku-edit-id="e-4b13904e-ff5f-48e2-a70f-4aae37962998" type="button" className="cg-case-stack-card" key={version} style={stackStyle(count === 5 ? (version - active + 7) % 5 : index)} aria-label={`查看生成方案 ${version}`} aria-pressed={count === 5 && active === version} onPointerEnter={() => { if (count === 5) setActive(version); }} onFocus={() => { if (count === 5) setActive(version); }} onClick={() => { if (count === 5) setActive(version); }}><img shuku-edit-id="e-7e846bb0-59f3-4361-ba7b-197e131eeb10" src={asset(`images/weight-sharing/version-${version}.webp`)} alt={`权重共享图示方案 ${version}`} draggable={false}/></button>)}
    </section>
    {flying && <div shuku-edit-id="e-258f2531-0451-42c4-a7c7-46aa15f32972" key={count} className={`cg-case-flying${phase === 'simple-filing' ? ' is-filing' : ''}`} style={{ '--target-x': `${45 + slot.x}px`, '--target-y': `${205 + slot.y}px`, '--target-width': `${slot.width}px`, '--target-height': `${slot.height}px`, '--target-angle': `${slot.angle}deg` } as CSSProperties}><img shuku-edit-id="e-30fc6d8f-cf10-4c43-b941-d5adb548b69f" src={asset(`images/weight-sharing/version-${count + 1}.webp`)} alt={`第 ${count + 1} 张生成图示，随后移至左侧`}/></div>}
    <section shuku-edit-id="e-a7bd8bfb-62ef-4735-9a30-e2eee8d89a2c" className={`cg-case-result${result ? ' is-ready' : ''}`} aria-label="加入具体设计要求后的知识呈现作品效果" aria-hidden={!result}>
      <video shuku-edit-id="e-eb66aaf9-3352-4945-aec3-17e0494fb1ae" ref={video} src={asset('videos/weight-sharing.mp4')} muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="权重共享知识呈现作品：窗口同步滑动，对比不同位置使用的权重"/>
    </section>
    {loading && <div shuku-edit-id="e-3d41898d-1c2f-4256-bde4-031f8fd72b67" className="cg-case-loading" role="status"><span shuku-edit-id="e-d1f4310d-978f-4446-9286-1ccbd98c2a7b" className="cg-case-spinner" aria-hidden="true"/><Typography shuku-edit-id="e-52d632ce-78bf-4df8-9611-a4da79bd1e44" variant="bodySmall" tone="muted">正在制作中…</Typography></div>}
    <section shuku-edit-id="e-6ac50eae-a6de-48da-8d44-f81694b7a5ba" className="cg-case-composer" aria-label="共用创作输入窗口">
      <div shuku-edit-id="e-4639fac4-3b05-43cd-aacb-7677ad226658" className="cg-case-input-copy"><Typography shuku-edit-id="e-0104ea7a-73ca-4821-8fdf-21874237c896" variant="bodySmall" tone="inherit"><span shuku-edit-id="e-8ffa06f7-09ec-4d3c-b5f4-c57522506de2" aria-hidden="true" data-typed-copy>{text}</span>{typing && <span shuku-edit-id="e-ef3c5078-773c-4625-a031-2ba514eff6e7" className="cg-case-caret" aria-hidden="true"/>}<span shuku-edit-id="e-e7bb6d74-0ff2-4cc2-abe0-03a2e12de2f4" className="cg-case-sr-only">{prompt}</span></Typography></div>
      <div shuku-edit-id="e-bd803198-a1aa-4aae-b2a2-093ed668dd49" className="cg-case-action"><Button className="cg-case-start" onClick={start} disabled={busy} aria-label={phase === 'done' ? '重播创作演示' : '开始模拟生成'}><Typography shuku-edit-id="e-37220e14-f289-4001-a2ba-a2c2dec868b3" as="span" variant="body" tone="inherit">{phase === 'done' ? '重播' : '开始'}</Typography></Button></div>
    </section>
  </article>;
}
