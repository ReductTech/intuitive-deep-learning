import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { WeightSharingAblation } from '../components/WeightSharingAblation';
import { SkillAblationConcept } from '../components/SkillAblationConcept';
import './SkillConstraintsPage.css';

const cardDescriptions = ['教学与交互设计', '按需调用组件与工具', '多维评估与持续改进', '沉淀反馈与创作偏好', '统一版式与视觉规范'];
const groups = [
  { title:'设计技能', english:'Design Skill', description:'教学与交互设计', items:['梳理知识主线，让概念按理解顺序展开','设计有意义的操作，让反馈帮助理解'], color:'#123ecb', background:'#eaf3ff', icon:'document', example:'可视化对比' },
  { title:'路由技能', english:'Route Skill', description:'按需调用组件和工具', items:['识别当前任务，选用合适的方法与工具','按需加载相关说明，减少无关信息干扰'], color:'#ed651c', background:'#fff2e5', icon:'cursor', example:'Token 模拟' },
  { title:'评估技能', english:'Evaluation Skill', description:'多维评价，指导知识呈现作品持续改进', items:['检查内容、交互与画面，发现影响理解的问题','提出具体改进建议，支持后续修改与复查'], color:'#6933d9', background:'#f0eaff', icon:'check', example:'评估演示' },
  { title:'自进化技能', english:'Evolution Skill', description:'沉淀修正经验，形成可迭代的创作流程', items:['记录明确反馈，沉淀可复用的创作偏好','在后续创作中按需采用，减少重复说明'], color:'#ed397a', background:'#ffedf3', icon:'evolve', example:'迭代示意' },
  { title:'格式技能', english:'Format Skill', description:'统一版式与视觉规范', items:['遵循固定画布，检查页面是否完整呈现','统一字体与配色，让多页知识呈现作品保持一致'], color:'#00a584', background:'#e5f7f2', icon:'layout', example:'可视化对比' },
];
function ConstraintIcon({kind}:{kind:string}) {
  const paths:Record<string,string>={check:'M14 8h30v48H14ZM23 24l5 5 12-13M23 42h14',document:'M16 7h19l13 13v37H16ZM35 7v15h13M24 32h16M24 41h16M24 50h10',cursor:'M14 8l37 29-20 1-9 17ZM31 38l10 18',palette:'M32 8C17 8 7 19 7 33s11 24 24 24c7 0 10-4 7-9-4-6 1-10 9-9 8 0 11-5 10-12C55 15 44 8 32 8ZM21 22h.1M34 17h.1M46 25h.1M17 36h.1',layout:'M10 12h44v40H10ZM10 32h44M29 32v20',evolve:'M49 22A21 21 0 0 0 14 17l-5 8M9 12v13h13M15 42a21 21 0 0 0 35 5l5-8M55 52V39H42M25 33l5 5 10-12'};
  return <svg shuku-edit-id="e-82108962-4a16-45ef-a9cf-f9c6d248853e" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-8ff740e2-fae2-4164-a1e1-21381adf0392" d={paths[kind]}/></svg>;
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
    { x: 0, y: 0, scale: 1.08, turn: 0, depth: 5 },
    { x: 295, y: -12, scale: .92, turn: -12, depth: 4 },
    { x: 565, y: -45, scale: .84, turn: -18, depth: 3 },
    { x: -565, y: -45, scale: .84, turn: 18, depth: 3 },
    { x: -295, y: -12, scale: .92, turn: 12, depth: 4 },
  ];
  return <article shuku-edit-id="e-950019a5-3e0a-450e-a1cf-4591e36c69d5" className="cg-constraints-page cg-creator-typography" aria-labelledby="cg-constraints-title" onKeyDown={event => {
    if (event.key === 'Escape' && preview !== null) { event.stopPropagation(); cancelClose(); setPreview(null); }
    if (event.target instanceof Element && event.target.closest('.cg-constraints-carousel') && ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(event.key)) {
      event.stopPropagation();
      if (event.key !== ' ') { event.preventDefault(); selectSkill(event.key === 'Home' ? 0 : event.key === 'End' ? 4 : active + (event.key === 'ArrowLeft' ? -1 : 1)); }
    }
  }}>
    <header shuku-edit-id="e-41ceb466-7001-4fee-a7c5-40d967a037f5"><Typography shuku-edit-id="e-61673367-c129-499f-9329-173bfdcbca1a" as="h1" id="cg-constraints-title" variant="display" tone="inherit">创作指导：五类技能协同参与知识呈现设计</Typography><Typography shuku-edit-id="e-dd78d825-45a0-45be-8063-791e6af1d6a0" variant="bodySmall" tone="inherit">围绕教学、交互与表达，提供设计方法、规范与反馈。</Typography></header>
    <section shuku-edit-id="e-0f08917d-f726-44a5-9893-1646560858b6" className="cg-constraints-detail" aria-label="当前技能说明" style={{ '--skill-color': selected.color, '--skill-background': selected.background } as CSSProperties}>
      <div shuku-edit-id="e-d258d5ac-d963-4b1c-aa15-156a834a81fd" className="cg-constraints-detail-icon"><ConstraintIcon kind={selected.icon}/></div>
      <div shuku-edit-id="e-9f97e99c-0da7-43a1-9da3-c143cf7e062a" className="cg-constraints-detail-copy"><Typography shuku-edit-id="e-dbd8742a-32e1-402d-8583-154a45df20a5" as="h2" variant="h2" tone="inherit">{selected.title}</Typography><Typography shuku-edit-id="e-cac4f06b-efe0-40f8-94cd-6463801b5740" variant="bodySmall" tone="muted">{selected.description}</Typography></div>
      <div shuku-edit-id="e-dfabac2b-ccf5-4498-9617-7c9c42874f13" className="cg-constraints-checks">{selected.items.map(item => <div shuku-edit-id="e-e1d9048d-f0c3-4f20-954a-f89e6898bd7c" key={item}><span shuku-edit-id="e-4f13f973-9856-4285-9512-c7682c8d98a9" aria-hidden="true">✓</span><Typography shuku-edit-id="e-d182b991-fc36-4283-912a-883735e13c11" variant="bodySmall" tone="inherit">{item}</Typography></div>)}</div>
    </section>
    <div shuku-edit-id="e-c9fab74d-2395-4dbc-8d35-82a682acbc58" className="cg-constraints-connector" aria-hidden="true"/>
    <section shuku-edit-id="e-fde803a9-8d4f-4b34-932e-74a713346099" className="cg-constraints-carousel" aria-label="五类技能转盘" aria-roledescription="轮播">
      <div shuku-edit-id="e-63794809-90b3-4214-aedd-ee7ef3ea26f6" className="cg-constraints-platform" aria-hidden="true"/>
      <div shuku-edit-id="e-e32fcf9f-1b2b-439b-a92b-95deeb54c1be" className="cg-constraints-orbit" aria-hidden="true"/>
      {groups.map((g, index) => {
        const position = positions[(index - active + groups.length) % groups.length];
        return <section shuku-edit-id="e-9bb45f80-e2cc-4a48-95a4-79b4e78a4e1a" key={g.title} className={'cg-constraints-card' + (index === active ? ' is-active' : '')} aria-label={g.title} style={{ '--skill-color': g.color, '--skill-background': g.background, '--card-x': `${position.x}px`, '--card-y': `${position.y}px`, '--card-scale': position.scale, '--card-turn': `${position.turn}deg`, zIndex: position.depth } as CSSProperties}>
          <Button className="cg-constraints-card-select" aria-label={`选择${g.title}`} aria-pressed={index === active} onClick={() => selectSkill(index)}>
            <span shuku-edit-id="e-38b7d8b7-6bef-45bd-8c0c-d8e0718e375c" className="cg-constraints-icon"><ConstraintIcon kind={g.icon}/></span>
            <Typography shuku-edit-id="e-ec2c4564-08b2-453c-86f4-e68772435411" as="span" variant="h3" tone="inherit">{g.title}</Typography>
            <Typography shuku-edit-id="e-2fbe3016-3367-4313-a83a-4dd2981b4861" as="span" variant="bodySmall" tone="inherit">{cardDescriptions[index]}</Typography>
          </Button>
          <Button className="cg-constraints-example-button" aria-label={`查看${g.title}示例`} aria-expanded={preview === index} aria-controls={preview === index ? previewId : undefined} onMouseEnter={() => showPreview(index)} onMouseLeave={closePreview} onFocus={() => showPreview(index)} onBlur={event => { if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.cg-constraints-preview')) cancelClose(); else closePreview(); }} onClick={() => showPreview(index)}><Typography shuku-edit-id="e-2226872d-1597-44bd-a69f-b18d3284e107" as="span" variant="bodySmall" tone="inherit">{g.example}</Typography></Button>
        </section>;
      })}
      <Button className="cg-constraints-rotate is-previous" aria-label="上一个技能" onClick={() => selectSkill(active - 1)}><Typography shuku-edit-id="e-ae3d5309-d7bf-4fe7-8dc6-eccdaa053ceb" as="span" variant="h3" tone="inherit">‹</Typography></Button>
      <Button className="cg-constraints-rotate is-next" aria-label="下一个技能" onClick={() => selectSkill(active + 1)}><Typography shuku-edit-id="e-9e49b3d3-da3b-4a58-aeb7-7e4bc6278e1b" as="span" variant="h3" tone="inherit">›</Typography></Button>
    </section>
    <Typography shuku-edit-id="e-272b645d-9a91-4754-9211-19c89475ce97" className="cg-constraints-hint" variant="bodySmall" tone="muted" align="center">点击技能切换 · 悬停按钮查看效果</Typography>
  {preview !== null && <aside shuku-edit-id="e-95bd6c59-e161-46cf-9596-87d5b8f51b4a" id={previewId} className={`cg-constraints-preview${preview === 1 ? ' cg-route-preview' : preview === 2 ? ' cg-eval-preview' : preview === 3 ? ' cg-evolution-preview' : preview === 0 ? ' cg-visual-preview cg-design-preview' : ' cg-visual-preview cg-format-preview'}`} role="region" aria-label={`${groups[preview].title}消融示例`} onMouseEnter={cancelClose} onMouseLeave={closePreview} onFocusCapture={cancelClose} onBlurCapture={event => { if (!(event.relatedTarget instanceof Element) || !event.currentTarget.contains(event.relatedTarget)) closePreview(); }}>
    <div shuku-edit-id="e-f01c022d-3a7b-4250-836f-01764c1b5ad0" className="cg-constraints-preview-heading"><Typography shuku-edit-id="e-1092446d-9046-4bbb-8f0f-9b22b58506fe" as="h2" variant="h3" tone="accent">{preview === 1 ? '路由技能：按需加载' : preview === 2 ? '评估技能：AI 评估如何改变知识呈现作品' : preview === 3 ? '自进化：使用习惯能否留下来？' : `${groups[preview].title} · 效果对比`}</Typography><Button className="cg-constraints-preview-close" aria-label="关闭技能示例" onClick={() => { cancelClose(); setPreview(null); }}>×</Button></div>
    {preview === 0 || preview === 4 ? <>
      <WeightSharingAblation key={preview} category={preview === 4 ? 3 : 1}/>
    </> : <SkillAblationConcept key={preview} kind={preview === 1 ? 'route' : preview === 2 ? 'evaluation' : 'evolution'}/>}
  </aside>}
</article>;}
