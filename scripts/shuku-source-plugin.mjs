import {createHash} from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import {assetDirectory} from './module-assets.mjs';

// Source files are resolved from this map, never from the host filesystem.
export function sourcePlugin(files,root,{courseRoot=root,assetId='',sharedRoot=path.join(courseRoot,'modules/shared'),assets={},assetRoot}={}){
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
   if(Object.hasOwn(assets,name)){if(query&&query!=='url')throw Error('Binary assets accept only URL imports');return {path:name,namespace:'course-binary'};}
    const target=[name,...['.tsx','.ts','.jsx','.js','.json','.css','.svg','/index.tsx','/index.ts','/index.jsx','/index.js'].map(ext=>name+ext)].find(name=>Object.hasOwn(files,name));
   const frozenRelative=name.startsWith('assets/'+assetId+'/')?name.slice(('assets/'+assetId+'/').length):/^modules\/[^/]+\/assets\/(.+)$/.exec(name)?.[1];
   if(!target&&assetId&&frozenRelative){
    const allowed=await fs.realpath(assetDirectory(courseRoot,assetId));const absolute=await fs.realpath(path.join(allowed,frozenRelative));
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
    const ast=ts.createSourceFile(args.path,value,ts.ScriptTarget.Latest,true,ext.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    const replacements=[];
    const globProperty=node=>ts.isPropertyAccessExpression(node)&&ts.isMetaProperty(node.expression)&&node.expression.keywordToken===ts.SyntaxKind.ImportKeyword&&node.name.text==='glob';
    function visit(node){
     if(globProperty(node)&&(!ts.isCallExpression(node.parent)||node.parent.expression!==node))throw Error('Only static eager course globs are supported');
     if(ts.isElementAccessExpression(node)&&ts.isMetaProperty(node.expression))throw Error('Computed module metadata is unsupported');
     if(ts.isCallExpression(node)&&globProperty(node.expression)){
      const [pattern,options]=node.arguments;
      if(!pattern||!ts.isStringLiteralLike(pattern)||!options||!ts.isObjectLiteralExpression(options))throw Error('Only static eager course globs are supported');
      const opts=Object.fromEntries(options.properties.map(p=>{if(!ts.isPropertyAssignment(p)||!p.name||!ts.isIdentifier(p.name)&&!ts.isStringLiteral(p.name))throw Error('Unsupported glob options');return [p.name.text,p.initializer];}));
      if(opts.eager?.kind!==ts.SyntaxKind.TrueKeyword||Object.keys(opts).some(k=>!['eager','query','import'].includes(k)))throw Error('Only static eager course globs are supported');
      const query=opts.query;if(query&&(!ts.isStringLiteralLike(query)||query.text!=='?url'))throw Error('Unsupported glob query');
      const imported=opts.import;if(imported&&(!ts.isStringLiteralLike(imported)||imported.text!=='default'))throw Error('Unsupported glob import');
      const glob=pattern.text;if(!glob.startsWith('./')||glob.split('/').includes('..'))throw Error('Course glob must stay inside its source directory');
      let expression='^';
      for(let i=0;i<glob.length;i++){
       if(glob.slice(i,i+3)==='**/'){expression+='(?:.*/)?';i+=2;}
       else if(glob[i]==='*')expression+='[^/]*';
       else if(glob[i]==='?')expression+='[^/]';
       else if(glob[i]==='{'){const end=glob.indexOf('}',i);if(end<0)throw Error('Invalid glob');const choices=glob.slice(i+1,end).split(',');if(choices.some(x=>!/^[-a-zA-Z0-9]+$/.test(x)))throw Error('Unsupported glob choices');expression+='(?:'+choices.join('|')+')';i=end;}
       else if(glob.slice(i,i+5)==='[0-9]'){expression+='[0-9]';i+=4;}
       else expression+='^$.*+?()[]{}|'.includes(glob[i])?String.fromCharCode(92)+glob[i]:glob[i];
      }
      const matches=new RegExp(expression+'$'),entries=[];
      for(const file of [...Object.keys(files),...Object.keys(assets)].sort()){
       const relative='./'+path.posix.relative(path.posix.dirname(args.path),file);if(!matches.test(relative))continue;
       const symbol='__shukuGlob'+index++;imports.push('import '+(imported?symbol:'* as '+symbol)+' from '+JSON.stringify(relative+(query?'?url':''))+';');entries.push(JSON.stringify(relative)+':'+symbol);
      }
      replacements.push({start:node.getStart(ast),end:node.end,text:'({'+entries.join(',')+'})'});
     }
     ts.forEachChild(node,visit);
    }
    visit(ast);for(const r of replacements.sort((a,b)=>b.start-a.start))value=value.slice(0,r.start)+r.text+value.slice(r.end);
    value=imports.join('\n')+'\n'+value;
   }
   if(ext==='css'&&/^modules\/[^/]+\/pages\/.*\.css$/i.test(args.path)){
    value=value.replace(/@media\s*\(\s*(max|min)-width\s*:\s*([^)]+)\)/g,(_,boundary,width)=>'@container lesson-slide ('+boundary+'-width: '+width.trim()+')');
    if(/@media[^{}]*\b(?:width|height|orientation|aspect-ratio)\b/.test(value))throw Error('Fixed lesson canvas cannot use viewport breakpoints');
   }
   return {contents:ext==='css'?value.replace(/@import\s+["']tailwindcss(?:\/[^"']*)?["'][^;]*;/g,''):value,loader:ext==='svg'?'dataurl':['md','txt'].includes(ext)?'text':ext,resolveDir:root};
  });
  build.onLoad({filter:/.*/,namespace:'course-binary'},async args=>{
   const obj=assets[args.path];if(!assetRoot||!obj||!/^[a-f0-9]{64}$/.test(obj.sha256))throw Error('Invalid binary asset reference');
   const content=await fs.readFile(path.join(assetRoot,obj.sha256));if(content.length!==obj.size||createHash('sha256').update(content).digest('hex')!==obj.sha256)throw Error('Binary asset is incomplete');
   return {contents:content,loader:'dataurl'};
  });
  build.onLoad({filter:/.*/,namespace:'course-raw'},args=>({contents:files[args.path],loader:'text'}));
  build.onLoad({filter:/.*/,namespace:'course-url'},args=>({contents:files[args.path].startsWith('data:')?Buffer.from(files[args.path].split(',')[1],'base64'):files[args.path],loader:'dataurl'}));
  build.onLoad({filter:/.*/,namespace:'framework-url'},async args=>({contents:await fs.readFile(args.path),loader:'dataurl'}));
  build.onLoad({filter:/.*/,namespace:'frozen-course-asset'},async args=>({contents:await fs.readFile(args.path),loader:'dataurl'}));
 }};
}
