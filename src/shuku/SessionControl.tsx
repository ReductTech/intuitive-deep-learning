import { useEffect, useState } from 'react';
import { api, type User } from './client';
export function SessionControl({user:providedUser}:{user?:User|null}={}){
 const [user,setUser]=useState<User|null>(null);
 useEffect(()=>{if(providedUser!==undefined)return;api<{user:User}>('/auth/me').then(r=>setUser(r.user)).catch(()=>{});},[providedUser]);
 const current=providedUser===undefined?user:providedUser;
 return current?<span className="shuku-session"><span>{current.display_name}</span><button onClick={()=>void api('/auth/logout',{}).then(()=>location.assign('/'))}>退出</button></span>:<a className="sd-library-create" href="/my-courses">登录</a>;
}
