import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {startGuided,outlineFor,compileGuided,guidedState,updateGuided,changeGuidedPhase,updateGuidedPreferences} from './guided.ts';
const original={version:1,id:'project',courseId:'test',title:'Agent 入门',duration:30,style:'简洁教学',outlineConfirmed:true,pages:[]};
test('guided creation begins with choices and preserves course information',()=>{
 const project=startGuided(original,'理解工具、记忆和规划');assert.equal(project.duration,20);assert.equal(guidedState(project.pages[0]).phase,'choices');assert.equal(project.source,undefined);assert.equal(original.pages.length,0);
 const outline=outlineFor({...project,duration:10});assert.equal(outline.pages.length,4);assert.equal(outline.outlineConfirmed,false);assert.ok(outline.pages.every(p=>guidedState(p).phase==='outline'&&!p.ready));assert.match(outline.pages[0].summary,/工具/);
 assert.equal(outlineFor({...project,duration:40}).pages.length,8);
});
test('page decisions and reference images survive serialization and compile to real React files',()=>{
 let project=outlineFor(startGuided(original,'描述课程'));
 project.pages[0]={...updateGuided(project.pages[0],{phase:'pages',layout:'question',brief:'使用流程图',confirmed:true,image:'data:image/png;base64,aW1hZ2U='}),title:'<script>不是代码</script>',summary:'内容包含 "引号" 和换行\n第二行'};
 const built=compileGuided(project);assert.equal(built.pages[0].format,'react');assert.equal(built.pages[0].ready,true);assert.equal(built.pages[1].ready,false);assert.equal(guidedState(JSON.parse(JSON.stringify(built)).pages[0]).brief,'使用流程图');
 const source=built.source.files['Page1.tsx'];assert.match(source,/question/);assert.ok(!source.includes('<script>'));assert.match(source,/data:image\/png/);
 for(const [name,contents] of Object.entries(built.source.files))if(name.endsWith('.tsx'))assert.doesNotThrow(()=>buildSync({stdin:{contents,loader:'tsx'},bundle:true,write:false,external:['react','./guided.css'],logLevel:'silent'}));
});
test('changing one page leaves other page decisions intact',()=>{
 const project=outlineFor(startGuided(original,'主题'));const changed=updateGuided(project.pages[1],{layout:'steps',confirmed:true});const next=compileGuided({...project,pages:project.pages.map((p,i)=>i===1?changed:p)});
 assert.equal(guidedState(next.pages[1]).layout,'steps');assert.equal(guidedState(next.pages[0]).layout,undefined);assert.equal(guidedState(project.pages[1]).confirmed,false);
});

test('backtracking preserves outlines, layouts and references while updating preferences',()=>{
 let project=outlineFor({...startGuided(original,'主题'),duration:10});
 project.pages[0]={...updateGuided(project.pages[0],{layout:'question',confirmed:true,brief:'保留我的想法',image:'data:image/png;base64,aW1hZ2U='}),title:'手动编辑的标题',summary:'手动编辑的内容'};
 const ids=project.pages.map(p=>p.id);
 const previous=changeGuidedPhase(compileGuided(project),'choices');
 const changed=updateGuidedPreferences(previous,{duration:40,style:'动手探索',audience:'专业学习者'});
 const restored=outlineFor(changed);
 assert.deepEqual(restored.pages.map(p=>p.id),ids);assert.equal(restored.pages.length,4);
 assert.equal(restored.pages[0].title,'手动编辑的标题');assert.equal(restored.pages[0].summary,'手动编辑的内容');
 assert.equal(guidedState(restored.pages[0]).layout,'question');assert.equal(guidedState(restored.pages[0]).image,'data:image/png;base64,aW1hZ2U=');assert.equal(guidedState(restored.pages[0]).brief,'保留我的想法');
 assert.ok(restored.pages.every(p=>guidedState(p).audience==='专业学习者'&&!guidedState(p).confirmed));assert.match(restored.pages[0].goal,/专业学习者/);
 assert.equal(guidedState(project.pages[0]).confirmed,true);assert.equal(restored.duration,40);assert.equal(restored.style,'动手探索');
 const resumed=compileGuided(changeGuidedPhase(restored,'pages'));assert.equal(resumed.outlineConfirmed,true);assert.match(resumed.source.files['guided.css'],/#f1f7ff/);
});
