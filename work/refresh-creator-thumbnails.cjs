const {chromium}=require('C:/Users/Ocean/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();
 const base='http://127.0.0.1:5173/scenedeck/?scenedeckCapture=1&deck=creator-guide';
 await page.goto(base);
 const surface=page.locator('[data-scene-deck-capture]');
 await surface.waitFor();
 const ids=JSON.parse(await surface.getAttribute('data-scene-ids'));
 const out='assets/444f8951-dd2e-42dc-94e5-c5a878618631/scenedeck-thumbnails';
 const staging='C:/Users/Ocean/Documents/Codex/2026-10-23/c-users-ocean-documents-github-intuitive-3/work/creator-thumbnails/444f8951-dd2e-42dc-94e5-c5a878618631/scenedeck-thumbnails';
 fs.mkdirSync(staging,{recursive:true});
 for(const id of ids){
  await page.goto(base+'&slide='+encodeURIComponent(id));
  await surface.waitFor();
  if(await surface.getAttribute('data-scene-id')!==id)throw Error('Slide mismatch: '+id);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  if(id==='presentation-comparison'){
   await page.getByRole('button',{name:'开始模拟生成',exact:true}).click();
   await page.locator('[data-demo-phase="detail-ready"]').waitFor();
   await page.getByRole('button',{name:'开始模拟生成',exact:true}).click();
   await page.locator('[data-demo-phase="done"]').waitFor();
   await page.locator('video').evaluateAll(async vs=>{for(const v of vs){v.pause();if(v.readyState>=1){v.currentTime=Math.min(1,v.duration||1);await new Promise(r=>v.addEventListener('seeked',r,{once:true}));}}});
  }
  await page.waitForTimeout(1800);
  const box=await surface.boundingBox();
  if(box.width!==1600||box.height!==900)throw Error('Wrong size '+JSON.stringify(box));
  await surface.screenshot({path:path.join(out,id+'.png'),animations:'disabled'});
  fs.copyFileSync(path.join(out,id+'.png'),path.join(staging,id+'.png'));
  console.log('Captured '+id);
 }
 console.log('Done: '+ids.length+' slides');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
