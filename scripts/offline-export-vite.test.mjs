import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {offlineExport} from './offline-export-vite.ts';

test('concurrent export requests queue and never share compilation directories',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'shuku-export-queue-'));
 let server;
 try{
  await fs.mkdir(path.join(root,'scripts'));await fs.mkdir(path.join(root,'modules/Fixture'),{recursive:true});
  await fs.writeFile(path.join(root,'modules/Fixture/outlines.json'),JSON.stringify({id:'fixture',ppt:{entry:'Entry.tsx'}}));
  await fs.writeFile(path.join(root,'scripts/build-shuku-preview.mjs'),`
   import fs from 'node:fs/promises';import path from 'node:path';
   const out=process.argv[process.argv.indexOf('--outdir')+1];
   const lock=path.join(process.cwd(),'active-build');await fs.writeFile(lock,'active',{flag:'wx'});
   await new Promise(resolve=>setTimeout(resolve,150));await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'course.zip'),'PK queue-test');await fs.rm(lock);
  `);
  const middleware={use(_prefix,handler){server=http.createServer((req,res)=>{req.url='/';handler(req,res,()=>{res.statusCode=404;res.end();});});}};
  offlineExport(root,root).configureServer({middlewares:middleware,config:{logger:{error:message=>assert.fail(message)}}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const body=JSON.stringify({version:1,courseId:'fixture',title:'Fixture',pages:[{id:'one',title:'One'}]});
  const responses=await Promise.all([1,2,3].map(()=>fetch(origin,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body})));
  for(const response of responses){assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/zip');assert.equal(await response.text(),'PK queue-test');}
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});
 }
});
