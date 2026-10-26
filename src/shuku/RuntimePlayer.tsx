import { useEffect, useRef, useState } from 'react';
import {NativeLesson} from './NativeLesson';
import { useSceneScale } from '../../modules/shared/react/presentation/canvas';
import type { DeckDefinition } from '../../modules/shared/react/presentation';
import type { CreatorProject } from '../creator/model';
import { TextPage } from './TextPage';
import './RuntimePlayer.css';
import type {StudyPosition} from './personal';
export function RuntimePlayer({ project, deck, initialState, onProgress, requestedPage }: { project: CreatorProject; deck?: DeckDefinition; initialState?:StudyPosition; onProgress?:(state:StudyPosition)=>void;requestedPage?:string|null }) {
  const [index, setIndex] = useState(Math.max(0,project.pages.findIndex(p=>p.id===initialState?.page_id))), [completed, setCompleted] = useState<string[]>(initialState?.completed||[]);
  const [mode,setMode]=useState<'guide'|'ppt'>(initialState?.mode||'ppt');
  const [channel,setChannel]=useState('');
  useEffect(()=>{if(requestedPage){const next=project.pages.findIndex(p=>p.id===requestedPage);if(next>=0)setIndex(next);}},[requestedPage,project]);
  // Merged releases reuse approved artifacts; their embedded project ID may be the source revision.
  const revision=location.pathname.match(/^\/api\/shuku\/revisions\/([^/]+)\/files\//)?.[1]||project.id;
  useEffect(()=>{
    if(window.parent===window)return;
    const receive=(event:MessageEvent)=>{
      if(event.source!==window.parent||event.origin!==new URL(document.referrer||location.href).origin||event.data?.type!=='shuku-study-init'||event.data.revision!==revision||typeof event.data.channel!=='string')return;
      const value=event.data.state as StudyPosition;
      if(!value||!project.pages.some(p=>p.id===value.page_id)||!['guide','ppt'].includes(value.mode)||!Array.isArray(value.completed))return;
      setIndex(project.pages.findIndex(p=>p.id===value.page_id));setMode(value.mode);setCompleted(value.completed.filter(p=>project.pages.some(page=>page.id===p)));setChannel(event.data.channel);
    };
    window.addEventListener('message',receive);window.parent.postMessage({type:'shuku-study-ready',revision},location.origin);
    return()=>window.removeEventListener('message',receive);
  },[revision]);
  useEffect(()=>{const state={page_id:project.pages[index].id,mode,completed};onProgress?.(state);if(channel)window.parent.postMessage({type:'shuku-study-position',revision,channel,state},location.origin);},[index,completed,mode,channel,onProgress,revision]);
  const viewport = useRef<HTMLDivElement>(null), scale = useSceneScale(viewport);
  const page = project.pages[index], scene = deck?.scenes.find(s => s.id === (page.nativeId ?? page.id));
  return <main className="shuku-player"><header><strong>{project.title}</strong><span>{page.title}</span><select aria-label="学习方式" value={mode} onChange={e=>setMode(e.target.value as 'guide'|'ppt')}><option value="guide">自学互动</option><option value="ppt">教学展示</option></select></header><div className="shuku-player-viewport" ref={viewport}><div style={{width:1600*scale,height:900*scale}}><div className="shuku-player-slide course-shell ng-ppt-slide-surface" style={{transform:`scale(${scale})`}}>{scene ? <div className="shuku-native course-page-surface ppt-slide-surface"><NativeLesson scene={scene} mode={mode} completed={completed.includes(page.id)} onComplete={()=>setCompleted(v=>[...new Set([...v,page.id])])} onReset={()=>setCompleted(v=>v.filter(x=>x!==page.id))}/></div> : <TextPage key={page.id} title={project.title} page={page} completed={completed.includes(page.id)} onComplete={done=>setCompleted(v=>done?[...new Set([...v,page.id])]:v.filter(p=>p!==page.id))} />}</div></div></div><footer><button disabled={!index} onClick={()=>setIndex(index-1)}>上一页</button><span>{index+1} / {project.pages.length}</span><button aria-pressed={completed.includes(page.id)} onClick={()=>setCompleted(v=>v.includes(page.id)?v.filter(p=>p!==page.id):[...v,page.id])}>{completed.includes(page.id)?'已学完本页':'标记学完'}</button><button disabled={index===project.pages.length-1} onClick={()=>setIndex(index+1)}>下一页</button></footer></main>;
}
