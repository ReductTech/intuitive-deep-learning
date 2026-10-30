// Usage: node scripts/check-shuku-offline.mjs <absolute path to playwright/index.mjs>
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const folder=await fs.mkdtemp(path.join(os.tmpdir(),'shuku-offline-test-'));
let browser;
try {
 const moduleDir=path.join(folder,'modules/Fixture'),assetDir=path.join(folder,'assets/fixture-assets');
 await fs.mkdir(moduleDir,{recursive:true});await fs.mkdir(path.join(assetDir,'icons'),{recursive:true});
 await fs.symlink(path.join(root,'modules/shared'),path.join(folder,'modules/shared'),process.platform==='win32'?'junction':'dir');
 await fs.writeFile(path.join(moduleDir,'outlines.json'),JSON.stringify({id:'offline-fixture',moduleIdentity:{id:'fixture-assets'},entry:'Guide.tsx',ppt:{entry:'Entry.tsx'},pages:[]}));
 await fs.writeFile(path.join(moduleDir,'Entry.tsx'),`import React,{useState} from 'react';import {moduleAssetUrl} from '../shared/react/assets';
 function Lesson(){const [n,setN]=useState(1);return <main><h1>Original interactive lesson</h1><button onClick={()=>setN(n===1?2:1)}>Count {n}</button><img alt="Dynamic lesson image" src={moduleAssetUrl('fixture-assets',\`icons/icon-\${n}.svg\`)}/><iframe title="Embedded lesson" src="/modules/offline-fixture?demo=1"/></main>}
 export const deck={id:'offline-fixture',title:'One module',subtitle:'',scenes:[{id:'first',title:'First',section:'',render:()=> <Lesson/>}]};`);
 await fs.writeFile(path.join(moduleDir,'Guide.tsx'),`import React,{useState} from 'react';export default function Guide(){const [n,setN]=useState(0);return <main><h2>Embedded {new URLSearchParams(window.location.search).get('demo')}</h2><button onClick={()=>setN(n+1)}>Embedded count {n}</button></main>}`);
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="blue"/></svg>';
 await fs.writeFile(path.join(assetDir,'icons/icon-1.svg'),svg);await fs.writeFile(path.join(assetDir,'icons/icon-2.svg'),svg);
 await fs.mkdir(path.join(assetDir,'scenedeck-thumbnails'));
 execFileSync(process.env.IDL_PYTHON||'python',['-c','from PIL import Image;import sys;Image.new("RGB",(160,90),"blue").save(sys.argv[1])',path.join(assetDir,'scenedeck-thumbnails/first.png')]);
 await fs.writeFile(path.join(assetDir,'unused.svg'),'UNUSED_ASSET_MUST_NOT_TRAVEL');
 await fs.mkdir(path.join(folder,'assets/unrelated-module'),{recursive:true});
 await fs.writeFile(path.join(folder,'assets/unrelated-module/unrelated.svg'),'ANOTHER_MODULE_MUST_NOT_TRAVEL');
 const base={goal:'',summary:'',note:'',ready:true,designed:true,revisions:[],messages:[]};
 const project={version:1,id:'fixture',courseId:'offline-fixture',title:'One module',duration:20,style:'simple',outlineConfirmed:true,pages:[{...base,id:'first',nativeId:'first',title:'First'},{...base,id:'second',format:'text',title:'Second',summary:'Saved text page'}]};
 await fs.writeFile(path.join(folder,'project.json'),JSON.stringify(project));
 const out=path.join(folder,'dist');
 execFileSync(process.execPath,[path.join(root,'scripts/build-shuku-preview.mjs'),'--course-root',folder,'--module',moduleDir,'--project',path.join(folder,'project.json'),'--revision','11111111-1111-4111-8111-111111111111','--outdir',out,'--offline','1'],{cwd:root,stdio:'pipe'});
 const sealed=await fs.readFile(path.join(out,'index.html'),'utf8');
 const html=gunzipSync(Buffer.from(sealed.match(/id="offline-payload"[^>]*>([^<]+)/)[1],'base64')).toString('utf8');
 assert.ok(!html.includes('UNUSED_ASSET_MUST_NOT_TRAVEL'));assert.ok(!html.includes('ANOTHER_MODULE_MUST_NOT_TRAVEL'));
 assert.equal((html.match(/type="application\/octet-stream"/g)||[]).length,2,'identical dynamic images stored once, plus one thumbnail');
 // Move ONLY index.html: the original output folder is not available to the viewer.
 const portable=path.join(folder,'portable.html');await fs.rename(path.join(out,'index.html'),portable);await fs.rm(out,{recursive:true,force:true});
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({offline:true,viewport:{width:1600,height:1000}}),page=await context.newPage(),errors=[],network=[];
 await context.addInitScript(()=>{try{localStorage.setItem('scenedeck:creator:v1:guest:11111111-1111-4111-8111-111111111111',JSON.stringify({version:1,courseId:'offline-fixture',title:'Old cached outline',duration:20,style:'simple',outlineConfirmed:true,pages:[{id:'stale',title:'Stale page',goal:'',summary:'',note:'',designed:true,ready:true,revisions:[],messages:[]}]}));}catch{}});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(pathToFileURL(portable).href);
 await page.getByRole('heading',{name:'Original interactive lesson'}).waitFor();
 assert.equal(await page.locator('select[aria-label="切换课程"]').count(),0);
 assert.equal(await page.locator('.cw-course-context strong').innerText(),'One module');
 await page.getByRole('button',{name:'Count 1',exact:true}).click();await page.getByRole('button',{name:'Count 2',exact:true}).waitFor();
 await page.waitForFunction(()=>{const image=document.querySelector('img[alt="Dynamic lesson image"]');return image?.complete&&image.naturalWidth>0;});
 const embed=page.frameLocator('iframe');await embed.getByRole('heading',{name:'Embedded 1',exact:true}).waitFor();
 await embed.getByRole('button',{name:'Embedded count 0'}).click();await embed.getByRole('button',{name:'Embedded count 1'}).waitFor();
 await page.locator('.offline-page').nth(1).click();await page.getByRole('heading',{name:'Second',exact:true}).waitFor();
 await page.locator('.offline-page').nth(0).click();await page.getByRole('button',{name:'Count 1',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'编辑',exact:true}).count(),0);
 assert.equal(await page.locator('.offline-page').count(),2,'old cached outline cannot replace this file');
 assert.equal(await page.locator('.cw-offline-navigation .cw-ppt-thumb').count(),1);
 assert.equal(await page.locator('.cw-offline-row').count(),1,'missing thumbnail uses a compact title row');
 assert.equal(await page.locator('.offline-section').count(),0,'no nested chapter tree');
 await page.locator('.cw-offline-navigation img').evaluate(image=>{image.src='file:///missing-offline-thumbnail.png';});
 await page.waitForFunction(()=>document.querySelectorAll('.cw-offline-row').length===2);

 const corrupt=path.join(folder,'corrupt.html');await fs.writeFile(corrupt,sealed.replace(/(id="offline-payload"[^>]*>)[A-Za-z0-9+/]/,'$1A'));
 const damaged=await context.newPage();await damaged.goto(pathToFileURL(corrupt).href);await damaged.getByRole('status').filter({hasText:/无法打开离线课程/}).waitFor();await damaged.close();
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 // The default download is now ZIP; verify extraction into a fresh directory.
 const zipOut=path.join(folder,'zip-build'),extracted=path.join(folder,'unzipped');
 execFileSync(process.execPath,[path.join(root,'scripts/build-shuku-preview.mjs'),'--course-root',folder,'--module',moduleDir,'--project',path.join(folder,'project.json'),'--revision','11111111-1111-4111-8111-111111111111','--outdir',zipOut,'--offline','1','--zip','1'],{cwd:root,stdio:'pipe'});
 execFileSync(process.env.IDL_PYTHON||'python',['-c','import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;z.extractall(sys.argv[2])',path.join(zipOut,'course.zip'),extracted]);
 const entry=path.join(extracted,'打开课件.html'),zipHtml=await fs.readFile(entry,'utf8');
 assert.ok(!zipHtml.includes('offline-payload'),'ZIP entry does not encode the document');
 const zipPage=await context.newPage();zipPage.on('pageerror',e=>errors.push(e.message));zipPage.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await zipPage.goto(pathToFileURL(entry).href);await zipPage.getByRole('button',{name:'Count 1',exact:true}).click();await zipPage.getByRole('button',{name:'Count 2',exact:true}).waitFor();
 await zipPage.waitForFunction(()=>{const image=document.querySelector('img[alt="Dynamic lesson image"]');return image?.complete&&image.naturalWidth>0;});
 await zipPage.frameLocator('iframe').getByRole('button',{name:'Embedded count 0'}).click();await zipPage.frameLocator('iframe').getByRole('button',{name:'Embedded count 1'}).waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log('PASS single HTML and extracted ZIP: React interaction, dynamic images, deduplication, text pages, navigation, embedded lesson and no network');
} finally {
 await browser?.close();
 await fs.rm(folder,{recursive:true,force:true});
}
