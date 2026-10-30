import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_CATALOG_URL||'http://127.0.0.1:5191';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
const sha='a'.repeat(40),courseId='11111111-1111-4111-8111-111111111111';
const candidate={repository_id:123,owner:'reduct-shuku',name:'deep-learning',payload:{title:'Deep learning',version:'1.0.2'},source_sha:sha,imported_sha:null,status:'pending',error_code:null,note:'',course_id:null};
let scanned=false,approved=false,retried=false;
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.route('**/api/shuku/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname;
  let body={};
  if(path.endsWith('/auth/me'))body={user:{id:courseId,username:'admin',display_name:'管理员',role:'admin'}};
  else if(path.endsWith('/admin/courses')){
   const group=url.searchParams.get('group');
   const items=group==='published'?(approved?[{id:courseId,title:'Deep learning',status:'published',module_id:courseId,description:'',category:'独立课程',head_revision:null}]:[]):group==='pending'?[{id:'draft',title:'未发布草稿示例',status:'draft',module_id:courseId}]:group==='deleted'?[{id:'hidden',title:'已下架示例',status:'hidden',module_id:courseId}]:[];
   body={items,ranking:[],total:items.length,page:1,page_size:20,github_enabled:true};
  }
  else if(path.endsWith('/admin/catalog/scan')){assert.equal(request.method(),'POST');assert.deepEqual(request.postDataJSON(),{});scanned=true;}
  else if(path.endsWith('/admin/catalog/123/decision')){assert.deepEqual(request.postDataJSON(),{decision:'approved',source_sha:sha,note:'已检查课程'});approved=true;}
  else if(path.endsWith('/admin/catalog'))body={organization:'reduct-shuku',enabled:true,interval_seconds:7200,jobs:[],items:scanned?[{...candidate,...(approved?{status:'imported',course_id:courseId,imported_sha:sha}:{})}]:[]};
  else if(path.endsWith('/removals/failed/retry')){assert.equal(request.method(),'POST');retried=true;}
  else if(path.endsWith('/removals'))body={removals:[{id:'done',title:'已永久删除示例',state:'succeeded',task_status:'succeeded',checkpoint:{}},{id:'failed',title:'清理失败示例',state:retried?'succeeded':'failed',task_status:retried?'succeeded':'failed',checkpoint:{}}]};
  else if(path.endsWith('/personal'))body={favorites:[],history:[]};
  else if(path.endsWith('/messages'))body={messages:[],unread:0};
  else if(path.endsWith('/github'))body={enabled:false,repository:null,jobs:[],external_prs:[]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto(base+'/data?tab=courses');
 const published=page.locator('details[aria-label="已上架课程"]'),pending=page.locator('details[aria-label="待收录课程"]'),deleted=page.locator('details[aria-label="已删除课程"]');
 await published.waitFor();assert.equal(await page.locator('.admin-course-sections>details').count(),3);
 assert.equal(await published.evaluate(e=>e.open),true);assert.equal(await pending.evaluate(e=>e.open),false);assert.equal(await deleted.evaluate(e=>e.open),false);
 await published.locator(':scope>summary').click();assert.equal(await published.evaluate(e=>e.open),false);
 await pending.locator(':scope>summary').click();await pending.getByRole('heading',{name:'未发布草稿示例',exact:true}).waitFor();
 await pending.getByRole('button',{name:'扫描课程仓库',exact:true}).click();
 await pending.getByRole('heading',{name:'Deep learning',exact:true}).waitFor();
 assert.equal(await pending.getByRole('link',{name:'查看待审核源码',exact:true}).getAttribute('href'),'https://github.com/reduct-shuku/deep-learning/tree/'+sha);
 await pending.getByLabel('deep-learning审核意见',{exact:true}).fill('已检查课程');
 await pending.getByRole('button',{name:'确认收录并发布',exact:true}).click();
 await pending.getByRole('heading',{name:'Deep learning',exact:true}).waitFor({state:'hidden'});
 assert.equal(await pending.evaluate(e=>e.open),true);
 await published.locator(':scope>summary').click();await published.getByRole('heading',{name:'Deep learning',exact:true}).waitFor();
 await deleted.locator(':scope>summary').click();await deleted.getByRole('heading',{name:'已下架示例',exact:true}).waitFor();
 assert.ok(await deleted.getByRole('button',{name:'恢复课程',exact:true}).isVisible());
 await deleted.getByText('已永久删除示例',{exact:true}).waitFor();await deleted.getByRole('button',{name:'重试清理',exact:true}).click();
 await deleted.getByRole('button',{name:'重试清理',exact:true}).waitFor({state:'hidden'});assert.ok(retried);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const section of [published,pending,deleted]){await section.locator(':scope>summary').click();assert.equal(await section.evaluate(e=>e.open),false);await section.locator(':scope>summary').focus();await page.keyboard.press('Enter');assert.equal(await section.evaluate(e=>e.open),true);}
 assert.ok(scanned&&approved);
 console.log('Course sections passed: three accessible disclosures, review publication, correct grouping, deletion retry and mobile layout');
}finally{await browser.close();}
