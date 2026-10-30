import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.argv[2]||'.');
const ts=await import(pathToFileURL(path.join(root,'node_modules/typescript/lib/typescript.js')).href);
const source=await fs.readFile(path.join(root,'src/creator/model.ts'),'utf8');
const js=ts.default.transpileModule(source,{compilerOptions:{module:ts.default.ModuleKind.ES2022,target:ts.default.ScriptTarget.ES2022}}).outputText;
const {createProject,preserveExistingWebPages,isProject}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const ids=['shuku-why','shuku-participation','shuku-review','shuku-growth'];
const original=Array.from({length:17},(_,i)=>'original-'+i);
const module={id:'creator-guide',title:'Guide',pages:[],pptDeck:{scenes:[...original,...ids].map(id=>({id,title:id}))}};
const saved=createProject(module);delete saved.sourceSceneIds;saved.pages=saved.pages.slice(0,17);saved.pages[0].note='my notes';saved.pages[0].title='my edited title';saved.pages[0].messages=[{role:'user',text:'my prompt'}];
const updated=preserveExistingWebPages(saved,module);
assert.equal(updated.pages.length,21);assert.deepEqual(updated.pages.slice(-4).map(p=>p.id),ids);assert.equal(updated.pages[0].note,'my notes');assert.equal(updated.pages[0].title,'my edited title');assert.deepEqual(updated.pages[0].messages,saved.pages[0].messages);assert.ok(isProject(updated,module.id));
assert.equal(preserveExistingWebPages(updated,module).pages.length,21);
const deleted={...updated,pages:updated.pages.filter(p=>p.id!==ids[0])};assert.equal(preserveExistingWebPages(deleted,module).pages.length,20,'intentional deletion must persist');
const reordered={...saved,pages:[...saved.pages].reverse().filter(p=>p.id!==original[3])};assert.deepEqual(preserveExistingWebPages(reordered,module).pages.slice(0,16).map(p=>p.id),reordered.pages.map(p=>p.id));
const blank={...saved,pages:[{...saved.pages[0],id:'custom',nativeId:undefined}]};assert.equal(preserveExistingWebPages(blank,module).pages.length,1);
const bad={...updated,sourceSceneIds:42};assert.equal(isProject(bad,module.id),false);
console.log('PASS saved course updates: legacy 17→21, edits preserved, no duplicates, deletions/reordering/blank projects preserved.');
if(process.argv[3]){
 const {chromium}=await import(pathToFileURL(path.resolve(process.argv[3])).href);
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();page.setDefaultTimeout(60000);
  const base=process.env.SHUKU_SLIDES_URL||'http://localhost:5175',password=process.env.SHUKU_E2E_PASSWORD;assert.ok(password,'Set SHUKU_E2E_PASSWORD for browser checks');const auth=await page.request.post(base+'/api/shuku/auth/login',{headers:{Origin:base},data:{username:'xiaoman',password}});assert.equal(auth.status(),200);
  await page.goto(base+'/scenedeck/?deck=creator-guide');
  await page.waitForFunction(()=>localStorage.getItem('scenedeck:creator:v1:creator-guide'));
  await page.evaluate(()=>{const key='scenedeck:creator:v1:creator-guide',p=JSON.parse(localStorage.getItem(key));p.pages=p.pages.filter(p=>!p.id.startsWith('shuku-'));delete p.sourceSceneIds;p.pages[0].note='retained test note';localStorage.setItem(key,JSON.stringify(p));});
  await page.reload();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('scenedeck:creator:v1:creator-guide')).pages.length===21);
  for(const id of ids){await page.goto(base+'/scenedeck/?deck=creator-guide&slide='+id);await page.locator('.cg-shuku-page').waitFor();}
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('scenedeck:creator:v1:creator-guide')).pages[0].note),'retained test note');
  console.log('PASS authenticated 术库 entry: saved 17-page project receives and renders all four new pages.');
 }finally{await browser.close();}
}
