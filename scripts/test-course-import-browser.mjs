// Run from the repository root. See docs/shuku-course-import.md.

import {build} from 'esbuild';
import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
// Playwright is an optional verification tool, not a course runtime dependency.
const {chromium}=await import(process.env.SHUKU_PLAYWRIGHT_MODULE?pathToFileURL(path.resolve(process.env.SHUKU_PLAYWRIGHT_MODULE)).href:'playwright');
const preview=process.env.SHUKU_IMPORT_PREVIEW;
const temporary=await fs.mkdtemp(path.join((await import('node:os')).tmpdir(),'shuku-import-browser-'));
const output=path.join(temporary,'ui.js');
await build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import {CourseImport} from './src/shuku/CourseImport';import './src/shuku/shuku.css';createRoot(document.getElementById('root')).render(<CourseImport onBack={()=>{}}/>);",resolveDir:process.cwd(),loader:'tsx'},bundle:true,jsx:'automatic',outfile:output,define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{"DEV":false,"MODE":"production"}'}});
let confirmed=false,uploads=0,github=0;
const id='11111111-1111-1111-1111-111111111111';
const candidate={key:'modules/Demo/outlines.json',title:'Source course',description:'Description',category:'AI',page_count:1,planned_pages:1,file_count:5,asset_bytes:12};
const report=()=>({id,state:'succeeded',phase:confirmed?'initializing':'inspecting',progress:{stage:confirmed?'ready':'awaiting-confirmation'},expires_at:Date.now()/1000+86400,candidates:[candidate],...(confirmed?{course_id:'new-course'}:{})});
const sample=preview?JSON.parse(await fs.readFile(path.join(preview,'project.json'),'utf8')):null;
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');let body=[];for await(const chunk of req)body.push(chunk);body=Buffer.concat(body);
  if(url.pathname.startsWith('/api/shuku/course-imports')){
   res.setHeader('Content-Type','application/json');
   if(req.method==='POST'){
    if(url.pathname.endsWith('/confirm')){const value=JSON.parse(body);assert.equal(value.title,'Imported course');confirmed=true;}
    else{confirmed=false;if(url.pathname.endsWith('/zip')){assert.equal(req.headers['content-type'],'application/zip');assert(body.length>0);uploads++;}else{assert.equal(JSON.parse(body).type,'github');github++;}}
    res.end(JSON.stringify({id}));
   }else res.end(JSON.stringify(url.pathname.endsWith('/course-imports')?{imports:[]}:report()));return;
  }
  if(url.pathname==='/host'){
   if(!preview)throw Error('No sample preview configured');
   const mode=url.searchParams.get('mode')||'ppt';const slide=url.searchParams.get('slide');res.setHeader('Content-Type','text/html');res.end(`<iframe id="preview" sandbox="allow-scripts" src="${slide?'/course-preview?shukuPage='+encodeURIComponent(slide):'/course-preview'}" style="width:1600px;height:900px"></iframe><script>addEventListener('message',e=>{if(e.data.type==='shuku-study-ready')e.source.postMessage({type:'shuku-study-init',revision:e.data.revision,channel:'test',account:'guest',state:{page_id:${JSON.stringify(sample.pages[0].id)},mode:${JSON.stringify(mode)},completed:[]}},'*')})</script>`);return;
  }
  let file=['/','/my-courses'].includes(url.pathname)?'ui.html':url.pathname==='/course-preview'&&preview?path.join(preview,'dist/index.html'):url.pathname.includes('/files/')&&preview?path.join(preview,'dist',url.pathname.split('/files/')[1]):path.join(temporary,url.pathname.slice(1));
  if(file==='ui.html'){res.setHeader('Content-Type','text/html');res.end('<html lang="zh"><link rel="stylesheet" href="/ui.css"><div id="root"></div><script src="/ui.js"></script></html>');return;}
  if(![temporary,...(preview?[path.resolve(preview)]:[])].some(root=>path.resolve(file).startsWith(root+path.sep))){res.writeHead(404);res.end();return;}
  if(file.endsWith('.html'))res.setHeader('Content-Security-Policy',"sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline' data:; style-src 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self' data:; frame-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'");
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(await fs.readFile(file));
 }catch(e){res.writeHead(500);res.end(String(e));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const site='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',e=>{if(!errors.length)console.error('First browser error',e.stack?.slice(0,1000));errors.push(e.message);});
 await page.goto(site);await page.getByRole('textbox').first().fill('https://github.com/tests/source/tree/main/modules/Demo');await page.getByRole('button',{name:/\u68c0\u67e5\u8bfe\u7a0b\u6587\u4ef6/}).click();await page.getByRole('checkbox').waitFor();await page.getByRole('textbox').first().fill('Imported course');await page.getByRole('checkbox').check();await page.getByRole('button',{name:/\u786e\u8ba4\u5e76\u521b\u5efa/}).click();await page.getByRole('link',{name:/\u9884\u89c8\u5e76\u7ee7\u7eed/}).waitFor();assert.equal(github,1);
 await page.goto(site);await page.getByRole('radio').nth(1).check();await page.locator('input[type=file]').setInputFiles({name:'course.zip',mimeType:'application/zip',buffer:Buffer.from('zip-test')});await page.getByRole('button',{name:/\u68c0\u67e5\u8bfe\u7a0b\u6587\u4ef6/}).click();await page.getByRole('checkbox').waitFor();assert.equal(uploads,1);
 await page.reload();await page.getByRole('checkbox').waitFor();assert(page.url().includes('import='));
 for(const p of sample?.pages||[]){
  await page.goto(site+'/host?slide='+encodeURIComponent(p.id));const slide=page.frameLocator('#preview');await slide.locator('.course-page-surface').waitFor();
  assert((await slide.locator('#root').innerText()).trim().length>0,'Empty slide '+p.id);
  await slide.locator('body').evaluate(async()=>{
   const visible=()=>Array.from(document.images).filter(i=>i.getBoundingClientRect().width>0&&i.getBoundingClientRect().height>0);
   for(let i=0;i<50;i++){if(visible().every(img=>img.complete&&img.naturalWidth>0))break;await new Promise(resolve=>setTimeout(resolve,100));}
   if(!visible().every(img=>img.complete&&img.naturalWidth>0))throw Error('Course image failed to load: '+visible().filter(i=>!i.naturalWidth).map(i=>i.src.slice(0,160)).join(','));
   await document.fonts.ready;if([...document.fonts].some(font=>font.status==='error'))throw Error('Course font failed to load');
  });
 }
 if(sample){await page.goto(site+'/host?mode=guide');await page.waitForTimeout(1500);const frame=page.frameLocator('#preview');await frame.locator('.shuku-original-guide').waitFor();assert((await frame.locator('.shuku-original-guide').innerText()).length>30,'Empty guide');}
 assert.deepEqual(errors,[]);console.log('Browser checks passed: GitHub and ZIP confirmation, refresh resume, '+(sample?.pages.length||0)+' slides and original guide.');
}finally{await browser.close();server.close();await fs.rm(temporary,{recursive:true,force:true});}

