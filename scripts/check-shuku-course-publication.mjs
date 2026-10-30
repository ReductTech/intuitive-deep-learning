// Isolated browser regression: no production accounts, courses or releases are modified.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://127.0.0.1:5191';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
 const user={id:'owner',username:'xiaoman',display_name:'小满',role:'creator'};
 let course={id:'course',owner_id:user.id,title:'审核发布体验',description:'测试课程',module_id:'module',category:'人工智能',head_revision:'head-1',status:'draft',revision_state:'ready',review_status:null,review_note:'',has_draft:false,current_version:null};
 let submissions=0,publications=0,failPublish=true,remote=false,jobStatus='queued';
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);
  if(path==='/courses/course/submit'){
   assert.deepEqual(req.postDataJSON(),{revision_id:'head-1'});submissions++;course.review_status='pending';
   return route.fulfill({json:{id:'review-1',status:'pending'}});
  }
  if(path==='/courses/course/publish'){
   const data=req.postDataJSON();assert.equal(data.revision_id,course.head_revision);assert.equal(data.version,'1.0.0');assert.equal(data.note,'首版说明');publications++;
   if(failPublish)return route.fulfill({status:409,json:{error:'课程已变化，请刷新后再试。'}});
   if(remote)return route.fulfill({json:{release:{pending:true,job_id:'release-job'}}});
   course={...course,status:'published',review_status:'published',current_version:'1.0.0'};
   return route.fulfill({json:{release:{id:'release-1'}}});
  }
  if(path==='/courses/course/github'){
   if(remote&&jobStatus==='succeeded')course={...course,status:'published',review_status:'published',current_version:'1.0.0'};
   return route.fulfill({json:{enabled:false,jobs:remote?[{id:'release-job',status:jobStatus}]:[]}});
  }
  const data={'/auth/me':{user},'/courses':{courses:[course]},'/modules':{modules:[]},'/workspaces':{workspaces:[]},'/removals':{removals:[]},'/messages':{messages:[],unread_count:0}}[path];
  assert.ok(data,'Unexpected API '+path);return route.fulfill({json:data});
 });
 const open=async()=>{await page.goto(base+'/my-courses');await page.getByRole('heading',{name:course.title,exact:true}).waitFor();};
 const card=page.locator('article').filter({has:page.getByRole('heading',{name:course.title,exact:true})});
 await open();await card.getByRole('button',{name:'提交审核',exact:true}).click();
 await card.getByText('待审核',{exact:true}).waitFor();assert.equal(submissions,1);
 assert.equal(await card.getByRole('button',{name:'发布课程',exact:true}).count(),0);
 await card.getByRole('button',{name:'查看审核进度',exact:true}).click();
 await page.getByRole('dialog').getByText('课程已提交，等待管理员审核。',{exact:true}).waitFor();
 course.review_status='rejected';course.review_note='请补充示例';
 await page.getByRole('button',{name:'刷新审核状态',exact:true}).click();
 await page.getByRole('dialog').getByText('审核意见：请补充示例',{exact:true}).waitFor();
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 assert.equal(await card.getByRole('button',{name:'提交审核',exact:true}).count(),0);
 assert.equal(await card.getByRole('link',{name:'修改后重新提交',exact:true}).getAttribute('href'),'/my-courses/editor?course=course');
 course.review_status='approved';await page.getByRole('button',{name:'刷新课程',exact:true}).click();
 await card.getByRole('button',{name:'发布课程',exact:true}).click();
 await page.getByRole('button',{name:'确认发布',exact:true}).click();assert.equal(publications,0,'version is required');
 await page.getByLabel('版本号',{exact:true}).fill('1.0.0');await page.getByLabel('版本说明',{exact:true}).fill('首版说明');
 await page.getByRole('button',{name:'确认发布',exact:true}).click();
 await page.getByRole('alert').getByText('课程已变化，请刷新后再试。',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('版本号',{exact:true}).inputValue(),'1.0.0');
 failPublish=false;await page.getByRole('button',{name:'确认发布',exact:true}).click();
 await card.getByText('已发布 v1.0.0',{exact:true}).waitFor();assert.equal(publications,2);
 assert.equal(await card.getByRole('button',{name:'发布课程',exact:true}).count(),0);
 course={...course,head_revision:'head-2',review_status:null};await open();
 await card.getByText('已发布 v1.0.0 · 最新修订：草稿',{exact:true}).waitFor();assert.ok(await card.getByRole('button',{name:'提交审核',exact:true}).isEnabled());
 course.has_draft=true;course.review_status='approved';await page.getByRole('button',{name:'刷新课程',exact:true}).click();
 await card.getByText('已发布 v1.0.0 · 最新修订：草稿待保存',{exact:true}).waitFor();assert.equal(await card.getByRole('button',{name:'发布课程',exact:true}).count(),0);
 course={...course,has_draft:false,revision_state:'failed',review_status:null};await open();assert.ok(await card.getByRole('link',{name:'修复课程',exact:true}).isVisible());
 course.revision_state='building';await open();assert.ok(await card.getByRole('button',{name:'提交审核',exact:true}).isDisabled());
 course={...course,revision_state:'ready',review_status:'approved',status:'hidden'};await open();await card.getByText('已下架',{exact:true}).waitFor();assert.equal(await card.getByRole('button',{name:'发布课程',exact:true}).count(),0);
 course={...course,status:'draft',current_version:null};remote=true;await open();
 await card.getByRole('button',{name:'发布课程',exact:true}).click();await page.getByLabel('版本号',{exact:true}).fill('1.0.0');await page.getByLabel('版本说明',{exact:true}).fill('首版说明');await page.getByRole('button',{name:'确认发布',exact:true}).click();
 await page.getByRole('button',{name:'正在同步发布…',exact:true}).waitFor();assert.ok(await page.getByRole('button',{name:'正在同步发布…',exact:true}).isDisabled());
 jobStatus='succeeded';await card.getByText('已发布 v1.0.0',{exact:true}).waitFor();assert.equal(await page.getByRole('dialog').count(),0);
 course={...course,status:'draft',review_status:'approved',current_version:null};jobStatus='failed';await open();
 await card.getByRole('button',{name:'发布课程',exact:true}).click();await page.getByLabel('版本号',{exact:true}).fill('1.0.0');await page.getByLabel('版本说明',{exact:true}).fill('首版说明');await page.getByRole('button',{name:'确认发布',exact:true}).click();await page.getByRole('alert').filter({hasText:'发布同步未完成'}).waitFor();
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.setViewportSize({width:390,height:844});assert.ok(await card.getByRole('button',{name:'发布课程',exact:true}).isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);console.log('PASS course states, submit/review notes, publish validation/retry, draft protection, new releases, remote success/failure and mobile layout');
}finally{await browser.close();}
