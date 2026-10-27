import {useEffect,useState} from 'react';
import {api} from './client';
/** Render the saved component in isolation, with the original workspace around it. */
export function SavedPagePreview({revision,page}:{revision:string;page:string}){
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{let active=true,timer:ReturnType<typeof setTimeout>;setUrl('');setError('');
  async function load(){try{const result=await api<{state:string;url?:string}>('/revisions/'+revision+'/player');if(!active)return;if(result.state==='ready'&&result.url)setUrl(result.url);else if(result.state==='failed')setError('预览准备失败，请重新保存修订后重试。');else timer=setTimeout(()=>void load(),1200);}catch(e){if(active)setError((e as Error).message);}}
  void load();return()=>{active=false;clearTimeout(timer);};
 },[revision]);
 return url?<iframe title="课程页面预览" src={url+'?shukuPage='+encodeURIComponent(page)} sandbox="allow-scripts" style={{width:'100%',height:'100%',border:0,display:'block'}}/>:<div className="cw-empty-slide"><p role={error?'alert':'status'}>{error||'正在准备页面预览…'}</p></div>;
}
