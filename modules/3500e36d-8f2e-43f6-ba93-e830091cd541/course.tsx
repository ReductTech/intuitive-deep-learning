import { sourcePageIds, pilotPageIds } from './pageIds';
import type { ComponentType } from 'react';
import type { DeckDefinition, SpeakerNote } from "@shuku/course-style/react/presentation";
import outline from './outlines.json';
const files=import.meta.glob('./pages/[0-9]*.tsx',{eager:true}) as Record<string,{Page:ComponentType}>;
export const course=outline.pages.map(page=>{
 const sourceNumber=Object.entries(sourcePageIds).find(([,id])=>id===page.id)?.[0];
 const component=Object.entries(files).find(([file])=>Number(file.match(/\/(\d+)/)?.[1])===Number(sourceNumber))?.[1].Page;
 if(!component)throw new Error('Missing page component: '+page.id);
 return {...page,Component:component};
});
export const deck:DeckDefinition={id:outline.id,title:outline.title,subtitle:'NAIPv1 + NAIPv2 · 中文课件',scenes:course.map(p=>({id:p.id,title:p.title,section:pilotPageIds.has(p.id)?'NAIPv2 · 论文质量估计':p.sourceSlide===1?'课程封面':p.sourceSlide>=20?'应用与资源':'研究报告',render:()=> <p.Component/>}))};
export function getPptNotes(id:string):SpeakerNote[]{const p=outline.pages.find(p=>p.id===id);return p?[{text:p.snippet,selectors:[]},{text:pilotPageIds.has(p.id)?'迁移来源：PPT_Pilot/web/pages/'+(p.sourceSlide-23)+'.html':'原稿对应页：'+p.sourceSlide+'。研究来源：https://ojs.aaai.org/index.php/AAAI/article/view/32106',selectors:[]}]:[];}
