import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const repository='reduct-shuku/intuitive-deep-learning';
const url='https://github.com/'+repository+'.git';
function git(cwd,...args){return execFileSync('git',['-C',cwd,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
export async function fetchLibrary(root,{latest=false,remote=url}={}){
 const lockFile=path.join(root,'course-library.lock.json');
 let lock=latest?null:JSON.parse(await fs.readFile(lockFile,'utf8'));
 if(lock&&lock.repository!==repository)throw Error('Unexpected course repository');
 const ref=latest?execFileSync('git',['ls-remote',remote,'refs/heads/main'],{encoding:'utf8'}).trim().split(/\s/)[0]:lock.commit;
 if(!/^[a-f0-9]{40}$/.test(ref||''))throw Error('A fixed course commit is required');
 const cache=path.join(root,'.course-library'),destination=path.join(cache,ref);await fs.mkdir(cache,{recursive:true});
 try{await fs.access(destination);}catch{
  const staging=await fs.mkdtemp(path.join(cache,'.fetch-'));
  try{
   execFileSync('git',['init',staging],{stdio:'ignore'});git(staging,'remote','add','origin',remote);git(staging,'fetch','--depth=1','origin',ref);git(staging,'checkout','--detach','FETCH_HEAD');
   await validate(staging,ref);await fs.rename(staging,destination);
  }finally{if(path.dirname(staging)!==cache)throw Error('Staging path leaves course cache');await fs.rm(staging,{recursive:true,force:true});}
 }
 const metadata=await validate(destination,ref);
 if(latest)await fs.writeFile(lockFile,JSON.stringify({schema:1,repository,branch:'main',commit:ref,sourceCommit:metadata.commit},null,2)+'\n');
 return destination;
}
async function validate(directory,ref){
 if(git(directory,'rev-parse','HEAD')!==ref||git(directory,'status','--porcelain'))throw Error('Course snapshot is not clean or does not match its lock');
 const manifest=JSON.parse(await fs.readFile(path.join(directory,'course-library.json'),'utf8'));
 const source=JSON.parse(await fs.readFile(path.join(directory,'source-lock.json'),'utf8'));
 if(manifest.schema!==1||manifest.repository!==repository||!manifest.modules?.length||source.repository!=='ReductTech/intuitive-deep-learning'||!/^[a-f0-9]{40}$/.test(source.commit))throw Error('Invalid course snapshot');
 return source;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 console.log(await fetchLibrary(root,{latest:process.argv.includes('--latest')}));
}
