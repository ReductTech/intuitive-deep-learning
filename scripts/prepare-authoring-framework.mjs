// Operator command; never called while handling a user request.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export async function prepareFramework(root,source){
 const lock=JSON.parse(await fs.readFile(path.join(root,'local-authoring.lock.json'),'utf8'));
 if(lock.repository!=='https://github.com/reduct-shuku/course-template.git'||!/^[a-f0-9]{40}$/.test(lock.commit))throw Error('Invalid authoring framework lock');
 const cache=path.join(root,'.authoring-template'),destination=path.join(cache,lock.commit);
 const git=(cwd,...args)=>execFileSync('git',['-C',cwd,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_TERMINAL_PROMPT:'0'}}).trim();
 async function verify(folder){
  if(git(folder,'rev-parse','HEAD')!==lock.commit||git(folder,'status','--porcelain'))throw Error('Authoring framework cache is modified or does not match its lock');
  for(const name of ['creator-skills/SKILL.md','creator-skills/shared/react/index.ts','environment/frontend/package.json','runtime/frontend/index.html'])await fs.access(path.join(folder,name));
 }
 await fs.mkdir(cache,{recursive:true});
 if(await fs.stat(destination).then(()=>true,()=>false)){await verify(destination);return destination;}
 const temporary=await fs.mkdtemp(path.join(cache,'.prepare-'));
 try{
  execFileSync('git',['clone','--no-checkout',source?path.resolve(source):lock.repository,temporary],{stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});
  git(temporary,'fetch','--depth=1','origin',lock.commit);git(temporary,'checkout','--detach',lock.commit);
  await verify(temporary);await fs.rename(temporary,destination);return destination;
 }finally{
  if(path.dirname(temporary)!==cache||!path.basename(temporary).startsWith('.prepare-'))throw Error('Temporary framework path leaves cache');
  await fs.rm(temporary,{recursive:true,force:true});
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const i=process.argv.indexOf('--from');console.log(await prepareFramework(root,i>=0?process.argv[i+1]:undefined));
}
