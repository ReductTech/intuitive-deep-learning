import {Fragment,useEffect,useRef,useState,type ReactNode} from 'react';
import {api,ApiError,type User} from './client';
import {PhoneLogin} from './PhoneLogin';

export function LoginGate({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[unavailable,setUnavailable]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const generation=useRef(0);
 const loggingIn=useRef(false);
 async function check(initial=false){
  if(loggingIn.current)return;
  const request=++generation.current;if(initial)setChecking(true);
  try{const result=await api<{user:User}>('/auth/me');if(request===generation.current){setUser(result.user);setUnavailable(false);setError('');}}
  catch(e){if(request!==generation.current)return;const expired=e instanceof ApiError&&e.status===401;if(expired)setUser(null);setUnavailable(!expired);setError(expired?'':'暂时无法验证登录状态，请重试。');}
  finally{if(request===generation.current)setChecking(false);}
 }
 useEffect(()=>{
  void check(true);
  const expired=()=>{if(loggingIn.current)return;generation.current++;setUser(null);setChecking(false);setUnavailable(false);setError('登录已失效，请重新登录。');};
  const focus=()=>{if(document.visibilityState==='visible')void check();};
  const timer=setInterval(focus,60000);
  window.addEventListener('shuku-session-required',expired);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
  return()=>{generation.current++;clearInterval(timer);window.removeEventListener('shuku-session-required',expired);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};
 },[]);
 async function login(path:string,body:unknown){
  const request=++generation.current;loggingIn.current=true;setBusy(true);setError('');
  try{const result=await api<{user:User}>(path,body);if(request===generation.current){setUser(result.user);setUnavailable(false);}}
  catch(e){if(request===generation.current)setError((e as Error).message||'登录未成功，请重试。');}
  finally{loggingIn.current=false;setBusy(false);}
 }
 if(!checking&&user)return <Fragment key={user.id}>{children}</Fragment>;
 return <PhoneLogin checking={checking} unavailable={unavailable} error={error} busy={busy} onRetry={()=>void check(true)} onClearError={()=>setError('')} onDemo={form=>void login('/auth/login',Object.fromEntries(new FormData(form)))} onPhone={(method,phone,credential)=>void login('/auth/phone-login',{method,phone,...(method==='sms'?{code:credential}:{password:credential})})}/>;
}
