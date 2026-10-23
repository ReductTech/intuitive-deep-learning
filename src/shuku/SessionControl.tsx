import { useEffect, useState } from 'react';
import { api, type User } from './client';
export function SessionControl(){
 const [user,setUser]=useState<User|null>(null);
 useEffect(()=>{api<{user:User}>('/auth/me').then(r=>setUser(r.user)).catch(()=>{});},[]);
 return user?<span className="shuku-session"><span>{user.display_name}</span><button onClick={()=>void api('/auth/logout',{}).then(()=>location.assign('/'))}>退出</button></span>:<a className="sd-library-create" href="/my-courses">登录</a>;
}
