import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { BookOpen, FileText, MessageSquare } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-da8689d0-73e1-4feb-b7b9-8f0ce84e747f" className="rf-users-audience" viewBox="0 0 1600 235" aria-hidden="true" focusable="false">
    <defs shuku-edit-id="e-4185fa4b-7021-438c-b6fa-e940208f3295">
      <linearGradient shuku-edit-id="e-bb90aa95-ff73-4d6f-a9f0-9f4ecda0932b" id="rf-users-band-wash" x1="0" y1="0" x2="0" y2="1"><stop shuku-edit-id="e-a3cd0eba-2154-415b-9f45-7bd62e817e7b" stopColor="#edf6fc" stopOpacity="0"/><stop shuku-edit-id="e-21e6bf2c-1056-4796-8ce7-b65037b59627" offset=".7" stopColor="#e9f3fb" stopOpacity=".8"/><stop shuku-edit-id="e-d8e9b266-d8ae-4a53-99ae-afb0498714cb" offset="1" stopColor="#f4f9fd" stopOpacity="0"/></linearGradient>
      <linearGradient shuku-edit-id="e-c85ac57c-0687-471c-9657-123447df2334" id="rf-users-line-fade"><stop shuku-edit-id="e-ba3a3150-cd65-49c5-b5e3-1bbf10b5c80b" stopColor="#b7d6ef" stopOpacity=".3"/><stop shuku-edit-id="e-7ad9952a-dd6f-48ac-8d0e-2643495995f9" offset=".5" stopColor="#c7e0f3" stopOpacity=".65"/><stop shuku-edit-id="e-bcd5f911-5e03-4222-a167-f53e9bce3627" offset="1" stopColor="#a6cde9" stopOpacity=".35"/></linearGradient>
    </defs>
    <rect shuku-edit-id="e-45d421ea-7964-4577-8d0e-0b23f37eed73" width="1600" height="235" fill="url(#rf-users-band-wash)"/>
    {Array.from({ length: 5 }, (_, row) => Array.from({ length: 27 }, (_, column) => {
      const size = .5 + row * .19;
      const x = 18 + column * 59 + (row % 2) * 17;
      const y = 65 + row * 21 + Math.sin(column * .49 + row * .25) * 11;
      return <g shuku-edit-id="e-51a6ac6f-edbf-441e-b284-2e807743f2b3" key={`${row}-${column}`} transform={`translate(${x} ${y}) scale(${size})`} fill="#87adcb" opacity={.12 + row * .07}>
        <circle shuku-edit-id="e-d7654d6d-dcca-44e6-ae3a-ef2e4baa6708" cy="-8" r="4.2"/><path shuku-edit-id="e-f345adb7-6189-4834-8984-faf4184554e3" d="M-8 8V4c0-5 3-8 8-8s8 3 8 8v4Z"/>
      </g>;
    }))}
    {Array.from({ length: 20 }, (_, i) => <path shuku-edit-id="e-3088aa30-2267-4976-9acf-a400bbe490bc" key={i} d={`M0 ${103 + i * 3} C300 ${192 - i * 1.7} 520 ${88 + i * 2} 820 ${134 + i * 1.1} S1300 ${199 - i * 2.2} 1600 ${87 + i * 3.3}`} stroke="url(#rf-users-line-fade)" strokeWidth=".7" fill="none"/>)}
    {[{ x: 1410, y: 117, s: 1 }, { x: 1490, y: 75, s: 1.3 }, { x: 1553, y: 137, s: .7 }].map(({ x, y, s }) => <g shuku-edit-id="e-98f6684e-2be8-41ef-b247-682e563c7d84" key={x} transform={`translate(${x} ${y}) scale(${s})`} opacity=".55"><circle shuku-edit-id="e-fecc9128-8de0-4822-9c52-64563d270cb0" r="15" fill="#fff" stroke="#668fb2" strokeWidth="1.5"/><path shuku-edit-id="e-9c636b13-227c-4fd5-85d2-f2b3fc6d25c7" d="M-4-7 7 0-4 7Z" fill="#668fb2"/></g>)}
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

  return <section shuku-edit-id="e-c0793cae-1e2c-4fa3-b8bb-cd9b4ef65303" ref={root} className="rf-page rf-users" aria-label="科研信息服务：前期平台与用户基础" data-capture-ready={ready} data-elapsed={Math.round(shownTime)} data-stage={shownTime >= END ? 'complete' : 'revealing'} data-playing={visible && ready && !reduced && time < END}>
    <header shuku-edit-id="e-a4815049-e060-4192-8c22-188ce898c4a5" className="rf-users-heading" style={entrance(shownTime, 0)}>
      <Typography shuku-edit-id="e-df3bdd5a-a2d8-407b-9034-1b00d3a10d1a" variant="body" className="rf-users-eyebrow">前期平台与用户基础</Typography>
      <span shuku-edit-id="e-0f747bba-cd5f-44a1-9fd1-42fccc354623" className="rf-users-accent" aria-hidden="true"/>
      <Typography shuku-edit-id="e-67d3786d-4c3d-41e8-b040-e76d74313c56" as="h1" variant="display" className="rf-users-title">科研信息服务</Typography>
      <Typography shuku-edit-id="e-d6e3836b-eb08-409a-8a00-6035f5b57bf0" variant="subtitle" className="rf-users-subtitle">服务平台 · 移动端应用</Typography>
    </header>
    <div shuku-edit-id="e-3f4b3e9e-b43a-4f2c-be7b-e08a680349dc" className="rf-users-metrics" aria-label="用户与传播积累">
      <div shuku-edit-id="e-1ad37d83-b457-4fd6-9c88-eb517e5f472f" className="rf-users-metric" style={entrance(shownTime, 350)} role="img" aria-label="累计学习用户6000以上">
        <Typography shuku-edit-id="e-feba6434-0e40-4e72-957a-3695e27e6b55" variant="display" className="rf-users-number" aria-hidden="true"><span shuku-edit-id="e-579e857b-2b85-49c4-9638-305a77448f35" data-metric="learners">{learners}</span><span shuku-edit-id="e-7efb462b-73dd-4e34-9474-cfcdec272168" className="rf-users-plus">+</span></Typography>
        <Typography shuku-edit-id="e-d8c660e1-dc55-4e8a-8366-65eb2d604a49" variant="body" className="rf-users-metric-label">累计学习用户</Typography>
      </div>
      <div shuku-edit-id="e-ed4da020-b7e5-46be-97a6-f1b1719529b2" className="rf-users-metric" style={entrance(shownTime, 750)} role="img" aria-label="账号全网关注5万以上">
        <Typography shuku-edit-id="e-a8645361-9871-43f0-82fe-a58dc0f001a1" variant="display" className="rf-users-number rf-users-follow-number" aria-hidden="true"><span shuku-edit-id="e-a907f612-dcab-4706-a349-98dfc5d60d4d" data-metric="follows">{followsLabel}</span><span shuku-edit-id="e-d98cd85d-f782-496e-8333-5c39e7f87964">万+</span></Typography>
        <Typography shuku-edit-id="e-72c5c932-ba24-4371-85a6-fb24d635f1cf" variant="body" className="rf-users-metric-label">账号全网关注</Typography>
      </div>
      <div shuku-edit-id="e-788338b3-4554-4015-895b-9aa6e96f50a3" className="rf-users-metric" style={entrance(shownTime, 1250)}>
        <Typography shuku-edit-id="e-e60cfa6c-4fda-47e6-b218-fe64af98f531" variant="display" className="rf-users-number rf-users-play-number">超百万次</Typography>
        <Typography shuku-edit-id="e-f5d768b1-fa06-4519-870a-a766e38531b3" variant="body" className="rf-users-metric-label">内容累计播放</Typography>
      </div>
    </div>
    <div shuku-edit-id="e-37118876-d369-4924-9913-608b26e250c2" className="rf-users-band" style={{ opacity: ease((shownTime - 450) / 1900) }}><AudienceBand/></div>
    <div shuku-edit-id="e-eae186c3-6a5c-4693-8fd0-5c98279053eb" className="rf-users-capabilities" aria-label="已有应用能力">{capabilities.map(({ label, Icon }, index) => <div shuku-edit-id="e-95be80a3-bf1d-463a-b42f-58b7e0df85f3" key={label} style={entrance(shownTime, 2400 + index * 250)}><Icon aria-hidden="true"/><Typography shuku-edit-id="e-f7fa7e51-5f4c-4a8a-9316-326d79899d86" variant="body">{label}</Typography></div>)}</div>
    <footer shuku-edit-id="e-676bc7f8-d791-430b-8c6e-401c5a17ad41" className="rf-users-conclusion" style={entrance(shownTime, 3400)}><i shuku-edit-id="e-9f328e65-a484-4967-9964-f0c63c50273c" aria-hidden="true"/><Typography shuku-edit-id="e-980e0e8f-f27f-4cb9-a7e8-f132444c983c" variant="body">为教育内容生成与评价研究提供真实应用基础</Typography><i shuku-edit-id="e-32a1f5ea-8889-4ef6-bc6a-f63655deb87a" aria-hidden="true"/></footer>
  </section>;
}
