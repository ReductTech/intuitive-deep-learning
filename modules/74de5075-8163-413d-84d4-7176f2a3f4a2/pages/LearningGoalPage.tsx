import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Typography } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-eb84a4af-1b2b-4794-93c0-211937fe12dd" viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-b381c64f-a708-4156-94b5-d6c6dfcae4af" d={paths[kind]}/></svg>;
}
function GoalCard({ icon, text }: { icon: Kind; text: string }) {
  return <div shuku-edit-id="e-f9aaa0ad-bc4d-4e87-b810-d6cf4c56f028" className="cg-goal-card"><span shuku-edit-id="e-d8b689a7-c65c-4eba-a4d7-c62c37571eb5" className="cg-goal-card-icon"><GoalIcon kind={icon}/></span><Typography shuku-edit-id="e-fe623718-bb6a-4d49-84e3-2e71eeb93728" variant="body" tone="inherit">{text}</Typography></div>;
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
  return <article shuku-edit-id="e-67b03fc3-d6e3-43a5-bfba-8736ab09d36d" ref={root} className="cg-goal-page" data-state={angle === 12 ? 'understanding' : started ? 'moving' : 'knowledge'} data-angle={angle} aria-labelledby="cg-goal-title">
    <header shuku-edit-id="e-3f1739df-3a8b-43d4-94af-b61f2e4769d1" className="cg-goal-header"><Typography shuku-edit-id="e-b2926886-2324-48ab-9f42-32e0dbf9d96a" as="h1" id="cg-goal-title" variant="display" tone="inherit">AI 时代，学习的重点或从积累知识转向理解与应用</Typography><Typography shuku-edit-id="e-db9f3bd0-ccfb-44f0-911c-d592dffdac3f" variant="subtitle" tone="inherit">过去，我们需要花几年时间积累知识。未来，更重要的是快速理解和应用新知识的能力。</Typography></header>
    <section shuku-edit-id="e-e2f3c695-50a0-4c98-ba89-3dbae395bf86" className="cg-goal-side cg-goal-old" aria-labelledby="cg-goal-old-title"><Typography shuku-edit-id="e-0ed8b396-d129-411a-a9eb-b81da58e5752" as="h2" id="cg-goal-old-title" variant="h2" tone="inherit" className="cg-goal-pill">工业时代</Typography><div shuku-edit-id="e-bf4c05c5-ac9e-4609-b3c7-f86a1c2af7ba" className="cg-goal-cards"><GoalCard icon="book" text="学习多年"/><GoalCard icon="cap" text="掌握专业知识"/><GoalCard icon="gear" text="稳定应用"/></div></section>
    <section shuku-edit-id="e-97e11fa1-7a27-4f69-90bd-27456d3fc063" className="cg-goal-side cg-goal-new" aria-labelledby="cg-goal-new-title"><Typography shuku-edit-id="e-260db49e-52e1-44dc-a97f-5f5f57c7edd7" as="h2" id="cg-goal-new-title" variant="h2" tone="inherit" className="cg-goal-pill">AI时代</Typography><div shuku-edit-id="e-2532ea90-4b65-4f6d-bd2b-1feee3ab5b3c" className="cg-goal-cards"><GoalCard icon="light" text="遇到新问题"/><GoalCard icon="search" text="快速理解"/><GoalCard icon="rocket" text="快速应用"/><GoalCard icon="refresh" text="持续迭代"/></div></section>
    <svg shuku-edit-id="e-46ada9ea-b835-4cef-8c12-d351912ef6e0" className="cg-goal-connections" viewBox="0 0 1600 900" aria-hidden="true">
      {[352, 478, 604].map((y, i) => <g shuku-edit-id="e-52edf969-4e85-48dc-8f17-d33c75c36185" key={y}><path shuku-edit-id="e-b484df36-f299-4255-ad74-038a0194a591" d={`M375 ${y}C445 ${y} 400 ${left.y + (i - 1) * 30} ${left.x - 85} ${left.y + (i - 1) * 22}`} stroke="#f0b97f"/><circle shuku-edit-id="e-8801a91c-44c7-451f-87f8-2b58feed370e" cx="375" cy={y} r="3" fill="#f0b97f"/></g>)}
      {[326, 426, 526, 626].map((y, i) => <g shuku-edit-id="e-99f2ea15-b7ed-4294-9bb1-99acff79e17f" key={y}><path shuku-edit-id="e-fc3ee0de-ef5b-4789-a207-014d0e5c262b" d={`M${right.x + 85} ${right.y + (i - 1.5) * 20}C1220 ${right.y + (i - 1.5) * 20} 1170 ${y} 1256 ${y}`} stroke="#79b5ff"/><circle shuku-edit-id="e-01478f66-1f2e-47d2-883e-b8e4ff6efea5" cx="1256" cy={y} r="3" fill="#79b5ff"/></g>)}
    </svg>
    <div shuku-edit-id="e-164904a4-e6cb-46c4-a2eb-80f60d274bf4" className="cg-goal-core"><Typography shuku-edit-id="e-c5b15152-f2b8-48ab-8e98-e494408d914b" variant="body" tone="inherit">过去教育培养的是<span shuku-edit-id="e-f6d78e5c-dc12-4b25-b8d9-feddb7150816" className="cg-goal-orange">“知识拥有者”</span></Typography><Typography shuku-edit-id="e-41788277-e811-42ae-88e9-df2216c2ee86" variant="body" tone="inherit">AI时代更需要<span shuku-edit-id="e-7ffbe57e-66dd-4ef1-8059-015907e87bc8" className="cg-goal-blue">“知识探索者”</span></Typography></div>
    <div shuku-edit-id="e-65f88ce6-ac3a-4547-a6fd-3eeb5f086f82" className="cg-goal-direction"><svg shuku-edit-id="e-353bfc25-d5a9-40c1-a741-79510916d3a1" viewBox="0 0 420 130" aria-hidden="true"><defs shuku-edit-id="e-d3417e87-2ea1-4a57-b0d1-4e1d6b03c337"><linearGradient shuku-edit-id="e-fde0005b-c304-4596-a4ea-d0368164fb5e" id="cg-goal-arrow"><stop shuku-edit-id="e-0db2ae0e-80b4-4964-992a-6371b740d7eb" stopColor="#ffdbc0"/><stop shuku-edit-id="e-f70ac562-87ab-4abe-950f-5607cf6c9189" offset="1" stopColor="#88bbff"/></linearGradient></defs><path shuku-edit-id="e-5854e185-fe40-467d-8990-4196270a01f3" d="M15 115Q175-5 390 35" fill="none" stroke="url(#cg-goal-arrow)" strokeWidth="10" strokeLinecap="round"/><path shuku-edit-id="e-6d8d6c23-65de-4c44-a163-6f9bbc636f00" d="m375 15 28 23-31 16" fill="none" stroke="#88bbff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div shuku-edit-id="e-4d9018f2-5388-49d0-be13-23b398bbf36c" className="cg-goal-floor" aria-hidden="true"/><div shuku-edit-id="e-7ba36def-81d4-4af3-ac01-eba85c95f81f" className="cg-goal-pivot" aria-hidden="true"/>
    <div shuku-edit-id="e-bf737705-6d43-45ce-b4ca-440d42bc075b" className="cg-goal-assembly" style={{ '--cg-angle': `${angle}deg` } as CSSProperties}>
      <div shuku-edit-id="e-f23ecc69-3d59-4637-a59f-49fbb4297ba8" className="cg-goal-beam" aria-hidden="true"/>
      <div shuku-edit-id="e-6b0505c4-f305-49d4-bc17-d48693c3e57e" className="cg-goal-orb-anchor cg-goal-orb-left"><div shuku-edit-id="e-4c99f822-2b9d-4e66-9d6c-c7f80ec1c0e4" className="cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-df5bc23f-65bb-4d2f-921d-649a36ba1ffd" className="cg-goal-orb cg-goal-orb-orange"><Typography shuku-edit-id="e-9c21be55-6775-4428-b039-9f978891b7d3" variant="body" tone="inherit">知识拥有者</Typography></div></div>
      <div shuku-edit-id="e-797e7c18-2496-4e28-9ab5-fd8ad57ddd86" className="cg-goal-orb-anchor cg-goal-orb-right"><div shuku-edit-id="e-faf5d1df-5ab1-4c22-9a74-526762911441" className="cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-3e20fd59-a7f1-4f89-b751-343ecbb3c189" className="cg-goal-orb cg-goal-orb-blue" onPointerEnter={start} onClick={start} onFocus={start} tabIndex={0} aria-label="知识探索者；移入鼠标或聚焦可提前触发跷跷板转换"><Typography shuku-edit-id="e-7546b6b1-9977-499e-b70f-8b34b595454c" variant="body" tone="inherit">知识探索者</Typography></div></div>
    </div>
    <div shuku-edit-id="e-532740ba-94dc-44c4-9998-87815a9b63ad" className="cg-goal-conclusion"><svg shuku-edit-id="e-090f44c7-0e74-4d70-9ec7-92ae18a0b7c6" viewBox="0 0 70 70" aria-hidden="true"><defs shuku-edit-id="e-badce75b-11d8-4c07-aea9-fc2ae888f0d0"><linearGradient shuku-edit-id="e-a16b0a9a-480f-4022-b1d2-94c66ae60a5f" id="cg-goal-bars" x2="0" y2="1"><stop shuku-edit-id="e-4f1649df-4608-45e8-898a-4b735f887717" stopColor="#0870ff"/><stop shuku-edit-id="e-875efd38-6f72-4622-920b-8c0f0752ab68" offset="1" stopColor="#85c7ff"/></linearGradient></defs><path shuku-edit-id="e-e88108c7-d1fa-4686-a3ed-b033fcd9f30f" d="M6 44h14v20H6zM28 25h14v39H28zM50 7h14v57H50z" fill="url(#cg-goal-bars)"/></svg><Typography shuku-edit-id="e-f1fab037-32bd-4547-a2e4-f0df801880d8" variant="h3" tone="inherit">竞争力正从 <span shuku-edit-id="e-244f7ee8-1d26-482f-a771-c23e6f02a0fb" className="cg-goal-orange">“掌握多少已有知识”</span>，转向 <span shuku-edit-id="e-b21212fc-84ea-4a10-91a5-35f6ce39d1be" className="cg-goal-blue">“能否更快理解并应用新知识”</span>。</Typography></div>
  </article>;
}
