import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.env.SHUKU_CATALOG_URL||'http://127.0.0.1:5192';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const names=['Research-Intelligence-Era'];
const outlines=fs.readdirSync(path.join(root,'modules')).flatMap(directory=>{
 const file=path.join(root,'modules',directory,'outlines.json');
 if(!fs.existsSync(file))return [];
 return [{directory,...JSON.parse(fs.readFileSync(file,'utf8'))}];
});
const courses=outlines.filter(o=>o.entry&&(o.ppt?.entry||o.catalogListed===true)).map(o=>({
 kind:'library',id:o.moduleIdentity.id,module_id:o.moduleIdentity.id,alias:o.id||o.directory,title:o.title,
 description:o.description||'',category:o.badge||'课程',difficulty:o.difficulty||'',page_count:o.pages.length,
 cover_url:null,repository:'reduct-shuku/intuitive-deep-learning',source_commit:'a'.repeat(40),github_url:'https://github.com/reduct-shuku/intuitive-deep-learning',version:'aaaaaaaa'
}));
assert.ok(courses.length>0);
for(const removed of ['ai-learning-exploration','tldraw-demo','llm-practice-education'])assert.ok(!courses.some(course=>course.alias===removed));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/shuku/**',async route=>{
  const p=new URL(route.request().url()).pathname;let body={};
  if(p.endsWith('/public/courses'))body={courses};
  else if(p.includes('/public/library/'))body={course:courses.find(c=>c.alias===decodeURIComponent(p.split('/').at(-1)))};
  else if(p.endsWith('/auth/me'))body={user:{id:'test',role:'learner',display_name:'测试'}};
  else if(p.endsWith('/personal'))body={favorites:[],history:[],favorite_courses:[],next_cursor:null};
  else if(p.endsWith('/messages'))body={messages:[],unread:0};
  else if(p.includes('/personal/study/')){
   const alias=decodeURIComponent(p.split('/').at(-2)).replace('module:','');const o=outlines.find(o=>(o.id||o.directory)===alias);
   body={account_id:'test',state:null,context:{resource:'module:'+alias,title:o.title,version:'builtin',version_label:'测试版本',pages:o.pages.map(p=>p.id),url:'/study?module='+alias,available:true}};
  }else if(p.endsWith('/personal/study'))body={state_version:1};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto(base);await page.getByText(`${courses.length} 门课程`,{exact:true}).waitFor();
 assert.equal(await page.locator('article.sd-library-card').count(),courses.length);
 assert.equal(await page.locator('article[aria-label="Memory Test · 埋点联调模块"]').count(),0);
 for(const name of names){
  const o=outlines.find(o=>o.directory===name);const card=page.getByRole('article',{name:o.title,exact:true});
  assert.ok(await card.isVisible());
  for(const mode of ['自学互动模式','教学展示模式'])assert.ok((await card.getByRole('link',{name:mode}).getAttribute('href')).startsWith('/study?module='));
  await card.getByRole('link',{name:o.title,exact:true}).click();
  await page.getByRole('heading',{level:1,name:o.title,exact:true}).waitFor();
  const start=page.getByRole('link',{name:'开始学习',exact:true});
  assert.equal(await start.getAttribute('href'),'/study?module='+encodeURIComponent(o.id||name)+'&mode=guide');
  await start.click();
  {
   await page.locator('.shuku-original-guide').waitFor();
   await page.goto(base+'/study?module='+encodeURIComponent(o.id||name)+'&mode=ppt');
   await page.locator('.cw-reader').waitFor();
  }
  await page.goto(base);await page.getByText(`${courses.length} 门课程`,{exact:true}).waitFor();
 }
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${courses.length} catalog cards, removed modules excluded, details, learning routes and mobile layout`);
}finally{await browser.close();}
