import {RepositoryNameField,repositoryNameError} from './RepositoryName';
import {useEffect,useRef,useState} from 'react';
import {api,type Course} from './client';

export function coursePublicationStatus(course:Course){
 if(course.status==='hidden')return '已下架';
 const label=course.has_draft?'草稿待保存':!course.head_revision?'草稿':course.revision_state==='failed'?'预览生成失败':course.revision_state==='building'?'预览生成中':({pending:'待审核',approved:'审核通过',rejected:'需要修改',published:'已发布'}[course.review_status||'']||'草稿');
 return course.current_version&&label!=='已发布'?'已发布 v'+course.current_version+' · 最新修订：'+label:label+(course.current_version?' v'+course.current_version:'');
}

export function CoursePublication({course,onChange}:{course:Course;onChange:()=>void}){
 const [dialog,setDialog]=useState<'review'|'publish'|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[job,setJob]=useState<string|null>(null);
 const [repositoryReady,setRepositoryReady]=useState(false);
 const [nameReset,setNameReset]=useState(0);
 const modal=useRef<HTMLDialogElement>(null),refresh=useRef(onChange);
 useEffect(()=>{refresh.current=onChange;},[onChange]);
 useEffect(()=>{if(dialog)modal.current?.showModal();return()=>{modal.current?.close();};},[dialog]);
 useEffect(()=>{if(!job)return;let active=true,polling=false;
  const timer=setInterval(async()=>{if(polling)return;polling=true;try{
   const result=await api<{jobs:{id:string;status:string;error_code?:string}[]}>('/courses/'+course.id+'/github');
   if(!active)return;const current=result.jobs.find(item=>item.id===job);
   if(current?.status==='succeeded'){setJob(null);setDialog(null);refresh.current();}
   else if(current?.status==='failed'){setJob(null);setNameReset(n=>n+1);setError(current.error_code==='REPOSITORY_NAME_TAKEN'?repositoryNameError(current.error_code):'发布同步未完成，请关闭此窗口，在“同步与审核详情”中重试，完成后点击“刷新课程”。');refresh.current();}
  }catch(e){if(active)setError((e as Error).message);}finally{polling=false;}},2000);
  return()=>{active=false;clearInterval(timer);};
 },[job,course.id]);
 async function submit(){if(busy)return;setBusy(true);setError('');try{await api('/courses/'+course.id+'/submit',{revision_id:course.head_revision});onChange();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function publish(form:HTMLFormElement){if(busy||job)return;setBusy(true);setError('');try{
  const fields=Object.fromEntries(new FormData(form));
  const result=await api<{release:{pending?:boolean;job_id?:string}}>('/courses/'+course.id+'/publish',{...fields,revision_id:course.head_revision});
  if(result.release.pending&&result.release.job_id)setJob(result.release.job_id);else{setDialog(null);refresh.current();}
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const edit='/my-courses/editor?course='+encodeURIComponent(course.id);
 const review=course.review_status,ready=course.revision_state==='ready'&&!!course.head_revision&&!course.has_draft;
 return <>{course.status!=='hidden'&&(course.has_draft||!course.head_revision||course.revision_state==='failed'?<a className="shuku-secondary" href={edit}>{course.has_draft?'保存草稿与提交审核':course.revision_state==='failed'?'修复课程':'完善课程后提交审核'}</a>:review==='pending'?<button className="shuku-secondary" onClick={()=>{setError('');setDialog('review');}}>查看审核进度</button>:review==='approved'?<button className="shuku-primary" disabled={!ready||busy||!!job} onClick={()=>{setError('');setDialog('publish');}}>发布课程</button>:review==='rejected'?<><button className="shuku-secondary" onClick={()=>{setError('');setDialog('review');}}>查看审核意见</button><a className="shuku-secondary" href={edit}>修改后重新提交</a></>:review!=='published'?<button className="shuku-primary" disabled={!ready||busy} onClick={()=>void submit()}>{busy?'正在提交…':'提交审核'}</button>:null)}
 {error&&!dialog&&<span role="alert" className="shuku-error">{error}</span>}
 {dialog&&<dialog ref={modal} className="la-dialog" aria-labelledby={'course-publication-'+course.id} onCancel={e=>{e.preventDefault();if(!busy&&!job)setDialog(null);}}><header><h2 id={'course-publication-'+course.id}>{dialog==='publish'?'发布课程':'课程审核进度'}</h2><button aria-label="关闭" disabled={busy||!!job} onClick={()=>setDialog(null)}>×</button></header><p>{course.title}</p>{dialog==='review'?<><p role="status">{review==='pending'?'课程已提交，等待管理员审核。':review==='approved'?'审核通过，可以发布课程。':review==='rejected'?'需要修改后保存新修订，再提交审核。':'审核状态已更新。'}</p>{course.review_note&&<p>审核意见：{course.review_note}</p>}<button onClick={onChange}>刷新审核状态</button></>:<form onSubmit={e=>{e.preventDefault();void publish(e.currentTarget);}}><p>发布当前审核通过的已保存版本，发布成功后学习者可以查看。</p>{course.current_version&&<p>当前正式版本：v{course.current_version}，新版本号需高于此版本。</p>}<RepositoryNameField resetCheck={nameReset} courseId={course.id} disabled={busy||!!job} onReady={setRepositoryReady}/><label>版本号<input name="version" placeholder="1.0.0" pattern="v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)" required disabled={busy||!!job}/></label><label>版本说明<textarea name="note" rows={3} maxLength={3000} disabled={busy||!!job}/></label>{error&&<p role="alert" className="shuku-error">{error}</p>}{job&&<p role="status">正在同步发布，请稍候…</p>}<button className="shuku-primary" disabled={busy||!!job||!repositoryReady}>{job?'正在同步发布…':busy?'正在发布…':'确认发布'}</button></form>}</dialog>}</>;
}
