import {useEffect,useRef,useState} from 'react';
import type {CreatorProject} from '../creator/model';
import {packProject} from '../creator/projectImages';
import {api} from './client';

export interface EditorDraft {version:string;base_revision:string|null;project:CreatorProject & {designImages?:unknown};updated_at:number}
export function useEditorDraft(course:string,head:React.RefObject<string|null>){
 const current=useRef<CreatorProject|null>(null),version=useRef<string|null>(null),saved=useRef(''),inFlight=useRef<Promise<void>|null>(null),paused=useRef(false),alive=useRef(true);
 const [change,setChange]=useState(0),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const [pending,setPending]=useState(false);
 const needsSave=()=>!!current.current&&JSON.stringify(current.current)!==saved.current;
 function update(value:CreatorProject){current.current=value;setPending(needsSave());setChange(n=>n+1);}
 function initialize(value:CreatorProject,draftVersion:string|null,alreadySaved:boolean){
  version.current=draftVersion;saved.current=alreadySaved?JSON.stringify(value):'';current.current=value;setPending(needsSave());setChange(n=>n+1);
 }
 async function persist(){
  if(paused.current||inFlight.current||!needsSave()||!current.current)return;
  const value=current.current,serialized=JSON.stringify(value);
  setSaving(true);setError('');
  const request=(async()=>{try{
   const body=JSON.parse(await packProject(value));
   const result=await api<Pick<EditorDraft,'version'>>('/courses/'+course+'/draft',{project:body,expected_revision:head.current,expected_draft:version.current});
   version.current=result.version;saved.current=serialized;
  }catch(e){if(alive.current)setError((e as Error).message);}
  finally{inFlight.current=null;if(alive.current){setSaving(false);setPending(needsSave());setChange(n=>n+1);}}})();
  inFlight.current=request;await request;
 }
 useEffect(()=>{
  if(!current.current||paused.current||!needsSave()||error)return;
  const timer=setTimeout(()=>void persist(),1500);
  return()=>clearTimeout(timer);
 },[change,error]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  let leaving=false;
  const unload=(e:BeforeUnloadEvent)=>{if(!leaving&&needsSave()){e.preventDefault();e.returnValue='';}};
  const click=(e:MouseEvent)=>{
   const link=(e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null;
   if(!link||link.target==='_blank'||link.hasAttribute('download')||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||!needsSave())return;
   const target=new URL(link.href,location.href);
   if(target.origin===location.origin&&target.pathname===location.pathname&&target.search===location.search)return;
   if(!window.confirm('还有内容尚未保存。离开可能丢失最近的修改，确定离开吗？')){e.preventDefault();e.stopPropagation();}
   else{leaving=true;setTimeout(()=>{leaving=false;},1000);}
  };
  window.addEventListener('beforeunload',unload);document.addEventListener('click',click,true);
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);};
 },[]);
 async function hold(){paused.current=true;await inFlight.current;}
 function release(){paused.current=false;setPending(needsSave());setChange(n=>n+1);}
 function revisionSaved(value:CreatorProject){version.current=null;saved.current=JSON.stringify(value);setError('');setPending(needsSave());}
 function retry(){setError('');setChange(n=>n+1);}
 return {initialize,update,version,hold,release,revisionSaved,retry,pending,saving,error};
}

