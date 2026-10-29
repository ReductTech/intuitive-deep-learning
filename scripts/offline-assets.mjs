import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {writeOfflineZip} from './offline-zip.mjs';
import {sealOfflineDocument} from './offline-document.mjs';
import {assetRoots} from './module-assets.mjs';

const mime = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.wav':'audio/wav','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.json':'application/json','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'};
const escape = text => text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const script = text => text.replace(/<\/script/gi,'<\\/script');

/** A single module entry is compiled; only asset namespaces referenced by that entry travel with it. */
export async function writeOfflineHtml({outdir,courseRoot,assetId,project,zip=false,inputs=[],buildRoot=courseRoot}) {
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
 const canvasPatterns=[];
 if(zip)for(const input of inputs){
  const file=path.resolve(buildRoot,input);if(!/\.[jt]sx?$/.test(file)||!file.includes('modules'))continue;
  const source=await fs.readFile(file,'utf8').catch(()=>'');if(!source.includes('getImageData'))continue;
  const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  function scan(node){
   if(ts.isStringLiteralLike(node)&&/\.(png|jpe?g|webp)$/i.test(node.text))canvasPatterns.push([node.text,'']);
   if(ts.isTemplateExpression(node)&&node.head.text.includes('/'))canvasPatterns.push([node.head.text,node.templateSpans.at(-1).literal.text]);
   ts.forEachChild(node,scan);
  }scan(tree);
 }
 const styles = (await fs.readFile(path.join(outdir,'utilities.css'),'utf8').catch(()=>'')) + (await fs.readFile(path.join(outdir,'bundle.css'),'utf8').catch(()=>''));
 const manifest = {},stored = new Map(),zipEntries=[];
 if(zip)await fs.mkdir(path.join(outdir,'files'),{recursive:true});
 const handle = await fs.open(path.join(outdir,'index.html'),'w');
 let size = 0;
 try {
  await handle.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob: data: file:; style-src 'unsafe-inline' blob: data:; img-src blob: data: file:; media-src blob: data: file:; font-src blob: data: file:; connect-src blob: data:; worker-src blob: data:; frame-src blob: data:"><title>${escape(project.title)}</title><style>${styles.replace(/<\/style/gi,'<\\/style')}</style></head><body><div id="root"><p style="padding:24px">正在打开离线课程…</p></div>`);
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
     if(zip){const name='files/'+hash.slice(0,24)+path.extname(file).toLowerCase(),target=path.join(outdir,name);await fs.writeFile(target,content);reference[0]=name;zipEntries.push({name,path:target});}
     else await handle.write(`<script type="application/octet-stream" id="${id}">${content.toString('base64')}</script>`);
    }
   }
   await add(namespace.directory);
  }
  const bootstrap=`globalThis.__SHUKU_OFFLINE__=true;addEventListener('error',e=>{if(e.message)parent.postMessage({type:'shuku-offline-error',message:e.message},'*')});addEventListener('unhandledrejection',e=>parent.postMessage({type:'shuku-offline-error',message:String(e.reason?.message||e.reason)},'*'));globalThis.__SHUKU_OFFLINE_DESIGNS__=${JSON.stringify(project.designImages||{})};const offlineManifest=${JSON.stringify(manifest)},offlineUrls=new Map;globalThis.__SHUKU_OFFLINE_ASSET_KEYS__=Object.keys(offlineManifest);globalThis.__SHUKU_OFFLINE_ASSET__=(key)=>{const entry=offlineManifest[key];if(entry&&offlineUrls.has(entry[0]))return offlineUrls.get(entry[0]);if(!entry){if(key.includes('/scenedeck-thumbnails/'))return 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#edf2fa"/></svg>');throw Error('离线包缺少素材：'+key)}if(!document.getElementById(entry[0])){const url=globalThis.__SHUKU_CANVAS_ASSETS__?.[entry[0]]||globalThis.__SHUKU_ZIP_FILES__?.[entry[0]]||new URL(entry[0],document.baseURI).href;offlineUrls.set(entry[0],url);return url;}const element=document.getElementById(entry[0]),binary=atob(element.textContent.trim()),chunks=[];for(let i=0;i<binary.length;i+=65536){const part=binary.slice(i,i+65536),bytes=new Uint8Array(part.length);for(let j=0;j<part.length;j++)bytes[j]=part.charCodeAt(j);chunks.push(bytes)}const url=URL.createObjectURL(new Blob(chunks,{type:entry[1]}));offlineUrls.set(entry[0],url);return url;};`;
  const frameBootstrap=`globalThis.__SHUKU_OFFLINE_FRAME__=(source)=>{const url=new URL(source,'https://offline.invalid');if(!url.pathname.endsWith('/modules/'+${JSON.stringify(project.courseId)}))return '<p>此在线内容未包含在离线课程中。</p>';const css=document.querySelector('head style').textContent,code=document.getElementById('offline-runtime').textContent;const init='globalThis.__SHUKU_OFFLINE__=true;globalThis.__SHUKU_OFFLINE_ASSET__=parent.__SHUKU_OFFLINE_ASSET__;globalThis.__SHUKU_OFFLINE_FRAME__=parent.__SHUKU_OFFLINE_FRAME__;globalThis.__SHUKU_OFFLINE_DESIGNS__=parent.__SHUKU_OFFLINE_DESIGNS__;globalThis.__SHUKU_OFFLINE_EMBED_QUERY__='+JSON.stringify(url.search)+';';return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>'+css+'</style><body><div id="root"></div><script>'+init+'<'+String.fromCharCode(47)+'script><script>'+code+'<'+String.fromCharCode(47)+'script></body></html>';};`;
  await handle.write(`${zip?'<script src="./files/canvas-assets.js"></script>':''}<script>${script(bootstrap+frameBootstrap)}</script><script id="offline-runtime">${script(javascript)}</script></body></html>`);
 } finally { await handle.close(); }
 if(zip){
  const resizeScript=fileURLToPath(new URL('../creator-skill/scripts/media/compress-images.py',import.meta.url));
  execFileSync(process.env.IDL_PYTHON||'python',[resizeScript,path.join(outdir,'files'),'--resize-only','--backup-dir',path.join(outdir,'image-originals')],{windowsHide:true,timeout:120000,stdio:'pipe'});
  // Local file images may display but cannot be read back by a canvas. Only
  // image-processing inputs use a small script transport, compressed by ZIP.
  const canvasMap={},canvasNames=new Set();
  for(const [key,[name,type]] of Object.entries(manifest))if(type.startsWith('image/')&&canvasPatterns.some(([head,tail])=>key.includes(head)&&key.endsWith(tail))){canvasNames.add(name);canvasMap[name]='data:'+type+';base64,'+(await fs.readFile(path.join(outdir,name))).toString('base64');}
  for(let i=zipEntries.length-1;i>=0;i--)if(canvasNames.has(zipEntries[i].name))zipEntries.splice(i,1);
  zipEntries.push({name:'files/canvas-assets.js',data:Buffer.from('globalThis.__SHUKU_CANVAS_ASSETS__='+JSON.stringify(canvasMap)+';')});
  const entry=path.join(outdir,'打开课件.html');await fs.rename(path.join(outdir,'index.html'),entry);
  zipEntries.unshift({name:'打开课件.html',path:entry});
  zipEntries.push({name:'使用说明.txt',data:Buffer.from('术库离线课堂\n\n1. 请先将 ZIP 完整解压到一个文件夹。\n2. 双击“打开课件.html”，使用 Chrome 或 Edge。\n3. 请保留 files 文件夹与 HTML 的相对位置。复制课件时请复制整个文件夹。\n\n包含当前模块的目录、讲稿、图片和前端交互；不需要启动服务器。在线服务不包含在离线版中。\n','utf8')});
  await writeOfflineZip(path.join(outdir,'course.zip'),zipEntries);
 }else await sealOfflineDocument(path.join(outdir,'index.html'),project.title);
 await fs.writeFile(path.join(outdir,'offline-report.json'),JSON.stringify({schema:2,module:project.courseId,title:project.title,pages:project.pages.map(p=>({id:p.id,title:p.title})),assetCount:Object.keys(manifest).length,uniqueAssets:stored.size,assetBytes:size,fileBytes:(await fs.stat(path.join(outdir,zip?'course.zip':'index.html'))).size},null,2));
 return {assets:Object.keys(manifest).length,bytes:size};
}
