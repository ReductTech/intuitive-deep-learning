import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root=fileURLToPath(new URL('../',import.meta.url));
export async function modules(){
 const result=[];
 for(const item of await fs.readdir(path.join(root,'modules'),{withFileTypes:true})){
  if(!item.isDirectory()||item.name==='shared')continue;
  const directory=path.join(root,'modules',item.name),file=path.join(directory,'outlines.json');
  let outline;try{outline=JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,''));}catch(e){if(e.code==='ENOENT')continue;throw e;}
  outline.id ||= item.name;
  if(!/^[A-Za-z0-9_-]+$/.test(outline.id)||!Array.isArray(outline.pages))throw Error(`Invalid module outline: ${item.name}`);
  for(const entry of [outline.entry,outline.ppt?.entry].filter(Boolean)){
   const target=await fs.realpath(path.resolve(directory,entry));
   if(!target.startsWith(directory+path.sep))throw Error('Course entry leaves its module');
  }
  result.push({directory,name:item.name,outline,ready:Boolean(outline.entry||outline.ppt?.entry)});
 }
 if(new Set(result.map(m=>m.outline.id)).size!==result.length)throw Error('Duplicate module IDs');
 return result.sort((a,b)=>a.outline.id.localeCompare(b.outline.id));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 for(const m of await modules())console.log(`${m.ready?'ready':'draft'}\t${m.outline.id}\t${m.outline.pages.length} pages\t${m.outline.title}`);
}
