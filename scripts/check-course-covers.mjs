// Local browser regression: node scripts/check-course-covers.mjs <playwright/index.mjs>
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Use a local preview');
const browser=await chromium.launch({headless:true,...(process.env.SHUKU_E2E_BROWSER_CHANNEL?{channel:process.env.SHUKU_E2E_BROWSER_CHANNEL}:{})});
try {
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 for(const title of ['认识人工神经元','卷积基础']) {
  const card=page.locator('.sd-library-card').filter({has:page.getByRole('heading',{name:title,exact:true})});
  await card.waitFor();
  await card.scrollIntoViewIfNeeded();
  const image=card.getByRole('img',{name:`${title}课件预览`});
  await image.waitFor();
  await image.evaluate(img=>new Promise((resolve,reject)=>{
   if(img.complete)return img.naturalWidth>0?resolve(true):reject(Error('Cover failed to decode'));
   img.addEventListener('load',()=>resolve(true),{once:true});
   img.addEventListener('error',()=>reject(Error('Cover failed to load')),{once:true});
  }));
  const src=await image.getAttribute('src');
  const response=await page.request.get(new URL(src,base).href);
  assert.equal(response.status(),200,`${title}: cover request`);
  assert.match(response.headers()['content-type']||'',/^image\//,`${title}: must return an image, not the SPA fallback`);
  console.log(`PASS cover: ${title}`);
 }
} finally {await browser.close();}
