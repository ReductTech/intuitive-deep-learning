import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script = fileURLToPath(new URL('../checks/validate_ppt_bounds.mjs', import.meta.url));
// Mock the CDP transport. No browser, server or network is used by these tests.
const mock = `
import assert from 'node:assert/strict';
let closed = false;
globalThis.fetch = async address => {
  const url = new URL(address);
  assert.equal(url.hostname, '127.0.0.1');
  if (url.pathname === '/json/new') {
    const target = new URL(decodeURIComponent(url.search.slice(1)));
    assert.equal(target.searchParams.get('deck'), 'demo');
    assert.equal(target.searchParams.get('slide'), 'one');
    return {ok:true,json:async()=>({id:'owned-tab',webSocketDebuggerUrl:'ws://mock'})};
  }
  assert.equal(url.pathname, '/json/close/owned-tab');
  closed = true;
  return {ok:true};
};
globalThis.WebSocket = class {
  inspections = 0;
  constructor() {queueMicrotask(()=>this.onopen());}
  send(raw) {
    const request = JSON.parse(raw);
    let result = {};
    if (request.method === 'Runtime.evaluate' && request.params.returnByValue) {
      assert(request.params.expression.includes(process.env.MOCK_SURFACE));
      this.inspections++;
      const mode = process.env.MOCK_BOUNDS;
      const unavailable = mode === 'missing' || (mode === 'delayed' && this.inspections < 2);
      const value = unavailable ? {ready:false,status:'unverified',error:'missing slide surface',text:{characters:null}} : {ready:true,status:mode === '1' ? 'failed' : 'passed',overflowCount:mode === '1' ? 1 : 0,text:{characters:10,maximum:null}};
      result = {result:{value}};
    }
    queueMicrotask(()=>this.onmessage({data:JSON.stringify({id:request.id,result})}));
  }
  close() {}
};
process.on('exit',()=>assert(closed, 'the tool must close only its own inspection tab'));
`;
for (const [state, exitCode, surface] of [['0',0,'.test-slide'], ['1',1,'.test-slide'], ['missing',2,'.test-slide'], ['0',0,null], ['delayed',0,'.test-slide']]) {
  test(`bounds command returns ${exitCode} for ${state} (${surface || "Shared default surface"})`,()=>{
    const result = spawnSync(process.execPath, [
      '--import', 'data:text/javascript,' + encodeURIComponent(mock), script,
      '--url','http://localhost:5173/scenedeck/?deck=demo', '--slides','one', ...(surface ? ['--surface',surface] : []),
      '--timeout', state === 'missing' ? '1' : '1000',
    ], {encoding:'utf8',env:{...process.env, MOCK_BOUNDS:state,MOCK_SURFACE:surface || '.ppt-slide-surface'},timeout:8000});
    assert.equal(result.status, exitCode, result.stderr);
    assert(result.stdout.includes(state === 'missing' ? 'missing slide surface' : 'overflowCount'));
    const report = JSON.parse(result.stdout);
    assert.equal(report.slides[0].text.characters, state === 'missing' ? null : 10);
  });
}
