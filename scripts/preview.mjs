import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './modules.mjs';
const directory=path.join(root,'dist'),args=process.argv.slice(2);
const port=Number(args.includes('--port')?args[args.indexOf('--port')+1]:5180);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid preview port');
await fs.access(path.join(directory,'index.html'));
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.mp4':'video/mp4','.mp3':'audio/mpeg','.pdf':'application/pdf'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');let name=decodeURIComponent(url.pathname);
  if(name.endsWith('/'))name+='index.html';
  const file=await fs.realpath(path.resolve(directory,'.'+name));
  if(!file.startsWith(directory+path.sep)||/\.(?:tsx?|jsx|map|vue|svelte)$/i.test(file))throw Error('Not a built artifact');
  const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(body);
 }catch{res.writeHead(404);res.end('Built artifact not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Built artifacts only: http://127.0.0.1:${port}`));
