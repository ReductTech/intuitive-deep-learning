import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_PROFILE_URL||'http://localhost:5175',password=process.env.SHUKU_PROFILE_TEST_PASSWORD;
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));assert.ok(password);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});page.setDefaultTimeout(30000);
 let connected=false,cancels=0,revokes=0,failRevoke=false,startFailure=true,pollFailure=true,starts=0;
 const status=()=>({available:true,connected,authorized:connected,identity:connected?{id:12345,login:'octocat',url:'https://github.com/octocat'}:null});
 await page.route('**/api/shuku/github/identity**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/start')){starts++;if(startFailure){startFailure=false;return route.fulfill({status:503,json:{error:'GitHub 连接超时，请重试。'}});}return route.fulfill({json:{flow_id:'11111111-1111-4111-8111-111111111111',user_code:'ABCD-EFGH',verification_url:'https://github.com/login/device',interval:5,expires_in:900}});}
  if(path.endsWith('/poll')){if(pollFailure){pollFailure=false;return route.fulfill({status:503,json:{error:'GitHub 连接超时，请重试。'}});}connected=true;return route.fulfill({json:{complete:true,...status()}});}
  if(path.endsWith('/cancel')){cancels++;return route.fulfill({json:{message:'已取消'}});}
  if(path.endsWith('/disconnect')){
   assert.deepEqual(route.request().postDataJSON(),{confirm:true,expected_id:12345});
   if(failRevoke)return route.fulfill({status:502,json:{error:'GitHub 暂时无法连接，请稍后重试。'}});
   revokes++;connected=false;
  }
  return route.fulfill({json:status()});
 });
 await page.goto(base+'/profile');await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();
 await page.getByText('Demo 体验登录',{exact:true}).click();await page.getByLabel('体验账号').selectOption('xiaoman');await page.getByLabel('Demo 密码',{exact:true}).fill(password);await page.getByRole('button',{name:'进入 Demo',exact:true}).click();
 const panel=page.getByRole('region',{name:'GitHub 账号绑定'});
 await panel.getByRole('button',{name:'绑定 GitHub',exact:true}).click();await panel.getByRole('dialog',{name:'连接你的 GitHub 账号'}).waitFor();await panel.getByRole('alert').waitFor();await panel.getByRole('button',{name:'重新获取授权码',exact:true}).click();await panel.getByLabel('GitHub 授权码').waitFor();
 await fs.mkdir('test-results/github-identity',{recursive:true});await page.screenshot({path:'test-results/github-identity/dialog.png'});
 assert.equal(await panel.getByRole('link',{name:'打开 GitHub 授权页面 ↗'}).getAttribute('href'),'https://github.com/login/device');
 await panel.getByRole('button',{name:'取消授权',exact:true}).click();assert.equal(cancels,1);
 await panel.getByRole('button',{name:'绑定 GitHub',exact:true}).click();await panel.getByLabel('GitHub 授权码').waitFor();await panel.getByRole('button',{name:'我已授权，检查连接',exact:true}).click();await panel.getByRole('alert').waitFor();assert.ok(await panel.getByLabel('GitHub 授权码').isVisible());await panel.getByRole('button',{name:'我已授权，检查连接',exact:true}).click();await panel.getByRole('link',{name:'@octocat ↗'}).waitFor();assert.equal(starts,3);
 await page.reload();await panel.getByRole('link',{name:'@octocat ↗'}).waitFor();
 await panel.getByRole('button',{name:'解除绑定',exact:true}).click();await panel.getByRole('button',{name:'取消',exact:true}).click();assert.equal(revokes,0);
 await panel.getByRole('button',{name:'解除绑定',exact:true}).click();failRevoke=true;await panel.getByRole('button',{name:'确认解除',exact:true}).click();await panel.getByRole('alert').waitFor();assert.ok(await panel.getByRole('link',{name:'@octocat ↗'}).isVisible());
 failRevoke=false;await panel.getByRole('button',{name:'确认解除',exact:true}).click();await panel.getByRole('button',{name:'绑定 GitHub',exact:true}).waitFor();assert.equal(revokes,1);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await fs.mkdir('test-results/github-identity',{recursive:true});await page.screenshot({path:'test-results/github-identity/mobile.png',fullPage:true});
 console.log('PASS GitHub identity UI: bind, device code, cancel, manual completion, start retry, poll retry without discarding code, reload, confirmation, failure recovery, disconnect and mobile layout (GitHub transport mocked).');
}finally{await browser.close();}
