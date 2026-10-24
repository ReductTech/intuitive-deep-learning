// Use isolated localhost preview and dedicated learner accounts; no external services.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const password=process.env.SHUKU_E2E_PASSWORD;assert.ok(password);
const artifacts=process.env.SHUKU_E2E_ARTIFACT_DIR||'test-results/shuku-personal';await fs.mkdir(artifacts,{recursive:true});
const names=[process.env.SHUKU_E2E_LEARNER,process.env.SHUKU_E2E_OTHER];
assert.ok(names.every(n=>n?.startsWith('personal-e2e-')),'Provide dedicated temporary learner accounts');
const browser=await chromium.launch({headless:true,channel:process.env.SHUKU_E2E_BROWSER_CHANNEL||'chrome'});
const contexts=await Promise.all(Array.from({length:6},()=>browser.newContext({viewport:{width:1440,height:960}})));
const [a,b,other,author,admin,guest]=contexts;
const page=await a.newPage(),second=await b.newPage(),outsider=await other.newPage();
const errors=[];for(const p of [page,second,outsider]){p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));}
const request=async(c,route,data)=>{const response=await c.request[data===undefined?'get':'post'](base+'/api/shuku'+route,data===undefined?{}:{headers:{Origin:base},data});assert.ok(response.ok(),route+': '+response.status()+' '+await response.text());return response.json();};
const login=(c,name)=>request(c,'/auth/login',{username:name,password});
const wait=async(read,test)=>{for(let i=0;i<150;i++){const value=await read();if(test(value))return value;await new Promise(r=>setTimeout(r,200));}throw Error('Timed out waiting for saved state');};
let cid;
try{
 const guestPage=await guest.newPage();await guestPage.goto(base+'/my-courses?next='+encodeURIComponent('/?view=saved'));await guestPage.getByLabel('账号',{exact:true}).selectOption('linzhi');await guestPage.getByLabel('密码',{exact:true}).fill(password);await guestPage.getByRole('button',{name:'登录',exact:true}).click();await guestPage.waitForURL('**/?view=saved');await guestPage.close();
 await login(a,names[0]);await login(b,names[0]);await login(other,names[1]);await login(author,'xiaoman');await login(admin,'admin');
 await request(a,'/personal/favorites',{resource:'module:neuron-guide',saved:false});const favoritesLoaded=page.waitForResponse(r=>r.url().endsWith('/api/shuku/personal'));await page.goto(base+'/');await favoritesLoaded;await page.getByRole('button',{name:'收藏认识人工神经元',exact:true}).click();await page.getByRole('button',{name:'取消收藏认识人工神经元',exact:true}).waitFor();
 await second.goto(base+'/?view=saved');await second.getByRole('heading',{name:'认识人工神经元',exact:true}).waitFor();
 await outsider.goto(base+'/?view=saved');assert.equal(await outsider.getByRole('heading',{name:'认识人工神经元',exact:true}).count(),0);
 await page.goto(base+'/study?module=neuron-guide&mode=guide');await page.getByLabel('学习方式',{exact:true}).waitFor();
 await page.getByRole('button',{name:'下一页',exact:true}).click();if(await page.getByRole('button',{name:'标记学完',exact:true}).count())await page.getByRole('button',{name:'标记学完',exact:true}).click();await page.getByLabel('学习方式',{exact:true}).selectOption('ppt');
 const moduleKey='module%3Aneuron-guide';const builtin=await wait(()=>request(a,'/personal/study/'+moduleKey+'/builtin'),r=>r.state?.mode==='ppt'&&r.state.completed.length===1);
 await second.goto(base+'/?view=history');await second.getByRole('heading',{name:'认识人工神经元',exact:true}).waitFor();await second.locator('article').filter({has:second.getByRole('heading',{name:'认识人工神经元',exact:true})}).getByRole('link',{name:'继续学习'}).click();
 await second.getByLabel('学习方式',{exact:true}).waitFor();assert.equal(await second.getByLabel('学习方式',{exact:true}).inputValue(),'ppt');await second.getByRole('button',{name:'已学完本页',exact:true}).waitFor();
 assert.ok(await second.locator('.shuku-player > footer').textContent().then(t=>t.includes('2 /')));
 console.log('PASS: account favorites, account isolation, cross-device page/mode/completion resume.');
 const modules=(await request(author,'/modules')).modules;const title='个人学习验收 '+Date.now();
 cid=(await request(author,'/courses',{module_id:modules[0].id,title})).course.id;
 const project={version:1,id:crypto.randomUUID(),courseId:modules[0].alias,title,duration:20,style:'简洁教学',outlineConfirmed:true,pages:[1,2].map(i=>({id:crypto.randomUUID(),format:'text',title:'学习页 '+i,goal:'理解概念',summary:'验收内容 '+i,note:'',ready:true,designed:true,revisions:[],messages:[]}))};
 async function release(version,expected=null){const revision=await request(author,'/courses/'+cid+'/revisions',{project,expected_revision:expected});await wait(()=>request(author,'/revisions/'+revision.id),r=>r.state==='ready');const review=await request(author,'/courses/'+cid+'/submit',{revision_id:revision.id});await request(admin,'/reviews/'+review.id+'/decision',{decision:'approved',revision_id:revision.id,note:'验收'});await request(author,'/courses/'+cid+'/publish',{revision_id:revision.id,version});return revision.id;}
 const first=await release('1.0.0');
 await request(a,'/personal/favorites',{resource:'course:'+cid,saved:true});await second.route('**/api/shuku/public/courses',route=>route.fulfill({json:{courses:[]}}));await second.goto(base+'/?view=saved');await second.getByRole('heading',{name:title,exact:true}).waitFor();await second.unroute('**/api/shuku/public/courses');
 await page.goto(base+'/learn?revision='+first);const player=page.frameLocator('iframe');await player.getByRole('heading',{name:'学习页 1',exact:true}).waitFor();await player.getByRole('button',{name:'下一页',exact:true}).click();await player.getByLabel('学习方式',{exact:true}).selectOption('guide');await player.getByRole('button',{name:'标记学完',exact:true}).click();
 await wait(()=>request(a,'/personal/study/'+encodeURIComponent('course:'+cid)+'/'+first),r=>r.state?.page_id===project.pages[1].id&&r.state.completed.length===1);
 project.pages[0].summary='第二版内容';const latest=await release('1.0.1',first);
 const catalog=await request(a,'/public/courses');assert.equal(catalog.courses.find(c=>c.id===cid).revision_id,latest);
 // Explicit legacy-player fixture: released files without the new message bridge.
 await second.route('**/api/shuku/revisions/'+first+'/files/index.html',route=>route.fulfill({contentType:'text/html',body:'<main class="shuku-player"><h1>学习页 1</h1><footer><button id="prev">上一页</button><span>1 / 2</span><button id="next">下一页</button></footer></main><script>let i=1;const show=()=>{document.querySelector(\'span\').textContent=i+\' / 2\';document.querySelector(\'h1\').textContent=\'学习页 \'+i;};document.getElementById(\'next\').onclick=()=>{i=Math.min(2,i+1);show();};document.getElementById(\'prev\').onclick=()=>{i=Math.max(1,i-1);show();};</script>'}));
 await second.goto(base+'/?view=history');const historical=second.locator('article').filter({has:second.getByRole('heading',{name:title,exact:true})});await historical.getByRole('link',{name:'继续学习'}).click();await second.waitForURL('**revision='+first+'&resume=1');await second.frameLocator('iframe').getByRole('heading',{name:'学习页 2',exact:true}).waitFor();await wait(()=>request(b,'/personal/study/'+encodeURIComponent('course:'+cid)+'/'+first),r=>r.state?.mode==='ppt'&&r.state.page_id===project.pages[1].id);assert.equal(await second.getByLabel('课程版本',{exact:true}).inputValue(),first);
 await second.getByLabel('课程版本',{exact:true}).selectOption(latest);await second.frameLocator('iframe').getByRole('heading',{name:'学习页 1',exact:true}).waitFor();assert.equal(await second.getByLabel('课程版本',{exact:true}).inputValue(),latest);
 await second.getByLabel('课程版本',{exact:true}).selectOption(first);await second.frameLocator('iframe').getByRole('heading',{name:'学习页 2',exact:true}).waitFor();await second.getByLabel('课程版本',{exact:true}).selectOption(latest);await second.frameLocator('iframe').getByRole('heading',{name:'学习页 1',exact:true}).waitFor();
 // A different same-origin window cannot forge progress messages for the iframe.
 await second.evaluate(rid=>window.postMessage({type:'shuku-study-position',revision:rid,channel:'forged',state:{page_id:'forged',mode:'guide',completed:[]}},location.origin),latest);
 await wait(()=>request(b,'/personal/study/'+encodeURIComponent('course:'+cid)+'/'+latest),r=>r.state?.page_id===project.pages[0].id);
 console.log('PASS: immutable historical version resume, manual version selection and message-source checks.');
 // Both already-open devices share a counter; stale writes must surface a conflict.
 await page.goto(base+'/study?module=neuron-guide&resume=1');await page.getByRole('button',{name:'下一页',exact:true}).waitFor();await wait(()=>request(a,'/personal/study/'+moduleKey+'/builtin'),r=>r.state.state_version>builtin.state.state_version);
 await second.goto(base+'/study?module=neuron-guide&resume=1');await second.getByRole('button',{name:'下一页',exact:true}).waitFor();await second.getByText('已保存',{exact:true}).waitFor();await page.getByRole('button',{name:'下一页',exact:true}).click();await page.getByRole('alert').filter({hasText:'另一设备已更新学习进度'}).waitFor();
 await second.setViewportSize({width:390,height:844});await second.reload();await second.getByLabel('学习方式',{exact:true}).waitFor();assert.ok(await second.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'mobile horizontal overflow');
 await second.screenshot({path:path.join(artifacts,'personal-mobile.png')});
 await second.getByText('已保存',{exact:true}).waitFor();await login(b,names[1]);await second.getByRole('button',{name:'下一页',exact:true}).click();await second.getByRole('alert').filter({hasText:'登录账号已切换'}).waitFor();assert.equal((await request(b,'/personal')).history.length,0,'an old tab cannot write learning into the newly signed-in account');
 assert.deepEqual(errors,[]);console.log('PASS: stale-device conflict, account switching and mobile learning layout.');
}catch(error){await page.screenshot({path:path.join(artifacts,'personal-failure.png')}).catch(()=>{});console.error(errors);console.error('Second browser:',second.url(),await second.locator('body').innerText().catch(()=>''));console.error('Server record:',await request(b,'/personal').catch(e=>e.message));await second.screenshot({path:path.join(artifacts,'personal-second-failure.png')}).catch(()=>{});throw error;}finally{
 try{if(cid){await request(admin,'/courses/'+cid+'/remove',{confirm:true});await wait(()=>request(admin,'/removals'),r=>r.removals.some(x=>x.resource_id===cid&&x.state==='succeeded'));}}finally{await browser.close();}
}
