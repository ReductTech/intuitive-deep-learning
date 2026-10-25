import type {CreatorPage,CreatorProject} from './model';
export type GuidedLayout='visual'|'steps'|'question';
export interface GuidedState {phase:'choices'|'outline'|'pages';audience:string;description:string;layout?:GuidedLayout;brief?:string;image?:string;confirmed?:boolean;imported?:boolean;reference?:{title:string;body:string;notes:string};suggestions?:string[]}
export function guidedState(page:CreatorPage):GuidedState|undefined{const value=page.outline?.guided as GuidedState|undefined;return value&&['choices','outline','pages'].includes(value.phase)&&typeof value.audience==='string'&&typeof value.description==='string'?value:undefined;}
export function startGuided(project:CreatorProject,description:string):CreatorProject{
 return {...project,source:undefined,duration:20,style:'简洁图解',outlineConfirmed:false,pages:[{id:crypto.randomUUID(),format:'text',title:project.title,goal:'',summary:description,note:'',designed:false,ready:false,revisions:[],messages:[],outline:{guided:{phase:'choices',audience:'初学者',description}}}]};
}
export function outlineFor(project:CreatorProject):CreatorProject{
 if(project.pages.length>1||project.presentation)return changeGuidedPhase(project,'outline');
 const state=guidedState(project.pages[0])!;
 const topics=state.description.split(/[，。；、\n]+/).map(s=>s.trim()).filter(Boolean);
 const count=project.duration<=10?4:project.duration<=20?6:8;
 const titles=['从一个问题开始',...Array.from({length:count-3},(_,i)=>topics[i]||`核心概念 ${i+1}`),'用一个例子试一试','回顾与应用'];
 return {...project,source:undefined,outlineConfirmed:false,pages:titles.map((title,i)=>({id:crypto.randomUUID(),format:'text',title,goal:`帮助${state.audience}${i===0?'了解课程要解决的问题':i===count-1?'整理收获并尝试应用':'理解本页的核心内容'}`,summary:i===0?state.description:'',note:'',designed:false,ready:false,revisions:[],messages:[],outline:{guided:{...state,phase:'outline',layout:undefined,brief:'',confirmed:false}}}))};
}
export function updateGuided(page:CreatorPage,patch:Partial<GuidedState>):CreatorPage{
 return {...page,outline:{...page.outline,guided:{...guidedState(page),...patch}}};
}
export function changeGuidedPhase(project:CreatorProject,phase:GuidedState['phase']):CreatorProject{
 return {...project,outlineConfirmed:phase==='pages',pages:project.pages.map(p=>updateGuided(p,{phase}))};
}
export function updateGuidedPreferences(project:CreatorProject,preferences:Partial<Pick<CreatorProject,'duration'|'style'>>&{audience?:string}):CreatorProject{
 const changed=(preferences.duration!==undefined&&preferences.duration!==project.duration)||(preferences.style!==undefined&&preferences.style!==project.style)||(preferences.audience!==undefined&&preferences.audience!==guidedState(project.pages[0])?.audience);
 const {audience,...settings}=preferences;
 return {...project,...settings,outlineConfirmed:changed?false:project.outlineConfirmed,pages:project.pages.map(p=>{
  const state=guidedState(p)!;const target=audience??state.audience;
  const goal=p.goal.startsWith('帮助'+state.audience)?'帮助'+target+p.goal.slice(('帮助'+state.audience).length):p.goal;
  return updateGuided({...p,goal},{audience:target,confirmed:changed?false:state.confirmed});
 })};
}
export function compileGuided(project:CreatorProject):CreatorProject{
 const theme=project.style==='故事案例'?'.guided-lesson{background:#fffaf1}.guided-lesson button{color:#986e2f}':project.style==='动手探索'?'.guided-lesson{background:#f1f7ff}.guided-lesson button{color:#3168ad}':'';
 const files:Record<string,string>={'guided.css':lessonCss+theme};
 const pages=project.pages.map((page,i)=>{
  const design=guidedState(page)!;const entry=`Page${i+1}.tsx`;
  const data=JSON.stringify({title:page.title,goal:page.goal,body:page.summary,image:design.image||'',layout:design.layout||'visual',course:project.title}).replace(/</g,'\\u003c');
  files[entry]=`import React,{useState} from 'react';\nimport './guided.css';\nconst data=${data};\nexport default function Lesson(){const [open,setOpen]=useState(false);return <section className={'guided-lesson '+data.layout}><header>{data.course}</header><h1>{data.title}</h1><p className="guided-goal">{data.goal}</p><div className="guided-body"><div><p>{data.body||'请在创作页补充本页的讲解内容。'}</p></div>{data.image?<img src={data.image} alt="课程配图"/>:<div className="guided-diagram" aria-label="概念示意">{['提出问题','建立理解','尝试应用'].map((text,i)=><span key={text}><b>{i+1}</b>{text}</span>)}</div>}</div><button onClick={()=>setOpen(!open)} aria-expanded={open}>{open?'收起思考':'想一想：你会如何解释？'}</button>{open&&<p>试着用自己的话解释，或举一个你熟悉的例子。</p>}</section>;}\n`;
  return {...page,format:'react' as const,sourceEntry:entry,nativeId:undefined,designed:!!design.layout,ready:!!design.layout};
 });
 return {...project,source:{files},pages};
}
const lessonCss=`.guided-lesson{box-sizing:border-box;min-height:100%;padding:64px 80px;background:#f7fafc;color:#17304f;font:26px/1.7 sans-serif}.guided-lesson header{font-size:18px;color:#71829a}.guided-lesson h1{font-size:48px;margin:20px 0}.guided-goal{color:#60758e}.guided-body{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;white-space:pre-wrap}.guided-body img{width:100%;max-height:360px;object-fit:contain}.guided-diagram{display:flex;gap:16px;padding:32px;background:#e9f3f0;border-radius:24px}.guided-diagram span{flex:1;font-size:20px;text-align:center}.guided-diagram b{display:block;font-size:42px;color:#247868}.guided-lesson button{padding:14px 24px;border:1px solid #cbd9e4;border-radius:12px;background:white;color:#247868;font:inherit;cursor:pointer}.guided-lesson.steps .guided-body{grid-template-columns:1fr}.steps .guided-diagram{background:#eaf1fc}.question h1{padding:28px;border-left:8px solid #d3a455;background:#fff7e7}.question .guided-diagram{background:#fff7e7}.guided-lesson>p{margin:20px 0}`;
