// Compile a real React fixture; verify the original player and its slide-only editor view.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),folder=await fs.mkdtemp(path.join(os.tmpdir(),'shuku-slide-test-'));
let browser;
try{
 const revision='11111111-1111-4111-8111-111111111111';
 const project={version:1,id:'project',courseId:'custom-fixture',title:'Original React lesson',duration:20,style:'simple',outlineConfirmed:true,source:{files:{'Lesson.tsx':"import React,{useState} from 'react';export default function Lesson(){const [n,setN]=useState(0);return <main><h1>Real source lesson</h1><button onClick={()=>setN(n+1)}>Count {n}</button></main>}"}},pages:[{id:'first',format:'react',sourceEntry:'Lesson.tsx',title:'First page',goal:'Learn',summary:'Original source',note:'private-note',ready:true,designed:true,revisions:[],messages:[]}]};
 await fs.writeFile(path.join(folder,'project.json'),JSON.stringify(project));
 execFileSync(process.execPath,['scripts/build-shuku-preview.mjs','--project',path.join(folder,'project.json'),'--revision',revision,'--outdir',path.join(folder,'dist'),'--player','1'],{stdio:'pipe'});
 const html=await fs.readFile(path.join(folder,'dist/index.html'),'utf8');
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__source-preview__/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));
 const base='http://localhost:5175/__source-preview__/index.html';
 await page.goto(base+'?shukuPage=first');await page.getByRole('heading',{name:'Real source lesson'}).waitFor();assert.equal(await page.locator('.cw-app').count(),0,'no nested player toolbar or navigation');await page.getByRole('button',{name:'Count 0'}).click();await page.getByRole('button',{name:'Count 1'}).waitFor();
 await page.goto(base);await page.locator('.cw-app.cw-reader').waitFor();await page.getByRole('heading',{name:'Real source lesson'}).waitFor();await page.getByRole('button',{name:'讲稿',exact:true}).waitFor();assert.equal(await page.locator('iframe').count(),0,'normal playback stays in the original player');
 await page.goto(base+'?shukuPage=missing');await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('heading',{name:'Real source lesson'}).count(),0);
 assert.deepEqual(errors,[]);console.log('PASS real compiled React page, interactive state, slide-only editor embed, original full player and missing-page handling');
}finally{await browser?.close();await fs.rm(folder,{recursive:true,force:true});}
