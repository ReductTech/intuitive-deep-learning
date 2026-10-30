import {useEffect,useState} from 'react';
import {api,type Course} from './client';
import {CourseGovernance,RemovalProgress} from './GovernanceControls';
import {GitHubPanel} from './GitHubPanel';
import {OrganizationCatalog} from './OrganizationCatalog';
type Group='published'|'pending'|'deleted';
interface ManagedCourse extends Course {owner?:string;version?:string;deleting?:boolean}
interface Page {items:ManagedCourse[];total:number;page_size:number}
const names:Record<Group,string>={published:'已上架课程',pending:'待收录课程',deleted:'已删除课程'};
const states:Record<string,string>={draft:'未发布草稿',published:'已上架',hidden:'已下架，可恢复'};
function CourseSection({group,revision,onChange}:{group:Group;revision:number;onChange:()=>void}){
 const [open,setOpen]=useState(group==='published'),[page,setPage]=useState(1),[data,setData]=useState<Page|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;setBusy(true);setError('');api<Page>('/admin/courses?group='+group+'&page='+page).then(value=>{if(active){setData(value);const last=Math.max(1,Math.ceil(value.total/value.page_size));if(page>last)setPage(last);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[group,page,revision]);
 return <details className="admin-course-section" open={open} onToggle={e=>setOpen(e.currentTarget.open)} aria-label={names[group]}><summary>{names[group]}{group==='published'&&data&&<span>（{data.total}）</span>}</summary><div className="admin-course-section-body">{group==='pending'&&<OrganizationCatalog onChange={onChange}/>}<p className="admin-hint">{group==='published'?'当前对学习者公开的课程。':group==='pending'?'独立仓库候选可在上方审核收录；以下是尚未发布的课程草稿。':'已下架课程仍可恢复；永久删除记录及失败重试见下方清理进度。'}</p>{busy&&!data&&<p role="status">正在读取课程…</p>}{error&&<p role="alert" className="shuku-error">{error}</p>}<section className="admin-list" aria-label={names[group]+'列表'}>{data?.items.map(item=><article className="admin-panel" key={item.id}><div className="admin-row"><div><h2>{item.title}</h2><p>{item.owner} · {item.deleting?'正在删除':states[item.status]||item.status}{item.version?' · v'+item.version:''}</p><small>{item.category||'未分类'}</small></div>{!item.deleting&&<a className="shuku-secondary" href={item.status==='published'?'/course?course='+item.id:'/my-courses/editor?course='+item.id}>{item.status==='published'?'查看课程':'打开课程'}</a>}</div>{!item.deleting&&<div className="shuku-row-actions"><CourseGovernance course={item} onChange={onChange}/><GitHubPanel courseId={item.id}/></div>}</article>)}{data&&!data.items.length&&<p className="shuku-empty">{group==='published'?'暂无已上架课程。':group==='pending'?'暂无未发布草稿。':'暂无已下架或正在删除的课程。'}</p>}</section>{data&&data.total>data.page_size&&<div className="admin-pagination" aria-label={names[group]+'分页'}><button disabled={page<=1||busy} onClick={()=>setPage(p=>p-1)}>上一页</button><span>第 {page} / {Math.max(1,Math.ceil(data.total/data.page_size))} 页</span><button disabled={page*data.page_size>=data.total||busy} onClick={()=>setPage(p=>p+1)}>下一页</button></div>}{group==='deleted'&&<RemovalProgress onComplete={onChange} embedded/>}</div></details>;
}
export function AdminCourseSections({revision,onChange}:{revision:number;onChange:()=>void}){
 return <div className="admin-course-sections">{(['published','pending','deleted'] as const).map(group=><CourseSection key={group} group={group} revision={revision} onChange={onChange}/>)}</div>;
}
