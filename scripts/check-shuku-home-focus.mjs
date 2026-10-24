import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_LOGIN_URL||'http://localhost:5175',password=process.env.SHUKU_LOGIN_TEST_PASSWORD;
assert.ok(password);assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(60000);
 await page.goto(base+'/');await page.getByText('Demo 体验登录',{exact:true}).click();await page.getByLabel('Demo 密码',{exact:true}).fill(password);await page.getByRole('button',{name:'进入 Demo',exact:true}).click();await page.getByRole('link',{name:'术库首页',exact:true}).waitFor();
 assert.equal(await page.locator('.sd-library-heading').count(),0);
 for(const text of ['EXPLORE · INTERACT · UNDERSTAND','下一次理解，从这里开始','从真实问题出发，在交互中建立直觉。'])assert.ok(!(await page.locator('main').innerText()).includes(text));
 await page.locator('.sd-library-search input').waitFor();assert.ok(await page.locator('.sd-library-card').count()>0);const box=await page.locator('.sd-library-search').boundingBox();assert.ok(box.y<300,'No empty hero area left above browsing');
 await page.getByRole('button',{name:/^我的收藏/}).click();await page.getByRole('heading',{name:/留住你的好奇心/}).waitFor();await page.getByRole('button',{name:'探索课程',exact:true}).click();assert.equal(await page.locator('.sd-library-heading').count(),0);
 await page.goto(base+'/?view=history');await page.getByRole('heading',{name:/继续你的学习/}).waitFor();await page.getByRole('button',{name:'探索课程',exact:true}).click();await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('.sd-library-heading').count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS focused homepage: intro removed without blank space; course browsing retained; saved/history headings and mobile layout preserved.');
}finally{await browser.close();}
