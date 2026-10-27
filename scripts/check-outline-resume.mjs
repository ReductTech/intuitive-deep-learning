// Mocked resume checks: no server course/revision is created or modified.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const moduleId='9acfbca1-b881-457e-add6-21e0b6b855a0',source={files:{'Original.tsx':'export default function Original(){return <h1>保留原始源码</h1>};'}};
 const project={version:1,id:'original-project',courseId:'custom',title:'已完成课程',duration:20,style:'简洁图解',outlineConfirmed:true,source,pages:[{id:'kept-page',format:'react',sourceEntry:'Original.tsx',title:'保留页面',goal:'保留目标',summary:'保留教学内容',note:'保留讲稿',ready:true,designed:true,messages:[],revisions:[]}]};
 const guided=phase=>({...structuredClone(project),pages:project.pages.map(p=>({...p,outline:{guided:{phase,audience:'初学者',description:'保留课程简介',layout:'visual',confirmed:phase==='pages',brief:'保留创作想法'}}}))});
 const courses=[{id:'empty',title:'未保存修订',status:'draft',head_revision:null},{id:'unfinished',title:'未完成大纲',status:'draft',head_revision:'r-unfinished'},{id:'complete',title:'已完成课程',status:'published',head_revision:'r-complete'},{id:'legacy',title:'旧源码课程',status:'draft',head_revision:'r-legacy'}].map(c=>({...c,owner_id:'owner',module_id:moduleId,description:'课程简介',category:'人工智能'}));
 const saved={'r-unfinished':guided('outline'),'r-complete':guided('pages'),'r-legacy':structuredClone(project)};let writes=0;
 await page.route('**/api/shuku/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname.slice('/api/shuku'.length);let data;
 if(path==='/auth/me')data={user:{id:'owner',username:'xiaoman',display_name:'小满',role:'creator'}};
 else if(path==='/messages')data={messages:[],unread_count:0};
 else if(path==='/modules')data={modules:[{id:moduleId,alias:'neuron-guide',title:'课程模板'}]};
 else if(path==='/courses')data={courses};
 else if(path==='/workspaces')data={workspaces:[]};
 else if(path==='/removals')data={removals:[]};
 else if(path.endsWith('/github'))data={enabled:false,repository:null,jobs:[],external_prs:[]};
 else if(/^\/courses\/[^/]+\/revisions$/.test(path)){writes++;const value=request.postDataJSON().project;assert.deepEqual(value.source,source,'outline edits must not rebuild legacy source');assert.equal(value.pages[0].sourceEntry,'Original.tsx');assert.equal(value.pages[0].id,'kept-page');saved['r-legacy']=value;data={id:'r-legacy'};}
 else if(path.startsWith('/courses/'))data={course:courses.find(c=>path==='/courses/'+c.id)};
 else if(path.startsWith('/revisions/')){const id=path.split('/').at(-1);data={id,project:saved[id],state:'ready',review:null,preview_url:'/preview-test'};}
 else throw Error('Unexpected mock request '+path);
 await route.fulfill({json:data});});
 async function resume(id){await page.goto(base+'/my-courses');const item=page.locator('.shuku-course-list article').filter({has:page.getByRole('heading',{name:courses.find(c=>c.id===id).title,exact:true})});const link=item.getByRole('link',{name:'继续创作',exact:true});assert.match(await link.getAttribute('href'),/outline=1/);await link.click();}
 await resume('empty');await page.getByRole('heading',{name:'这门课，你想怎样讲？',exact:true}).waitFor();assert.equal(await page.locator('.cw-app,.shuku-source-editor').count(),0);
 for(const id of ['unfinished','complete']){await resume(id);await page.getByRole('heading',{name:'从整体，慢慢展开',exact:true}).waitFor();assert.equal(await page.locator('.oe-root').innerText().then(s=>s.includes('已完成课程')),true);await page.getByRole('button',{name:'返回页面编辑',exact:true}).click();if(id==='complete'){await page.getByRole('button',{name:'编辑大纲',exact:true}).click();await page.getByRole('heading',{name:'从整体，慢慢展开',exact:true}).waitFor();}}
 await resume('legacy');await page.getByRole('heading',{name:'从整体，慢慢展开',exact:true}).waitFor();await page.getByLabel('讲述逻辑',{exact:true}).fill('重新整理已有课程');await page.getByRole('button',{name:'保存修订',exact:true}).click();await page.locator('.ga-header>small').filter({hasText:/^已保存$/}).waitFor();assert.equal(writes,1);await page.reload();await page.getByLabel('讲述逻辑',{exact:true}).waitFor();assert.equal(await page.getByLabel('讲述逻辑',{exact:true}).inputValue(),'重新整理已有课程');assert.equal(await page.getByRole('button',{name:'添加页面',exact:true}).count(),0);await page.getByRole('button',{name:'返回页面编辑',exact:true}).click();await page.getByRole('textbox',{name:'源码编辑',exact:true}).waitFor();assert.equal(await page.getByRole('textbox',{name:'源码编辑',exact:true}).inputValue(),source.files['Original.tsx']);await page.getByRole('button',{name:'编辑大纲',exact:true}).click();await page.getByRole('heading',{name:'从整体，慢慢展开',exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS resume: empty draft, saved outline, finished guided course, legacy source, explicit outline entry, saved metadata and unchanged source/page identity.');
}finally{await browser.close();}
