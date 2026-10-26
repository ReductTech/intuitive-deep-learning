import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import type {CreatorProject} from '../creator/model';
import type {StudyPosition} from './personal';
/** Adapts progress only. The original GuidePage and LessonFlow render unchanged. */
export function GuideSession({children,project,state,onChange,scope}:{children:ReactNode;project:CreatorProject;state:StudyPosition;onChange:(state:StudyPosition)=>void;scope:string}){
 const [ready,setReady]=useState(false),current=useRef(state);current.current=state;
 const change=useRef(onChange);change.current=onChange;
 useLayoutEffect(()=>{
  const oldTelemetry=window.__DL_TELEMETRY__,proto=Storage.prototype;
  const get=proto.getItem,set=proto.setItem,remove=proto.removeItem;
  const seed=()=>JSON.stringify({completedIds:current.current.completed.map(id=>project.pages.find(p=>p.id===id)?.nativeId||id),visibleCount:Math.max(1,project.pages.findIndex(p=>p.id===current.current.page_id)+1)});
  const owns=(key:string)=>key.startsWith('lesson-flow:')||key.startsWith(project.courseId+':');
  const prefix='shuku:lesson:'+scope+':'+project.id+':';
  // Scope old course keys without editing other authors' course components.
  proto.getItem=function(key){if(this===localStorage&&owns(key))return key.startsWith('lesson-flow:')?seed():get.call(this,prefix+key);return get.call(this,key);};
  proto.setItem=function(key,value){return set.call(this,this===localStorage&&owns(key)?prefix+key:key,value);};
  proto.removeItem=function(key){return remove.call(this,this===localStorage&&owns(key)?prefix+key:key);};
  window.__DL_TELEMETRY__={getModuleState:async()=>({ok:true,module_id:project.courseId,completed:false,states:{}}),emit:(name,_element,properties)=>{
   if(!['lesson_progress','lesson_reset'].includes(name))return;
   const value=properties?.state as {completedIds?:string[];visibleCount?:number}|undefined;
   if(!value||!Array.isArray(value.completedIds))return;
   const completed=value.completedIds.map(id=>project.pages.find(p=>(p.nativeId||p.id)===id)?.id).filter((id):id is string=>Boolean(id));
   const page=project.pages[Math.max(0,Math.min(project.pages.length-1,(Number(value.visibleCount)||1)-1))];
   change.current({...current.current,page_id:page.id,mode:'guide',completed});
  }};
  const navigate=(event:MouseEvent)=>{const link=(event.target as Element).closest('a');if(!link)return;const url=new URL(link.href,location.href);if(url.origin!==location.origin||!['/scenedeck','/web_ppt'].some(path=>url.pathname.startsWith(path)))return;event.preventDefault();const requested=url.searchParams.get('slide');change.current({...current.current,mode:'ppt',page_id:project.pages.find(p=>(p.nativeId||p.id)===requested)?.id||current.current.page_id});};
  document.addEventListener('click',navigate);
  setReady(true);
  return()=>{document.removeEventListener('click',navigate);proto.getItem=get;proto.setItem=set;proto.removeItem=remove;window.__DL_TELEMETRY__=oldTelemetry;};
 },[project,scope]);
 return ready?<>{children}</>:null;
}
