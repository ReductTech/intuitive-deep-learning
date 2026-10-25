import {useEffect,useRef,useState} from 'react';
import {api} from './client';
interface Status {available:boolean;connected:boolean;authorized:boolean;identity:{id:number;login:string;url:string}|null}
interface Flow {flow_id:string;user_code:string;verification_url:string;interval:number;expires_in:number}
interface Poll extends Partial<Status> {complete?:boolean;pending?:boolean;interval?:number}
export function GitHubIdentityPanel({userId}:{userId:string}){
 const [status,setStatus]=useState<Status|null>(null),[flow,setFlow]=useState<Flow|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState(false);
 const epoch=useRef(0),expires=useRef(0),flowRef=useRef<Flow|null>(null);
 function updateFlow(value:Flow|null){flowRef.current=value;setFlow(value);}
 const headers={'X-Shuku-Account':userId};
 useEffect(()=>{const generation=++epoch.current;setStatus(null);updateFlow(null);setConfirm(false);setError('');setNotice('');api<Status>('/github/identity').then(value=>{if(epoch.current===generation)setStatus(value);}).catch(e=>{if(epoch.current===generation)setError(e.message);});return()=>{epoch.current++;};},[userId]);
 useEffect(()=>{
  if(!flow)return;
  let disposed=false,timer:ReturnType<typeof setTimeout>;const generation=epoch.current;
  async function poll(){
   if(disposed||epoch.current!==generation||flowRef.current?.flow_id!==flow!.flow_id)return;
   if(Date.now()>=expires.current){updateFlow(null);setError('授权码已过期，请重新获取。');return;}
   try{
    const value=await api<Poll>('/github/identity/poll',{flow_id:flow!.flow_id},{'X-Shuku-Account':userId});
    if(disposed||epoch.current!==generation||flowRef.current?.flow_id!==flow!.flow_id)return;
    if(value.complete){setStatus(value as Status);updateFlow(null);setNotice('GitHub 账号已绑定');return;}
    timer=setTimeout(()=>void poll(),Math.max(5,value.interval||flow!.interval)*1000);
   }catch(e){if(!disposed&&epoch.current===generation){setError((e as Error).message);updateFlow(null);}}
  }
  timer=setTimeout(()=>void poll(),Math.max(5,flow.interval)*1000);
  return()=>{disposed=true;clearTimeout(timer);};
 },[flow,userId]);
 async function start(){setBusy(true);setError('');setNotice('');try{const value=await api<Flow>('/github/identity/start',{},headers);expires.current=Date.now()+value.expires_in*1000;updateFlow(value);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function cancel(){if(!flow)return;setBusy(true);setError('');try{await api('/github/identity/cancel',{flow_id:flow.flow_id},headers);updateFlow(null);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function disconnect(){if(!status?.identity)return;setBusy(true);setError('');setNotice('');try{const value=await api<Status>('/github/identity/disconnect',{confirm:true,expected_id:status.identity.id},headers);setStatus(value);setConfirm(false);updateFlow(null);setNotice('已解除 GitHub 绑定');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="profile-github" aria-label="GitHub 账号绑定"><div className="github-identity-heading"><strong>GitHub 账号</strong><span>{status?.connected?(status.authorized?'已绑定':'需要重新授权'):'未绑定'}</span></div>
 {status?.identity?<a className="github-identity-account" href={status.identity.url} target="_blank" rel="noreferrer">@{status.identity.login} ↗</a>:<p>绑定 GitHub，使用自己的账号参与课程共创。</p>}
 {!status&&!error&&<p role="status">正在加载绑定状态…</p>}
 {status&&!status.available&&<p>此环境尚未配置 GitHub 个人授权。</p>}
 {status?.available&&!flow&&!confirm&&<div className="profile-actions"><button disabled={busy} onClick={()=>void start()}>{busy?'正在连接…':status.connected?'重新授权':'绑定 GitHub'}</button>{status.connected&&<button disabled={busy} onClick={()=>setConfirm(true)}>解除绑定</button>}</div>}
 {flow&&<div className="github-device-flow"><p>打开 GitHub，输入下方授权码：</p><code aria-label="GitHub 授权码">{flow.user_code}</code><a className="github-device-link" href="https://github.com/login/device" target="_blank" rel="noreferrer">前往 GitHub 授权 ↗</a><p role="status">完成授权后，此处会自动更新。</p><button disabled={busy} onClick={()=>void cancel()}>取消授权</button></div>}
 {confirm&&<div className="github-disconnect-confirm"><p>确认解除 @{status?.identity?.login} 的 GitHub 绑定？</p><div className="profile-actions"><button disabled={busy} onClick={()=>void disconnect()}>{busy?'正在解除…':'确认解除'}</button><button disabled={busy} onClick={()=>setConfirm(false)}>取消</button></div></div>}
 {notice&&<p role="status" className="profile-notice">{notice}</p>}{error&&<p role="alert" className="shuku-error">{error}</p>}</section>;
}
