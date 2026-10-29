// Failed renderer recovery never saves source, creates revisions or publishes.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://127.0.0.1:5379';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 const rid='11111111-1111-4111-8111-111111111111';
 const project={version:1,id:'project',courseId:'custom-module',title:'保留原课程',duration:20,style:'简洁',outlineConfirmed:true,source:{files:{'Lesson.tsx':'export default ()=> <h1>原课程</h1>'}},pages:[{id:'first',format:'react',sourceEntry:'Lesson.tsx',title:'原页面',goal:'',summary:'',note:'',ready:true,designed:true,revisions:[],messages:[]}]};
 let phase='failed',code='BUILD_TIMEOUT',retries=0,writes=0;
 const messages={BUILD_TIMEOUT:'课程页面构建超时，旧构建已停止，可以重试。',SOURCE_BUILD_FAILED:'课程源码无法构建，请修复源码后重试。',ATTEMPTS_EXHAUSTED:'上次构建任务已失效，可以重新准备课程页面。',BUILD_HEARTBEAT_FAILED:'构建任务续期失败，请稍后重试。',BUILD_CLEANUP_FAILED:'未确认旧构建进程退出，已停止重试，请联系管理员处理。'};
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);
  if(path==='/revisions/'+rid+'/player/retry'){
   assert.equal(req.method(),'POST');assert.deepEqual(req.postDataJSON(),{});assert.notEqual(code,'BUILD_CLEANUP_FAILED');retries++;phase='ready';return route.fulfill({status:202,json:{state:'queued'}});
  }
  if(req.method()==='POST'){writes++;throw Error('Unexpected source/publication write '+path);}
  if(path==='/revisions/'+rid+'/player')return route.fulfill({json:phase==='ready'?{state:'ready',url:'/api/shuku/revisions/'+rid+'/player/files/index.html'}:{state:'failed',error_code:code,message:messages[code],can_retry:code!=='BUILD_CLEANUP_FAILED'}});
  if(path==='/revisions/'+rid+'/player/files/index.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><h1>已恢复的课程页面</h1>'});
  const result={'/auth/me':{user:{id:'owner',username:'xiaoman',display_name:'小满',role:'creator'}},'/messages':{messages:[],unread_count:0},'/courses/fixture':{course:{id:'fixture',title:project.title,module_id:'module',head_revision:rid}},['/revisions/'+rid]:{id:rid,state:'ready',project,review:{status:'published',note:''}},'/courses/fixture/draft':{draft:null},['/public/revisions/'+rid]:{course_id:'fixture',title:project.title,version:'1.0.0',revision_id:rid},'/public/courses/fixture/releases':{releases:[{revision_id:rid,version:'1.0.0'}]},['/personal/study/course%3Afixture/'+rid]: {account_id:'owner',context:{resource:'course:fixture',title:project.title,version:rid,pages:['first'],available:true,sandboxed:true},state:null}}[path];
  assert.ok(result,'Unexpected API '+path);return route.fulfill({json:result});
 });
 for(code of ['BUILD_TIMEOUT','SOURCE_BUILD_FAILED','ATTEMPTS_EXHAUSTED','BUILD_HEARTBEAT_FAILED']){
  phase='failed';await page.goto(base+'/my-courses/editor?course=fixture');
  const viewport=page.locator('.cw-viewport');await viewport.getByRole('alert').getByText(messages[code],{exact:true}).waitFor();
  await viewport.getByRole('button',{name:'重新准备课程页面',exact:true}).click();
  await viewport.locator('iframe').waitFor(); await viewport.locator('iframe').evaluate(el=>el.loading='eager'); await viewport.frameLocator('iframe').getByRole('heading',{name:'已恢复的课程页面',exact:true}).waitFor();
  await page.locator('.cw-saved-thumbnail iframe').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('course'),'fixture');
 }
 code='BUILD_CLEANUP_FAILED';phase='failed';await page.goto(base+'/my-courses/editor?course=fixture');
 await page.locator('.cw-viewport').getByRole('alert').getByText(messages[code],{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'重新准备课程页面',exact:true}).count(),0);
 code='BUILD_TIMEOUT';phase='failed';await page.goto(base+'/learn?revision='+rid+'&mode=ppt');
 await page.getByRole('alert').getByText(messages[code],{exact:true}).waitFor();
 await page.getByRole('button',{name:'重新准备课程页面',exact:true}).click();
 await page.frameLocator('iframe.shuku-original-lesson').getByRole('heading',{name:'已恢复的课程页面',exact:true}).waitFor();
 assert.equal(retries,5);assert.equal(writes,0);assert.deepEqual(errors,[]);
 console.log('PASS timeout/source/stale/heartbeat messages, same-revision retry, thumbnail refresh and cleanup-failure lockout; no source/publication writes');
}finally{await browser.close();}
