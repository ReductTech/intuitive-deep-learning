// Isolated browser regression: all APIs mocked, no live course data is written.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_E2E_URL||'http://127.0.0.1:5181';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let draft=null,head=null,revision=null,writes=0,revisionWrites=0,fail=false,delay=null;
 const course={id:'autosave',owner_id:'owner',module_id:'9acfbca1-b881-457e-add6-21e0b6b855a0',title:'自动保存课程',description:'保留创作方向',category:'人工智能',status:'draft'};
 await page.route('**/api/shuku/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice('/api/shuku'.length);let data;
  if(path==='/auth/me')data={user:{id:'owner',username:'xiaoman',display_name:'小满',role:'creator'}};
  else if(path==='/messages')data={messages:[],unread_count:0};
  else if(path==='/modules')data={modules:[]};
  else if(path==='/courses')data={courses:[{...course,head_revision:head}]};
  else if(path==='/workspaces')data={workspaces:[]};
  else if(path==='/removals')data={removals:[]};
  else if(path==='/courses/autosave/draft'){
   if(req.method()==='GET')data={draft};
   else{
    const body=req.postDataJSON();writes++;
    if(delay)await delay;
    if(fail)return route.fulfill({status:503,json:{error:'网络暂时中断'}});
    if(body.expected_revision!==head||body.expected_draft!==(draft?.version||null))return route.fulfill({status:409,json:{error:'草稿已在其他窗口更新'}});
    draft={version:'draft-'+writes,base_revision:head,project:body.project,updated_at:Date.now()/1000};data={version:draft.version,base_revision:head};
   }
  }
  else if(path==='/courses/autosave/revisions'){
   const body=req.postDataJSON();assert.equal(body.expected_draft,draft?.version||null);assert.equal(body.expected_revision,head);
   revisionWrites++;head='revision-'+revisionWrites;revision={id:head,project:body.project,state:'ready',review:null,preview_url:'/mock-preview'};draft=null;data={id:head};
  }
  else if(path.startsWith('/revisions/'))data=revision;
  else if(path==='/courses/autosave')data={course:{...course,head_revision:head}};
  else if(path.endsWith('/github'))data={enabled:false,repository:null,jobs:[],external_prs:[]};
  else throw Error('Unexpected mock request '+path);
  await route.fulfill({json:data});
 });
 const open=()=>page.goto(base+'/my-courses/editor?course=autosave');
 const saved=()=>page.getByRole('status').filter({hasText:/草稿已自动保存/}).waitFor();
 await open();await page.getByRole('button',{name:'40 分钟',exact:true}).click();
 await page.getByRole('button',{name:'故事案例',exact:true}).click();
 await page.getByRole('button',{name:'有一定基础',exact:true}).click();await saved();
 assert.equal(writes,1,'rapid edits are debounced into one write');
 assert.equal(draft.project.duration,40);assert.equal(draft.project.style,'故事案例');
 assert.equal(draft.project.pages[0].outline.guided.audience,'有一定基础');
 await page.reload();await page.getByRole('button',{name:'40 分钟',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'40 分钟',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'生成课程大纲',exact:true}).click();
 await page.getByLabel('讲述逻辑',{exact:true}).fill('先提问，再探索，最后应用。');await saved();
 await page.reload();await page.getByLabel('讲述逻辑',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('讲述逻辑',{exact:true}).inputValue(),'先提问，再探索，最后应用。');
 assert.equal(await page.getByRole('heading',{name:'这门课，你想怎样讲？',exact:true}).count(),0);
 await page.getByRole('button',{name:'Markdown',exact:true}).click();
 const markdown=await page.getByLabel('Markdown 大纲',{exact:true}).inputValue();
 await page.getByLabel('Markdown 大纲',{exact:true}).fill(markdown+'\n尚未应用的草稿🙂');await saved();
 await page.reload();await page.getByLabel('Markdown 大纲',{exact:true}).waitFor();
 assert.ok((await page.getByLabel('Markdown 大纲',{exact:true}).inputValue()).endsWith('尚未应用的草稿🙂'));
 await page.getByRole('button',{name:'应用大纲',exact:true}).click();
 await page.getByRole('button',{name:'确定逻辑，细化模块',exact:true}).click();
 await page.getByRole('button',{name:'确定模块，细化页面',exact:true}).click();
 await page.getByRole('button',{name:'确认大纲，开始逐页制作',exact:true}).click();
 await page.getByRole('button',{name:'选择图解优先',exact:true}).click();
 await page.getByRole('button',{name:'微调画面',exact:true}).click();
 await page.getByLabel('都不合适？说说你的想法',{exact:true}).fill('还未点击更新模板的想法');await saved();
 assert.equal(draft.project.pages[0].outline.guided.brief,'还未点击更新模板的想法');
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=20;c.height=20;c.getContext('2d').fillRect(0,0,20,20);return c.toDataURL('image/png').split(',')[1];});
 await page.getByLabel('添加参考图',{exact:true}).setInputFiles({name:'reference.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await page.getByAltText('当前参考图',{exact:true}).waitFor();await page.getByRole('status').filter({hasText:/等待自动保存|正在自动保存/}).waitFor();await saved();
 assert.ok(draft.project.pages[0].outline.guided.image.startsWith('data:image/jpeg;base64,'));

 await page.reload();await page.getByRole('button',{name:'微调画面',exact:true}).click();
 assert.equal(await page.getByLabel('都不合适？说说你的想法',{exact:true}).inputValue(),'还未点击更新模板的想法');
 assert.equal(await page.locator('.ga-progress').count(),0,'page studio resumes without restarting choices');
 assert.equal(await page.getByAltText('当前参考图',{exact:true}).count(),1,'unapplied reference image survives reload');

 fail=true;await page.getByLabel('都不合适？说说你的想法',{exact:true}).fill('网络中断期间的新想法');
 await page.getByRole('alert').filter({hasText:'自动保存未完成'}).waitFor();
 assert.ok(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),'unsaved changes enable unload warning');
 await page.locator('.ga-course-actions').evaluate(el=>{el.open=true;});
 page.once('dialog',d=>d.dismiss());
 await page.getByRole('link',{name:'我的课程',exact:true}).click();
 assert.ok(page.url().includes('/editor?'),'cancel leaving retains editor');
 fail=false;await page.getByRole('button',{name:'重试保存',exact:true}).click();await saved();
 assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),false,'saved draft does not warn');
 // An in-flight autosave must finish before manual revision consumes its version.
 let unblock;delay=new Promise(resolve=>{unblock=resolve;});
 await page.getByLabel('都不合适？说说你的想法',{exact:true}).fill('手动修订等待自动保存');
 await page.getByRole('status').filter({hasText:'正在自动保存'}).waitFor();
 await page.locator('.ga-course-actions').evaluate(el=>{el.open=true;});
 await page.getByRole('button',{name:'保存修订',exact:true}).click();
 await page.waitForTimeout(150);assert.equal(revisionWrites,0);
 await page.getByLabel('都不合适？说说你的想法',{exact:true}).fill('等待保存期间继续输入的新内容');

 unblock();delay=null;
 await page.waitForFunction(()=>document.body.textContent.includes('已保存')&&!document.body.textContent.includes('正在处理'));
 assert.equal(revisionWrites,1);assert.equal(draft,null);
 assert.equal(revision.project.pages[0].outline.guided.brief,'等待保存期间继续输入的新内容');

 await page.reload();await page.locator('.cw-app.cw-editing').waitFor();
 assert.equal(await page.locator('.ga-app').count(),0,'saved revisions still resume in original preview editor');
 assert.equal(await page.getByRole('button',{name:'保存修订',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'编辑源码',exact:true}).click();
 await page.getByLabel('源码编辑',{exact:true}).fill('export default function {');await saved();
 assert.ok(Object.values(draft.project.source.files).includes('export default function {'),'incomplete source is preserved as a draft without building');
 await page.reload();await page.locator('.cw-app.cw-editing').waitFor();await page.getByRole('button',{name:'编辑源码',exact:true}).click();
 assert.equal(await page.getByLabel('源码编辑',{exact:true}).inputValue(),'export default function {');
 fail=true;await page.getByLabel('源码编辑',{exact:true}).fill('still editing');
 await page.getByRole('alert').filter({hasText:'自动保存未完成'}).waitFor();
 page.once('dialog',d=>d.accept());await page.getByRole('link',{name:'我的课程',exact:true}).click();await page.waitForURL('**/my-courses');
 assert.deepEqual(errors,[]);
 console.log('PASS autosave: debounce, preferences, outline, unapplied Markdown, page ideas, reload recovery, offline warning/retry, cancel navigation, clean unload, and manual revision serialization.');
}finally{await browser.close();}


