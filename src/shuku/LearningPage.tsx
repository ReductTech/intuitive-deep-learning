import {useEffect,useRef,useState} from 'react';
import {api,ApiError} from './client';
import {SiteHeader} from './SiteHeader';
import './shuku.css';
import {useStudy,type StudyPosition} from './personal';
import {TeachingLayout} from './TeachingLayout';
interface Learning {course_id:string;title:string;version:string;revision_id:string}
export function LearningPage(){
 const rid=new URLSearchParams(location.search).get('revision')||'';
 const frame=useRef<HTMLIFrameElement>(null),navigate=useRef<((id:string)=>void)|null>(null);
 const [playback,setPlayback]=useState<StudyPosition|null>(null),[navigationReady,setNavigationReady]=useState(false);
 const [course,setCourse]=useState<Learning|null>(null),[error,setError]=useState(''),[open,setOpen]=useState(false),[message,setMessage]=useState(''),[position,setPosition]=useState(''),[key,setKey]=useState(''),[busy,setBusy]=useState(false),[submitted,setSubmitted]=useState<string|null>(null),[login,setLogin]=useState(false);
 useEffect(()=>{try{const saved=sessionStorage.getItem('shuku:feedback:'+rid);if(saved){const draft=JSON.parse(saved);if(typeof draft.message==='string'&&draft.message.length<=5000&&typeof draft.position==='string'&&draft.position.length<=200){setMessage(draft.message);setPosition(draft.position);setKey(crypto.randomUUID());setOpen(true);}sessionStorage.removeItem('shuku:feedback:'+rid);}}catch{}api<Learning>('/public/revisions/'+encodeURIComponent(rid)).then(setCourse).catch(e=>setError(e.message));},[rid]);
 const params=new URLSearchParams(location.search);
 const study=useStudy(course?'course:'+course.course_id:'',rid,params.get('resume')==='1',params.get('mode')==='ppt'?'ppt':'guide');
 const [versions,setVersions]=useState<{revision_id:string;version:string}[]>([]);
 useEffect(()=>{if(course)void api<{releases:typeof versions}>('/public/courses/'+course.course_id+'/releases').then(r=>setVersions(r.releases)).catch(e=>setError(e.message));},[course]);
 useEffect(()=>{
  if(!study.initial||!study.context)return;
  const channel=crypto.randomUUID(),initial=study.initial,context=study.context;
  setPlayback(initial);setNavigationReady(false);let current=initial;
  let bridge=false,disposed=false,observer:MutationObserver|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  const valid=(state:StudyPosition)=>state&&context.pages.includes(state.page_id)&&['guide','ppt'].includes(state.mode)&&Array.isArray(state.completed)&&state.completed.every(p=>context.pages.includes(p));
  const receive=(event:MessageEvent)=>{
   if(event.origin!==(context.sandboxed?'null':location.origin)||event.source!==frame.current?.contentWindow||event.data?.revision!==rid)return;
   if(event.data.type==='shuku-study-ready'){bridge=true;setNavigationReady(true);navigate.current=(id)=>{if(!context.pages.includes(id))return;current={...current,page_id:id};setPlayback(current);frame.current?.contentWindow?.postMessage({type:'shuku-study-init',revision:rid,channel,state:current},context.sandboxed?'*':location.origin);};event.source?.postMessage({type:'shuku-study-init',revision:rid,channel,state:initial},{targetOrigin:context.sandboxed?'*':location.origin});}
   if(event.data.type==='shuku-study-position'&&event.data.channel===channel&&valid(event.data.state)){current=event.data.state;setPlayback(current);study.progress(current);}
  };
  window.addEventListener('message',receive);
  // Older immutable players have no message bridge. Adapt their existing page controls;
  // never rebuild or replace a released artifact just to restore a page position.
  const loaded=()=>{timer=setTimeout(async()=>{
   if(bridge||disposed)return;
   const doc=frame.current?.contentDocument,footer=doc?.querySelector('.shuku-player > footer');
   if(!footer){setError('此版本暂不支持保存页码。');return;}
   const count=footer.querySelector('span'),buttons=footer.querySelectorAll('button');
   const target=context.pages.indexOf(initial.page_id);
   for(let i=0;i<target&&!disposed;i++){(buttons[buttons.length-1] as HTMLButtonElement)?.click();await new Promise<void>(r=>requestAnimationFrame(()=>r()));}
   if(disposed)return;
   let completed=[...initial.completed];
   const read=()=>{const index=Number(count?.textContent?.split('/')[0].trim())-1;const page_id=context.pages[index];if(page_id){current={page_id,mode:'ppt',completed};setPlayback(current);study.progress(current);}};
   const mark=doc!.createElement('button');mark.textContent='标记学完';mark.onclick=()=>{const index=Number(count?.textContent?.split('/')[0].trim())-1;if(context.pages[index])completed=[...new Set([...completed,context.pages[index]])];read();mark.textContent='已学完本页';};footer.append(mark);
   observer=new MutationObserver(()=>{mark.textContent=completed.includes(context.pages[Number(count?.textContent?.split('/')[0].trim())-1])?'已学完本页':'标记学完';read();});observer.observe(count!,{childList:true,subtree:true,characterData:true});read();setNavigationReady(true);navigate.current=id=>{const target=context.pages.indexOf(id);if(target<0)return;void(async()=>{let at=Number(count?.textContent?.split('/')[0].trim())-1;while(at!==target&&!disposed){const before=at;(buttons[at<target?buttons.length-1:0] as HTMLButtonElement)?.click();await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));at=Number(count?.textContent?.split('/')[0].trim())-1;if(at===before)break;}read();})();};
  },800);};
  const element=frame.current;element?.addEventListener('load',loaded);
  return()=>{disposed=true;navigate.current=null;clearTimeout(timer);observer?.disconnect();element?.removeEventListener('load',loaded);window.removeEventListener('message',receive);};
 },[study.initial,study.context,study.progress,rid]);
 async function submit(){setBusy(true);setError('');try{const result=await api<{id:string}>('/revisions/'+encodeURIComponent(rid)+'/feedback',{request_key:key,message,location:position});setOpen(false);setMessage('');setPosition('');setSubmitted(result.id);}catch(e){setError((e as Error).message);if(e instanceof ApiError&&e.status===401)setLogin(true);}finally{setBusy(false);}}
 return <div className="sd-library shuku-management shuku-learning"><SiteHeader section="courses"/>{course?<main className="shuku-learn-body"><header><div><strong>{course.title}</strong><label>课程版本 <select aria-label="课程版本" value={rid} onChange={e=>location.assign('/learn?revision='+e.target.value+'&resume=1')}>{versions.length?versions.map(v=><option key={v.revision_id} value={v.revision_id}>v{v.version}</option>):<option value={rid}>v{course.version}</option>}</select></label>{study.guest?<a href={'/my-courses?next='+encodeURIComponent(location.pathname+location.search)}>登录后保存学习进度</a>:<span role="status">{study.status}</span>}</div><button onClick={()=>{setOpen(true);setSubmitted(null);setError('');setLogin(false);setKey(crypto.randomUUID());}}>反馈问题</button></header>{submitted&&<p className="shuku-feedback-success" role="status"><span>已提交，课程管理者会收到反馈。</span> <a href={'/messages?feedback='+submitted}>查看反馈</a></p>}{study.error&&<p role="alert">{study.error}</p>}{study.initial&&<TeachingLayout pages={study.context?.page_details||study.context?.pages.map((id,i)=>({id,title:'第 '+(i+1)+' 页'}))||[]} active={(playback||study.initial).page_id} mode={(playback||study.initial).mode} disabled={!navigationReady} onSelect={id=>navigate.current?.(id)}><iframe ref={frame} title={course.title+' · 学习内容'} src={'/api/shuku/revisions/'+encodeURIComponent(rid)+'/files/index.html'}/></TeachingLayout>}</main>:<main className="shuku-content"><p role={error?'alert':'status'}>{error||'正在打开课程…'}</p><a href="/">返回探索课程</a></main>}{open&&<div className="shuku-modal"><section role="dialog" aria-modal="true" aria-labelledby="feedback-title"><header><h2 id="feedback-title">反馈课程问题</h2><button aria-label="关闭" disabled={busy} onClick={()=>setOpen(false)}>×</button></header><p>{course?.title} · v{course?.version}</p><form onSubmit={e=>{e.preventDefault();void submit();}}><label>所在页面（选填）<input value={position} onChange={e=>setPosition(e.target.value)} maxLength={200} placeholder="例如：第 3 页"/></label><label>问题描述<textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={5000} rows={5} required autoFocus placeholder="哪里有问题？您希望如何改进？"/></label>{error&&<p role="alert" className="shuku-error">{error}</p>}{login?<a onClick={()=>{try{sessionStorage.setItem('shuku:feedback:'+rid,JSON.stringify({message,position}));}catch{}}} href={'/my-courses?next='+encodeURIComponent('/learn?revision='+rid)}>登录后继续反馈</a>:<button className="shuku-primary" disabled={busy||!message.trim()}>{busy?'正在提交…':'提交反馈'}</button>}</form></section></div>}</div>;
}
