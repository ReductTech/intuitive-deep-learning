// Real original interfaces and a real frozen release build; no production data is written.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true}),folder=await fs.mkdtemp(path.join(os.tmpdir(),'original-course-test-'));
const rid='a7d77c0a-3219-430e-a23e-99a6e8f9f5b7';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let state=null,counter=0,project,polls=0;
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.slice('/api/shuku'.length);let data;
  if(p==='/auth/me')data={user:{id:'learner',username:'linzhi',display_name:'林知',role:'learner'}};
  else if(p==='/messages')data={messages:[],unread_count:0};
  else if(p==='/public/revisions/'+rid)data={course_id:'course',title:project.title,version:'1.0.0',revision_id:rid};
  else if(p==='/public/courses/course/releases')data={releases:[{revision_id:rid,version:'1.0.0'}]};
  else if(p.startsWith('/personal/study/')&&req.method()==='GET')data={context:{resource:'course:course',title:project.title,version:rid,pages:project.pages.map(p=>p.id),available:true,url:'/learn?revision='+rid},state,account_id:'learner'};
  else if(p==='/personal/study'){state={...req.postDataJSON(),state_version:++counter};data={state_version:counter};}
  else if(p==='/revisions/'+rid+'/player')data=++polls===1?{state:'queued'}:{state:'ready',url:'/api/shuku/revisions/'+rid+'/player/files/index.html'};
  else if(p.startsWith('/revisions/'+rid+'/player/files/')){
   const file=p.split('/player/files/')[1];assert.ok(!file.includes('..'));
   const type=file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.webp')?'image/webp':file.endsWith('.mp4')?'video/mp4':'application/octet-stream';
   const content=await fs.readFile(path.join(folder,'dist',file)).catch(()=>null);return route.fulfill(content?{contentType:type,body:content}:{status:404,body:''});
  }else throw Error('Unexpected API '+p);
  await route.fulfill({json:data});
 });
 // Existing local editor continues using the original shared workspace.
 await page.goto(base+'/scenedeck/?deck=neuron-guide',{waitUntil:'domcontentloaded'});await page.locator('.cw-native').waitFor();
 const originalHeading=await page.locator('.cw-page-heading').innerText();
 await page.getByRole('button',{name:'下一页',exact:true}).click();const secondHeading=await page.locator('.cw-page-heading').innerText();assert.notEqual(secondHeading,originalHeading);
 project=await page.evaluate(()=>JSON.parse(localStorage.getItem('scenedeck:creator:v1:neuron-guide')));
 // Compile the exact native guide and PPT deck together, just like the release worker.
 const input=path.join(folder,'project.json');await fs.writeFile(input,JSON.stringify(project));
 const root=path.resolve(process.env.IDL_COURSE_LIBRARY_ROOT||'.course-library/build-test');
 execFileSync(process.execPath,['scripts/build-shuku-preview.mjs','--course-root',root,'--project',input,'--module',path.join(root,'modules/Neuron-Guide'),'--revision',rid,'--outdir',path.join(folder,'dist'),'--player','1'],{env:{...process.env,NODE_OPTIONS:'--max-old-space-size=256'},timeout:90000});
 const frame=page.frameLocator('iframe');
 await page.goto(base+'/learn?revision='+rid+'&mode=guide',{waitUntil:'domcontentloaded'});
 await frame.locator('.edu-lesson-flow').waitFor();assert.equal(await frame.locator('.edu-lesson-flow-step').count(),1);
 assert.equal(await frame.locator('.cw-sidebar').count(),0,'self-study is original GuidePage, not a carousel');
 await page.waitForTimeout(500);await frame.getByRole('button',{name:'继续向下滚动',exact:true}).click();await page.waitForFunction(()=>true);await frame.locator('.edu-lesson-flow-step').nth(1).waitFor();
 await page.waitForTimeout(550);assert.ok(state.completed.length>=1,'original LessonFlow reports account progress');assert.equal(state.mode,'guide');
 const bounds=await page.locator('iframe').boundingBox();assert.deepEqual(bounds,{x:0,y:0,width:1440,height:1000},'original self-study covers the full viewport');
 assert.equal(await frame.getByLabel('学习方式',{exact:true}).count(),0,'no replacement mode toolbar');
 await page.goto(base+'/learn?revision='+rid+'&mode=ppt',{waitUntil:'domcontentloaded'});await frame.locator('.cw-sidebar').waitFor();
 assert.equal(await frame.locator('.cw-page-heading').innerText(),originalHeading,'same original workbench');assert.equal(await frame.getByRole('link',{name:'术库首页',exact:true}).locator('strong').innerText(),'术库');
 await frame.getByRole('button',{name:'讲稿',exact:true}).click();await frame.getByRole('dialog',{name:'本页讲稿'}).waitFor();assert.ok((await frame.locator('.cw-settings').innerText()).length>10);await frame.getByRole('button',{name:'关闭面板'}).click();
 await frame.getByRole('button',{name:'✎ 编辑',exact:true}).click();await frame.getByRole('button',{name:'✓ 完成编辑',exact:true}).waitFor();await frame.getByRole('button',{name:'第1页属性',exact:true}).waitFor();await frame.getByLabel('当前页修改要求',{exact:true}).fill('布局切换保留内容');await frame.getByRole('button',{name:'交换布局',exact:true}).click();assert.equal(await frame.locator('.cw-panels-swapped').count(),1);assert.equal(await frame.getByLabel('当前页修改要求',{exact:true}).inputValue(),'布局切换保留内容');await frame.getByRole('button',{name:'交换布局',exact:true}).click();await frame.getByRole('button',{name:'✓ 完成编辑',exact:true}).click();
 await frame.getByRole('button',{name:'显示大纲',exact:true}).click();assert.equal(await frame.locator('.cw-ppt-title').count(),project.pages.length);
 await frame.getByRole('button',{name:'下一页',exact:true}).click();await page.waitForTimeout(550);assert.equal(state.mode,'ppt');assert.equal(state.page_id,project.pages[1].id);
 await page.goto(base+'/learn?revision='+rid+'&resume=1',{waitUntil:'domcontentloaded'});await frame.locator('.cw-sidebar').waitFor();assert.equal(await frame.locator('.cw-page-heading').innerText(),secondHeading);
 await frame.getByRole('button',{name:'演示',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.evaluate(()=>document.exitFullscreen());
 await fs.mkdir('test-results/teaching',{recursive:true});await page.screenshot({path:'test-results/teaching/original-ppt.png'});
 await page.goto(base+'/learn?revision='+rid+'&mode=guide',{waitUntil:'domcontentloaded'});await frame.locator('.edu-lesson-flow').waitFor();await page.screenshot({path:'test-results/teaching/original-guide.png'});
 // The original standalone self-study entry also remains untouched.
 await page.goto(base+'/modules/neuron-guide',{waitUntil:'domcontentloaded'});await page.locator('.edu-lesson-flow').waitFor();
 await page.setContent('<iframe allowfullscreen src="'+base+'/api/shuku/revisions/'+rid+'/player/files/index.html"></iframe>');await frame.locator('.cw-sidebar').waitFor();
 assert.deepEqual(errors,[]);console.log('PASS original GuidePage progressive flow; 39a0557 full-screen interfaces, original notes/edit/presentation controls, thumbnails/outline/paging/fullscreen; frozen release build; version/account progress and resume; local interfaces preserved.');
}finally{await browser.close();await fs.rm(folder,{recursive:true,force:true});}
