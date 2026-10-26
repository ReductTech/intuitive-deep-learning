import { useEffect, useState } from 'react';
import { api, type User } from './client';
import {isGuestMode,requestSignIn} from './guest';
import {isLocalPreview} from '../app/runtimeMode';
export function SessionControl({user:providedUser}:{user?:User|null}={}){
 const [user,setUser]=useState<User|null>(null);
 useEffect(()=>{if(isLocalPreview||providedUser!==undefined||isGuestMode())return;api<{user:User}>('/auth/me').then(r=>setUser(r.user)).catch(()=>{});},[providedUser]);
 const current=providedUser===undefined?user:providedUser;
 const guest=isLocalPreview||isGuestMode();
 const name=guest?(isLocalPreview?'本地预览':'游客'):current?.display_name;
 if(!name)return null;
 const avatar=<span className="shuku-account-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="4"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></svg></span>;
 const identity=<>{avatar}<span className="shuku-account-copy"><strong>{name}</strong><small>{guest?'浏览体验':current?.role==='admin'?'管理员':current?.role==='creator'?'课程创作者':'普通用户'}</small></span></>;
 return <aside className="shuku-account-dock" aria-label="当前账号">{guest?<button className="shuku-account-identity" onClick={requestSignIn} aria-label="登录账号">{identity}</button>:<a className="shuku-account-identity shuku-profile-link" href="/profile" aria-label="个人信息" aria-current={location.pathname==='/profile'?'page':undefined}>{identity}</a>}{guest?<button className="shuku-account-exit" onClick={requestSignIn}>登录</button>:<button className="shuku-account-exit" onClick={()=>void api('/auth/logout',{}).then(()=>location.assign('/'))}>退出</button>}</aside>;

}

export function useUnreadMessageCount(accountId?:string){
 const [count,setCount]=useState(0);
 useEffect(()=>{setCount(0);if(!accountId)return;let active=true;const refresh=()=>void api<{unread_count:number}>('/messages').then(r=>{if(active)setCount(r.unread_count);}).catch(()=>{});refresh();const timer=setInterval(refresh,30000);window.addEventListener('shuku-messages-updated',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('shuku-messages-updated',refresh);};},[accountId]);
 return count;
}

export function MessageIndicator({count=0}:{count?:number}={}){
 return <a className="shuku-message-link" href="/messages" aria-label={'我的消息'+(count?'，'+count+' 条未读':'')} aria-current={location.pathname==='/messages'?'page':undefined}><svg className="shuku-message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 20h4"/></svg><span className="shuku-message-label">我的消息</span>{count>0&&<small>{count>99?'99+':count}</small>}</a>;
}
