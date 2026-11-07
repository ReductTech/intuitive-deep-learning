import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../shared/react';
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
const asset = (path: string) => moduleAssetUrl(outline.moduleIdentity.id, path);
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

  return <article className={`cg-case-page cg-creator-typography${running ? '' : ' cg-case-paused'}`} ref={root} aria-labelledby="cg-case-title" data-demo-phase={phase} data-generated-count={count}>
    <header><Typography as="h1" variant="display" tone="inherit" id="cg-case-title">把专业理解，变成具体的讲解设计</Typography><Typography variant="bodySmall" tone="muted">用权重共享的例子，看看人的设计如何影响 AI 的呈现。</Typography></header>
    {count === 5 && <Typography as="h2" variant="h3" tone="inherit" className="cg-case-heading cg-case-heading-left">AI 自行生成的图示</Typography>}
    {phase === 'done' && <Typography as="h2" variant="h3" tone="inherit" className="cg-case-heading cg-case-heading-right">融入人的教学设计</Typography>}
    {phase === 'simple-ready' && <div className="cg-case-opening">
      <svg viewBox="0 0 340 200" fill="none" aria-hidden="true"><rect x="57" y="20" width="240" height="150" rx="12" stroke="#c9dcf6" strokeWidth="1.5" transform="rotate(6 177 95)"/><rect x="34" y="29" width="240" height="150" rx="12" fill="#ffffff90" stroke="#9fc2ef" strokeWidth="1.5"/><path d="M54 57h97M54 68h64" stroke="#bdd5f4" strokeWidth="4" strokeLinecap="round"/>{Array.from({ length: 9 }, (_, i) => <rect key={i} x={60 + i % 3 * 22} y={93 + Math.floor(i / 3) * 20} width="18" height="16" rx="2" fill={i === 4 ? '#a5c9f4' : '#e2edfb'}/>)}<path d="M141 120h30m-6-5 6 5-6 5" stroke="#bdd5f4" strokeWidth="2"/><path d="M193 142V98m17 44v-27m17 27V86" stroke="#c1d8f5" strokeWidth="10" strokeLinecap="round"/></svg>
      <Typography variant="h3" tone="inherit">从一句需求开始</Typography>
    </div>}
    <section className="cg-case-stack" aria-label="一次生成的五张图示依次在左侧叠放" onPointerEnter={() => setStackHovered(true)} onPointerLeave={() => setStackHovered(false)} onFocusCapture={() => setStackHovered(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setStackHovered(false); }}>
      {[1,2,3,4,5].filter(version => version <= count).map((version, index) => <button type="button" className="cg-case-stack-card" key={version} style={stackStyle(count === 5 ? (version - active + 7) % 5 : index)} aria-label={`查看生成方案 ${version}`} aria-pressed={count === 5 && active === version} onPointerEnter={() => { if (count === 5) setActive(version); }} onFocus={() => { if (count === 5) setActive(version); }} onClick={() => { if (count === 5) setActive(version); }}><img src={asset(`images/weight-sharing/version-${version}.png`)} alt={`权重共享图示方案 ${version}`} draggable={false}/></button>)}
    </section>
    {flying && <div key={count} className={`cg-case-flying${phase === 'simple-filing' ? ' is-filing' : ''}`} style={{ '--target-x': `${45 + slot.x}px`, '--target-y': `${205 + slot.y}px`, '--target-width': `${slot.width}px`, '--target-height': `${slot.height}px`, '--target-angle': `${slot.angle}deg` } as CSSProperties}><img src={asset(`images/weight-sharing/version-${count + 1}.png`)} alt={`第 ${count + 1} 张生成图示，随后移至左侧`}/></div>}
    <section className={`cg-case-result${result ? ' is-ready' : ''}`} aria-label="加入具体设计要求后的知识呈现作品效果" aria-hidden={!result}>
      <video ref={video} src={asset('videos/weight-sharing.mp4')} muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="权重共享知识呈现作品：窗口同步滑动，对比不同位置使用的权重"/>
    </section>
    {loading && <div className="cg-case-loading" role="status"><span className="cg-case-spinner" aria-hidden="true"/><Typography variant="bodySmall" tone="muted">正在制作中…</Typography></div>}
    <section className="cg-case-composer" aria-label="共用创作输入窗口">
      <div className="cg-case-input-copy"><Typography variant="bodySmall" tone="inherit"><span aria-hidden="true" data-typed-copy>{text}</span>{typing && <span className="cg-case-caret" aria-hidden="true"/>}<span className="cg-case-sr-only">{prompt}</span></Typography></div>
      <div className="cg-case-action"><Button className="cg-case-start" onClick={start} disabled={busy} aria-label={phase === 'done' ? '重播创作演示' : '开始模拟生成'}><Typography as="span" variant="body" tone="inherit">{phase === 'done' ? '重播' : '开始'}</Typography></Button></div>
    </section>
  </article>;
}
