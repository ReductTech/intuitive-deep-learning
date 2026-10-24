// UI contract checks against the isolated local preview. Remote effects are intercepted explicitly.
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({channel:process.env.SHUKU_E2E_BROWSER_CHANNEL||'chrome',headless:true});
const context=await browser.newContext();const page=await context.newPage();
const base='http://localhost:5175';let course;
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function api(path,data){const response=await context.request.fetch(base+'/api/shuku'+path,{method:data?'POST':'GET',data,headers:{Origin:base}});assert(response.ok(),await response.text());return response.json();}
try{
 await api('/auth/login',{username:'xiaoman',password:process.env.SHUKU_E2E_PASSWORD});
 const {modules}=await api('/modules');course=(await api('/courses',{title:'T07 UI 同步验收',module_id:modules[0].id})).course;
 let state='queued',externalMerged=false;const actions=[];
 await page.route('**/api/shuku/courses/'+course.id+'/github**',async route=>{
  const request=route.request();if(request.method()==='POST'){actions.push({path:new URL(request.url()).pathname,body:request.postDataJSON()});await route.fulfill({json:{accepted:true}});return;}
  await route.fulfill({json:{enabled:true,repository:{owner:'tests',name:'ui-contract'},jobs:[{id:'11111111-1111-4111-8111-111111111111',kind:'release',status:state,checkpoint:{stage:'uploading-changes',uploaded:1},error_code:null}],external_prs:[{number:7,title:'补充教学例子',author:'contributor',head_sha:'a'.repeat(40),review_state:externalMerged?'merged':'pending',state:externalMerged?'closed':'open',local_revision_id:externalMerged?'22222222-2222-4222-8222-222222222222':null}]}});
 });
 await page.goto(base+'/my-courses/editor?course='+course.id+'&blank=1');
 await page.getByText('同步与审核详情',{exact:true}).click();
 await page.getByRole('status').filter({hasText:'上传变更文件'}).waitFor();
 await page.getByRole('button',{name:'审核通过',exact:true}).click();
 assert.equal(actions.at(-1).body.head_sha,'a'.repeat(40));assert.equal(actions.at(-1).body.decision,'approved');
 state='failed';await page.getByRole('button',{name:'重试',exact:true}).waitFor();await page.getByRole('button',{name:'重试',exact:true}).click();
 assert(actions.at(-1).path.endsWith('/github/retry'));assert.equal(actions.at(-1).body.job_id,'11111111-1111-4111-8111-111111111111');
 externalMerged=true;state='succeeded';await page.getByRole('link',{name:'查看合并后的课程',exact:true}).waitFor();assert((await page.getByRole('link',{name:'查看合并后的课程',exact:true}).getAttribute('href')).includes(course.id));
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS GitHub progress, approval binding, recovery controls, mobile layout');
}finally{
 if(course){await api('/auth/login',{username:'admin',password:process.env.SHUKU_E2E_PASSWORD});await api('/courses/'+course.id+'/remove',{confirm:true});}
 await browser.close();
}
