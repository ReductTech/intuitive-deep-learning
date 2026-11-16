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
  return <svg shuku-edit-id="e-a5180a93-f913-40a4-a431-bf9e681a6adb" viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-565c1d3e-8c56-4546-9150-769b51ea6232" d={paths[kind]}/></svg>;
}
function GoalCard({ icon, text }: { icon: Kind; text: string }) {
  return <div shuku-edit-id="e-9ebd0d82-4554-462a-b82b-b90de71d353f" className="aipe-replay-cg-goal-card"><span shuku-edit-id="e-866be063-b7dd-4ffa-a24b-ce6cc0cdb3eb" className="aipe-replay-cg-goal-card-icon"><GoalIcon kind={icon}/></span><Typography shuku-edit-id="e-27f7d89d-2e79-4230-930b-85f121e79a8b" variant="body" tone="inherit">{text}</Typography></div>;
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
  return <article shuku-edit-id="e-1e952be5-b51f-43eb-9571-1693d37fd81b" ref={root} className="aipe-replay-cg-goal-page" data-state={angle === 12 ? 'understanding' : started ? 'moving' : 'knowledge'} data-angle={angle} aria-labelledby="aipe-replay-cg-goal-title">
    <header shuku-edit-id="e-4f2c83dc-b557-4c75-bb8b-c4d67962c763" className="aipe-replay-cg-goal-header"><Typography shuku-edit-id="e-dfde3007-f47e-4d05-a1a1-2b1870f899cd" as="h1" id="aipe-replay-cg-goal-title" variant="display" tone="inherit">AI 时代，学习的重点或从积累知识转向理解与应用</Typography><Typography shuku-edit-id="e-ded8a5c9-d4d5-4789-9cdc-d7313ef62dd3" variant="subtitle" tone="inherit">过去，我们需要花几年时间积累知识。未来，更重要的是快速理解和应用新知识的能力。</Typography></header>
    <section shuku-edit-id="e-83a388bb-ac1f-444d-814c-d724a952b71e" className="aipe-replay-cg-goal-side aipe-replay-cg-goal-old" aria-labelledby="aipe-replay-cg-goal-old-title"><Typography shuku-edit-id="e-404a34cb-3b60-4875-8755-967d2cfc8601" as="h2" id="aipe-replay-cg-goal-old-title" variant="h2" tone="inherit" className="aipe-replay-cg-goal-pill">工业时代</Typography><div shuku-edit-id="e-5e97e82f-da37-420a-9a28-8bf4087b522b" className="aipe-replay-cg-goal-cards"><GoalCard icon="book" text="学习多年"/><GoalCard icon="cap" text="掌握专业知识"/><GoalCard icon="gear" text="稳定应用"/></div></section>
    <section shuku-edit-id="e-86239dd7-6707-44e2-934c-201f7877376c" className="aipe-replay-cg-goal-side aipe-replay-cg-goal-new" aria-labelledby="aipe-replay-cg-goal-new-title"><Typography shuku-edit-id="e-b698d37d-4ed2-4a8b-9ede-58ffe27d576e" as="h2" id="aipe-replay-cg-goal-new-title" variant="h2" tone="inherit" className="aipe-replay-cg-goal-pill">AI时代</Typography><div shuku-edit-id="e-ec1f3e33-781e-41db-8f9e-97c21ffaa800" className="aipe-replay-cg-goal-cards"><GoalCard icon="light" text="遇到新问题"/><GoalCard icon="search" text="快速理解"/><GoalCard icon="rocket" text="快速应用"/><GoalCard icon="refresh" text="持续迭代"/></div></section>
    <svg shuku-edit-id="e-8bcda4bf-ee42-41f1-b58d-147b68298a0b" className="aipe-replay-cg-goal-connections" viewBox="0 0 1600 900" aria-hidden="true">
      {[352, 478, 604].map((y, i) => <g shuku-edit-id="e-dcb37665-a0b6-4198-a43d-a6a35a6fc791" key={y}><path shuku-edit-id="e-b4c41a8b-87dc-4351-a540-409ae1497416" d={`M375 ${y}C445 ${y} 400 ${left.y + (i - 1) * 30} ${left.x - 85} ${left.y + (i - 1) * 22}`} stroke="#f0b97f"/><circle shuku-edit-id="e-0cf772c1-7a87-47a0-82e8-2a0a6f4585e8" cx="375" cy={y} r="3" fill="#f0b97f"/></g>)}
      {[326, 426, 526, 626].map((y, i) => <g shuku-edit-id="e-ea5883f7-ec39-41fa-89ff-c3f8c690e15e" key={y}><path shuku-edit-id="e-49ceef65-5f67-4e9e-81d3-bdb31d4ef7e7" d={`M${right.x + 85} ${right.y + (i - 1.5) * 20}C1220 ${right.y + (i - 1.5) * 20} 1170 ${y} 1256 ${y}`} stroke="#79b5ff"/><circle shuku-edit-id="e-d017ea5c-370c-43f5-bdfa-9edfbf3cf354" cx="1256" cy={y} r="3" fill="#79b5ff"/></g>)}
    </svg>
    <div shuku-edit-id="e-d6cd239a-7f17-4e91-bf28-9e7f2a069c3b" className="aipe-replay-cg-goal-core"><Typography shuku-edit-id="e-bb034a6c-de0c-42b8-a12d-13b3372e407c" variant="body" tone="inherit">过去教育培养的是<span shuku-edit-id="e-dbe8f13b-968c-4557-a01a-9f6d3bd73c8e" className="aipe-replay-cg-goal-orange">“知识拥有者”</span></Typography><Typography shuku-edit-id="e-fbff5eda-91be-4aed-ae9e-72b782702828" variant="body" tone="inherit">AI时代更需要<span shuku-edit-id="e-be2321de-a51c-464e-8ddf-a428a9f6ff55" className="aipe-replay-cg-goal-blue">“知识探索者”</span></Typography></div>
    <div shuku-edit-id="e-104eeafc-71de-451a-903a-8e3db9fe659b" className="aipe-replay-cg-goal-direction"><svg shuku-edit-id="e-fdaa07e4-2b2b-4d10-858f-bf5d79d385f2" viewBox="0 0 420 130" aria-hidden="true"><defs shuku-edit-id="e-4f7bbfd2-441a-481d-9a70-0fd0f948ebfe"><linearGradient shuku-edit-id="e-d834b4bb-ad5e-48cc-98b8-0769aa5f84a0" id="aipe-replay-cg-goal-arrow"><stop shuku-edit-id="e-599e086b-2d9d-4552-a8ec-105e32cea2bc" stopColor="#ffdbc0"/><stop shuku-edit-id="e-fab24e7e-15d4-4790-85d8-36bca3031373" offset="1" stopColor="#88bbff"/></linearGradient></defs><path shuku-edit-id="e-8cedb3c4-e808-4262-92bc-72de8cd4e0b0" d="M15 115Q175-5 390 35" fill="none" stroke="url(#aipe-replay-cg-goal-arrow)" strokeWidth="10" strokeLinecap="round"/><path shuku-edit-id="e-43f03451-53d2-4b06-b135-f60313865e70" d="m375 15 28 23-31 16" fill="none" stroke="#88bbff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div shuku-edit-id="e-eb23161d-7e6e-4dc5-9be4-e6156c058643" className="aipe-replay-cg-goal-floor" aria-hidden="true"/><div shuku-edit-id="e-1bf01225-1311-4dce-9c1c-f18f6a6fc4e1" className="aipe-replay-cg-goal-pivot" aria-hidden="true"/>
    <div shuku-edit-id="e-6d085f11-3239-45d9-9afb-9a78b0c67326" className="aipe-replay-cg-goal-assembly" style={{ '--aipe-replay-cg-angle': `${angle}deg` } as CSSProperties}>
      <div shuku-edit-id="e-c1237e28-5e19-4097-b907-71af8e9ab0d5" className="aipe-replay-cg-goal-beam" aria-hidden="true"/>
      <div shuku-edit-id="e-fce6c466-ef89-47be-8fcc-53c500ac73f3" className="aipe-replay-cg-goal-orb-anchor aipe-replay-cg-goal-orb-left"><div shuku-edit-id="e-f1f1f0d0-299b-4e60-a523-aabb07cf5e67" className="aipe-replay-cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-f0d22fde-ee23-42a9-9bee-1899debd7805" className="aipe-replay-cg-goal-orb aipe-replay-cg-goal-orb-orange"><Typography shuku-edit-id="e-b0f07979-a82b-46f9-b3c8-1bd2e42a0a6f" variant="body" tone="inherit">知识拥有者</Typography></div></div>
      <div shuku-edit-id="e-cbff64a7-9576-4463-b376-875f306a3f28" className="aipe-replay-cg-goal-orb-anchor aipe-replay-cg-goal-orb-right"><div shuku-edit-id="e-ccc66941-d43d-433c-8d0e-a0240e596f2c" className="aipe-replay-cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-5c8d0f05-6c3a-4d69-870e-0949fcfd76ea" className="aipe-replay-cg-goal-orb aipe-replay-cg-goal-orb-blue" onPointerEnter={start} onClick={start} onFocus={start} tabIndex={0} aria-label="知识探索者；移入鼠标或聚焦可提前触发跷跷板转换"><Typography shuku-edit-id="e-14492eb9-d62b-40c0-88f8-f1d5ff78d14a" variant="body" tone="inherit">知识探索者</Typography></div></div>
    </div>
    <div shuku-edit-id="e-a08fa02c-29e4-44be-b675-51dee28c2427" className="aipe-replay-cg-goal-conclusion"><svg shuku-edit-id="e-0f3b9414-012e-4825-b493-77808ca03c73" viewBox="0 0 70 70" aria-hidden="true"><defs shuku-edit-id="e-e3159e35-ae95-4c4c-b672-4ea118519bb8"><linearGradient shuku-edit-id="e-81f8eaab-d8ab-441c-9a8d-ede737266f00" id="aipe-replay-cg-goal-bars" x2="0" y2="1"><stop shuku-edit-id="e-efd4e9e2-2f45-4285-adb6-3a8136f0b1be" stopColor="#0870ff"/><stop shuku-edit-id="e-e0d1137b-1272-4c7c-96ac-44369c8fd9ae" offset="1" stopColor="#85c7ff"/></linearGradient></defs><path shuku-edit-id="e-23f1b3b0-dbb4-4e38-b5f8-10d5d8596214" d="M6 44h14v20H6zM28 25h14v39H28zM50 7h14v57H50z" fill="url(#aipe-replay-cg-goal-bars)"/></svg><Typography shuku-edit-id="e-c85ac78b-2da2-4a66-9539-ebe7bcbcb824" variant="h3" tone="inherit">竞争力正从 <span shuku-edit-id="e-56851539-c505-4725-883c-7d944fafda77" className="aipe-replay-cg-goal-orange">“掌握多少已有知识”</span>，转向 <span shuku-edit-id="e-5cd896e9-4e52-4d26-8344-1dc1cc9566ff" className="aipe-replay-cg-goal-blue">“能否更快理解并应用新知识”</span>。</Typography></div>
  </article>;
}
