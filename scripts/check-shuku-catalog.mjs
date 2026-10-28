import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_CATALOG_URL||'http://127.0.0.1:5191';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
const sha='a'.repeat(40),courseId='11111111-1111-4111-8111-111111111111';
const candidate={repository_id:123,owner:'reduct-shuku',name:'deep-learning',payload:{title:'Deep learning',version:'1.0.2'},source_sha:sha,imported_sha:null,status:'pending',error_code:null,note:'',course_id:null};
let scanned=false,approved=false;
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.route('**/api/shuku/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  let body={};
  if(path.endsWith('/auth/me'))body={user:{id:courseId,username:'admin',display_name:'管理员',role:'admin'}};
  else if(path.endsWith('/admin/courses'))body={items:[],ranking:[],total:0,page:1,page_size:20,github_enabled:true};
  else if(path.endsWith('/admin/catalog/scan')){assert.equal(request.method(),'POST');assert.deepEqual(request.postDataJSON(),{});scanned=true;}
  else if(path.endsWith('/admin/catalog/123/decision')){assert.deepEqual(request.postDataJSON(),{decision:'approved',source_sha:sha,note:'已检查课程'});approved=true;}
  else if(path.endsWith('/admin/catalog'))body={organization:'reduct-shuku',enabled:true,interval_seconds:7200,jobs:[],items:scanned?[{...candidate,...(approved?{status:'imported',course_id:courseId,imported_sha:sha}:{})}]:[]};
  else if(path.endsWith('/removals'))body={removals:[]};
  else if(path.endsWith('/personal'))body={favorites:[],history:[]};
  else if(path.endsWith('/messages'))body={messages:[],unread:0};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto(base+'/data?tab=courses');
 await page.getByRole('button',{name:'扫描课程仓库',exact:true}).click();
 await page.getByRole('heading',{name:'Deep learning',exact:true}).waitFor();
 assert.equal(await page.getByRole('link',{name:'查看待审核源码',exact:true}).getAttribute('href'),'https://github.com/reduct-shuku/deep-learning/tree/'+sha);
 await page.getByLabel('deep-learning审核意见',{exact:true}).fill('已检查课程');
 await page.getByRole('button',{name:'确认收录并发布',exact:true}).click();
 await page.getByRole('link',{name:'查看已收录课程',exact:true}).waitFor();
 assert.ok(scanned&&approved);
 assert.equal(await page.getByRole('button',{name:'确认收录并发布',exact:true}).count(),0);
 console.log('Organization catalog administrator UI passed');
}finally{await browser.close();}
