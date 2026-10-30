import type {Plugin} from 'vite';
import type {ServerResponse} from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';

/** Local authoring export: compile one trusted module, never the application's module catalog. */
export function offlineExport(root:string,library:string):Plugin {
 // Each export owns its temp directory. Queue compiles rather than rejecting
 // another click (including another tab exporting the same module).
 let tail=Promise.resolve();
 async function acquire(response:ServerResponse){
  const previous=tail;let release!:()=>void;
  tail=new Promise<void>(resolve=>{release=resolve;});
  await previous;
  if(response.destroyed){release();throw Error('导出已取消。');}
  return release;
 }
 return {name:'offline-module-export',configureServer(server){
  server.middlewares.use('/api/shuku/offline-export',(req,res,next)=>{
   if(req.url!=='/'&&req.url!=='')return next();
   const error=(status:number,message:string)=>{if(res.destroyed||res.writableEnded)return;res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({error:message}));};
   if(req.method!=='POST')return error(405,'请使用 POST 请求。');
   try{if(!req.headers.origin||new URL(req.headers.origin).host!==req.headers.host||req.headers['sec-fetch-site']==='cross-site')return error(403,'不允许跨站导出请求。');}catch{return error(403,'请求来源不正确。');}
   if(!req.headers['content-type']?.startsWith('application/json'))return error(415,'请使用 JSON 请求。');
   const chunks:Buffer[]=[];let size=0,oversize=false;
   req.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>40*1024*1024){oversize=true;error(413,'课程数据过大，请精简设计图后重试。');}else if(!oversize)chunks.push(chunk);});
   req.on('end',()=>{void(async()=>{
    if(oversize||res.destroyed)return;
     let folder:string|undefined,release:(()=>void)|undefined;
    try {
     const project=JSON.parse(Buffer.concat(chunks).toString('utf8'));
     if(project.version!==1||typeof project.courseId!=='string'||typeof project.title!=='string'||!Array.isArray(project.pages)||!project.pages.length||project.pages.length>100)throw Error('当前课程数据无效。');
     let moduleDir:string|undefined;
     for(const dir of await fs.readdir(path.join(library,'modules'),{withFileTypes:true})){
      if(!dir.isDirectory()||dir.isSymbolicLink()||dir.name==='shared')continue;
      const candidate=path.join(library,'modules',dir.name);
      const outline=await fs.readFile(path.join(candidate,'outlines.json'),'utf8').then(JSON.parse,()=>null);
      if((outline?.id||dir.name)===project.courseId&&outline?.ppt?.entry){moduleDir=candidate;break;}
     }
     if(!moduleDir)throw Error('找不到当前模块的本地源码，请在运行本地术库的电脑上导出。');
     // Do not let submitted metadata choose framework directories or filesystem entries.
     for(const field of ['authoringVersion','authoringModule','sourceGuideEntry','nativeSnapshot','sourceAssets','importOrigin'])delete project[field];
     if(project.source)throw Error('此入口用于本地模块；源码课程请先导入本地模块后导出。');
     for(const p of project.pages)if(!p||typeof p.id!=='string'||typeof p.title!=='string'||(p.nativeId&&typeof p.nativeId!=='string'))throw Error('课程页面数据无效。');
     release=await acquire(res);
     folder=await fs.mkdtemp(path.join(os.tmpdir(),'shuku-offline-'));
     const projectFile=path.join(folder,'project.json'),out=path.join(folder,'dist');
     await fs.writeFile(projectFile,JSON.stringify(project));
     await new Promise<void>((resolve,reject)=>{
      const child=spawn(process.execPath,[path.join(root,'scripts/build-shuku-preview.mjs'),'--course-root',library,'--module',moduleDir!,'--project',projectFile,'--revision',randomUUID(),'--outdir',out,'--offline','1','--zip','1'],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe']});
      let diagnostic='';child.stderr.on('data',(chunk:Buffer)=>{diagnostic=(diagnostic+chunk.toString()).slice(-4000);});
      const timer=setTimeout(()=>{child.kill();reject(Error('导出超时，请精简大型素材后重试。'));},240000);
      child.once('error',e=>{clearTimeout(timer);reject(e);});
      child.once('close',code=>{clearTimeout(timer);if(code===0)resolve();else{server.config.logger.error(diagnostic);reject(Error('离线网页构建失败，请检查课程源码和素材。'));}});
      res.once('close',()=>{if(!res.writableEnded)child.kill();});
     });
     const file=path.join(out,'course.zip'),stat=await fs.stat(file);
     if(res.destroyed)return;
     res.setHeader('Content-Type','application/zip');res.setHeader('Content-Length',stat.size);res.setHeader('Cache-Control','no-store');
     await pipeline(createReadStream(file),res);
    } catch(e){error(422,e instanceof Error?e.message:'离线导出失败，请重试。');}
    finally {try{if(folder)await fs.rm(folder,{recursive:true,force:true});}finally{release?.();}}
   })();});
  });
 }};
}
