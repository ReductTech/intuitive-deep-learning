import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assetRoots,assetDirectory} from './module-assets.mjs';

test('module ownership preserves UUID URLs and resolves old snapshots',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'module-assets-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const module=path.join(root,'modules/Example');fs.mkdirSync(module,{recursive:true});
 fs.writeFileSync(path.join(module,'outlines.json'),JSON.stringify({moduleIdentity:{id:'stable-id'}}));
 fs.mkdirSync(path.join(module,'assets'));
 assert.equal(assetRoots(root)['stable-id'],'modules/Example/assets');
 assert.equal(assetDirectory(root,'stable-id'),path.join(module,'assets'));
 fs.rmdirSync(path.join(module,'assets'));
 fs.mkdirSync(path.join(root,'assets/stable-id'),{recursive:true});
 assert.equal(assetDirectory(root,'stable-id'),path.join(root,'assets/stable-id'));
});
