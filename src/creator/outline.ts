import type {CreatorPage, CreatorProject} from './model';
import {guidedState, updateGuided} from './guided';

export interface OutlineModule {id:string; title:string; summary:string; pageIds:string[]}
export interface OutlinePlan {logic:string; step:'story'|'modules'|'pages'; modules:OutlineModule[]}

// Keep the plan with the first page so existing revision persistence also saves it.
export function outlinePlan(project:CreatorProject):OutlinePlan {
 const saved=guidedState(project.pages[0])?.plan;
 const ids=new Set(project.pages.map(p=>p.id));
 if(saved?.modules?.length && saved.modules.every(m=>Array.isArray(m.pageIds))){
  const seen=new Set<string>();
  const modules=saved.modules.map(m=>({...m,pageIds:m.pageIds.filter(id=>{if(!ids.has(id)||seen.has(id))return false;seen.add(id);return true;})}));
  modules[modules.length-1].pageIds.push(...project.pages.filter(p=>!seen.has(p.id)).map(p=>p.id));
  return {...saved,modules};
 }
 const labels=['从问题出发','建立理解','迁移与应用'];
 const size=Math.ceil(project.pages.length/3);
 return {logic:guidedState(project.pages[0])?.description||'',step:'story',modules:labels.slice(0,Math.min(3,project.pages.length)).map((title,i)=>({id:crypto.randomUUID(),title,summary:'',pageIds:project.pages.slice(i*size,(i+1)*size).map(p=>p.id)})).filter(m=>m.pageIds.length)};
}
export function applyOutline(project:CreatorProject,plan:OutlinePlan,pages=project.pages):CreatorProject {
 const byId=new Map(pages.map(p=>[p.id,p]));
 const ordered=plan.modules.flatMap(m=>m.pageIds.map(id=>byId.get(id)).filter((p):p is CreatorPage=>!!p));
 if(!ordered.length||ordered.length>100||new Set(ordered.map(p=>p.id)).size!==ordered.length)throw new Error('课程需要保留 1–100 页，且页面不能重复。');
 return {...project,outlineConfirmed:false,pages:ordered.map((p,i)=>updateGuided(p,{plan:i===0?plan:undefined}))};
}
function line(value:string){return value.replace(/[\r\n]+/g,' ').trim();}
export function outlineMarkdown(project:CreatorProject,plan:OutlinePlan):string {
 return [`# ${line(project.title)}`,plan.logic,...plan.modules.flatMap(m=>[`## ${line(m.title)}`,m.summary,...m.pageIds.flatMap(id=>{const p=project.pages.find(p=>p.id===id)!;return [`### ${line(p.title)}`,p.summary];})])].join('\n\n')+'\n';
}
export function importOutlineMarkdown(project:CreatorProject,text:string):CreatorProject {
 if(text.length>256000)throw new Error('大纲文本过长。');
 const old=outlinePlan(project), modules:OutlineModule[]=[],pages:CreatorPage[]=[];
 let title=project.title,logic='',module:OutlineModule|undefined,page:CreatorPage|undefined;
 for(const raw of text.replace(/\r/g,'').split('\n')){
  if(/^# /.test(raw)){if(modules.length)throw new Error('课程标题应放在开头。');title=raw.slice(2).trim();}
  else if(/^## /.test(raw)){module={id:old.modules[modules.length]?.id||crypto.randomUUID(),title:raw.slice(3).trim(),summary:'',pageIds:[]};modules.push(module);page=undefined;}
  else if(/^### /.test(raw)){
   if(!module)throw new Error('请先用 ## 写模块，再用 ### 写页面。');
   const used=new Set(pages.map(p=>p.id));
   const previous=project.pages.find(p=>p.title===raw.slice(4).trim()&&!used.has(p.id)) || project.pages.find(p=>!used.has(p.id));
   page=previous?{...previous,title:raw.slice(4).trim(),summary:''}:updateGuided({...project.pages[0],id:crypto.randomUUID(),title:raw.slice(4).trim(),summary:'',goal:'',note:'',designed:false,ready:false,revisions:[],messages:[],sourceEntry:undefined},{layout:undefined,image:'',brief:'',reference:undefined,suggestions:undefined});
   page=updateGuided(page,{confirmed:false,plan:undefined});pages.push(page);module.pageIds.push(page.id);
  }else if(/^#{4,}\s/.test(raw))throw new Error('大纲仅使用课程、模块、页面三个层级。');
  else if(page)page.summary+=(page.summary?'\n':'')+raw;
  else if(module)module.summary+=(module.summary?'\n':'')+raw;
  else logic+=(logic?'\n':'')+raw;
 }
 if(!title||!modules.length||modules.length>20||modules.some(m=>!m.title)||pages.some(p=>!p.title))throw new Error('请填写课程、模块和页面标题，模块不超过 20 个。');
 return applyOutline({...project,title}, {logic:logic.trim(),step:old.step,modules:modules.map(m=>({...m,summary:m.summary.trim()}))},pages.map(p=>({...p,summary:p.summary.trim()})));
}
