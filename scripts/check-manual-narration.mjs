import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir} from 'node:fs/promises';

// Pass the local Playwright entry point as the first argument.
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const bundle=await build({
 absWorkingDir:new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),
 stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
  import React,{useState} from 'react';
  import {createRoot} from 'react-dom/client';
  import {useAutoplay} from './src/shuku/useAutoplay';
  import {NarrationControls} from './src/shuku/NarrationControls';
  import {NarrationSubtitles} from './src/shuku/NarrationSubtitles';
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
  const pages=['甲。第二句。','乙','丙',''].map((text,i)=>({id:String(i),outline:{snippet:text}}));
  window.setNarrationText=text=>{pages[0].outline.snippet=text;};
  function Player(){
   const [id,setId]=useState('0');window.selectPage=setId;
   const player=useAutoplay(pages,id,'manual-test',true);window.player=player;
   return <><div id="page-id">{id}</div><NarrationControls player={player}/><div style={{position:'relative',height:600,background:'#edf3ff'}}><NarrationSubtitles player={player}/></div></>;
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
 const styles=await readFile(new URL('../src/shuku/NarrationControls.css',import.meta.url),'utf8');
 page.setDefaultTimeout(10000);
 page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
 await page.route('**/*',route=>route.fulfill({contentType:route.request().url().endsWith('/test.js')?'text/javascript':'text/html',body:route.request().url().endsWith('/test.js')?bundle.outputFiles[0].text:'<style>'+styles+'</style><div id="root" class="cw-app"></div><script type="module" src="/test.js"></script>'}));
 await page.goto('http://localhost/manual-test');
 await page.getByLabel('讲稿设置').click();
 assert.equal(await page.getByLabel('音色',{exact:true}).inputValue(),'Chinese (Mandarin)_Warm_Bestie');
 assert.equal(await page.getByLabel('语速',{exact:true}).inputValue(),'1.1');
 assert.deepEqual(await page.getByLabel('语速',{exact:true}).locator('option').allTextContents(),['慢 · 1.0×','中 · 1.1×','快 · 1.2×']);
 assert.equal(await page.getByRole('checkbox',{name:'显示字幕'}).isChecked(),false);
 await page.getByRole('checkbox',{name:'显示字幕'}).check();
 await page.getByLabel('讲稿设置').click();
 await page.getByRole('button',{name:'开始智能讲稿',exact:true}).click();
 await page.waitForFunction(()=>window.requests.length===2&&window.player.state==='playing');
 assert.deepEqual(await page.evaluate(()=>window.requests),['甲。第二句。','乙']);
 await page.getByLabel('讲解字幕').filter({hasText:'甲。'}).waitFor();
 await page.evaluate(()=>{const audio=window.audios[0];audio.duration=10;audio.currentTime=8;audio.ontimeupdate();});
 await page.getByLabel('讲解字幕').filter({hasText:'第二句。'}).waitFor();
 await mkdir(new URL('../work/narration-subtitles/',import.meta.url),{recursive:true});
 await page.screenshot({path:new URL('../work/narration-subtitles/preview.png',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
 await page.getByLabel('讲稿设置').click();
 await page.getByRole('checkbox',{name:'显示字幕'}).uncheck();
 assert.equal(await page.getByLabel('讲解字幕').count(),0);
 await page.getByRole('checkbox',{name:'显示字幕'}).check();
 await page.getByLabel('讲稿设置').click();
 assert.equal(await page.evaluate(()=>window.audios[0].plays),1);
 await page.getByRole('button',{name:'暂停讲解',exact:true}).click();
 await page.waitForFunction(()=>window.player.state==='paused');
 assert.equal(await page.getByLabel('讲解字幕').textContent(),'第二句。');
 await page.getByRole('button',{name:'继续讲解',exact:true}).click();
 await page.evaluate(()=>window.audios[0].onended());
 await page.waitForFunction(()=>window.player.state==='waiting');
 assert.equal(await page.getByLabel('讲解字幕').count(),0);
 assert.equal(await page.locator('#page-id').textContent(),'0');
 assert.deepEqual(await page.evaluate(()=>window.requests),['甲。第二句。','乙']);
 await page.getByRole('button',{name:'重新讲解',exact:true}).click();
 await page.waitForFunction(()=>window.audios[0].plays===3&&window.player.state==='playing');
 await page.evaluate(()=>window.audios[0].onended());
 await page.waitForFunction(()=>window.player.state==='waiting');
 await page.evaluate(()=>window.selectPage('1'));
 await page.waitForFunction(()=>window.player.state==='loading');
 assert.deepEqual(await page.evaluate(()=>window.requests),['甲。第二句。','乙']);
 await page.evaluate(()=>window.release());
 await page.waitForFunction(()=>window.player.state==='playing'&&window.requests.length===3);
 assert.equal(await page.getByRole('alert').count(),0);
 await page.evaluate(()=>window.audios[1].onended());
 await page.waitForFunction(()=>window.player.state==='waiting');
 assert.equal(await page.locator('#page-id').textContent(),'1');
 await page.evaluate(()=>window.selectPage('2'));
 await page.waitForFunction(()=>window.player.state==='playing');
 assert.deepEqual(await page.evaluate(()=>window.requests),['甲。第二句。','乙','丙','丙']);
 await page.evaluate(()=>window.audios[2].onended());
 await page.waitForFunction(()=>window.player.state==='waiting');
 assert.equal(await page.locator('#page-id').textContent(),'2');
 await page.getByLabel('讲稿设置').click();
 assert.equal(await page.getByRole('checkbox').count(),1);
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
 await page.getByLabel('讲解字幕').filter({hasText:'甲。'}).waitFor();
 await page.evaluate(()=>window.speeches.at(-1).onboundary({charIndex:2}));
 await page.getByLabel('讲解字幕').filter({hasText:'第二句。'}).waitFor();
 // A cue longer than the old 42-character limit stays intact, including embedded newlines.
 const longSentence='这是没有中途标点的长字幕'.repeat(6)+'\n换行之后也不能从中间切开，';
 const closing='“最后一句保留引号。”';
 await page.evaluate(text=>{window.player.stop();window.setNarrationText(text);},longSentence+'语速是1.1倍。'+closing);
 await page.waitForFunction(()=>window.player.state==='idle');
 await page.getByRole('button',{name:'开始智能讲稿',exact:true}).click();
 await page.waitForFunction(()=>window.player.state==='playing');
 assert.equal(await page.getByLabel('讲解字幕').textContent(),longSentence);
 await page.evaluate(()=>window.speeches.at(-1).onboundary({charIndex:43}));
 assert.equal(await page.getByLabel('讲解字幕').textContent(),longSentence);
 await page.evaluate(charIndex=>window.speeches.at(-1).onboundary({charIndex}),longSentence.length);
 await page.waitForFunction(()=>window.player.subtitle==='语速是1.1倍。');
 await page.evaluate(charIndex=>window.speeches.at(-1).onboundary({charIndex}),longSentence.length+'语速是1.1倍。'.length);
 await page.waitForFunction(text=>window.player.subtitle===text,closing);
 await page.evaluate(()=>window.selectPage('3'));
 await page.getByRole('alert').filter({hasText:'本页暂无'}).waitFor();
 assert.equal(await page.locator('#page-id').textContent(),'3');
 const speechCount=await page.evaluate(()=>window.speeches.length);
 // The older, paragraph-based notes panel keeps automatic paragraphs but never advances a slide.
 await page.evaluate(()=>window.showDeck());
 await page.getByRole('button',{name:'智能讲稿',exact:true}).click();
 await page.getByTitle('开始朗读',{exact:true}).click();
 await page.waitForFunction(count=>window.speeches.length===count+1,speechCount);
 await page.evaluate(()=>window.speeches.at(-1).onend());
 await page.waitForFunction(count=>window.speeches.length===count+2,speechCount);
 await page.evaluate(()=>window.speeches.at(-1).onend());
 await page.getByText('准备朗读',{exact:true}).waitFor();
 assert.equal(new URL(page.url()).searchParams.get('slide'),null);
 assert.equal(await page.locator('.scenedeck-notes__heading').textContent(),'智能讲稿第一页');
 assert.deepEqual(errors,[]);
 console.log('PASS: subtitle toggle, audio progress, speech boundaries, pause/stop cleanup, manual slide navigation, retained/in-flight preloads, replay, background retry, and paragraph-only auto-advance.');
}finally{await browser.close();}
