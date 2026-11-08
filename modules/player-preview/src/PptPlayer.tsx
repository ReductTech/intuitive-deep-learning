import {useEffect,useRef,useState} from 'react';
import {BookOpen,Pencil,Play,ArrowLeft,ArrowRight,X} from 'lucide-react';
import type {PlayerProps} from './contracts';
import './styles/narration.css';
import './styles/layout.css';
import './styles/header.css';
import './styles/fullscreen.css';
import './styles/PptPlayer.css';

// Viewer markup and styles are migrated from the legacy CourseWorkspace,
// not the older SceneDeck editor. Course execution remains inside its sandbox.
export function PptPlayer({title,pages,activeId,notes,renderThumbnail,slide,narration,subtitle,error,download,actions,canEdit,onHome,onEdit,onSelect}:PlayerProps){
 const viewport=useRef<HTMLDivElement>(null),notesBody=useRef<HTMLDivElement>(null);
 const [scale,setScale]=useState(1),[presenting,setPresenting]=useState(false),[outlineVisible,setOutlineVisible]=useState(false);
 const index=Math.max(0,pages.findIndex(page=>page.id===activeId)),page=pages[index];
 const snippet=page&&typeof page.snippet==='string'?page.snippet.trim():'';
 const step=(delta:number)=>{const target=pages[Math.max(0,Math.min(pages.length-1,index+delta))];if(target)onSelect(target.id);};
 useEffect(()=>{
  const element=viewport.current;if(!element)return;
  const fit=()=>setScale(Math.min(element.clientWidth/1600,element.clientHeight/900));
  const observer=new ResizeObserver(fit);observer.observe(element);fit();
  const fullscreen=()=>{setPresenting(document.fullscreenElement===element);requestAnimationFrame(fit);};
  document.addEventListener('fullscreenchange',fullscreen);
  return()=>{observer.disconnect();document.removeEventListener('fullscreenchange',fullscreen);};
 },[]);
 useEffect(()=>{notesBody.current?.scrollTo({top:0});},[activeId]);
 useEffect(()=>{
  const keyboard=(event:KeyboardEvent)=>{
   if(event.defaultPrevented||(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable=true]')))return;
   if(['ArrowRight','PageDown'].includes(event.key)){event.preventDefault();step(1);}
   if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();step(-1);}
  };
  window.addEventListener('keydown',keyboard);return()=>window.removeEventListener('keydown',keyboard);
 },[index,pages,onSelect]);
 async function present(){await viewport.current?.requestFullscreen();}
 return <div className={'cw-app cw-streamlined cw-viewing cw-reader shuku-ppt-reader'+(presenting?' cw-presenting':'')}>
  <header className="cw-topbar"><div className="cw-header-identity"><a href="/" className="cw-brand cw-shuku-brand" aria-label="术库首页" onClick={event=>{event.preventDefault();onHome();}}><span><BookOpen/></span><div><strong>术库</strong></div></a><div className="cw-course-context"><strong className="cw-managed-title" title={title}>{title}</strong></div></div><div className="cw-actions">
   <button className="cw-edit-toggle" disabled={!canEdit} onClick={onEdit}><Pencil/>编辑</button>
   <span className="cw-action-divider" aria-hidden="true"/>{narration}
   {download&&<a className="ppt-download" href={download} download>下载离线课件 ZIP</a>}
   <button className="cw-present-button" onClick={()=>void present()}><Play/>演示</button>{actions}
  </div></header>
  <aside className="cw-sidebar cw-ppt-sidebar" aria-label="幻灯片导航"><header className="cw-pages-heading"><strong>幻灯片 <span>{pages.length}</span></strong><button aria-pressed={outlineVisible} onClick={()=>setOutlineVisible(value=>!value)}>{outlineVisible?'隐藏大纲':'显示大纲'}</button></header><div className="cw-unified-pages" data-player-thumbnail-list>
   {pages.map((item,position)=><article className={'cw-ppt-page'+(item.id===activeId?' active':'')} key={item.id} aria-label={`第${position+1}页`}><div className="cw-ppt-page-row"><span className="cw-ppt-index">{String(position+1).padStart(2,'0')}</span><button className="cw-ppt-thumb" aria-label={`打开第${position+1}页：${item.title||item.id}`} aria-current={item.id===activeId?'page':undefined} onClick={()=>onSelect(item.id)}>
    {renderThumbnail?.(item,item.id===activeId)??<span className="cw-ppt-placeholder">{item.title||item.id}</span>}
   </button></div>{outlineVisible&&<button className="cw-ppt-title" onClick={()=>onSelect(item.id)}>{item.title||item.id}</button>}</article>)}
  </div></aside>
  <main className="cw-main"><header className="cw-page-heading"><div><span>{String(index+1).padStart(2,'0')}</span><strong>{page?.title||page?.id||title}</strong><small>网页</small></div></header>
   {error&&<p role="alert" className="ppt-player-error">{error}</p>}
   <div className="cw-viewport" ref={viewport}><div className="cw-slide-wrap" style={{width:1600*scale,height:900*scale}}><div className="cw-slide" style={{transform:`scale(${scale})`}}>{slide}</div></div>
    {presenting&&<div className="cw-fullscreen-controls"><button aria-label="退出演示" onClick={()=>void document.exitFullscreen()}><X/></button><span className="cw-fullscreen-divider"/>{narration}<button aria-label="上一页" disabled={index===0} onClick={()=>step(-1)}><ArrowLeft/></button><button aria-label="下一页" disabled={index>=pages.length-1} onClick={()=>step(1)}><ArrowRight/></button><span className="cw-fullscreen-count">{index+1} / {pages.length}</span></div>}
    {subtitle&&<p className="ppt-reader-subtitle" aria-live="polite">{subtitle}</p>}
   </div>
   <section className="cw-view-footer cw-notes-footer" aria-label="本页讲稿"><header><strong>本页讲稿</strong><div><span>{index+1} / {pages.length}</span><button aria-label="上一页" disabled={index===0} onClick={()=>step(-1)}>←</button><button aria-label="下一页" disabled={index>=pages.length-1} onClick={()=>step(1)}>→</button></div></header><div className="cw-inline-notes-body" ref={notesBody}><p>{snippet||notes||'本页暂无讲稿。'}</p></div></section>
  </main>
 </div>;
}

