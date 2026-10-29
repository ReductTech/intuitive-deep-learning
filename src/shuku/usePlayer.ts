import {useEffect,useRef,useState} from 'react';
import {api} from './client';
/** Rendering is refreshed separately from the approved source/version. */
export function usePlayer(revision:string){
 const [url,setUrl]=useState(''),[error,setError]=useState(''),[canRetry,setCanRetry]=useState(false),[retrying,setRetrying]=useState(false),[reload,setReload]=useState(0);
 const current=useRef(revision);current.current=revision;
 useEffect(()=>{const refreshed=(event:Event)=>{if((event as CustomEvent<string>).detail===revision)setReload(n=>n+1);};window.addEventListener('shuku-player-retry',refreshed);return()=>window.removeEventListener('shuku-player-retry',refreshed);},[revision]);
 useEffect(()=>{let stopped=false,timer:ReturnType<typeof setTimeout>;setUrl('');setError('');setCanRetry(false);setRetrying(false);if(!revision)return;
 async function poll(){try{
  const result=await api<{state:string;url?:string;message?:string;can_retry?:boolean}>('/revisions/'+encodeURIComponent(revision)+'/player');
  if(stopped)return;
  if(result.state==='ready'&&result.url)setUrl(result.url);
  else if(result.state==='failed'){setError(result.message||'课程页面准备失败，请稍后重试。');setCanRetry(result.can_retry===true);}
  else timer=setTimeout(()=>void poll(),1000);
 }catch(e){if(!stopped)setError((e as Error).message);}}
 void poll();return()=>{stopped=true;clearTimeout(timer);};},[revision,reload]);
 async function retry(){if(retrying||!canRetry)return;setRetrying(true);try{
  await api('/revisions/'+encodeURIComponent(revision)+'/player/retry',{});
  if(current.current===revision)window.dispatchEvent(new CustomEvent('shuku-player-retry',{detail:revision}));
 }catch(e){if(current.current===revision)setError((e as Error).message);}finally{if(current.current===revision)setRetrying(false);}}
 return {url,error,canRetry,retrying,retry};
}
