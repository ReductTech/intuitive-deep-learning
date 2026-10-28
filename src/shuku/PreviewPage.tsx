import {ContributionReview} from './Collaboration';
import { useEffect,useState } from 'react';
import { api,type SavedRevision } from './client';
import './shuku.css';
export function PreviewPage(){
 const course=new URLSearchParams(location.search).get('course');
 useEffect(()=>{if(course)location.replace('/my-courses/editor?course='+encodeURIComponent(course));},[course]);
 return course?<p role="status">正在打开课程编辑…</p>:<SavedRevisionPreview/>;
}
function SavedRevisionPreview(){
 const params=new URLSearchParams(location.search),id=params.get('revision')||'',courseId=params.get('course')||'';
 const [revision,setRevision]=useState<SavedRevision|null>(null),[error,setError]=useState(''),[empty,setEmpty]=useState(false),[title,setTitle]=useState('课程预览');
 useEffect(()=>{
  let active=true,timer:ReturnType<typeof setTimeout>;setRevision(null);setError('');setEmpty(false);setTitle('课程预览');
  async function load(){try{
   let rid=id;
   if(courseId){const {course}=await api<{course:{head_revision:string|null;title:string}}>('/courses/'+encodeURIComponent(courseId));if(!active)return;setTitle(course.title);if(!course.head_revision){setEmpty(true);return;}rid=course.head_revision;}
   if(!rid)throw new Error('请选择要预览的课程。');
   const value=await api<SavedRevision>('/revisions/'+encodeURIComponent(rid));if(!active)return;setRevision(value);setTitle(value.project.title);
   if(value.state==='building')timer=setTimeout(()=>void load(),1200);
  }catch(e){if(active)setError((e as Error).message);}}
  void load();return()=>{active=false;clearTimeout(timer);};
 },[id,courseId]);
 return <div className="shuku-preview"><header><a href="/my-courses">我的课程</a><strong>{title}</strong></header>{error?<p role="alert">{error}</p>:empty?<p role="status">暂时没有可预览的课程内容，请先在创作页面生成预览，或让本地 agent 保存成果。</p>:revision?.state==='ready'?<iframe title="已保存的课程预览" src={revision.preview_url}/>:revision?.state==='failed'?<p role="alert">课程预览生成失败，请返回创作页面检查内容并重新保存。</p>:<p role="status">正在准备课程预览…</p>}</div>;
}

export function ReviewPage(){return new URLSearchParams(location.search).has('contribution')?<ContributionReview/>:<CourseReview/>;}
function CourseReview(){
 const params=new URLSearchParams(location.search),id=params.get('review')||'',rid=params.get('revision')||'';
 const [revision,setRevision]=useState<SavedRevision|null>(null),[note,setNote]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{api<SavedRevision>('/revisions/'+rid).then(setRevision).catch(e=>setError(e.message));},[rid]);
 async function decide(decision:string){setBusy(true);setError('');try{await api('/reviews/'+id+'/decision',{decision,note,revision_id:rid});location.assign('/my-courses?tab=reviews');}catch(e){setError((e as Error).message);setBusy(false);}}
 return <div className="shuku-preview"><header><a href="/my-courses?tab=reviews">返回待审核</a><strong>{revision?.project.title||'课程审核'}</strong></header>{error&&<p className="shuku-error" role="alert">{error}</p>}{revision?.state==='ready'&&<iframe title="审核课程预览" src={revision.preview_url}/>}<form className="shuku-review-actions" onSubmit={e=>{e.preventDefault();void decide('approved');}}><label>审核意见<input value={note} maxLength={2000} onChange={e=>setNote(e.target.value)} placeholder="退回时请说明需要修改的内容"/></label><button type="button" disabled={busy||!revision} onClick={()=>void decide('rejected')}>退回修改</button><button className="shuku-primary" disabled={busy||!revision}>审核通过</button></form></div>;
}
