import { useEffect, useId, useRef, useState } from 'react';
import { Button, Select, Typography } from '../../shared/react';
import documents from 'virtual:creator-skill-documents';
import { WeightSharingAblation } from '../components/WeightSharingAblation';
import { SkillAblationConcept } from '../components/SkillAblationConcept';
import './SkillConstraintsPage.css';

const groups = [
  { title:'设计技能', english:'Design Skill', description:'教学与交互设计', items:['知识主线 / 教学节奏','操作探索 / 即时反馈'], color:'#123ecb', background:'#eaf3ff', icon:'document', example:'可视化对比' },
  { title:'路由技能', english:'Route Skill', description:'按需调用组件和工具', items:['识别任务 / 选择能力','按需加载 / 节约 Token'], color:'#ed651c', background:'#fff2e5', icon:'cursor', example:'Token 模拟' },
  { title:'评估技能', english:'Evaluation Skill', description:'多维评价，指导课件持续改进', items:['教学理念 / 交互 / 视觉','质量判断 / 改进建议'], color:'#6933d9', background:'#f0eaff', icon:'check', example:'评估演示' },
  { title:'自进化技能', english:'Evolution Skill', description:'沉淀修正经验，形成可迭代的创作流程', items:['记录反馈 / 提炼规则','更新技能 / 下次复用'], color:'#ed397a', background:'#ffedf3', icon:'evolve', example:'迭代示意' },
  { title:'格式技能', english:'Format Skill', description:'统一版式与视觉规范', items:['1600×900 / 统一版式','字体 / 配色 / 组件规范'], color:'#00a584', background:'#e5f7f2', icon:'layout', example:'可视化对比' },
];
function ConstraintIcon({kind}:{kind:string}) {
  const paths:Record<string,string>={check:'M14 8h30v48H14ZM23 24l5 5 12-13M23 42h14',document:'M16 7h19l13 13v37H16ZM35 7v15h13M24 32h16M24 41h16M24 50h10',cursor:'M14 8l37 29-20 1-9 17ZM31 38l10 18',palette:'M32 8C17 8 7 19 7 33s11 24 24 24c7 0 10-4 7-9-4-6 1-10 9-9 8 0 11-5 10-12C55 15 44 8 32 8ZM21 22h.1M34 17h.1M46 25h.1M17 36h.1',layout:'M10 12h44v40H10ZM10 32h44M29 32v20',evolve:'M49 22A21 21 0 0 0 14 17l-5 8M9 12v13h13M15 42a21 21 0 0 0 35 5l5-8M55 52V39H42M25 33l5 5 10-12'};
  return <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
export function SkillConstraintsPage(){
  const [selectedPath, setSelectedPath] = useState('SKILL.md');
  const [preview, setPreview] = useState<number | null>(null);
  const [visualCategory, setVisualCategory] = useState(0);
  const previewId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelClose = () => clearTimeout(timer.current);
  const showPreview = (index:number) => { cancelClose(); if (preview !== index) setVisualCategory(index === 4 ? 3 : 0); setPreview(index); };
  const closePreview = () => { cancelClose(); timer.current = setTimeout(() => setPreview(null), (preview === 1 || preview === 2 || preview === 3) ? 100 : 280); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (preview === null) return;
    const close = (event:PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('.cg-constraints-preview, .cg-constraints-example-button')) setPreview(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [preview]);
  const selectedDocument = documents.find(document => document.path === selectedPath) ?? documents[0];

  return <article className="cg-constraints-page cg-creator-typography" aria-labelledby="cg-constraints-title" onKeyDown={event => {
    if (event.key === 'Escape' && preview !== null) { event.stopPropagation(); cancelClose(); setPreview(null); }
  }}>
  <header><Typography as="h1" id="cg-constraints-title" variant="display" tone="inherit">Creator Skill：五类技能协同创作</Typography><Typography variant="subtitle" tone="inherit">以 Markdown 组织设计、路由、评估、自进化与格式规范，共同形成可迭代的课件创作流程。</Typography></header>
  <section className="cg-constraints-editor" aria-label="Creator Skill Markdown 源文件预览" onKeyDown={event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) event.stopPropagation();
  }}>
    <div className="cg-constraints-editor-bar">
      <span className="cg-constraints-dot"/><span className="cg-constraints-dot"/><span className="cg-constraints-dot"/>
      <Select label="选择 Markdown 文件" value={selectedDocument.path} onChange={setSelectedPath}
        controlClassName="cg-constraints-file-select"
        options={documents.map(document => ({value:document.path,label:<Typography as="span" variant="bodySmall" tone="inherit">{document.path}</Typography>}))}/>
    </div>
    <div className="cg-constraints-code" key={selectedDocument.path} tabIndex={0} role="region" aria-label={`${selectedDocument.path} 源码`}>
      {selectedDocument.content.split(/\r?\n/).map((line,i)=><div className="cg-constraints-line" key={i}><Typography as="span" variant="bodySmall" tone="inherit" className="cg-constraints-number" aria-hidden="true">{i+1}</Typography><Typography as="code" variant="bodySmall" tone="inherit" className={line.startsWith('#')?'cg-constraints-heading':''}>{line||'\u00a0'}</Typography></div>)}
    </div>
  </section>
  <svg className="cg-constraints-links" viewBox="0 0 118 696" aria-hidden="true"><defs><linearGradient id="cg-constraints-arrow"><stop stopColor="#d6e7ff"/><stop offset="1" stopColor="#4888ff"/></linearGradient></defs><path d="M3 297h27v-18l34 35-34 35v-18H3Z" fill="url(#cg-constraints-arrow)"/><path d="M110 61H91q-16 0-16 16v535q0 16 16 16h19M75 199q0-12 16-12h19M75 339h35M75 477h35" fill="none" stroke="#6092ff" strokeWidth="2"/></svg>
  <div className="cg-constraints-groups">{groups.map((g,index)=><section key={g.title} className="cg-constraints-group" style={{background:g.background,color:g.color}}><div className="cg-constraints-icon"><ConstraintIcon kind={g.icon}/></div><div className="cg-constraints-group-copy"><div className="cg-constraints-group-heading"><Typography as="h2" variant="h2" tone="inherit">{g.title}</Typography><Typography as="span" variant="bodySmall" tone="inherit" className="cg-constraints-english">{g.english}</Typography><Button className="cg-constraints-example-button" aria-label={`查看${g.title}示例`} aria-expanded={preview === index} aria-controls={preview === index ? previewId : undefined} onMouseEnter={() => showPreview(index)} onMouseLeave={closePreview} onFocus={() => showPreview(index)} onBlur={event => { if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.cg-constraints-preview')) cancelClose(); else closePreview(); }} onClick={index === 1 || index === 2 ? undefined : () => showPreview(index)}><Typography as="span" variant="bodySmall" tone="inherit">{g.example}</Typography></Button></div><Typography variant="body" tone="inherit">{g.description}</Typography></div><div className="cg-constraints-checks">{g.items.map(item=><div key={item}><span className="cg-constraints-check" aria-hidden="true">✓</span><Typography variant="bodySmall" tone="inherit">{item}</Typography></div>)}</div></section>)}</div>
  {preview !== null && <aside id={previewId} className={`cg-constraints-preview${preview === 1 ? ' cg-route-preview' : preview === 2 ? ' cg-eval-preview' : preview === 3 ? ' cg-evolution-preview' : preview === 0 ? ' cg-visual-preview cg-design-preview' : ' cg-visual-preview cg-format-preview'}`} role="region" aria-label={`${groups[preview].title}消融示例`} onMouseEnter={cancelClose} onMouseLeave={closePreview} onFocusCapture={cancelClose} onBlurCapture={event => { if (!(event.relatedTarget instanceof Element) || !event.currentTarget.contains(event.relatedTarget)) closePreview(); }}>
    <div className="cg-constraints-preview-heading"><Typography as="h2" variant="h3" tone="accent">{preview === 1 ? '路由技能：按需加载' : preview === 2 ? '评估技能：AI 评估如何改变课件' : preview === 3 ? '自进化：使用习惯能否留下来？' : `${groups[preview].title} · 效果对比`}</Typography>{(preview === 0 || preview === 4) && <div className="cg-constraints-visual-options" role="group" aria-label="选择对比维度">{(preview === 0 ? [0, 1] : [2, 3]).map(category => <Button key={category} aria-pressed={visualCategory === category} onClick={() => setVisualCategory(category)}><Typography as="span" variant="bodySmall" tone="inherit">{['教学','交互','视觉','版式'][category]}</Typography></Button>)}</div>}</div>
    {preview === 0 || preview === 4 ? <>
      <WeightSharingAblation key={`${preview}-${visualCategory}`} category={visualCategory}/>
    </> : <SkillAblationConcept key={preview} kind={preview === 1 ? 'route' : preview === 2 ? 'evaluation' : 'evolution'}/>}
  </aside>}
</article>;}
