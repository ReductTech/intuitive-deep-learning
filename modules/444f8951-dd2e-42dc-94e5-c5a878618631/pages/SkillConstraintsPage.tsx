import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { WeightSharingAblation } from '../components/WeightSharingAblation';
import { SkillAblationConcept } from '../components/SkillAblationConcept';
import './SkillConstraintsPage.css';

const cardDescriptions = ['教学、交互与视觉设计', '按需调用组件与工具', '多维评估与持续改进', '沉淀反馈与创作偏好'];
const groups = [
  { title:'设计技能', english:'Design Skill', description:'教学、交互与视觉设计', items:['梳理知识主线，让概念按理解顺序展开','统一视觉与交互，让反馈帮助理解'], color:'#123ecb', background:'#eaf3ff', icon:'document', example:'可视化对比' },
  { title:'路由技能', english:'Route Skill', description:'按需调用组件和工具', items:['识别当前任务，选用合适的方法与工具','按需加载相关说明，减少无关信息干扰'], color:'#ed651c', background:'#fff2e5', icon:'cursor', example:'Token 模拟' },
  { title:'评估技能', english:'Evaluation Skill', description:'多维评价，指导知识呈现作品持续改进', items:['检查内容、交互与画面，发现影响理解的问题','提出具体改进建议，支持后续修改与复查'], color:'#6933d9', background:'#f0eaff', icon:'check', example:'评估演示' },
  { title:'自进化技能', english:'Evolution Skill', description:'沉淀修正经验，形成可迭代的创作流程', items:['记录明确反馈，沉淀可复用的创作偏好','在后续创作中按需采用，减少重复说明'], color:'#ed397a', background:'#ffedf3', icon:'evolve', example:'迭代示意' },
];
function ConstraintIcon({kind}:{kind:string}) {
  const paths:Record<string,string>={check:'M14 8h30v48H14ZM23 24l5 5 12-13M23 42h14',document:'M16 7h19l13 13v37H16ZM35 7v15h13M24 32h16M24 41h16M24 50h10',cursor:'M14 8l37 29-20 1-9 17ZM31 38l10 18',palette:'M32 8C17 8 7 19 7 33s11 24 24 24c7 0 10-4 7-9-4-6 1-10 9-9 8 0 11-5 10-12C55 15 44 8 32 8ZM21 22h.1M34 17h.1M46 25h.1M17 36h.1',layout:'M10 12h44v40H10ZM10 32h44M29 32v20',evolve:'M49 22A21 21 0 0 0 14 17l-5 8M9 12v13h13M15 42a21 21 0 0 0 35 5l5-8M55 52V39H42M25 33l5 5 10-12'};
  return <svg shuku-edit-id="e-39a5ddd0-aa54-44dd-bf30-750955e2f8c2" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-d4b21225-46dc-430d-a80d-2bcdd8330caf" d={paths[kind]}/></svg>;
}
export function SkillConstraintsPage(){
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const previewId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelClose = () => clearTimeout(timer.current);
  const showPreview = (index:number) => { cancelClose(); setPreview(index); };
  const closePreview = () => { cancelClose(); timer.current = setTimeout(() => setPreview(null), 350); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (preview === null) return;
    const close = (event:PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('.cg-constraints-preview, .cg-constraints-example-button')) setPreview(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [preview]);
  const selectSkill = (index: number) => { cancelClose(); setPreview(null); setActive((index + groups.length) % groups.length); };
  const selected = groups[active];
  const positions = [
    { x: -180, y: 0, scale: 1.08, turn: 0, depth: 5 },
    { x: 180, y: -12, scale: .92, turn: -8, depth: 4 },
    { x: 530, y: -45, scale: .84, turn: -18, depth: 3 },
    { x: -530, y: -45, scale: .84, turn: 18, depth: 3 },
  ];
  return <article shuku-edit-id="e-dfc0d97f-cae0-456c-9841-b202760853df" className="cg-constraints-page cg-creator-typography" aria-labelledby="cg-constraints-title" onKeyDown={event => {
    if (event.key === 'Escape' && preview !== null) { event.stopPropagation(); cancelClose(); setPreview(null); }
    if (event.target instanceof Element && event.target.closest('.cg-constraints-carousel') && ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(event.key)) {
      event.stopPropagation();
      if (event.key !== ' ') { event.preventDefault(); selectSkill(event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : active + (event.key === 'ArrowLeft' ? -1 : 1)); }
    }
  }}>
    <header shuku-edit-id="e-85bd3396-e731-4d00-984d-0fcc80a17838"><Typography shuku-edit-id="e-4037e164-f6b7-4fba-b572-f37053f3d770" as="h1" id="cg-constraints-title" variant="display" tone="inherit">创作指导：四类技能协同参与知识呈现设计</Typography><Typography shuku-edit-id="e-d01ced95-6258-49fe-95a0-46dae9353872" variant="bodySmall" tone="inherit">围绕教学、交互与表达，提供设计方法、规范与反馈。</Typography></header>
    <section shuku-edit-id="e-e794196e-2035-455e-9eda-a68757deb297" className="cg-constraints-detail" aria-label="当前技能说明" style={{ '--skill-color': selected.color, '--skill-background': selected.background } as CSSProperties}>
      <div shuku-edit-id="e-c3f01759-2b50-4e1d-abe4-a02e0bb41ea8" className="cg-constraints-detail-icon"><ConstraintIcon kind={selected.icon}/></div>
      <div shuku-edit-id="e-cb9eb571-8aab-4d77-8a19-c84e00976682" className="cg-constraints-detail-copy"><Typography shuku-edit-id="e-b717891c-fcda-4bc4-9d68-bfb18ceeb462" as="h2" variant="h2" tone="inherit">{selected.title}</Typography><Typography shuku-edit-id="e-6e3eda70-5652-46ac-b31b-637e65cb7645" variant="bodySmall" tone="muted">{selected.description}</Typography></div>
      <div shuku-edit-id="e-862d320a-1acc-466b-b7c2-f6064eb3d481" className="cg-constraints-checks">{selected.items.map(item => <div shuku-edit-id="e-019a6f3f-86b1-49a2-90dc-cf38f73a24ff" key={item}><span shuku-edit-id="e-1a495fbf-e0f6-437b-b427-933f7b6e8121" aria-hidden="true">✓</span><Typography shuku-edit-id="e-146759c4-bbf3-45fe-9b4f-12651443a954" variant="bodySmall" tone="inherit">{item}</Typography></div>)}</div>
    </section>
    <div shuku-edit-id="e-fe751bfb-fc33-4272-bd24-07da85999211" className="cg-constraints-connector" aria-hidden="true"/>
    <section shuku-edit-id="e-47ad0e3a-de23-49d3-93f4-feebba88cca5" className="cg-constraints-carousel" aria-label="四类技能转盘" aria-roledescription="轮播">
      <div shuku-edit-id="e-b4f0ab75-ba56-4f3c-a418-1b9e0b7bf774" className="cg-constraints-platform" aria-hidden="true"/>
      <div shuku-edit-id="e-4be4c2cf-21d5-456f-910e-3b6263f4760a" className="cg-constraints-orbit" aria-hidden="true"/>
      {groups.map((g, index) => {
        const position = positions[(index - active + groups.length) % groups.length];
        return <section shuku-edit-id="e-346539e3-e8a4-413b-819c-b8fdd4140dad" key={g.title} className={'cg-constraints-card' + (index === active ? ' is-active' : '')} aria-label={g.title} style={{ '--skill-color': g.color, '--skill-background': g.background, '--card-x': `${position.x}px`, '--card-y': `${position.y}px`, '--card-scale': position.scale, '--card-turn': `${position.turn}deg`, zIndex: position.depth } as CSSProperties}>
          <Button className="cg-constraints-card-select" aria-label={`选择${g.title}`} aria-pressed={index === active} onClick={() => selectSkill(index)}>
            <span shuku-edit-id="e-0207b3a6-51b7-41b7-8ad4-5ddf1065ff79" className="cg-constraints-icon"><ConstraintIcon kind={g.icon}/></span>
            <Typography shuku-edit-id="e-01d449c0-4d6d-43fc-ba5b-c03066a55a99" as="span" variant="h3" tone="inherit">{g.title}</Typography>
            <Typography shuku-edit-id="e-72fd81f5-3527-4a0d-9ac5-e9cadbba63a6" as="span" variant="bodySmall" tone="inherit">{cardDescriptions[index]}</Typography>
          </Button>
          <Button className="cg-constraints-example-button" aria-label={`查看${g.title}示例`} aria-expanded={preview === index} aria-controls={preview === index ? previewId : undefined} onMouseEnter={() => showPreview(index)} onMouseLeave={closePreview} onFocus={() => showPreview(index)} onBlur={event => { if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.cg-constraints-preview')) cancelClose(); else closePreview(); }} onClick={() => showPreview(index)}><Typography shuku-edit-id="e-7681e8d7-2af8-420c-9e0c-88c6dd83e995" as="span" variant="bodySmall" tone="inherit">{g.example}</Typography></Button>
        </section>;
      })}
      <Button className="cg-constraints-rotate is-previous" aria-label="上一个技能" onClick={() => selectSkill(active - 1)}><Typography shuku-edit-id="e-97549c85-7ad8-4f1e-beda-ab7d43480eac" as="span" variant="h3" tone="inherit">‹</Typography></Button>
      <Button className="cg-constraints-rotate is-next" aria-label="下一个技能" onClick={() => selectSkill(active + 1)}><Typography shuku-edit-id="e-d376a079-457d-4096-9d29-2013434fe91b" as="span" variant="h3" tone="inherit">›</Typography></Button>
    </section>
    <Typography shuku-edit-id="e-0fec0117-cc2b-49de-91e3-24f1a6430c4c" className="cg-constraints-hint" variant="bodySmall" tone="muted" align="center">点击技能切换 · 悬停按钮查看效果</Typography>
  {preview !== null && <aside shuku-edit-id="e-a947775a-12cb-4a1d-ab9a-12c7c53e468a" id={previewId} className={`cg-constraints-preview${preview === 1 ? ' cg-route-preview' : preview === 2 ? ' cg-eval-preview' : preview === 3 ? ' cg-evolution-preview' : ' cg-visual-preview cg-design-preview'}`} role="region" aria-label={`${groups[preview].title}消融示例`} onMouseEnter={cancelClose} onMouseLeave={closePreview} onFocusCapture={cancelClose} onBlurCapture={event => { if (!(event.relatedTarget instanceof Element) || !event.currentTarget.contains(event.relatedTarget)) closePreview(); }}>
    <div shuku-edit-id="e-ea8e26ac-7fcb-4eb3-9f74-0c8093020314" className="cg-constraints-preview-heading"><Typography shuku-edit-id="e-67fbd4d1-ea81-4cd3-a98e-801acdb560ad" as="h2" variant="h3" tone="accent">{preview === 1 ? '路由技能：按需加载' : preview === 2 ? '评估技能：AI 评估如何改变知识呈现作品' : preview === 3 ? '自进化：使用习惯能否留下来？' : `${groups[preview].title} · 效果对比`}</Typography><Button className="cg-constraints-preview-close" aria-label="关闭技能示例" onClick={() => { cancelClose(); setPreview(null); }}>×</Button></div>
    {preview === 0 ? <>
      <WeightSharingAblation key={preview} category={1}/>
    </> : <SkillAblationConcept key={preview} kind={preview === 1 ? 'route' : preview === 2 ? 'evaluation' : 'evolution'}/>}
  </aside>}
</article>;}
