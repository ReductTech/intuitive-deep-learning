import {isGuestMode,setGuestMode,requestSignIn} from './guest';
import type { CreatorProject } from '../creator/model';
export interface User { id:string; username:string; display_name:string; role:'learner'|'creator'|'admin' }
export interface Course { id:string; owner_id?:string; title:string; description:string; module_id:string; category:string; head_revision:string|null; status:string; local_agent?:boolean; revision_state?:'building'|'ready'|'failed'|null; review_status?:string|null; review_note?:string|null; has_draft?:boolean; current_version?:string|null; workspace?:{target_course_id:string;base_release_id:string} }
export interface SavedRevision { id:string; state:'building'|'ready'|'failed'; project:CreatorProject & {designImages?:unknown}; preview_url:string;build_error?:string; contribution?:{id:string;status:string;score:number|null;note:string}|null; review:{status:string;note:string}|null }
export class ApiError extends Error { constructor(message:string,public status:number){super(message);} }
let sessionGeneration=0;
export async function api<T>(path:string, body?:unknown,headers:Record<string,string>={}):Promise<T> {
  if(body!==undefined&&isGuestMode()&&!['/auth/login','/auth/guest','/auth/logout','/auth/phone-login','/auth/sms-code'].includes(path)){requestSignIn();throw new ApiError('请登录后使用此功能。',401);}
  const generation=sessionGeneration;
  const multipart=body instanceof FormData;
  const response=await fetch('/api/shuku'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:{...(body===undefined||multipart?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:multipart?body:JSON.stringify(body)})});
  const data=await response.json();if(!response.ok){if(response.status===401&&!isGuestMode()&&generation===sessionGeneration&&!['/auth/login','/auth/phone-login','/auth/me'].includes(path))window.dispatchEvent(new Event('shuku-session-required'));throw new ApiError(data.error||'操作未完成，请重试。',response.status);}if(path==='/auth/login'||path==='/auth/phone-login'||path==='/auth/logout'||path==='/auth/guest'){sessionGeneration++;setGuestMode(path==='/auth/guest');}return data as T;
}
