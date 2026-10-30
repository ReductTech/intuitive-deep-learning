const { chromium } = require('C:/Users/Ocean/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173/scenedeck/?deck=creator-guide&slide=skill-constraints',{waitUntil:'networkidle'});
await page.getByRole('button',{name:'演示',exact:true}).click();
const audit=()=>page.evaluate(()=>{const root=document.querySelector('.cg-constraints-page'),r=root.getBoundingClientRect();return [...root.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&(b.left<r.left-.5||b.right>r.right+.5||b.top<r.top-.5||b.bottom>r.bottom+.5)}).map(e=>({cls:e.getAttribute('class'),text:e.textContent?.slice(0,45)})).slice(0,12)});
const results=[];
for(const name of ['设计技能','路由技能','评估技能','自进化技能','格式技能']){
 await page.getByRole('button',{name:'选择'+name,exact:true}).click();await page.mouse.move(400,100);await page.waitForTimeout(600);
 if(await page.locator('.cg-constraints-detail h2').innerText()!==name)throw Error('Selection failed '+name);
 results.push({name,state:'selected',overflow:await audit()});
 await page.getByRole('button',{name:'查看'+name+'示例',exact:true}).hover();
 await page.locator('.cg-constraints-preview').waitFor();await page.waitForTimeout(200);
 results.push({name,state:'preview',overflow:await audit()});
 await page.locator('.cg-constraints-preview').hover();await page.waitForTimeout(500);
 if(await page.locator('.cg-constraints-preview').count()!==1)throw Error('Preview closed while interacting');
 if(name==='设计技能'||name==='格式技能'){
 const label=name==='设计技能'?'交互':'视觉';await page.locator('.cg-constraints-visual-options').getByRole('button',{name:label,exact:true}).click();
 }
 await page.screenshot({path:'work/carousel-'+name+'.png'});
 await page.getByRole('button',{name:'关闭技能示例',exact:true}).click();
}
await page.getByRole('button',{name:'选择格式技能',exact:true}).focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(600);
if(await page.locator('.cg-constraints-detail h2').innerText()!=='设计技能')throw Error('Keyboard rotation failed');
await page.getByRole('button',{name:'下一个技能',exact:true}).click();await page.waitForTimeout(600);
if(await page.locator('.cg-constraints-detail h2').innerText()!=='路由技能')throw Error('Next rotation failed');
console.log(JSON.stringify({errors,results},null,2));if(errors.length||results.some(r=>r.overflow.length))process.exitCode=1;
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
