const { chromium } = require('C:/Users/Ocean/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 await page.goto('http://127.0.0.1:5173/scenedeck/?scenedeckCapture=1&deck=creator-guide&slide=skill-overview',{waitUntil:'networkidle'});
 await page.locator('.cg-overview-page').waitFor();
 const audit=async()=>page.evaluate(()=>{
 const root=document.querySelector('.cg-overview-page'),r=root.getBoundingClientRect();
 const outside=[...root.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();return b.width>1&&b.height>1&&(b.left<r.left-.5||b.right>r.right+.5||b.top<r.top-.5||b.bottom>r.bottom+.5)});
 const overflow=[...root.querySelectorAll('.ui-typography')].filter(e=>e.clientWidth>1&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent);
 return {outside:outside.length,overflow};
 });
 const results={default:await audit()};
 await page.getByRole('button',{name:'选择主题 蓝色主题'}).click();
 results.dropdown=await audit();
 await page.getByRole('option',{name:'橙色主题'}).click();
 if(await page.locator('.cg-overview-specimen').getAttribute('data-theme')!=='orange')throw Error('Theme did not change');
 const range=page.getByRole('slider',{name:'图形大小'});
 await range.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
 if(await range.inputValue()!=='31')throw Error('Range did not respond');
 await page.getByRole('button',{name:'开始',exact:true}).click();
 if(await page.locator('.cg-overview-template-scan').count()!==1)throw Error('Start did not activate preview');
 results.active=await audit();
 await page.locator('[data-scene-deck-capture]').screenshot({path:'work/skill-overview-active.png',animations:'disabled'});
 await page.getByRole('button',{name:'重置',exact:true}).click();
 if(await page.locator('.cg-overview-template-scan').count())throw Error('Reset did not stop preview');
 await page.getByRole('button',{name:'选择主题 橙色主题'}).focus();await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');await page.keyboard.press('Home');await page.keyboard.press('Enter');
 if(await page.locator('.cg-overview-specimen').getAttribute('data-theme')!=='blue')throw Error('Keyboard select did not change theme');
 await range.fill('70');await page.locator('#cg-overview-title').click();
 await page.locator('[data-scene-deck-capture]').screenshot({path:'work/skill-overview-render.png',animations:'disabled'});
 results.controls='theme, slider keyboard, start/reset, keyboard select passed';
 console.log(JSON.stringify(results,null,2));
 if(Object.values(results).some(v=>typeof v==='object'&&(v.outside||v.overflow.length)))throw Error('Bounds check failed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});


