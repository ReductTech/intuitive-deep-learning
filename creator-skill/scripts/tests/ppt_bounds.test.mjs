import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script = fileURLToPath(new URL('../validate_ppt_bounds.mjs', import.meta.url));
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
  constructor() {queueMicrotask(()=>this.onopen());}
  send(raw) {
    const request = JSON.parse(raw);
    let result = {};
    if (request.method === 'Runtime.evaluate' && request.params.returnByValue) {
      assert(request.params.expression.includes('.test-slide'));
      const value = process.env.MOCK_BOUNDS === 'missing' ? {error:'missing slide surface'} : {overflowCount:Number(process.env.MOCK_BOUNDS || 0)};
      result = {result:{value}};
    }
    queueMicrotask(()=>this.onmessage({data:JSON.stringify({id:request.id,result})}));
  }
  close() {}
};
process.on('exit',()=>assert(closed, 'the tool must close only its own inspection tab'));
`;
for (const [state, exitCode] of [['0',0], ['1',1], ['missing',1]]) {
  test(`bounds command returns ${exitCode} for ${state}`,()=>{
    const result = spawnSync(process.execPath, [
      '--import', 'data:text/javascript,' + encodeURIComponent(mock), script,
      '--url','http://localhost:5173/scenedeck/?deck=demo', '--slides','one', '--surface','.test-slide',
    ], {encoding:'utf8',env:{...process.env, MOCK_BOUNDS:state},timeout:8000});
    assert.equal(result.status, exitCode, result.stderr);
    assert(result.stdout.includes(state === 'missing' ? 'missing slide surface' : 'overflowCount'));
  });
}
