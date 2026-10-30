import {useEffect,useRef,useState} from 'react';
import {api,ApiError} from './client';
interface Status {available:boolean;connected:boolean;authorized:boolean;identity:{id:number;login:string;url:string}|null}
interface Flow {flow_id:string;user_code:string;verification_url:string;interval:number;expires_in:number}
interface Poll extends Partial<Status> {complete?:boolean;pending?:boolean;interval?:number}
export function GitHubIdentityPanel({userId}:{userId:string}){
 const [status,setStatus]=useState<Status|null>(null),[flow,setFlow]=useState<Flow|null>(null),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState(false),[open,setOpen]=useState(false),[waiting,setWaiting]=useState(''),[copied,setCopied]=useState(false);
 const epoch=useRef(0),expires=useRef(0),flowRef=useRef<Flow|null>(null),inFlight=useRef(false),dialog=useRef<HTMLDialogElement>(null),checkRef=useRef<(manual:boolean)=>Promise<void>>(async()=>{});
 function updateFlow(value:Flow|null){if(value?.flow_id!==flowRef.current?.flow_id)setCopied(false);flowRef.current=value;setFlow(value);}
 const headers={'X-Shuku-Account':userId};
 useEffect(()=>{const generation=++epoch.current;setStatus(null);updateFlow(null);setOpen(false);setConfirm(false);setError('');setNotice('');api<Status>('/github/identity').then(value=>{if(epoch.current===generation)setStatus(value);}).catch(e=>{if(epoch.current===generation)setError(e.message);});return()=>{epoch.current++;};},[userId]);
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();else if(!open&&dialog.current?.open)dialog.current.close();},[open]);
 checkRef.current=async(manual:boolean)=>{
  const current=flowRef.current;if(!current||inFlight.current)return;
  if(Date.now()>=expires.current){updateFlow(null);setError('授权码已过期，请重新获取。');return;}
  const generation=epoch.current;inFlight.current=true;if(manual){setChecking(true);setWaiting('正在检查连接…');}
  try{
   const value=await api<Poll>('/github/identity/poll',{flow_id:current.flow_id},{'X-Shuku-Account':userId});
   if(epoch.current!==generation||flowRef.current?.flow_id!==current.flow_id)return;
   setError('');
   if(value.complete){setStatus(value as Status);updateFlow(null);setOpen(false);setNotice('GitHub 账号已绑定');return;}
   if(value.interval&&value.interval!==current.interval)updateFlow({...current,interval:value.interval});
   setWaiting(manual?'尚未完成授权，请先在 GitHub 确认。':'等待 GitHub 授权…');
  }catch(e){
   if(epoch.current!==generation||flowRef.current?.flow_id!==current.flow_id)return;
   if(e instanceof ApiError&&[400,401,409].includes(e.status)){updateFlow(null);setError(e.message);}
   else{setError((e as Error).message);updateFlow({...current,interval:Math.max(current.interval,e instanceof ApiError&&e.status===429?60:10)});setWaiting('授权码已保留，将自动重试，也可手动检查。');}
  }finally{inFlight.current=false;if(epoch.current===generation)setChecking(false);}
 };
 useEffect(()=>{if(!flow||!open)return;const timer=setInterval(()=>void checkRef.current(false),Math.max(5,flow.interval)*1000);return()=>clearInterval(timer);},[flow,open,userId]);
 async function start(){const generation=epoch.current;setOpen(true);setBusy(true);setError('');setNotice('');setWaiting('正在获取授权码…');try{const value=await api<Flow>('/github/identity/start',{},headers);if(epoch.current!==generation)return;expires.current=Date.now()+value.expires_in*1000;updateFlow(value);setWaiting('等待 GitHub 授权…');}catch(e){if(epoch.current===generation){setError((e as Error).message);setWaiting('');}}finally{if(epoch.current===generation)setBusy(false);}}
 async function cancel(){if(busy)return;if(!flow){setOpen(false);setError('');return;}setBusy(true);setError('');try{await api('/github/identity/cancel',{flow_id:flow.flow_id},headers);updateFlow(null);setOpen(false);}catch(e){if(e instanceof ApiError&&e.status===409){updateFlow(null);setOpen(false);void api<Status>('/github/identity').then(setStatus);}else setError((e as Error).message);}finally{setBusy(false);}}
 async function disconnect(){if(!status?.identity)return;setBusy(true);setError('');setNotice('');try{const value=await api<Status>('/github/identity/disconnect',{confirm:true,expected_id:status.identity.id},headers);setStatus(value);setConfirm(false);updateFlow(null);setNotice('已解除 GitHub 绑定');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function copyCode(){if(!flow)return;try{await navigator.clipboard.writeText(flow.user_code);setCopied(true);setWaiting('授权码已复制');}catch{setWaiting('请选中授权码复制。');}}
 return <section className="profile-github" aria-label="GitHub 账号绑定"><div className="github-identity-heading"><strong>GitHub 账号</strong><span>{status?.connected?(status.authorized?'当前授权可用':'需要重新授权'):'未连接'}</span></div>
 {status?.identity?<p className="github-identity-description"><a className="github-identity-account" href={status.identity.url} target="_blank" rel="noreferrer">@{status.identity.login} ↗</a><span>GitHub ID {status.identity.id}</span></p>:<p>尚未连接 GitHub 账号</p>}
 {!status&&!error&&<p role="status">正在加载绑定状态…</p>}{status&&!status.available&&<p>此环境尚未配置 GitHub 个人授权。</p>}
 {status?.available&&!confirm&&<div className="profile-actions"><button disabled={busy} onClick={()=>void start()}>{status.connected?'重新授权':'绑定 GitHub'}</button>{status.connected&&<button disabled={busy} onClick={()=>setConfirm(true)}>解除绑定</button>}</div>}
 <dialog ref={dialog} className="github-auth-dialog" aria-labelledby="github-auth-title" onCancel={event=>{event.preventDefault();void cancel();}}><header><h2 id="github-auth-title">连接你的 GitHub 账号</h2><button aria-label="关闭 GitHub 授权" disabled={busy} onClick={()=>void cancel()}>×</button></header>
 {flow?<><p className="github-auth-intro">复制授权码，前往 GitHub 完成连接。</p>
 <section className="github-auth-step" aria-label="复制授权码"><h3><span aria-hidden="true">1</span>复制授权码</h3><div className="github-device-code"><code aria-label="GitHub 授权码">{flow.user_code}</code><button onClick={()=>void copyCode()}>{copied?'已复制':'复制授权码'}</button></div></section>
 <section className="github-auth-step" aria-label="前往 GitHub 授权"><h3><span aria-hidden="true">2</span>在 GitHub 粘贴授权码并确认</h3><a className="github-device-link" href="https://github.com/login/device" target="_blank" rel="noreferrer">打开 GitHub 授权页面 <span>↗</span></a><p className="github-auth-hint">将在新标签页打开，完成后返回此处。</p></section>
 <button className="github-check-connection" disabled={busy||checking} onClick={()=>void checkRef.current(true)}>{checking?'正在检查…':'我已授权，检查连接'}</button><footer className="github-auth-footer"><p role="status">{waiting}</p><button disabled={busy} onClick={()=>void cancel()}>取消授权</button></footer></>:<><p role="status">{waiting||'获取授权码后，在 GitHub 完成确认。'}</p><div className="github-auth-actions"><button className="shuku-primary" disabled={busy} onClick={()=>void start()}>{busy?'正在连接…':'重新获取授权码'}</button><button disabled={busy} onClick={()=>void cancel()}>取消</button></div></>}

 {error&&<p role="alert" className="shuku-error">{error}</p>}</dialog>
 {confirm&&<div className="github-disconnect-confirm"><p>确认解除 @{status?.identity?.login} 的 GitHub 绑定？</p><div className="profile-actions"><button disabled={busy} onClick={()=>void disconnect()}>{busy?'正在解除…':'确认解除'}</button><button disabled={busy} onClick={()=>setConfirm(false)}>取消</button></div></div>}
 {notice&&<p role="status" className="profile-notice">{notice}</p>}{error&&!open&&<p role="alert" className="shuku-error">{error}</p>}</section>;
}
