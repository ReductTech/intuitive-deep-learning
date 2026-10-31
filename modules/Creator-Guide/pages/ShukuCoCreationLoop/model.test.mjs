import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLoop,loopReducer,canPublish,gradientSteps} from './model.ts';
test('only reviewed and accepted contributions can enter a published version',()=>{
 let s=initialLoop();assert.equal(loopReducer(s,{type:'publish'}),s);
 assert.equal(loopReducer(s,{type:'decide',id:'learning-rate',decision:'accepted'}),s);
 s=loopReducer(s,{type:'feedback'});assert.equal(s.feedback,true);
 s=loopReducer(s,{type:'submit'});
 s=loopReducer(s,{type:'decide',id:'learning-rate',decision:'accepted'});assert.equal(canPublish(s),false);
 s=loopReducer(s,{type:'decide',id:'image-generation',decision:'rejected'});assert.equal(canPublish(s),true);
 s=loopReducer(s,{type:'publish'});assert.equal(s.published,true);assert.equal(s.decisions['image-generation'],'rejected');
 assert.equal(loopReducer(s,{type:'submit'}),s);
 assert.deepEqual(loopReducer(s,{type:'reset'}),initialLoop());
});
test('rejecting all prevents publication; resubmission requires fresh review',()=>{
 let s=loopReducer(initialLoop(),{type:'submit'});
 for(const id of ['learning-rate','image-generation'])s=loopReducer(s,{type:'decide',id,decision:'rejected'});
 assert.equal(canPublish(s),false);
 assert.equal(loopReducer(s,{type:'publish'}),s);
 assert.deepEqual(loopReducer(s,{type:'submit'}).decisions,initialLoop().decisions);
});
test('learning rate demonstration reflects quadratic gradient descent',()=>{
 const slow=gradientSteps(.1),fast=gradientSteps(.5),oscillating=gradientSteps(1);
 assert.ok(slow.at(-1)<slow[0]);assert.equal(fast[1],0);
 assert.ok(oscillating.every(loss=>loss===1));
});

import {readFileSync,readdirSync} from 'node:fs';
test('text-free assets and both course registrations are included',()=>{
 const outline=JSON.parse(readFileSync(new URL('../../outlines.json',import.meta.url),'utf8'));
 assert.equal(outline.pages.at(-1).id,'shuku-cocreation-loop');
 assert.equal(new Set(outline.pages.map(p=>p.id)).size,outline.pages.length);
 for(const file of ['../../CreatorPpt.tsx','../../CreatorGuide.tsx'])assert.match(readFileSync(new URL(file,import.meta.url),'utf8'),/ShukuCoCreationLoop/);
 assert.deepEqual(readdirSync(new URL('assets/',import.meta.url)).sort(),['cat.png','gradient-surface.png','noise.png']);
 assert.doesNotMatch(readFileSync(new URL('LoopArtwork.tsx',import.meta.url),'utf8'),/loop-reference|ReferenceCrop/);
});
