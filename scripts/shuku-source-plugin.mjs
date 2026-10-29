import path from 'node:path';
import fs from 'node:fs/promises';

// Source files are resolved from this map, never from the host filesystem.
export function sourcePlugin(files,root,{courseRoot=root,assetId='',sharedRoot=path.join(courseRoot,'modules/shared')}={}){
 const dependencies=new Set(['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom','react-dom/client','lucide-react','three','@icon-park/react']);
 const media=new Set(['png','jpg','jpeg','webp','gif','avif','woff','woff2','ttf','otf','mp3','wav','mp4','webm','glb','gltf','bin']);
 const shared=sharedRoot;
 async function sharedImport(name,build,args){
  if(!/^react(?:\/[A-Za-z0-9_-]+)*(?:\.(?:css|tsx?|jsx?))?$/.test(name))throw Error('Unsupported shared component');
  return build.resolve('./'+name,{resolveDir:shared,kind:args.kind});
 }
 return {name:'managed-course-source',setup(build){
  build.onResolve({filter:/^shuku-source:/},args=>({path:args.path.slice(13),namespace:'course-source'}));
  build.onResolve({filter:/.*/,namespace:'course-source'},async args=>{
   if(args.kind==='url-token'&&(/^#[A-Za-z0-9_-]+$/.test(args.path)||/^data:(?:image|font)\/[A-Za-z0-9.+-]+[;,]/.test(args.path)))return {path:args.path,external:true};
   if(args.path.startsWith('@shared/vendor/')&&args.path.endsWith('?url')){
    const name=args.path.slice(8,-4);
    if(!/^vendor\/[A-Za-z0-9_./-]+$/.test(name)||name.split('/').includes('..'))throw Error('Unsafe framework resource');
    const absolute=await fs.realpath(path.join(shared,name)),vendor=await fs.realpath(path.join(shared,'vendor'));
    if(!absolute.startsWith(vendor+path.sep))throw Error('Framework resource leaves vendor directory');
    return {path:absolute,namespace:'framework-url'};
   }
   if(args.path==='virtual:creator-skill-documents')return build.resolve(args.path,{resolveDir:root,kind:args.kind});
   if(dependencies.has(args.path))return build.resolve(args.path,{resolveDir:root,kind:args.kind,pluginData:{trusted:true}});
   if(/^three\/(?:examples\/jsm|addons)\/[A-Za-z0-9_./-]+\.js$/.test(args.path)&&!args.path.split('/').includes('..'))return build.resolve(args.path,{resolveDir:root,kind:args.kind});
   if(args.path==='@shared/react'||args.path.startsWith('@shared/react/'))return sharedImport(args.path.slice(8),build,args);
   if(!args.path.startsWith('.'))throw Error('Unsupported course dependency: '+args.path);
   const [relative,query]=args.path.split('?');
   if(query&&!['raw','url'].includes(query))throw Error('Unsupported source import query');
   const name=path.posix.normalize(path.posix.join(path.posix.dirname(args.importer),relative));
   if(name.startsWith('../')||name.startsWith('/'))throw Error('Course import escapes its source directory');
   if(name==='modules/shared/react'||name.startsWith('modules/shared/react/'))return sharedImport(name.slice(15),build,args);
   const target=[name,...['.tsx','.ts','.jsx','.js','.json','.css','.svg','/index.tsx','/index.ts','/index.jsx','/index.js'].map(ext=>name+ext)].find(name=>Object.hasOwn(files,name));
   if(!target&&assetId&&name.startsWith('assets/'+assetId+'/')){
    const absolute=await fs.realpath(path.join(courseRoot,name));const allowed=await fs.realpath(path.join(courseRoot,'assets',assetId));
    if(!absolute.startsWith(allowed+path.sep)||!media.has(path.extname(name).slice(1).toLowerCase()))throw Error('Unsupported frozen asset');
    return {path:absolute,namespace:'frozen-course-asset'};
   }
   if(!target)throw Error('Missing course source file: '+name);
   return {path:target,namespace:query==='raw'?'course-raw':query==='url'?'course-url':'course-source'};
  });
  build.onLoad({filter:/.*/,namespace:'course-source'},args=>{
   if(!Object.hasOwn(files,args.path))throw Error('Missing source entry');
   const ext=path.posix.extname(args.path).slice(1).toLowerCase();
   let value=files[args.path];
   if(media.has(ext)){
    if(!/^data:[^;,]+;base64,[A-Za-z0-9+/=]+$/.test(value))throw Error('Invalid embedded asset');
    return {contents:Buffer.from(value.slice(value.indexOf(',')+1),'base64'),loader:'dataurl'};
   }
   if(['tsx','ts','jsx','js'].includes(ext)){
    const imports=[];let index=0;
    value=value.replace(/new URL\(\s*(['"])([^'"]+)\1\s*,\s*import\.meta\.url\s*\)\.href/g,(_,quote,name)=>{
     if(!name.startsWith('.')&&!name.startsWith('@shared/vendor/'))throw Error('Unsupported module resource URL');
     const symbol='__shukuResource'+index++;imports.push('import '+symbol+' from '+JSON.stringify(name+'?url')+';');return symbol;
    });
    if(value.includes('import.meta.url'))throw Error('Module URLs must use a static resource path and .href');
    // Resolve eager page registries only from submitted files, never disk globs.
    value=value.replace(/import\.meta\.glob\(\s*(['"])([^'"]+)\1\s*,\s*\{\s*eager\s*:\s*true\s*\}\s*\)/g,(_,quote,glob)=>{
     if(!glob.startsWith('./')||glob.split('/').includes('..'))throw Error('Course glob must stay inside its source directory');
     let expression='^';
     for(let i=0;i<glob.length;i++){
      if(glob.slice(i,i+3)==='**/'){expression+='(?:.*/)?';i+=2;}
      else if(glob[i]==='*')expression+='[^/]*';
      else if(glob[i]==='?')expression+='[^/]';
      else if(glob.slice(i,i+5)==='[0-9]'){expression+='[0-9]';i+=4;}
      else expression+=glob[i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
     }
     const matches=new RegExp(expression+'$'),entries=[];
     for(const file of Object.keys(files).sort()){
      const relative='./'+path.posix.relative(path.posix.dirname(args.path),file);
      if(!matches.test(relative))continue;
      const symbol='__shukuResource'+index++;imports.push('import * as '+symbol+' from '+JSON.stringify(relative)+';');entries.push(JSON.stringify(relative)+':'+symbol);
     }
     return '({'+entries.join(',')+'})';
    });
    if(value.includes('import.meta.glob'))throw Error('Only static eager course globs are supported');
    value=imports.join('\n')+'\n'+value;
   }
   if(ext==='css'&&/^modules\/[^/]+\/pages\/.*\.css$/i.test(args.path)){
    value=value.replace(/@media\s*\(\s*(max|min)-width\s*:\s*([^)]+)\)/g,(_,boundary,width)=>'@container lesson-slide ('+boundary+'-width: '+width.trim()+')');
    if(/@media[^{}]*\b(?:width|height|orientation|aspect-ratio)\b/.test(value))throw Error('Fixed lesson canvas cannot use viewport breakpoints');
   }
   return {contents:ext==='css'?value.replace(/@import\s+["']tailwindcss(?:\/[^"']*)?["'][^;]*;/g,''):value,loader:ext==='svg'?'dataurl':['md','txt'].includes(ext)?'text':ext,resolveDir:root};
  });
  build.onLoad({filter:/.*/,namespace:'course-raw'},args=>({contents:files[args.path],loader:'text'}));
  build.onLoad({filter:/.*/,namespace:'course-url'},args=>({contents:files[args.path].startsWith('data:')?Buffer.from(files[args.path].split(',')[1],'base64'):files[args.path],loader:'dataurl'}));
  build.onLoad({filter:/.*/,namespace:'framework-url'},async args=>({contents:await fs.readFile(args.path),loader:'dataurl'}));
  build.onLoad({filter:/.*/,namespace:'frozen-course-asset'},async args=>({contents:await fs.readFile(args.path),loader:'dataurl'}));
 }};
}
