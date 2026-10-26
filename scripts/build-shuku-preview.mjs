import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import {sourcePlugin} from './shuku-source-plugin.mjs';
const args=Object.fromEntries(process.argv.slice(2).reduce((out,arg,i,all)=>{if(i%2===0)out.push([arg.replace(/^--/,''),all[i+1]]);return out;},[]));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const courseRoot=args['course-root']?path.resolve(args['course-root']):root;
const moduleDir=args.module?path.resolve(args.module):null,outdir=path.resolve(args.outdir);
if((moduleDir&&!moduleDir.startsWith(path.join(courseRoot,'modules')+path.sep))||!/^[-a-f0-9]{36}$/.test(args.revision))throw Error('Invalid build context');
const outline=moduleDir?JSON.parse(await fs.readFile(path.join(moduleDir,'outlines.json'),'utf8')):null;
const project=JSON.parse(await fs.readFile(args.project,'utf8'));
if(outline&&project.courseId!==(outline.id||path.basename(moduleDir)))throw Error('Module identity mismatch');
const base='/api/shuku/revisions/'+args.revision+(args.player?'/player/files/':'/files/');
const native=project.pages.some(p=>p.nativeId);
const managed=Boolean(project.source);
const reactPages=project.pages.filter(p=>p.format==='react');
const imports=reactPages.map((p,i)=>'import SourcePage'+i+' from '+JSON.stringify('shuku-source:'+p.sourceEntry)+';').join('');
const scenes=reactPages.map((p,i)=>'{id:'+JSON.stringify(p.id)+',title:'+JSON.stringify(p.title)+',render:()=>React.createElement(SourcePage'+i+')}').join(',');
const entry=moduleDir?path.resolve(moduleDir,outline.ppt.entry):null;
if(entry&&!entry.startsWith(moduleDir+path.sep))throw Error('Invalid module entry');
const guideEntry=native&&outline?.entry?path.resolve(moduleDir,outline.entry):null;
if(guideEntry&&!guideEntry.startsWith(moduleDir+path.sep))throw Error('Invalid guide entry');
const guideName=outline?.entry?.replace(/\.tsx?$/,'');
const publicProject={version:1,id:args.revision,courseId:project.courseId,title:project.title,duration:project.duration,style:project.style,outlineConfirmed:true,pages:project.pages.map(p=>({id:p.id,nativeId:p.nativeId,format:p.format,title:p.title,goal:p.goal,summary:p.summary,note:'',ready:true,designed:true,revisions:[],messages:[]}))};
const source=`import React from 'react';import {createRoot} from 'react-dom/client';import {RuntimePlayer} from ${JSON.stringify(path.join(root,'src/shuku/RuntimePlayer.tsx'))};import ${JSON.stringify(path.join(courseRoot,'modules/shared/react/styles.css'))};${native?'import * as nativeModule from '+JSON.stringify(entry)+';const nativeDeck=nativeModule.deck;':''}${guideEntry?'import * as guideModule from '+JSON.stringify(guideEntry)+';':''}${imports}const Guide=guideModuleValue();function guideModuleValue(){return ${guideEntry?'guideModule['+JSON.stringify(guideName)+']||guideModule['+JSON.stringify(guideName[0].toUpperCase()+guideName.slice(1))+']||guideModule.default':'null'};}const deck={scenes:[${native?'...nativeDeck.scenes,':''}${scenes}]};const project=${JSON.stringify(publicProject)};createRoot(document.getElementById('root')).render(React.createElement(RuntimePlayer,{project,guide:Guide?React.createElement(Guide):undefined,notes:${native?'nativeModule.getPptNotes':'undefined'},assetId:${JSON.stringify(outline?.moduleIdentity?.id||'')}${native||managed?',deck':''}}));`;
const urlAssets={name:'url-assets',setup(context){context.onResolve({filter:/\?raw$/,namespace:'file'},async args=>{const file=await fs.realpath(path.resolve(args.resolveDir,args.path.slice(0,-4)));const relative=path.relative(courseRoot,file);if(relative.startsWith('..')||path.isAbsolute(relative)||!['modules','assets','creator-skill'].includes(relative.split(path.sep)[0]))throw Error('Raw resource leaves the course snapshot');return {path:file,namespace:'shuku-raw'};});context.onLoad({filter:/.*/,namespace:'shuku-raw'},async args=>({contents:await fs.readFile(args.path,'utf8'),loader:'text'}));context.onResolve({filter:/\?url$/},args=>({path:path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:'shuku-url'}));context.onLoad({filter:/.*/,namespace:'shuku-url'},async args=>({contents:await fs.readFile(args.path),loader:'file'}));}};
const courseDocuments={name:'course-creator-documents',setup(context){context.onResolve({filter:/^virtual:creator-skill-documents$/},()=>({path:'documents',namespace:'course-documents'}));context.onLoad({filter:/.*/,namespace:'course-documents'},async()=>{const folder=path.join(courseRoot,'creator-skill');async function read(dir){const result=[];for(const item of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())result.push(...await read(file));else if(item.name.endsWith('.md'))result.push({path:path.relative(folder,file).replaceAll('\\','/'),content:await fs.readFile(file,'utf8')});}return result;}return {contents:'export default '+JSON.stringify(await read(folder)),loader:'js'};});}};
// Expand trusted native eager globs during compilation; managed source maps
// never enter the filesystem namespace and cannot use this loader to read files.
const nativeGlobs={name:'native-eager-globs',setup(context){context.onLoad({filter:/\.[jt]sx?$/,namespace:'file'},async args=>{
 const relative=path.relative(path.join(courseRoot,'modules'),args.path);
 if(relative.startsWith('..')||path.isAbsolute(relative))return;
 const text=await fs.readFile(args.path,'utf8');if(!text.includes('import.meta.glob'))return;
 const pattern=/import\.meta\.glob\(\s*(['"])([^'"]+)\1\s*,\s*\{\s*eager\s*:\s*true\s*\}\s*\)/g;
 let output='',cursor=0,index=0;const imports=[];
 for(const match of text.matchAll(pattern)){
  if(!match[2].startsWith('./')||match[2].split('/').includes('..'))throw Error('Native glob must stay inside its course directory');
  const files=[];for await(const file of fs.glob(match[2],{cwd:path.dirname(args.path)}))files.push(file);
  const entries=[];
  for(const file of files.sort()){
   const absolute=await fs.realpath(path.resolve(path.dirname(args.path),file));const inside=path.relative(path.join(courseRoot,'modules'),absolute);
   if(inside.startsWith('..')||path.isAbsolute(inside))throw Error('Native glob leaves the source snapshot');
   const symbol='__shukuNativeGlob'+index++;const key='./'+path.relative(path.dirname(args.path),absolute).replaceAll('\\','/');
   imports.push('import * as '+symbol+' from '+JSON.stringify(absolute)+';');entries.push(JSON.stringify(key)+':'+symbol);
  }
  output+=text.slice(cursor,match.index)+'({'+entries.join(',')+'})';cursor=match.index+match[0].length;
 }
 output+=text.slice(cursor);if(output.includes('import.meta.glob'))throw Error('Only static eager native globs are supported');
 return {contents:imports.join('\n')+'\n'+output,loader:path.extname(args.path).slice(1),resolveDir:path.dirname(args.path)};
});}};
// Host adapters must use the same shared contexts as the frozen course scenes.
const sharedRuntime={name:'frozen-shared-runtime',setup(context){context.onResolve({filter:/^\.\.?\//},async args=>{
 if(!native||args.namespace!=='file')return;
 const absolute=path.resolve(args.resolveDir,args.path),shared=path.join(root,'modules/shared')+path.sep;
 if(!absolute.startsWith(shared)||courseRoot===root)return;
 const mapped=path.join(courseRoot,'modules/shared',absolute.slice(shared.length));
 for(const candidate of [mapped,mapped+'.tsx',mapped+'.ts',mapped+'.js',path.join(mapped,'index.ts')])if(await fs.stat(candidate).then(s=>s.isFile(),()=>false))return {path:candidate};
 throw Error('Shared runtime missing from frozen snapshot');
});}};
await build({plugins:[...(managed?[sourcePlugin(project.source.files,root)]:[]),sharedRuntime,urlAssets,nativeGlobs,courseDocuments],nodePaths:[path.join(root,'node_modules')],resolveExtensions:['.tsx','.ts','.jsx','.js','.json'],stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',format:managed?'iife':'esm',platform:'browser',target:'es2022',outdir,entryNames:'bundle',assetNames:'static/[hash]',loader:{...Object.fromEntries(['.svg','.png','.jpg','.jpeg','.webp','.gif','.avif','.mp4','.webm','.mp3','.wav'].map(ext=>[ext,managed?'dataurl':'file'])),'.woff':managed?'dataurl':'file','.woff2':managed?'dataurl':'file','.ttf':managed?'dataurl':'file','.otf':managed?'dataurl':'file'},define:{'process.env.NODE_ENV':'"production"','import.meta.env':JSON.stringify({BASE_URL:base+'assets/',VITE_ASSET_BASE_URL:base+'assets/',DEV:false,PROD:true})},logLevel:'silent'});
async function copyTree(from,to){
 for(const item of await fs.readdir(from,{withFileTypes:true})){
  if(item.isSymbolicLink())throw Error('Symlink in course assets');
  const source=path.join(from,item.name),target=path.join(to,item.name);
  if(item.isDirectory()){await fs.mkdir(target,{recursive:true});await copyTree(source,target);}
  else if(item.isFile()){await fs.mkdir(to,{recursive:true});await fs.copyFile(source,target);}
 }
}
if(native){const assets=path.join(courseRoot,'assets',outline.moduleIdentity.id);try{await copyTree(assets,path.join(outdir,'assets',outline.moduleIdentity.id));}catch(e){if(e.code!=='ENOENT')throw e;}}
if(native){
 const {compile}=await import('@tailwindcss/node');const {Scanner}=await import('@tailwindcss/oxide');
 const template=await fs.readFile(path.join(moduleDir,'tailwind.css'),'utf8').catch(()=> '@import "tailwindcss/theme.css" layer(theme);@import "tailwindcss/utilities.css" layer(utilities) source(none);');
 const resolvedTemplate=template.replace(/(["'])tailwindcss\//g,(_,quote)=>quote+path.join(root,'node_modules/tailwindcss/').replaceAll('\\','/'));
 const compiler=await compile(resolvedTemplate,{base:moduleDir,onDependency:()=>{}});
 const scanner=new Scanner({sources:[...compiler.sources,{base:moduleDir,pattern:'**/*.{ts,tsx}',negated:false},{base:path.join(courseRoot,'modules/shared'),pattern:'**/*.{ts,tsx}',negated:false}]});
 await fs.writeFile(path.join(outdir,'utilities.css'),compiler.build(scanner.scan()));
}
if(managed){
 const escape=text=>text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const javascript=(await fs.readFile(path.join(outdir,'bundle.js'),'utf8')).replace(/<\/script/gi,'<\\/script');
 const styles=await fs.readFile(path.join(outdir,'bundle.css'),'utf8').catch(()=>'');
 const utilities=await fs.readFile(path.join(outdir,'utilities.css'),'utf8').catch(()=>'');
 const title=escape(project.title);
 const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${(utilities+styles).replace(/<\/style/gi,'<\\/style')}</style></head><body><div id="root"></div><script>${javascript}</script></body></html>`;
 await fs.writeFile(path.join(outdir,'index.html'),html);
 process.exit(0);
}
const css=await fs.stat(path.join(outdir,'bundle.css')).then(()=>true,()=>false);
const title=project.title.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await fs.writeFile(path.join(outdir,'index.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${native?'<link rel="stylesheet" href="'+base+'utilities.css">':''}${css?'<link rel="stylesheet" href="'+base+'bundle.css">':''}</head><body><div id="root"></div><script type="module" src="${base}bundle.js"></script></body></html>`);
