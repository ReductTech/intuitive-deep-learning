// Isolated browser fixtures: no real GitHub names or courses are changed.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://127.0.0.1:5379';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
 const user={id:'owner',username:'xiaoman',display_name:'小满',role:'creator'};
 let course={id:'course',owner_id:user.id,title:'课程英文名测试',description:'测试',module_id:'module',category:'人工智能',head_revision:'head',status:'draft',revision_state:'ready',review_status:'approved',has_draft:false,current_version:null};
 let name='course-uuid',job=null,publications=0,renames=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);
  if(path==='/courses/course/github/name/check'){
   const {name:value}=req.postDataJSON();
   if(value==='slow-result')await new Promise(resolve=>setTimeout(resolve,500));
   return route.fulfill({json:{name:value,available:value!=='occupied',message:value==='occupied'?'该名称已被其他仓库占用，请换一个名称。':'名称可用'}});
  }
  if(path==='/courses/course/github/name'){
   if(req.method()==='GET')return route.fulfill({json:{name,owner:'reduct-shuku',suggested_name:course.current_version?name:'neural-network-basics',can_rename:!!course.current_version}});
   assert.deepEqual(req.postDataJSON(),{name:'course-evolution',expected_name:name});renames++;name='course-evolution';job={id:'rename-job',kind:'rename',status:'succeeded',checkpoint:{stage:'complete'}};
   return route.fulfill({status:202,json:{job_id:job.id,pending:true}});
  }
  if(path==='/courses/course/publish'){
   assert.deepEqual(req.postDataJSON(),{revision_id:'head',version:'1.0.0',note:'首版',repository_name:'neural-network-basics'});publications++;
   if(publications===1){job={id:'release-job',kind:'release',status:'failed',error_code:'REPOSITORY_NAME_TAKEN',checkpoint:{}};return route.fulfill({json:{release:{pending:true,job_id:job.id}}});}
   name='neural-network-basics';job={id:'release-job',kind:'release',status:'succeeded',checkpoint:{stage:'complete'}};
   course={...course,status:'published',review_status:'published',current_version:'1.0.0'};
   return route.fulfill({json:{release:{pending:true,job_id:job.id}}});
  }
  if(path==='/courses/course/github')return route.fulfill({json:{enabled:true,name_editable:true,can_rename:!!course.current_version,repository:{owner:'reduct-shuku',name},jobs:job?[job]:[],external_prs:[]}});
  const result={'/auth/me':{user},'/courses':{courses:[course]},'/modules':{modules:[]},'/workspaces':{workspaces:[]},'/removals':{removals:[]},'/messages':{messages:[],unread_count:0}}[path];
  assert.ok(result,'Unexpected API '+path);return route.fulfill({json:result});
 });
 await page.goto(base+'/my-courses');
 await page.getByRole('button',{name:'发布课程',exact:true}).click();
 const field=page.getByLabel('英文仓库名',{exact:true}),confirm=page.getByRole('button',{name:'确认发布',exact:true});
 await field.waitFor();await page.waitForFunction(()=>document.querySelector('input[name="repository_name"]')?.value==='neural-network-basics');
 assert.ok(await confirm.isDisabled());
 await page.getByLabel('版本号',{exact:true}).fill('1.0.0');await page.getByLabel('版本说明',{exact:true}).fill('首版');
 await field.fill('occupied');await page.getByRole('button',{name:'检查名称',exact:true}).click();
 await page.getByText('该名称已被其他仓库占用，请换一个名称。',{exact:true}).waitFor();assert.ok(await confirm.isDisabled());
 await field.fill('slow-result');await page.getByRole('button',{name:'检查名称',exact:true}).click();await field.fill('neural-network-basics');
 await page.waitForTimeout(650);assert.equal(await field.inputValue(),'neural-network-basics');assert.ok(await confirm.isDisabled(),'stale availability cannot approve a new value');
 await page.getByRole('button',{name:'检查名称',exact:true}).click();await page.getByText('名称可用',{exact:true}).waitFor();assert.ok(await confirm.isEnabled());
 await confirm.click();await page.getByRole('alert').getByText('该名称已被占用，请换一个名称并重新检查。',{exact:true}).waitFor();assert.ok(await confirm.isDisabled(),'failed remote name claims require a fresh check');
 await page.getByRole('button',{name:'检查名称',exact:true}).click();await page.getByText('名称可用',{exact:true}).waitFor();await confirm.click();
 await page.getByText('已发布 v1.0.0',{exact:true}).waitFor();assert.equal(publications,2);
 await page.getByText('同步与审核详情',{exact:true}).click();await page.getByRole('button',{name:'修改仓库名称',exact:true}).click();
 const modal=page.getByRole('dialog',{name:'修改仓库名称'}),rename=modal.getByRole('button',{name:'确认改名',exact:true});
 await modal.getByLabel('英文仓库名',{exact:true}).fill('course-evolution');assert.ok(await rename.isDisabled());
 await modal.getByRole('button',{name:'检查名称',exact:true}).click();await modal.getByText('名称可用',{exact:true}).waitFor();await rename.click();
 await modal.waitFor({state:'hidden'});assert.equal(renames,1);
 assert.equal(await page.getByRole('link',{name:'课程仓库 ↗',exact:true}).getAttribute('href'),'https://github.com/reduct-shuku/course-evolution');
 assert.deepEqual(errors,[]);console.log('PASS suggested name, required availability, collision, stale results, publication payload and post-publication rename');
}finally{await browser.close();}
