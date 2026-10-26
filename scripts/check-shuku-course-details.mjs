// Course detail acceptance; mocked records never modify live courses.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
const course={id:'public-course',title:'Agent 概念入门',description:'介绍 Agent 的基本概念与模块。',category:'人工智能',creator:'小满',version:'1.0.2',revision_id:'new-revision'};
const releases=[{id:'release-new',version:'1.0.2',revision_id:'new-revision',current:true,created_at:1760000000,note:'完善示例'},{id:'release-old',version:'1.0.0',revision_id:'old-revision',current:false,created_at:1750000000,note:'初始版本'}];
const personal={account_id:'author',favorites:[],favorite_courses:[],history:[{resource:'course:public-course',title:course.title,version:'old-revision',version_label:'v1.0.0',url:'/learn?revision=old-revision',available:true,pages:['first'],page_id:'first',mode:'guide',completed:[],updated_at:1750000010,page_count:1}],next_cursor:null};
const native={kind:'library',id:'01439005-1b6c-42d8-b4ae-f750072f64d0',module_id:'01439005-1b6c-42d8-b4ae-f750072f64d0',alias:'neuron-guide',title:'认识人工神经元',description:'远程目录课程简介',category:'神经网络',difficulty:'introductory',page_count:18,cover_url:null,repository:'reduct-shuku/intuitive-deep-learning',source_commit:'a'.repeat(40),version:'aaaaaaaa',github_url:'https://github.com/reduct-shuku/intuitive-deep-learning'};
// Read the stable UUID from the actual outline rather than duplicating it.
const outline=JSON.parse(await fs.readFile('modules/Neuron-Guide/outlines.json','utf8'));native.id=native.module_id=outline.moduleIdentity.id;
native.course_id='official-neuron';native.revision_id='official-native-revision';native.version='1.0.0';
let posted=null,workspaceRequest=null;
async function mocks(context){await context.route('**/api/shuku/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);let data;
 if(path.endsWith('/files/index.html'))return route.fulfill({contentType:'text/html',body:'<html><body style="margin:0;background:#eaf4ef;font-family:sans-serif;padding:100px;color:#1f4d43"><h1 style="font-size:70px">从一个问题理解 Agent</h1><div style="display:flex;gap:70px;margin-top:100px;font-size:50px"><span>感知</span><span>→</span><span>决策</span><span>→</span><span>行动</span></div></body></html>'});
 if(path==='/auth/me')data={user:{id:'author',username:'xiaoman',display_name:'小满',role:'creator'}};
 else if(path==='/messages')data={messages:[],unread_count:0};
 else if(path==='/personal')data=personal;
 else if(path==='/public/courses')data={courses:[course,native]};
 else if(path==='/public/library/neuron-guide')data={course:native};
 else if(path==='/public/courses/official-neuron')data={course:{...native,id:'official-neuron',creator:'管理员',library:native},releases:[{id:'official-v1',revision_id:native.revision_id,version:'1.0.0',current:true,created_at:1760000000,note:'初始版本'}],contributors:[{name:'管理员',score:0,count:0}]};
 else if(path==='/public/courses/official-neuron/releases')data={releases:[{id:'official-v1',revision_id:native.revision_id,version:'1.0.0',current:true}]};
 else if(path==='/courses/official-neuron/workspaces'){workspaceRequest=req.postDataJSON();return route.fulfill({status:409,json:{error:'模拟提交已核验'}});}
 else if(path==='/public/courses/public-course')data={course,releases,contributors:[{name:'林知',score:8,count:1},{name:'小满',score:0,count:0}]};
 else if(path==='/public/courses/public-course/releases')data={releases};
 else if(path==='/revisions/old-revision/feedback'){posted=req.postDataJSON();data={id:'feedback-result'};}
 else if(path==='/public/courses/missing')return route.fulfill({status:404,json:{error:'课程不存在或已不可访问。'}});
 else throw new Error('Unexpected API '+path);
 await route.fulfill({json:data});
});}
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await mocks(context);const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');await page.getByRole('link',{name:'认识人工神经元课程详情',exact:true}).waitFor();assert.equal(await page.locator('.sd-library-grid > article').count(),2,'only API courses, no bundled extras');await page.getByRole('link',{name:'认识人工神经元课程详情',exact:true}).click();await page.getByRole('heading',{name:'认识人工神经元',exact:true}).waitFor();assert.ok(page.url().includes('/course?course=official-neuron'));assert.equal(await page.getByRole('dialog').count(),0);
 assert.equal(await page.locator('.cd-records details[open]').count(),0);assert.equal(await page.getByRole('link',{name:'开始学习',exact:true}).getAttribute('href'),'/learn?revision=official-native-revision');assert.equal(await page.getByRole('button',{name:'我想共创',exact:true}).isDisabled(),false);
 await page.getByText('管理员',{exact:true}).first().waitFor();await page.getByRole('button',{name:'我想共创',exact:true}).click();await page.locator('select[aria-label="基础版本"] option[value="official-v1"]').waitFor({state:'attached'});assert.equal(await page.getByLabel('基础版本',{exact:true}).inputValue(),'official-v1');await page.getByRole('button',{name:'开始修改',exact:true}).click();await page.getByRole('alert').filter({hasText:'模拟提交已核验'}).waitFor();assert.equal(workspaceRequest.base_release_id,'official-v1');await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.goto(base+'/');await page.getByRole('heading',{name:course.title,exact:true}).getByRole('link').click();await page.getByRole('heading',{name:course.title,exact:true}).waitFor();await page.getByText('小满',{exact:true}).first().waitFor();
 const version=page.getByRole('combobox',{name:'学习版本',exact:true});assert.equal(await version.inputValue(),'new-revision');assert.equal(await page.getByRole('link',{name:'开始学习',exact:true}).getAttribute('href'),'/learn?revision=new-revision');assert.match(await page.getByRole('link',{name:'继续上次学习 · v1.0.0',exact:true}).getAttribute('href'),/old-revision.*resume=1/);
 assert.equal(await page.locator('.cd-records details[open]').count(),0);await page.locator('.cd-records summary').filter({hasText:'课程贡献者'}).click();await page.locator('.cd-contributors').getByText('林知',{exact:true}).waitFor();await page.locator('.cd-records summary').filter({hasText:'课程版本历史'}).click();assert.equal(await page.locator('.cd-releases li').count(),2);
 await version.selectOption('old-revision');assert.equal(await page.getByRole('link',{name:'继续学习',exact:true}).getAttribute('href'),'/learn?revision=old-revision&resume=1');await page.getByRole('button',{name:'我想共创',exact:true}).click();await page.locator('select[aria-label="基础版本"] option[value="release-new"]').waitFor({state:'attached'});assert.equal(await page.getByLabel('基础版本',{exact:true}).inputValue(),'release-new','co-creation defaults to latest published version');await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'反馈课程问题',exact:true}).click();await page.getByRole('dialog').getByText(course.title+' · v1.0.0',{exact:true}).waitFor();await page.getByLabel('问题描述',{exact:true}).fill('这个例子需要补充解释。');await page.getByRole('button',{name:'提交反馈',exact:true}).click();await page.getByRole('status').filter({hasText:'已提交，课程管理者会收到反馈。'}).waitFor();assert.equal(posted.message,'这个例子需要补充解释。');assert.match(posted.request_key,/^[a-f0-9-]{36}$/);
 await page.reload();await version.waitFor();assert.equal(await version.inputValue(),'new-revision');assert.equal(await page.locator('.cd-records details[open]').count(),0);
 await fs.mkdir('test-results/course-details',{recursive:true});await page.screenshot({path:'test-results/course-details/desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/course-details/mobile.png',fullPage:true});
 await page.goto(base+'/course?course=missing');await page.getByRole('alert').filter({hasText:'课程不存在或已不可访问。'}).waitFor();assert.equal(await page.getByRole('link',{name:'开始学习',exact:true}).count(),0);assert.deepEqual(errors,[]);
 const guest=await browser.newContext();await guest.addInitScript(()=>sessionStorage.setItem('shuku:guest','1'));await mocks(guest);const visitor=await guest.newPage();await visitor.goto(base+'/course?course=public-course');await visitor.getByRole('button',{name:'我想共创',exact:true}).click();await visitor.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();
 personal.favorites=['course:official-neuron'];personal.favorite_courses=[{id:'official-neuron',title:native.title,description:native.description,category:native.category,version:'1.0.0',revision_id:native.revision_id}];await page.goto(base+'/?view=saved');await page.getByRole('heading',{name:native.title,exact:true}).waitFor();assert.equal(await page.locator('.sd-library-grid > article').count(),1,'a bound course favorite must not render as both native and published');
 const empty=await browser.newContext();await mocks(empty);await empty.route('**/api/shuku/public/courses',route=>route.fulfill({json:{courses:[]}}));const noCourses=await empty.newPage();await noCourses.goto(base+'/');await noCourses.getByRole('heading',{name:'暂时没有找到相关课程'}).waitFor();assert.equal(await noCourses.locator('.sd-library-grid > article').count(),0);
 await empty.route('**/api/shuku/public/courses',route=>route.fulfill({status:503,json:{error:'课程目录暂不可用'}}));await noCourses.reload();await noCourses.getByRole('alert').filter({hasText:'课程目录暂不可用'}).waitFor();assert.equal(await noCourses.locator('.sd-library-grid > article').count(),0,'API error must not fall back to bundled courses');
 console.log('PASS course details: card links, adopted native course v1.0.0/co-creation request, creator/cover, latest version, historical resume, collapsed history/ranking, co-creation base, version-bound feedback, refresh, guest login, inaccessible courses and mobile.');
}finally{await browser.close();}
