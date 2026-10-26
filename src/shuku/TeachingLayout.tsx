import type {ReactNode} from 'react';
import {PageNavigator} from '../creator/PageNavigator';
import type {CreatorPage} from '../creator/model';
import '../creator/CreatorWorkspace.css';
import './TeachingLayout.css';
export interface TeachingPage {id:string;title:string;thumbnail?:string|null}
// Local authoring preview and released lessons reuse the same slide navigator.
export function TeachingLayout({pages,active,mode,onSelect,children,disabled=false}:{pages:TeachingPage[];active:string;mode:'guide'|'ppt';onSelect:(id:string)=>void;children:ReactNode;disabled?:boolean}){
 const navigatorPages:CreatorPage[]=pages.map(page=>({id:page.id,title:page.title,goal:'',summary:'',note:'',designed:true,ready:true,revisions:[],messages:[]}));
 return <div className={'shuku-teaching-layout'+(mode==='ppt'?' is-teaching':'')}>
  {mode==='ppt'&&<div className="shuku-teaching-sidebar" role="region" aria-label="幻灯片导航"><PageNavigator pages={navigatorPages} activeId={active} busy={disabled} editable={false} thumbnail={page=>pages.find(p=>p.id===page.id)?.thumbnail||undefined} onSelect={onSelect} onReorder={()=>{}} onProperties={()=>{}} onAdd={()=>{}}/></div>}
  <div className="shuku-teaching-stage">{children}</div>
 </div>;
}
