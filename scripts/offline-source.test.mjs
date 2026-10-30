import test from 'node:test';
import assert from 'node:assert/strict';
import {transform} from 'esbuild';
import {offlineSource} from './offline-source.mjs';

test('browser export preserves online iframe src for nested expressions and switches only offline',async()=>{
 const source=`export const Frame=()=> <iframe title="Example" src={getUrl('lesson', new URL('/modules/test',location.href))}/>;`;
 const result=offlineSource(source,'Frame.tsx',{conditional:true});
 assert.ok(result.includes('globalThis.__SHUKU_OFFLINE__?{srcDoc:'));
 assert.ok(result.includes(":{src:getUrl('lesson', new URL('/modules/test',location.href))}"));
 await transform(result,{loader:'tsx'});
 const legacy=offlineSource(source,'Frame.tsx');assert.ok(legacy.includes('srcDoc={'));await transform(legacy,{loader:'tsx'});
});
