import type { CreatorProject } from '../creator/model';
export interface User { id:string; username:string; display_name:string; role:'learner'|'creator'|'admin' }
export interface Course { id:string; title:string; description:string; module_id:string; category:string; head_revision:string|null; status:string; workspace?:{target_course_id:string;base_release_id:string} }
export interface SavedRevision { id:string; state:'building'|'ready'|'failed'; project:CreatorProject & {designImages?:unknown}; preview_url:string; contribution?:{id:string;status:string;score:number|null;note:string}|null; review:{status:string;note:string}|null }
export class ApiError extends Error { constructor(message:string,public status:number){super(message);} }
export async function api<T>(path:string, body?:unknown):Promise<T> {
  const response=await fetch('/api/shuku'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();if(!response.ok)throw new ApiError(data.error||'操作未完成，请重试。',response.status);return data as T;
}
