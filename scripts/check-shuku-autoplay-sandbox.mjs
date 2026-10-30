import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const here=path.join(repo,'work/shuku-autoplay-sandbox');
await fs.mkdir(here,{recursive:true});
const fixture=path.join(here,'project.json');
await fs.writeFile(fixture,JSON.stringify({version:1,id:'test',courseId:'test',title:'沙箱测试',duration:30,style:'简洁',outlineConfirmed:true,source:{files:{}},pages:[{id:'page-1',title:'第一段',goal:'验证',summary:'测试内容',format:'text',outline:{snippet:'这是发布课件的讲稿。'}}]}));
execFileSync(process.execPath,[path.join(repo,'scripts/build-shuku-preview.mjs'),'--project',fixture,'--outdir',path.join(here,'sandbox-player'),'--revision','11111111-1111-1111-1111-111111111111','--player','1'],{cwd:repo,stdio:'pipe'});
const require=createRequire(repo+'/package.json'),{build}=require('esbuild');
await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {LearningPage} from ${JSON.stringify(repo+'/src/shuku/LearningPage.tsx')};createRoot(document.getElementById('root')).render(React.createElement(LearningPage));`,resolveDir:repo,loader:'tsx'},bundle:true,jsx:'automatic',format:'iife',platform:'browser',outdir:path.join(here,'host'),define:{'import.meta.env':JSON.stringify({DEV:false,MODE:'production'})},logLevel:'silent'});
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),rid='11111111-1111-1111-1111-111111111111',errors=[];let syntheses=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__plays=0;
  window.Audio=class{constructor(){this.readyState=4;}play(){window.__plays++;return Promise.resolve();}pause(){}removeAttribute(){}load(){}};
 });
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url()),p=u.pathname;
  if(p==='/learn')return route.fulfill({contentType:'text/html',body:'<html><div id="root"></div><script src="/host.js"></script></html>'});
  if(p==='/host.js')return route.fulfill({contentType:'application/javascript',body:await fs.readFile(path.join(here,'host/stdin.js'))});
  if(p.endsWith('/player/files/index.html'))return route.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':"sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline' data:; style-src 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self' data:; frame-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'"},body:await fs.readFile(path.join(here,'sandbox-player/index.html'))});
  let data={};
  if(p.endsWith('/player'))data={state:'ready',url:'/api/shuku/revisions/'+rid+'/player/files/index.html'};
  else if(p.includes('/public/revisions/'))data={course_id:'test',title:'沙箱测试',version:'1',revision_id:rid};
  else if(p.includes('/personal/study/'))data={account_id:'tester',context:{resource:'course:test',title:'测试',version:rid,version_label:'v1',pages:['page-1'],available:true,sandboxed:true},state:null};
  else if(p.endsWith('/releases'))data={releases:[{revision_id:rid,version:'1'}]};
  else if(p.endsWith('/narration/segment')){
   syntheses++;assert.deepEqual(route.request().postDataJSON(),{text:'这是发布课件的讲稿。',rate:1});
   assert.equal(route.request().frame(),page.mainFrame());
   return route.fulfill({contentType:'audio/mpeg',body:'ID3'});
  }else if(p.endsWith('/personal/study'))data={state_version:1};
  else if(p.endsWith('/auth/me'))data={user:{id:'tester',display_name:'测试',role:'learner'}};
  else if(p.endsWith('/messages'))data={messages:[],unread_count:0};
  else if(p.endsWith('/personal'))data={saved:[],history:[],next_cursor:null};
  return route.fulfill({json:data});
 });
 await page.goto('http://127.0.0.1:5175/learn?revision='+rid+'&mode=ppt');
 const frame=page.frameLocator('iframe.shuku-original-lesson');
 await frame.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await frame.getByRole('status').filter({hasText:'正在讲解'}).waitFor();
 assert.equal(syntheses,1);
 const inner=page.frames().find(f=>f.url().includes('/player/files/index.html'));
 assert.equal(await inner.evaluate(()=>window.origin),'null');
 assert.equal(await inner.evaluate(()=>window.__plays),1);
 assert.deepEqual(errors,[]);
 await frame.getByRole('button',{name:'停止讲解',exact:true}).click();
 console.log('PASS: release build retains snippet; real opaque sandbox uses authenticated study channel and host fetch, then plays the returned audio blob.');
}finally{await browser.close();}
