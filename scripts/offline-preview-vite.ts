import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import type {Plugin} from 'vite';
// @ts-ignore shared Node asset ownership helper
import {assetRoots} from './module-assets.mjs';

/** Development serves the same static resources as OSS; it never generates ZIPs. */
export function offlinePreview(root:string,library:string):Plugin{
 let building=false,ready=false,pending=false,diagnostic='',timer:ReturnType<typeof setTimeout>|undefined;
 let child:ReturnType<typeof spawn>|undefined;
 const output=path.join(root,'.offline-preview');
 const mime:Record<string,string>={'.json':'application/json; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.woff2':'font/woff2','.woff':'font/woff'};
 async function indexes(){
  const target=path.join(output,'namespaces');await fsp.mkdir(target,{recursive:true});
  const indexFile=path.join(library,'modules/shared/asset-index.json');
  const formats=fs.existsSync(indexFile)?JSON.parse(await fsp.readFile(indexFile,'utf8')).formats||{}:{};
  for(const [id,relative]of Object.entries(assetRoots(library))){
   const directory=path.resolve(library,relative as string),files:unknown[]=[];
   async function walk(folder:string){for(const entry of await fsp.readdir(folder,{withFileTypes:true}).catch(()=>[])){
    if(entry.isSymbolicLink())continue;const file=path.join(folder,entry.name),rel=path.relative(directory,file).replaceAll('\\','/');
    if(entry.isDirectory()){if(!['dataset','datasets','digit-training'].includes(entry.name))await walk(file);continue;}
    if(!entry.isFile()||/\.(pt|pth|onnx|idx1-ubyte|idx3-ubyte)$/i.test(file))continue;
    const media:Record<string,string>={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json'};
    const data=await fsp.readFile(file);files.push({path:rel,size:data.length,sha256:createHash('sha256').update(data).digest('hex'),mime:media[path.extname(file).toLowerCase()]||'application/octet-stream'});
   }}
   await walk(directory);
   await fsp.writeFile(path.join(target,id+'.json'),JSON.stringify({schema:1,namespace:id,files,formats:Object.fromEntries(Object.entries(formats).filter(([k])=>k.startsWith(id+'/')).map(([k,v])=>[k.slice(id.length+1),v]))}));
  }
 }
 return {name:'local-offline-static-preview',apply:'serve',configureServer(server){
  let stopped=false;
  const prepare=async()=>{
   if(stopped)return;if(building){pending=true;return;}building=true;ready=false;diagnostic='';
   server.config.logger.info('正在准备本地离线下载的静态运行文件（不生成 ZIP）…');
   child=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build','--mode','public-preview','--outDir',output],{cwd:root,windowsHide:true,env:{...process.env,VITE_ASSET_BASE_URL:'',IDL_OFFLINE_MODULES:''},stdio:['ignore','ignore','pipe']});
   child.stderr?.on('data',b=>{diagnostic=(diagnostic+b.toString()).slice(-2000);});
   const finish=async(code:number|null)=>{
    try{if(code!==0)throw Error('课程静态文件构建失败。');await indexes();ready=true;server.config.logger.info('本地离线下载静态资源已就绪。');}
    catch(error){diagnostic=String(error)+'\n'+diagnostic;server.config.logger.error(diagnostic);}
    finally{building=false;child=undefined;if(pending&&!stopped){pending=false;timer=setTimeout(()=>void prepare(),1500);}}
   };
   child.once('error',error=>{diagnostic=error.message;void finish(1);});child.once('exit',code=>void finish(code));
  };
  server.middlewares.use('/_offline/',async(req,res,next)=>{
   if(req.method!=='GET'&&req.method!=='HEAD')return next();
   const error=(status:number,message:string)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');if(status===503)res.setHeader('Retry-After','5');res.end(JSON.stringify({error:message}));};
   if(!ready)return error(503,building?'本地离线资源正在准备，请稍后重试。':'本地离线资源准备失败，请查看开发服务日志。');
   let relative:string;try{relative=decodeURIComponent((req.url||'').split('?')[0]);}catch{return error(400,'静态资源路径无效。');}
   const file=path.resolve(output,'.'+relative);if(!file.startsWith(output+path.sep))return error(403,'静态资源路径无效。');
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())return error(404,'离线静态文件不存在，请等待课程资源更新完成。');
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Content-Length',fs.statSync(file).size);res.setHeader('Cache-Control','no-store');
   if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
  });
  server.watcher.on('all',(_event,file)=>{
   if(file.startsWith(output+path.sep)||file.includes('node_modules'))return;
   if(![path.join(root,'src'),path.join(root,'scripts'),path.join(library,'modules'),path.join(library,'assets')].some(prefix=>file.startsWith(prefix+path.sep)))return;
   clearTimeout(timer);timer=setTimeout(()=>void prepare(),2500);
  });
  server.httpServer?.once('close',()=>{stopped=true;clearTimeout(timer);child?.kill();});
  void prepare();
 }};
}
