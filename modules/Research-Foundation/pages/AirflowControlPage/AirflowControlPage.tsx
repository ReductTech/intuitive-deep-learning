import { useEffect, useState } from 'react';
import { Check, Database, GitBranch, Home, Pause, Play, RotateCcw, Search, Settings } from 'lucide-react';
import { Button, Typography } from '../../../shared/react';
import './AirflowControlPage.css';

const tasks = [
  {id:'check_arxiv',label:'发现新论文',deps:[],ticks:2,col:1,row:2},
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
export function AirflowControlPage(){
 const [states,setStates]=useState<Record<string,TaskState>>(initial),[running,setRunning]=useState(true),[started,setStarted]=useState(true);
 const [selected,setSelected]=useState('parse_pdfs'),[tab,setTab]=useState('Graph'),[scheduled,setScheduled]=useState(true);
 const [cycle,setCycle]=useState(1);
 useEffect(()=>{
  if(!running)return;
  const timer=window.setInterval(()=>{
   if(document.hidden)return;
   setStates(previous=>{
    const next={...previous};
    for(const task of tasks){
     const current=previous[task.id];
     if(current.status==='running'){const tick=current.tick+1;next[task.id]={tick,status:tick>=task.ticks?'success':'running'};}
     else if(current.status==='queued'&&task.deps.every(id=>previous[id].status==='success'))next[task.id]={tick:0,status:'running'};
    }
    return next;
   });
  },350);
  return()=>clearInterval(timer);
 },[running]);
 const finished=tasks.every(t=>states[t.id].status==='success');
 useEffect(()=>{
  if(!finished)return;
  setRunning(false);
  if(!scheduled)return;
  const nextCycle=window.setTimeout(()=>{setCycle(n=>n+1);setStates(initial());setStarted(true);setRunning(true)},3500);
  return()=>clearTimeout(nextCycle);
 },[finished,scheduled]);
 function trigger(){setStates(initial());setStarted(true);setRunning(true)}
 function clear(){setRunning(false);setStarted(false);setStates(initial())}
 function rerun(){
  const affected=new Set([selected]);
  for(const task of tasks)if(task.deps.some(id=>affected.has(id)))affected.add(task.id);
  setStates(previous=>Object.fromEntries(tasks.map(t=>[t.id,affected.has(t.id)?{status:'queued',tick:0}:previous[t.id]])));
  setStarted(true);setRunning(true);
 }
 const current=tasks.find(t=>t.id===selected)!;
 return <div className="rf-page rf-airflow-control" data-running={running}>
  <aside className="rfc-sidebar"><div className="rfc-logo"><GitBranch size={29}/></div>{[[Home,'首页'],[GitBranch,'Dags'],[Database,'资源'],[Settings,'设置']].map(([Icon,label])=>{const I=Icon as typeof Home;return <div className={label==='Dags'?'active':''} key={String(label)}><I size={23}/><Typography variant="body" tone="inherit">{String(label)}</Typography></div>})}</aside>
  <aside className="rfc-history"><Typography variant="body" tone="muted">DAG</Typography><Typography variant="body">master_daily_pipeline</Typography><div className="rfc-history-bars">{[42,60,37,72,58,85,62,75].map((h,i)=><i key={i} style={{height:h}}/>)}</div><div className="rfc-task-list">{tasks.map(task=><button className={selected===task.id?'selected':''} key={task.id} onClick={()=>setSelected(task.id)} aria-label={`查看任务 ${task.label}`}><Typography variant="body">{task.id}</Typography><span className={`rfc-state ${states[task.id].status}`}>{states[task.id].status==='success'?<Check size={12}/>:null}</span></button>)}</div><Typography className="rfc-local-note" variant="body" tone="muted">本地流程模拟</Typography></aside>
  <main className="rfc-main"><header className="rfc-header"><GitBranch size={23}/><Typography variant="h3">论文自动化处理框架</Typography><button className={`rfc-toggle ${scheduled?'enabled':''}`} aria-label="切换每日调度" aria-pressed={scheduled} onClick={()=>setScheduled(!scheduled)}><i/></button><div className="rfc-actions"><Button onClick={clear} aria-label="清空运行状态"><RotateCcw size={16}/> 重置</Button>{started&&!finished&&<Button onClick={()=>setRunning(!running)} aria-label={running?'暂停任务运行':'继续任务运行'}>{running?<Pause size={15}/>:<Play size={15}/>} {running?'暂停':'继续'}</Button>}<Button variant="primary" disabled={running} onClick={trigger} aria-label="触发流程运行"><Play size={16}/> 重新演示</Button></div></header>
   <div className="rfc-meta"><div><Typography variant="body" tone="muted">每天自动监听</Typography><Typography variant="body">定时发现新增论文</Typography></div><div><Typography variant="body" tone="muted">全流程自动执行</Typography><Typography variant="body">获取 → 解析 → 入库</Typography></div><div><Typography variant="body" tone="muted">Airflow 统一编排</Typography><Typography variant="body">依赖调度 · 并行处理</Typography></div><div><Typography variant="body" tone="muted">第 {cycle} 轮 · 动画示意</Typography><Typography variant="body" tone={finished?'success':'accent'}>{finished?'本轮完成，等待下次调度':running?'自动任务执行中':started?'已暂停':'等待启动'}</Typography></div></div>
   <nav className="rfc-tabs">{['Graph','Tasks','Runs'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}><Typography variant="body">{t}</Typography></button>)}<div className="rfc-legend">{(['queued','running','success'] as const).map(s=><span key={s}><i className={`rfc-state ${s}`}/><Typography variant="body" tone="muted">{statusText[s]}</Typography></span>)}</div></nav>
   {tab==='Graph'?<div className="rfc-graph"><svg viewBox="0 0 1080 300" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="rfc-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="#a6b6c8"/></marker></defs>{[[160,150,200,150],[340,150,380,150],[520,150,560,50],[520,150,560,150],[520,150,560,250],[700,50,740,150],[700,150,740,150],[700,250,740,150],[880,150,920,150]].map(([x1,y1,x2,y2],i)=><path key={i} d={`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`} markerEnd="url(#rfc-arrow)"/>)}</svg>{tasks.map(task=><button key={task.id} className={`rfc-node ${states[task.id].status} ${selected===task.id?'selected':''}`} style={{gridColumn:task.col,gridRow:task.row}} onClick={()=>setSelected(task.id)} aria-label={`选择节点 ${task.label}`}><span className={`rfc-state ${states[task.id].status}`}/><Typography variant="body">{task.label}</Typography></button>)}</div>:tab==='Tasks'?<div className="rfc-table">{tasks.map(task=><button key={task.id} onClick={()=>setSelected(task.id)}><Typography variant="body">{task.id}</Typography><Typography variant="body">{task.label}</Typography><Typography variant="body">{statusText[states[task.id].status]}</Typography></button>)}</div>:<div className="rfc-runs"><Typography variant="h3">{started?'每日自动调度任务':'等待自动调度'}</Typography><Typography variant="body">{finished?'本次任务已全部完成':running?'任务按依赖顺序执行':started?'本次运行已暂停':'自动监听新增论文并启动流水线'}</Typography></div>}
   <section className="rfc-details"><div><Typography variant="body" tone="muted">当前任务</Typography><Typography variant="h3">{current.label}</Typography></div><div><Typography variant="body" tone="muted">执行状态</Typography><Typography variant="body">{statusText[states[selected].status]}</Typography></div><div><Typography variant="body" tone="muted">上游依赖</Typography><Typography variant="body">{current.deps.length>1?current.deps.length+' 个上游任务':current.deps.length?tasks.find(task=>task.id===current.deps[0])!.label:'无上游依赖'}</Typography></div><Button onClick={rerun} disabled={running||!started} aria-label="重新运行所选任务">重新运行</Button></section>
  </main>
 </div>;
}




