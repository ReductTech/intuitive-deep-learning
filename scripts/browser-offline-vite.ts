import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import type {Plugin} from 'vite';
// @ts-ignore existing Node authoring helper
import {offlineSource} from './offline-source.mjs';
// @ts-ignore Node export helper
import {pythonOfflineFiles,buildOfflinePythonWorker} from './python-offline-runtime.mjs';

/** Reuse Rollup's normal module graph: publish code/metadata, never prebuilt ZIPs. */
export function browserOffline(root:string,library:string):Plugin{
 const courses=fs.readdirSync(path.join(library,'modules'),{withFileTypes:true}).filter(d=>d.isDirectory()).flatMap(d=>{
  const file=path.join(library,'modules',d.name,'outlines.json');if(!fs.existsSync(file))return [];
  const outline=JSON.parse(fs.readFileSync(file,'utf8'));return outline.ppt?.entry&&(!process.env.IDL_OFFLINE_MODULES||process.env.IDL_OFFLINE_MODULES.split(',').includes(outline.id))?[{dir:d.name,...outline,id:outline.id||d.name}]:[];
 });
 const courseById=new Map(courses.map(c=>[c.id,c])),courseByDir=new Map(courses.map(c=>[c.dir,c]));
 const prefix='virtual:offline-course/';
 return {name:'browser-offline-courses',enforce:'pre',
  config(config,{command}){if(command!=='build')return;return {build:{rollupOptions:{preserveEntrySignatures:'strict',input:{...(config.build?.rollupOptions?.input as Record<string,string>||{}),...Object.fromEntries(courses.map(c=>['offline/'+c.id,prefix+c.id]))}}}};},
  resolveId(id){if(id.startsWith(prefix))return '\0'+id;},
  load(id){if(!id.startsWith('\0'+prefix))return;const c=courseById.get(id.slice(prefix.length+1))!;
   const file=(f:string)=>JSON.stringify(path.join(library,'modules',c.dir,f));
   return `import React from 'react';import {createRoot} from 'react-dom/client';import {RuntimePlayer} from ${JSON.stringify(path.join(root,'src/shuku/RuntimePlayer.tsx'))};import * as lesson from ${file(c.ppt.entry)};${c.entry?'import * as guide from '+file(c.entry)+';':''}import ${JSON.stringify(path.join(library,'modules/shared/react/styles.css'))};import ${JSON.stringify(path.join(library,'modules/shared/vendor/mathlive/mathlive-fonts.css'))};export function mount(project){const deck=lesson.deck;const getNotes=Reflect.get(lesson,"getPptNotes");for(const page of project.pages){if(!page.nativeId)continue;const scene=deck.scenes.find(s=>s.id===page.nativeId);if(!scene)throw Error('课件已经更新，请刷新后再下载：'+page.nativeId);page.title=scene.title;page.outline={...page.outline,section:scene.section,snippet:getNotes?.(page.nativeId)?.map(n=>n.text).join(${JSON.stringify('\n')})||page.outline?.snippet||''};}globalThis.__SHUKU_OFFLINE_PROJECT__=project;const Guide=${c.entry?'guide['+JSON.stringify(c.entry.replace(/\.[jt]sx?$/,''))+']||Reflect.get(guide,"default")':'null'};createRoot(document.getElementById('root')).render(globalThis.__SHUKU_OFFLINE_EMBED_QUERY__&&Guide?React.createElement(Guide):React.createElement(RuntimePlayer,{project,deck,notes:getNotes,assetId:${JSON.stringify(c.moduleIdentity?.id||c.id)}}));}`;
  },
  transform(code,id){
   if(id.includes('/modules/')&&/\.[jt]sx?$/.test(id)&&code.includes('<iframe')){
    // Same module remains usable online; switch to self-contained frames only offline.
    const transformed=offlineSource(code,id,{conditional:true});
    return transformed;
   }
   if(id.includes('/modules/')&&/\.[jt]sx?$/.test(id)&&code.includes('window.location.search'))return code.replaceAll('window.location.search',"((globalThis as any).__SHUKU_OFFLINE_EMBED_QUERY__||window.location.search)");
   if(id.endsWith('/mathlive.min.mjs'))return code.replaceAll('this.targetOrigin=window.origin','this.targetOrigin=window.origin==="null"?"*":window.origin').replace('se._fontsDirectory="./fonts/"','se._fontsDirectory=globalThis.__SHUKU_OFFLINE__?null:"./fonts/"');
  },
  generateBundle:{order:'post',async handler(_options,bundle){
   const catalog:Record<string,unknown>={};const all=new Set<string>();
   let pythonEmitted=false;
   const entries=new Map(Object.values(bundle).filter(b=>b.type==='chunk').map(b=>[b.type==='chunk'?b.facadeModuleId:'',b]));
   const assetsByBase=new Map(Object.values(bundle).filter(b=>b.type==='asset').map(b=>[path.posix.basename(b.fileName),b.fileName]));
   for(const c of courses){const entry=entries.get('\0'+prefix+c.id);if(!entry||entry.type!=='chunk')continue;
    const hints=new Set<string>(),assetPatterns:string[][]=[],scanned=new Set<string>();
    const files=new Set<string>(),namespaces=new Set<string>([c.moduleIdentity?.id||c.id,'shared']);
    function visit(name:string){if(files.has(name)||!bundle[name])return;files.add(name);const b=bundle[name];if(b.type==='asset'){if(name.endsWith('.css'))for(const m of String(b.source).matchAll(/url\(["']?([^"')]+)["']?\)/g)){const target=path.posix.normalize(path.posix.join(path.posix.dirname(name),m[1]));if(bundle[target])visit(target);}return;}
     for(const match of b.code.matchAll(/[A-Za-z0-9_.-]+\.(?:js|css|woff2?|ttf|otf)/g)){const asset=assetsByBase.get(match[0]);if(asset)visit(asset);}
     for(const module of Object.keys(b.modules)){
      const dir=module.replaceAll('\\','/').match(/\/modules\/([^/]+)\//)?.[1],other=courseByDir.get(dir||'');if(other)namespaces.add(other.moduleIdentity?.id||other.id);
      if(scanned.has(module)||!module.replaceAll('\\','/').includes('/modules/')||module.replaceAll('\\','/').includes('/modules/shared/'))continue;scanned.add(module);
      const source=fs.existsSync(module.split('?')[0])?fs.readFileSync(module.split('?')[0],'utf8'):'';
      const ast=ts.createSourceFile(module,source,ts.ScriptTarget.Latest,true);
      function collect(node:ts.Node){if(ts.isStringLiteralLike(node)&&/\.(png|jpe?g|webp|svg|gif|mp4|webm|mp3|wav|json)$/i.test(node.text))hints.add(node.text);
       if(ts.isTemplateExpression(node)&&node.head.text.includes('/'))assetPatterns.push([node.head.text,node.templateSpans.at(-1)!.literal.text]);ts.forEachChild(node,collect);
      }collect(ast);
     }
     for(const dependency of [...b.imports,...b.dynamicImports,...((b as any).viteMetadata?.importedCss||[]),...((b as any).viteMetadata?.importedAssets||[])])visit(dependency);
    }visit(entry.fileName);
    const usesPython=[...scanned].some(file=>file.replaceAll('\\','/').endsWith('/CodePracticePage/pythonRuntime.ts'));
    let pythonRuntime;
    if(usesPython){
     const runtime=pythonOfflineFiles(root),worker='offline-runtime/python/worker.js';
     pythonRuntime={version:runtime.version,files:Object.keys(runtime.files),worker};
     if(!pythonEmitted){this.emitFile({type:'asset',fileName:worker,source:await buildOfflinePythonWorker(root)});all.add(worker);pythonEmitted=true;}
    }
    files.forEach(f=>all.add(f));const descriptor={entry:entry.fileName,files:[...files],modules:[...files].filter(f=>bundle[f]?.type==='chunk'),namespaces:[...namespaces],assetHints:[...hints],assetPatterns,...(pythonRuntime?{pythonRuntime}:{})};
    const name='offline-runtime/courses/'+encodeURIComponent(c.id)+'.json';this.emitFile({type:'asset',fileName:name,source:JSON.stringify(descriptor)});all.add(name);catalog[c.id]={descriptor:name};
   }
   this.emitFile({type:'asset',fileName:'offline-runtime/esbuild.wasm',source:fs.readFileSync(path.join(root,'node_modules/esbuild-wasm/esbuild.wasm'))});
   this.emitFile({type:'asset',fileName:'offline-runtime/catalog.json',source:JSON.stringify({schema:1,courses:catalog,files:[...all]})});
  }},
 };
}

