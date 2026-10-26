// Mocked immutable release: no real courses or study records are changed.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const sandboxed of [false,true]){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let state=null,counter=0;
  const rid='release',pages=['first','second'];
  const context={resource:'course:course',title:'神经元课程',version:rid,version_label:'v1.0.0',pages,sandboxed,available:true,url:'/learn?revision='+rid,page_details:pages.map((id,i)=>({id,title:'课程页面 '+(i+1),thumbnail:'/api/shuku/revisions/release/files/assets/thumb'+i+'.png'}))};
  await page.route('**/api/shuku/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);let data;
   if(path==='/auth/me')data={user:{id:'learner',username:'linzhi',display_name:'林知',role:'learner'}};
   else if(path==='/messages')data={messages:[],unread_count:0};
   else if(path==='/public/revisions/release')data={course_id:'course',title:context.title,version:'1.0.0',revision_id:rid};
   else if(path==='/public/courses/course/releases')data={releases:[{revision_id:rid,version:'1.0.0'}]};
   else if(path.startsWith('/personal/study/')&&req.method()==='GET')data={context,state,account_id:'learner'};
   else if(path==='/personal/study'){state={...req.postDataJSON(),state_version:++counter};data={state_version:counter};}
   else if(path.endsWith('.png'))return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII=','base64')});
   else if(path==='/revisions/release/files/index.html')return route.fulfill({contentType:'text/html',headers:sandboxed?{'Content-Security-Policy':'sandbox allow-scripts'}:{},body:`<meta charset="utf-8"><h1>课程页面 1</h1><select aria-label="学习方式"><option value="guide">自学互动</option><option value="ppt">教学展示</option></select><button id="next">下一页</button><button id="done">标记学完</button><script>let state={page_id:'first',mode:'guide',completed:[]},channel;function send(){document.querySelector('h1').textContent='课程页面 '+(state.page_id==='first'?1:2);document.querySelector('select').value=state.mode;parent.postMessage({type:'shuku-study-position',revision:'release',channel,state},'*');}addEventListener('message',e=>{if(e.source!==parent||e.data.type!=='shuku-study-init')return;state=e.data.state;channel=e.data.channel;send();});document.querySelector('select').onchange=e=>{state.mode=e.target.value;send();};document.querySelector('#next').onclick=()=>{state.page_id='second';send();};document.querySelector('#done').onclick=()=>{state.completed=['second'];send();};parent.postMessage({type:'shuku-study-ready',revision:'release'},'*');</script>`});
   else throw Error('Unexpected API '+path);
   await route.fulfill({json:data});
  });
  await page.goto(base+'/learn?revision=release&mode=ppt');
  const sidebar=page.getByRole('region',{name:'幻灯片导航'}),frame=page.frameLocator('iframe');
  await sidebar.getByRole('button',{name:'打开第1页：课程页面 1',exact:true}).waitFor();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.cw-ppt-thumb img')).every(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await sidebar.locator('.cw-ppt-title').count(),0);await sidebar.getByRole('button',{name:'显示大纲'}).click();assert.equal(await sidebar.locator('.cw-ppt-title').count(),2);
  await sidebar.getByRole('button',{name:'打开第2页：课程页面 2',exact:true}).click();await frame.getByRole('heading',{name:'课程页面 2'}).waitFor();
  await frame.getByRole('button',{name:'标记学完'}).click();await frame.getByLabel('学习方式').selectOption('guide');await sidebar.waitFor({state:'detached'});
  await frame.getByLabel('学习方式').selectOption('ppt');await sidebar.waitFor();await sidebar.getByRole('button',{name:'打开第1页：课程页面 1',exact:true}).click();await frame.getByRole('heading',{name:'课程页面 1'}).waitFor();
  await page.waitForTimeout(500);assert.deepEqual(state.completed,['second']);assert.equal(state.mode,'ppt');assert.equal(state.page_id,'first');
  await frame.getByRole('button',{name:'下一页'}).click();await page.waitForTimeout(500);await page.goto(base+'/learn?revision=release&resume=1');await frame.getByRole('heading',{name:'课程页面 2'}).waitFor();await sidebar.waitFor();
  await page.evaluate(()=>window.postMessage({type:'shuku-study-position',revision:'release',channel:'forged',state:{page_id:'first',mode:'guide',completed:[]}},location.origin));assert.equal(await sidebar.count(),1);
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
  await fs.mkdir('test-results/teaching',{recursive:true});await page.screenshot({path:'test-results/teaching/'+(sandboxed?'source':'native')+'-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);await page.close();
 }
 const local=await browser.newPage({viewport:{width:1440,height:1000}});
 await local.route('**/api/shuku/auth/me',route=>route.fulfill({json:{user:{id:'learner',username:'linzhi',display_name:'林知',role:'learner'}}}));
 await local.route('**/api/shuku/messages',route=>route.fulfill({json:{messages:[],unread_count:0}}));
 await local.goto(base+'/scenedeck/?deck=neuron-guide');await local.locator('.cw-native').waitFor();
 const heading=await local.locator('.cw-page-heading').innerText();await local.getByRole('button',{name:'下一页',exact:true}).click();
 assert.notEqual(await local.locator('.cw-page-heading').innerText(),heading);assert.equal(await local.locator('.cw-ppt-sidebar').count(),1);
 await local.screenshot({path:'test-results/teaching/local-preview.png',fullPage:true});await local.close();
 console.log('PASS teaching: shared navigator, release thumbnails, outline, slide navigation, guide/ppt switch, progress/resume, sandbox and message-source checks, mobile.');
}finally{await browser.close();}
