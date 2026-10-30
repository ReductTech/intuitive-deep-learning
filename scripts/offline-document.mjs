import fs from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {createGzip} from 'node:zlib';
import {createHash} from 'node:crypto';

/** Compress the complete immutable document, including base64 overhead; fail visibly on damage. */
export async function sealOfflineDocument(file,title){
 const temporary=file+'.gz';
 try{
  await pipeline(createReadStream(file),createGzip({level:6}),createWriteStream(temporary));
  const payload=await fs.readFile(temporary),hash=createHash('sha256').update(payload).digest('hex');
  const safe=title.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  await fs.writeFile(file,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe}</title><style>body{margin:0;background:#f2f5fa;color:#19345e;font:16px system-ui;display:grid;place-content:center;min-height:100vh}main{max-width:560px;padding:36px}h1{font-size:24px;line-height:1.5}progress{width:100%;accent-color:#3568f4}p{line-height:1.8}</style><main><small>术库 · 离线课堂</small><h1>${safe}</h1><p id="status" role="status">正在校验并展开课程，图片较多时请稍候…</p><progress aria-label="正在打开课程"></progress><noscript>请使用允许 JavaScript 的 Chrome 或 Edge 打开此文件。</noscript></main><script id="offline-payload" type="application/octet-stream">${payload.toString('base64')}</script><script>
(async()=>{try{
 if(!globalThis.DecompressionStream)throw Error('请使用较新版本的 Chrome 或 Edge 打开此文件。');
 const binary=atob(document.getElementById('offline-payload').textContent.trim()),chunks=[];
 for(let i=0;i<binary.length;i+=65536){const part=binary.slice(i,i+65536),bytes=new Uint8Array(part.length);for(let j=0;j<part.length;j++)bytes[j]=part.charCodeAt(j);chunks.push(bytes)}
 const packed=new Blob(chunks);
 if(crypto.subtle){const digest=await crypto.subtle.digest('SHA-256',await packed.arrayBuffer()),actual=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');if(actual!==${JSON.stringify(hash)})throw Error('文件校验失败，请重新下载；这份文件可能未传输完整。');}
 const html=await new Response(packed.stream().pipeThrough(new DecompressionStream('gzip'))).text();
 document.open();document.write(html);document.close();
 }catch(error){parent.postMessage({type:'shuku-offline-error',message:error.message},'*');document.getElementById('status').textContent='无法打开离线课程：'+error.message;document.querySelector('progress').remove();}})();
</script></html>`);
 }finally{await fs.rm(temporary,{force:true});}
}
