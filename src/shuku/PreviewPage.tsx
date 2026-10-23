import {ContributionReview} from './Collaboration';
import { useEffect,useState } from 'react';
import { api,type SavedRevision } from './client';
import './shuku.css';
export function PreviewPage(){
 const id=new URLSearchParams(location.search).get('revision')||'';
 const [revision,setRevision]=useState<SavedRevision|null>(null),[error,setError]=useState('');
 useEffect(()=>{api<SavedRevision>('/revisions/'+encodeURIComponent(id)).then(setRevision).catch(e=>setError(e.message));},[id]);
 return <div className="shuku-preview"><header><a href="/my-courses">我的课程</a><strong>{revision?.project.title||'课程预览'}</strong></header>{error?<p role="alert">{error}</p>:revision?.state==='ready'?<iframe title="已保存的课程预览" src={revision.preview_url}/>:<p>课程预览尚未准备完成，请返回编辑器查看状态。</p>}</div>;
}
export function ReviewPage(){return new URLSearchParams(location.search).has('contribution')?<ContributionReview/>:<CourseReview/>;}
function CourseReview(){
 const params=new URLSearchParams(location.search),id=params.get('review')||'',rid=params.get('revision')||'';
 const [revision,setRevision]=useState<SavedRevision|null>(null),[note,setNote]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{api<SavedRevision>('/revisions/'+rid).then(setRevision).catch(e=>setError(e.message));},[rid]);
 async function decide(decision:string){setBusy(true);setError('');try{await api('/reviews/'+id+'/decision',{decision,note,revision_id:rid});location.assign('/my-courses');}catch(e){setError((e as Error).message);setBusy(false);}}
 return <div className="shuku-preview"><header><a href="/my-courses">返回待审核</a><strong>{revision?.project.title||'课程审核'}</strong></header>{error&&<p className="shuku-error" role="alert">{error}</p>}{revision?.state==='ready'&&<iframe title="审核课程预览" src={revision.preview_url}/>}<form className="shuku-review-actions" onSubmit={e=>{e.preventDefault();void decide('approved');}}><label>审核意见<input value={note} maxLength={2000} onChange={e=>setNote(e.target.value)} placeholder="退回时请说明需要修改的内容"/></label><button type="button" disabled={busy||!revision} onClick={()=>void decide('rejected')}>退回修改</button><button className="shuku-primary" disabled={busy||!revision}>审核通过</button></form></div>;
}
