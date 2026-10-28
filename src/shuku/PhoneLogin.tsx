import {useEffect,useState} from 'react';
import {api} from './client';
import './PhoneLogin.css';

export function PhoneLogin({checking,unavailable,error,busy,onRetry,onClearError,onDemo,onPhone,onGuest}:{checking:boolean;unavailable:boolean;error:string;busy:boolean;onRetry:()=>void;onClearError:()=>void;onDemo:(form:HTMLFormElement)=>void;onPhone:(method:'sms'|'password',phone:string,credential:string)=>void;onGuest:()=>void}){
 const [method,setMethod]=useState<'sms'|'password'>('sms'),[phone,setPhone]=useState(''),[code,setCode]=useState(''),[password,setPassword]=useState(''),[sending,setSending]=useState(false),[remaining,setRemaining]=useState(0),[codeError,setCodeError]=useState('');
 const validPhone=/^1[3-9][0-9]{9}$/.test(phone);
 useEffect(()=>{if(!remaining)return;const timer=setInterval(()=>setRemaining(v=>Math.max(0,v-1)),1000);return()=>clearInterval(timer);},[remaining>0]);
 async function sendCode(){if(!validPhone||sending||remaining)return;setSending(true);setCodeError('');onClearError();try{const result=await api<{retry_after?:number}>('/auth/sms-code',{phone});setRemaining(Math.max(1,Math.min(300,result.retry_after||60)));}catch(e){setCodeError((e as Error).message);}finally{setSending(false);}}
 function choose(next:'sms'|'password'){setMethod(next);setCodeError('');onClearError();setCode('');setPassword('');}
 return <main className="shuku-login-page"><div className="shuku-login-layout">
  <div className="shuku-login-intro"><div className="shuku-login-brand"><span>减论科技</span></div><div className="shuku-login-message"><h2>减论科技，科技链接个体</h2><p>全球首个<strong>AI科技人才成长链接智能服务平台</strong>，</p><p className="jianlun-login-questions">想成为AI人才？<br/>想找到合适的AI人才共事？<br/>想了解AI科技的核心前沿进展？<br/>来减论社区，寻找您的最佳答案！</p></div></div>
  <section className="shuku-login-card" aria-labelledby="site-login-title"><h1 id="site-login-title">欢迎登录</h1><p className="shuku-login-subtitle">请选择一种方式登录您的减论账号</p>
  {checking?<p role="status">正在验证登录状态…</p>:unavailable?<><p role="alert">{error}</p><button onClick={onRetry}>重新验证</button></>:<>
   <div className="shuku-login-tabs" role="tablist" aria-label="登录方式"><button type="button" role="tab" id="sms-login-tab" aria-selected={method==='sms'} aria-controls="phone-login-panel" onClick={()=>choose('sms')}>验证码登录</button><button type="button" role="tab" id="password-login-tab" aria-selected={method==='password'} aria-controls="phone-login-panel" onClick={()=>choose('password')}>密码登录</button></div>
   <form id="phone-login-panel" role="tabpanel" aria-labelledby={method==='sms'?'sms-login-tab':'password-login-tab'} onSubmit={e=>{e.preventDefault();setCodeError('');onPhone(method,phone,method==='sms'?code:password);}}>
    <label>手机号<input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,'').slice(0,11));setRemaining(0);}} pattern="1[3-9][0-9]{9}" maxLength={11} placeholder="请输入手机号" required/></label>
    {method==='sms'?<label>验证码<div className="shuku-sms-field"><input name="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,8))} pattern="[0-9]{4,8}" maxLength={8} placeholder="请输入验证码" required/><button className="shuku-send-code" type="button" onClick={()=>void sendCode()} disabled={!validPhone||sending||remaining>0||busy}>{sending?'正在发送…':remaining?remaining+' 秒后重试':'发送验证码'}</button></div></label>:<label>密码<input name="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} maxLength={256} placeholder="请输入密码" required/></label>}
    {(codeError||error)&&<p role="alert">{codeError||error}</p>}<button className="shuku-login-submit" disabled={busy||sending}>{busy?'正在登录…':'登录 / 注册'}</button>
   </form>
   <button className="shuku-guest-entry" type="button" disabled={busy} onClick={onGuest}>游客体验</button>
   <details className="shuku-demo-login" onToggle={()=>{setCodeError('');onClearError();}}><summary>Demo 体验登录</summary><form onSubmit={e=>{e.preventDefault();setCodeError('');onDemo(e.currentTarget);}}><label>体验账号<select name="username" autoComplete="username"><option value="xiaoman">小满 · 课程作者</option><option value="linzhi">林知 · 学习者</option><option value="scy">scy · 课程作者</option><option value="msh">msh · 课程作者</option><option value="admin">管理员</option></select></label><label>Demo 密码<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label><button className="shuku-demo-submit" disabled={busy}>{busy?'正在登录…':'进入 Demo'}</button></form></details>
  </>}
  </section></div></main>;
}
