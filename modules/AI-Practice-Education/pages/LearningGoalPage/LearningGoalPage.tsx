import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Typography } from '../../../shared/react';
import './LearningGoalPage.css';

type Kind = 'book' | 'cap' | 'gear' | 'light' | 'search' | 'rocket' | 'refresh';
function GoalIcon({ kind }: { kind: Kind }) {
  const paths: Record<Kind, string> = {
    book: 'M16 7C10 3 5 4 2 5v23c5-2 9-1 14 2V7Zm0 0c6-4 11-3 14-2v23c-5-2-9-1-14 2V7Z',
    cap: 'm1 11 15-7 15 7-15 7-15-7Zm6 4v9c6 4 12 4 18 0v-9M30 12v12',
    gear: 'M12 3h8l1 5 4 2 5-1 3 7-4 3-1 4 2 4-6 5-4-3h-5l-4 3-6-5 2-4-1-4-4-3 3-7 5 1 4-2 1-5Zm4 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z',
    light: 'M10 24c0-4-5-6-5-12a11 11 0 0 1 22 0c0 6-5 8-5 12H10Zm1 4h10M13 32h6',
    search: 'M24 14a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM22 22l9 9',
    rocket: 'M10 23c-2-9 3-17 19-21 1 16-6 22-15 23l-4-2Zm4 2-1 6 7-7M10 18l-7 2 5-7M6 25l-4 6 7-3M22 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    refresh: 'M29 13A13 13 0 0 0 6 6L2 11M2 3v8h8M3 21a13 13 0 0 0 23 5l4-5M30 29v-8h-8',
  };
  return <svg viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
function GoalCard({ icon, text }: { icon: Kind; text: string }) {
  return <div className="llmpe-goal-card"><span className="llmpe-goal-card-icon"><GoalIcon kind={icon}/></span><Typography variant="body" tone="inherit">{text}</Typography></div>;
}

export function LearningGoalPage() {
  const root = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);
  const [angle, setAngle] = useState(-12);
  const start = useCallback(() => setStarted(true), []);
  useEffect(() => {
    const el = root.current;
    if (!el || started) return;
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      if (visible && document.visibilityState === 'visible') timer = setTimeout(start, 3000);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= .55; update(); }, { threshold: [.55] });
    observer.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [started, start]);
  useEffect(() => {
    if (!started) return;
    let frame = 0;
    let began: number | undefined;
    const tick = (time: number) => {
      began ??= time;
      const progress = Math.min(1, (time - began) / 1400);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      setAngle(-12 + 24 * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started]);
  const radians = angle * Math.PI / 180;
  const left = { x: 800 - 290 * Math.cos(radians), y: 580 - 290 * Math.sin(radians) - 90 };
  const right = { x: 800 + 290 * Math.cos(radians), y: 580 + 290 * Math.sin(radians) - 90 };
  return <article ref={root} className="llmpe-goal-page" data-state={angle === 12 ? 'understanding' : started ? 'moving' : 'knowledge'} data-angle={angle} aria-labelledby="llmpe-goal-title">
    <header className="llmpe-goal-header"><Typography as="h1" id="llmpe-goal-title" variant="display" tone="inherit">AI 时代，学习的重点或从积累知识转向理解与应用</Typography><Typography variant="subtitle" tone="inherit">过去，我们需要花几年时间积累知识。未来，更重要的是快速理解和应用新知识的能力。</Typography></header>
    <section className="llmpe-goal-side llmpe-goal-old" aria-labelledby="llmpe-goal-old-title"><Typography as="h2" id="llmpe-goal-old-title" variant="h2" tone="inherit" className="llmpe-goal-pill">工业时代</Typography><div className="llmpe-goal-cards"><GoalCard icon="book" text="学习多年"/><GoalCard icon="cap" text="掌握专业知识"/><GoalCard icon="gear" text="稳定应用"/></div></section>
    <section className="llmpe-goal-side llmpe-goal-new" aria-labelledby="llmpe-goal-new-title"><Typography as="h2" id="llmpe-goal-new-title" variant="h2" tone="inherit" className="llmpe-goal-pill">AI时代</Typography><div className="llmpe-goal-cards"><GoalCard icon="light" text="遇到新问题"/><GoalCard icon="search" text="快速理解"/><GoalCard icon="rocket" text="快速应用"/><GoalCard icon="refresh" text="持续迭代"/></div></section>
    <svg className="llmpe-goal-connections" viewBox="0 0 1600 900" aria-hidden="true">
      {[352, 478, 604].map((y, i) => <g key={y}><path d={`M375 ${y}C445 ${y} 400 ${left.y + (i - 1) * 30} ${left.x - 85} ${left.y + (i - 1) * 22}`} stroke="#f0b97f"/><circle cx="375" cy={y} r="3" fill="#f0b97f"/></g>)}
      {[326, 426, 526, 626].map((y, i) => <g key={y}><path d={`M${right.x + 85} ${right.y + (i - 1.5) * 20}C1220 ${right.y + (i - 1.5) * 20} 1170 ${y} 1256 ${y}`} stroke="#79b5ff"/><circle cx="1256" cy={y} r="3" fill="#79b5ff"/></g>)}
    </svg>
    <div className="llmpe-goal-core"><Typography variant="body" tone="inherit">过去教育培养的是<span className="llmpe-goal-orange">“知识拥有者”</span></Typography><Typography variant="body" tone="inherit">AI时代更需要<span className="llmpe-goal-blue">“知识探索者”</span></Typography></div>
    <div className="llmpe-goal-direction"><svg viewBox="0 0 420 130" aria-hidden="true"><defs><linearGradient id="llmpe-goal-arrow"><stop stopColor="#ffdbc0"/><stop offset="1" stopColor="#88bbff"/></linearGradient></defs><path d="M15 115Q175-5 390 35" fill="none" stroke="url(#llmpe-goal-arrow)" strokeWidth="10" strokeLinecap="round"/><path d="m375 15 28 23-31 16" fill="none" stroke="#88bbff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div className="llmpe-goal-floor" aria-hidden="true"/><div className="llmpe-goal-pivot" aria-hidden="true"/>
    <div className="llmpe-goal-assembly" style={{ '--llmpe-angle': `${angle}deg` } as CSSProperties}>
      <div className="llmpe-goal-beam" aria-hidden="true"/>
      <div className="llmpe-goal-orb-anchor llmpe-goal-orb-left"><div className="llmpe-goal-platform" aria-hidden="true"/><div className="llmpe-goal-orb llmpe-goal-orb-orange"><Typography variant="body" tone="inherit">知识拥有者</Typography></div></div>
      <div className="llmpe-goal-orb-anchor llmpe-goal-orb-right"><div className="llmpe-goal-platform" aria-hidden="true"/><div className="llmpe-goal-orb llmpe-goal-orb-blue" onPointerEnter={start} onClick={start} onFocus={start} tabIndex={0} aria-label="知识探索者；移入鼠标或聚焦可提前触发跷跷板转换"><Typography variant="body" tone="inherit">知识探索者</Typography></div></div>
    </div>
    <div className="llmpe-goal-conclusion"><svg viewBox="0 0 70 70" aria-hidden="true"><defs><linearGradient id="llmpe-goal-bars" x2="0" y2="1"><stop stopColor="#0870ff"/><stop offset="1" stopColor="#85c7ff"/></linearGradient></defs><path d="M6 44h14v20H6zM28 25h14v39H28zM50 7h14v57H50z" fill="url(#llmpe-goal-bars)"/></svg><Typography variant="h3" tone="inherit">竞争力正从 <span className="llmpe-goal-orange">“掌握多少已有知识”</span>，转向 <span className="llmpe-goal-blue">“能否更快理解并应用新知识”</span>。</Typography></div>
  </article>;
}
