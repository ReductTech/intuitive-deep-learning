import {useEffect,useMemo,useState,type ReactNode} from 'react';
import type {DeckDefinition} from '../../modules/shared/react/presentation';
import {moduleAssetUrl} from '../../modules/shared/react/assets';
import type {CreatorProject} from '../creator/model';
import {CourseWorkspace} from '../creator/CourseWorkspace';
import {GuideSession} from './GuideSession';
import './RuntimePlayer.css';
import {playbackModule} from './playbackModule';
import type {ActiveModule} from '../app/modules';
import type {StudyPosition} from './personal';
// Compatibility entry used by release builds. All viewer UI is the original workspace.
export function RuntimePlayer({project,deck,guide,notes,assetId='',initialState,onProgress,account='guest'}:{project:CreatorProject;deck?:DeckDefinition;guide?:ReactNode;notes?:ActiveModule['getPptNotes'];account?:string;assetId?:string;initialState?:StudyPosition;onProgress?:(state:StudyPosition)=>void}){
 const [state,setState]=useState<StudyPosition>(initialState||{page_id:project.pages[0].id,mode:'ppt',completed:[]});
 const [channel,setChannel]=useState(''),[scope,setScope]=useState(account),[initialized,setInitialized]=useState(window.parent===window||Boolean(initialState));
 const courses=useMemo(()=>[playbackModule(project,deck,assetId,notes)],[project,deck,assetId,notes]);
 const revision=location.pathname.match(/^\/api\/shuku\/revisions\/([^/]+)\/(?:player\/)?files\//)?.[1]||project.id;
 useEffect(()=>{
  if(window.parent===window)return;
  const receive=(event:MessageEvent)=>{
   if(event.source!==window.parent||event.origin!==new URL(document.referrer||location.href).origin||event.data?.type!=='shuku-study-init'||event.data.revision!==revision||typeof event.data.channel!=='string')return;
   const value=event.data.state as StudyPosition;
   if(!value||!project.pages.some(p=>p.id===value.page_id)||!['guide','ppt'].includes(value.mode)||!Array.isArray(value.completed))return;
   setState({...value,completed:value.completed.filter(id=>project.pages.some(p=>p.id===id))});setChannel(event.data.channel);setScope(typeof event.data.account==='string'?event.data.account:'guest');setInitialized(true);
  };
  const fallback=setTimeout(()=>setInitialized(true),500);
  window.addEventListener('message',receive);window.parent.postMessage({type:'shuku-study-ready',revision,player:'course-workspace'},location.origin);
  return()=>{clearTimeout(fallback);window.removeEventListener('message',receive);};
 },[revision]);
 useEffect(()=>{onProgress?.(state);if(channel)window.parent.postMessage({type:'shuku-study-position',revision,channel,state},location.origin);},[state,channel,onProgress,revision]);
 if(!initialized)return null;
 if(state.mode==='guide'&&guide)return <div className="shuku-original-guide"><GuideSession project={project} state={state} scope={scope} onChange={setState}>{guide}</GuideSession></div>;
 return <CourseWorkspace courses={courses} initialProject={project} reader={{state,onChange:setState,storageKey:scope+':'+revision,thumbnail:page=>assetId&&page.nativeId?moduleAssetUrl(assetId,`scenedeck-thumbnails/${page.nativeId}.png`):undefined}}/>;
}
