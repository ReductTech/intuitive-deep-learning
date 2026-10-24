// Local browser acceptance and actual-slide thumbnail rendering.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const base=process.env.SHUKU_SLIDES_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const output=process.env.SHUKU_SLIDES_ARTIFACTS||'test-results/creator-shuku';await fs.mkdir(output,{recursive:true});
const thumbnails=process.env.SHUKU_SLIDES_THUMBNAILS;if(thumbnails)await fs.mkdir(thumbnails,{recursive:true});
const ids=['shuku-why','shuku-participation','shuku-review','shuku-growth'];
const browser=await chromium.launch({headless:true,channel:process.env.SHUKU_E2E_BROWSER_CHANNEL||'chrome'});
try{
 const page=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce'});
 const password=process.env.SHUKU_E2E_PASSWORD;assert.ok(password,'Set SHUKU_E2E_PASSWORD for login-first course checks');const auth=await page.request.post(base+'/api/shuku/auth/login',{headers:{Origin:base},data:{username:'xiaoman',password}});assert.equal(auth.status(),200);page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const id of ids){
  await page.goto(base+'/scenedeck/?deck=creator-guide&slide='+id+'&scenedeckCapture=1',{waitUntil:'domcontentloaded'});
  const slide=page.locator('.cg-shuku-page');await slide.waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('[data-scene-id]').getAttribute('data-scene-id'),id);
  const all=JSON.parse(await page.locator('[data-scene-ids]').getAttribute('data-scene-ids'));assert.equal(all.length,21);assert.deepEqual(all.slice(-5),['discovery-learning',...ids]);
  assert.equal(await slide.getByRole('heading',{level:1}).count(),1);
  assert.equal(await slide.locator('.cg-shuku-eyebrow > span').count(),1,'Header contains only the section label');
  assert.doesNotMatch(await slide.locator('.cg-shuku-heading').innerText(), /0[1-4]\s*\/\s*04/);
  assert.equal(await slide.locator('img').count(),0,'Product pages must contain real text and vector geometry');
  const overflow=await slide.evaluate(root=>{const box=root.getBoundingClientRect();return [...root.querySelectorAll('*')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1);}).map(el=>el.className?.baseVal??el.className).slice(0,15);});
  assert.deepEqual(overflow,[],id+' exceeds the 1600 × 900 canvas');
  if(id==='shuku-participation'){assert.match(await slide.getByRole('heading',{level:1}).innerText(), /每个人都可以参与到课程的进化/);assert.doesNotMatch(await slide.innerText(), /每个人都可以找到参与的位置/);}
  if(id==='shuku-review'){await slide.getByText('审核通过后，仍需接受并发布。',{exact:false}).waitFor();await slide.getByText('学习者可继续旧版，或主动切换新版。',{exact:false}).waitFor();}
  if(id==='shuku-review'){
   await slide.getByRole('heading',{name:'3. 接受并正式发布',exact:true}).waitFor();
   await slide.getByRole('heading',{name:'对共创想法进行质量审核',exact:true}).waitFor();
   await slide.getByRole('heading',{name:'自动质量评分',exact:true}).waitFor();
   await slide.getByText('供审核人参考',{exact:true}).waitFor();
   assert.equal(await slide.locator('.cg-shuku-score-result strong').innerText(),'82');
   const scoring=await slide.locator('.cg-shuku-auto-score').boundingBox(),opinion=await slide.locator('.cg-shuku-review-comment').boundingBox();
   assert.ok(scoring.x+scoring.width<=opinion.x,'Scoring precedes reviewer opinion');
   await slide.getByText('结合自动评分',{exact:false}).waitFor();
   await slide.getByText('与个人体验审核',{exact:false}).waitFor();
   assert.equal(await slide.locator('.cg-shuku-approved-arrow').innerText(),'通过\n→');
   assert.equal(await slide.locator('.cg-shuku-reject-label').innerText(),'未通过\n退回修改');
   assert.equal(await slide.locator('.cg-shuku-rescore-label').innerText(),'重新提交\n再次自动评分');
   assert.equal(await slide.locator('.cg-shuku-reject-path').getAttribute('d'),'M360 257V313');
   assert.equal(await slide.locator('.cg-shuku-rescore-path').getAttribute('d'),'M218 370H121V260');
   assert.match(await slide.locator('.cg-shuku-review-loop').getAttribute('aria-label'),/重新提交后再次自动评分/);
   assert.equal(await slide.locator('.cg-shuku-conclusion').innerText(),'审核帮助发现问题、补充说明，自动质量评分提供参考，让改进更稳妥地进入正式课程。');
   const panels=slide.locator('.cg-shuku-review-panel'),principles=slide.locator('.cg-shuku-principles>section');
   for(let i=0;i<3;i++){
    const color=el=>{const s=getComputedStyle(el);return [s.backgroundColor,s.borderTopColor,s.getPropertyValue('--tone')];};
    assert.deepEqual(await panels.nth(i).evaluate(color),await principles.nth(i).evaluate(color),'Corresponding review panels must share their palette');
    const upper=await panels.nth(i).boundingBox(),lower=await principles.nth(i).boundingBox();
    assert.ok(Math.abs(upper.x-lower.x)<1&&Math.abs(upper.width-lower.width)<1,'Corresponding panels align horizontally and have equal widths');
    assert.ok(await principles.nth(i).evaluate(el=>[...el.querySelectorAll('h2,p')].every(child=>child.scrollWidth<=child.clientWidth)),'Principle text fits its aligned column');
   }
   const heading=slide.getByRole('heading',{name:'对共创想法进行质量审核',exact:true});
   assert.ok(await heading.evaluate(el=>el.scrollWidth<=el.clientWidth),'Quality review title fits its card');
  }
  if(id==='shuku-growth'){
   assert.equal(await slide.locator('.cg-shuku-loop-node').count(),6);
   for(const [version,note] of [['v1.0','新增贴近实际的案例'],['v1.1','补齐演示的适用条件'],['v1.2','优化互动演示与讲解']]){const button=slide.getByRole('button',{name:'查看示例版本 '+version,exact:true});await button.focus();await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await slide.locator('.cg-shuku-course .cg-shuku-version').textContent(),version);await slide.getByText(note,{exact:true}).waitFor();}
  }
  await page.evaluate(()=>document.activeElement?.blur());
  await slide.screenshot({path:path.join(output,id+'.png')});
  if(thumbnails){await page.locator('.scenedeck-capture').evaluate(el=>{el.style.transform='scale(.3)';el.style.transformOrigin='top left';});await slide.screenshot({path:path.join(thumbnails,id+'.png')});}
  console.log('PASS slide: '+id);
 }
 // The original last page remains immediately before the new section.
 await page.goto(base+'/scenedeck/?deck=creator-guide&slide=discovery-learning&scenedeckCapture=1');await page.locator('.cg-discovery-page').waitFor();
 // Both the long-form guide and the scaled study player use the same new pages.
 await page.goto(base+'/modules/creator-guide');await page.locator('#shuku-growth .cg-shuku-page').waitFor();
 assert.equal(await page.locator('.cg-guide>.cg-guide-frame').count(),21);
 for(const id of ids)assert.equal(await page.locator('#'+id+' .cg-shuku-page').count(),1);
 await page.setViewportSize({width:390,height:844});await page.locator('#shuku-growth').scrollIntoViewIfNeeded();
 const width=await page.locator('#shuku-growth').evaluate(el=>el.getBoundingClientRect().width);assert.ok(width<=390,'guide scaling must fit a narrow viewport');
 await page.screenshot({path:path.join(output,'shuku-guide-mobile.png')});
 await page.goto(base+'/study?module=creator-guide&mode=ppt&page=shuku-growth');await page.locator('.shuku-player .cg-shuku-growth').waitFor();await page.getByRole('button',{name:'查看示例版本 v1.0',exact:true}).click();await page.locator('.cg-shuku-growth-course').getByText('新增贴近实际的案例',{exact:true}).waitFor();assert.equal(await page.getByLabel('学习方式',{exact:true}).inputValue(),'ppt');assert.equal(await page.locator('.cg-shuku-heading h1>span').evaluate(el=>getComputedStyle(el).color),'rgb(18, 104, 238)');await page.screenshot({path:path.join(output,'shuku-study-mobile.png')});
 assert.deepEqual(errors,[]);console.log('PASS: 21-page registration, original page retained, version interaction and narrow guide scaling.');
 if(!thumbnails){for(const id of ids){const response=await page.request.get(base+'/444f8951-dd2e-42dc-94e5-c5a878618631/scenedeck-thumbnails/'+id+'.png');assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/image\/png/);assert.deepEqual([...(await response.body()).subarray(0,8)],[137,80,78,71,13,10,26,10]);}console.log('PASS: four published thumbnail assets');}
}finally{await browser.close();}
