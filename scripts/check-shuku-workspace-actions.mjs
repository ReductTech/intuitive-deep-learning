// Workspace cards reuse the same authoring selector and editor as owned courses.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://127.0.0.1:5379';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
 const user={id:'learner',username:'linzhi',display_name:'林知',role:'learner'};
 const workspaces=[{id:'workspace-saved',title:'已保存的共创',base_version:'1.0.0',status:'pending',contribution_id:'contribution',local_agent:true},{id:'workspace-empty',title:'空白共创',base_version:'1.1.0',status:null,contribution_id:null}];
 const project={version:1,id:'project',courseId:'custom-module',title:workspaces[0].title,duration:20,style:'简洁',outlineConfirmed:true,pages:[{id:'first',format:'text',title:'我的共创页面',goal:'保持原工作区',summary:'已有内容',note:'',ready:true,designed:true,revisions:[],messages:[]}]};
 let briefRequests=0,failBrief=true;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);
  if(path==='/local-agent/courses/workspace-saved/brief'){
   assert.equal(req.method(),'POST');briefRequests++;
   return failBrief?route.fulfill({status:503,json:{error:'暂时无法生成指令，请重试。'}}):route.fulfill({status:201,json:{text:'此工作区的私有共创指令',filename:'workspace.txt',token_id:'token',expires_at:Date.now()/1000+3600}});
  }
  const workspace=workspaces.find(w=>path==='/courses/'+w.id);
  if(workspace)return route.fulfill({json:{course:{...workspace,description:'',module_id:'module',head_revision:workspace.id==='workspace-saved'?'revision':null,workspace:{target_course_id:'official',base_release_id:'base'}}}});
  if(path==='/revisions/revision')return route.fulfill({json:{id:'revision',state:'ready',project,review:null,contribution:{id:'contribution',status:'pending',note:'',score:null}}});
  if(/^\/courses\/workspace-(saved|empty)\/draft$/.test(path))return route.fulfill({json:{draft:null}});
  const result={'/auth/me':{user},'/courses':{courses:[]},'/modules':{modules:[]},'/workspaces':{workspaces},'/removals':{removals:[]},'/messages':{messages:[],unread_count:0}}[path];
  assert.ok(result,'Unexpected API '+path);return route.fulfill({json:result});
 });
 const open=async()=>{await page.goto(base+'/my-courses?tab=workspaces');await page.getByRole('heading',{name:'我参与的共创',exact:true}).waitFor();};
 const saved=()=>page.locator('article.shuku-course-card').filter({has:page.getByRole('heading',{name:workspaces[0].title,exact:true})});
 await open();assert.equal(await page.locator('article.shuku-course-card').count(),2);
 for(const workspace of workspaces){
  const card=page.locator('article').filter({has:page.getByRole('heading',{name:workspace.title,exact:true})});
  assert.ok(await card.getByRole('combobox',{name:'继续创作',exact:true}).isVisible());
  assert.equal(await card.getByRole('link',{name:'预览我的共创',exact:true}).getAttribute('href'),'/my-courses/editor?course='+workspace.id);
  assert.equal(await card.getByRole('link',{name:'继续修改',exact:true}).count(),0);
  assert.equal(await card.getByRole('button',{name:'使用本地 Agent 修改',exact:true}).count(),0);
 }
 assert.equal(await saved().getByRole('link',{name:'审核进度',exact:true}).getAttribute('href'),'/my-courses/review?contribution=contribution');
 assert.ok(await saved().getByText('同步与审核详情',{exact:true}).isVisible());
 assert.ok(await saved().getByRole('button',{name:'删除共创',exact:true}).isVisible());
 await saved().getByRole('combobox',{name:'继续创作',exact:true}).selectOption('local');
 await page.getByRole('alert').getByText('暂时无法生成指令，请重试。',{exact:true}).waitFor();
 failBrief=false;await saved().getByRole('combobox',{name:'继续创作',exact:true}).selectOption('local');await page.getByRole('dialog').waitFor();
 await page.getByRole('button',{name:'知道了，查看专属指令',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'本地创作专属指令',exact:true}).inputValue(),'此工作区的私有共创指令');assert.equal(briefRequests,2);
 await page.getByRole('button',{name:'完成',exact:true}).click();
 await saved().getByRole('combobox',{name:'继续创作',exact:true}).selectOption('web');await page.waitForURL('**/my-courses/editor?course=workspace-saved');await page.locator('.cw-editing .cw-composer').waitFor();
 await open();await saved().getByRole('link',{name:'预览我的共创',exact:true}).click();await page.waitForURL('**/my-courses/editor?course=workspace-saved');await page.locator('.cw-editing .cw-composer').waitFor();
 await open();await page.getByRole('link',{name:'预览我的共创',exact:true}).last().click();await page.waitForURL('**/my-courses/editor?course=workspace-empty');await page.locator('.cw-editing .cw-composer').waitFor();
 await open();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  const card=saved(),info=await card.locator(':scope>div').first().boundingBox(),actions=await card.locator(':scope>.shuku-row-actions').boundingBox();
  assert.ok(actions.y>=info.y+info.height,'workspace actions are below the course information');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await fs.mkdir('test-results/workspace-actions',{recursive:true});await page.screenshot({path:'test-results/workspace-actions/cards-'+width+'.png'});
 }
 assert.deepEqual(errors,[]);console.log('PASS learner workspace actions, online/local continuation and retry, saved/empty previews, review/sync/delete, desktop/mobile layout');
}finally{await browser.close();}
