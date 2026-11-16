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
  return <svg shuku-edit-id="e-01f70b32-69ab-49eb-9d36-95b12e9d58be" viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-4227f10a-0146-4d66-a8c6-061dc11963cf" d={paths[kind]}/></svg>;
}
function GoalCard({ icon, text }: { icon: Kind; text: string }) {
  return <div shuku-edit-id="e-a86c7638-037a-4a36-ac1e-a23e21d9a80a" className="llmpe-goal-card"><span shuku-edit-id="e-ea44c6cd-e614-49c4-91f7-f3de52df9c2f" className="llmpe-goal-card-icon"><GoalIcon kind={icon}/></span><Typography shuku-edit-id="e-8a769e61-cea3-4ab3-a72c-102df53f054a" variant="body" tone="inherit">{text}</Typography></div>;
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
  return <article shuku-edit-id="e-884a4c75-ff29-49a2-9b5e-d62f7092b0d1" ref={root} className="llmpe-goal-page" data-state={angle === 12 ? 'understanding' : started ? 'moving' : 'knowledge'} data-angle={angle} aria-labelledby="llmpe-goal-title">
    <header shuku-edit-id="e-f48eca7d-3f41-4856-8c7a-4fa16b5d6436" className="llmpe-goal-header"><Typography shuku-edit-id="e-091ed781-fb40-4ce6-aa36-59e3c495e494" as="h1" id="llmpe-goal-title" variant="display" tone="inherit">AI 时代，学习的重点或从积累知识转向理解与应用</Typography><Typography shuku-edit-id="e-3617627d-06b0-4f2f-9b14-bb282c6b4af3" variant="subtitle" tone="inherit">过去，我们需要花几年时间积累知识。未来，更重要的是快速理解和应用新知识的能力。</Typography></header>
    <section shuku-edit-id="e-6b37c862-d41c-4ce6-a42d-9056a67adaa5" className="llmpe-goal-side llmpe-goal-old" aria-labelledby="llmpe-goal-old-title"><Typography shuku-edit-id="e-84a4f8e3-0918-46a1-8d79-dd6bfc503eb2" as="h2" id="llmpe-goal-old-title" variant="h2" tone="inherit" className="llmpe-goal-pill">工业时代</Typography><div shuku-edit-id="e-2c11aa64-6526-4192-aa7d-51981f190b31" className="llmpe-goal-cards"><GoalCard icon="book" text="学习多年"/><GoalCard icon="cap" text="掌握专业知识"/><GoalCard icon="gear" text="稳定应用"/></div></section>
    <section shuku-edit-id="e-379734a6-5e96-4494-8bda-e9cc63ce6550" className="llmpe-goal-side llmpe-goal-new" aria-labelledby="llmpe-goal-new-title"><Typography shuku-edit-id="e-645c9a4d-819c-41d4-aea0-bc944cc907dd" as="h2" id="llmpe-goal-new-title" variant="h2" tone="inherit" className="llmpe-goal-pill">AI时代</Typography><div shuku-edit-id="e-1cb26db5-57b1-49f6-846e-2093ab73f1a9" className="llmpe-goal-cards"><GoalCard icon="light" text="遇到新问题"/><GoalCard icon="search" text="快速理解"/><GoalCard icon="rocket" text="快速应用"/><GoalCard icon="refresh" text="持续迭代"/></div></section>
    <svg shuku-edit-id="e-81a130fc-199f-4f02-b8ee-dccbb1788af2" className="llmpe-goal-connections" viewBox="0 0 1600 900" aria-hidden="true">
      {[352, 478, 604].map((y, i) => <g shuku-edit-id="e-5c3da573-a2f5-4de8-b200-42fcc9f60540" key={y}><path shuku-edit-id="e-a9f5cf0e-6303-4024-b6fb-d34b5abdd36e" d={`M375 ${y}C445 ${y} 400 ${left.y + (i - 1) * 30} ${left.x - 85} ${left.y + (i - 1) * 22}`} stroke="#f0b97f"/><circle shuku-edit-id="e-c76cfcd3-01be-4702-9592-303d70ef2235" cx="375" cy={y} r="3" fill="#f0b97f"/></g>)}
      {[326, 426, 526, 626].map((y, i) => <g shuku-edit-id="e-832e085a-94c6-4a21-99fd-25b2996babe2" key={y}><path shuku-edit-id="e-ab9ed930-ab7c-4c40-b855-be98e2b326f6" d={`M${right.x + 85} ${right.y + (i - 1.5) * 20}C1220 ${right.y + (i - 1.5) * 20} 1170 ${y} 1256 ${y}`} stroke="#79b5ff"/><circle shuku-edit-id="e-ec9e3efe-518c-4815-805a-fcb650304705" cx="1256" cy={y} r="3" fill="#79b5ff"/></g>)}
    </svg>
    <div shuku-edit-id="e-564aa200-a030-44a5-9cf2-ebd4fe7e7501" className="llmpe-goal-core"><Typography shuku-edit-id="e-9e095a8c-35a6-4ae7-a454-4db6d339d0f2" variant="body" tone="inherit">过去教育培养的是<span shuku-edit-id="e-82102527-3540-49c6-8671-edab8bca1ee6" className="llmpe-goal-orange">“知识拥有者”</span></Typography><Typography shuku-edit-id="e-62ce962b-dfc2-4514-91fc-148ad477c5fd" variant="body" tone="inherit">AI时代更需要<span shuku-edit-id="e-81f326dd-ba07-4ca6-a4b8-4e981734cad9" className="llmpe-goal-blue">“知识探索者”</span></Typography></div>
    <div shuku-edit-id="e-5217ee71-683b-4398-9edf-56d3b11a6ea2" className="llmpe-goal-direction"><svg shuku-edit-id="e-463186c4-db6c-43f9-bef0-114f85a208ae" viewBox="0 0 420 130" aria-hidden="true"><defs shuku-edit-id="e-656150d6-9c1c-4eb3-a243-5fe52b1fb479"><linearGradient shuku-edit-id="e-809d1bf5-28bf-4157-abc9-b5fbbfd61d8e" id="llmpe-goal-arrow"><stop shuku-edit-id="e-93daf304-b3d2-4f8e-aa45-f8d5b1701cf5" stopColor="#ffdbc0"/><stop shuku-edit-id="e-2261e395-1d4c-400e-a264-5a85a5370f75" offset="1" stopColor="#88bbff"/></linearGradient></defs><path shuku-edit-id="e-e9ed28ef-7ea5-400a-b4e0-b5f861ef2187" d="M15 115Q175-5 390 35" fill="none" stroke="url(#llmpe-goal-arrow)" strokeWidth="10" strokeLinecap="round"/><path shuku-edit-id="e-ec54c432-0149-4f6a-9c79-9cc4f3100ef9" d="m375 15 28 23-31 16" fill="none" stroke="#88bbff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div shuku-edit-id="e-5cb9a40b-0146-4a26-9272-e2e6fe5fdab1" className="llmpe-goal-floor" aria-hidden="true"/><div shuku-edit-id="e-8b77cc2b-ad63-4bfc-bea7-14784365ecdd" className="llmpe-goal-pivot" aria-hidden="true"/>
    <div shuku-edit-id="e-5f71a627-74d7-441c-bedf-3eb15eabb73e" className="llmpe-goal-assembly" style={{ '--llmpe-angle': `${angle}deg` } as CSSProperties}>
      <div shuku-edit-id="e-a1f88196-534b-4bac-ab8f-5c9173203b60" className="llmpe-goal-beam" aria-hidden="true"/>
      <div shuku-edit-id="e-72d6a20f-3986-4f79-bd0d-42d7bc516ac8" className="llmpe-goal-orb-anchor llmpe-goal-orb-left"><div shuku-edit-id="e-925a8104-a645-4931-b9ad-90da570cbbb9" className="llmpe-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-aa503f91-7e94-4c6c-90af-5add1186bd97" className="llmpe-goal-orb llmpe-goal-orb-orange"><Typography shuku-edit-id="e-9698de55-de19-4ca8-a44f-cd5cf1711515" variant="body" tone="inherit">知识拥有者</Typography></div></div>
      <div shuku-edit-id="e-0e5741ac-450d-4e85-b7e2-93a5d0e7aab1" className="llmpe-goal-orb-anchor llmpe-goal-orb-right"><div shuku-edit-id="e-9c2aa359-24a3-448f-903c-3ac7eca63373" className="llmpe-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-793c9e68-7262-41c3-bbd8-198db8632ee5" className="llmpe-goal-orb llmpe-goal-orb-blue" onPointerEnter={start} onClick={start} onFocus={start} tabIndex={0} aria-label="知识探索者；移入鼠标或聚焦可提前触发跷跷板转换"><Typography shuku-edit-id="e-f5fda239-e4c3-4650-95a9-a8c6472c9bac" variant="body" tone="inherit">知识探索者</Typography></div></div>
    </div>
    <div shuku-edit-id="e-83845adb-e93d-4a50-9970-6cf0ebb46649" className="llmpe-goal-conclusion"><svg shuku-edit-id="e-490f3cfd-1c27-4b21-a512-5b925675beb1" viewBox="0 0 70 70" aria-hidden="true"><defs shuku-edit-id="e-c7b7e115-925b-4ed1-9d90-b6efa6873060"><linearGradient shuku-edit-id="e-8156b8ab-d375-4c4f-8d0a-e1c718edaca8" id="llmpe-goal-bars" x2="0" y2="1"><stop shuku-edit-id="e-e16c6338-b080-4fc3-80ea-a08fd22444af" stopColor="#0870ff"/><stop shuku-edit-id="e-e2e1c53a-fe0e-4883-95b0-eecd53f48eaf" offset="1" stopColor="#85c7ff"/></linearGradient></defs><path shuku-edit-id="e-0d8c3ac4-9fac-465c-91cb-d0bbc746582e" d="M6 44h14v20H6zM28 25h14v39H28zM50 7h14v57H50z" fill="url(#llmpe-goal-bars)"/></svg><Typography shuku-edit-id="e-02c62416-ff03-49be-a1a9-10b691077cb2" variant="h3" tone="inherit">竞争力正从 <span shuku-edit-id="e-56c8990b-abc2-4a05-a541-9ad9350a4575" className="llmpe-goal-orange">“掌握多少已有知识”</span>，转向 <span shuku-edit-id="e-2e5ff3d1-d6f6-479c-8511-37db0a98fc6e" className="llmpe-goal-blue">“能否更快理解并应用新知识”</span>。</Typography></div>
  </article>;
}
