// Mocked acceptance: ownership, confirmation, failed requests and cleanup retries.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 let role='creator',deny=true,posts=0,retries=0;
 let courses=[{id:'own',owner_id:'owner',title:'我的草稿',status:'draft'},{id:'published',owner_id:'owner',title:'已发布的课程',status:'published'},{id:'managed',owner_id:'someone-else',title:'受托管理课程',status:'draft'}],removals=[];
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);let data;
  if(path==='/auth/me')data={user:{id:'owner',username:'xiaoman',display_name:'小满',role}};
  else if(path==='/courses')data={courses};
  else if(path==='/modules')data={modules:[]};
  else if(path==='/workspaces')data={workspaces:[]};
  else if(path==='/messages')data={messages:[],unread_count:0};
  else if(path==='/removals')data={removals};
  else if(path.endsWith('/github'))data={enabled:false,repository:null,jobs:[],external_prs:[]};
  else if(path==='/courses/own/remove'){
   posts++;assert.deepEqual(req.postDataJSON(),{confirm:true});
   if(deny)return route.fulfill({status:403,json:{error:'当前没有删除权限，请刷新后重试。'}});
   courses=courses.filter(c=>c.id!=='own');removals=[{id:'removal-own',title:'我的草稿',state:'failed',task_status:'failed',checkpoint:{}}];data={id:'removal-own'};
  }else if(path==='/removals/removal-own/retry'){
   retries++;assert.deepEqual(req.postDataJSON(),{});removals=[{...removals[0],state:'succeeded',task_status:'succeeded'}];data={id:'removal-own'};
  }else throw new Error('Unexpected API '+path);
  await route.fulfill({json:data});
 });
 await page.goto(base+'/my-courses');const own=page.locator('.shuku-course-list article').filter({has:page.getByRole('heading',{name:'我的草稿',exact:true})}),published=page.locator('.shuku-course-list article').filter({has:page.getByRole('heading',{name:'已发布的课程',exact:true})}),managed=page.locator('.shuku-course-list article').filter({has:page.getByRole('heading',{name:'受托管理课程',exact:true})});
 await own.getByRole('button',{name:'删除课程',exact:true}).waitFor();assert.equal(await page.locator('.sd-library-topnote').count(),0);assert.equal(await page.getByText('让知识可以被探索',{exact:true}).count(),0);const session=await page.locator('.shuku-account-dock').boundingBox();assert.ok(session&&session.x<20&&session.y>800,'account controls stay at the bottom left');assert.equal(await published.getByRole('button',{name:'删除课程',exact:true}).count(),1);assert.equal(await managed.getByRole('button',{name:'删除课程',exact:true}).count(),0);
 await own.getByRole('button',{name:'删除课程',exact:true}).click();let dialog=page.getByRole('dialog',{name:'删除课程',exact:true});assert.equal(await dialog.getByRole('textbox').count(),0);await dialog.getByRole('button',{name:'取消',exact:true}).click();assert.equal(posts,0);
 await own.getByRole('button',{name:'删除课程',exact:true}).click();await dialog.getByRole('button',{name:'确认删除',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'当前没有删除权限'}).waitFor();assert.equal(await own.count(),1);await dialog.getByRole('button',{name:'取消',exact:true}).click();
 deny=false;await own.getByRole('button',{name:'删除课程',exact:true}).click();await dialog.getByRole('button',{name:'确认删除',exact:true}).click();await own.waitFor({state:'detached'});const progress=page.locator('details.shuku-removal-progress');await progress.waitFor();assert.equal(await progress.getAttribute('open'),null,'deletion progress starts collapsed');assert.equal(await page.getByRole('button',{name:'重试清理',exact:true}).isVisible(),false);await progress.locator('summary').click();await page.getByText('清理失败，可重试',{exact:true}).waitFor();await progress.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await progress.getAttribute('open'),null,'keyboard can collapse progress');await page.keyboard.press('Enter');assert.equal(posts,2);
 await page.getByRole('button',{name:'重试清理',exact:true}).click();await page.getByText('已删除',{exact:true}).waitFor();assert.equal(retries,1);assert.equal(await published.count(),1);assert.equal(await managed.count(),1);
 await page.reload();await published.waitFor();assert.equal(await own.count(),0);assert.equal(await progress.getAttribute('open'),null,'reload returns to collapsed progress');
 role='admin';await page.reload();await managed.getByRole('button',{name:'永久删除',exact:true}).waitFor();assert.equal(await managed.getByRole('button',{name:'下架课程',exact:true}).count(),1);
 role='creator';await page.reload();await page.setViewportSize({width:390,height:844});await published.getByRole('button',{name:'删除课程',exact:true}).click();await dialog.waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS owner course deletion: own drafts/releases, manager exclusion, simple confirmation/cancel, request failure, cleanup retry, refresh, admin controls and mobile.');
}finally{await browser.close();}
