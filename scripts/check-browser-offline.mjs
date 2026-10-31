// Local regression: website hosts code/indexes; only module assets use asset URLs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://127.0.0.1:5173';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage(),requests=[];
 const namespace='11111111-1111-4111-8111-111111111111';
 const assets={
  'data.json':Buffer.from(JSON.stringify({caption:'Runtime JSON loaded',image:'picture.svg'})),
  'picture.svg':Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="blue"/></svg>'),
 };
 const files=Object.entries(assets).map(([path,bytes])=>({path,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),mime:path.endsWith('.json')?'application/json':'image/svg+xml',url:base+'/fixture-assets/'+path}));
 const entry='assets/offline-fixture.js';
 const code=`export async function mount(project){const data=await fetch(globalThis.__SHUKU_OFFLINE_ASSET__('assets/${namespace}/data.json')).then(r=>r.json());document.getElementById('root').textContent=data.caption;addEventListener('message',event=>{if(event.data?.type==='shuku-offline-check-page')parent.postMessage({type:'shuku-offline-page-checked',page:event.data.page},'*')});parent.postMessage({type:'shuku-offline-ready',pages:project.pages.map(p=>p.id)},'*')}`;
 const descriptor={entry,files:[entry],modules:[entry],namespaces:[namespace],assetHints:['data.json'],assetPatterns:[]};
 await page.route(base+'/browser-offline-test',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div>'}));
 await page.route('**/offline-runtime/**',async route=>{
  const url=new URL(route.request().url());requests.push(url.pathname);
  if(url.pathname.endsWith('/courses/fixture.json'))return route.fulfill({json:descriptor});
  if(url.pathname.endsWith('/namespaces/'+namespace+'.json'))return route.fulfill({json:{files,formats:{}}});
  if(url.pathname.endsWith('/esbuild.wasm'))return route.fulfill({contentType:'application/wasm',body:await fs.readFile('node_modules/esbuild-wasm/esbuild.wasm')});
  throw Error('Unexpected runtime request: '+url.pathname);
 });
 await page.route(base+'/'+entry,route=>route.fulfill({contentType:'application/javascript',body:code}));
 await page.route(base+'/fixture-assets/*',route=>{const name=new URL(route.request().url()).pathname.split('/').at(-1);requests.push('/fixture-assets/'+name);return route.fulfill({contentType:files.find(f=>f.path===name).mime,body:assets[name]});});
 await page.goto(base+'/browser-offline-test');
 const size=await page.evaluate(async()=>{
  const {downloadCourseInBrowser}=await import('/src/creator/browserOffline.ts');
  const project={version:1,id:'fixture',courseId:'fixture',title:'Offline test',pages:[{id:'first',title:'First'}]};
  return (await downloadCourseInBrowser(project,new AbortController().signal,()=>{})).size;
 });
 assert.ok(size>0);
 assert.ok(requests.includes('/offline-runtime/courses/fixture.json'));
 assert.ok(requests.includes('/offline-runtime/namespaces/'+namespace+'.json'));
 assert.ok(requests.includes('/fixture-assets/picture.svg'),'JSON dependencies must be downloaded');
 assert.ok(!requests.some(p=>p.includes('/_offline/')));
 console.log('PASS browser ZIP: same-origin runtime/indexes, runtime JSON dependency collection and offline startup verification.');
 await page.goto('about:blank');
}finally{await browser.close();}
