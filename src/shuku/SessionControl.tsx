import { useEffect, useState } from 'react';
import { api, type User } from './client';
import {isGuestMode,requestSignIn} from './guest';
import {isLocalPreview} from '../app/runtimeMode';
export function SessionControl({user:providedUser}:{user?:User|null}={}){
 const [user,setUser]=useState<User|null>(null);
 useEffect(()=>{if(isLocalPreview||providedUser!==undefined||isGuestMode())return;api<{user:User}>('/auth/me').then(r=>setUser(r.user)).catch(()=>{});},[providedUser]);
 const current=providedUser===undefined?user:providedUser;
 if(isLocalPreview||isGuestMode())return <span className="shuku-guest-session"><span>{isLocalPreview?'本地预览':'游客'}</span><button onClick={requestSignIn}>登录</button></span>;
 return current?<span className="shuku-session"><MessageIndicator key={current.id}/><a className="shuku-profile-link" href="/profile" aria-label="个人信息" aria-current={location.pathname==='/profile'?'page':undefined}>{current.display_name}</a><button onClick={()=>void api('/auth/logout',{}).then(()=>location.assign('/'))}>退出</button></span>:<a className="sd-library-create" href="/my-courses">登录</a>;
}

export function MessageIndicator(){
 const [count,setCount]=useState(0);
 useEffect(()=>{let active=true;const refresh=()=>void api<{unread_count:number}>('/messages').then(r=>{if(active)setCount(r.unread_count);}).catch(()=>{});refresh();const timer=setInterval(refresh,30000);window.addEventListener('shuku-messages-updated',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('shuku-messages-updated',refresh);};},[]);
 return <a className="shuku-message-link" href="/messages" aria-label={'我的消息'+(count?'，'+count+' 条未读':'')} aria-current={location.pathname==='/messages'?'page':undefined}><svg className="shuku-message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 20h4"/></svg><span className="shuku-message-label">我的消息</span>{count>0&&<small>{count>99?'99+':count}</small>}</a>;
}
