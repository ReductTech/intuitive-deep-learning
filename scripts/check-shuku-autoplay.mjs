import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://127.0.0.1:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[],options=[];page.setDefaultTimeout(90000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const project={version:1,id:'autoplay-test',courseId:'neuron-guide',title:'自动播放验证',duration:30,style:'简洁教学',outlineConfirmed:true,pages:['第一段','空讲稿','最后一段'].map((title,i)=>({id:'test-'+i,title,goal:'验证朗读与翻页',summary:'播放测试',designed:true,ready:true,format:'text',note:'',revisions:[],messages:[],outline:{snippet:i===1?'':title+'讲稿'}}))};
  localStorage.setItem('scenedeck:creator:v1:neuron-guide',JSON.stringify(project));
  localStorage.setItem('scenedeck:creator:v1:guest:autoplay-test',JSON.stringify(project));
  crypto.randomUUID=()=> 'autoplay-test';
  window.__audios=[];window.__plays=0;
  window.Audio=class{constructor(url){this.src=url;this.readyState=4;window.__audios.push(this);}play(){window.__plays++;return Promise.resolve();}pause(){}removeAttribute(){}load(){}};
  window.__speeches=[];
  window.speechSynthesis.speak=s=>window.__speeches.push(s);
  window.speechSynthesis.cancel=()=>{};
  window.speechSynthesis.pause=()=>{};
  window.speechSynthesis.resume=()=>{};
 });
 let failing=false,held=false,resolveHeld;
 await page.route('**/api/shuku/narration/segment',async route=>{
  requests.push(route.request().postDataJSON().text);options.push(route.request().postDataJSON());
  if(held)await new Promise(r=>{resolveHeld=r;});
  if(failing)await route.fulfill({status:503,json:{error:'测试：配音服务未配置'}});
  else await route.fulfill({contentType:'audio/mpeg',body:Buffer.from('ID3')});
 });
 await page.goto(base+'/study?module=neuron-guide&mode=ppt');
 const controls=page.locator('.cw-topbar .cw-smart-narration');
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await controls.getByRole('status').filter({hasText:'正在讲解'}).waitFor();
 await page.waitForFunction(()=>window.__audios.length===2);assert.deepEqual(requests,['第一段讲稿','最后一段讲稿']);
 await controls.getByRole('button',{name:'暂停讲解',exact:true}).click();
 await controls.getByRole('status').filter({hasText:'已暂停'}).waitFor();
 await controls.getByRole('button',{name:'继续讲解',exact:true}).click();
 await page.evaluate(()=>window.__audios.findLast(audio=>typeof audio.onended==='function').onended());
 await page.waitForFunction(()=>document.querySelector('.cw-page-heading strong')?.textContent==='最后一段');
 await controls.getByRole('status').filter({hasText:'正在讲解'}).waitFor();
 assert.deepEqual(requests,['第一段讲稿','最后一段讲稿']);
 await page.evaluate(()=>window.__audios.findLast(audio=>typeof audio.onended==='function').onended());
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).waitFor();
 // Pausing during synthesis must not start audio when it arrives.
 held=true;
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.cw-smart-narration [role=status]')?.textContent==='准备配音…');
 await controls.getByRole('button',{name:'暂停讲解',exact:true}).click();
 while(!resolveHeld)await new Promise(r=>setTimeout(r,20));
 const plays=await page.evaluate(()=>window.__plays);resolveHeld();held=false;
 await page.waitForFunction(()=>window.__audios.length===3);
 assert.equal(await page.evaluate(()=>window.__plays),plays);
 await controls.getByRole('button',{name:'停止讲解',exact:true}).click();
 // Error and retry, then stop while a response is pending.
 failing=true;await controls.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'测试：配音服务未配置'}).waitFor();
 failing=false;held=true;resolveHeld=undefined;
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).click();
 while(!resolveHeld)await new Promise(r=>setTimeout(r,20));
 await controls.getByRole('button',{name:'停止讲解',exact:true}).click();
 resolveHeld();held=false;
 // Browser provider, manual navigation, edit-mode cleanup.
 await controls.getByLabel('讲稿设置').click();await controls.getByLabel('朗读方式').selectOption('browser');await controls.getByLabel('讲稿设置').click();
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await page.waitForFunction(()=>window.__speeches.length===1);
 await page.getByRole('button',{name:'上一页',exact:true}).click();
 await page.waitForFunction(()=>window.__speeches.length===2);
 await page.getByRole('button',{name:'上一页',exact:true}).click();
 // Empty snippet is skipped back to last page; stop before choosing page one.
 await controls.getByRole('button',{name:'停止讲解',exact:true}).click();
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await page.locator('.cw-edit-toggle').click();
 assert.equal(await controls.count(),0);
 assert.equal(await page.evaluate(()=>window.__speeches.at(-1).onend),null);
 assert.deepEqual(errors,[]);
 // Voice/speed selection reaches the gateway; disabling automatic advance stays on this page.
 await page.reload();await controls.getByRole('button',{name:'智能讲稿',exact:true}).waitFor();
 await controls.getByLabel('讲稿设置').click();
 await controls.getByLabel('音色',{exact:true}).selectOption('Chinese (Mandarin)_Reliable_Executive');
 await controls.getByLabel('语速',{exact:true}).selectOption('0.9');
 await controls.getByRole('checkbox').uncheck();await controls.getByLabel('讲稿设置').click();
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await controls.getByRole('status').filter({hasText:'正在讲解'}).waitFor();
 assert.deepEqual(options.at(-1),{text:'第一段讲稿',rate:.9,voiceId:'Chinese (Mandarin)_Reliable_Executive'});
 await page.evaluate(()=>window.__audios.findLast(audio=>typeof audio.onended==='function').onended());
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).waitFor();
 assert.equal(await page.locator('.cw-page-heading strong').textContent(),'第一段');
 // Inspect the actual built-in lesson with the new controls, using a fresh context.
 const real=await browser.newPage({viewport:{width:1440,height:1000}});
 await real.goto(base+'/study?module=neuron-guide&mode=ppt');
 await real.locator('.cw-topbar .cw-smart-narration').waitFor();
 await fs.mkdir(new URL('../work/shuku-autoplay/',import.meta.url),{recursive:true});
 await real.screenshot({path:new URL('../work/shuku-autoplay/autoplay-preview.png',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
 await real.locator('.cw-topbar').getByLabel('讲稿设置').click();
 await real.screenshot({path:new URL('../work/shuku-autoplay/settings-preview.png',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
 await real.locator('.cw-topbar').getByLabel('讲稿设置').click();
 await real.getByRole('button',{name:'演示',exact:true}).click();
 await real.locator('.cw-fullscreen-controls .cw-smart-narration').waitFor();
 assert.ok(await real.evaluate(()=>Boolean(document.fullscreenElement)));
 await real.locator('.cw-fullscreen-controls').getByLabel('讲稿设置').click();
 assert.ok(await real.locator('.cw-fullscreen-controls').getByLabel('语速',{exact:true}).isVisible());
 await real.locator('.cw-fullscreen-controls').getByLabel('讲稿设置').click();
 await real.getByRole('button',{name:'退出全屏 · Esc',exact:true}).click();
 console.log('PASS: ordered snippets, empty-page skipping, pause/resume, last-page stop, pause during synthesis, stop during request, failure/retry, browser provider, navigation and editor cleanup.');
 console.log(await real.locator('.ppt-slide-surface').evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight,characters:[...el.textContent.replace(/\s/g,'')].length})));
}finally{await browser.close();}
