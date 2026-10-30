import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {prepareFramework} from './prepare-authoring-framework.mjs';
test('operator prepares pinned complete framework, reuses it, and refuses dirty cache',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'authoring-cache-test-'));
 try{
  const source=path.join(root,'source');await fs.mkdir(source);const git=(...args)=>execFileSync('git',['-C',source,...args],{encoding:'utf8',stdio:'pipe'}).trim();
  git('init');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');
  for(const file of ['creator-skills/SKILL.md','creator-skills/shared/react/index.ts','environment/frontend/package.json','runtime/frontend/index.html']){await fs.mkdir(path.dirname(path.join(source,file)),{recursive:true});await fs.writeFile(path.join(source,file),'fixture');}
  git('add','.');git('commit','-m','fixture');const commit=git('rev-parse','HEAD');
  await fs.writeFile(path.join(root,'local-authoring.lock.json'),JSON.stringify({repository:'https://github.com/reduct-shuku/course-template.git',commit}));
  const folder=await prepareFramework(root,source);assert.equal(await prepareFramework(root,source),folder);
  await fs.writeFile(path.join(folder,'creator-skills/SKILL.md'),'modified');await assert.rejects(prepareFramework(root,source),/modified/);
  await fs.writeFile(path.join(root,'local-authoring.lock.json'),JSON.stringify({repository:'https://untrusted.invalid/template.git',commit}));await assert.rejects(prepareFramework(root,source),/Invalid/);
 }finally{assert.ok(path.basename(root).startsWith('authoring-cache-test-'));await fs.rm(root,{recursive:true,force:true});}
});
