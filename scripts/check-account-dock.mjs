import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),base=process.env.SHUKU_E2E_URL||'http://localhost:5175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));let role='creator',loggedOut=false;
 await page.route('**/api/shuku/**',async route=>{const path=new URL(route.request().url()).pathname.slice('/api/shuku'.length);let data;
 if(path==='/auth/me')data={user:{id:'owner',username:'xiaoman',display_name:'小满',role}};
 else if(path==='/messages')data={messages:[],unread_count:3};
 else if(path==='/auth/logout'){loggedOut=true;return route.abort();}
 else if(path==='/catalog'||path==='/public/courses')data={courses:[],modules:[]};
 else if(path==='/modules')data={modules:[]};
 else if(path==='/personal')data={favorites:[],favorite_courses:[],history:[],account_id:'owner',next_cursor:null};
 else data={courses:[],workspaces:[],removals:[]};
 await route.fulfill({json:data});});
 await page.goto(base+'/my-courses');const dock=page.getByRole('complementary',{name:'当前账号'});await dock.waitFor();
 const position=async()=>{const b=await dock.boundingBox(),size=page.viewportSize();assert.ok(b.x<=12&&Math.abs(size.height-b.y-b.height)<=12,'account stays in bottom-left corner');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));};
 await position();assert.equal(await page.locator('.sd-library-topbar .shuku-profile-link').count(),0);assert.equal(await dock.getByRole('link',{name:'个人信息',exact:true}).getAttribute('href'),'/profile');assert.ok(await dock.getByText('小满',{exact:true}).isVisible());assert.ok(await dock.getByText('课程创作者',{exact:true}).isVisible());assert.ok(await page.locator('.sd-library-topbar').getByRole('link',{name:'我的消息，3 条未读',exact:true}).isVisible());
 await page.keyboard.press('Tab');await dock.getByRole('link',{name:'个人信息',exact:true}).focus();assert.equal(await dock.getByRole('link',{name:'个人信息',exact:true}).evaluate(n=>n===document.activeElement),true);
 await fs.mkdir('test-results/account-dock',{recursive:true});await page.screenshot({path:'test-results/account-dock/desktop.png'});
 role='admin';await page.reload();await dock.getByText('管理员',{exact:true}).waitFor();assert.ok(await page.getByRole('button',{name:'数据管理',exact:true}).isVisible());
 await page.setViewportSize({width:390,height:844});await position();await page.screenshot({path:'test-results/account-dock/mobile.png'});
 role='creator';await page.setViewportSize({width:1440,height:960});await page.goto(base+'/');await dock.waitFor();await position();assert.ok(await page.getByRole('complementary',{name:'课程分类'}).isVisible());const side=await page.locator('.sd-library-sidebar').evaluate(n=>({pad:parseFloat(getComputedStyle(n).paddingBottom)}));assert.ok(side.pad>=90,'categories reserve account space');
 await page.screenshot({path:'test-results/account-dock/home.png'});
 // Only mock requests are used; no server account or course records are changed.
 await page.route('**/api/shuku/auth/logout',async route=>{loggedOut=true;await route.fulfill({status:200,json:{ok:true}});});
 const navigation=page.waitForEvent('framenavigated',f=>f===page.mainFrame());await dock.getByRole('button',{name:'退出',exact:true}).click();await navigation;assert.ok(loggedOut);await dock.waitFor();await page.evaluate(()=>sessionStorage.setItem('shuku:guest','1'));await page.reload();await dock.getByText('游客',{exact:true}).waitFor();assert.ok(await dock.getByRole('button',{name:'登录',exact:true}).isVisible());assert.equal(await page.locator('.sd-library-topbar .shuku-message-link').count(),0);await position();
 assert.deepEqual(errors,[]);console.log('PASS account dock: bottom-left on home/management/mobile, profile navigation, role, admin access, message badge and logout request.');
}finally{await browser.close();}
