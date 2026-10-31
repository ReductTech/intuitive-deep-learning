import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';

// Pass the local Playwright entry point as the first argument.
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const bundle=await build({
 absWorkingDir:new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),
 stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
  import React,{useState} from 'react';
  import {createRoot} from 'react-dom/client';
  import {useAutoplay} from './src/shuku/useAutoplay';
  import {NarrationControls} from './src/shuku/NarrationControls';
  import {NarrationContext} from './src/shuku/narrationBridge';
  import {SceneDeck} from './modules/shared/react/presentation/SceneDeck';
  window.audios=[];window.requests=[];window.speeches=[];window.failNext=false;
  window.Audio=class {
   readyState=4;currentTime=0;plays=0;
   constructor(){window.audios.push(this);}
   play(){this.plays++;return Promise.resolve();}pause(){}removeAttribute(){}load(){}
  };
  speechSynthesis.speak=s=>window.speeches.push(s);
  speechSynthesis.cancel=()=>{};speechSynthesis.pause=()=>{};speechSynthesis.resume=()=>{};
  let release;
  window.release=()=>release();
  const request=async(text,signal)=>{
   window.requests.push(text);
   if(text==='乙')await new Promise(resolve=>{release=resolve;});
   if(text==='丙'&&!window.failNext){window.failNext=true;throw new Error('预载失败');}
   return new Blob(['ID3'],{type:'audio/mpeg'});
  };
  const pages=['甲','乙','丙',''].map((text,i)=>({id:String(i),outline:{snippet:text}}));
  function Player(){
   const [id,setId]=useState('0');window.selectPage=setId;
   const player=useAutoplay(pages,id,'manual-test',true);window.player=player;
   return <><div id="page-id">{id}</div><NarrationControls player={player}/></>;
  }
  const root=createRoot(document.getElementById('root'));
  window.showDeck=()=>root.render(<SceneDeck catalog={[{id:'test-deck',title:'测试',scenes:[
   {id:'one',title:'第一页',section:'测试',render:()=> <div>第一页</div>},
   {id:'two',title:'第二页',section:'测试',render:()=> <div>第二页</div>}
  ]}]} moduleId="test" assetId="test" progressKey="manual-test" getNotes={id=>[{text:id+'第一段',selectors:[]},{text:id+'第二段',selectors:[]}]}/>);
  root.render(<NarrationContext.Provider value={request}><Player/></NarrationContext.Provider>);
 `},
 bundle:true,write:false,format:'esm',jsx:'automatic',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{"BASE_URL":"/"}'},logLevel:'silent',
});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage(),errors=[];
 page.setDefaultTimeout(10000);
 page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
 await page.route('**/*',route=>route.fulfill({contentType:route.request().url().endsWith('/test.js')?'text/javascript':'text/html',body:route.request().url().endsWith('/test.js')?bundle.outputFiles[0].text:'<div id="root"></div><script type="module" src="/test.js"></script>'}));
 await page.goto('http://localhost/manual-test');
 await page.getByRole('button',{name:'开始智能讲稿',exact:true}).click();
 await page.waitForFunction(()=>window.requests.length===2&&window.player.state==='playing');
 assert.deepEqual(await page.evaluate(()=>window.requests),['甲','乙']);
 await page.getByRole('button',{name:'暂停讲解',exact:true}).click();
 await page.waitForFunction(()=>window.player.state==='paused');
 await page.getByRole('button',{name:'继续讲解',exact:true}).click();
 await page.evaluate(()=>window.audios[0].onended());
 await page.waitForFunction(()=>window.player.state==='waiting');
 assert.equal(await page.locator('#page-id').textContent(),'0');
 assert.deepEqual(await page.evaluate(()=>window.requests),['甲','乙']);
 await page.getByRole('button',{name:'重新讲解',exact:true}).click();
 await page.waitForFunction(()=>window.audios[0].plays===3&&window.player.state==='playing');
 await page.evaluate(()=>window.audios[0].onended());
 await page.waitForFunction(()=>window.player.state==='waiting');
 await page.evaluate(()=>window.selectPage('1'));
 await page.waitForFunction(()=>window.player.state==='loading');
 assert.deepEqual(await page.evaluate(()=>window.requests),['甲','乙']);
 await page.evaluate(()=>window.release());
 await page.waitForFunction(()=>window.player.state==='playing'&&window.requests.length===3);
 assert.equal(await page.getByRole('alert').count(),0);
 await page.evaluate(()=>window.audios[1].onended());
 await page.waitForFunction(()=>window.player.state==='waiting');
 assert.equal(await page.locator('#page-id').textContent(),'1');
 await page.evaluate(()=>window.selectPage('2'));
 await page.waitForFunction(()=>window.player.state==='playing');
 assert.deepEqual(await page.evaluate(()=>window.requests),['甲','乙','丙','丙']);
 await page.evaluate(()=>window.audios[2].onended());
 await page.waitForFunction(()=>window.player.state==='waiting');
 assert.equal(await page.locator('#page-id').textContent(),'2');
 await page.getByLabel('讲稿设置').click();
 assert.equal(await page.getByRole('checkbox').count(),0);
 await page.getByRole('button',{name:'停止讲解',exact:true}).click();
 await page.waitForFunction(()=>window.player.state==='idle');
 await page.locator('details').evaluate(menu=>{menu.open=true;});
 await page.getByLabel('朗读方式').selectOption('browser');
 await page.getByLabel('讲稿设置').click();
 await page.getByRole('button',{name:'开始智能讲稿',exact:true}).click();
 await page.waitForFunction(()=>window.speeches.length===1);
 await page.evaluate(()=>window.speeches[0].onend());
 await page.waitForFunction(()=>window.player.state==='waiting');
 assert.equal(await page.locator('#page-id').textContent(),'2');
 await page.evaluate(()=>window.selectPage('0'));
 await page.waitForFunction(()=>window.speeches.length===2);
 await page.evaluate(()=>window.selectPage('3'));
 await page.getByRole('alert').filter({hasText:'本页暂无'}).waitFor();
 assert.equal(await page.locator('#page-id').textContent(),'3');
 assert.equal(await page.evaluate(()=>window.speeches.length),2);
 // The older, paragraph-based notes panel keeps automatic paragraphs but never advances a slide.
 await page.evaluate(()=>window.showDeck());
 await page.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await page.getByTitle('开始朗读',{exact:true}).click();
 await page.waitForFunction(()=>window.speeches.length===3);
 await page.evaluate(()=>window.speeches.at(-1).onend());
 await page.waitForFunction(()=>window.speeches.length===4);
 await page.evaluate(()=>window.speeches.at(-1).onend());
 await page.getByText('准备朗读',{exact:true}).waitFor();
 assert.equal(new URL(page.url()).searchParams.get('slide'),null);
 assert.equal(await page.locator('.scenedeck-notes__heading').textContent(),'智能讲稿第一页');
 assert.deepEqual(errors,[]);
 console.log('PASS: manual slide navigation, retained/in-flight preloads, replay, pause/resume, background retry, browser speech, empty notes, and paragraph-only auto-advance.');
}finally{await browser.close();}
