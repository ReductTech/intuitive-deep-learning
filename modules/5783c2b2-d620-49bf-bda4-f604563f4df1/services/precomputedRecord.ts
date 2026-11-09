import {requestCourse} from '@shuku/course-runtime/react/courseRequests';
/** A cache miss never starts a training job. */
export async function loadRecord<T>(name:string,parameters:object,signal:AbortSignal):Promise<T>{
 const body=await requestCourse<{ok:boolean;result:T;error?:string}>({action:'record',name,payload:{...parameters}},signal);
 if(!body.ok)throw new Error(body.error||'该参数组合的演示缓存尚未准备好，请选择已有缓存。');
 return body.result;
}
