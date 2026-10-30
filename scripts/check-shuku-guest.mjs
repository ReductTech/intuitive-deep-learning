import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_GUEST_URL||'http://localhost:5175',password=process.env.SHUKU_GUEST_TEST_PASSWORD;
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));assert.ok(password);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});page.setDefaultTimeout(30000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const writes=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/shuku')&&!r.url().includes('/auth/'))writes.push(r.url());});
 await page.goto(base+'/my-courses?tab=create');await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();
 await page.getByRole('button',{name:'游客体验',exact:true}).click();await page.getByRole('heading',{name:'我要创建课程',exact:true}).waitFor();
 assert.ok(await page.getByLabel('课程名称',{exact:true}).isDisabled());assert.ok(await page.getByRole('button',{name:'登录后开始创建'}).isVisible());
 assert.equal((await page.request.get(base+'/api/shuku/auth/me')).status(),401);
 for(const path of ['/courses','/courses/00000000-0000-4000-8000-000000000001/workspaces','/profile'])assert.equal((await page.request.post(base+'/api/shuku'+path,{data:{}})).status(),401);
 await page.reload();await page.getByRole('heading',{name:'我要创建课程',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'欢迎登录',exact:true}).count(),0);
 await page.getByRole('button',{name:'课程创作',exact:true}).click();await page.getByRole('link',{name:'共创待审核',exact:true}).click();await page.getByRole('heading',{name:'共创待审核',exact:true}).waitFor();
 for(const stage of ['待审核','待合并','待发版','全部']){await page.getByRole('tab',{name:stage,exact:true}).click();assert.equal(await page.getByRole('tab',{name:stage,exact:true}).getAttribute('aria-selected'),'true');}
 await page.getByRole('button',{name:'探索课程',exact:true}).click();await page.locator('.sd-library-card').first().waitFor();assert.ok(await page.locator('.sd-library-card').count()>1);
 await page.getByRole('button',{name:'我的收藏',exact:true}).click();assert.equal(await page.getByRole('heading',{name:'欢迎登录',exact:true}).count(),0);
 await page.getByRole('button',{name:'学习记录',exact:true}).click();await page.getByText('游客',{exact:true}).waitFor();
 await page.goto(base+'/profile');await page.getByRole('heading',{name:'个人信息',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'绑定 GitHub',exact:true}).count(),0);
 assert.deepEqual(writes,[]);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await fs.mkdir('test-results/guest',{recursive:true});await page.screenshot({path:'test-results/guest/mobile.png',fullPage:true});
 await page.getByRole('button',{name:'登录后使用',exact:true}).click();await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();
 await page.getByText('Demo 体验登录',{exact:true}).click();await page.getByLabel('体验账号').selectOption('xiaoman');await page.getByLabel('Demo 密码',{exact:true}).fill(password);await page.getByRole('button',{name:'进入 Demo',exact:true}).click();await page.getByRole('button',{name:'编辑个人资料',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('shuku:guest')),null);
 await page.goto(base+'/my-courses?tab=create');assert.ok(await page.getByLabel('课程名称',{exact:true}).isEnabled());await page.getByRole('button',{name:'退出',exact:true}).click();await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS guest UI: anonymous entry, read-only creation, denied API writes, navigation, review tabs, reload, personal isolation, mobile layout and transition to authenticated account.');
}finally{await browser.close();}
