import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {modules,root} from './modules.mjs';

const args=process.argv.slice(2),selected=args[0]==='--module'?args[1]:undefined;
if(args.length&&(!selected||args.length!==2))throw Error('Usage: npm run build [-- --module module-id]');
const all=await modules(),courses=selected?all.filter(m=>m.outline.id===selected||m.name===selected):all.filter(m=>m.ready);
if(!courses.length||courses.some(m=>!m.ready))throw Error('Select an implemented module; outline-only drafts cannot be built.');
const stage=path.join(root,'work','build-'+crypto.randomUUID());await fs.mkdir(stage,{recursive:true});
const formats=JSON.parse(await fs.readFile(path.join(root,'modules/shared/react/asset-formats.json'),'utf8'));
const assetRoots=JSON.parse(await fs.readFile(path.join(root,'modules/shared/asset-index.json'),'utf8')).roots;
for(const m of all)if(m.outline.moduleIdentity?.id)assetRoots[m.outline.moduleIdentity.id]=path.relative(root,path.join(m.directory,'assets'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const safeOutput=file=>!(/\.(?:tsx?|jsx|map|vue|svelte|pyc)$/i.test(file)||file.split(/[\\/]/).some(p=>['_scratchpad','node_modules','.git','__pycache__'].includes(p)));
async function copyTree(from,to){
 const sourceRoot=path.resolve(from);
 if(![path.join(root,'modules')+path.sep,path.join(root,'assets')+path.sep].some(prefix=>sourceRoot.startsWith(prefix)))throw Error('Course assets leave the repository asset directories');
 let entries;try{entries=await fs.readdir(from,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}
 for(const item of entries){
  const source=path.join(from,item.name),dest=path.join(to,item.name);
  if(!safeOutput(source))continue;
  if(item.isSymbolicLink())throw Error('Artifact assets cannot contain symlinks: '+source);
  if(item.isDirectory())await copyTree(source,dest);
  else if(item.isFile()){await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(source,dest);}
 }
}
async function filesIn(directory){
 const result=[];
 for(const item of await fs.readdir(directory,{withFileTypes:true})){
  const name=path.join(directory,item.name);
  if(item.isDirectory())result.push(...await filesIn(name));else if(item.isFile())result.push(name);
 }
 return result.sort();
}
const catalog=[];
async function rename(from,to){
 for(let attempt=0;;attempt++){
  try{return await fs.rename(from,to);}catch(e){
   if(!['EPERM','EBUSY','EACCES'].includes(e.code)||attempt>=20)throw e;
   await new Promise(resolve=>setTimeout(resolve,250));
  }
 }
}
try{
 for(const module of courses){
  const outline=module.outline,assetId=outline.moduleIdentity.id;
  const target=courses.length===1?stage:path.join(stage,outline.id);
  const input=path.join(root,'work','input-'+crypto.randomUUID());await fs.mkdir(input,{recursive:true});
  const metadata={schema:1,kind:'idl-module',id:outline.id,asset_id:assetId,title:outline.title,description:outline.description||'',category:outline.badge||'',difficulty:outline.difficulty||'',pages:outline.pages,entry:'index.html',modes:[...(outline.entry?['guide']:[]),...(outline.ppt?.entry?['ppt']:[])]};
  const imports=[];
  for(const [name,entry] of [['guide',outline.entry],['presentation',outline.ppt?.entry]]){
   imports.push(entry?`import * as ${name} from ${JSON.stringify(path.join(module.directory,entry).replaceAll('\\','/'))};export {${name}};`:`export const ${name}=null;`);
  }
  const basename=outline.entry?path.basename(outline.entry,'.tsx'):'';
  const text=outline.entry?await fs.readFile(path.join(module.directory,outline.entry),'utf8'):'';
  const guideExport=text.includes(`function ${basename}`)||text.includes(`const ${basename}`)?basename:basename.charAt(0).toUpperCase()+basename.slice(1);
  imports.push(`export const metadata=${JSON.stringify(metadata)};export const guideExport=${JSON.stringify(guideExport)};`);
  const dependencyFiles=new Set();
  const frozenDocuments=module.name==='Creator-Guide'?JSON.parse(await fs.readFile(path.join(module.directory,'assets/creator-skill-documents.json'),'utf8')).documents:[];
  const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(outline.title)}</title><script>globalThis.__IDL_ASSET_BASE__=new URL('./assets',location.href).href;</script></head><body><div id="root"></div><script type="module" src="${path.join(root,'runtime/entry.tsx').replaceAll('\\','/')}"></script></body></html>`;
  await fs.writeFile(path.join(input,'index.html'),html);
  const plugin={name:'idl-fixed-course',resolveId(id){if(id==='virtual:idl-course')return '\0idl-course';if(id==='virtual:creator-skill-documents')return '\0idl-creator-documents';},load(id){if(id==='\0idl-course')return imports.join('\n');if(id==='\0idl-creator-documents')return 'export default '+JSON.stringify(frozenDocuments)+';';},
   transform(code,id){
    const file=id.split('?')[0];if(file.startsWith(path.join(root,'modules').replaceAll('\\','/'))||file.startsWith(path.join(root,'modules')))dependencyFiles.add(file);
    if(/\/modules\/(?!shared\/)[^/]+\/pages\/.*\.css$/.test(file.replaceAll('\\','/')))return {code:code.replace(/@media\s*\(\s*(max|min)-width\s*:\s*([^)]+)\)/g,(_,boundary,value)=>`@container lesson-slide (${boundary}-width: ${value.trim()})`),map:null};
   }};
  console.log(`Building ${outline.id} (${outline.pages.length} pages)`);
  await build({root:input,configFile:false,envFile:false,envPrefix:[],base:'./',publicDir:false,plugins:[plugin,react(),tailwind()],resolve:{dedupe:['react','react-dom','three']},
   define:{'import.meta.env.VITE_ASSET_BASE_URL':'globalThis.__IDL_ASSET_BASE__','import.meta.env.VITE_LLM_SERVICE_URL':JSON.stringify('/api/ai')},
   build:{outDir:target,emptyOutDir:false,sourcemap:false,assetsInlineLimit:0,chunkSizeWarningLimit:5000},logLevel:'warn'});
  const ids=new Set([assetId]);
  for(const file of dependencyFiles){
   if(file.endsWith('asset-formats.json')||file.endsWith('asset-index.json'))continue;
   try{for(const id of (await fs.readFile(file,'utf8')).match(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/gi)||[])if(assetRoots[id])ids.add(id);}catch{}
  }
  for(const id of ids)await copyTree(path.resolve(root,assetRoots[id]||'modules/'+module.name+'/assets'),path.join(target,'assets',id));
  for(const name of ['game','game_assets','runtime'])await copyTree(path.join(module.directory,name),path.join(target,name));
  let cover=outline.pages[0]?.id?`course-covers/${outline.pages[0].id}.jpg`:'';
  cover=formats[assetId+'/'+cover]||cover;
  try{await fs.access(path.join(target,'assets',assetId,cover));metadata.cover='assets/'+assetId+'/'+cover;}catch{metadata.cover=null;}
  await fs.writeFile(path.join(target,'course.json'),JSON.stringify(metadata,null,2));
  const records=[];
  for(const file of await filesIn(target)){
   if(!safeOutput(file))throw Error('Source file leaked into build: '+file);
   const bytes=await fs.readFile(file);records.push({path:path.relative(target,file).replaceAll('\\','/'),size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
  const revision=crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');
  await fs.writeFile(path.join(target,'artifact-manifest.json'),JSON.stringify({schema:1,kind:'idl-build',module_id:outline.id,revision,entry:'index.html',files:records},null,2));
  catalog.push({...metadata,revision,base:courses.length===1?'./':outline.id+'/',manifest:(courses.length===1?'':outline.id+'/')+'artifact-manifest.json'});
 }
 await fs.writeFile(path.join(stage,'catalog.json'),JSON.stringify({schema:1,kind:'idl-built-catalog',modules:catalog},null,2));
 if(courses.length>1)await fs.writeFile(path.join(stage,'index.html'),`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Intuitive Deep Learning</title><style>body{font:18px/1.7 system-ui;max-width:1000px;margin:60px auto;padding:24px}li{margin:16px 0}a{color:#245cdf}</style><h1>Intuitive Deep Learning</h1><p>课程构建产物 · ${catalog.length} modules</p><ul>${catalog.map(c=>`<li><a href="${c.base}index.html">${escape(c.title)}</a> · ${c.pages.length} 页</li>`).join('')}</ul>`);
 const dist=path.join(root,'dist'),previous=path.join(root,'work','previous-'+crypto.randomUUID());
 try{const stat=await fs.lstat(dist);if(stat.isSymbolicLink())throw Error('Refuse replacing a linked dist directory');await rename(dist,previous);}catch(e){if(e.code!=='ENOENT')throw e;}
 try{await rename(stage,dist);}catch(e){try{await rename(previous,dist);}catch{}throw e;}
 // Both targets are generated directories under this repository's work directory.
 if(!previous.startsWith(path.join(root,'work')+path.sep))throw Error('Unsafe generated output path');
 await fs.rm(previous,{recursive:true,force:true});
 console.log(`Built ${catalog.length} module(s) into dist. Preview serves only this directory.`);
}catch(error){console.error('Build failed; previous dist is unchanged. Scratch output: '+stage);throw error;}
