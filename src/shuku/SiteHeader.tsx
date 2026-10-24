import {useEffect,useRef,useState} from 'react';
import type {User} from './client';
import {SessionControl} from './SessionControl';
import '../app/HomePage.css';
import './shuku.css';
type Section='courses'|'saved'|'history'|'authoring'|'messages';
export function SiteHeader({section,savedCount=0,onBrowse,user}:{section:Section;savedCount?:number;user?:User|null;onBrowse?:(section:'courses'|'saved')=>void}){
 const [open,setOpen]=useState(false);
 const menu=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  function outside(event:PointerEvent){if(!menu.current?.contains(event.target as Node))setOpen(false);}
  function escape(event:KeyboardEvent){if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}}
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 const tab=new URLSearchParams(location.search).get('tab')||'mine';
 return <header className="sd-library-topbar">
  <a href="/" className="sd-library-brand" aria-label="SceneDeck 首页"><span className="sd-library-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1ZM12 5v16"/></svg></span><span>SceneDeck<span className="sd-library-brand-dot">.</span></span></a>
  <nav aria-label="主导航">
   <button className={section==='courses'?'is-active':''} onClick={()=>onBrowse?onBrowse('courses'):location.assign('/')}>探索课程</button>
   <button className={section==='saved'?'is-active':''} onClick={()=>onBrowse?onBrowse('saved'):location.assign('/?view=saved')}>我的收藏{savedCount>0&&<span>{savedCount}</span>}</button>
   <button className={section==='history'?'is-active':''} onClick={()=>location.assign('/?view=history')}>学习记录</button>
   <div className="sd-authoring-menu" ref={menu} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setOpen(false);}}>
    <button ref={trigger} className={section==='authoring'?'is-active':''} aria-expanded={open} aria-controls="authoring-subpages" onClick={()=>setOpen(value=>!value)}>课程创作<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={open?'m4 10 4-4 4 4':'m4 6 4 4 4-4'}/></svg></button>
    {open&&<div id="authoring-subpages" className="sd-authoring-subpages" aria-label="课程创作子页面">{[['create','我要创建课程'],['mine','我的课程'],['reviews','共创待审核'],['workspaces','我参与的共创']].map(([value,label])=><a key={value} href={'/my-courses?tab='+value} aria-current={section==='authoring'&&tab===value?'page':undefined}>{label}</a>)}</div>}
   </div>
  </nav>
  <span className="sd-library-topnote"><span/>让知识可以被探索</span><SessionControl user={user}/>
 </header>;
}
