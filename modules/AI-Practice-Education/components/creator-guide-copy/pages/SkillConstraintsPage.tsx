import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../../shared/react';
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
  return <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
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
      if (event.target instanceof Element && !event.target.closest('.aipe-replay-cg-constraints-preview, .aipe-replay-cg-constraints-example-button')) setPreview(null);
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
  return <article className="aipe-replay-cg-constraints-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-constraints-title" onKeyDown={event => {
    if (event.key === 'Escape' && preview !== null) { event.stopPropagation(); cancelClose(); setPreview(null); }
    if (event.target instanceof Element && event.target.closest('.aipe-replay-cg-constraints-carousel') && ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(event.key)) {
      event.stopPropagation();
      if (event.key !== ' ') { event.preventDefault(); selectSkill(event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : active + (event.key === 'ArrowLeft' ? -1 : 1)); }
    }
  }}>
    <header><Typography as="h1" id="aipe-replay-cg-constraints-title" variant="display" tone="inherit">创作指导：四类技能协同参与知识呈现设计</Typography><Typography variant="bodySmall" tone="inherit">围绕教学、交互与表达，提供设计方法、规范与反馈。</Typography></header>
    <section className="aipe-replay-cg-constraints-detail" aria-label="当前技能说明" style={{ '--skill-color': selected.color, '--skill-background': selected.background } as CSSProperties}>
      <div className="aipe-replay-cg-constraints-detail-icon"><ConstraintIcon kind={selected.icon}/></div>
      <div className="aipe-replay-cg-constraints-detail-copy"><Typography as="h2" variant="h2" tone="inherit">{selected.title}</Typography><Typography variant="bodySmall" tone="muted">{selected.description}</Typography></div>
      <div className="aipe-replay-cg-constraints-checks">{selected.items.map(item => <div key={item}><span aria-hidden="true">✓</span><Typography variant="bodySmall" tone="inherit">{item}</Typography></div>)}</div>
    </section>
    <div className="aipe-replay-cg-constraints-connector" aria-hidden="true"/>
    <section className="aipe-replay-cg-constraints-carousel" aria-label="四类技能转盘" aria-roledescription="轮播">
      <div className="aipe-replay-cg-constraints-platform" aria-hidden="true"/>
      <div className="aipe-replay-cg-constraints-orbit" aria-hidden="true"/>
      {groups.map((g, index) => {
        const position = positions[(index - active + groups.length) % groups.length];
        return <section key={g.title} className={'aipe-replay-cg-constraints-card' + (index === active ? ' is-active' : '')} aria-label={g.title} style={{ '--skill-color': g.color, '--skill-background': g.background, '--card-x': `${position.x}px`, '--card-y': `${position.y}px`, '--card-scale': position.scale, '--card-turn': `${position.turn}deg`, zIndex: position.depth } as CSSProperties}>
          <Button className="aipe-replay-cg-constraints-card-select" aria-label={`选择${g.title}`} aria-pressed={index === active} onClick={() => selectSkill(index)}>
            <span className="aipe-replay-cg-constraints-icon"><ConstraintIcon kind={g.icon}/></span>
            <Typography as="span" variant="h3" tone="inherit">{g.title}</Typography>
            <Typography as="span" variant="bodySmall" tone="inherit">{cardDescriptions[index]}</Typography>
          </Button>
          <Button className="aipe-replay-cg-constraints-example-button" aria-label={`查看${g.title}示例`} aria-expanded={preview === index} aria-controls={preview === index ? previewId : undefined} onMouseEnter={() => showPreview(index)} onMouseLeave={closePreview} onFocus={() => showPreview(index)} onBlur={event => { if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.aipe-replay-cg-constraints-preview')) cancelClose(); else closePreview(); }} onClick={() => showPreview(index)}><Typography as="span" variant="bodySmall" tone="inherit">{g.example}</Typography></Button>
        </section>;
      })}
      <Button className="aipe-replay-cg-constraints-rotate is-previous" aria-label="上一个技能" onClick={() => selectSkill(active - 1)}><Typography as="span" variant="h3" tone="inherit">‹</Typography></Button>
      <Button className="aipe-replay-cg-constraints-rotate is-next" aria-label="下一个技能" onClick={() => selectSkill(active + 1)}><Typography as="span" variant="h3" tone="inherit">›</Typography></Button>
    </section>
    <Typography className="aipe-replay-cg-constraints-hint" variant="bodySmall" tone="muted" align="center">点击技能切换 · 悬停按钮查看效果</Typography>
  {preview !== null && <aside id={previewId} className={`aipe-replay-cg-constraints-preview${preview === 1 ? ' aipe-replay-cg-route-preview' : preview === 2 ? ' aipe-replay-cg-eval-preview' : preview === 3 ? ' aipe-replay-cg-evolution-preview' : ' aipe-replay-cg-visual-preview aipe-replay-cg-design-preview'}`} role="region" aria-label={`${groups[preview].title}消融示例`} onMouseEnter={cancelClose} onMouseLeave={closePreview} onFocusCapture={cancelClose} onBlurCapture={event => { if (!(event.relatedTarget instanceof Element) || !event.currentTarget.contains(event.relatedTarget)) closePreview(); }}>
    <div className="aipe-replay-cg-constraints-preview-heading"><Typography as="h2" variant="h3" tone="accent">{preview === 1 ? '路由技能：按需加载' : preview === 2 ? '评估技能：AI 评估如何改变知识呈现作品' : preview === 3 ? '自进化：使用习惯能否留下来？' : `${groups[preview].title} · 效果对比`}</Typography><Button className="aipe-replay-cg-constraints-preview-close" aria-label="关闭技能示例" onClick={() => { cancelClose(); setPreview(null); }}>×</Button></div>
    {preview === 0 ? <>
      <WeightSharingAblation key={preview} category={1}/>
    </> : <SkillAblationConcept key={preview} kind={preview === 1 ? 'route' : preview === 2 ? 'evaluation' : 'evolution'}/>}
  </aside>}
</article>;}
