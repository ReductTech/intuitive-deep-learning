import {useEffect,useState} from 'react';
import {api} from './client';
/** Rendering is refreshed separately from the approved source/version. */
export function usePlayer(revision:string){
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(!revision)return;let stopped=false,timer:ReturnType<typeof setTimeout>;setUrl('');setError('');
 async function poll(){try{const result=await api<{state:string;url?:string}>('/revisions/'+encodeURIComponent(revision)+'/player');if(stopped)return;if(result.state==='ready'&&result.url)setUrl(result.url);else if(result.state==='failed')setError('课程页面准备失败，请稍后重试。');else timer=setTimeout(()=>void poll(),1000);}catch(e){if(!stopped)setError((e as Error).message);}}
 void poll();return()=>{stopped=true;clearTimeout(timer);};},[revision]);
 return {url,error};
}
