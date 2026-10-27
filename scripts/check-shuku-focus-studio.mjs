// All persistence is intercepted; no server course is created or changed.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base='http://localhost:5175';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const course={id:'focus-course',module_id:'custom',title:'Personal Agent',head_revision:'saved',status:'draft',description:'',category:'人工智能'};
 const project={version:1,id:'project',courseId:'custom',title:course.title,duration:40,style:'简洁图解',outlineConfirmed:false,pages:Array.from({length:8},(_,i)=>({id:'p'+i,format:'text',title:i?'从回答问题到完成任务 '+i:'从一个问题开始：AI 能帮我安排下周的学习吗？',goal:'理解真实任务与回答问题的区别',summary:'呈现用户需求：帮我在下周安排两次 AI 学习，每次一小时，避开已有会议。\n引导思考：AI 需要知道什么，能够做什么？',note:'',ready:false,designed:false,revisions:[],messages:[],outline:{guided:{phase:'outline',audience:'初学者',description:'学习 Personal Agent',confirmed:false}}}))};let writes=0;
 await page.route('**/api/shuku/**',async route=>{const path=new URL(route.request().url()).pathname;let data;
  if(route.request().method()!=='GET'){writes++;throw Error('Unexpected write '+path);}
  if(path.endsWith('/auth/me'))data={user:{id:'owner',role:'creator',username:'xiaoman',display_name:'小满'}};
  else if(path.endsWith('/messages'))data={messages:[],unread_count:0};
  else if(path.endsWith('/courses/focus-course'))data={course};
  else if(path.endsWith('/revisions/saved'))data={id:'saved',project,state:'ready',review:null,preview_url:'/unused'};
  else if(path.endsWith('/github'))data={enabled:false,jobs:[],repository:null,external_prs:[]};
  else throw Error('Unexpected API '+path);
  await route.fulfill({json:data});
 });
 await page.goto(base+'/my-courses/editor?course=focus-course&outline=1');
 await page.getByRole('button',{name:'确定逻辑，细化模块',exact:true}).click();await page.getByRole('button',{name:'确定模块，细化页面',exact:true}).click();await page.getByRole('button',{name:'确认大纲，开始逐页制作',exact:true}).click();
 const studio=page.getByRole('region',{name:'逐页制作',exact:true}),directory=page.getByRole('group',{name:'课程页面',exact:true});
 await studio.waitFor();assert.equal(await page.locator('.ga-progress').count(),0);assert(!await directory.isVisible());assert(!await page.getByLabel('本页标题',{exact:true}).isVisible());assert.equal(await page.getByLabel('都不合适？说说你的想法',{exact:true}).count(),0);assert.equal(await page.locator('.ga-design').count(),3);
 const menu=page.getByText('课程操作',{exact:true});await menu.focus();await page.keyboard.press('Enter');assert(await page.getByRole('button',{name:'保存修订',exact:true}).isVisible());await page.keyboard.press('Enter');assert(!await page.getByRole('button',{name:'保存修订',exact:true}).isVisible());
 await fs.mkdir('test-results/focus-studio',{recursive:true});await page.screenshot({path:'test-results/focus-studio/choices.png',fullPage:true});
 await page.getByText('编辑本页内容',{exact:true}).click();await page.getByLabel('讲解内容',{exact:true}).fill('保留当前页的讲解内容。');await page.getByText('编辑本页内容',{exact:true}).click();
 await page.getByRole('button',{name:'选择分步讲解',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.ga-design').count(),0);await page.getByRole('region',{name:'当前画面',exact:true}).waitFor();assert(!await page.getByLabel('讲解内容',{exact:true}).isVisible());
 await page.screenshot({path:'test-results/focus-studio/selected.png',fullPage:true});
 await page.getByRole('button',{name:'更换画面',exact:true}).click();assert.equal(await page.locator('.ga-design').count(),3);assert.equal(await page.getByRole('button',{name:'选择分步讲解',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'都不合适？说说你的想法',exact:true}).click();await page.getByLabel('都不合适？说说你的想法',{exact:true}).fill('保留草稿：用流程图解释任务安排。');await page.getByRole('button',{name:'更新模板预览',exact:true}).click();assert.equal(await page.getByLabel('都不合适？说说你的想法',{exact:true}).count(),0);assert(await page.getByRole('button',{name:'确认本页，下一页',exact:true}).isDisabled());
 await page.getByRole('button',{name:'选择图解优先',exact:true}).click();await page.getByRole('button',{name:'确认本页，下一页',exact:true}).click();await page.getByText('第 2 / 8 页',{exact:true}).waitFor();assert(!await page.getByLabel('讲解内容',{exact:true}).isVisible());assert.equal(await page.locator('.ga-design').count(),3);
 await page.getByText('第 2 / 8 页',{exact:true}).click();await directory.waitFor();await directory.getByRole('button').first().click();assert(!await directory.isVisible());assert.equal(await page.getByRole('region',{name:'当前画面',exact:true}).getAttribute('data-layout'),'visual');await page.getByRole('button',{name:'微调画面',exact:true}).click();assert.equal(await page.getByLabel('都不合适？说说你的想法',{exact:true}).inputValue(),'保留草稿：用流程图解释任务安排。');await page.getByRole('button',{name:'收起微调',exact:true}).click();
 await page.getByText('编辑本页内容',{exact:true}).click();assert.equal(await page.getByLabel('讲解内容',{exact:true}).inputValue(),'保留当前页的讲解内容。');await page.getByText('编辑本页内容',{exact:true}).click();
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/focus-studio/mobile-selected.png',fullPage:true});await page.getByRole('button',{name:'更换画面',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/focus-studio/mobile-choices.png',fullPage:true});assert.deepEqual(errors,[]);assert.equal(writes,0);
 console.log('PASS focus studio: progressive disclosures, selection and changing designs, custom refinement, draft/content retention, page directory, keyboard, mobile and no implicit writes');
}finally{await browser.close();}
