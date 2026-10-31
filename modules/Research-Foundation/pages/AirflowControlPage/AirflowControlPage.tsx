import { useEffect, useState } from 'react';
import { Database, GitBranch, Home, Settings, Zap } from 'lucide-react';
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
 const current=tasks.find(t=>states[t.id].status==='running')??(finished?tasks[tasks.length-1]:tasks[0]);
 return <div className={`rf-page rf-airflow-control rfc-recording ${showBanner?'has-banner':''}`} data-running={running} data-phase={showBanner?'banner':finished?'complete':running?'running':'ready'} onClick={event=>{if(event.button===0){event.stopPropagation();advance()}}} aria-label="左键逐步播放自动化处理流程和累计成果">
  <aside className="rfc-sidebar"><div className="rfc-logo"><GitBranch size={29}/></div>{[[Home,'首页'],[GitBranch,'Dags'],[Database,'资源'],[Settings,'设置']].map(([Icon,label])=>{const I=Icon as typeof Home;return <div className={label==='Dags'?'active':''} key={String(label)}><I size={23}/><Typography variant="body" tone="inherit">{String(label)}</Typography></div>})}</aside>
  <main className="rfc-main"><header className="rfc-header"><GitBranch size={23}/><Typography variant="h3">论文自动化处理框架</Typography></header>
   <div className="rfc-meta"><div><Typography variant="body" tone="muted">每天自动监听</Typography><Typography variant="body">覆盖 arXiv cs 全学科</Typography></div><div><Typography variant="body" tone="muted">全流程自动执行</Typography><Typography variant="body">获取 → 解析 → 入库</Typography></div><div><Typography variant="body" tone="muted">Airflow 统一编排</Typography><Typography variant="body">日处理量可达 5000 篇</Typography></div><div><Typography variant="body" tone="muted">每日定时调度</Typography><Typography variant="body" tone={finished?'success':'accent'}>{finished?'本轮任务全部完成':running?'自动任务执行中':'持续监控新增论文'}</Typography></div></div>
   <div className="rfc-tabs"><Typography variant="body" tone="accent">任务依赖图</Typography><div className="rfc-legend">{(['queued','running','success'] as const).map(s=><span key={s}><i className={`rfc-state ${s}`}/><Typography variant="body" tone="muted">{statusText[s]}</Typography></span>)}</div></div>
   <div className="rfc-graph"><svg viewBox="0 0 1080 300" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="rfc-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="#a6b6c8"/></marker></defs>{[[160,150,200,150],[340,150,380,150],[520,150,560,50],[520,150,560,150],[520,150,560,250],[700,50,740,150],[700,150,740,150],[700,250,740,150],[880,150,920,150]].map(([x1,y1,x2,y2],i)=><path key={i} d={`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`} markerEnd="url(#rfc-arrow)"/>)}</svg>{tasks.map(task=><div key={task.id} className={`rfc-node ${states[task.id].status}`} style={{gridColumn:task.col,gridRow:task.row}}><span className={`rfc-state ${states[task.id].status}`}/><Typography variant="body">{task.label}</Typography></div>)}</div>
   <section className="rfc-details"><div><Typography variant="body" tone="muted">当前任务</Typography><Typography variant="h3">{current.label}</Typography></div><div><Typography variant="body" tone="muted">执行状态</Typography><Typography variant="body">{statusText[states[current.id].status]}</Typography></div><div><Typography variant="body" tone="muted">上游依赖</Typography><Typography variant="body">{current.deps.length>1?current.deps.length+' 个上游任务':current.deps.length?tasks.find(task=>task.id===current.deps[0])!.label:'无上游依赖'}</Typography></div></section>
  </main>
  {showBanner&&<aside className="rfc-completion-banner" role="status" aria-label="自动化流程与累计成果"><div className="rfc-banner-message"><div className="rfc-banner-symbol"><Zap size={38} strokeWidth={1.7}/></div><div><Typography variant="h3">监控、处理、入库，全流程自动化</Typography><Typography variant="body" tone="muted">每天自动监听 · 自动分析 · 持久化入库</Typography></div></div><div className="rfc-banner-result"><Typography variant="display" tone="accent">20 万+</Typography><Typography variant="body">篇论文分析结果已积累</Typography></div></aside>}
 </div>;
}

