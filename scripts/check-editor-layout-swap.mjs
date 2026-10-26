// Isolated UI test: no shared course source, server records or services are modified.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/shuku/auth/me',route=>route.fulfill({json:{user:{id:'author',username:'xiaoman',display_name:'小满',role:'creator'}}}));
 await page.route('**/api/shuku/messages',route=>route.fulfill({json:{messages:[],unread_count:0}}));
 await page.goto(base+'/scenedeck/?deck=neuron-guide',{waitUntil:'domcontentloaded'});await page.locator('.cw-native').waitFor();
 const brand=page.getByRole('link',{name:'术库首页',exact:true});assert.equal(await brand.locator('strong').innerText(),'术库');assert.equal(await brand.locator('svg path').getAttribute('d'),'M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1ZM12 5v16');assert.match(await page.title(),/^术库 · /);
 const swap=page.getByRole('button',{name:'交换布局',exact:true}),chat=page.getByRole('region',{name:'当前页创作'}),sidebar=page.locator('.cw-sidebar'),viewport=page.locator('.cw-viewport'),draft=page.getByLabel('当前页修改要求',{exact:true});
 assert.equal(await swap.count(),0,'preview remains unchanged');await page.getByRole('button',{name:'✎ 编辑',exact:true}).click();await swap.waitFor();assert.equal(await brand.locator('span').first().evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(40, 100, 250)');
 await draft.fill('保留这个修改要求，交换布局时不要丢失。');await page.locator('.cw-native').evaluate(node=>node.dataset.layoutTest='same-node');
 const selected=await page.locator('.cw-ppt-page.active').getAttribute('aria-label');
 const originalChat=await chat.boundingBox(),originalSidebar=await sidebar.boundingBox(),originalViewport=await viewport.boundingBox();assert.ok(originalSidebar.x<originalViewport.x&&originalChat.y>=originalViewport.y+originalViewport.height-2);
 const checkSwapped=async()=>{const c=await chat.boundingBox(),s=await sidebar.boundingBox(),v=await viewport.boundingBox();assert.ok(c.x+c.width<=v.x+3,'conversation is left of preview');assert.ok(s.y>=v.y+v.height-3,'slide selector is below preview');assert.ok(s.x>=c.x+c.width-2,'slide selector occupies only the right column');assert.ok(Math.abs(c.y+c.height-s.y-s.height)<=2,'left conversation extends to the bottom of the slide selector');};
 await swap.click();await checkSwapped();assert.equal(await swap.getAttribute('aria-pressed'),'true');assert.equal(await draft.inputValue(),'保留这个修改要求，交换布局时不要丢失。');assert.equal(await page.locator('.cw-native').getAttribute('data-layout-test'),'same-node','swapping must not remount course interactions');assert.equal(await page.locator('.cw-ppt-page.active').getAttribute('aria-label'),selected);
 const input=await draft.boundingBox(),history=await page.locator('.cw-conversation').boundingBox();assert.ok(input.y>=history.y+history.height-2,'conversation and input stay vertically stacked');
 await swap.focus();await swap.press('Enter');assert.equal(await swap.getAttribute('aria-pressed'),'false');assert.equal(await draft.inputValue(),'保留这个修改要求，交换布局时不要丢失。');
 await swap.click();await page.getByRole('button',{name:/打开第2页：/}).click();assert.equal(await page.locator('.cw-ppt-page.active').getAttribute('aria-label'),'第2页');
 await draft.fill('第二页的修改要求');await page.getByRole('button',{name:'✓ 完成编辑',exact:true}).click();assert.equal(await swap.count(),0);assert.equal(await page.locator('.cw-panels-swapped').count(),0);
 await page.getByRole('button',{name:'✎ 编辑',exact:true}).click();await checkSwapped();assert.equal(await draft.inputValue(),'第二页的修改要求');
 await page.getByRole('button',{name:'演示',exact:true}).click();await page.waitForFunction(()=>Boolean(document.fullscreenElement));assert.equal(await page.locator('.cw-panels-swapped').count(),0);await page.evaluate(()=>document.exitFullscreen());await swap.waitFor();await checkSwapped();
 await fs.mkdir('test-results/layout-swap',{recursive:true});await page.screenshot({path:'test-results/layout-swap/desktop.png'});
 await page.setViewportSize({width:390,height:844});await checkSwapped();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await draft.isVisible(),true);await page.screenshot({path:'test-results/layout-swap/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS editor layout swap: both directions, draft and slide state, native DOM retained, vertical conversation/input, full-height left conversation, right-column bottom navigation, preview/fullscreen restoration, keyboard and mobile.');
}finally{await browser.close();}
