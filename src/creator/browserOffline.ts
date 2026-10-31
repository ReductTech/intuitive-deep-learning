import type {CreatorProject} from './model';
import {prepareOfflineZip} from './offlineZip';
import {verifyOfflineDownload} from './offlineDownload';
import {jsonAssetReferences} from '../../scripts/runtime-asset-references.mjs';
type Entry={name:string;bytes:Uint8Array<ArrayBuffer>};
type Progress=(text:string,ratio?:number)=>void;
const encoder=new TextEncoder();
const table=new Uint32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(b:Uint8Array){let c=0xffffffff;for(const x of b)c=table[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function safeScript(s:string){return s.replace(/<\/script/gi,'<\\/script');}
async function dataUrl(bytes:Uint8Array<ArrayBuffer>,mime:string){return new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(new Blob([bytes],{type:mime}));});}
export async function browserZip(entries:Entry[],signal:AbortSignal,progress:Progress){
 const parts:BlobPart[]=[],directory:BlobPart[]=[];let offset=0;
 for(let i=0;i<entries.length;i++){
  signal.throwIfAborted();const e=entries[i],name=encoder.encode(e.name),compressed=new Uint8Array(await new Response(new Blob([e.bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()),method=compressed.length<e.bytes.length?8:0,body=method?compressed:e.bytes,crc=crc32(e.bytes);
  const header=new Uint8Array(30),v=new DataView(header.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(8,method,true);v.setUint32(14,crc,true);v.setUint32(18,body.length,true);v.setUint32(22,e.bytes.length,true);v.setUint16(26,name.length,true);
  const central=new Uint8Array(46),c=new DataView(central.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(10,method,true);c.setUint32(16,crc,true);c.setUint32(20,body.length,true);c.setUint32(24,e.bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
  parts.push(header,name,body);directory.push(central,name);offset+=header.length+name.length+body.length;progress(`正在本机压缩 ${i+1} / ${entries.length} 个文件…`,(i+1)/entries.length);
 }
 const centralBlob=new Blob(directory),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,centralBlob.size,true);v.setUint32(16,offset,true);return new Blob([...parts,centralBlob,end],{type:'application/zip'});
}
async function resize(bytes:Uint8Array<ArrayBuffer>,mime:string){
 if(!['image/png','image/jpeg'].includes(mime))return bytes;
 const bitmap=await createImageBitmap(new Blob([bytes],{type:mime}));
 try{const ratio=Math.min(1,1600/bitmap.width,900/bitmap.height);if(ratio===1)return bytes;
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('图片缩放失败')),mime,.92));return new Uint8Array(await blob.arrayBuffer());
 }finally{bitmap.close();}
}
let compiler:Promise<typeof import('esbuild-wasm')>|undefined;
export async function downloadCourseInBrowser(project:CreatorProject,signal:AbortSignal,progress:Progress){
 const assetBase=(import.meta.env.VITE_ASSET_BASE_URL||location.origin).replace(/\/$/,'');
 const base=new URL(import.meta.env.BASE_URL||'/',location.href).href;
 const get=async(url:string)=>{signal.throwIfAborted();const response=await fetch(url,{signal,credentials:'omit',mode:'cors'});if(!response.ok){const data=await response.json().catch(()=>null);throw Error(data?.error||`资源下载失败（${response.status}）：${url}`);}return new Uint8Array(await response.arrayBuffer());};
 const json=async(url:string)=>{
  const text=new TextDecoder().decode(await get(url));
  if(/^\s*</.test(text))throw Error('离线资源清单返回了网页，静态资源尚未正确发布或路径被首页路由接管：'+url);
  try{return JSON.parse(text);}catch{throw Error('离线资源清单格式不正确，请更新静态资源后重试：'+url);}
 };
 const course=await json(base+'offline-runtime/courses/'+encodeURIComponent(project.courseId)+'.json');
 if(!course)throw Error('当前课程的离线资源尚未发布，请更新课程资源后再下载。');
 const codes=new Map<string,string>(),css:string[]=[],embedded=new Map<string,string>();
 progress('正在读取当前课件的运行代码…');
 for(const file of course.files){const bytes=await get(base+file);if(course.modules.includes(file))codes.set(file,new TextDecoder().decode(bytes));else if(file.endsWith('.css'))css.push(new TextDecoder().decode(bytes));else embedded.set(file,await dataUrl(bytes,file.endsWith('.woff2')?'font/woff2':file.endsWith('.js')?'text/javascript':'application/octet-stream'));}
 for(const [file,text]of codes){let patched=text;for(const [name,url]of embedded)patched=patched.replaceAll('/'+name,url);codes.set(file,patched);}
 // CSS font URLs are relative to emitted CSS, unlike JS public URLs.
 let styles=css.join('\n');for(const [name,url]of embedded)styles=styles.replaceAll('/'+name,url).replaceAll('./'+pathBase(name),url).replaceAll('../'+pathBase(name),url).replaceAll(pathBase(name),url);
 const manifest:Record<string,[string,string]>={},files:Entry[]=[],dedup=new Map<string,string>();
 const patterns:string[][]=course.assetPatterns||[],hints:string[]=course.assetHints||[];
 const matches=(path:string)=>hints.some(h=>path===h||path.endsWith('/'+h)||pathBase(path)===h)||patterns.some(([head,tail])=>path.includes(head)&&path.endsWith(tail));
 progress('正在读取当前课件的图片和视频清单…');
 for(const namespace of course.namespaces){
  const index=await json(base+'offline-runtime/namespaces/'+encodeURIComponent(namespace)+'.json');
  const formats:Record<string,string>=index.formats||{};
  const aliases=new Map<string,string[]>();for(const [source,target] of Object.entries(formats)){if(!aliases.has(target))aliases.set(target,[]);aliases.get(target)!.push(source);}
  const selected=index.files.filter((f:any)=>!formats[f.path]&&(matches(f.path)||(aliases.get(f.path)||[]).some(matches)||(f.path.startsWith('scenedeck-thumbnails/')&&project.pages.some(p=>f.path.replace(/\.(png|jpe?g|webp)$/i,'').endsWith('/'+(p.nativeId||p.id))))));
  const includeReferences=(bytes:Uint8Array,metadataPath:string)=>{
   const refs=new Set(jsonAssetReferences(JSON.parse(new TextDecoder().decode(bytes)),metadataPath));
   for(const candidate of index.files)if(!selected.includes(candidate)&&!formats[candidate.path]&&(refs.has(candidate.path)||(aliases.get(candidate.path)||[]).some(source=>refs.has(source))))selected.push(candidate);
  };
  for(let i=0;i<selected.length;i++){
   signal.throwIfAborted();const f=selected[i],key='assets/'+namespace+'/'+f.path;progress(`正在从 OSS 下载素材 ${i+1} / ${selected.length}…`,(i+1)/selected.length);
   if(dedup.has(f.sha256)){manifest[key]=[dedup.get(f.sha256)!,f.mime];for(const source of aliases.get(f.path)||[])manifest['assets/'+namespace+'/'+source]=manifest[key];if(f.mime==='application/json')includeReferences(files.find(file=>file.name===dedup.get(f.sha256))!.bytes,f.path);continue;}
   let bytes=await get(new URL(f.url||namespace+'/'+f.path,assetBase+'/').href);
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');if(hash!==f.sha256)throw Error('素材版本校验失败，请刷新重试：'+f.path);
   if(f.mime==='application/json'){
    includeReferences(bytes,f.path);
   }
   bytes=await resize(bytes,f.mime);const name='files/'+f.sha256.slice(0,24)+'.'+f.path.split('.').at(-1);dedup.set(f.sha256,name);manifest[key]=[name,f.mime];for(const source of aliases.get(f.path)||[])manifest['assets/'+namespace+'/'+source]=manifest[key];files.push({name,bytes});
  }
 }
 progress('正在用户浏览器中组装课程代码…');
 compiler??=(async()=>{const e=await import('esbuild-wasm');await e.initialize({wasmURL:base+'offline-runtime/esbuild.wasm'});return e;})();
 const esbuild=await compiler;
 const built=await esbuild.build({stdin:{contents:`export {mount} from ${JSON.stringify(course.entry)}`,loader:'js'},bundle:true,format:'iife',globalName:'OfflineCourse',write:false,minify:true,plugins:[{name:'oss-course-files',setup(build){build.onResolve({filter:/.*/},args=>{
  if(args.kind==='entry-point')return {path:args.path,namespace:'oss'};
  const parts=(args.importer?args.importer.split('/').slice(0,-1):[]);if(args.path.startsWith('.'))for(const p of args.path.split('/')){if(p==='..')parts.pop();else if(p!=='.')parts.push(p);}else{parts.length=0;parts.push(...args.path.split('/'));}
  return {path:parts.join('/'),namespace:'oss'};
 });build.onLoad({filter:/.*/,namespace:'oss'},args=>{const code=args.path.includes('preload-helper-')?'export function _(callback){return callback()}':codes.get(args.path);if(code===undefined)throw Error('课件依赖未列入清单：'+args.path);return {contents:code,loader:'js'};});}}]});
 signal.throwIfAborted();const code=built.outputFiles![0].text+';OfflineCourse.mount('+JSON.stringify(project)+');';
 const canvasAssets:Record<string,string>={};
 // Script transport also makes JSON fetchable when the extracted ZIP opens via file://.
 for(const f of files)if(manifest[Object.keys(manifest).find(k=>manifest[k][0]===f.name)!]?.[1]?.match(/^(image\/|application\/json$)/))canvasAssets[f.name]=await dataUrl(f.bytes,manifest[Object.keys(manifest).find(k=>manifest[k][0]===f.name)!][1]);
 const bootstrap=`globalThis.__SHUKU_OFFLINE__=true;globalThis.__SHUKU_OFFLINE_DESIGNS__=${JSON.stringify((project as any).designImages||{})};const assets=${JSON.stringify(manifest)};globalThis.__SHUKU_OFFLINE_ASSET_KEYS__=Object.keys(assets);globalThis.__SHUKU_OFFLINE_ASSET__=key=>{const a=assets[key];if(!a){if(key.includes('/scenedeck-thumbnails/'))return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';throw Error('缺少离线素材：'+key);}return globalThis.__SHUKU_CANVAS_ASSETS__?.[a[0]]||globalThis.__SHUKU_ZIP_FILES__?.[a[0]]||new URL(a[0],document.baseURI).href;};`;
 const frame=`globalThis.__SHUKU_OFFLINE_FRAME__=function(source){const u=new URL(source,'https://offline.invalid');if(!u.pathname.endsWith('/modules/'+${JSON.stringify(project.courseId)}))return '<p>此在线内容未包含在离线课件中。</p>';const startup=${JSON.stringify(bootstrap)};const values={__SHUKU_OFFLINE__:true,__SHUKU_OFFLINE_EMBED_QUERY__:u.search,__SHUKU_CANVAS_ASSETS__:globalThis.__SHUKU_CANVAS_ASSETS__,__SHUKU_ZIP_FILES__:globalThis.__SHUKU_ZIP_FILES__};const init='Object.assign(globalThis,'+JSON.stringify(values)+');'+startup+';globalThis.__SHUKU_OFFLINE_FRAME__=('+globalThis.__SHUKU_OFFLINE_FRAME__.toString()+');';return '<html><meta charset="utf-8"><style>'+document.querySelector('head style').textContent+'</style><body><div id="root"></div><script>'+init+'<'+String.fromCharCode(47)+'script><script>'+document.getElementById('offline-runtime').textContent+'<'+String.fromCharCode(47)+'script></body></html>';};`;

 const html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;;script-src &#39;unsafe-inline&#39; &#39;unsafe-eval&#39; file: blob: data:;style-src &#39;unsafe-inline&#39;;img-src data: blob: file:;media-src file: blob: data:;font-src data: blob: file:;connect-src data: blob:;frame-src file: blob: data:;worker-src blob: data:"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+styles.replace(/<\/style/gi,'<\\/style')+'</style></head><body><div id="root"></div><script src="./files/canvas-assets.js"></script><script>'+safeScript(bootstrap+frame)+'</script><script id="offline-runtime">'+safeScript(code)+'</script></body></html>';
 // Image bytes travel once, via the local script; videos remain raw binary files.
 const entries=files.filter(f=>!Object.hasOwn(canvasAssets,f.name));entries.push({name:'files/canvas-assets.js',bytes:encoder.encode('globalThis.__SHUKU_CANVAS_ASSETS__='+JSON.stringify(canvasAssets)+';')},{name:'打开课件.html',bytes:encoder.encode(html)},{name:'使用说明.txt',bytes:encoder.encode('请完整解压，再双击“打开课件.html”。请保留 files 文件夹。无需启动服务器。')});
 const zip=await browserZip(entries,signal,progress);progress('正在本机校验 ZIP 并逐页检查…');const check=await prepareOfflineZip(zip,signal);try{await verifyOfflineDownload(check.html,project.pages.map(p=>p.id),signal);}finally{check.release();}return zip;
}
function pathBase(path:string){return path.split('/').at(-1)!;}
