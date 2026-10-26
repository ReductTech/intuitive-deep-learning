// Export implemented scenes from the same Vite snapshot used by the website.
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url=process.argv[3]||'http://127.0.0.1:5178';assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname));
const lock=JSON.parse(await fs.readFile(path.join(root,'course-library.lock.json'),'utf8'));
const library=path.resolve(root,process.argv[4]||'.course-library/'+lock.commit);
const commit=process.argv[5]||execFileSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.match(commit,/^[a-f0-9]{40}$/);
const relative=path.relative(root,library).replaceAll('\\','/');assert.ok(relative.startsWith('.course-library/'));
const manifest=JSON.parse(await fs.readFile(path.join(library,'course-library.json'),'utf8'));assert.equal(manifest.repository,'reduct-shuku/intuitive-deep-learning');
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href),browser=await chromium.launch({channel:process.env.SHUKU_E2E_BROWSER_CHANNEL||'chrome',headless:true});
let modules;
try{const page=await browser.newPage();await page.goto(url);modules=await page.evaluate(async expected=>{const served=await fetch('/src/app/modules.tsx').then(r=>r.text());if(!served.includes(expected+'/modules/'))throw Error('Vite is not serving the requested independent snapshot');const {activeModules}=await import('/src/app/modules.tsx');return Object.fromEntries(activeModules.filter(m=>m.pptDeck).map(m=>[m.assetId,{alias:m.id,title:m.title,scenes:m.pptDeck.scenes.map(s=>({id:s.id,title:s.title}))}]));},relative);}finally{await browser.close();}
const expected=manifest.modules.filter(m=>m.entry&&m.ppt?.entry);assert.equal(Object.keys(modules).length,expected.length);
for(const m of expected){const item=modules[m.uuid];assert.ok(item);assert.equal(item.alias,m.id||m.directory);assert.ok(item.scenes.length>0&&item.scenes.length<=100);assert.equal(new Set(item.scenes.map(s=>s.id)).size,item.scenes.length);}
const files=[];async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){assert.ok(!item.isSymbolicLink());const file=path.join(dir,item.name);if(item.isDirectory())await walk(file);else if(/\.(tsx?|jsx?|json|css|html|svg)$/.test(item.name))files.push(file);}}await walk(path.join(library,'modules'));
const digest=createHash('sha256');for(const file of files.sort()){digest.update(path.relative(path.join(library,'modules'),file).replaceAll('\\','/')+'\0');digest.update(createHash('sha256').update(await fs.readFile(file)).digest());}
const output=path.join(path.dirname(library),'_runtime-'+commit+'.json');await fs.writeFile(output,JSON.stringify({schema:1,commit,module_hash:digest.digest('hex'),modules},null,2)+'\n');console.log('EXPORTED',Object.keys(modules).length,'courses:',output);
