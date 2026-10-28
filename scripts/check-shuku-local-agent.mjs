// UI regression uses mocked accounts/courses; it never creates live production data.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://localhost:15173';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[],created=[];
 const user={id:'owner-local',username:'xiaoman',display_name:'小满',role:'creator'};
 const course={id:'local-course',owner_id:user.id,title:'本地创作体验',description:'一步一步探索',category:'人工智能',module_id:'11111111-1111-4111-8111-111111111111',head_revision:null,status:'draft',local_agent:true};
 const brief={text:'这是仅用于测试的本地专属指令。',filename:'local-agent.txt',token_id:'credential-local',expires_at:Date.now()/1000+86400,course};
 let revoked=false,latestRevision=null,previewPolls=0,previewState='building',failBrief=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);
  if(path==='/local-agent/courses'&&req.method()==='POST'){
   const value=req.postDataJSON();assert.equal(value.title,course.title);assert.equal(value.category,'人工智能');assert.match(value.module_id,/^[0-9a-f-]{36}$/);created.push(value);
   return route.fulfill({status:201,json:brief});
  }
  if(path==='/courses/official-course/workspaces'){
   assert.equal(req.postDataJSON().base_release_id,'release-1');return route.fulfill({status:201,json:{id:course.id}});
  }
  if(path==='/public/courses/official-course/releases')return route.fulfill({json:{releases:[{id:'release-1',version:'1.0.0',current:true}]}});
  if(path==='/local-agent/courses/local-course/brief')return failBrief?route.fulfill({status:503,json:{error:'暂时无法生成指令，请重试。'}}):route.fulfill({status:201,json:brief});
  if(path==='/revisions/latest-saved'){previewPolls++;return route.fulfill({json:{id:'latest-saved',state:previewState==='building'?(previewPolls===1?'building':'ready'):previewState,project:{title:course.title},preview_url:'/api/shuku/revisions/latest-saved/files/index.html'}});}
  if(path==='/revisions/latest-saved/files/index.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><h1>当前保存的课程效果</h1>'});
  if(path==='/local-agent/credentials/credential-local/revoke'){revoked=true;return route.fulfill({json:{revoked:true}});}
  const data={
   '/auth/me':{user},'/courses':{courses:created.length?[course]:[]},'/courses/local-course':{course:{...course,head_revision:latestRevision}},
   '/modules':{modules:[{id:course.module_id,title:'课程模板',alias:'test'}]},
   '/removals':{removals:[]},'/workspaces':{workspaces:[]},'/messages':{messages:[],unread_count:0},'/public/courses':{courses:[]},
   '/profile':{user,bio:'',email:'',updated_at:null},
   '/github/identity':{authorized:false,configured:false},
   '/local-agent/credentials':{credentials:[{id:'credential-local',course_id:course.id,title:course.title,created_at:Date.now()/1000,expires_at:brief.expires_at,revoked_at:revoked?Date.now()/1000:null,last_used_at:null}]},
  }[path];
  assert.ok(data,'Unexpected API '+path);return route.fulfill({json:data});
 });
 await page.goto(base+'/my-courses?tab=create');
 await page.getByRole('radio',{name:/使用本地 Agent/}).check();
 await page.getByLabel('课程名称',{exact:true}).fill(course.title);
 await page.getByLabel('课程简介',{exact:true}).fill(course.description);
 assert.equal(await page.getByLabel('上传课程 PPT',{exact:true}).count(),0);
 await page.getByRole('button',{name:'开始创建',exact:true}).click();
 await page.getByRole('dialog').waitFor();
 assert.equal(await page.getByRole('textbox',{name:'本地创作专属指令',exact:true}).count(),0);
 await page.getByRole('button',{name:'知道了，查看专属指令',exact:true}).click();
 assert.equal(await page.getByRole('textbox',{name:'本地创作专属指令',exact:true}).inputValue(),brief.text);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'下载指令',exact:true}).click();
 assert.equal((await download).suggestedFilename(),'local-agent.txt');
 await page.getByRole('button',{name:'完成',exact:true}).click();
 await page.waitForURL('**/my-courses/local?course=local-course');
 await page.getByRole('heading',{name:course.title,exact:true}).waitFor();
 await page.getByRole('button',{name:'获取本地创作指令',exact:true}).click();
 await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.goto(base+'/my-courses');
 const chooser=page.getByRole('combobox',{name:'继续创作',exact:true});
 await chooser.waitFor();assert.equal(await page.getByRole('link',{name:'继续创作',exact:true}).count(),0);
 assert.deepEqual(await chooser.locator('option:not([disabled])').allTextContents(),['使用减论 agent','使用本地 agent']);
 assert.equal(await page.getByRole('button',{name:'使用本地 Agent 修改',exact:true}).count(),0);
 await chooser.selectOption('local');await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'关闭',exact:true}).click();
 assert.equal(await chooser.inputValue(),'');
 failBrief=true;await chooser.selectOption('local');await page.getByRole('alert').filter({hasText:'暂时无法生成指令'}).waitFor();assert.ok(await chooser.isEnabled());failBrief=false;
 await page.route('**/my-courses/editor?course=local-course',route=>route.fulfill({contentType:'text/html',body:'<h1>在线创作入口</h1>'}));
 await chooser.selectOption('web');await page.waitForURL('**/my-courses/editor?course=local-course');
 await page.goto(base+'/my-courses');
 await page.getByRole('link',{name:'预览我的课程',exact:true}).click();
 await page.getByRole('status').filter({hasText:'暂时没有可预览的课程内容'}).waitFor();
 assert.equal(await page.locator('iframe').count(),0);
 await page.goto(base+'/my-courses');latestRevision='latest-saved';
 await page.getByRole('link',{name:'预览我的课程',exact:true}).click();
 await page.frameLocator('iframe[title="已保存的课程预览"]').getByRole('heading',{name:'当前保存的课程效果',exact:true}).waitFor();
 assert.ok(previewPolls>=2,'building preview should refresh until ready');
 previewState='failed';await page.reload();await page.getByRole('alert').filter({hasText:'课程预览生成失败'}).waitFor();
 assert.equal(await page.locator('iframe').count(),0);previewState='ready';
 await page.goto(base+'/my-courses');await page.getByRole('combobox',{name:'继续创作',exact:true}).waitFor();await page.setViewportSize({width:390,height:844});
 assert.ok(await page.getByRole('combobox',{name:'继续创作',exact:true}).isVisible());assert.ok(await page.getByRole('link',{name:'预览我的课程',exact:true}).isVisible());
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.setViewportSize({width:1440,height:960});
 await page.goto(base+'/my-courses?start=official-course');
 await page.getByRole('radio',{name:'使用本地 Agent',exact:true}).check();
 await page.getByRole('button',{name:'开始修改',exact:true}).click();
 await page.waitForURL('**/my-courses/local?course=local-course');
 await page.goto(base+'/profile');
 await page.getByText('本地 Agent 创作凭证',{exact:true}).click();
 await page.getByRole('button',{name:'撤销凭证',exact:true}).click();
 await page.getByText('已撤销',{exact:true}).waitFor();
 assert.equal(revoked,true);assert.equal(created.length,1);assert.deepEqual(errors,[]);
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 console.log('PASS creation dropdown, online/local choices, retry, latest saved preview, build refresh, empty/failed preview, local creation, credential revocation and mobile layout');
}finally{await browser.close();}
