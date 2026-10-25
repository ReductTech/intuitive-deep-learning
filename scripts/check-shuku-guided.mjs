// Interaction acceptance with mocked persistence; does not create live courses.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 let saved=null,created=null;
 const course={id:'guided-course',title:'Agent 基础',description:'理解工具、记忆和规划',category:'人工智能',module_id:'9acfbca1-b881-457e-add6-21e0b6b855a0',status:'draft',head_revision:null};
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);let data;
  if(path==='/auth/me')data={user:{id:'author',username:'xiaoman',display_name:'小满',role:'creator'}};
  else if(path==='/messages')data={messages:[],unread_count:0};
  else if(path==='/modules')data={modules:[{id:course.module_id,alias:'neuron-guide',title:'课程模板'}]};
  else if(path==='/public/courses')data={courses:[]};
  else if(path==='/workspaces')data={workspaces:[]};
  else if(path==='/courses'&&req.method()==='POST'){created=req.postDataJSON();data={course};}
  else if(path==='/courses')data={courses:[]};
  else if(path==='/courses/guided-course')data={course};
  else if(path==='/courses/guided-course/revisions'){saved=req.postDataJSON().project;course.head_revision='saved-guided';data={id:'saved-guided'};}
  else if(path==='/revisions/saved-guided')data={id:'saved-guided',state:'ready',project:saved,review:null,preview_url:'/preview-test'};
  else if(path==='/courses/guided-course/github')data={enabled:false,repository:null,jobs:[],external_prs:[]};
  else throw new Error('Unexpected API '+path);
  await route.fulfill({json:data});
 });
 await page.goto(base+'/my-courses?tab=create');await page.getByLabel('课程名称',{exact:true}).fill(course.title);await page.getByLabel('课程简介',{exact:true}).fill(course.description);
 assert.equal(await page.getByLabel('起始内容',{exact:true}).count(),0);await page.getByRole('button',{name:'开始创建',exact:true}).click();
 await page.getByRole('heading',{name:'这门课，你想怎样讲？'}).waitFor();assert.equal(created.title,course.title);
 await page.getByRole('button',{name:'10 分钟',exact:true}).click();await page.getByRole('button',{name:'故事案例',exact:true}).click();await page.getByRole('button',{name:'有一定基础',exact:true}).click();await page.getByRole('button',{name:'生成课程大纲',exact:true}).click();
 assert.equal(await page.locator('.ga-outline li').count(),4);await page.getByLabel('第 1 页标题',{exact:true}).fill('从生活理解 Agent');await page.getByLabel('第 1 页内容',{exact:true}).fill('比较助手与普通程序的差别');await page.getByRole('button',{name:'确认大纲，开始逐页制作',exact:true}).click();
 assert.equal(await page.locator('.ga-design').count(),3);assert.equal(await page.getByRole('button',{name:'确认本页，下一页',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'保存修订',exact:true}).click();await page.locator('.ga-header>small').filter({hasText:/^已保存$/}).waitFor();assert.equal(await page.getByRole('button',{name:'提交审核',exact:true}).isDisabled(),true,'unfinished pages cannot be submitted');
 await page.getByLabel('都不合适？说说你的想法',{exact:true}).fill('左侧放生活案例，右侧用流程图');
 await page.getByLabel('添加参考图',{exact:true}).setInputFiles({name:'reference.png',mimeType:'image/png',buffer:Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=100;c.height=60;const x=c.getContext('2d');x.fillStyle='#287c71';x.fillRect(0,0,100,60);return c.toDataURL('image/png').split(',')[1];}),'base64')});
 await page.getByAltText('当前参考图',{exact:true}).waitFor();await page.getByRole('button',{name:'更新模板预览',exact:true}).click();assert.equal(await page.getByRole('button',{name:'确认本页，下一页',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'选择问题引入',exact:true}).click();await page.getByRole('button',{name:'确认本页，下一页',exact:true}).click();await page.getByText('第 2 / 4 页',{exact:true}).waitFor(); await page.getByLabel('都不合适？说说你的想法',{exact:true}).fill('第二页暂存的想法');
 await page.getByRole('button',{name:'上一页',exact:true}).click();assert.equal(await page.getByRole('button',{name:'选择问题引入',exact:true}).getAttribute('aria-pressed'),'true');await page.getByAltText('当前参考图',{exact:true}).waitFor();
 await page.getByRole('button',{name:'上一页',exact:true}).click();assert.equal(await page.getByLabel('第 1 页标题',{exact:true}).inputValue(),'从生活理解 Agent');
 await page.getByRole('button',{name:'上一页',exact:true}).click();assert.equal(await page.getByRole('button',{name:'10 分钟',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'40 分钟',exact:true}).click();await page.getByRole('button',{name:'动手探索',exact:true}).click();await page.getByRole('button',{name:'返回课程大纲',exact:true}).click();assert.equal(await page.locator('.ga-outline li').count(),4);assert.equal(await page.getByLabel('第 1 页内容',{exact:true}).inputValue(),'比较助手与普通程序的差别');
 await page.getByRole('button',{name:'确认大纲，开始逐页制作',exact:true}).click();await page.getByAltText('当前参考图',{exact:true}).waitFor();await page.getByRole('button',{name:'确认本页，下一页',exact:true}).click();assert.equal(await page.getByLabel('都不合适？说说你的想法',{exact:true}).inputValue(),'第二页暂存的想法');
 await page.getByRole('button',{name:'选择分步讲解',exact:true}).click();await page.getByRole('button',{name:'确认本页，下一页',exact:true}).click();await page.getByRole('button',{name:'选择图解优先',exact:true}).click();await page.getByRole('button',{name:'确认本页，下一页',exact:true}).click();await page.getByRole('button',{name:'选择图解优先',exact:true}).click();await page.getByRole('button',{name:'确认本页',exact:true}).click();await page.getByText('所有页面已确认，可以保存修订并预览整门课程。',{exact:true}).waitFor();
 await page.getByRole('button',{name:'保存修订',exact:true}).click();await page.locator('.ga-header>small').filter({hasText:/^已保存$/}).waitFor();
 assert.equal(await page.getByRole('button',{name:'提交审核',exact:true}).isEnabled(),true);assert.equal(saved.duration,40);assert.equal(saved.style,'动手探索');assert.equal(saved.pages.length,4);assert.equal(saved.pages[0].outline.guided.layout,'question');assert.match(saved.source.files['Page1.tsx'],/data:image\/jpeg/);assert.ok(saved.pages.every(p=>p.outline.guided.confirmed));
 await page.reload();await page.getByText('所有页面已确认，可以保存修订并预览整门课程。',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'选择问题引入',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.getByLabel('都不合适？说说你的想法',{exact:true}).inputValue(),'左侧放生活案例，右侧用流程图');
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
 await fs.mkdir('test-results/guided',{recursive:true});await fs.writeFile('test-results/guided/project.json',JSON.stringify(saved));await page.screenshot({path:'test-results/guided/mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/guided/desktop.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS guided creation: basic information → choices → editable outline → three designs and reference refinement → page confirmation → saved React source → reload and mobile.');
}catch(error){console.error(error);throw error;}finally{await browser.close();}
