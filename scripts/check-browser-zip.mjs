// Browser ZIP primitives: no HTTP service or filesystem archiver used by the browser.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const result=await build({stdin:{contents:`export {browserZip} from './src/creator/browserOffline';export {prepareOfflineZip} from './src/creator/offlineZip';`,resolveDir:root,loader:'ts'},bundle:true,format:'iife',globalName:'ZipTest',write:false,define:{'import.meta.env':'{}'}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();await page.addScriptTag({content:result.outputFiles[0].text});
 const resultValue=await page.evaluate(async()=>{
  const signal=new AbortController().signal,entry=new TextEncoder().encode('<html><head></head><body>Fixture</body></html>');
  const zip=await ZipTest.browserZip([{name:'打开课件.html',bytes:entry},{name:'files/a.json',bytes:new TextEncoder().encode('{"test":true}')}],signal,()=>{});
  const unpacked=await ZipTest.prepareOfflineZip(zip,signal);const html=await unpacked.html.text();unpacked.release();
  const corrupt=new Uint8Array(await zip.arrayBuffer());corrupt[14]^=1;
  // CRC in the directory is authoritative; corrupt its CRC instead of only the local header.
  for(let i=0;i<corrupt.length-46;i++)if(corrupt[i]===80&&corrupt[i+1]===75&&corrupt[i+2]===1&&corrupt[i+3]===2){corrupt[i+16]^=1;break;}
  let rejected=false;try{await ZipTest.prepareOfflineZip(new Blob([corrupt]),signal);}catch{rejected=true;}
  const canceled=new AbortController();canceled.abort();let aborted=false;try{await ZipTest.browserZip([{name:'打开课件.html',bytes:entry}],canceled.signal,()=>{});}catch{aborted=true;}
  return {html:html.includes('Fixture'),rejected,aborted,bytes:zip.size};
 });
 assert.equal(resultValue.html,true);assert.equal(resultValue.rejected,true);assert.equal(resultValue.aborted,true);
 console.log('PASS browser-local ZIP creation, UTF-8 entry, CRC validation and cancellation; no backend');
}finally{await browser.close();}
