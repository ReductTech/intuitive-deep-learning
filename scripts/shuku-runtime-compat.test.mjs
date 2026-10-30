import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {sandboxMathLive} from './shuku-runtime-compat.mjs';

test('pinned math keyboard targets the host URL origin in an opaque sandbox',()=>{
 const source='class Keyboard{constructor(){this.targetOrigin=window.origin}};globalThis.result=new Keyboard().targetOrigin';
 const context={window:{origin:'null'},document:{referrer:'https://shuku.example/my-courses'},location:{href:'https://shuku.example/api/shuku/revisions/id/files/index.html'},URL};
 vm.runInNewContext(sandboxMathLive(source),context);
 assert.equal(context.result,'https://shuku.example');
 context.document.referrer='';vm.runInNewContext(sandboxMathLive(source.replaceAll('Keyboard','Another')),context);
 assert.equal(context.result,'https://shuku.example');
 assert.throws(()=>sandboxMathLive('unrecognized vendor version'),/Unsupported pinned/);
});
