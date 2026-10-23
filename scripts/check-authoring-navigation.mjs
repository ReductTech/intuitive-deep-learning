// Local UI regression: node scripts/check-authoring-navigation.mjs <playwright/index.mjs>
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert.ok(process.env.SHUKU_E2E_PASSWORD,'Use the isolated preview password');
const browser=await chromium.launch({headless:true,...(process.env.SHUKU_E2E_BROWSER_CHANNEL?{channel:process.env.SHUKU_E2E_BROWSER_CHANNEL}:{})});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.getByRole('button',{name:'课程创作',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'课程创作',exact:true}).getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'课程创作',exact:true}).getAttribute('aria-expanded'),'false');
 await page.getByRole('button',{name:'课程创作',exact:true}).click();await page.getByRole('link',{name:'我要创建课程',exact:true}).click();
 await page.getByLabel('账号',{exact:true}).selectOption('xiaoman');await page.getByLabel('密码',{exact:true}).fill(process.env.SHUKU_E2E_PASSWORD);await page.getByRole('button',{name:'登录',exact:true}).click();
 await page.getByRole('heading',{name:'我要创建课程',exact:true}).waitFor();await page.getByLabel('课程名称',{exact:true}).waitFor();
 assert.equal(await page.locator('header.sd-library-topbar').count(),1);assert.equal(await page.locator('.shuku-bar,.shuku-tabs').count(),0);assert.equal(await page.getByRole('dialog').count(),0,'creation is a child page, not a dialog');
 for(const [tab,label,heading] of [['mine','我的课程','我的课程'],['reviews','共创待审核','待审核课程'],['workspaces','我参与的共创','我参与的共创']]){
  await page.getByRole('button',{name:'课程创作',exact:true}).click();await page.getByRole('link',{name:label,exact:true}).click();await page.getByRole('heading',{name:heading,exact:true}).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('tab'),tab);assert.equal(await page.getByRole('button',{name:'课程创作',exact:true}).getAttribute('class'),'is-active');
  await page.reload();await page.getByRole('heading',{name:heading,exact:true}).waitFor();
 }
 await page.route('**/api/shuku/auth/me',async route=>{await new Promise(resolve=>setTimeout(resolve,700));await route.continue();});await page.goto(base+'/my-courses');await page.getByRole('button',{name:'课程创作',exact:true}).click();await page.getByRole('heading',{name:'我的课程',exact:true}).waitFor();assert.equal(await page.getByRole('link',{name:'共创待审核',exact:true}).isVisible(),true,'auth refresh must not close the open dropdown');await page.keyboard.press('Escape');await page.unroute('**/api/shuku/auth/me');
 await page.getByRole('button',{name:'课程创作',exact:true}).click();await page.locator('h1').click();assert.equal(await page.getByRole('button',{name:'课程创作',exact:true}).getAttribute('aria-expanded'),'false');
 await page.getByRole('button',{name:'我的收藏',exact:true}).click();await page.getByRole('heading',{name:/留住你的好奇心/}).waitFor();
 await page.getByRole('button',{name:'探索课程',exact:true}).click();await page.getByRole('heading',{name:/下一次理解/}).waitFor();await page.reload();await page.getByRole('heading',{name:/下一次理解/}).waitFor();
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'课程创作',exact:true}).click();await page.getByRole('link',{name:'我要创建课程',exact:true}).click();await page.getByRole('heading',{name:'我要创建课程',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile page overflows');
 const menu=page.getByRole('button',{name:'课程创作',exact:true});await menu.click();const box=await page.locator('#authoring-subpages').boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=390,'mobile dropdown overflows');
 assert.deepEqual(errors,[]);console.log('PASS: shared header, child routes, refresh, inline creation, saved navigation, keyboard/outside dismissal and mobile layout.');
 if(process.env.SHUKU_E2E_ARTIFACT_DIR){await page.setViewportSize({width:1440,height:960});await page.screenshot({path:path.join(process.env.SHUKU_E2E_ARTIFACT_DIR,'authoring-child-navigation.png')});}
}finally{await browser.close();}
