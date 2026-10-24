import {Fragment,useEffect,useRef,useState,type ReactNode} from 'react';
import {api,ApiError,type User} from './client';
import './LoginGate.css';

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
 async function login(form:HTMLFormElement){
  const request=++generation.current;loggingIn.current=true;setBusy(true);setError('');
  try{const result=await api<{user:User}>('/auth/login',Object.fromEntries(new FormData(form)));if(request===generation.current){setUser(result.user);setUnavailable(false);}}
  catch(e){if(request===generation.current)setError((e as Error).message||'登录未成功，请重试。');}
  finally{loggingIn.current=false;setBusy(false);}
 }
 if(!checking&&user)return <Fragment key={user.id}>{children}</Fragment>;
 return <main className="shuku-login-page"><section aria-labelledby="site-login-title"><div className="shuku-login-brand">SceneDeck<span>.</span></div><h1 id="site-login-title">登录术库</h1>{checking?<p role="status">正在验证登录状态…</p>:unavailable?<><p role="alert">{error}</p><button onClick={()=>void check(true)}>重新验证</button></>:<form onSubmit={e=>{e.preventDefault();void login(e.currentTarget);}}><label>账号<select name="username" autoComplete="username"><option value="xiaoman">小满 · 课程作者</option><option value="linzhi">林知 · 学习者</option><option value="admin">管理员</option></select></label><label>密码<input name="password" type="password" autoComplete="current-password" required autoFocus maxLength={256}/></label>{error&&<p role="alert">{error}</p>}<button disabled={busy}>{busy?'正在登录…':'登录'}</button></form>}</section></main>;
}
