const {chromium}=require('C:/Users/Ocean/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const p=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://localhost:5173/scenedeck/?deck=creator-guide&slide=creation-workflow',{waitUntil:'networkidle'});await p.getByRole('button',{name:'演示',exact:true}).click();
const root=p.locator('.cg-workflow-page');assert.equal(await root.locator('.cg-sim-page-item').count(),0);assert.equal(await root.locator('.cg-sim-outline').count(),0);assert.equal(await root.getByRole('tab').count(),0);
await root.getByRole('button',{name:'发送教学要求',exact:true}).click();await p.waitForTimeout(850);assert.equal(await root.locator('.cg-sim-page-item').count(),0);assert(await root.getByRole('status').isVisible());
await p.waitForFunction(()=>document.querySelectorAll('.cg-sim-page-item').length===6);assert.equal(await root.locator('.cg-sim-user').count(),1);assert.equal(await root.locator('.cg-sim-assistant').count(),1);
await root.screenshot({path:'work/workflow-chat.png'});
await p.emulateMedia({reducedMotion:'reduce'});
for(let i=1;i<9;i++){await root.getByRole('button',{name:'发送教学要求',exact:true}).click();await p.waitForFunction(n=>document.querySelectorAll('.cg-sim-work details').length<0||document.querySelectorAll('.cg-sim-work summary').length===n,i+1);if(i===1)assert((await root.locator('.cg-sim-page-item').nth(2).innerText()).includes('窗口寻找棋形'));if(i===3){const board=root.getByRole('grid');await board.click({position:{x:120,y:120}});assert.equal(await root.locator('.cg-sim-board circle').count(),2);await root.getByRole('button',{name:'悔一步',exact:true}).click();assert.equal(await root.locator('.cg-sim-board circle').count(),1);}if(i===4)assert.equal(await root.locator('.cg-sim-early-hint').count(),0);}
assert.equal(await root.locator('.cg-sim-link-note').count(),1);assert(await root.getByRole('button',{name:'发送教学要求',exact:true}).isDisabled());
const out=await root.evaluate(root=>{const r=root.getBoundingClientRect();return [...root.querySelectorAll('*')].filter(e=>{if(e.closest('.cg-sim-messages'))return false;const b=e.getBoundingClientRect();return b.width&&b.height&&(b.left<r.left-.5||b.right>r.right+.5||b.top<r.top-.5||b.bottom>r.bottom+.5)}).map(e=>e.className)});assert.deepEqual(out,[]);
await root.getByRole('button',{name:'重新体验',exact:true}).click();assert.equal(await root.locator('.cg-sim-page-item').count(),0);assert.equal(await root.locator('.cg-sim-user').count(),0);
await root.getByRole('button',{name:'发送教学要求',exact:true}).click();await root.getByRole('button',{name:'重新体验',exact:true}).click();await p.waitForTimeout(400);assert.equal(await root.locator('.cg-sim-page-item').count(),0);
console.log(JSON.stringify({errors,out,checks:'initial blank, staged work statuses, streaming reply, persistent left/right chat, 9 turns, outline reorder, playable board, revision, review, replay while processing'}));assert.deepEqual(errors,[]);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
