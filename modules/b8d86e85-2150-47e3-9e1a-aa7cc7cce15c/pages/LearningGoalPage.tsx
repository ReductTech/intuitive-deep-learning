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
  return <svg shuku-edit-id="e-d482a4dc-944e-4e38-ba42-1f71e2692d32" viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-989afab7-6b66-42ad-b5f2-f5e23d06defe" d={paths[kind]}/></svg>;
}
function GoalCard({ icon, text }: { icon: Kind; text: string }) {
  return <div shuku-edit-id="e-d6d1c384-fc41-47ae-9e19-c17715cb5e5d" className="cg-goal-card"><span shuku-edit-id="e-70c4c135-c0ad-4abc-b83a-29b0ce111028" className="cg-goal-card-icon"><GoalIcon kind={icon}/></span><Typography shuku-edit-id="e-da233456-dee0-4843-9c91-0574b1518060" variant="body" tone="inherit">{text}</Typography></div>;
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
  return <article shuku-edit-id="e-cd72a1bd-f89a-4aee-b375-ccf7138cc467" ref={root} className="cg-goal-page" data-state={angle === 12 ? 'understanding' : started ? 'moving' : 'knowledge'} data-angle={angle} aria-labelledby="cg-goal-title">
    <header shuku-edit-id="e-66e5b246-d39e-4172-89db-65d1ad209c3f" className="cg-goal-header"><Typography shuku-edit-id="e-39761032-9d77-42af-bdc1-33944f3207b1" as="h1" id="cg-goal-title" variant="display" tone="inherit">AI 时代，学习的重点或从积累知识转向理解与应用</Typography><Typography shuku-edit-id="e-f44de404-dc0a-452b-9283-9517c2b1f11b" variant="subtitle" tone="inherit">过去，我们需要花几年时间积累知识。未来，更重要的是快速理解和应用新知识的能力。</Typography></header>
    <section shuku-edit-id="e-97247786-17a6-4f1e-8fc3-421da2ee14ef" className="cg-goal-side cg-goal-old" aria-labelledby="cg-goal-old-title"><Typography shuku-edit-id="e-13f2ad3a-ffaf-4e15-b14f-e487fd101d6a" as="h2" id="cg-goal-old-title" variant="h2" tone="inherit" className="cg-goal-pill">工业时代</Typography><div shuku-edit-id="e-236679c7-dcf9-4782-82dc-a15c0068c53d" className="cg-goal-cards"><GoalCard icon="book" text="学习多年"/><GoalCard icon="cap" text="掌握专业知识"/><GoalCard icon="gear" text="稳定应用"/></div></section>
    <section shuku-edit-id="e-b79a8b0d-9c27-4402-968a-29a0b84d55bb" className="cg-goal-side cg-goal-new" aria-labelledby="cg-goal-new-title"><Typography shuku-edit-id="e-8fe488b1-0e23-45c6-98c6-b5c02048dde0" as="h2" id="cg-goal-new-title" variant="h2" tone="inherit" className="cg-goal-pill">AI时代</Typography><div shuku-edit-id="e-f60b117c-6bee-4435-a4c8-66903c886e14" className="cg-goal-cards"><GoalCard icon="light" text="遇到新问题"/><GoalCard icon="search" text="快速理解"/><GoalCard icon="rocket" text="快速应用"/><GoalCard icon="refresh" text="持续迭代"/></div></section>
    <svg shuku-edit-id="e-fe562ddd-6f1b-4979-8e02-67651ec636d5" className="cg-goal-connections" viewBox="0 0 1600 900" aria-hidden="true">
      {[352, 478, 604].map((y, i) => <g shuku-edit-id="e-2026890c-3c20-4da3-a6dc-32086153a5eb" key={y}><path shuku-edit-id="e-6f2e70bf-ee56-4e23-a301-54dbd0081e36" d={`M375 ${y}C445 ${y} 400 ${left.y + (i - 1) * 30} ${left.x - 85} ${left.y + (i - 1) * 22}`} stroke="#f0b97f"/><circle shuku-edit-id="e-a96b61a8-2fa1-4383-8619-10e828e6674b" cx="375" cy={y} r="3" fill="#f0b97f"/></g>)}
      {[326, 426, 526, 626].map((y, i) => <g shuku-edit-id="e-ddcc4e83-dcc6-4035-ac6f-322f96240abe" key={y}><path shuku-edit-id="e-bc874e33-9680-4b28-b95e-a549e81250d1" d={`M${right.x + 85} ${right.y + (i - 1.5) * 20}C1220 ${right.y + (i - 1.5) * 20} 1170 ${y} 1256 ${y}`} stroke="#79b5ff"/><circle shuku-edit-id="e-1d11ceba-e85d-4b86-8e4e-ccde1125b64b" cx="1256" cy={y} r="3" fill="#79b5ff"/></g>)}
    </svg>
    <div shuku-edit-id="e-3a21f5b4-3b73-4f8f-8f6b-50f079af14ef" className="cg-goal-core"><Typography shuku-edit-id="e-918c3667-bbcb-4b82-a097-6073da58ab14" variant="body" tone="inherit">过去教育培养的是<span shuku-edit-id="e-a7b7db3a-9e56-4701-8df0-6c7bfad70bba" className="cg-goal-orange">“知识拥有者”</span></Typography><Typography shuku-edit-id="e-7650ae30-e869-43ae-b897-6a1b84657f95" variant="body" tone="inherit">AI时代更需要<span shuku-edit-id="e-a4235579-4578-4975-9a4a-ddeeb420b192" className="cg-goal-blue">“知识探索者”</span></Typography></div>
    <div shuku-edit-id="e-7f013edc-6340-4904-9c61-b0c71471353d" className="cg-goal-direction"><svg shuku-edit-id="e-5bd34000-08af-497b-b1ca-a9a780f69939" viewBox="0 0 420 130" aria-hidden="true"><defs shuku-edit-id="e-7285ed1f-5279-4a33-95b4-1d3cba4e2ada"><linearGradient shuku-edit-id="e-d61c462f-f4fb-445b-ab2c-9391f8f8f763" id="cg-goal-arrow"><stop shuku-edit-id="e-2d7f5b85-f043-476d-9b2d-bda65368ccd8" stopColor="#ffdbc0"/><stop shuku-edit-id="e-aa8ac052-19c1-403a-836d-f18582a1b132" offset="1" stopColor="#88bbff"/></linearGradient></defs><path shuku-edit-id="e-839b28d3-31fb-48fb-8247-f9efbf0a93b5" d="M15 115Q175-5 390 35" fill="none" stroke="url(#cg-goal-arrow)" strokeWidth="10" strokeLinecap="round"/><path shuku-edit-id="e-25c2a785-fd07-4254-9b2a-af497c2f2fe0" d="m375 15 28 23-31 16" fill="none" stroke="#88bbff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div shuku-edit-id="e-eccfe9e6-636a-448e-9b4f-d78c643544b6" className="cg-goal-floor" aria-hidden="true"/><div shuku-edit-id="e-5b9888c4-9102-4cf1-92c9-57e81ef8071a" className="cg-goal-pivot" aria-hidden="true"/>
    <div shuku-edit-id="e-116e7f2f-b7fa-4f2b-a315-b802c28eede8" className="cg-goal-assembly" style={{ '--cg-angle': `${angle}deg` } as CSSProperties}>
      <div shuku-edit-id="e-bedc07c7-eaf7-473f-a7ec-84e0a8862b18" className="cg-goal-beam" aria-hidden="true"/>
      <div shuku-edit-id="e-d6dec65b-fc28-4b24-a27a-32690a847018" className="cg-goal-orb-anchor cg-goal-orb-left"><div shuku-edit-id="e-a4f8701b-e347-4ba3-b615-6ddf25e41d8d" className="cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-a52ed1ac-b8e0-4b9d-833e-8a662fabd261" className="cg-goal-orb cg-goal-orb-orange"><Typography shuku-edit-id="e-c73fc4ae-33f6-4a95-9a02-231465e6b8f1" variant="body" tone="inherit">知识拥有者</Typography></div></div>
      <div shuku-edit-id="e-858bb27c-37d3-495a-9a21-3cc1a49a4910" className="cg-goal-orb-anchor cg-goal-orb-right"><div shuku-edit-id="e-3060026c-d15e-413f-be9b-473a2141303b" className="cg-goal-platform" aria-hidden="true"/><div shuku-edit-id="e-444abe48-022e-460e-be8e-0cd2fb430ae6" className="cg-goal-orb cg-goal-orb-blue" onPointerEnter={start} onClick={start} onFocus={start} tabIndex={0} aria-label="知识探索者；移入鼠标或聚焦可提前触发跷跷板转换"><Typography shuku-edit-id="e-ac19a792-05e6-41f0-89d6-8567e01a94bc" variant="body" tone="inherit">知识探索者</Typography></div></div>
    </div>
    <div shuku-edit-id="e-b716662f-2d23-4821-98c4-6984ae430dd1" className="cg-goal-conclusion"><svg shuku-edit-id="e-1f2796f0-0833-4dc8-8e4d-640da6a9ab9e" viewBox="0 0 70 70" aria-hidden="true"><defs shuku-edit-id="e-f3da511c-73b8-40e7-acf1-6aabeead26b3"><linearGradient shuku-edit-id="e-c7bd1343-beda-43ec-a671-a301761e0f32" id="cg-goal-bars" x2="0" y2="1"><stop shuku-edit-id="e-76de5501-c06d-421a-8efd-6eccef9fcf29" stopColor="#0870ff"/><stop shuku-edit-id="e-16f00ca1-d5e5-4ad4-a8b5-d29448788da8" offset="1" stopColor="#85c7ff"/></linearGradient></defs><path shuku-edit-id="e-2478ff30-9821-4cf9-965d-c83e54be90d9" d="M6 44h14v20H6zM28 25h14v39H28zM50 7h14v57H50z" fill="url(#cg-goal-bars)"/></svg><Typography shuku-edit-id="e-3b9ff0dd-3a6a-4298-adc4-756cccf09735" variant="h3" tone="inherit">竞争力正从 <span shuku-edit-id="e-f55a1fe7-d0c3-48f4-895a-049b75c217e3" className="cg-goal-orange">“掌握多少已有知识”</span>，转向 <span shuku-edit-id="e-9da038f0-30d7-44fa-8c15-50aca9baa92c" className="cg-goal-blue">“能否更快理解并应用新知识”</span>。</Typography></div>
  </article>;
}
