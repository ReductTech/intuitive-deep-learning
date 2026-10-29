import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {createHash} from 'node:crypto';
import {assetRoots} from './module-assets.mjs';

const mime = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.wav':'audio/wav','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.json':'application/json','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'};
const escape = text => text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const script = text => text.replace(/<\/script/gi,'<\\/script');

/** A single module entry is compiled; only asset namespaces referenced by that entry travel with it. */
export async function writeOfflineHtml({outdir,courseRoot,assetId,project}) {
 const javascript = await fs.readFile(path.join(outdir,'bundle.js'),'utf8');
 // Exact filenames cover static references and filename arrays. For generated
 // numbered resources, preserve the full template prefix AND extension, rather
 // than copying an entire folder just because a helper prepends "images/".
 const patterns=[];
 const ast=ts.createSourceFile('bundle.js',javascript,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 function visit(node){
  if(ts.isTemplateExpression(node)){
   const head=node.head.text,tail=node.templateSpans.at(-1).literal.text;
   if(head.length>2&&/\.[a-z0-9]{2,5}$/i.test(tail))patterns.push([head,tail]);
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
 const styles = (await fs.readFile(path.join(outdir,'utilities.css'),'utf8').catch(()=>'')) + (await fs.readFile(path.join(outdir,'bundle.css'),'utf8').catch(()=>''));
 const manifest = {},stored = new Map();
 const handle = await fs.open(path.join(outdir,'index.html'),'w');
 let size = 0;
 try {
  await handle.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob: data:; style-src 'unsafe-inline' blob: data:; img-src blob: data:; media-src blob: data:; font-src blob: data:; connect-src blob: data:; worker-src blob: data:; frame-src blob: data:"><title>${escape(project.title)}</title><style>${styles.replace(/<\/style/gi,'<\\/style')}</style></head><body><div id="root"><p style="padding:24px">正在打开离线课程…</p></div>`);
  const namespaces = Object.entries(assetRoots(courseRoot)).map(([name,relative])=>({name,directory:path.join(courseRoot,relative)}));
  for(const namespace of namespaces) {
   // References from a copied/embedded component are dependencies of this module, not extra courses.
   if(!(namespace.name===assetId || javascript.includes(JSON.stringify(namespace.name))))continue;
   if(!await fs.stat(namespace.directory).then(s=>s.isDirectory(),()=>false))continue;
   async function add(directory) {
    for(const entry of await fs.readdir(directory,{withFileTypes:true})) {
     const file=path.join(directory,entry.name);
     if(entry.isSymbolicLink())throw Error('离线素材不能使用符号链接。');
     if(entry.isDirectory()) { await add(file); continue; }
     if(!entry.isFile())continue;
     const relative=namespace.name+'/'+path.relative(namespace.directory,file).replaceAll('\\','/');
     const local=relative.slice(namespace.name.length+1);
     // Thumbnail history is often much larger than the current deck. Keep current page thumbnails only.
     if(relative.includes('/scenedeck-thumbnails/') && !project.pages.some(p=>relative.replace(/\.(png|jpg|jpeg|webp)$/i,'').endsWith('/'+(p.nativeId||p.id))))continue;
     if(!relative.includes('/scenedeck-thumbnails/')&&!javascript.includes(local)&&!javascript.includes(entry.name)&&!patterns.some(([head,tail])=>(local.startsWith(head)||entry.name.startsWith(head)||local.includes('/'+head))&&local.endsWith(tail)))continue;
     const content=await fs.readFile(file),type=mime[path.extname(file).toLowerCase()]||'application/octet-stream';
     const hash=createHash('sha256').update(type).update(content).digest('hex');
     if(stored.has(hash)){manifest['assets/'+relative]=stored.get(hash);continue;}
     size+=content.length;
     if(size>768*1024*1024)throw Error('当前模块素材超过 768 MB，请先精简大型音视频。');
     const id='offline-asset-'+stored.size,reference=[id,type];stored.set(hash,reference);
     manifest['assets/'+relative]=reference;
     await handle.write(`<script type="application/octet-stream" id="${id}">${content.toString('base64')}</script>`);
    }
   }
   await add(namespace.directory);
  }
  const bootstrap=`globalThis.__SHUKU_OFFLINE__=true;globalThis.__SHUKU_OFFLINE_DESIGNS__=${JSON.stringify(project.designImages||{})};const offlineManifest=${JSON.stringify(manifest)},offlineUrls=new Map;globalThis.__SHUKU_OFFLINE_ASSET__=(key)=>{const entry=offlineManifest[key];if(entry&&offlineUrls.has(entry[0]))return offlineUrls.get(entry[0]);if(!entry){if(key.includes('/scenedeck-thumbnails/'))return 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#edf2fa"/></svg>');throw Error('离线包缺少素材：'+key)}const element=document.getElementById(entry[0]),binary=atob(element.textContent.trim()),chunks=[];for(let i=0;i<binary.length;i+=65536){const part=binary.slice(i,i+65536),bytes=new Uint8Array(part.length);for(let j=0;j<part.length;j++)bytes[j]=part.charCodeAt(j);chunks.push(bytes)}const url=URL.createObjectURL(new Blob(chunks,{type:entry[1]}));offlineUrls.set(entry[0],url);return url;};`;
  const frameBootstrap=`globalThis.__SHUKU_OFFLINE_FRAME__=(source)=>{const url=new URL(source,'https://offline.invalid');if(!url.pathname.endsWith('/modules/'+${JSON.stringify(project.courseId)}))return '<p>此在线内容未包含在离线课程中。</p>';const css=document.querySelector('head style').textContent,code=document.getElementById('offline-runtime').textContent;const init='globalThis.__SHUKU_OFFLINE__=true;globalThis.__SHUKU_OFFLINE_ASSET__=parent.__SHUKU_OFFLINE_ASSET__;globalThis.__SHUKU_OFFLINE_FRAME__=parent.__SHUKU_OFFLINE_FRAME__;globalThis.__SHUKU_OFFLINE_DESIGNS__=parent.__SHUKU_OFFLINE_DESIGNS__;globalThis.__SHUKU_OFFLINE_EMBED_QUERY__='+JSON.stringify(url.search)+';';return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>'+css+'</style><body><div id="root"></div><script>'+init+'<'+String.fromCharCode(47)+'script><script>'+code+'<'+String.fromCharCode(47)+'script></body></html>';};`;
  await handle.write(`<script>${script(bootstrap+frameBootstrap)}</script><script id="offline-runtime">${script(javascript)}</script></body></html>`);
 } finally { await handle.close(); }
 return {assets:Object.keys(manifest).length,bytes:size};
}
