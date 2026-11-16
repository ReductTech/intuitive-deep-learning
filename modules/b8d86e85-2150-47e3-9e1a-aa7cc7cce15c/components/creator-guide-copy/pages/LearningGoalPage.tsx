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
  return <svg shuku-edit-id="e-f0b355fc-cebd-42a4-978e-33c08db72739" viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-ff4a561c-d5ca-4d42-bd2f-fabdb95d4858" d={paths[kind]}/></svg>;
}
function GoalCard({ icon, text }: { icon: Kind; text: string }) {
  return <div shuku-edit-id="e-45fccf15-13ab-4c9f-8f46-f53ee403c702" className="aipe-replay-cg-goal-card"><span shuku-edit-id="e-0b9e9131-36fd-40da-a7ff-c6a8775dc5e2" className="aipe-replay-cg-goal-card-icon"><GoalIcon kind={icon}/></span><Typography shuku-edit-id="e-393e8f21-5591-4cc1-b808-b8f2a3a3aec9" variant="body" tone="inherit">{text}</Typography></div>;
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
  return <article shuku-edit-id="e-4d69b9c0-02e8-431c-84eb-9a411d435e1d" ref={root} className="aipe-replay-cg-goal-page" data-state={angle === 12 ? 'understanding' : started ? 'moving' : 'knowledge'} data-angle={angle} aria-labelledby="aipe-replay-cg-goal-title">
    <header shuku-edit-id="e-b3cad0ae-0a66-4034-9be6-36a8100d3c4d" className="aipe-replay-cg-goal-header"><Typography shuku-edit-id="e-f84c3c21-a183-4210-87c4-3e9e7dc33804" as="h1" id="aipe-replay-cg-goal-title" variant="display" tone="inherit">AI 时代，学习的重点或从积累知识转向理解与应用</Typography><Typography shuku-edit-id="e-f40b33a6-49c5-45a8-b469-24c8f0efa23f" variant="subtitle" tone="inherit">过去，我们需要花几年时间积累知识。未来，更重要的是快速理解和应用新知识的能力。</Typography></header>
    <section shuku-edit-id="e-ee0df086-873a-4872-85d4-8b3610d38576" className="aipe-replay-cg-goal-side aipe-replay-cg-goal-old" aria-labelledby="aipe-replay-cg-goal-old-title"><Typography shuku-edit-id="e-7adf33a3-a2b7-453b-8719-35d72d00a5de" as="h2" id="aipe-replay-cg-goal-old-title" variant="h2" tone="inherit" className="aipe-replay-cg-goal-pill">工业时代</Typography><div shuku-edit-id="e-b3d7696d-16c1-419f-9b14-77f0f89ea2bf" className="aipe-replay-cg-goal-cards"><GoalCard icon="book" text="学习多年"/><GoalCard icon="cap" text="掌握专业知识"/><GoalCard icon="gear" text="稳定应用"/></div></section>
    <section shuku-edit-id="e-7e3ae937-1556-42d7-9d9d-282503d76455" className="aipe-replay-cg-goal-side aipe-replay-cg-goal-new" aria-labelledby="aipe-replay-cg-goal-new-title"><Typography shuku-edit-id="e-e1b22a95-db25-4892-8d50-c216f50df75f" as="h2" id="aipe-replay-cg-goal-new-title" variant="h2" tone="inherit" className="aipe-replay-cg-goal-pill">AI时代</Typography><div shuku-edit-id="e-2c249471-53ed-4d7e-9dca-8627f629cea6" className="aipe-replay-cg-goal-cards"><GoalCard icon="light" text="遇到新问题"/><GoalCard icon="search" text="快速理解"/><GoalCard icon="rocket" text="快速应用"/><GoalCard icon="refresh" text="持续迭代"/></div></section>
    <svg shuku-edit-id="e-3ea98267-f02a-4661-9dc5-e01fa7c26375" className="aipe-replay-cg-goal-connections" viewBox="0 0 1600 900" aria-hidden="true">
      {[352, 478, 604].map((y, i) => <g shuku-edit-id="e-f8939c4d-91e8-495e-a0dd-732016cc6695" key={y}><path shuku-edit-id="e-49e37191-9e87-4122-8d50-317c0c48d7ca" d={`M375 ${y}C445 ${y} 400 ${left.y + (i - 1) * 30} ${left.x - 85} ${left.y + (i - 1) * 22}`} stroke="#f0b97f"/><circle shuku-edit-id="e-46e62eed-93ca-427a-a171-2df0698694bd" cx="375" cy={y} r="3" fill="#f0b97f"/></g>)}
      {[326, 426, 526, 626].map((y, i) => <g shuku-edit-id="e-4f2e63f9-8def-4f90-a8c6-0e1bb0f507fa" key={y}><path shuku-edit-id="e-3ac4405c-7bd1-4e0d-8468-3687e46d9ff8" d={`M${right.x + 85} ${right.y + (i - 1.5) * 20}C1220 ${right.y + (i - 1.5) * 20} 1170 ${y} 1256 ${y}`} stroke="#79b5ff"/><circle shuku-edit-id="e-03b622e0-b949-41f6-ba8c-224899a94924" cx="1256" cy={y} r="3" fill="#79b5ff"/></g>)}
    </svg>
    <div shuku-edit-id="e-c0f904ad-d79d-4917-8b0c-0f226b10e823" className="aipe-replay-cg-goal-core"><Typography shuku-edit-id="e-40d5f059-10f0-4b6f-965c-0b58c3928044" variant="body" tone="inherit">过去教育培养的是<span shuku-edit-id="e-a450c12d-4554-4f85-9de7-0f2b3fd3eae4" className="aipe-replay-cg-goal-orange">“知识拥有者”</span></Typography><Typography shuku-edit-id="e-8dcee63b-fc84-4489-903f-bb3cf9d1c651" variant="body" tone="inherit">AI时代更需要<span shuku-edit-id="e-ec66c3ce-f798-4e62-ac05-c33c70c26c28" className="aipe-replay-cg-goal-blue">“知识探索者”</span></Typography></div>
    <div shuku-edit-id="e-f3a7e727-93a5-4a7a-a23e-23f0ce1840ad" className="aipe-replay-cg-goal-direction"><svg shuku-edit-id="e-065fa8bc-34aa-4786-ba08-e38205d421e8" viewBox="0 0 420 130" aria-hidden="true"><defs shuku-edit-id="e-b644b5d0-ea0a-4e00-ae06-326caa8a009e"><linearGradient shuku-edit-id="e-8e7110bd-9078-4a3d-bd83-0ed0f4c8a0cb" id="aipe-replay-cg-goal-arrow"><stop shuku-edit-id="e-b414531a-6518-4fbd-898c-17a389ffceb6" stopColor="#ffdbc0"/><stop shuku-edit-id="e-481a3faf-c619-45b8-a141-4f7689e843af" offset="1" stopColor="#88bbff"/></linearGradient></defs><path shuku-edit-id="e-5e8022b9-8f80-48f4-9d6f-6307019e69d3" d="M15 115Q175-5 390 35" fill="none" stroke="url(#aipe-replay-cg-goal-arrow)" strokeWidth="10" strokeLinecap="round"/><path shuku-edit-id="e-438f5100-1326-4927-b99e-b6e14aa341d1" d="m375 15 28 23-31 16" fill="none" stroke="#88bbff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div shuku-edit-id="e-aebe5a0b-4130-4fa0-9111-41e6e3a02221" className="aipe-replay-cg-goal-floor" aria-hidden="true"/><div shuku-edit-id="e-e066404d-7a20-4c6e-93eb-7243de8d242b" className="aipe-replay-cg-goal-pivot" aria-hidden="true"/>
    <div shuku-edit-id="e-61eb4605-c051-4caf-9881-38ff7c3d593e" className="aipe-replay-cg-goal-assembly" style={{ '--aipe-replay-cg-angle': `${angle}deg` } as CSSProperties}>
      <div shuku-edit-id="e-5afc4890-58e2-4caa-97ba-77fac2c5d4f1" className="aipe-replay-cg-goal-beam" aria-hidden="true"/>
      <div shuku-edit-id="e-c59c223f-cf7c-4e59-bf49-2cf2ee17aa28" className="aipe-replay-cg-goal-orb-anchor aipe-replay-cg-goal-orb-left"><div shuku-edit-id="e-8a708857-8499-4ed9-8090-c9bc662f3aba" className="aipe-replay-cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-fee4b492-a4b5-4ab3-9dc4-dd2f8a38e303" className="aipe-replay-cg-goal-orb aipe-replay-cg-goal-orb-orange"><Typography shuku-edit-id="e-dd6d63c1-a25d-4944-a0fa-425b480091d1" variant="body" tone="inherit">知识拥有者</Typography></div></div>
      <div shuku-edit-id="e-57c7dc63-9cdf-4f28-b3c7-842502b75d54" className="aipe-replay-cg-goal-orb-anchor aipe-replay-cg-goal-orb-right"><div shuku-edit-id="e-1491ecb3-da21-4a79-b46d-9b1f50d274a8" className="aipe-replay-cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-d560082c-8346-465e-a538-f3688232792f" className="aipe-replay-cg-goal-orb aipe-replay-cg-goal-orb-blue" onPointerEnter={start} onClick={start} onFocus={start} tabIndex={0} aria-label="知识探索者；移入鼠标或聚焦可提前触发跷跷板转换"><Typography shuku-edit-id="e-8677fddc-5f9b-474f-adca-09477eb58202" variant="body" tone="inherit">知识探索者</Typography></div></div>
    </div>
    <div shuku-edit-id="e-fabab412-e9c0-4e44-bfdd-7facaffcdf2b" className="aipe-replay-cg-goal-conclusion"><svg shuku-edit-id="e-cd74ab1c-3496-47da-b168-cfb16693d26a" viewBox="0 0 70 70" aria-hidden="true"><defs shuku-edit-id="e-0ff2856b-3d75-455c-8ff9-61156c3400b1"><linearGradient shuku-edit-id="e-3aeb2690-9b76-4dbf-89fb-deaace75c329" id="aipe-replay-cg-goal-bars" x2="0" y2="1"><stop shuku-edit-id="e-f4954bc9-0369-42ba-a49b-3c16d41167c6" stopColor="#0870ff"/><stop shuku-edit-id="e-b2297fdb-c915-4bb9-a372-5f8de92eb8f5" offset="1" stopColor="#85c7ff"/></linearGradient></defs><path shuku-edit-id="e-a9f00770-693c-4601-a771-5521dede92f9" d="M6 44h14v20H6zM28 25h14v39H28zM50 7h14v57H50z" fill="url(#aipe-replay-cg-goal-bars)"/></svg><Typography shuku-edit-id="e-c1f2fd5b-728f-4404-b146-e30fbe0fba98" variant="h3" tone="inherit">竞争力正从 <span shuku-edit-id="e-d902bcd7-32a4-416e-a3ac-03f50df32879" className="aipe-replay-cg-goal-orange">“掌握多少已有知识”</span>，转向 <span shuku-edit-id="e-6102f1a7-5242-489c-a5f2-82d6fa74d1b2" className="aipe-replay-cg-goal-blue">“能否更快理解并应用新知识”</span>。</Typography></div>
  </article>;
}
