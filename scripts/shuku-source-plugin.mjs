import path from 'node:path';

// Source files are resolved from this map, never from the host filesystem.
export function sourcePlugin(files,root){
 const dependencies=new Set(['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom','react-dom/client','lucide-react']);
 return {name:'managed-course-source',setup(build){
  build.onResolve({filter:/^shuku-source:/},args=>({path:args.path.slice(13),namespace:'course-source'}));
  build.onResolve({filter:/.*/,namespace:'course-source'},async args=>{
   if(dependencies.has(args.path))return build.resolve(args.path,{resolveDir:root,kind:args.kind,pluginData:{trusted:true}});
   if(!args.path.startsWith('.'))throw Error('Unsupported course dependency: '+args.path);
   const name=path.posix.normalize(path.posix.join(path.posix.dirname(args.importer),args.path));
   if(name.startsWith('../')||name.startsWith('/'))throw Error('Course import escapes its source directory');
   const target=[name,...['.tsx','.ts','.jsx','.js','.json','.css','.svg','/index.tsx','/index.ts','/index.jsx','/index.js'].map(ext=>name+ext)].find(name=>Object.hasOwn(files,name));
   if(!target)throw Error('Missing course source file: '+name);
   return {path:target,namespace:'course-source'};
  });
  build.onLoad({filter:/.*/,namespace:'course-source'},args=>{
   if(!Object.hasOwn(files,args.path))throw Error('Missing source entry');
   const ext=path.posix.extname(args.path).slice(1);
   return {contents:files[args.path],loader:ext==='svg'?'dataurl':ext,resolveDir:root};
  });
 }};
}
