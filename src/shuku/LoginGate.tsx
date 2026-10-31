import {ErrorPage} from '../app/ErrorPage';
import {Fragment,useEffect,useRef,useState,type ReactNode} from 'react';
import {api,ApiError,type User} from './client';
import {PhoneLogin} from './PhoneLogin';
import './SessionGate.css';
import {isGuestMode,setGuestMode} from './guest';
import {GuestFeaturePage} from './GuestFeaturePage';
import {useAppPath} from '../app/Router';

export function LoginGate({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[unavailable,setUnavailable]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [checkFailure,setCheckFailure]=useState<unknown>(null);
 const [guest,setGuest]=useState(isGuestMode);const path=useAppPath();
 const generation=useRef(0);
 const loggingIn=useRef(false);
 async function check(initial=false){
  if(loggingIn.current)return;
  if(isGuestMode()){setGuest(true);setChecking(false);setUnavailable(false);return;}
  const request=++generation.current;if(initial)setChecking(true);
  try{const result=await api<{user:User}>('/auth/me');if(request===generation.current){setGuestMode(false);setGuest(false);setUser(result.user);setUnavailable(false);setError('');}}
  catch(e){if(request!==generation.current)return;const expired=e instanceof ApiError&&e.status===401;if(expired)setUser(null);setUnavailable(!expired);setCheckFailure(e);setError(expired?'':'暂时无法验证登录状态，请重试。');}
  finally{if(request===generation.current)setChecking(false);}
 }
 useEffect(()=>{
  void check(true);
  const expired=()=>{if(loggingIn.current)return;generation.current++;setUser(null);setChecking(false);setUnavailable(false);setError('登录已失效，请重新登录。');};
  const requested=()=>{generation.current++;setGuestMode(false);setGuest(false);setUser(null);setChecking(false);setUnavailable(false);setError('');};
  window.addEventListener('shuku-login-requested',requested);
  const focus=()=>{if(document.visibilityState==='visible')void check();};
  const timer=setInterval(focus,60000);
  window.addEventListener('shuku-session-required',expired);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
  return()=>{generation.current++;clearInterval(timer);window.removeEventListener('shuku-login-requested',requested);window.removeEventListener('shuku-session-required',expired);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};
 },[]);
 async function login(path:string,body:unknown){
  const request=++generation.current;loggingIn.current=true;setBusy(true);setError('');
  try{const result=await api<{user:User}>(path,body);if(request===generation.current){setGuestMode(false);setGuest(false);setUser(result.user);setUnavailable(false);}}
  catch(e){if(request===generation.current)setError((e as Error).message||'登录未成功，请重试。');}
  finally{loggingIn.current=false;setBusy(false);}
 }
 async function enterGuest(){setBusy(true);setError('');try{await api('/auth/guest',{});generation.current++;setGuestMode(true);setUser(null);setGuest(true);setChecking(false);setUnavailable(false);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(guest){const protectedPage=path.startsWith('/my-courses')||['/course-creation','/profile','/messages','/data'].includes(path)||path.startsWith('/edit-deck')||['/scenedeck','/web_ppt','/web_ppt/slide.html'].includes(path)&&new URLSearchParams(location.search).get('scenedeckCapture')!=='1';return <Fragment key="guest">{protectedPage?<GuestFeaturePage key={path+location.search} path={path}/>:children}</Fragment>;}
 if(user)return <Fragment key={user.id}>{children}</Fragment>;
 if(unavailable&&!checking)return <ErrorPage error={checkFailure} onRetry={()=>void check(true)}/>;
 if(checking)return <main className="shuku-session-gate" aria-busy="true"><section aria-label="登录状态"><p role="status">正在恢复登录状态…</p></section></main>;
 return <PhoneLogin checking={checking} unavailable={unavailable} error={error} busy={busy} onGuest={()=>void enterGuest()} onRetry={()=>void check(true)} onClearError={()=>setError('')} onDemo={form=>void login('/auth/login',Object.fromEntries(new FormData(form)))} onPhone={(method,phone,credential)=>void login('/auth/phone-login',{method,phone,...(method==='sms'?{code:credential}:{password:credential})})}/>;
}
