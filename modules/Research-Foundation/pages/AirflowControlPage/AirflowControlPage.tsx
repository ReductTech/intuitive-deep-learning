import { useEffect, useState } from 'react';
import { ArrowRight, Database, GitBranch, Home, Settings } from 'lucide-react';
import { Typography } from '../../../shared/react';
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
 return <div className={`rf-page rf-airflow-control rfc-recording ${showBanner?'has-banner':''}`} data-running={running} data-phase={showBanner?'banner':finished?'complete':running?'running':'ready'} onClick={event=>{if(event.button===0){event.stopPropagation();advance()}}} aria-label="左键逐步播放自动化处理流程和累计成果">
  <aside className="rfc-sidebar"><div className="rfc-logo"><GitBranch size={29}/></div>{[[Home,'首页'],[GitBranch,'Dags'],[Database,'资源'],[Settings,'设置']].map(([Icon,label])=>{const I=Icon as typeof Home;return <div className={label==='Dags'?'active':''} key={String(label)}><I size={23}/><Typography variant="body" tone="inherit">{String(label)}</Typography></div>})}</aside>
  <main className="rfc-main"><header className="rfc-header"><GitBranch size={23}/><Typography variant="h3">论文自动化处理框架</Typography></header>
   <div className="rfc-meta"><div><Typography variant="body" tone="muted">每天自动监听</Typography><Typography variant="body">覆盖 arXiv cs 全学科</Typography></div><div><Typography variant="body" tone="muted">全流程自动执行</Typography><Typography variant="body">获取 → 解析 → 入库</Typography></div><div><Typography variant="body" tone="muted">Airflow 统一编排</Typography><Typography variant="body">日处理量可达 5000 篇</Typography></div><div><Typography variant="body" tone="muted">每日定时调度</Typography><Typography variant="body" tone={finished?'success':'accent'}>{finished?'本轮任务全部完成':running?'自动任务执行中':'持续监控新增论文'}</Typography></div></div>
   <div className="rfc-tabs"><Typography variant="body" tone="accent">任务依赖图</Typography><div className="rfc-legend">{(['queued','running','success'] as const).map(s=><span key={s}><i className={`rfc-state ${s}`}/><Typography variant="body" tone="muted">{statusText[s]}</Typography></span>)}</div></div>
   <div className="rfc-graph"><svg viewBox="0 0 1440 420" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="rfc-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="context-stroke"/></marker></defs>{connections.map(({source,target})=>{
    const x1=(source.col-1)*244+220,x2=(target.col-1)*244,y1=(source.row-.5)*140,y2=(target.row-.5)*140;
    const status=states[target.id].status==='running'&&states[source.id].status==='success'?'active':states[target.id].status==='success'?'done':'waiting';
    return <path key={`${source.id}-${target.id}`} data-source={source.id} data-target={target.id} className={`rfc-edge ${status}`} d={`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`} markerEnd="url(#rfc-arrow)"/>;
   })}</svg>{tasks.map(task=><div key={task.id} data-task={task.id} className={`rfc-node ${states[task.id].status}`} style={{gridColumn:task.col,gridRow:task.row}}><span className={`rfc-state ${states[task.id].status}`}/><Typography variant="body">{task.label}</Typography></div>)}</div>
  </main>
  {showBanner&&<div className="rfc-achievement-overlay"><aside className="rfc-completion-banner" role="status" aria-label="自动化流程与累计成果"><div className="rfc-result-total"><Typography variant="display" tone="accent">20 万+</Typography><Typography variant="body">篇论文分析结果已积累</Typography></div><div className="rfc-result-explanation"><div className="rfc-result-status"><i/><Typography variant="body">持续自动运行</Typography></div><Typography variant="h3">监控、分析、入库全自动</Typography><div className="rfc-result-flow">{['监听','获取','分析','入库'].map((label,i)=><span key={label}>{i>0&&<ArrowRight size={32}/>}<Typography variant="body">{label}</Typography></span>)}</div><Typography variant="body" tone="muted">每天自动监听 arXiv cs 全学科</Typography></div></aside></div>}
 </div>;
}

