import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Typography } from '../../shared/react';
import './CreationWorkflowPage.css';

type WorkflowIconKind = 'outline' | 'wand' | 'shield' | 'image' | 'code' | 'check' | 'people';
function WorkflowIcon({ kind }: { kind: WorkflowIconKind }) {
  const paths: Record<WorkflowIconKind,string> = {
    outline:'M17 10h44v60H17ZM28 25h22M28 38h22M28 51h15',
    wand:'M17 64 51 30l12 12-34 34ZM55 8v16M47 16h16M70 25v10M65 30h10M24 22v13M18 28h12',
    shield:'M40 7 65 18v22c0 18-25 31-25 31S15 58 15 40V18ZM27 38l9 9 18-20',
    image:'M10 10h53v53H10ZM10 50l18-19 13 13 10-10 12 13M24 23h.1M42 67l22-29 12 9-22 29Z',
    code:'M9 14h62v52H9ZM9 28h62M19 21h.1M27 21h.1M35 21h.1M31 38l-9 9 9 9M49 38l9 9-9 9M43 35l-6 24',
    check:'M13 10h44v19M13 10v59h44V55M23 23h22M23 34h16M23 46h10M58 39a13 13 0 1 0 0 26 13 13 0 0 0 0-26ZM67 62l10 11',
    people:'M40 10a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM23 71V53a17 17 0 0 1 34 0v18ZM15 24a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM5 70V55a11 11 0 0 1 13-11M65 24a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM75 70V55a11 11 0 0 0-13-11',
  };
  return <svg viewBox="0 0 82 82" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
const stages = [
  {title:'设计大纲',summary:'先明确课程结构与页面目标',icon:'outline' as const,details:[
    {icon:'people' as const,title:'先明确学习者',description:'要讲给谁听？已有基础是什么？\n这节课希望他理解什么？'},
    {icon:'outline' as const,title:'再编排页面',description:'与 GPT 讨论知识顺序，\n每页只承担清楚的教学目标。'},
    {icon:'check' as const,title:'保存并迭代大纲',description:'记录在 outlines.json 中；\n制作中发现断点，就回头修改。'},
  ]},
  {title:'逐页制作',summary:'文生图 → Codex → 检查迭代',icon:'wand' as const,details:[
    {icon:'image' as const,title:'先出设计图',description:'把目标、背景与风格\n告诉文生图模型。'},
    {icon:'code' as const,title:'再做成页面',description:'让 Codex 参照设计图，\n结合 Skill 实现版式与交互。'},
    {icon:'check' as const,title:'最后检查',description:'交互不足、效果不对，\n就继续迭代与验证。'},
  ]},
  {title:'人工核验',summary:'从第一页走到最后一页',icon:'shield' as const,details:[
    {icon:'outline' as const,title:'完整走一遍',description:'按学习者的顺序体验，\n检查知识衔接和理解断点。'},
    {icon:'people' as const,title:'检验真实理解',description:'请人试学，观察哪里卡住，\n检查交互是否帮助理解。'},
    {icon:'check' as const,title:'补齐遗漏再交付',description:'也可让 AI 审阅大纲找遗漏；\n由人确认内容、效果与完整性。'},
  ]},
];
export function CreationWorkflowPage() {
  const [selected,setSelected]=useState<number|null>(1);
  const uid=useId();
  const buttons=useRef<Array<HTMLButtonElement|null>>([]);
  function onKey(event:KeyboardEvent<HTMLButtonElement>,index:number){
    const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:null;
    if(next!==null){event.preventDefault();setSelected(next);buttons.current[next]?.focus();}
  }
  return <article className="cg-workflow-page cg-creator-typography" aria-labelledby={`${uid}-title`}>
    <svg className="cg-workflow-waves" viewBox="0 0 1600 900" aria-hidden="true"><path d="M0 134Q178 44 433 215T980 211 1600 35V0H0Z" fill="#e8f5ff" opacity=".65"/><path d="M42 774Q171 583 426 741T963 781 1558 615" fill="none" stroke="#d2eeff" strokeWidth="84"/><path d="M42 830Q180 637 458 789T1000 819 1558 694" fill="none" stroke="#bbebf4" strokeWidth="40" opacity=".65"/></svg>
    <header><Typography as="h1" id={`${uid}-title`} variant="display" tone="inherit">从想法到成品：我们的<span>创作流程</span></Typography></header>
    <div className="cg-workflow-stages" role="tablist" aria-label="创作流程">{stages.map((stage,i)=><button type="button" role="tab" key={stage.title} id={`${uid}-tab-${i}`} aria-selected={selected===i} aria-controls={`${uid}-details`} tabIndex={selected===i||selected===null&&i===0?0:-1} ref={node=>{buttons.current[i]=node;}} className={`cg-workflow-stage${selected===i?' is-selected':''}`} onClick={()=>setSelected(i)} onKeyDown={e=>onKey(e,i)}><Typography as="span" variant="h2" tone="inherit" className="cg-workflow-number">{i+1}</Typography><span className="cg-workflow-stage-icon"><WorkflowIcon kind={stage.icon}/></span><div><Typography variant="h2" tone="inherit">{stage.title}</Typography><Typography variant="bodySmall" tone="inherit">{stage.summary}</Typography></div></button>)}</div>
    <svg className="cg-workflow-stage-arrows" viewBox="0 0 1600 900" aria-hidden="true"><path d="M523 246l15 15-15 15M1053 246l15 15-15 15" stroke="#73c7fb" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <aside className="cg-workflow-note"><WorkflowIcon kind="outline"/><Typography variant="body" tone="inherit">大纲不是一开始<br/>就完全固定，<br/>做着做着有调整，<br/>是正常的。</Typography></aside>
    {selected!==null&&<section className={`cg-workflow-details cg-workflow-details-${selected}`} id={`${uid}-details`} role="tabpanel" aria-labelledby={`${uid}-tab-${selected}`} tabIndex={0}><div className="cg-workflow-details-heading"><Typography as="h2" variant="h2" tone="inherit">{stages[selected].title}</Typography><button type="button" aria-label="收起步骤说明" onClick={()=>{setSelected(null);buttons.current[selected]?.focus();}}>×</button></div><div className="cg-workflow-detail-cards" key={selected}>{stages[selected].details.map((item,i)=><div className="cg-workflow-detail" key={item.title}><Typography as="span" variant="h2" tone="inherit" className="cg-workflow-detail-number">{i+1}</Typography><span className="cg-workflow-detail-icon"><WorkflowIcon kind={item.icon}/></span><Typography as="h3" variant="h3" tone="inherit">{item.title}</Typography><Typography variant="body" tone="inherit">{item.description}</Typography></div>)}</div></section>}
    <div className="cg-workflow-conclusion"><WorkflowIcon kind="people"/><div><Typography variant="h2" tone="inherit">AI 提高制作效率，人把关<span>教学质量</span></Typography><Typography variant="body" tone="inherit">清晰分工，持续校验。</Typography></div></div>
  </article>;
}

