const {chromium}=require('C:/Users/Ocean/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1600,height:1000}});const errors=[],assetRequests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().includes('/assembly/'))assetRequests.push(r.url())});
 await p.goto('http://localhost:5173/scenedeck/?deck=creator-guide&slide=ui-kit',{waitUntil:'networkidle'});
 await p.getByRole('button',{name:'演示',exact:true}).click();
 const audit=()=>p.evaluate(()=>{const root=document.querySelector('.cg-kit-assembly-page'),r=root.getBoundingClientRect();return [...root.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&(b.left<r.left-.5||b.right>r.right+.5||b.top<r.top-.5||b.bottom>r.bottom+.5)}).map(e=>({class:e.getAttribute('class'),text:e.textContent?.slice(0,25)})).slice(0,15)});
 const bounds=[{state:'catalog',overflow:await audit()}];
 await p.getByRole('textbox',{name:'输入答案'}).fill('先理解，再组合');
 await p.getByRole('button',{name:'组装一个教学页面 →'}).click();
 for(const wait of [300,900,1300]){await p.waitForTimeout(wait);bounds.push({state:'animation',overflow:await audit()});}
 await p.locator('.is-ready').waitFor();bounds.push({state:'ready',overflow:await audit()});
 const game=p.locator('.cg-built-gomoku');const board=p.getByRole('img').filter({hasText:'not-present'});const canvas=p.locator('.cg-built-gomoku__board-canvas');
 await canvas.click({position:{x:400,y:400}});
 await p.waitForFunction(()=>document.querySelector('.cg-built-gomoku')?.getAttribute('data-move-count')==='2');
 assert.equal(await game.getAttribute('data-turn'),'human');
 await p.getByRole('button',{name:'悔一步',exact:true}).click();assert.equal(await game.getAttribute('data-move-count'),'0');
 await p.getByRole('button',{name:'困难',exact:true}).click();assert.equal(await p.getByRole('button',{name:'困难',exact:true}).getAttribute('aria-pressed'),'true');assert(await p.getByRole('button',{name:'悔一步',exact:true}).isDisabled());
 await p.getByRole('button',{name:'示例棋局',exact:true}).click();assert.equal(await game.getAttribute('data-turn'),'over');
 await p.getByRole('button',{name:'重新开始',exact:true}).click();assert.equal(await game.getAttribute('data-move-count'),'0');
 await canvas.focus();await p.keyboard.press('ArrowRight');await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('.cg-built-gomoku')?.getAttribute('data-move-count')==='2');
 assert(new URL(p.url()).searchParams.get('slide')==='ui-kit');
 await p.getByRole('button',{name:'← 返回组件，重新组装'}).click();await p.getByRole('button',{name:'组装一个教学页面 →'}).click();await p.getByRole('button',{name:'跳过动画'}).click();assert.equal(await game.getAttribute('data-move-count'),'0');
 await p.getByRole('button',{name:'← 返回组件，重新组装'}).click();
 await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'组装一个教学页面 →'}).click();await p.locator('.is-ready').waitFor({timeout:2000});
 const originalStorage=await p.evaluate(()=>localStorage.getItem('convolution-kernel-intro:gomoku-outcome'));
 console.log(JSON.stringify({errors,bounds,assetRequests,originalStorage,checks:'local AI response, undo, difficulty, demo, restart, keyboard, replay, skip, reduced motion'},null,2));
 assert.equal(errors.length,0);assert(bounds.every(s=>!s.overflow.length));assert.equal(originalStorage,null);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
