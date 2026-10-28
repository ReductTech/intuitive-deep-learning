import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_ADMIN_URL||'http://localhost:5175',password=process.env.SHUKU_ADMIN_TEST_PASSWORD;
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));assert.ok(password);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(60000);
 async function login(name){await page.goto(base+'/data');await page.getByText('Demo 体验登录',{exact:true}).click();await page.getByLabel('体验账号').selectOption(name);await page.getByLabel('Demo 密码',{exact:true}).fill(password);await page.getByRole('button',{name:'进入 Demo',exact:true}).click();}
 await login('admin');await page.getByRole('button',{name:'数据管理',exact:true}).waitFor();await page.goto(base+'/');await page.getByRole('button',{name:'数据管理',exact:true}).click();await page.locator('.admin-tabs').waitFor();
 await page.getByText('待收录课程',{exact:true}).click();
 const title='管理员界面测试 '+Date.now();const created=await page.request.post(base+'/api/shuku/courses',{headers:{Origin:base},data:{module_id:crypto.randomUUID(),title,description:'测试草稿',category:'测试'}});assert.equal(created.status(),201);const cid=(await created.json()).course.id;
 try{
  await page.getByRole('button',{name:'刷新数据',exact:true}).click();let card=page.getByRole('article').filter({has:page.getByRole('heading',{name:title,exact:true})});await card.waitFor();
  await card.getByRole('button',{name:'下架课程',exact:true}).click();await page.locator('details[aria-label="已删除课程"]>summary').click();await card.getByText('管理员 · 已下架',{exact:false}).waitFor();await card.getByRole('button',{name:'恢复课程',exact:true}).click();await card.getByText('管理员 · 未发布草稿',{exact:false}).waitFor();
  const output=process.env.SHUKU_ADMIN_ARTIFACTS||'test-results/admin';await fs.mkdir(output,{recursive:true});await page.screenshot({path:output+'/desktop.png',fullPage:true});
  for(const name of ['贡献数据','错误反馈','操作记录']){await page.getByRole('link',{name,exact:true}).click();await page.getByRole('button',{name:'刷新数据',exact:true}).waitFor({state:'visible'});await page.locator('.admin-tabs').waitFor();}
  await page.getByRole('link',{name:'课程管理',exact:true}).click();await page.locator('details[aria-label="待收录课程"]>summary').click();await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:output+'/mobile.png',fullPage:true});
  card=page.getByRole('article').filter({has:page.getByRole('heading',{name:title,exact:true})});await card.getByRole('button',{name:'永久删除',exact:true}).click();const dialog=page.getByRole('dialog');assert.equal(await dialog.locator('input').count(),0);await dialog.getByRole('button',{name:'确认删除',exact:true}).click();await page.waitForFunction(async url=>(await fetch(url)).status===404,'/api/shuku/courses/'+cid,{polling:500});assert.equal((await page.request.get(base+'/api/shuku/courses/'+cid)).status(),404);
 }finally{await page.request.post(base+'/api/shuku/courses/'+cid+'/remove',{headers:{Origin:base},data:{confirm:true}});}
 await page.goto(base+'/');await page.getByRole('button',{name:'退出',exact:true}).click();await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();await login('linzhi');await page.getByRole('heading',{name:'仅管理员可以管理数据',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'数据管理',exact:true}).count(),0);assert.equal((await page.request.get(base+'/api/shuku/admin/courses')).status(),403);
 console.log('PASS admin: role-specific navigation, four categories, hide/restore, confirmed durable deletion, normal-user isolation and narrow layout.');
}finally{await browser.close();}
