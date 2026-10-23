const { chromium } = require('C:/Users/Ocean/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('node:path');
(async()=>{
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
 const page = await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/scenedeck/?scenedeckCapture=1&deck=creator-guide&slide=skill-overview',{waitUntil:'networkidle'});
 const capture=page.locator('[data-scene-deck-capture]');await capture.waitFor();
 await page.evaluate(()=>document.fonts.ready);
 await capture.screenshot({path:path.resolve('work/skill-overview-render.png')});
 const audit=await page.evaluate(()=>{
  const root=document.querySelector('.cg-overview-page'),r=root.getBoundingClientRect();
  const overflow=[...root.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&(b.left<r.left-.5||b.top<r.top-.5||b.right>r.right+.5||b.bottom>r.bottom+.5)}).map(e=>({tag:e.tagName,cls:e.getAttribute('class'),text:e.textContent?.slice(0,50)}));
  const textOverflow=[...root.querySelectorAll('.ui-typography')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth}));
  return {size:[r.width,r.height],overflow,textOverflow};
 });console.log(JSON.stringify({errors,...audit},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
