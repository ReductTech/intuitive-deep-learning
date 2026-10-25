import fs from 'node:fs';
import path from 'node:path';
import type {Plugin} from 'vite';

export function courseLibraryRoot(root:string,setting?:string){
 if(!setting)return root;
 const lock=setting==='locked'?JSON.parse(fs.readFileSync(path.join(root,'course-library.lock.json'),'utf8')):null;
 if(lock&&!/^[a-f0-9]{40}$/.test(lock.commit))throw Error('Invalid course library lock');
 const directory=lock?path.join(root,'.course-library',lock.commit):path.resolve(root,setting);
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'course-library.json'),'utf8'));
 if(manifest.schema!==1||manifest.repository!=='reduct-shuku/intuitive-deep-learning'||!manifest.modules?.length)throw Error('Invalid independent course library; run npm run courses:fetch');
 return fs.realpathSync(directory);
}

export function courseLibraryPlugin(root:string,library:string):Plugin{
 const prefix=path.join(root,'modules')+path.sep;
 function mapped(id:string,importer?:string){
  const base=id.split('?')[0];
  if(base.startsWith('/modules/'))return path.join(library,base.slice(1))+id.slice(base.length);
  const absolute=path.isAbsolute(base)?base:base.startsWith('.')&&importer?path.resolve(path.dirname(importer.split('?')[0]),base):'';
  return absolute.startsWith(prefix)?path.join(library,'modules',path.relative(path.join(root,'modules'),absolute))+id.slice(base.length):null;
 }
 return {name:'independent-course-library',enforce:'pre',
  async resolveId(id,importer){
   if(library===root)return null;
   const target=mapped(id,importer);
   if(target)return this.resolve(target,importer,{skipSelf:true});
   if(id==='virtual:creator-skill-documents')return '\0independent-creator-documents';
   return null;
  },
  load(id){
   if(id!=='\0independent-creator-documents')return null;
   const folder=path.join(library,'creator-skill');
   function read(dir:string):{path:string;content:string}[]{return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?read(path.join(dir,item.name)):item.name.endsWith('.md')?[{path:path.relative(folder,path.join(dir,item.name)).replaceAll('\\','/'),content:fs.readFileSync(path.join(dir,item.name),'utf8')}]:[]);}
   return 'export default '+JSON.stringify(read(folder));
  },
  transform(code,id){
   if(library===root||!id.replaceAll('\\','/').endsWith('/src/app/modules.tsx'))return null;
   let directory=path.relative(path.dirname(id.split('?')[0]),path.join(library,'modules')).replaceAll('\\','/');
   if(!directory.startsWith('.'))directory='./'+directory;
   return code.replaceAll("import.meta.glob('../../modules/",`import.meta.glob('${directory}/`);
  },
  transformIndexHtml(html,context){
   if(library===root)return html;
   const file=mapped(context.filename);
   return file&&fs.existsSync(file)?fs.readFileSync(file,'utf8'):html;
  },
 };
}
