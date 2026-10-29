// Render real prepared template/native artifacts, including opaque-origin media.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const fixture=path.resolve(process.argv[3]),nativeRoot=path.resolve(process.argv[4]);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const csp="sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline' data:; style-src 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data:; frame-src 'none'";
 await page.route('**/__authoring_parity__/**',async route=>{
  const type=new URL(route.request().url()).pathname.split('/').at(-2);
  assert.ok(['new','native'].includes(type));
  return route.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':csp},body:await fs.readFile(path.join(fixture,type+'-dist/index.html'))});
 });
 let media=0;
 await page.route('**/api/shuku/public/library-assets/**',async route=>{
  const [,suffix]=new URL(route.request().url()).pathname.split('/10774328363c364d6316ec7ee0783d572d237fc6/');assert.ok(suffix&&!suffix.includes('..'));
  const file=path.join(nativeRoot,'assets',decodeURIComponent(suffix));
  const mime=file.endsWith('.mp4')?'video/mp4':file.endsWith('.json')?'application/json':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.webp')?'image/webp':file.endsWith('.jpg')?'image/jpeg':'image/png';
  media++;return route.fulfill({contentType:mime,headers:{'Access-Control-Allow-Origin':'*'},body:await fs.readFile(file)});
 });
 await page.goto('http://localhost:5379/__authoring_parity__/new/index.html?shukuPage=first');
 await page.getByRole('heading',{name:'完整模板组件',exact:true}).waitFor();
 await page.getByRole('button',{name:'互动 0',exact:true}).click();await page.getByRole('button',{name:'互动 1',exact:true}).waitFor();
 assert.equal(await page.locator('main').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(18, 52, 86)','Tailwind generated from uploaded source');
 assert.equal(await page.getByAltText('普通素材').evaluate(el=>el.complete&&el.naturalWidth),1,'ordinary image file displays');
 await fs.mkdir('test-results/authoring-parity',{recursive:true});await page.screenshot({path:'test-results/authoring-parity/new.png'});
 const project=JSON.parse(await fs.readFile(path.join(fixture,'native-project.json'),'utf8'));
 await page.goto('http://localhost:5379/__authoring_parity__/native/index.html?shukuPage='+encodeURIComponent(project.pages[0].id));
 await page.getByText(/本地共创验证：302/).first().waitFor();
 await page.waitForTimeout(800);assert.ok(media>0,'real original media uses the pinned public snapshot, not current assets');
 await page.screenshot({path:'test-results/authoring-parity/native.png'});
 // Self-study keeps the real original Guide component, not a slide imitation.
 await page.route('**/__authoring_parity__/host.html',route=>route.fulfill({contentType:'text/html',body:'<style>html,body{margin:0}iframe{width:100vw;height:100vh;border:0}</style><iframe id="lesson" src="/__authoring_parity__/native/index.html"></iframe>'}));
 await page.goto('http://localhost:5379/__authoring_parity__/host.html');
 const original=page.frameLocator('#lesson');await original.locator('.cw-app').waitFor();
 await page.evaluate(({id,revision})=>document.querySelector('iframe').contentWindow.postMessage({type:'shuku-study-init',revision,channel:'guide-parity',account:'fixture',state:{page_id:id,mode:'guide',completed:[]}},'*'),{id:project.pages[0].id,revision:'22222222-2222-4222-8222-222222222222'});
 await original.locator('.shuku-original-guide').waitFor();
 assert.equal(await original.locator('.cw-app').count(),0,'self-study renders the original full guide component');
 await page.screenshot({path:'test-results/authoring-parity/native-guide.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS original template components, interactive React, Tailwind, ordinary asset file, modified original native source pinned media and the original self-study guide under sandbox CSP');
}finally{await browser.close();}
