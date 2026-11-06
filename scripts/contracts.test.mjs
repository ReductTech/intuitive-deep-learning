import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {modules,root} from './modules.mjs';

test('course IDs and asset UUIDs are unique; practical courses and draft are preserved',async()=>{
 const all=await modules();
 const ids=all.filter(m=>m.ready).map(m=>m.outline.moduleIdentity.id);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ['ai-practice-education','ai-practice-education-spp','creator-guide'])assert.ok(all.some(m=>m.outline.id===id&&m.ready));
 assert.ok(all.some(m=>m.name==='Professional-Creator-Guide'&&!m.ready));
});

test('the simple example contains both guide and presentation entries',async()=>{
 const example=(await modules()).find(m=>m.outline.id==='basic-example');
 assert.ok(example.outline.entry&&example.outline.ppt.entry);
 assert.equal(example.outline.pages.length,1);
});

test('business services and Creator Skill are independent of the course repository',async()=>{
 for(const name of ['src/shuku','backend','creator-skill','web_agent'])await assert.rejects(fs.access(path.join(root,name)),{code:'ENOENT'});
});

test('3D models reference image files that still exist after media conversion',async()=>{
 async function visit(directory){
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
   const file=path.join(directory,entry.name);
   if(entry.isDirectory()){await visit(file);continue;}
   let document;
   if(file.endsWith('.gltf'))document=JSON.parse(await fs.readFile(file,'utf8'));
   else if(file.endsWith('.glb')){const bytes=await fs.readFile(file);const length=bytes.readUInt32LE(12);document=JSON.parse(bytes.subarray(20,20+length).toString('utf8'));}
   else continue;
   for(const image of document.images||[]){
    if(!image.uri||/^(?:data:|https?:)/.test(image.uri))continue;
    const target=path.resolve(path.dirname(file),decodeURIComponent(image.uri));
    assert.ok(target.startsWith(path.join(root,'modules')+path.sep));await fs.access(target);
   }
  }
 }
 await visit(path.join(root,'modules'));
});

test('built manifests match every delivered byte and contain no TSX or source maps',async t=>{
 let catalog;try{catalog=JSON.parse(await fs.readFile(path.join(root,'dist/catalog.json'),'utf8'));}catch(e){if(e.code==='ENOENT'){t.skip('Build a course first');return;}throw e;}
 assert.equal(catalog.kind,'idl-built-catalog');
 for(const module of catalog.modules){
  const directory=path.resolve(root,'dist',module.base);
  assert.ok(directory.startsWith(path.join(root,'dist')));
  const manifest=JSON.parse(await fs.readFile(path.join(root,'dist',module.manifest),'utf8'));
  assert.equal(manifest.module_id,module.id);assert.equal(manifest.revision,module.revision);
  assert.ok(manifest.files.some(f=>f.path==='index.html'));
  assert.ok(manifest.files.some(f=>f.path==='course.json'));
  for(const record of manifest.files){
   assert.ok(!/\.(?:tsx?|jsx|map|vue|svelte)$/i.test(record.path));
   const file=path.resolve(directory,record.path);assert.ok(file.startsWith(directory+path.sep));
   const bytes=await fs.readFile(file);assert.equal(bytes.length,record.size);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.sha256);
  }
 }
});
