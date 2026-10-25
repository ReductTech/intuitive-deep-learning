// Upload and authoring acceptance with mocked APIs; does not create live courses.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const course={id:'ppt-course',title:'Agent 课程',description:'已有课程继续创作',category:'人工智能',module_id:'9acfbca1-b881-457e-add6-21e0b6b855a0',head_revision:'imported-ppt',status:'draft'};
 let saved={version:1,id:'project',courseId:'neuron-guide',title:course.title,duration:20,style:'简洁图解',outlineConfirmed:false,presentation:{filename:'我的课程.pptx',slideCount:2,warnings:[]},pages:['Agent 是什么','工具调用'].map((title,i)=>({id:'ppt-page-'+i,format:'text',title,summary:i?'使用天气查询工具':'课程中的原有内容',goal:'理解本页内容',note:'',ready:false,designed:false,revisions:[],messages:[],outline:{guided:{phase:'choices',audience:'初学者',description:course.description,imported:true,reference:{title,body:i?'使用天气查询工具':'课程中的原有内容',notes:'先让学习者说出自己的看法'},suggestions:['加入一个贴近日常的案例或动手任务。']}}}))};
 let uploads=0;
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);let data;
  if(path==='/auth/me')data={user:{id:'author',username:'xiaoman',display_name:'小满',role:'creator'}};
  else if(path==='/messages')data={messages:[],unread_count:0};
  else if(path==='/modules')data={modules:[{id:course.module_id,title:'课程模板',alias:'neuron-guide'}]};
  else if(path==='/workspaces')data={workspaces:[]};
  else if(path==='/public/courses'||path==='/courses')data={courses:[]};
  else if(path==='/courses/import-presentation'){
   uploads++;assert.match(req.headers()['content-type'],/^multipart\/form-data; boundary=/);const body=req.postDataBuffer().toString();assert.match(body,/name="metadata"/);assert.match(body,/name="file"/);assert.match(body,/我的课程.pptx/);assert.match(body,/Agent 课程/);data={course,revision:{id:'imported-ppt',state:'building'}};
  }else if(path==='/courses/ppt-course')data={course};
  else if(path==='/courses/ppt-course/revisions'){saved=req.postDataJSON().project;course.head_revision='saved-ppt';data={id:'saved-ppt'};}
  else if(path==='/revisions/imported-ppt'||path==='/revisions/saved-ppt')data={id:course.head_revision,state:'ready',project:saved,review:null};
  else if(path==='/courses/ppt-course/github')data={enabled:false,repository:null,jobs:[],external_prs:[]};
  else throw new Error('Unexpected API '+path);
  await route.fulfill({json:data});
 });
 await page.goto(base+'/my-courses?tab=create');await page.getByLabel('课程名称',{exact:true}).fill(course.title);await page.getByLabel('课程简介',{exact:true}).fill(course.description);
 await page.getByLabel('上传课程 PPT',{exact:true}).setInputFiles({name:'old.ppt',mimeType:'application/vnd.ms-powerpoint',buffer:Buffer.from('legacy')});await page.getByText(/请选择 100 MB 以内的 .pptx/).first().waitFor();assert.equal(uploads,0);
 await page.getByLabel('上传课程 PPT',{exact:true}).setInputFiles({name:'我的课程.pptx',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',buffer:Buffer.alloc(21*1024*1024,1)});
 await page.getByRole('button',{name:'开始创建',exact:true}).click();await page.getByRole('heading',{name:'这门课，你想怎样讲？',exact:true}).waitFor();assert.equal(uploads,1);await page.getByText('已读取 2 页',{exact:true}).waitFor();
 await page.getByRole('button',{name:'40 分钟',exact:true}).click();await page.getByRole('button',{name:'查看课程大纲',exact:true}).click();assert.equal(await page.locator('.ga-outline li').count(),2);assert.equal(await page.getByLabel('第 1 页标题',{exact:true}).inputValue(),'Agent 是什么');
 await page.getByLabel('第 1 页内容',{exact:true}).fill('结合已有 PPT 补充一个生活案例');await page.getByRole('button',{name:'确认大纲，开始逐页制作',exact:true}).click();
 await page.getByText('原 PPT 与创作建议',{exact:true}).click();await page.getByText('先让学习者说出自己的看法',{exact:true}).waitFor();await page.getByText('加入一个贴近日常的案例或动手任务。',{exact:true}).waitFor();
 await page.getByRole('button',{name:'选择分步讲解',exact:true}).click();await page.getByRole('button',{name:'确认本页，下一页',exact:true}).click();await page.getByRole('button',{name:'上一页',exact:true}).click();assert.equal(await page.getByLabel('讲解内容',{exact:true}).inputValue(),'结合已有 PPT 补充一个生活案例');
 await page.getByRole('button',{name:'保存修订',exact:true}).click();await page.locator('.ga-header>small').filter({hasText:/^已保存$/}).waitFor();await page.reload();await page.getByText('原 PPT 与创作建议',{exact:true}).waitFor();
 assert.equal(saved.presentation.filename,'我的课程.pptx');assert.equal(saved.pages[0].outline.guided.reference.body,'课程中的原有内容');assert.match(saved.source.files['Page1.tsx'],/生活案例/);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await fs.mkdir('test-results/presentation',{recursive:true});await page.screenshot({path:'test-results/presentation/mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/presentation/desktop.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS PPTX upload: format validation, multipart, imported outline, notes and suggestions, backtracking, source saving/reload and mobile.');
}finally{await browser.close();}
