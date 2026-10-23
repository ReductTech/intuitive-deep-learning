import { useEffect, useRef, useState } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './PresentationComparisonPage.css';

const simplePrompt = '给我做一页 PPT，主要讲解卷积神经网络里的权重共享。';
const designPrompt = '给我做一页 PPT，讲讲卷积神经网络里的权重共享。整体分成左右两个 panel，都用一个 3×3 的窗口在输入图像上滑动。左边是不共享，窗口每滑到一个新位置，就换一种颜色，表示这里用的是另一套权重；右边是共享，窗口也一起滑动，但颜色不变，表示一直用同一套权重。最后把两边各用了多少套权重、总共有多少个参数也对应出来。';
type Phase = 'typing' | 'moving' | 'pressing' | 'generating' | 'done';
const asset = (path: string) => moduleAssetUrl(outline.moduleIdentity.id, path);

export function PresentationComparisonPage() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const [active, setActive] = useState(3);
  const [hovered, setHovered] = useState(false);
  const running = visible && foreground;

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    observer.observe(node);
    const update = () => setForeground(!document.hidden);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(preference.matches);
    motion(); preference.addEventListener('change', motion);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    if (!running || phase !== 'typing') return;
    if (reducedMotion) { setTyped(designPrompt.length); setPhase('done'); return; }
    const timer = window.setInterval(() => setTyped(value => Math.min(designPrompt.length, value + 1)), 45);
    return () => window.clearInterval(timer);
  }, [running, phase, reducedMotion]);
  useEffect(() => { if (typed === designPrompt.length && phase === 'typing') setPhase('moving'); }, [typed, phase]);
  useEffect(() => {
    if (!running || phase === 'typing' || phase === 'done') return;
    const next: Record<'moving' | 'pressing' | 'generating', Phase> = { moving: 'pressing', pressing: 'generating', generating: 'done' };
    const timer = window.setTimeout(() => setPhase(next[phase]), phase === 'moving' ? 1000 : phase === 'pressing' ? 260 : 800);
    return () => window.clearTimeout(timer);
  }, [running, phase]);
  useEffect(() => {
    if (!running || hovered || reducedMotion) return;
    const timer = window.setInterval(() => setActive(value => value % 5 + 1), 3200);
    return () => window.clearInterval(timer);
  }, [running, hovered, reducedMotion]);
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    if (running && phase === 'done' && !reducedMotion) void media.play().catch(() => {});
    else media.pause();
  }, [running, phase, reducedMotion]);

  const replay = () => { setTyped(0); setPhase('typing'); if (video.current) video.current.currentTime = 0; };
  const generate = () => { setTyped(designPrompt.length); setPhase('generating'); };

  return <article className="cg-case-page cg-creator-typography" ref={root} aria-labelledby="cg-case-title" data-demo-phase={phase}>
    <header><Typography as="h1" variant="display" tone="inherit" id="cg-case-title">人的价值：设计更容易理解的学习过程</Typography><Typography variant="bodySmall" tone="muted">同样讲“权重共享”，把关键区别与观察方式说清楚，结果会有什么不同？</Typography></header>
    <div className="cg-case-heading cg-case-heading-left"><Typography as="h2" variant="h3" tone="inherit">只说想要什么</Typography></div>
    <div className="cg-case-heading cg-case-heading-right"><Typography as="h2" variant="h3" tone="inherit">把讲解思路也说清楚</Typography><Button onClick={replay}><Typography as="span" variant="bodySmall" tone="inherit">重播演示</Typography></Button></div>
    <section className="cg-case-prompt cg-case-prompt-left" aria-label="笼统需求示例">
      <div className="cg-case-window-bar"><div className="cg-case-window-dots" aria-hidden="true"><i/><i/><i/></div><Typography variant="bodySmall" tone="muted">创作输入</Typography></div>
      <Typography variant="bodySmall" tone="inherit" className="cg-case-prompt-copy">{simplePrompt}</Typography>
      <div className="cg-case-prompt-bottom"><Typography variant="bodySmall" tone="muted">模拟输入</Typography><div className="cg-case-sent"><Typography variant="bodySmall" tone="inherit">已生成</Typography></div></div>
    </section>
    <section className={`cg-case-prompt cg-case-prompt-right cg-case-phase-${phase}`} aria-label="具体设计要求输入演示">
      <div className="cg-case-window-bar"><div className="cg-case-window-dots" aria-hidden="true"><i/><i/><i/></div><Typography variant="bodySmall" tone="muted">创作输入</Typography></div>
      <div className="cg-case-typing-area"><Typography variant="bodySmall" tone="inherit" className="cg-case-prompt-copy"><span aria-hidden="true">{designPrompt.slice(0, typed)}</span>{phase === 'typing' && <span className="cg-case-caret" aria-hidden="true"/>}<span className="cg-case-sr-only">{designPrompt}</span></Typography></div>
      <div className="cg-case-prompt-bottom"><Typography variant="bodySmall" tone="muted">流程模拟</Typography><Button className="cg-case-generate" onClick={generate} disabled={phase === 'generating'}><Typography as="span" variant="bodySmall" tone="inherit">{phase === 'generating' ? '生成中…' : '生成'}</Typography></Button></div>
      {(phase === 'moving' || phase === 'pressing') && <svg className={`cg-case-virtual-cursor${phase === 'pressing' ? ' is-clicking' : ''}`} viewBox="0 0 32 40" aria-hidden="true"><path d="M3 2v30l8-8 7 13 6-3-7-12h11Z" fill="#17365a" stroke="white" strokeWidth="2"/></svg>}
    </section>
    <section className="cg-case-left-result" aria-label="五种已有AI图示方案" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false); }}>
      <img src={asset(`images/weight-sharing/version-${active}.png`)} alt={`AI 图示方案 ${active}`}/>
      <div className="cg-case-result-footer"><Typography variant="bodySmall" tone="muted">信息都有，关键区别还要自己找</Typography><div className="cg-case-version-buttons">{[1,2,3,4,5].map(version => <Button key={version} aria-label={`查看方案 ${version}`} aria-pressed={active === version} onClick={() => setActive(version)}><Typography as="span" variant="bodySmall" tone="inherit">{version}</Typography></Button>)}</div></div>
    </section>
    <section className={`cg-case-right-result${phase === 'done' ? ' is-ready' : ''}`} aria-label="加入教学设计的课件效果" aria-busy={phase === 'generating'}>
      <div className="cg-case-result-media"><video ref={video} src={asset('videos/weight-sharing.mp4')} muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-label="同步扫描，对比不共享与共享权重的现有课件视频"/>{phase !== 'done' && <div className="cg-case-result-wait"><Typography variant="body" tone="muted">{phase === 'generating' ? '正在生成课件…' : '输入设计要求后，生成课件'}</Typography></div>}</div>
      <Typography variant="bodySmall" tone="muted" className="cg-case-right-caption">{phase === 'done' ? '用同一个扫描动作，让“换一套”与“用同一套”的区别显现' : '把专业理解，转成可观察的演示要求'}</Typography>
    </section>
  </article>;
}
