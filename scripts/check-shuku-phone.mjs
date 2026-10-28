import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const base=process.env.SHUKU_LOGIN_URL||'http://localhost:5175',output=process.env.SHUKU_PHONE_ARTIFACTS||'test-results/phone-login';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(60000);
 const calls=[];page.on('request',r=>{if(/\/auth\/(sms-code|phone-login)$/.test(r.url()))calls.push({url:r.url(),body:r.postDataJSON()});});
 await page.goto(base+'/');await page.getByRole('heading',{name:'欢迎登录',exact:true}).waitFor();
 await page.getByText('减论科技，科技链接个体',{exact:true}).waitFor();await page.getByText('请选择一种方式登录您的减论账号',{exact:true}).waitFor();assert.equal(await page.getByText('使用减论账号登录术库',{exact:true}).count(),0);
 assert.equal(await page.getByRole('tab',{name:'验证码登录',exact:true}).getAttribute('aria-selected'),'true');assert.ok(await page.getByRole('button',{name:'发送验证码',exact:true}).isDisabled());
 assert.equal(await page.getByLabel('Demo 密码',{exact:true}).isVisible(),false);
 await page.getByText('Demo 体验登录',{exact:true}).click();
 for(const username of ['scy','msh']){await page.getByLabel('体验账号').selectOption(username);assert.equal(await page.getByLabel('体验账号').inputValue(),username);}
 await page.getByText('Demo 体验登录',{exact:true}).click();
 await page.getByLabel('手机号',{exact:true}).fill('13800138000');await page.screenshot({path:output+'/sms-desktop.png'});
 await page.getByRole('button',{name:'发送验证码',exact:true}).click();await page.getByRole('alert').filter({hasText:'验证码服务暂未接入'}).waitFor();assert.equal(await page.getByRole('button',{name:'发送验证码',exact:true}).isEnabled(),true);assert.equal(calls.length,1);assert.deepEqual(calls[0].body,{phone:'13800138000'});
 await page.getByPlaceholder('请输入验证码',{exact:true}).fill('123456');await page.getByRole('button',{name:'登录 / 注册',exact:true}).click();await page.getByRole('alert').filter({hasText:'手机号登录暂未接入'}).waitFor();assert.deepEqual(calls[1].body,{method:'sms',phone:'13800138000',code:'123456'});
 await page.getByRole('tab',{name:'密码登录',exact:true}).click();assert.equal(await page.getByPlaceholder('请输入验证码',{exact:true}).count(),0);await page.getByLabel('密码',{exact:true}).fill('test-phone-password');await page.getByRole('button',{name:'登录 / 注册',exact:true}).click();await page.getByRole('alert').filter({hasText:'手机号登录暂未接入'}).waitFor();assert.deepEqual(calls[2].body,{method:'password',phone:'13800138000',password:'test-phone-password'});
 assert.equal(await page.getByRole('navigation',{name:'主导航'}).count(),0);assert.equal((await page.request.get(base+'/api/shuku/auth/me')).status(),401);
 await page.getByRole('tab',{name:'验证码登录',exact:true}).click();await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:output+'/sms-mobile.png'});
 console.log('PASS phone login reservation: SMS/password tabs, phone validation, exact request contracts, unavailable service, no fake countdown/session and mobile layout.');
}finally{await browser.close();}
