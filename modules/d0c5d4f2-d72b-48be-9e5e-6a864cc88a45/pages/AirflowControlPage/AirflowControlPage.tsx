import { useEffect, useState } from 'react';
import { ArrowRight, Database, GitBranch, Home, Settings } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import './AirflowControlPage.css';

const tasks = [
  {id:'check_arxiv',label:'监听新论文',deps:[],ticks:2,col:1,row:2},
  {id:'fetch_pdfs',label:'获取 PDF',deps:['check_arxiv'],ticks:2,col:2,row:2},
  {id:'parse_pdfs',label:'自研算法解析',deps:['fetch_pdfs'],ticks:3,col:3,row:2},
  {id:'extract_figures',label:'提取核心图表',deps:['parse_pdfs'],ticks:3,col:4,row:1},
  {id:'outline_summary',label:'大纲与总结',deps:['parse_pdfs'],ticks:2,col:4,row:2},
  {id:'author_info',label:'作者与机构',deps:['parse_pdfs'],ticks:2,col:4,row:3},
  {id:'build_index',label:'组织检索索引',deps:['extract_figures','outline_summary','author_info'],ticks:2,col:5,row:2},
  {id:'save_database',label:'结构化入库',deps:['build_index'],ticks:2,col:6,row:2},
];
type Status='queued'|'running'|'success';
const connections=tasks.flatMap(target=>target.deps.map(id=>({source:tasks.find(task=>task.id===id)!,target})));
type TaskState={status:Status;tick:number};
const initial=()=>Object.fromEntries(tasks.map(t=>[t.id,{status:'queued' as Status,tick:0}]));
const statusText={queued:'等待依赖',running:'运行中',success:'已完成'};
export function AirflowControlPage({onComplete}:{onComplete?:()=>void}){
 const [states,setStates]=useState<Record<string,TaskState>>(initial),[running,setRunning]=useState(false),[started,setStarted]=useState(false),[showBanner,setShowBanner]=useState(false);
 useEffect(()=>{
  if(!running)return;
  const timer=window.setInterval(()=>{
   if(document.hidden)return;
   setStates(previous=>{
    const next={...previous};
    for(const task of tasks){
     const current=previous[task.id];
     if(current.status==='running'){const tick=current.tick+1;next[task.id]={tick,status:tick>=task.ticks?'success':'running'}}
     else if(current.status==='queued'&&task.deps.every(id=>previous[id].status==='success'))next[task.id]={tick:0,status:'running'};
    }
    return next;
   });
  },120);
  return()=>clearInterval(timer);
 },[running]);
 const finished=tasks.every(t=>states[t.id].status==='success');
 useEffect(()=>{if(finished)setRunning(false)},[finished]);
 function advance(){
  if(running)return;
  if(!started){setStarted(true);setRunning(true)}
  else if(finished&&!showBanner)setShowBanner(true);
  else if(showBanner)onComplete?.();
 }
 return <div shuku-edit-id="e-50364eb7-9908-4e47-b7d3-59631952a9fb" className={`rf-page rf-airflow-control rfc-recording ${showBanner?'has-banner':''}`} data-running={running} data-phase={showBanner?'banner':finished?'complete':running?'running':'ready'} onClick={event=>{if(event.button===0){event.stopPropagation();advance()}}} aria-label="左键逐步播放自动化处理流程和累计成果">
  <aside shuku-edit-id="e-cd01b5f0-b21f-4df4-b92f-6471d3243605" className="rfc-sidebar"><div shuku-edit-id="e-53c34f7b-6e50-42d4-98a7-7e1527b0f4c3" className="rfc-logo"><GitBranch size={29}/></div>{[[Home,'首页'],[GitBranch,'Dags'],[Database,'资源'],[Settings,'设置']].map(([Icon,label])=>{const I=Icon as typeof Home;return <div shuku-edit-id="e-d6815757-9365-4423-96e3-6fd5ea5e0e7e" className={label==='Dags'?'active':''} key={String(label)}><I size={23}/><Typography shuku-edit-id="e-a721f58b-10ab-4e27-8426-c1265a4ba3a9" variant="body" tone="inherit">{String(label)}</Typography></div>})}</aside>
  <main shuku-edit-id="e-7daa2670-8493-4e3a-a927-008ce213e7fa" className="rfc-main"><header shuku-edit-id="e-ed700eef-52a9-4d37-a6c6-ce1a9050846a" className="rfc-header"><GitBranch size={23}/><Typography shuku-edit-id="e-50ff31dc-ae75-426b-9b3e-729454f0c6ae" variant="h3">论文自动化处理框架</Typography></header>
   <div shuku-edit-id="e-6a1a4211-eaad-472f-8265-3e89f47d8c85" className="rfc-meta"><div shuku-edit-id="e-cfc6f857-92f5-4e41-9515-12c4b9fd3bd9"><Typography shuku-edit-id="e-d3f66ea3-fdc7-41f4-9c18-2091369a0d09" variant="body" tone="muted">每天自动监听</Typography><Typography shuku-edit-id="e-395b9505-1cac-4ecb-aeb7-6b6f01389efb" variant="body">覆盖 arXiv cs 全学科</Typography></div><div shuku-edit-id="e-b8941857-bbcd-4962-bbad-dd9fad4a4b14"><Typography shuku-edit-id="e-5145f2a4-03f5-4c18-b71c-4c48e30d0b2a" variant="body" tone="muted">全流程自动执行</Typography><Typography shuku-edit-id="e-db405cd3-b811-49e6-bb20-91eb8423dbb2" variant="body">获取 → 解析 → 入库</Typography></div><div shuku-edit-id="e-5b99c000-cfe0-4930-bfa9-2ed686766be3"><Typography shuku-edit-id="e-b2566d00-691e-4033-bcee-1b4303a6fcc9" variant="body" tone="muted">Airflow 统一编排</Typography><Typography shuku-edit-id="e-cc759e15-0b06-44dd-9e90-f0630ef01d1e" variant="body">日处理量可达 5000 篇</Typography></div><div shuku-edit-id="e-5c4bfd86-157d-46c5-9026-d2ef3aa6a287"><Typography shuku-edit-id="e-eef83e4d-0546-481e-9119-bab0d1b07608" variant="body" tone="muted">每日定时调度</Typography><Typography shuku-edit-id="e-a069b140-834c-4b3a-80cb-798397647891" variant="body" tone={finished?'success':'accent'}>{finished?'本轮任务全部完成':running?'自动任务执行中':'持续监控新增论文'}</Typography></div></div>
   <div shuku-edit-id="e-2b474bf6-e8b2-4362-91c8-771aabd88d0d" className="rfc-tabs"><Typography shuku-edit-id="e-e6caca99-d3d8-4647-8bb3-d0d7404412b5" variant="body" tone="accent">任务依赖图</Typography><div shuku-edit-id="e-168cb8df-10b1-4581-bfa9-34b97431392f" className="rfc-legend">{(['queued','running','success'] as const).map(s=><span shuku-edit-id="e-349caedf-8c13-4b7a-89bb-1ce9c01d638d" key={s}><i shuku-edit-id="e-39885f6f-2275-476b-85fa-20c3bd67bf69" className={`rfc-state ${s}`}/><Typography shuku-edit-id="e-6dd3e089-fc2a-49a1-b7c0-52027d09d1f6" variant="body" tone="muted">{statusText[s]}</Typography></span>)}</div></div>
   <div shuku-edit-id="e-3f96ef3a-0729-46ec-be57-6a094ce73803" className="rfc-graph"><svg shuku-edit-id="e-6bbcfc29-b4d9-4c92-b4f0-819591c46eea" viewBox="0 0 1440 420" preserveAspectRatio="none" aria-hidden="true"><defs shuku-edit-id="e-12bee802-27c9-4ac6-bdfb-612f9277dc89"><marker shuku-edit-id="e-95916cd9-e0b5-47fb-a2f8-b0f27ae535df" id="rfc-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path shuku-edit-id="e-15cb8703-196f-47d2-a67f-4b7c0ae87423" d="M0 0 L7 3.5 L0 7" fill="context-stroke"/></marker></defs>{connections.map(({source,target})=>{
    const x1=(source.col-1)*244+220,x2=(target.col-1)*244,y1=(source.row-.5)*140,y2=(target.row-.5)*140;
    const status=states[target.id].status==='running'&&states[source.id].status==='success'?'active':states[target.id].status==='success'?'done':'waiting';
    return <path shuku-edit-id="e-423df0e2-a97f-437e-9291-bc66d58da53d" key={`${source.id}-${target.id}`} data-source={source.id} data-target={target.id} className={`rfc-edge ${status}`} d={`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`} markerEnd="url(#rfc-arrow)"/>;
   })}</svg>{tasks.map(task=><div shuku-edit-id="e-7724a83d-4914-4c32-a2ca-977e0416a492" key={task.id} data-task={task.id} className={`rfc-node ${states[task.id].status}`} style={{gridColumn:task.col,gridRow:task.row}}><span shuku-edit-id="e-c0ab8828-9151-4545-8764-baf35b7dcec8" className={`rfc-state ${states[task.id].status}`}/><Typography shuku-edit-id="e-6424481c-26c6-44ed-880e-a9ebd84c2d64" variant="body">{task.label}</Typography></div>)}</div>
  </main>
  {showBanner&&<div shuku-edit-id="e-25a7982b-e3cc-497f-9ad7-e7477a9c4b7e" className="rfc-achievement-overlay"><aside shuku-edit-id="e-b12294c7-d150-49e7-8506-8258a0d83129" className="rfc-completion-banner" role="status" aria-label="自动化流程与累计成果"><div shuku-edit-id="e-d64cd482-06ff-4b49-abe0-24aa6f2511a1" className="rfc-result-total"><Typography shuku-edit-id="e-785edff0-17ad-4586-bc74-ce79e7eabc9f" variant="display" tone="accent">20 万+</Typography><Typography shuku-edit-id="e-b5075997-e795-458f-b674-382c31829f40" variant="body">篇论文分析结果已积累</Typography></div><div shuku-edit-id="e-b6c92397-2855-4766-8286-e798f4000bc9" className="rfc-result-explanation"><div shuku-edit-id="e-bb08db0f-1d4a-45f4-9c45-1f21049ac93c" className="rfc-result-status"><i shuku-edit-id="e-a19556be-846e-4435-aedb-7131164835b1"/><Typography shuku-edit-id="e-e3ba0b72-e26a-4b23-9d0e-af3ee24d9758" variant="body">持续自动运行</Typography></div><Typography shuku-edit-id="e-23fb1d97-7534-42d2-9e31-8ba77b57f4b5" variant="h3">监控、分析、入库全自动</Typography><div shuku-edit-id="e-4e104768-6e2e-4f95-b1cf-4d7863e2a510" className="rfc-result-flow">{['监听','获取','分析','入库'].map((label,i)=><span shuku-edit-id="e-935cbf09-3fa6-4275-b386-b86a02a68abe" key={label}>{i>0&&<ArrowRight size={32}/>}<Typography shuku-edit-id="e-760fd6a5-6a4a-4064-976f-47bea3db08db" variant="body">{label}</Typography></span>)}</div><Typography shuku-edit-id="e-52357db2-0e64-48e6-8ac0-2ebd8fb43485" variant="body" tone="muted">每天自动监听 arXiv cs 全学科</Typography></div></aside></div>}
 </div>;
}

