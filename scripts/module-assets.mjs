import fs from 'node:fs';
import path from 'node:path';

/** Local ownership changes; the public OSS namespace remains UUID/relative-path. */
export function assetRoots(root) {
 const file=path.join(root,'modules/shared/asset-index.json');
 const roots=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')).roots:{};
 const modules=path.join(root,'modules');
 for(const item of fs.readdirSync(modules,{withFileTypes:true})) {
  const outline=path.join(modules,item.name,'outlines.json');
  if(!item.isDirectory()||!fs.existsSync(outline))continue;
  const id=JSON.parse(fs.readFileSync(outline,'utf8')).moduleIdentity?.id;
  if(id){const current='modules/'+item.name+'/assets';roots[id]=!fs.existsSync(path.join(root,current))&&fs.existsSync(path.join(root,'assets',id))?'assets/'+id:current;}
 }
 return roots;
}

export function assetDirectory(root,id) {
 const relative=assetRoots(root)[id];
 return relative?path.join(root,relative):path.join(root,'assets',id);
}

export function localModuleAssets(root) {
 return {name:'module-owned-assets',configureServer(server) {
  let roots=assetRoots(root);
  server.watcher.on('all',(_event,file)=>{
   if(file.endsWith('outlines.json')||file.endsWith('asset-index.json'))roots=assetRoots(root);
  });
  server.middlewares.use((req,res,next)=>{
   let parts;
   try { parts=decodeURIComponent((req.url||'').split('?')[0]).replace(/^\/(?:assets\/)?/,'').split('/'); }
   catch {res.statusCode=400;res.end();return;}
   const id=parts.shift();
   if(!id||!Object.hasOwn(roots,id)||!parts.length)return next();
   const directory=path.resolve(root,roots[id]),file=path.resolve(directory,...parts);
   if(!file.startsWith(directory+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return next();
   if(!fs.realpathSync(file).startsWith(fs.realpathSync(directory)+path.sep)){res.statusCode=403;res.end();return;}
   req.url='/@fs/'+file.replaceAll('\\','/');next();
  });
 }};
}
