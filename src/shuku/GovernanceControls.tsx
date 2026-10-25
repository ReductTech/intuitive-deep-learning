import {useEffect,useRef,useState} from 'react';
import {api,type Course} from './client';
type Kind='course'|'workspace';
export function RemovalButton({kind,id,title,onChange,label}:{kind:Kind;id:string;title:string;onChange:()=>void;label?:string}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function remove(){setBusy(true);setError('');try{await api('/'+(kind==='course'?'courses':'workspaces')+'/'+id+'/remove',{confirm:true});setOpen(false);window.dispatchEvent(new Event('shuku-removals-updated'));onChange();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><button className="shuku-danger" onClick={()=>setOpen(true)}>{label||(kind==='course'?'永久删除':'删除共创')}</button>{open&&<div className="shuku-modal"><section role="dialog" aria-modal="true" aria-labelledby={'remove-'+id}><header><h2 id={'remove-'+id}>{kind==='course'?'删除课程':'删除共创'}</h2><button aria-label="关闭" disabled={busy} onClick={()=>setOpen(false)}>×</button></header><p>确定删除“{title}”吗？</p><p>{kind==='course'?'课程、所有版本、上传文件和关联共创将被永久删除，已授权删除的课程 GitHub 仓库也会移除。':'私有草稿将被删除，已合并到官方课程的内容和贡献记录会保留。'}</p>{error&&<p role="alert" className="shuku-error">{error}</p>}<div className="shuku-row-actions"><button disabled={busy} onClick={()=>setOpen(false)}>取消</button><button className="shuku-danger" disabled={busy} onClick={()=>void remove()}>{busy?'正在提交…':'确认删除'}</button></div></section></div>}</>;
}
export function CourseGovernance({course,onChange}:{course:Course;onChange:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function visibility(){setBusy(true);setError('');try{await api('/courses/'+course.id+'/visibility',{action:course.status==='hidden'?'restore':'hide'});onChange();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><button disabled={busy} onClick={()=>void visibility()}>{course.status==='hidden'?'恢复课程':'下架课程'}</button><RemovalButton kind="course" id={course.id} title={course.title} onChange={onChange}/>{error&&<p role="alert" className="shuku-error">{error}</p>}</>;
}
interface Removal {id:string;title:string;state:string;task_status:string;checkpoint:{stage?:string}}
export function RemovalProgress({onComplete}:{onComplete:()=>void}){
 const [items,setItems]=useState<Removal[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const previous=useRef<Removal[]>([]),complete=useRef(onComplete);complete.current=onComplete;
 async function refresh(){const result=await api<{removals:Removal[]}>('/removals');if(result.removals.some(r=>r.state==='succeeded'&&previous.current.some(p=>p.id===r.id&&p.state!=='succeeded')))complete.current();previous.current=result.removals;setItems(result.removals);}
 useEffect(()=>{let active=true;async function update(){if(active)try{await refresh();}catch(e){if(active)setError((e as Error).message);}}void update();window.addEventListener('shuku-removals-updated',update);return()=>{active=false;window.removeEventListener('shuku-removals-updated',update);};},[]);
 const pending=items.some(r=>r.state==='queued'||r.state==='cleaning');
 useEffect(()=>{if(!pending)return;const timer=setInterval(()=>void refresh().catch(e=>setError(e.message)),1200);return()=>clearInterval(timer);},[pending]);
 async function retry(id:string){setBusy(true);setError('');try{await api('/removals/'+id+'/retry',{});await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(!items.length&&!error)return null;
 return <section className="shuku-removal-progress" aria-label="删除进度"><h2>删除进度</h2><div className="shuku-removal-list">{items.slice(0,10).map(item=><article key={item.id}><div><strong>{item.title}</strong><p role="status">{item.state==='succeeded'?'已删除':item.state==='failed'?'清理失败，可重试':item.checkpoint.stage==='waiting-for-tasks'?'等待相关任务结束':item.state==='cleaning'?'正在清理关联文件…':'正在删除…'}</p></div>{item.state==='failed'&&<button disabled={busy} onClick={()=>void retry(item.id)}>重试清理</button>}</article>)}</div>{error&&<p role="alert" className="shuku-error">{error}</p>}</section>;
}
