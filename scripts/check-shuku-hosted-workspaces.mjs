import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let retried=false;const wid='11111111-1111-4111-8111-111111111111';
 await page.route('**/api/shuku/**',async route=>{
  const path=new URL(route.request().url()).pathname,method=route.request().method();let json;
  if(path.endsWith('/auth/me'))json={user:{id:'learner',role:'learner',username:'linzhi',display_name:'林知'}};
  else if(path.endsWith('/messages'))json={messages:[],unread_count:0};
  else if(path.endsWith('/courses'))json={courses:[]};
  else if(path.endsWith('/modules'))json={modules:[]};
  else if(path.endsWith('/workspaces'))json={workspaces:[{id:wid,title:'无需 GitHub 的共创',base_version:'1.0.0',status:null,contribution_id:null}]};
  else if(path.endsWith('/github/retry')){assert.equal(method,'POST');assert.equal(route.request().postDataJSON().job_id,'task');retried=true;json={accepted:true};}
  else if(path.endsWith('/github'))json={enabled:true,hosting:'private-workspace',repository:{owner:'reduct-shuku',name:'co-creation-workspaces',private:true,branch:'learner/'+wid},jobs:[{id:'task',kind:'github.workspace',status:retried?'succeeded':'failed',checkpoint:{stage:'updating-private-branch'},error_code:retried?null:'GITHUB_UNAVAILABLE'}],external_prs:[]};
  else if(path.includes('/removals'))json={removals:[]};
  else throw new Error('Unexpected API '+path);
  await route.fulfill({json});
 });
 await page.goto(base+'/my-courses?tab=workspaces');
 await page.getByText('同步与审核详情',{exact:true}).click();
 await page.getByText('术库私有工作区 · 无需 GitHub 账号',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'连接课程仓库',exact:true}).count(),0);
 assert.equal(await page.getByRole('link',{name:'课程仓库 ↗',exact:true}).count(),0);
 await page.getByRole('button',{name:'重试',exact:true}).click();assert(retried);
 await page.getByText('同步未完成').waitFor({state:'hidden'});
 assert.ok(await page.getByRole('combobox',{name:'继续创作',exact:true}).isVisible());
 assert.equal(await page.getByRole('link',{name:'预览我的共创',exact:true}).getAttribute('href'),'/my-courses/editor?course='+wid);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS unbound learner workspace entry, private status, scoped retry and mobile layout (all APIs mocked)');
}finally{await browser.close();}
