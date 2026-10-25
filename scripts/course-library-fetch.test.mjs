import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fetchLibrary,repository} from './course-library-fetch.mjs';
function git(root,...args){return execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
test('fixed snapshots, explicit upgrades and dirty snapshot rejection',async t=>{
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'course-fetch-test-'));assert.equal(path.dirname(folder),path.resolve(os.tmpdir()));
 t.after(()=>fs.rm(folder,{recursive:true,force:true}));
 const upstream=path.join(folder,'upstream'),platform=path.join(folder,'platform');await fs.mkdir(upstream);await fs.mkdir(platform);
 git(upstream,'init','-b','main');
 await fs.writeFile(path.join(upstream,'course-library.json'),JSON.stringify({schema:1,repository,modules:[{id:'course-a'}]}));
 await fs.writeFile(path.join(upstream,'source-lock.json'),JSON.stringify({repository:'ReductTech/intuitive-deep-learning',commit:'a'.repeat(40)}));
 function commit(){git(upstream,'add','.');git(upstream,'-c','user.name=Test','-c','user.email=test@example.com','commit','-m','snapshot');return git(upstream,'rev-parse','HEAD');}
 const first=commit();await fs.writeFile(path.join(platform,'course-library.lock.json'),JSON.stringify({repository,commit:first}));
 const old=await fetchLibrary(platform,{remote:upstream});assert.equal(git(old,'rev-parse','HEAD'),first);
 await fs.writeFile(path.join(upstream,'new-course.txt'),'new course');const second=commit();
 assert.equal(await fetchLibrary(platform,{remote:upstream}),old,'a changed main must not silently replace a locked snapshot');
 const next=await fetchLibrary(platform,{remote:upstream,latest:true});assert.notEqual(old,next);assert.equal(git(next,'rev-parse','HEAD'),second);assert.equal(JSON.parse(await fs.readFile(path.join(platform,'course-library.lock.json'),'utf8')).commit,second);
 await fs.writeFile(path.join(next,'new-course.txt'),'independent edit');await assert.rejects(()=>fetchLibrary(platform,{remote:upstream}),/not clean/);
});
