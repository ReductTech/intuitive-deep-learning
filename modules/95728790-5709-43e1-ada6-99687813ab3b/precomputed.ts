import {requestCourse} from '@shuku/course-runtime/react/courseRequests';
/** Published teaching records are read by the host; failures belong to the React boundary. */
export async function loadPrecomputed<T>(name:string):Promise<T>{
 const body=await requestCourse<{ok:boolean;result:T;error?:string}>({action:'record',name,payload:{}});
 if(!body.ok)throw new Error(body.error||'演示缓存尚未准备好。');
 return body.result;
}
