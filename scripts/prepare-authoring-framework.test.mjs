import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {prepareFramework,runFrameworkGit,fetchFramework,downloadFailure} from './prepare-authoring-framework.mjs';
test('operator prepares pinned complete framework, reuses it, and refuses dirty cache',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'authoring-cache-test-'));
 try{
  const source=path.join(root,'source');await fs.mkdir(source);const git=(...args)=>execFileSync('git',['-C',source,...args],{encoding:'utf8',stdio:'pipe'}).trim();
  git('init');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');
  for(const file of ['creator-skills/SKILL.md','creator-skills/shared/react/index.ts','environment/frontend/package.json','runtime/frontend/index.html']){await fs.mkdir(path.dirname(path.join(source,file)),{recursive:true});await fs.writeFile(path.join(source,file),'fixture');}
  git('add','.');git('commit','-m','fixture');const commit=git('rev-parse','HEAD');
  await fs.writeFile(path.join(root,'local-authoring.lock.json'),JSON.stringify({repository:'https://github.com/reduct-shuku/course-template.git',commit}));
  const folder=await prepareFramework(root,source);assert.equal(await prepareFramework(root,source),folder);
  assert.equal(execFileSync('git',['-C',folder,'rev-parse','--is-shallow-repository'],{encoding:'utf8'}).trim(),'true');
  await fs.writeFile(path.join(folder,'creator-skills/SKILL.md'),'modified');await assert.rejects(prepareFramework(root,source),/缓存存在修改/);
  await fs.writeFile(path.join(root,'local-authoring.lock.json'),JSON.stringify({repository:'https://untrusted.invalid/template.git',commit}));await assert.rejects(prepareFramework(root,source),/锁定无效/);
 }finally{assert.ok(path.basename(root).startsWith('authoring-cache-test-'));await fs.rm(root,{recursive:true,force:true});}
});
test('network fetch is visible, noninteractive and bounded, with a useful timeout error',()=>{
 const command=['fetch','--depth=1','origin','a'.repeat(40)];
 assert.throws(()=>runFrameworkGit('fixture',command,{network:true,run:(binary,args,options)=>{
  assert.equal(binary,'git');assert.ok(args.includes('http.lowSpeedTime=60'));
  assert.equal(options.timeout,300000);assert.equal(options.killSignal,'SIGKILL');
  assert.deepEqual(options.stdio,['ignore','inherit','inherit']);
  assert.equal(options.env.GIT_TERMINAL_PROMPT,'0');
  throw Object.assign(new Error('timeout'),{code:'ETIMEDOUT'});
 }}),/Git 操作超时（300 秒）/);
});
function fakeChild(){const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>{};return child;}
test('download translates real progress and keeps logging while the network is silent',async()=>{
 const child=fakeChild(),logs=[];
 const promise=fetchFramework('fixture','commit',{spawnProcess:()=>child,heartbeatMs:5,log:line=>logs.push(line)});
 child.stderr.write('Receiving objects: 50% (5/10)\r');
 await new Promise(resolve=>setTimeout(resolve,18));child.emit('close',0);await promise;
 assert.ok(logs.some(line=>line.includes('接收框架数据 [█████░░░░░] 50%')));
 assert.ok(logs.some(line=>line.includes('已用')&&line.includes('单次上限')));
});
test('TLS failures are explained, permission failures do not retry, and timeout kills the download',async()=>{
 assert.match(downloadFailure('GnuTLS recv error (-9); early EOF'),/连接中断/);
 for(const [detail,retryable]of[['fatal: early EOF',true],['fatal: Authentication failed',false]]){
  const child=fakeChild();const result=fetchFramework('fixture','commit',{spawnProcess:()=>child,log:()=>{}});
  child.stderr.write(detail);child.emit('close',128);
  await assert.rejects(result,error=>error.retryable===retryable);
 }
 const child=fakeChild();let killed=false;child.kill=()=>{killed=true;};
 await assert.rejects(fetchFramework('fixture','commit',{spawnProcess:()=>child,timeoutMs:10,log:()=>{}}),/下载超时/);
 assert.ok(killed);
});
