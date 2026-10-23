import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const args=Object.fromEntries(process.argv.slice(2).reduce((out,arg,i,all)=>{if(i%2===0)out.push([arg.replace(/^--/,''),all[i+1]]);return out;},[]));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const moduleDir=path.resolve(args.module),outdir=path.resolve(args.outdir);
if(!moduleDir.startsWith(path.join(root,'modules')+path.sep)||!/^[-a-f0-9]{36}$/.test(args.revision))throw Error('Invalid build context');
const outline=JSON.parse(await fs.readFile(path.join(moduleDir,'outlines.json'),'utf8'));
const project=JSON.parse(await fs.readFile(args.project,'utf8'));
if(project.courseId!==(outline.id||path.basename(moduleDir)))throw Error('Module identity mismatch');
const base='/api/shuku/revisions/'+args.revision+'/files/';
const native=project.pages.some(p=>p.nativeId);
const entry=path.resolve(moduleDir,outline.ppt.entry);
if(!entry.startsWith(moduleDir+path.sep))throw Error('Invalid module entry');
const publicProject={version:1,id:args.revision,courseId:project.courseId,title:project.title,duration:project.duration,style:project.style,outlineConfirmed:true,pages:project.pages.map(p=>({id:p.id,nativeId:p.nativeId,format:p.format,title:p.title,goal:p.goal,summary:p.summary,note:'',ready:true,designed:true,revisions:[],messages:[]}))};
const source=`import React from 'react';import {createRoot} from 'react-dom/client';import {RuntimePlayer} from ${JSON.stringify(path.join(root,'src/shuku/RuntimePlayer.tsx'))};import ${JSON.stringify(path.join(root,'modules/shared/react/styles.css'))};${native?'import {deck} from '+JSON.stringify(entry)+';':''}const project=${JSON.stringify(publicProject)};createRoot(document.getElementById('root')).render(React.createElement(RuntimePlayer,{project${native?',deck':''}}));`;
const urlAssets={name:'url-assets',setup(context){context.onResolve({filter:/\?url$/},args=>({path:path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:'shuku-url'}));context.onLoad({filter:/.*/,namespace:'shuku-url'},async args=>({contents:await fs.readFile(args.path),loader:'file'}));}};
const pageCanvas={name:'fixed-course-canvas',setup(context){context.onLoad({filter:/\.css$/},async args=>{if(!/\/modules\/(?!shared\/)[^/]+\/pages\/.*\.css$/.test(args.path.replaceAll('\\','/')))return;const source=await fs.readFile(args.path,'utf8');const contents=source.replace(/@media\s*\(\s*(max|min)-width\s*:\s*([^)]+)\)/g,(_,edge,value)=>'@container lesson-slide ('+edge+'-width: '+value.trim()+')');if(/@media[^{}]*\b(?:width|height|orientation|aspect-ratio)\b/.test(contents))throw Error('Unsupported viewport rule in course page');return {contents,loader:'css',resolveDir:path.dirname(args.path)};});}};
await build({plugins:[urlAssets,pageCanvas],resolveExtensions:['.tsx','.ts','.jsx','.js','.json'],stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',platform:'browser',target:'es2022',outdir,entryNames:'bundle',assetNames:'static/[hash]',loader:{'.woff':'file','.woff2':'file','.ttf':'file','.otf':'file'},define:{'process.env.NODE_ENV':'"production"','import.meta.env':JSON.stringify({BASE_URL:base+'assets/',VITE_ASSET_BASE_URL:base+'assets/',DEV:false,PROD:true})},logLevel:'silent'});
async function copyTree(from,to){
 for(const item of await fs.readdir(from,{withFileTypes:true})){
  if(item.isSymbolicLink())throw Error('Symlink in course assets');
  const source=path.join(from,item.name),target=path.join(to,item.name);
  if(item.isDirectory()){await fs.mkdir(target,{recursive:true});await copyTree(source,target);}
  else if(item.isFile()){await fs.mkdir(to,{recursive:true});await fs.copyFile(source,target);}
 }
}
if(native){const assets=path.join(root,'assets',outline.moduleIdentity.id);try{await copyTree(assets,path.join(outdir,'assets',outline.moduleIdentity.id));}catch(e){if(e.code!=='ENOENT')throw e;}}
if(native){
 const {compile}=await import('@tailwindcss/node');const {Scanner}=await import('@tailwindcss/oxide');
 const template=await fs.readFile(path.join(moduleDir,'tailwind.css'),'utf8').catch(()=> '@import "tailwindcss/theme.css" layer(theme);@import "tailwindcss/utilities.css" layer(utilities) source(none);');
 const compiler=await compile(template,{base:moduleDir,onDependency:()=>{}});
 const scanner=new Scanner({sources:[...compiler.sources,{base:moduleDir,pattern:'**/*.{ts,tsx}',negated:false},{base:path.join(root,'modules/shared'),pattern:'**/*.{ts,tsx}',negated:false}]});
 await fs.writeFile(path.join(outdir,'utilities.css'),compiler.build(scanner.scan()));
}
const css=await fs.stat(path.join(outdir,'bundle.css')).then(()=>true,()=>false);
const title=project.title.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await fs.writeFile(path.join(outdir,'index.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${native?'<link rel="stylesheet" href="'+base+'utilities.css">':''}${css?'<link rel="stylesheet" href="'+base+'bundle.css">':''}</head><body><div id="root"></div><script type="module" src="${base}bundle.js"></script></body></html>`);
