import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/creator/outline.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {outlinePlan,applyOutline,outlineMarkdown,importOutlineMarkdown}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const pages=Array.from({length:15},(_,i)=>({id:'p'+i,title:'页面 '+i,summary:'内容 '+i,goal:'',note:'',designed:false,ready:false,revisions:[],messages:[],outline:{guided:{phase:'outline',audience:'初学者',description:'提出问题，再建立理解。'}}}));
const project={version:1,id:'project',courseId:'course',title:'课程',duration:40,style:'图解',outlineConfirmed:false,pages};
const plan=outlinePlan(project);
assert.equal(plan.step,'story');assert.equal(plan.modules.length,3);assert.deepEqual(plan.modules.map(m=>m.pageIds.length),[5,5,5]);
let saved=applyOutline(project,{...plan,step:'modules',logic:'从一个问题出发'});
assert.deepEqual(outlinePlan(JSON.parse(JSON.stringify(saved))),{...plan,step:'modules',logic:'从一个问题出发'});
const md=outlineMarkdown(saved,outlinePlan(saved));const imported=importOutlineMarkdown(saved,md);
assert.equal(outlineMarkdown(imported,outlinePlan(imported)),md);assert.deepEqual(imported.pages.map(p=>p.id),pages.map(p=>p.id));
const reverse={...plan,modules:[...plan.modules].reverse()};
saved=applyOutline(project,reverse);assert.equal(saved.pages[0].id,'p10');assert.equal(outlinePlan(saved).modules[0].id,plan.modules[2].id);
const reordered=importOutlineMarkdown(project,outlineMarkdown(saved,outlinePlan(saved)));
assert.deepEqual(reordered.pages.map(p=>p.id),saved.pages.map(p=>p.id),'Markdown reorder preserves page identities');
const deleting={...plan,modules:plan.modules.map(m=>({...m,pageIds:m.pageIds.filter(id=>id!=='p0')}))};
saved=applyOutline(project,deleting);assert.equal(saved.pages[0].id,'p1');assert.deepEqual(outlinePlan(saved).modules,deleting.modules);
assert.throws(()=>importOutlineMarkdown(project,'# 课程\n### 无模块'),/模块/);
assert.throws(()=>importOutlineMarkdown(project,'# 课程\n## 模块'),/1–100/);
assert.throws(()=>importOutlineMarkdown(project,'a'.repeat(256001)),/过长/);
assert.throws(()=>applyOutline(project,{...plan,modules:[{...plan.modules[0],pageIds:['p0','p0']}]}),/重复/);
assert.equal(project.pages[0].summary,'内容 0');
console.log('PASS outline: progressive structure, revision round trip, Markdown, reorder, first-page removal, invalid imports.');

// Legacy source projects keep their code and page entries when outlining.
const source={...project,source:{files:{'Original.tsx':'export default function Original(){return <h1>KEEP</h1>}'}},pages:pages.map(p=>({...p,format:'react',sourceEntry:'Original.tsx',outline:{existing:'retained'}}))};
const sourcePlan=outlinePlan(source),outlined=applyOutline(source,{...sourcePlan,logic:'原有课程的结构'});
assert.deepEqual(outlined.source,source.source);assert.ok(outlined.pages.every(p=>p.sourceEntry==='Original.tsx'&&p.outline.existing==='retained'&&!p.outline.guided));assert.equal(outlinePlan(outlined).logic,'原有课程的结构');
