import { useRef, useState } from 'react';
import { ArrowRight, Database, GitBranch, Home, Settings } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import './AirflowControlPage.css';
import { useClickSteps } from '../../components/useClickSteps';

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
 const root=useRef<HTMLDivElement>(null);
 const [states,setStates]=useState<Record<string,TaskState>>(initial),[completedGroup,setCompletedGroup]=useState(0),[showBanner,setShowBanner]=useState(false);
 const finished=completedGroup===6;
 const {busy:running}=useClickSteps(root,async animation=>{
  if(showBanner){onComplete?.();return;}
  if(finished){setShowBanner(true);await animation.wait(600);return;}
  const group=tasks.filter(task=>task.col===completedGroup+1);
  setStates(previous=>Object.fromEntries(Object.entries(previous).map(([id,value])=>[id,group.some(task=>task.id===id)?{status:'running',tick:0}:value])));
  await animation.wait(Math.max(500,...group.map(task=>task.ticks*120)));
  setStates(previous=>Object.fromEntries(Object.entries(previous).map(([id,value])=>[id,group.some(task=>task.id===id)?{status:'success',tick:group.find(task=>task.id===id)!.ticks}:value])));
  setCompletedGroup(value=>value+1);
 });
 return <div shuku-edit-id="e-9ac18967-5c2f-456e-9374-48a25020541c" ref={root} className={`rf-page rf-airflow-control rfc-recording ${showBanner?'has-banner':''}`} data-running={running} data-completed-group={completedGroup} data-phase={showBanner?'banner':finished?'complete':running?'running':completedGroup>0?'paused':'ready'} aria-label="点击或按空格，逐步演示监听、获取、解析、并行分析、索引、入库和累计成果">
  <aside shuku-edit-id="e-66dad69a-2da1-4be6-9fea-39f2ad54d76f" className="rfc-sidebar"><div shuku-edit-id="e-b66637ad-5009-4cb2-8a69-0bb3ccfe51d0" className="rfc-logo"><GitBranch size={29}/></div>{[[Home,'首页'],[GitBranch,'Dags'],[Database,'资源'],[Settings,'设置']].map(([Icon,label])=>{const I=Icon as typeof Home;return <div shuku-edit-id="e-cf1dc6b1-e4a1-4365-9c94-255a3710b594" className={label==='Dags'?'active':''} key={String(label)}><I size={23}/><Typography shuku-edit-id="e-9578af56-1d42-42bd-84c7-9b011c75a1f4" variant="body" tone="inherit">{String(label)}</Typography></div>})}</aside>
  <main shuku-edit-id="e-eb2ff890-38d0-4620-92f1-69f03e973471" className="rfc-main"><header shuku-edit-id="e-54bb39ac-4b4f-4aec-9b25-d60420c00a45" className="rfc-header"><GitBranch size={23}/><Typography shuku-edit-id="e-fc733f70-7ea6-417b-86e6-8e606f327810" variant="h3">论文自动化处理框架</Typography></header>
   <div shuku-edit-id="e-bc4695f7-8fa9-4ef1-be31-b161eaf20995" className="rfc-meta"><div shuku-edit-id="e-f3107a61-ebf4-45ce-a475-5219fd290ea3"><Typography shuku-edit-id="e-7b44d492-7223-4037-a91f-aaf288603523" variant="body" tone="muted">每天自动监听</Typography><Typography shuku-edit-id="e-27c50c20-6393-474d-91a3-ceca3d5265d4" variant="body">覆盖 arXiv cs 全学科</Typography></div><div shuku-edit-id="e-30dfae7a-8410-4fe0-b8be-703e5e454cee"><Typography shuku-edit-id="e-ed12a57f-3306-4e41-b689-35e6ca817ebb" variant="body" tone="muted">全流程自动执行</Typography><Typography shuku-edit-id="e-9da46bc9-ab01-4128-988e-26b16671c40b" variant="body">获取 → 解析 → 入库</Typography></div><div shuku-edit-id="e-0d569208-8a7e-4ce3-bfc7-efd3d99873cf"><Typography shuku-edit-id="e-f663c53e-c936-42d6-98fc-5a5c2294b9c8" variant="body" tone="muted">Airflow 统一编排</Typography><Typography shuku-edit-id="e-aaccdca0-ae74-4f33-86b1-336973e32b56" variant="body">日处理量可达 5000 篇</Typography></div><div shuku-edit-id="e-033c3545-0cde-4760-abe3-4217d34b052d"><Typography shuku-edit-id="e-34b1548c-1323-4a11-ae11-4625404e0a75" variant="body" tone="muted">每日定时调度</Typography><Typography shuku-edit-id="e-42cc517c-3754-43ef-b17c-57480bc604d9" variant="body" tone={finished?'success':'accent'}>{finished?'本轮任务全部完成':running?'自动任务执行中':'持续监控新增论文'}</Typography></div></div>
   <div shuku-edit-id="e-5648243a-fc6e-4230-8fff-a8bc3cd690df" className="rfc-tabs"><Typography shuku-edit-id="e-be9ff340-233e-416d-9c2f-ad795d4f1176" variant="body" tone="accent">任务依赖图</Typography><div shuku-edit-id="e-66968bb3-4e89-44bc-8e1d-3b81ea05ec28" className="rfc-legend">{(['queued','running','success'] as const).map(s=><span shuku-edit-id="e-fc523e86-0dff-483e-94f5-7e80a6d2f7c2" key={s}><i shuku-edit-id="e-d37dbdd1-53fc-4c0d-be39-e5dd929040f3" className={`rfc-state ${s}`}/><Typography shuku-edit-id="e-478476eb-eaba-430e-9af3-3531ec4f63aa" variant="body" tone="muted">{statusText[s]}</Typography></span>)}</div></div>
   <div shuku-edit-id="e-b8f0b438-42ae-45d3-a7c5-a0a367c1f395" className="rfc-graph"><svg shuku-edit-id="e-7a24699a-f26d-4319-998f-ccad58807905" viewBox="0 0 1440 420" preserveAspectRatio="none" aria-hidden="true"><defs shuku-edit-id="e-0bd36542-2cca-4a7d-9c59-b09183a75768"><marker shuku-edit-id="e-1b9992de-4042-4506-9366-b638ab58f496" id="rfc-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path shuku-edit-id="e-f34284dd-f23f-4784-9320-940e1cf2bc9b" d="M0 0 L7 3.5 L0 7" fill="context-stroke"/></marker></defs>{connections.map(({source,target})=>{
    const x1=(source.col-1)*244+220,x2=(target.col-1)*244,y1=(source.row-.5)*140,y2=(target.row-.5)*140;
    const status=states[target.id].status==='running'&&states[source.id].status==='success'?'active':states[target.id].status==='success'?'done':'waiting';
    return <path shuku-edit-id="e-7747b7f3-53ab-4bff-9dc1-241cda96faa6" key={`${source.id}-${target.id}`} data-source={source.id} data-target={target.id} className={`rfc-edge ${status}`} d={`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`} markerEnd="url(#rfc-arrow)"/>;
   })}</svg>{tasks.map(task=><div shuku-edit-id="e-c2f8e7d0-004a-4f20-8090-e99cf392dc20" key={task.id} data-task={task.id} className={`rfc-node ${states[task.id].status}`} style={{gridColumn:task.col,gridRow:task.row}}><span shuku-edit-id="e-ca32ebec-863b-4aaf-8d63-2eec99bfca00" className={`rfc-state ${states[task.id].status}`}/><Typography shuku-edit-id="e-753cac47-e2be-419e-b0b7-4c6d9432cf22" variant="body">{task.label}</Typography></div>)}</div>
  </main>
  {showBanner&&<div shuku-edit-id="e-973335e0-4da0-4958-983a-dc405efd84f4" className="rfc-achievement-overlay"><aside shuku-edit-id="e-2c6260d1-953d-4058-ba8e-2dee5d33e616" className="rfc-completion-banner" role="status" aria-label="自动化流程与累计成果"><div shuku-edit-id="e-cec25e1e-5f57-4286-8df6-e1d4aabe1888" className="rfc-result-total"><Typography shuku-edit-id="e-b44b3584-f671-4981-893c-04ece90b9384" variant="display" tone="accent">20 万+</Typography><Typography shuku-edit-id="e-477dec0e-b54c-47b8-b5ce-8de2dcf2f571" variant="body">篇论文分析结果已积累</Typography></div><div shuku-edit-id="e-16c633fe-0a72-4a36-9d5d-13e00ffcf9d4" className="rfc-result-explanation"><div shuku-edit-id="e-88e69313-98c9-4df5-8ec0-f2e615b5495f" className="rfc-result-status"><i shuku-edit-id="e-522fab42-c6a4-4463-9e83-4c0ceff347df"/><Typography shuku-edit-id="e-ce60dd4e-96e9-4d3c-83c0-d7dc6f5ac22f" variant="body">持续自动运行</Typography></div><Typography shuku-edit-id="e-fe5881b4-db80-4f55-92ee-d09ded424cbc" variant="h3">监控、分析、入库全自动</Typography><div shuku-edit-id="e-a6a49c45-48fb-4bff-abab-c59eb5c7b3de" className="rfc-result-flow">{['监听','获取','分析','入库'].map((label,i)=><span shuku-edit-id="e-d426aee7-be08-4c63-9296-b84e6555acc9" key={label}>{i>0&&<ArrowRight size={32}/>}<Typography shuku-edit-id="e-8ef3efd1-1b70-464b-8386-de76b0d94568" variant="body">{label}</Typography></span>)}</div><Typography shuku-edit-id="e-f7236118-8d2e-49b2-a95d-ada354f818d7" variant="body" tone="muted">每天自动监听 arXiv cs 全学科</Typography></div></aside></div>}
 </div>;
}

