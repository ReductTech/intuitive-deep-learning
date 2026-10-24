import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_PROFILE_URL||'http://localhost:5175',password=process.env.SHUKU_PROFILE_TEST_PASSWORD;
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));assert.ok(password);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});page.setDefaultTimeout(60000);
 async function login(name){await page.getByText('Demo 体验登录',{exact:true}).click();await page.getByLabel('体验账号').selectOption(name);await page.getByLabel('Demo 密码',{exact:true}).fill(password);await page.getByRole('button',{name:'进入 Demo',exact:true}).click();await page.getByRole('heading',{name:'个人信息',exact:true}).waitFor();}
 await page.goto(base+'/profile');await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();await login('xiaoman');
 const original=await(await page.request.get(base+'/api/shuku/profile')).json();
 try{
  assert.ok(await page.getByRole('link',{name:'个人信息',exact:true}).isVisible());
  await page.getByRole('button',{name:'编辑个人资料',exact:true}).click();await page.getByLabel('姓名',{exact:true}).fill('暂不保存');await page.getByRole('button',{name:'取消',exact:true}).click();await page.getByLabel('姓名',{exact:true}).waitFor({state:'detached'});assert.equal((await(await page.request.get(base+'/api/shuku/profile')).json()).user.display_name,original.user.display_name);
  await page.getByRole('button',{name:'编辑个人资料',exact:true}).click();await page.getByLabel('姓名',{exact:true}).fill('小满');await page.getByLabel('个人简介',{exact:true}).fill('把复杂知识讲清楚。');await page.getByLabel('联系邮箱',{exact:true}).fill('creator@example.com');await page.getByRole('button',{name:'保存资料',exact:true}).click();await page.getByRole('status').filter({hasText:'个人资料已保存'}).waitFor();
  await page.reload();await page.getByText('creator@example.com',{exact:true}).waitFor();assert.equal((await(await page.request.get(base+'/api/shuku/profile')).json()).user.id,original.user.id);
  await fs.mkdir(process.env.SHUKU_PROFILE_ARTIFACTS||'test-results/profile',{recursive:true});await page.screenshot({path:(process.env.SHUKU_PROFILE_ARTIFACTS||'test-results/profile')+'/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:(process.env.SHUKU_PROFILE_ARTIFACTS||'test-results/profile')+'/mobile.png',fullPage:true});
  await page.getByRole('button',{name:'退出',exact:true}).click();await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();await page.goto(base+'/profile');await login('linzhi');await page.getByText('linzhi',{exact:true}).waitFor();assert.equal(await page.getByText('creator@example.com',{exact:true}).count(),0);
 }finally{
  // Restore the disposable account through its own session.
  await page.request.post(base+'/api/shuku/auth/logout',{data:{}});await page.request.post(base+'/api/shuku/auth/login',{data:{username:'xiaoman',password}});await page.request.post(base+'/api/shuku/profile',{headers:{'X-Shuku-Account':original.user.id},data:{display_name:original.user.display_name,bio:original.bio,email:original.email}});
 }
 console.log('PASS profile: gated deep link, navigation, cancel, save/reload, UUID preservation, account isolation and mobile layout.');
}finally{await browser.close();}
