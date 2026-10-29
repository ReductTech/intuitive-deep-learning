import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {EventEmitter} from 'node:events';
import {offlinePreview} from './offline-preview-vite.ts';

test('local static manifests return JSON while warming, serve JSON when ready and never fall back to HTML',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'offline-static-test-'));let server;
 try{
  await fs.mkdir(path.join(root,'node_modules/vite/bin'),{recursive:true});
  await fs.mkdir(path.join(root,'modules/shared'),{recursive:true});
  await fs.writeFile(path.join(root,'modules/shared/asset-index.json'),' {"roots":{},"formats":{}}');
  await fs.writeFile(path.join(root,'node_modules/vite/bin/vite.js'),`const fs=require('fs'),path=require('path');setTimeout(()=>{const out=process.argv[process.argv.indexOf('--outDir')+1];fs.mkdirSync(path.join(out,'offline-runtime/courses'),{recursive:true});fs.writeFileSync(path.join(out,'offline-runtime/courses/fixture.json'),JSON.stringify({files:[],entry:'fixture.js'}));},100);`);
  let middleware;
  server=http.createServer((req,res)=>{req.url=req.url.replace(/^\/_offline/,'');middleware(req,res,()=>{res.statusCode=500;res.end('unexpected SPA fallback');});});
  const plugin=offlinePreview(root,root);
  plugin.configureServer({middlewares:{use(_prefix,handler){middleware=handler;}},watcher:new EventEmitter(),httpServer:server,config:{logger:{info(){},error(){}}}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/_offline/';
  const warming=await fetch(base+'offline-runtime/courses/fixture.json');
  assert.equal(warming.status,503);assert.match(warming.headers.get('content-type'),/application\/json/);assert.ok((await warming.json()).error);
  let ready;
  for(let i=0;i<100;i++){ready=await fetch(base+'offline-runtime/courses/fixture.json');if(ready.status===200)break;await new Promise(resolve=>setTimeout(resolve,50));}
  assert.equal(ready.status,200);assert.deepEqual((await ready.json()).files,[]);
  const missing=await fetch(base+'offline-runtime/courses/missing.json');assert.equal(missing.status,404);assert.match(missing.headers.get('content-type'),/json/);assert.ok((await missing.json()).error);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));assert.ok(root.startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
});
