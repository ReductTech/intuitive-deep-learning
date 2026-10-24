import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_LOGIN_URL||'http://localhost:5175',password=process.env.SHUKU_LOGIN_TEST_PASSWORD;
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));assert.ok(password,'Set the disposable Demo account password');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext(),page=await context.newPage();page.setDefaultTimeout(60000);
 const dataRequests=[];page.on('request',r=>{if(/\/api\/shuku\/(public\/courses|personal)(?:\?|$)/.test(r.url()))dataRequests.push(r.url());});
 for(const route of ['/','/?view=saved','/messages','/study?module=creator-guide','/my-courses/editor?course=test','/modules/creator-guide','/scenedeck/?deck=creator-guide&scenedeckCapture=1']){
  await page.goto(base+route);await page.getByRole('heading',{name:'登录术库',exact:true}).waitFor();await page.getByRole('button',{name:'登录',exact:true}).waitFor();assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);assert.equal(await page.locator('.cg-guide,.cw-app,.shuku-source-editor').count(),0);
 }
 assert.deepEqual(dataRequests,[],'Protected course data must not be requested before login');
 const destination='/my-courses?tab=create#keep-this';await page.goto(base+destination);
 await page.getByLabel('密码',{exact:true}).fill('wrong-test-password');await page.getByRole('button',{name:'登录',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);
 await page.getByLabel('密码',{exact:true}).fill(password);await page.getByRole('button',{name:'登录',exact:true}).click();await page.getByRole('heading',{name:'我要创建课程',exact:true}).waitFor();assert.equal(new URL(page.url()).pathname+new URL(page.url()).search+new URL(page.url()).hash,destination);
 await page.reload();await page.getByRole('heading',{name:'我要创建课程',exact:true}).waitFor();
 await page.getByRole('button',{name:'退出',exact:true}).click();await page.getByRole('button',{name:'登录',exact:true}).waitFor();assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);
 await page.getByLabel('密码',{exact:true}).fill(password);await page.getByRole('button',{name:'登录',exact:true}).click();await page.getByRole('button',{name:'探索课程',exact:true}).waitFor();
 await context.clearCookies();await page.evaluate(async()=>{const {api}=await import('/src/shuku/client.ts');await api('/personal').catch(()=>{});});await page.getByRole('button',{name:'登录',exact:true}).waitFor();assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);
 await page.route('**/api/shuku/auth/me',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'test unavailable'})}));await page.reload();await page.getByRole('button',{name:'重新验证',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'登录',exact:true}).count(),0);assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);
 await page.unroute('**/api/shuku/auth/me');await page.getByRole('button',{name:'重新验证',exact:true}).click();await page.getByRole('button',{name:'登录',exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Login layout fits a phone viewport');
 console.log('PASS login-first: protected deep links, no premature data requests, invalid password, URL restoration, persisted session, logout, session expiry, service outage and narrow layout.');
 await context.close();
}finally{await browser.close();}
