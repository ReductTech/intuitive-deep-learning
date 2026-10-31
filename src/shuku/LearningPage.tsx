import {ErrorPage} from '../app/ErrorPage';
import {useEffect,useRef,useState} from 'react';
import {api,ApiError} from './client';
import {SiteHeader} from './SiteHeader';
import './shuku.css';
import {useStudy,type StudyPosition} from './personal';
import {fetchNarration} from './narrationBridge';
import {usePlayer} from './usePlayer';
interface Learning {course_id:string;title:string;version:string;revision_id:string}
export function LearningPage(){
 const [loadFailure,setLoadFailure]=useState<unknown>(null);
 const rid=new URLSearchParams(location.search).get('revision')||'';
 const player=usePlayer(rid);
 const frame=useRef<HTMLIFrameElement>(null);
 const [course,setCourse]=useState<Learning|null>(null),[error,setError]=useState(''),[open,setOpen]=useState(false),[message,setMessage]=useState(''),[position,setPosition]=useState(''),[key,setKey]=useState(''),[busy,setBusy]=useState(false),[submitted,setSubmitted]=useState<string|null>(null),[login,setLogin]=useState(false);
 useEffect(()=>{try{const saved=sessionStorage.getItem('shuku:feedback:'+rid);if(saved){const draft=JSON.parse(saved);if(typeof draft.message==='string'&&draft.message.length<=5000&&typeof draft.position==='string'&&draft.position.length<=200){setMessage(draft.message);setPosition(draft.position);setKey(crypto.randomUUID());setOpen(true);}sessionStorage.removeItem('shuku:feedback:'+rid);}}catch{}api<Learning>('/public/revisions/'+encodeURIComponent(rid)).then(setCourse).catch(e=>setLoadFailure(e));},[rid]);
 const params=new URLSearchParams(location.search);
 const study=useStudy(course?'course:'+course.course_id:'',rid,params.get('resume')==='1',params.get('mode')==='ppt'?'ppt':'guide');
 const [versions,setVersions]=useState<{revision_id:string;version:string}[]>([]);
 useEffect(()=>{if(course)void api<{releases:typeof versions}>('/public/courses/'+course.course_id+'/releases').then(r=>setVersions(r.releases)).catch(e=>setError(e.message));},[course]);
 useEffect(()=>{
  if(!study.initial||!study.context)return;
  const channel=crypto.randomUUID(),initial=study.initial,context=study.context;
  const valid=(state:StudyPosition)=>state&&context.pages.includes(state.page_id)&&['guide','ppt'].includes(state.mode)&&Array.isArray(state.completed)&&state.completed.every(p=>context.pages.includes(p));
  const narrationRequests=new Map<string,AbortController>();
  const receive=(event:MessageEvent)=>{
   if(event.origin!==(context.sandboxed?'null':location.origin)||event.source!==frame.current?.contentWindow||event.data?.revision!==rid)return;
   if(event.data.type==='shuku-narration-cancel'&&event.data.channel===channel){const controller=narrationRequests.get(event.data.requestId);controller?.abort();narrationRequests.delete(event.data.requestId);}
   if(event.data.type==='shuku-narration-request'&&event.data.channel===channel){
    const {requestId,text,options}=event.data;
    if(typeof requestId!=='string'||requestId.length>64||narrationRequests.has(requestId)||narrationRequests.size>=2||typeof text!=='string'||!text.trim()||text.length>10000)return;
    const controller=new AbortController();narrationRequests.set(requestId,controller);
    void fetchNarration(text,controller.signal,{rate:options?.rate,voiceId:options?.voiceId}).then(blob=>blob.arrayBuffer()).then(audio=>{
     if(!controller.signal.aborted)frame.current?.contentWindow?.postMessage({type:'shuku-narration-result',revision:rid,channel,requestId,audio},context.sandboxed?'*':location.origin,[audio]);
    }).catch(error=>{
     if(!controller.signal.aborted)frame.current?.contentWindow?.postMessage({type:'shuku-narration-result',revision:rid,channel,requestId,error:(error as Error).message},context.sandboxed?'*':location.origin);
    }).finally(()=>narrationRequests.delete(requestId));
   }
   if(event.data.type==='shuku-study-ready')event.source?.postMessage({type:'shuku-study-init',revision:rid,channel,account:study.account,state:initial},{targetOrigin:context.sandboxed?'*':location.origin});
   if(event.data.type==='shuku-study-position'&&event.data.channel===channel&&valid(event.data.state))study.progress(event.data.state);
  };
  window.addEventListener('message',receive);
  return()=>{window.removeEventListener('message',receive);narrationRequests.forEach(controller=>controller.abort());};
 },[study.initial,study.context,study.progress,rid,player.url]);
 async function submit(){setBusy(true);setError('');try{const result=await api<{id:string}>('/revisions/'+encodeURIComponent(rid)+'/feedback',{request_key:key,message,location:position});setOpen(false);setMessage('');setPosition('');setSubmitted(result.id);}catch(e){setError((e as Error).message);if(e instanceof ApiError&&e.status===401)setLogin(true);}finally{setBusy(false);}}
 if(!rid)return <ErrorPage status={404} error="课程链接缺少版本标识，无法打开课程。"/>;
 if(loadFailure)return <ErrorPage error={loadFailure}/>;
 if(!study.initial&&study.error)return <ErrorPage error={study.failure||study.error}/>;
 if(player.error)return <ErrorPage error={player.failure||player.error} onRetry={player.canRetry?()=>void player.retry():undefined} retrying={player.retrying}/>;
 return <div className="sd-library shuku-management shuku-learning">{!player.url&&<SiteHeader section="courses"/>}{course?<main className="shuku-learn-body"><header style={player.url?{display:'none'}:undefined}><div><strong>{course.title}</strong><label>课程版本 <select aria-label="课程版本" value={rid} onChange={e=>location.assign('/learn?revision='+e.target.value+'&resume=1')}>{versions.length?versions.map(v=><option key={v.revision_id} value={v.revision_id}>v{v.version}</option>):<option value={rid}>v{course.version}</option>}</select></label>{study.guest?<a href={'/my-courses?next='+encodeURIComponent(location.pathname+location.search)}>登录后保存学习进度</a>:<span role="status">{study.status}</span>}</div><button onClick={()=>{setOpen(true);setSubmitted(null);setError('');setLogin(false);setKey(crypto.randomUUID());}}>反馈问题</button></header>{submitted&&<p className="shuku-feedback-success" role="status"><span>已提交，课程管理者会收到反馈。</span> <a href={'/messages?feedback='+submitted}>查看反馈</a></p>}{study.error&&<p role="alert" className="shuku-study-error">{study.error}</p>}{study.initial&&player.url?<iframe className="shuku-original-lesson" style={{position:'fixed',inset:0,zIndex:40,width:'100vw',height:'100dvh',minHeight:0,border:0,background:'white'}} allowFullScreen ref={frame} title={course.title+' · 学习内容'} src={player.url}/>:null}</main>:error&&<main className="shuku-content"><p role="alert">{error}</p><a href="/">返回探索课程</a></main>}{open&&<div className="shuku-modal"><section role="dialog" aria-modal="true" aria-labelledby="feedback-title"><header><h2 id="feedback-title">反馈课程问题</h2><button aria-label="关闭" disabled={busy} onClick={()=>setOpen(false)}>×</button></header><p>{course?.title} · v{course?.version}</p><form onSubmit={e=>{e.preventDefault();void submit();}}><label>所在页面（选填）<input value={position} onChange={e=>setPosition(e.target.value)} maxLength={200} placeholder="例如：第 3 页"/></label><label>问题描述<textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={5000} rows={5} required autoFocus placeholder="哪里有问题？您希望如何改进？"/></label>{error&&<p role="alert" className="shuku-error">{error}</p>}{login?<a onClick={()=>{try{sessionStorage.setItem('shuku:feedback:'+rid,JSON.stringify({message,position}));}catch{}}} href={'/my-courses?next='+encodeURIComponent('/learn?revision='+rid)}>登录后继续反馈</a>:<button className="shuku-primary" disabled={busy||!message.trim()}>{busy?'正在提交…':'提交反馈'}</button>}</form></section></div>}</div>;
}
