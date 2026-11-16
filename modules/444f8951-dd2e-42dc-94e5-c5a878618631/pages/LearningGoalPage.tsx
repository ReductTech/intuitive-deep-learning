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
  return <svg shuku-edit-id="e-076a28b0-b8a2-41a1-8945-9feccca3e6f0" viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-8715fef1-16a7-46f6-a7d4-bbbb1fc488e9" d={paths[kind]}/></svg>;
}
function GoalCard({ icon, text }: { icon: Kind; text: string }) {
  return <div shuku-edit-id="e-eff49fd9-c45f-423d-8f72-e09ecbc3ceef" className="cg-goal-card"><span shuku-edit-id="e-d2a2587a-0e81-4e2c-b3f3-63833e6ca90d" className="cg-goal-card-icon"><GoalIcon kind={icon}/></span><Typography shuku-edit-id="e-ff9c5f5b-25b1-4bb9-a887-193b5a36fb52" variant="body" tone="inherit">{text}</Typography></div>;
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
  return <article shuku-edit-id="e-b99a8453-5561-429d-9cef-6120a89daedd" ref={root} className="cg-goal-page" data-state={angle === 12 ? 'understanding' : started ? 'moving' : 'knowledge'} data-angle={angle} aria-labelledby="cg-goal-title">
    <header shuku-edit-id="e-8c17ebdf-efc2-4e1c-88e7-91b202462b01" className="cg-goal-header"><Typography shuku-edit-id="e-66ec90c2-8f43-458f-8441-87bb2be4e7a6" as="h1" id="cg-goal-title" variant="display" tone="inherit">AI 时代，学习的重点或从积累知识转向理解与应用</Typography><Typography shuku-edit-id="e-b5c0d26a-18b6-45bd-86c6-07c93431abf6" variant="subtitle" tone="inherit">过去，我们需要花几年时间积累知识。未来，更重要的是快速理解和应用新知识的能力。</Typography></header>
    <section shuku-edit-id="e-d176be26-46f1-46a7-9359-7484fc2634bf" className="cg-goal-side cg-goal-old" aria-labelledby="cg-goal-old-title"><Typography shuku-edit-id="e-32982e28-8d67-41f8-9cdb-a049d352614a" as="h2" id="cg-goal-old-title" variant="h2" tone="inherit" className="cg-goal-pill">工业时代</Typography><div shuku-edit-id="e-1520e4a3-822c-44b4-bdd4-a64423c34d08" className="cg-goal-cards"><GoalCard icon="book" text="学习多年"/><GoalCard icon="cap" text="掌握专业知识"/><GoalCard icon="gear" text="稳定应用"/></div></section>
    <section shuku-edit-id="e-258e0b7f-9678-49e6-bb97-be9f24baab6c" className="cg-goal-side cg-goal-new" aria-labelledby="cg-goal-new-title"><Typography shuku-edit-id="e-2ffa3f3c-6344-4c45-8aca-be27aaa368ab" as="h2" id="cg-goal-new-title" variant="h2" tone="inherit" className="cg-goal-pill">AI时代</Typography><div shuku-edit-id="e-ea507fc7-f9f4-497c-a06a-abde00a5510e" className="cg-goal-cards"><GoalCard icon="light" text="遇到新问题"/><GoalCard icon="search" text="快速理解"/><GoalCard icon="rocket" text="快速应用"/><GoalCard icon="refresh" text="持续迭代"/></div></section>
    <svg shuku-edit-id="e-d0c2ec01-ef97-4609-92fe-0a603172e169" className="cg-goal-connections" viewBox="0 0 1600 900" aria-hidden="true">
      {[352, 478, 604].map((y, i) => <g shuku-edit-id="e-062bb368-cdff-468b-8fa3-ab59e2c8c31b" key={y}><path shuku-edit-id="e-2627366d-4298-4cc6-ab7f-2883cb79f507" d={`M375 ${y}C445 ${y} 400 ${left.y + (i - 1) * 30} ${left.x - 85} ${left.y + (i - 1) * 22}`} stroke="#f0b97f"/><circle shuku-edit-id="e-103beb1d-26b4-4527-9742-f66284dbf386" cx="375" cy={y} r="3" fill="#f0b97f"/></g>)}
      {[326, 426, 526, 626].map((y, i) => <g shuku-edit-id="e-7edb1973-46f6-4d9a-8f56-7abd2800f52c" key={y}><path shuku-edit-id="e-f14264bd-1ade-429e-8090-695c2063632d" d={`M${right.x + 85} ${right.y + (i - 1.5) * 20}C1220 ${right.y + (i - 1.5) * 20} 1170 ${y} 1256 ${y}`} stroke="#79b5ff"/><circle shuku-edit-id="e-e5bd0327-bfb1-4b66-aa84-a214b19fabca" cx="1256" cy={y} r="3" fill="#79b5ff"/></g>)}
    </svg>
    <div shuku-edit-id="e-3f117726-c8ff-4711-b699-9a74b4aed61b" className="cg-goal-core"><Typography shuku-edit-id="e-2be5ff13-9d08-4e3c-8024-9999efce2dc4" variant="body" tone="inherit">过去教育培养的是<span shuku-edit-id="e-238aae11-c8c1-41cd-a717-bc682081cc7d" className="cg-goal-orange">“知识拥有者”</span></Typography><Typography shuku-edit-id="e-05aee5de-04ed-4c1f-ab48-bdf50d4188fb" variant="body" tone="inherit">AI时代更需要<span shuku-edit-id="e-ca59600c-cf59-45eb-863c-887232598947" className="cg-goal-blue">“知识探索者”</span></Typography></div>
    <div shuku-edit-id="e-3bc46239-165c-4306-b135-9fbec38b02fe" className="cg-goal-direction"><svg shuku-edit-id="e-49cc6671-b82a-4a13-ba3f-7fd682180dd0" viewBox="0 0 420 130" aria-hidden="true"><defs shuku-edit-id="e-03de1841-8369-4ccd-82ec-c5d7a6eff165"><linearGradient shuku-edit-id="e-9ac97a61-5e1f-4b96-8f1e-eeabca5978af" id="cg-goal-arrow"><stop shuku-edit-id="e-ec8ddef8-3bd3-4d0b-a462-fa27232eb005" stopColor="#ffdbc0"/><stop shuku-edit-id="e-50de2d46-df3c-43cb-a982-eb009c597ffe" offset="1" stopColor="#88bbff"/></linearGradient></defs><path shuku-edit-id="e-8e5f9af5-462f-487c-9477-2313db744fca" d="M15 115Q175-5 390 35" fill="none" stroke="url(#cg-goal-arrow)" strokeWidth="10" strokeLinecap="round"/><path shuku-edit-id="e-160d93aa-0206-412d-be24-cf1e0e308a48" d="m375 15 28 23-31 16" fill="none" stroke="#88bbff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div shuku-edit-id="e-31e4432b-2365-4184-808a-52dc26697ebc" className="cg-goal-floor" aria-hidden="true"/><div shuku-edit-id="e-d7fe7c14-6f1b-4fca-bdeb-c673f05869e4" className="cg-goal-pivot" aria-hidden="true"/>
    <div shuku-edit-id="e-437138e4-b36f-4e0b-977a-2b0c0f3c6797" className="cg-goal-assembly" style={{ '--cg-angle': `${angle}deg` } as CSSProperties}>
      <div shuku-edit-id="e-e37f3646-2443-4c2e-8cdf-bb1e1d09443e" className="cg-goal-beam" aria-hidden="true"/>
      <div shuku-edit-id="e-66ac8617-bcf3-48ea-ac62-336da1ab6a38" className="cg-goal-orb-anchor cg-goal-orb-left"><div shuku-edit-id="e-32505757-31af-4f49-aa10-a8c5cf1fdf7a" className="cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-f878123c-40a8-43b6-bc54-f73ed884a0fd" className="cg-goal-orb cg-goal-orb-orange"><Typography shuku-edit-id="e-1a8373db-6a4b-4da5-a427-8c607d4bdb74" variant="body" tone="inherit">知识拥有者</Typography></div></div>
      <div shuku-edit-id="e-5ff76f69-ceb9-4d5b-9d69-d5800fdf141e" className="cg-goal-orb-anchor cg-goal-orb-right"><div shuku-edit-id="e-a811c955-c418-4b1d-b0db-6d92a2f1447e" className="cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-3cdbeedb-13ce-4ac3-b381-183a967b70f4" className="cg-goal-orb cg-goal-orb-blue" onPointerEnter={start} onClick={start} onFocus={start} tabIndex={0} aria-label="知识探索者；移入鼠标或聚焦可提前触发跷跷板转换"><Typography shuku-edit-id="e-31963dda-9e26-4c34-9b3e-1fba3d346abc" variant="body" tone="inherit">知识探索者</Typography></div></div>
    </div>
    <div shuku-edit-id="e-3c7b1058-5348-4331-adc7-9a2e739e504d" className="cg-goal-conclusion"><svg shuku-edit-id="e-3ce7dafe-8e0e-4864-8e53-91d5df51d474" viewBox="0 0 70 70" aria-hidden="true"><defs shuku-edit-id="e-ce3c1380-f032-4ce4-8cdc-68852d3516f7"><linearGradient shuku-edit-id="e-7c0543e7-280c-4289-b748-3d3225f8501d" id="cg-goal-bars" x2="0" y2="1"><stop shuku-edit-id="e-dd53b1e5-b3e9-44a8-a389-f348750ca1f5" stopColor="#0870ff"/><stop shuku-edit-id="e-80f4b0a4-8571-4a94-aeae-ea05a6a48f66" offset="1" stopColor="#85c7ff"/></linearGradient></defs><path shuku-edit-id="e-7a26c723-b78f-45f4-9e83-838d3c42f40b" d="M6 44h14v20H6zM28 25h14v39H28zM50 7h14v57H50z" fill="url(#cg-goal-bars)"/></svg><Typography shuku-edit-id="e-4cc8abc6-747f-4270-9653-beb15169771e" variant="h3" tone="inherit">竞争力正从 <span shuku-edit-id="e-e167295c-77c7-4b91-b1ee-9cf6e1c8f26b" className="cg-goal-orange">“掌握多少已有知识”</span>，转向 <span shuku-edit-id="e-dc3b4557-928e-4759-bf14-0525e3f51cad" className="cg-goal-blue">“能否更快理解并应用新知识”</span>。</Typography></div>
  </article>;
}
