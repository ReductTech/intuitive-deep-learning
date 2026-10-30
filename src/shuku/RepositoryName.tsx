import {useEffect,useRef,useState} from 'react';
import {api} from './client';
interface NameInfo {name:string;suggested_name:string;owner:string;can_rename:boolean}
export const repositoryNameError=(code?:string|null)=>code==='REPOSITORY_NAME_TAKEN'?'该名称已被占用，请换一个名称并重新检查。':code==='REPOSITORY_NAME_CHANGED'?'仓库名称已变化，请刷新后再试。':'操作未完成，请检查名称后重试。';
export function RepositoryNameField({courseId,disabled=false,onReady,renaming=false,resetCheck=0}:{courseId:string;disabled?:boolean;onReady:(ready:boolean)=>void;renaming?:boolean;resetCheck?:number}){
 const [active,setActive]=useState(false),[info,setInfo]=useState<NameInfo|null>(null),[name,setName]=useState(''),[checked,setChecked]=useState(''),[checking,setChecking]=useState(false),[message,setMessage]=useState('');
 const sequence=useRef(0);
 useEffect(()=>{let alive=true;onReady(false);void(async()=>{try{
  const status=await api<{name_editable?:boolean}>('/courses/'+courseId+'/github');
  if(!alive)return;if(!status.name_editable){onReady(!renaming);return;}
  setActive(true);const value=await api<NameInfo>('/courses/'+courseId+'/github/name');
  if(alive){setInfo(value);setName(value.suggested_name||'');}
 }catch(e){if(alive)setMessage((e as Error).message);}})();return()=>{alive=false;sequence.current++;};},[courseId,onReady,renaming]);
 useEffect(()=>{if(active)onReady(!!checked&&checked===name.trim().toLowerCase());},[active,checked,name,onReady]);
 useEffect(()=>{setChecked('');},[resetCheck]);
 async function check(){const number=++sequence.current,value=name.trim().toLowerCase();setChecking(true);setChecked('');setMessage('');try{
  const result=await api<{available:boolean;name:string;message:string}>('/courses/'+courseId+'/github/name/check',{name:value});
  if(sequence.current!==number)return;setName(result.name);setChecked(result.available?result.name:'');setMessage(result.message);
 }catch(e){if(sequence.current===number)setMessage((e as Error).message);}finally{if(sequence.current===number)setChecking(false);}}
 if(!active)return message?<p role="alert" className="shuku-error">{message}</p>:null;
 return <div className="shuku-repository-name"><label>英文仓库名<div className="shuku-repository-name-input"><input name="repository_name" aria-label="英文仓库名" value={name} maxLength={80} pattern="[a-z][a-z0-9]*(-[a-z0-9]+)*" required disabled={disabled||!info} placeholder="例如 deep-learning-basics" onChange={e=>{sequence.current++;setChecking(false);setName(e.target.value.toLowerCase());setChecked('');setMessage('');onReady(false);}}/><button type="button" disabled={disabled||checking||!info||!name.trim()} onClick={()=>void check()}>{checking?'检查中…':'检查名称'}</button></div></label>{info&&<small>{info.owner}/{name||'课程英文名'}</small>}{renaming&&info&&<input type="hidden" name="expected_name" value={info.name}/>}<p role="status" aria-live="polite" className={message&&!checked?'shuku-error':''}>{message||'发布或改名前，请先检查名称是否可用。'}</p></div>;
}
export function RepositoryRenameButton({courseId,onChange}:{courseId:string;onChange:()=>void}){
 const changed=useRef(onChange);changed.current=onChange;
 const [open,setOpen]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[job,setJob]=useState<string|null>(null),[error,setError]=useState(''),[reset,setReset]=useState(0);
 useEffect(()=>{if(!job)return;let alive=true;const timer=setInterval(()=>void api<{jobs:{id:string;status:string;error_code?:string}[]}>('/courses/'+courseId+'/github').then(result=>{if(!alive)return;const current=result.jobs.find(item=>item.id===job);if(current?.status==='succeeded'){setJob(null);setOpen(false);changed.current();}else if(current?.status==='failed'){setJob(null);setError(repositoryNameError(current.error_code));setReady(false);setReset(n=>n+1);changed.current();}}).catch(e=>{if(alive)setError((e as Error).message);}),2000);return()=>{alive=false;clearInterval(timer);};},[job,courseId]);
 async function submit(form:HTMLFormElement){setBusy(true);setError('');const data=new FormData(form);try{
  const result=await api<{job_id?:string;unchanged?:boolean}>('/courses/'+courseId+'/github/name',{name:data.get('repository_name'),expected_name:data.get('expected_name')});
  if(result.job_id)setJob(result.job_id);else{setOpen(false);onChange();}
 }catch(e){setError((e as Error).message);setReady(false);setReset(n=>n+1);}finally{setBusy(false);}}
 return <><button type="button" onClick={()=>{setOpen(true);setError('');setReady(false);}}>修改仓库名称</button>{open&&<div className="shuku-modal"><section role="dialog" aria-modal="true" aria-labelledby="repository-rename-title"><header><h2 id="repository-rename-title">修改仓库名称</h2><button aria-label="关闭改名窗口" disabled={busy||!!job} onClick={()=>setOpen(false)}>×</button></header><form onSubmit={e=>{e.preventDefault();void submit(e.currentTarget);}}><RepositoryNameField courseId={courseId} renaming onReady={setReady} disabled={busy||!!job} resetCheck={reset}/>{error&&<p role="alert" className="shuku-error">{error}</p>}<button className="shuku-primary" disabled={!ready||busy||!!job}>{job?'正在修改…':'确认改名'}</button></form></section></div>}</>;
}
