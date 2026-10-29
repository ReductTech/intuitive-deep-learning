import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const document=path.join(repo,'docs/CIDL前后端与课程存储解耦迁移方案.md');
function localTargets(markdown){
  return [...markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
    .map(match=>match[1].replace(/^<|>$/g,''))
    .filter(target=>!target.startsWith('#')&&!/^[a-z][a-z0-9+.-]*:/i.test(target))
    .map(target=>decodeURIComponent(target.split('#')[0]));
}

test('migration document source links resolve inside the repository',async()=>{
  const markdown=await fs.readFile(document,'utf8');
  const targets=[...new Set(localTargets(markdown))];
  assert(targets.length>0,'Migration source map must contain actual file links');
  for(const target of targets){
    const resolved=path.resolve(path.dirname(document),target);
    assert(resolved.startsWith(repo+path.sep),'Source link leaves repository: '+target);
    const stat=await fs.stat(resolved);
    assert(stat.isFile()||stat.isDirectory(),'Invalid source path: '+target);
  }
});

test('source-link validation excludes web citations and document anchors',()=>{
  assert.deepEqual(localTargets('[source](../src/App.tsx) [web](https://example.test) [section](#target) [encoded](../docs/a%20b.md#note)'),['../src/App.tsx','../docs/a b.md']);
});
