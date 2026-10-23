const { chromium } = require('C:/Users/Ocean/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const page = await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
 await page.goto('http://localhost:5173/scenedeck/?scenedeckCapture=1&deck=creator-guide&slide=creator-guide-title');
 const surface = page.locator('[data-scene-deck-capture]');
 await surface.waitFor({timeout:60000});
 console.log('scene', await surface.getAttribute('data-scene-id'));
 await page.evaluate(async()=>{await document.fonts.ready;});
 await page.waitForTimeout(1000);
 const info = await page.evaluate(() => {
  const surface=document.querySelector('.cg-cover-page'); const r=surface.getBoundingClientRect();
  return {surface:{width:r.width,height:r.height},outside:[...surface.querySelectorAll('*')].flatMap(el=>{const b=el.getBoundingClientRect(); return b.left<r.left-.5||b.top<r.top-.5||b.right>r.right+.5||b.bottom>r.bottom+.5?[{tag:el.tagName,class:el.getAttribute('class')}]:[]})};
 });
 console.log('bounds', JSON.stringify(info));
 const outline=JSON.parse(fs.readFileSync('modules/Creator-Guide/outlines.json','utf8'));
 const out=path.resolve('assets',outline.moduleIdentity.id,'scenedeck-thumbnails','creator-guide-title.png');
 fs.mkdirSync(path.dirname(out),{recursive:true}); await surface.screenshot({path:out});console.log('screenshot',out);
 const metadata=await page.evaluate(async()=>{const {activeModules}=await import('/src/app/modules.tsx'); const m=activeModules.find(m=>m.path==='/modules/creator-guide');return m.pptDeck.scenes.map(s=>({id:s.id,title:s.title,notes:m.getPptNotes(s.id).map(n=>n.text).join(' ')}));});
 console.log('pptOrderMatches',JSON.stringify(metadata.map(s=>s.id))===JSON.stringify(outline.pages.map(p=>p.id)));
 console.log('titlesAndNotesMatch', metadata.every((s,i)=>s.title===outline.pages[i].title && s.notes===outline.pages[i].snippet));
 await page.goto('http://localhost:5173/modules/creator-guide'); await page.locator('.cg-cover-page').waitFor({timeout:60000});
 console.log('guideOrderMatches',JSON.stringify(await page.locator('.cg-guide-frame').evaluateAll(els=>els.map(el=>el.id)))===JSON.stringify(outline.pages.map(p=>p.id)));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
