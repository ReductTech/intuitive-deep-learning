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
  return <svg shuku-edit-id="e-6fc37219-2b9f-4f7c-96fd-1b5a20cf0078" viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-0340fa99-9362-45b6-9e21-af9cbbc7176a" d={paths[kind]}/></svg>;
}
function GoalCard({ icon, text }: { icon: Kind; text: string }) {
  return <div shuku-edit-id="e-62535336-365c-491d-af45-e958c0c848ae" className="llmpe-goal-card"><span shuku-edit-id="e-78d90b60-7a96-49cc-94bf-099062ca00cc" className="llmpe-goal-card-icon"><GoalIcon kind={icon}/></span><Typography shuku-edit-id="e-9427e908-c518-4e58-948e-398ce051d275" variant="body" tone="inherit">{text}</Typography></div>;
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
  return <article shuku-edit-id="e-319d60c1-a4bb-42d3-a890-3d67c7f45ae0" ref={root} className="llmpe-goal-page" data-state={angle === 12 ? 'understanding' : started ? 'moving' : 'knowledge'} data-angle={angle} aria-labelledby="llmpe-goal-title">
    <header shuku-edit-id="e-01874bf8-2017-48b0-9107-a87a9e856977" className="llmpe-goal-header"><Typography shuku-edit-id="e-927eb20d-953a-4528-8cf5-ab9b99b85d56" as="h1" id="llmpe-goal-title" variant="display" tone="inherit">AI 时代，学习的重点或从积累知识转向理解与应用</Typography><Typography shuku-edit-id="e-ceddee78-ac6d-4832-a310-78499f8cedcb" variant="subtitle" tone="inherit">过去，我们需要花几年时间积累知识。未来，更重要的是快速理解和应用新知识的能力。</Typography></header>
    <section shuku-edit-id="e-ff20649d-61c6-43bd-b6ca-77423cf3771c" className="llmpe-goal-side llmpe-goal-old" aria-labelledby="llmpe-goal-old-title"><Typography shuku-edit-id="e-5cdb3681-54c7-4139-b706-1c17451fcd28" as="h2" id="llmpe-goal-old-title" variant="h2" tone="inherit" className="llmpe-goal-pill">工业时代</Typography><div shuku-edit-id="e-06203c93-cad3-464f-8924-dde32aa1492f" className="llmpe-goal-cards"><GoalCard icon="book" text="学习多年"/><GoalCard icon="cap" text="掌握专业知识"/><GoalCard icon="gear" text="稳定应用"/></div></section>
    <section shuku-edit-id="e-f004909e-380c-4884-b0ed-cd89844b2bab" className="llmpe-goal-side llmpe-goal-new" aria-labelledby="llmpe-goal-new-title"><Typography shuku-edit-id="e-5901b7fe-55d1-4bb8-a20c-abc8c4b11d7a" as="h2" id="llmpe-goal-new-title" variant="h2" tone="inherit" className="llmpe-goal-pill">AI时代</Typography><div shuku-edit-id="e-5d1b0eff-e136-4dbf-a5ec-a1daa90073ea" className="llmpe-goal-cards"><GoalCard icon="light" text="遇到新问题"/><GoalCard icon="search" text="快速理解"/><GoalCard icon="rocket" text="快速应用"/><GoalCard icon="refresh" text="持续迭代"/></div></section>
    <svg shuku-edit-id="e-15398baf-0243-4596-a48b-ab06e63784f8" className="llmpe-goal-connections" viewBox="0 0 1600 900" aria-hidden="true">
      {[352, 478, 604].map((y, i) => <g shuku-edit-id="e-8a6f2705-fa91-4da8-b274-fe60e051ec5b" key={y}><path shuku-edit-id="e-088d590c-a0b2-4bb5-937b-a6f8f28e4dd0" d={`M375 ${y}C445 ${y} 400 ${left.y + (i - 1) * 30} ${left.x - 85} ${left.y + (i - 1) * 22}`} stroke="#f0b97f"/><circle shuku-edit-id="e-4b8b3ed2-db84-4af2-b874-2798506654f8" cx="375" cy={y} r="3" fill="#f0b97f"/></g>)}
      {[326, 426, 526, 626].map((y, i) => <g shuku-edit-id="e-c22157c4-e5a2-4669-aacf-bf48f336e8da" key={y}><path shuku-edit-id="e-f5174cca-45e2-4a54-9073-529768fe3442" d={`M${right.x + 85} ${right.y + (i - 1.5) * 20}C1220 ${right.y + (i - 1.5) * 20} 1170 ${y} 1256 ${y}`} stroke="#79b5ff"/><circle shuku-edit-id="e-3c942898-54ee-4cc9-8fea-96b098a9aaeb" cx="1256" cy={y} r="3" fill="#79b5ff"/></g>)}
    </svg>
    <div shuku-edit-id="e-e37c2af0-b23f-4ccf-9e9b-f7b7389a4289" className="llmpe-goal-core"><Typography shuku-edit-id="e-65460ac2-eb4c-4ccd-8124-3b2fbd405e4e" variant="body" tone="inherit">过去教育培养的是<span shuku-edit-id="e-b058d2a8-72ae-4bd9-80f5-dd00bdec0ad3" className="llmpe-goal-orange">“知识拥有者”</span></Typography><Typography shuku-edit-id="e-d15fbc98-c52a-4c9d-9ef5-c524bdb65d24" variant="body" tone="inherit">AI时代更需要<span shuku-edit-id="e-b455347c-5da0-4b52-90db-783da9bd1826" className="llmpe-goal-blue">“知识探索者”</span></Typography></div>
    <div shuku-edit-id="e-c3640970-2d12-4708-899c-79f68cbfdee2" className="llmpe-goal-direction"><svg shuku-edit-id="e-1f12bf31-2339-4bd6-b67e-9a239668481c" viewBox="0 0 420 130" aria-hidden="true"><defs shuku-edit-id="e-16750293-d244-4ba3-a152-3ec9d8b31458"><linearGradient shuku-edit-id="e-7b533d37-b2ca-4a05-a578-2b2fd3a1335b" id="llmpe-goal-arrow"><stop shuku-edit-id="e-f990663f-9389-4815-9f4f-8dcdb477d559" stopColor="#ffdbc0"/><stop shuku-edit-id="e-338b477c-c4b5-4b09-b764-6957902276d6" offset="1" stopColor="#88bbff"/></linearGradient></defs><path shuku-edit-id="e-3c35d8d4-c693-44db-9c72-3de6913ef5b9" d="M15 115Q175-5 390 35" fill="none" stroke="url(#llmpe-goal-arrow)" strokeWidth="10" strokeLinecap="round"/><path shuku-edit-id="e-394d812c-edf5-4cb6-86bb-4ea3fa25760e" d="m375 15 28 23-31 16" fill="none" stroke="#88bbff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div shuku-edit-id="e-c5d5ebe2-f493-4098-ac08-5e2e55665b42" className="llmpe-goal-floor" aria-hidden="true"/><div shuku-edit-id="e-0dc5971c-e90c-425c-acac-19cfe2018472" className="llmpe-goal-pivot" aria-hidden="true"/>
    <div shuku-edit-id="e-6c182101-9c3d-4755-8d34-481a24d8e066" className="llmpe-goal-assembly" style={{ '--llmpe-angle': `${angle}deg` } as CSSProperties}>
      <div shuku-edit-id="e-81e1ce89-b137-430f-aca6-0d8bc0965d97" className="llmpe-goal-beam" aria-hidden="true"/>
      <div shuku-edit-id="e-b801ebd5-e721-4abe-8897-136600edcf08" className="llmpe-goal-orb-anchor llmpe-goal-orb-left"><div shuku-edit-id="e-be5adb9a-6e87-4a78-8c26-c87fa078db49" className="llmpe-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-6cadeb01-e20f-4aad-b34d-2f17947495a8" className="llmpe-goal-orb llmpe-goal-orb-orange"><Typography shuku-edit-id="e-22998153-291f-4a26-b6cc-08c6653a4f75" variant="body" tone="inherit">知识拥有者</Typography></div></div>
      <div shuku-edit-id="e-4665676c-697a-4a86-af4b-b34e4bb818a1" className="llmpe-goal-orb-anchor llmpe-goal-orb-right"><div shuku-edit-id="e-043e65ab-b056-4f82-b466-8eac05d0c249" className="llmpe-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-76f57f8c-95f1-4cae-9c23-b8ec4457556e" className="llmpe-goal-orb llmpe-goal-orb-blue" onPointerEnter={start} onClick={start} onFocus={start} tabIndex={0} aria-label="知识探索者；移入鼠标或聚焦可提前触发跷跷板转换"><Typography shuku-edit-id="e-826792e1-d69e-435d-a2f1-7b27321feec2" variant="body" tone="inherit">知识探索者</Typography></div></div>
    </div>
    <div shuku-edit-id="e-7229d11a-991f-439b-a5e6-242486a9ab42" className="llmpe-goal-conclusion"><svg shuku-edit-id="e-60a7b9ff-dc2e-433c-998e-1e07a5c82e46" viewBox="0 0 70 70" aria-hidden="true"><defs shuku-edit-id="e-299e2c58-1a96-4466-9165-12ff6da51a6c"><linearGradient shuku-edit-id="e-bcbef761-4f6f-4187-933f-996570b5faf0" id="llmpe-goal-bars" x2="0" y2="1"><stop shuku-edit-id="e-ae4e6a66-7af5-4f56-9b49-0778664caff1" stopColor="#0870ff"/><stop shuku-edit-id="e-a1f5e94d-4c93-4e22-afb9-e9bf4e06f1f9" offset="1" stopColor="#85c7ff"/></linearGradient></defs><path shuku-edit-id="e-ba4257cb-450c-4f4b-ab62-73257311f297" d="M6 44h14v20H6zM28 25h14v39H28zM50 7h14v57H50z" fill="url(#llmpe-goal-bars)"/></svg><Typography shuku-edit-id="e-17e5f9a7-f879-431f-9e48-0ac56b42e200" variant="h3" tone="inherit">竞争力正从 <span shuku-edit-id="e-7155f60e-b5f5-4280-91e1-22b71ad85220" className="llmpe-goal-orange">“掌握多少已有知识”</span>，转向 <span shuku-edit-id="e-bcf33211-03bf-48c2-b1f2-5e5ee1cc3013" className="llmpe-goal-blue">“能否更快理解并应用新知识”</span>。</Typography></div>
  </article>;
}
