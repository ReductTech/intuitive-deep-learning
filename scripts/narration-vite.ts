import type {Plugin} from 'vite';
import path from 'node:path';
import {spawn} from 'node:child_process';

/** Local preview uses the production synthesizer without starting business services. */
export function localNarration(root:string):Plugin {
 let running=0;
 return {name:'local-course-narration',configureServer(server){
  server.middlewares.use('/api/shuku/narration/segment',(req,res,next)=>{
   if(req.url!=='/'&&req.url!=='')return next();
   const json=(status:number,error:string)=>{if(res.destroyed)return;res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error}));};
   if(req.method!=='POST')return json(405,'请使用 POST 请求。');
   try{if(!req.headers.origin||new URL(req.headers.origin).host!==req.headers.host||req.headers['sec-fetch-site']==='cross-site')return json(403,'不允许跨站配音请求。');}catch{return json(403,'请求来源不正确。');}
   if(!req.headers['content-type']?.startsWith('application/json'))return json(415,'请使用 JSON 请求。');
   const chunks:Buffer[]=[];let size=0,oversize=false;
   req.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>65536){if(!oversize)json(413,'配音请求过大。');oversize=true;}else chunks.push(chunk);});
   req.on('end',()=>{
    if(oversize||res.destroyed)return;
    if(running>=2)return json(429,'正在准备其他配音，请稍后重试。');
    running++;
    const child=spawn(process.env.IDL_PYTHON||'python',['-m','shuku_backend.narration','--cache-dir',path.join(root,'.private','narration-cache')],{cwd:root,windowsHide:true,env:{...process.env,PYTHONUTF8:'1',PYTHONPATH:[path.join(root,'backend','src'),process.env.PYTHONPATH].filter(Boolean).join(path.delimiter)},stdio:['pipe','pipe','pipe']});
    const audio:Buffer[]=[],errors:Buffer[]=[];let bytes=0,settled=false;
    const timeout=setTimeout(()=>{child.kill();json(504,'配音准备超时，请重试。');},100000);
    const cleanup=()=>{if(settled)return;settled=true;running--;clearTimeout(timeout);};
    res.on('close',()=>{if(!res.writableEnded)child.kill();});
    child.stdout.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>20*1024*1024){child.kill();json(502,'配音音频过大，请缩短讲稿。');}else audio.push(chunk);});
    child.stderr.on('data',(chunk:Buffer)=>{if(errors.reduce((sum,b)=>sum+b.length,0)<8192)errors.push(chunk);});
    child.on('error',()=>{cleanup();json(503,'无法启动本地配音服务，请检查 Python 安装或 IDL_PYTHON 配置。');});
    child.on('close',code=>{
     cleanup();if(res.destroyed||res.writableEnded)return;
     if(code!==0){try{const error=JSON.parse(Buffer.concat(errors).toString('utf8'));return json(Number(error.status)||503,error.error||'配音失败，请重试。');}catch{return json(503,'本地配音服务启动失败，请检查 Python 配置。');}}
     const body=Buffer.concat(audio);if(!body.length)return json(502,'配音未返回音频。');
     res.statusCode=200;res.setHeader('Content-Type','audio/mpeg');res.setHeader('Content-Length',body.length);res.setHeader('Cache-Control','private, no-store');res.end(body);
    });
    child.stdin.on('error',()=>{});child.stdin.end(Buffer.concat(chunks));
   });
  });
 }};
}
