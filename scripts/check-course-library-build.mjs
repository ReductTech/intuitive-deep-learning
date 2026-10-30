import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import {courseLibraryRoot} from './course-library-vite.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.ok(process.env.IDL_COURSE_LIBRARY_ROOT,'Select an independent course snapshot');
const library=courseLibraryRoot(root,process.env.IDL_COURSE_LIBRARY_ROOT).replaceAll('\\','/');
await build({root,plugins:[{name:'verify-independent-course-imports',generateBundle(){
 const ids=[...this.getModuleIds()].map(id=>id.split('?')[0].replaceAll('\\','/'));
 const external=ids.filter(id=>id.startsWith(library+'/modules/')&&id.endsWith('.tsx'));
 const original=ids.filter(id=>id.startsWith(root.replaceAll('\\','/')+'/modules/')&&id.endsWith('.tsx'));
 assert.ok(external.length>16,'Independent course components were not loaded');assert.deepEqual(original,[],'Course code fell back to the editing repository');
 console.log('PASS independent course graph:',external.length,'TSX modules; no original course component imports');
 }}]});
await fs.access(path.join(root,'dist/index.html'));
