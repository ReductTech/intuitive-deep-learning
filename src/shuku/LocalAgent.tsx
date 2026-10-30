import {useEffect,useRef,useState} from 'react';
import {api,type Course} from './client';
import {SiteHeader} from './SiteHeader';
import './LocalAgent.css';

export interface LocalBrief {text:string;filename:string;token_id:string;expires_at:number;course?:Course}
export function BriefDialog({brief,onClose}:{brief:LocalBrief;onClose:()=>void}){
 const [copied,setCopied]=useState(false),[error,setError]=useState(''),[showInstructions,setShowInstructions]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>{node?.close();};},[]);
 function download(){const url=URL.createObjectURL(new Blob([brief.text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=brief.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <dialog ref={dialog} className="la-dialog" onCancel={e=>{e.preventDefault();onClose();}} aria-labelledby="la-brief-title"><header><h2 id="la-brief-title">本地创作专属指令</h2><button onClick={onClose} aria-label="关闭">×</button></header><p>复制给本地 AI 助手，准备完成后，告诉它你想创作什么。</p>{!showInstructions?<><ol className="la-guide"><li>将专属指令复制给本地 AI 助手。</li><li>告诉它你的想法，一起讨论并完善课程。</li><li>让它保存成果，回到术库预览并提交审核。</li></ol><button className="shuku-primary" onClick={()=>setShowInstructions(true)}>知道了，查看专属指令</button></>:<><textarea aria-label="本地创作专属指令" readOnly value={brief.text} rows={12} spellCheck={false}/><small>包含本课程的专用凭证，请妥善保存。有效期至 {new Date(brief.expires_at*1000).toLocaleDateString('zh-CN')}，可在个人信息中撤销。</small>{error&&<p role="alert">{error}</p>}<footer><button onClick={download}>下载指令</button><button className="shuku-primary" onClick={()=>{void navigator.clipboard.writeText(brief.text).then(()=>setCopied(true)).catch(()=>setError('复制未完成，请手动选中复制或下载指令。'));}}>{copied?'已复制':'复制专属指令'}</button><button onClick={onClose}>完成</button></footer></>}</dialog>;
}
export function LocalAgentButton({courseId,label='使用本地 Agent 修改',dropdown=false}:{courseId:string;label?:string;dropdown?:boolean}){
 const [brief,setBrief]=useState<LocalBrief|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 function local(){setBusy(true);setError('');void api<LocalBrief>('/local-agent/courses/'+courseId+'/brief',{}).then(setBrief).catch(e=>setError(e.message)).finally(()=>setBusy(false));}
 return <>{dropdown?<select className="shuku-authoring-select" aria-label="继续创作" value="" disabled={busy} onChange={e=>{if(e.target.value==='web')location.assign('/my-courses/editor?course='+encodeURIComponent(courseId));else if(e.target.value==='local')local();}}><option value="" disabled>{busy?'正在准备…':'继续创作'}</option><option value="web">使用减论 agent</option><option value="local">使用本地 agent</option></select>:<button className="shuku-secondary" disabled={busy} onClick={local}>{busy?'正在准备…':label}</button>}{error&&<span role="alert" className="shuku-error">{error}</span>}{brief&&<BriefDialog brief={brief} onClose={()=>setBrief(null)}/>}</>;
}

interface Credential {id:string;course_id:string;title:string;created_at:number;expires_at:number;revoked_at:number|null;last_used_at:number|null}
export function LocalAgentCredentials(){
 const [items,setItems]=useState<Credential[]>([]),[error,setError]=useState(''),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState('');
 function refresh(){return api<{credentials:Credential[]}>('/local-agent/credentials').then(r=>{setItems(r.credentials);setLoaded(true);});}
 return <details onToggle={e=>{if(e.currentTarget.open&&!loaded)void refresh().catch(e=>setError(e.message));}}><summary>本地 Agent 创作凭证</summary><p>凭证只能读取和保存对应课程，不能审核或发布。</p>{items.map(item=><div className="la-credential" key={item.id}><div><strong>{item.title}</strong><small>{item.revoked_at?'已撤销':item.expires_at<=Date.now()/1000?'已过期':'有效期至 '+new Date(item.expires_at*1000).toLocaleDateString('zh-CN')}</small></div>{!item.revoked_at&&item.expires_at>Date.now()/1000&&<button disabled={!!busy} onClick={()=>{setBusy(item.id);setError('');void api('/local-agent/credentials/'+item.id+'/revoke',{}).then(refresh).catch(e=>setError(e.message)).finally(()=>setBusy(''));}}>撤销凭证</button>}</div>)}{loaded&&!items.length&&<p>暂无凭证，可在课程中获取本地创作指令。</p>}{error&&<p role="alert" className="shuku-error">{error}</p>}</details>;
}
export function LocalCoursePage(){
 const cid=new URLSearchParams(location.search).get('course')||'';
 const [course,setCourse]=useState<Course|null>(null),[error,setError]=useState('');
 useEffect(()=>{api<{course:Course}>('/courses/'+cid).then(r=>setCourse(r.course)).catch(e=>setError(e.message));},[cid]);
 return <div className="sd-library shuku-management"><SiteHeader section="authoring"/><main className="shuku-content la-course"><a className="shuku-back" href={course?.workspace?'/my-courses?tab=workspaces':'/my-courses'}>返回我的课程</a>{course?<><h1>{course.title}</h1><p>与本地 AI 助手一起创作，保存后回到术库预览。</p><LocalAgentButton courseId={cid} label="获取本地创作指令"/><div className="la-actions">{course.head_revision&&<a className="shuku-primary" href={'/my-courses/preview?revision='+course.head_revision}>预览最新成果</a>}<a className="shuku-secondary" href={'/my-courses/editor?course='+cid}>查看课程与审核</a></div><ol className="la-guide"><li>将专属指令交给本地 AI 助手。</li><li>告诉它你的想法，逐步完善课程。</li><li>让它保存成果，回来预览并提交审核。</li></ol>{!course.head_revision&&<p role="status">等待首次保存。保存后刷新此页即可查看成果。</p>}<button onClick={()=>location.reload()}>刷新成果</button></>:<p role={error?'alert':'status'}>{error||'正在打开…'}</p>}</main></div>;
}
