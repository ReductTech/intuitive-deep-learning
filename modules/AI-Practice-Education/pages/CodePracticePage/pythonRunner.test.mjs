import test from 'node:test';
import assert from 'node:assert/strict';
import {PythonRunner} from './pythonRuntime.ts';

test('online Worker URL is retained; initialization and execution have separate deadlines', async t => {
 t.mock.timers.enable({apis:['setTimeout']});
 const original=globalThis.Worker,workers=[];
 class FakeWorker {
  constructor(url,options){this.url=url;this.options=options;workers.push(this);}
  postMessage(message){this.sent=message;}
  terminate(){this.terminated=true;}
  emit(data){this.onmessage({data});}
 }
 globalThis.Worker=FakeWorker;
 const runner=new PythonRunner(()=>{});
 try {
  const initializing=runner.run('first');
  const failure=assert.rejects(initializing,/初始化超时/);
  assert.match(workers[0].url.href,/\/python\.worker\.ts$/);
  assert.deepEqual(workers[0].options,{type:'module'});
  t.mock.timers.tick(60000);await failure;assert.equal(workers[0].terminated,true);
  const retried=runner.run('second');workers[1].emit({type:'ready'});await Promise.resolve();
  workers[1].emit({type:'result',id:workers[1].sent.id,execution:{ok:true}});
  assert.equal((await retried).ok,true);
  const looping=runner.run('while True: pass');await Promise.resolve();
  const stopped=assert.rejects(looping,/超过 8 秒/);t.mock.timers.tick(8000);await stopped;
 } finally {runner.stop();globalThis.Worker=original;t.mock.timers.reset();}
});

test('older offline ZIP fails clearly instead of attempting the online runtime',async()=>{
 const previous=globalThis.__SHUKU_OFFLINE__;globalThis.__SHUKU_OFFLINE__=true;
 try{await assert.rejects(new PythonRunner(()=>{}).run('pass'),/重新下载课件/);}
 finally{if(previous===undefined)delete globalThis.__SHUKU_OFFLINE__;else globalThis.__SHUKU_OFFLINE__=previous;}
});
