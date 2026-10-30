import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const counts={};let releaseSecond;
 await page.addInitScript(()=>{
  const project={version:1,id:'preload-test',courseId:'neuron-guide',title:'预载验证',duration:30,style:'简洁',outlineConfirmed:true,pages:['甲','乙','丙'].map((title,i)=>({id:'page-'+i,title,summary:'测试',goal:'验证',format:'text',ready:true,designed:true,note:'',revisions:[],messages:[],outline:{snippet:title}}))};
  crypto.randomUUID=()=> 'preload-test';localStorage.setItem('scenedeck:creator:v1:guest:preload-test',JSON.stringify(project));
  window.__audios=[];window.Audio=class{constructor(){this.readyState=4;window.__audios.push(this);}play(){this.played=true;return Promise.resolve();}pause(){}removeAttribute(){}load(){}};
 });
 await page.route('**/api/shuku/narration/segment',async route=>{
  const {text}=route.request().postDataJSON();counts[text]=(counts[text]||0)+1;
  if(text==='乙')await new Promise(resolve=>{releaseSecond=resolve;});
  if(text==='丙'&&counts[text]===1)return route.fulfill({status:503,json:{error:'模拟预载失败'}});
  return route.fulfill({contentType:'audio/mpeg',body:'ID3'});
 });
 await page.goto(base+'/study?module=neuron-guide&mode=ppt');
 const controls=page.locator('.cw-topbar .cw-smart-narration');
 await controls.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await controls.getByRole('status').filter({hasText:'正在讲解'}).waitFor();
 while(!releaseSecond)await new Promise(resolve=>setTimeout(resolve,10));
 assert.equal(await page.locator('.cw-page-heading strong').textContent(),'甲');assert.deepEqual(counts,{'甲':1,'乙':1});
 await page.evaluate(()=>window.__audios.findLast(a=>a.onended).onended());
 await page.waitForFunction(()=>document.querySelector('.cw-page-heading strong').textContent==='乙');
 await controls.getByRole('status').filter({hasText:'准备配音'}).waitFor();assert.equal(counts['乙'],1);
 releaseSecond();await controls.getByRole('status').filter({hasText:'正在讲解'}).waitFor();
 while(!counts['丙'])await new Promise(resolve=>setTimeout(resolve,10));
 // Failed background preloading does not interrupt page two.
 await page.waitForFunction(()=>window.__audios.length===2);
 assert.equal(await page.getByRole('alert').count(),0);
 await page.evaluate(()=>window.__audios.findLast(a=>a.onended).onended());
 await page.waitForFunction(()=>document.querySelector('.cw-page-heading strong').textContent==='丙');
 await controls.getByRole('status').filter({hasText:'正在讲解'}).waitFor();assert.equal(counts['丙'],2);
 await page.evaluate(()=>window.__audios.findLast(a=>a.onended).onended());await controls.getByRole('button',{name:'智能讲稿',exact:true}).waitFor();
 console.log('PASS: next-page request starts during current playback, in-flight preload reused on advance, background failure preserves current playback and retries on demand, final stop.');
}finally{await browser.close();}
