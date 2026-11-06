import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { BookOpen, FileText, MessageSquare } from 'lucide-react';
import { Typography } from '../../../shared/react';
import './UserFoundationPage.css';

const END = 7200;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return 1 - (1 - t) ** 3; };
const entrance = (time: number, start: number): CSSProperties => {
  const t = ease((time - start) / 850);
  return { opacity: t, transform: `translateY(${18 * (1 - t)}px)` };
};
const capabilities = [
  { label: '内容展示', Icon: FileText },
  { label: '在线学习', Icon: BookOpen },
  { label: '用户反馈', Icon: MessageSquare },
];

// Symbolic audience and content motifs, rather than measured population data.
const AudienceBand = memo(function AudienceBand() {
  return <svg className="rf-users-audience" viewBox="0 0 1600 235" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="rf-users-band-wash" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#edf6fc" stopOpacity="0"/><stop offset=".7" stopColor="#e9f3fb" stopOpacity=".8"/><stop offset="1" stopColor="#f4f9fd" stopOpacity="0"/></linearGradient>
      <linearGradient id="rf-users-line-fade"><stop stopColor="#b7d6ef" stopOpacity=".3"/><stop offset=".5" stopColor="#c7e0f3" stopOpacity=".65"/><stop offset="1" stopColor="#a6cde9" stopOpacity=".35"/></linearGradient>
    </defs>
    <rect width="1600" height="235" fill="url(#rf-users-band-wash)"/>
    {Array.from({ length: 5 }, (_, row) => Array.from({ length: 27 }, (_, column) => {
      const size = .5 + row * .19;
      const x = 18 + column * 59 + (row % 2) * 17;
      const y = 65 + row * 21 + Math.sin(column * .49 + row * .25) * 11;
      return <g key={`${row}-${column}`} transform={`translate(${x} ${y}) scale(${size})`} fill="#87adcb" opacity={.12 + row * .07}>
        <circle cy="-8" r="4.2"/><path d="M-8 8V4c0-5 3-8 8-8s8 3 8 8v4Z"/>
      </g>;
    }))}
    {Array.from({ length: 20 }, (_, i) => <path key={i} d={`M0 ${103 + i * 3} C300 ${192 - i * 1.7} 520 ${88 + i * 2} 820 ${134 + i * 1.1} S1300 ${199 - i * 2.2} 1600 ${87 + i * 3.3}`} stroke="url(#rf-users-line-fade)" strokeWidth=".7" fill="none"/>)}
    {[{ x: 1410, y: 117, s: 1 }, { x: 1490, y: 75, s: 1.3 }, { x: 1553, y: 137, s: .7 }].map(({ x, y, s }) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} opacity=".55"><circle r="15" fill="#fff" stroke="#668fb2" strokeWidth="1.5"/><path d="M-4-7 7 0-4 7Z" fill="#668fb2"/></g>)}
  </svg>;
});

export function UserFoundationPage() {
  const root = useRef<HTMLElement>(null), elapsed = useRef(0);
  const [time, setTime] = useState(0), [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false), [ready, setReady] = useState(false);
  const shownTime = reduced ? END : time;
  const learners = Math.round(6000 * ease((shownTime - 450) / 1800));
  const follows = 5 * ease((shownTime - 900) / 1800);
  const followsLabel = follows >= 5 ? '5' : follows.toFixed(1);
  useEffect(() => {
    const element = root.current; if (!element) return;
    let intersecting = false, cancelled = false;
    const visibility = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; visibility(); });
    observer.observe(element); document.addEventListener('visibilitychange', visibility);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(preference.matches); motion(); preference.addEventListener('change', motion);
    document.fonts.ready.then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; observer.disconnect(); document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', motion); };
  }, []);
  useEffect(() => {
    if (!visible || !ready || reduced || elapsed.current >= END) return;
    let frame = 0, last = performance.now();
    const tick = (now: number) => {
      elapsed.current = Math.min(END, elapsed.current + Math.max(0, Math.min(100, now - last)));
      setTime(elapsed.current); last = now;
      if (elapsed.current < END) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [visible, ready, reduced]);

  return <section ref={root} className="rf-page rf-users" aria-label="科研信息服务：前期平台与用户基础" data-capture-ready={ready} data-elapsed={Math.round(shownTime)} data-stage={shownTime >= END ? 'complete' : 'revealing'} data-playing={visible && ready && !reduced && time < END}>
    <header className="rf-users-heading" style={entrance(shownTime, 0)}>
      <Typography variant="body" className="rf-users-eyebrow">前期平台与用户基础</Typography>
      <span className="rf-users-accent" aria-hidden="true"/>
      <Typography as="h1" variant="display" className="rf-users-title">科研信息服务</Typography>
      <Typography variant="subtitle" className="rf-users-subtitle">服务平台 · 移动端应用</Typography>
    </header>
    <div className="rf-users-metrics" aria-label="用户与传播积累">
      <div className="rf-users-metric" style={entrance(shownTime, 350)} role="img" aria-label="累计学习用户6000以上">
        <Typography variant="display" className="rf-users-number" aria-hidden="true"><span data-metric="learners">{learners}</span><span className="rf-users-plus">+</span></Typography>
        <Typography variant="body" className="rf-users-metric-label">累计学习用户</Typography>
      </div>
      <div className="rf-users-metric" style={entrance(shownTime, 750)} role="img" aria-label="账号全网关注5万以上">
        <Typography variant="display" className="rf-users-number rf-users-follow-number" aria-hidden="true"><span data-metric="follows">{followsLabel}</span><span>万+</span></Typography>
        <Typography variant="body" className="rf-users-metric-label">账号全网关注</Typography>
      </div>
      <div className="rf-users-metric" style={entrance(shownTime, 1250)}>
        <Typography variant="display" className="rf-users-number rf-users-play-number">超百万次</Typography>
        <Typography variant="body" className="rf-users-metric-label">内容累计播放</Typography>
      </div>
    </div>
    <div className="rf-users-band" style={{ opacity: ease((shownTime - 450) / 1900) }}><AudienceBand/></div>
    <div className="rf-users-capabilities" aria-label="已有应用能力">{capabilities.map(({ label, Icon }, index) => <div key={label} style={entrance(shownTime, 2400 + index * 250)}><Icon aria-hidden="true"/><Typography variant="body">{label}</Typography></div>)}</div>
    <footer className="rf-users-conclusion" style={entrance(shownTime, 3400)}><i aria-hidden="true"/><Typography variant="body">为教育内容生成与评价研究提供真实应用基础</Typography><i aria-hidden="true"/></footer>
  </section>;
}
