import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_BRAND_URL||'http://localhost:5175',password=process.env.SHUKU_BRAND_TEST_PASSWORD,root=process.env.SHUKU_BRAND_ROOT,output=process.env.SHUKU_BRAND_ARTIFACTS||'test-results/brand';
assert.ok(password&&root);assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));await fs.mkdir(output,{recursive:true});
for(const name of ['index.html','src/app/HomePage.tsx','src/creator/CreatorWorkspace.tsx','src/shuku/SiteHeader.tsx','modules/Creator-Guide/pages/CreationWorkflowPage.tsx'])assert.ok(!(await fs.readFile(path.join(root,name),'utf8')).includes('SceneDeck'),name+' still exposes old product name');
for(const name of ['deprecated/index.html','deprecated/web_ppt/index.html','deprecated/web_ppt/slide.html'])assert.ok(!(await fs.readFile(path.join(root,name),'utf8')).includes('SceneDeck'),name+' still exposes old page title');
const player=await fs.readFile(path.join(root,'modules/shared/react/presentation/SceneDeck.tsx'),'utf8');assert.ok(player.includes("document.title = '术库 · '"));assert.ok(player.includes('aria-label="术库工具栏"'));assert.ok(!/>SceneDeck<|["']SceneDeck · /.test(player));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(60000);
 await page.goto(base+'/');await page.getByText('Demo 体验登录',{exact:true}).click();await page.getByLabel('体验账号').selectOption('admin');await page.getByLabel('Demo 密码',{exact:true}).fill(password);await page.getByRole('button',{name:'进入 Demo',exact:true}).click();await page.getByRole('link',{name:'术库首页',exact:true}).waitFor();
 assert.equal(await page.title(),'术库 · 探索交互课程');assert.ok(!(await page.locator('body').innerText()).includes('SceneDeck'));await page.locator('.sd-library-footer').getByText('术库',{exact:true}).waitFor();await page.screenshot({path:output+'/home.png'});
 for(const route of ['/profile','/data','/my-courses?tab=create']){await page.goto(base+route);await page.getByRole('link',{name:'术库首页',exact:true}).waitFor();assert.ok(!(await page.locator('body').innerText()).includes('SceneDeck'));assert.ok((await page.title()).startsWith('术库'));}
 await page.goto(base+'/scenedeck/?deck=creator-guide');await page.locator('.cw-brand strong').getByText('术库',{exact:true}).waitFor();assert.ok((await page.title()).startsWith('术库'));assert.ok(!(await page.locator('body').innerText()).includes('SceneDeck'));
 await page.goto(base+'/scenedeck/?scenedeckCapture=1&deck=creator-guide&slide=creation-workflow');await page.locator('.cg-sim-brand').getByText('术库',{exact:true}).waitFor();assert.ok(!(await page.locator('body').innerText()).includes('SceneDeck'));await page.evaluate(()=>document.fonts.ready);
 if(process.env.SHUKU_BRAND_THUMBNAIL){const target=process.env.SHUKU_BRAND_THUMBNAIL;await fs.mkdir(path.dirname(target),{recursive:true});await page.locator('.ppt-slide-surface').screenshot({path:target,animations:'disabled'});}
 await page.goto(base+'/');await page.setViewportSize({width:390,height:844});await page.getByRole('link',{name:'术库首页',exact:true}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:output+'/mobile.png'});
 console.log('PASS Shuku branding: titles, header, footer, profile/admin/create, editor, teaching example, compatible links and mobile layout.');
}finally{await browser.close();}
