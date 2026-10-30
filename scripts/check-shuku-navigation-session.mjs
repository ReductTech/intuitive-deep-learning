import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_LOGIN_URL||'http://localhost:5175',password=process.env.SHUKU_LOGIN_TEST_PASSWORD;
assert.ok(password);assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext(),page=await context.newPage();page.setDefaultTimeout(60000);
 await page.goto(base+'/');await page.getByText('Demo 体验登录',{exact:true}).click();await page.getByLabel('Demo 密码',{exact:true}).fill(password);await page.getByRole('button',{name:'进入 Demo',exact:true}).click();await page.getByRole('link',{name:'术库首页',exact:true}).waitFor();
 for(const destination of ['/my-courses?tab=create','/?view=history','/?view=saved','/profile','/messages']){
  let release;const blocked=new Promise(resolve=>{release=resolve;});
  const handler=async route=>{await blocked;await route.continue();};await page.route('**/api/shuku/auth/me',handler);
  try{
   await page.goto(base+destination,{waitUntil:'domcontentloaded'});await page.getByRole('status').filter({hasText:'正在恢复登录状态'}).waitFor();
   assert.equal(await page.getByRole('heading',{name:'欢迎登录',exact:true}).count(),0,'restoring '+destination+' must not mount login');assert.equal(await page.locator('input[type=password]').count(),0);assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);
  }finally{release();}
  await page.getByRole('link',{name:'术库首页',exact:true}).waitFor();assert.equal(new URL(page.url()).pathname+new URL(page.url()).search,destination);await page.unroute('**/api/shuku/auth/me',handler);
 }
 // A restore outage offers retry, not credential entry or protected content.
 await page.route('**/api/shuku/auth/me',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'test outage'})}));await page.reload();await page.getByRole('button',{name:'重新验证',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'欢迎登录',exact:true}).count(),0);assert.equal(await page.locator('input[type=password]').count(),0);assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);
 await page.unroute('**/api/shuku/auth/me');await page.getByRole('button',{name:'重新验证',exact:true}).click();await page.getByRole('link',{name:'术库首页',exact:true}).waitFor();
 await context.clearCookies();await page.reload();await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);
 console.log('PASS navigation session: slow authenticated restores never show login; routes preserved; outage retry and real expiry protected.');
}finally{await browser.close();}
