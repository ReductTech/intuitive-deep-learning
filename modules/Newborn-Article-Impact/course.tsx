import type { ComponentType } from 'react';
import type { DeckDefinition, SpeakerNote } from '../shared/react/presentation';
import outline from './outlines.json';
const files=import.meta.glob('./pages/[0-9]*.tsx',{eager:true}) as Record<string,{Page:ComponentType}>;
export const course=Object.entries(files).sort(([a],[b])=>a.localeCompare(b)).map(([file,exports])=>({...outline.pages[Number(file.match(/\/(\d+)/)?.[1]??1)-1],Component:exports.Page}));
// Reconnect shipped pages in older drafts and append only the new NAIPv2 chapter.
// Preserve page order, text edits, designs and revisions; never clear the project.
if(typeof window!=='undefined'){
 const key='scenedeck:creator:v1:newborn-article-impact';
 try{
  const raw=localStorage.getItem(key);
  if(raw){
   const saved=JSON.parse(raw);
   if(saved.courseId===outline.id&&Array.isArray(saved.pages)){
    const known=new Set(course.map(p=>p.id));
    const existing=new Set(saved.pages.map((p:{id:string})=>p.id));
    const nextPages=saved.pages.map((p:{id:string;nativeId?:string})=>!p.nativeId&&known.has(p.id)?{...p,nativeId:p.id,ready:true}:p);
    for(const p of course.filter(p=>p.id.startsWith('naipv2-')&&!existing.has(p.id))){nextPages.push({id:p.id,nativeId:p.id,title:p.title,goal:p.goal,summary:p.summary,outline:p,designed:false,ready:true,note:'',revisions:[],messages:[]});}
    const next=JSON.stringify({...saved,pages:nextPages});
    if(next!==raw){if(!localStorage.getItem('naip:pilot-append:backup:v1'))localStorage.setItem('naip:pilot-append:backup:v1',raw);localStorage.setItem(key,next);}
   }
  }
 }catch{/* Source pages remain available when browser draft storage is unavailable. */}
}
export const deck:DeckDefinition={id:outline.id,title:outline.title,subtitle:'NAIPv1 + NAIPv2 · 中文课件',scenes:course.map(p=>({id:p.id,title:p.title,section:p.id.startsWith('naipv2-')?'NAIPv2 · 论文质量估计':p.sourceSlide===1?'课程封面':p.sourceSlide>=20?'应用与资源':'研究报告',render:()=> <p.Component/>}))};
export function getPptNotes(id:string):SpeakerNote[]{const p=outline.pages.find(p=>p.id===id);return p?[{text:p.snippet,selectors:[]},{text:p.id.startsWith('naipv2-')?'迁移来源：PPT_Pilot/web/pages/'+(p.sourceSlide-23)+'.html':'原稿对应页：'+p.sourceSlide+'。研究来源：https://ojs.aaai.org/index.php/AAAI/article/view/32106',selectors:[]}]:[];}
