// Browser regression with mocked APIs: no live course data is created.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/shuku/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname.slice('/api/shuku'.length);
  if(path==='/courses'&&request.method()==='POST'){
   posts.push(request.postDataJSON());return route.fulfill({json:{course:{id:'category-created'}}});
  }
  const data={
   '/auth/me':{user:{id:'category-author',username:'xiaoman',display_name:'小满',role:'creator'}},
   '/courses':{courses:[{id:'private',title:'私有课程',category:'数学'}]},
   '/modules':{modules:[{id:'module-test',title:'课程模板',alias:'test'}]},
   '/workspaces':{workspaces:[]},
   '/messages':{messages:[],unread_count:0},
   '/public/courses':{courses:[{id:'public',category:'科学'}, {id:'duplicate',category:'人工智能'}]},
  }[path];
  assert.ok(data,'Unexpected API '+path);return route.fulfill({json:data});
 });
 await page.route('**/my-courses/editor?**',route=>route.fulfill({contentType:'text/html',body:'创建完成'}));
 await page.goto(base+'/my-courses?tab=create');
 const category=page.getByRole('combobox',{name:'课程类别',exact:true});await category.waitFor();
 assert.equal(await category.inputValue(),'人工智能');
 assert.deepEqual(await category.locator('option').allTextContents(),['人工智能','设计方法','开发实践','数学','科学','＋ 新增分类']);
 assert.equal(await page.getByLabel('新分类名称',{exact:true}).count(),0);
 await category.selectOption('设计方法');await page.getByLabel('课程名称',{exact:true}).fill('下拉分类验收');
 await page.getByRole('button',{name:'开始创建',exact:true}).click();await page.waitForURL('**/my-courses/editor?**');
 assert.equal(posts.at(-1).category,'设计方法');
 await page.goto(base+'/my-courses?tab=create');await category.selectOption('__new_category__');
 const custom=page.getByLabel('新分类名称',{exact:true});assert.equal(await custom.getAttribute('maxlength'),'80');
 await page.getByLabel('课程名称',{exact:true}).fill('自定义分类验收');await page.getByRole('button',{name:'开始创建',exact:true}).click();assert.equal(posts.length,1);
 await custom.fill('   ');await page.getByRole('button',{name:'开始创建',exact:true}).click();await page.getByRole('alert').filter({hasText:'请输入课程分类。'}).first().waitFor();assert.equal(posts.length,1);
 await custom.fill('  数字艺术  ');await page.getByRole('button',{name:'开始创建',exact:true}).click();await page.waitForURL('**/my-courses/editor?**');assert.equal(posts.at(-1).category,'数字艺术');
 await page.goto(base+'/my-courses?tab=create');await category.selectOption('__new_category__');await custom.fill('不会被提交');await category.selectOption('开发实践');assert.equal(await custom.count(),0);
 await page.getByLabel('课程名称',{exact:true}).fill('切换分类验收');await page.getByRole('button',{name:'开始创建',exact:true}).click();await page.waitForURL('**/my-courses/editor?**');assert.equal(posts.at(-1).category,'开发实践');
 await page.goto(base+'/my-courses?tab=create');await page.setViewportSize({width:390,height:844});await category.waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS category dropdown: defaults, existing categories, deduplication, custom category validation and payload, switching, mobile layout.');
}finally{await browser.close();}


