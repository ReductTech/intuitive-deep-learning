import {createContext} from 'react';

export interface NarrationOptions {rate?:number;voiceId?:string}
export type NarrationRequest=(text:string,signal:AbortSignal,options?:NarrationOptions)=>Promise<Blob>;
export const NarrationContext=createContext<NarrationRequest|null>(null);
export const fetchNarration:NarrationRequest=async(text,signal,options={})=>{
 const response=await fetch('/api/shuku/narration/segment',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,...options}),signal});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'配音服务不可用，请重试或选择浏览器朗读。');}
 if(!(response.headers.get('content-type')||'').startsWith('audio/'))throw new Error('配音接口未返回音频。');
 return response.blob();
};

/** Sandboxed releases ask their trusted learning host to perform same-origin I/O. */
export function parentNarration(revision:string,channel:string):NarrationRequest {
 return (text,signal,options={})=>new Promise((resolve,reject)=>{
  if(!channel){reject(new Error('请从课程学习入口打开配音，或选择浏览器朗读。'));return;}
  const requestId=crypto.randomUUID(),origin=new URL(document.referrer||location.href).origin;
  const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);signal.removeEventListener('abort',cancel);};
  const cancel=()=>{window.parent.postMessage({type:'shuku-narration-cancel',revision,channel,requestId},origin);cleanup();reject(new DOMException('已停止','AbortError'));};
  const receive=(event:MessageEvent)=>{
   const data=event.data;
   if(event.source!==window.parent||event.origin!==origin||data?.type!=='shuku-narration-result'||data.revision!==revision||data.channel!==channel||data.requestId!==requestId)return;
   cleanup();if(data.audio instanceof ArrayBuffer)resolve(new Blob([data.audio],{type:'audio/mpeg'}));else reject(new Error(typeof data.error==='string'?data.error:'配音请求失败。'));
  };
  const timer=setTimeout(()=>{cleanup();reject(new Error('配音准备超时，请重试。'));},100000);
  if(signal.aborted){cancel();return;}
  window.addEventListener('message',receive);signal.addEventListener('abort',cancel,{once:true});
  window.parent.postMessage({type:'shuku-narration-request',revision,channel,requestId,text,options},origin);
 });
}
