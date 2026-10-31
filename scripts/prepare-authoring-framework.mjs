// Operator command; never called while handling a user request.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function runFrameworkGit(cwd,args,{network=false,run=execFileSync}={}){
 const timeout=network?300000:30000;
 try{
  const result=run('git',['-c','credential.interactive=false','-c','http.lowSpeedLimit=1024','-c','http.lowSpeedTime=60','-C',cwd,...args],{
   encoding:'utf8',stdio:['ignore',network?'inherit':'pipe','inherit'],timeout,killSignal:'SIGKILL',
   env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never',GIT_SSH_COMMAND:process.env.GIT_SSH_COMMAND||'ssh -o BatchMode=yes -o ConnectTimeout=30'}
  });
  return (result||'').trim();
 }catch(error){
  if(error.code==='ETIMEDOUT')throw new Error(`Git 操作超时（${timeout/1000} 秒），请检查构建容器的网络连接。`,{cause:error});
  throw error;
 }
}
const bar=percent=>'█'.repeat(Math.floor(percent/10))+'░'.repeat(10-Math.floor(percent/10));
export function downloadFailure(detail){
 if(/TLS|GnuTLS|early EOF|unexpected disconnect|RPC failed/i.test(detail))return 'GitHub 下载连接中断，框架数据未收完整。请检查服务器到 GitHub 的网络或代理后重试。';
 if(/authentication|could not read Username|repository not found|permission denied/i.test(detail))return '无法访问框架仓库，请检查仓库地址及构建环境的访问权限。';
 return '框架下载失败，请检查服务器到 GitHub 的网络连接。';
}
export function fetchFramework(cwd,commit,{spawnProcess=spawn,timeoutMs=300000,heartbeatMs=10000,log=message=>console.error(message)}={}){
 return new Promise((resolve,reject)=>{
  const started=Date.now(),elapsed=()=>Math.floor((Date.now()-started)/1000);
  const child=spawnProcess('git',['-c','credential.interactive=false','-c','http.lowSpeedLimit=1024','-c','http.lowSpeedTime=60','-C',cwd,'fetch','--progress','--depth=1','--no-tags','origin',commit],{
   stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32',env:{...process.env,LC_ALL:'C',GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never',GIT_SSH_COMMAND:process.env.GIT_SSH_COMMAND||'ssh -o BatchMode=yes -o ConnectTimeout=30'}
  });
  let done=false,detail='',pending='',last='',stage='连接 GitHub，等待响应';
  const finish=error=>{if(done)return;done=true;clearTimeout(timer);clearInterval(heartbeat);child.stdout?.destroy();child.stderr?.destroy();error?reject(error):resolve();};
  const heartbeat=setInterval(()=>log(`  … ${stage} · 已用 ${elapsed()} 秒 · 单次上限 ${timeoutMs/1000} 秒`),heartbeatMs);
  const timer=setTimeout(()=>{
   finish(new Error(`框架下载超时（${timeoutMs/1000} 秒），已终止本次下载；请检查构建容器到 GitHub 的网络连接。`));
   try{if(process.platform!=='win32'&&child.pid)process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{}
  },timeoutMs);
  const consume=data=>{
   const text=String(data);detail=(detail+text).slice(-8192);pending+=text;
   const lines=pending.split(/[\r\n]/);pending=lines.pop();
   for(const line of lines){
    const match=line.match(/(Counting objects|Compressing objects|Receiving objects|Resolving deltas):\s*(\d+)%/);
    if(!match)continue;
    const names={'Counting objects':'统计文件','Compressing objects':'服务器打包','Receiving objects':'接收框架数据','Resolving deltas':'整理下载数据'};
    const percent=Number(match[2]),key=match[1]+':'+Math.floor(percent/10);
    stage=names[match[1]];
    if(key!==last){last=key;log(`  ${stage} [${bar(percent)}] ${percent}% · 已用 ${elapsed()} 秒`);}
   }
  };
  child.stderr?.on('data',consume);child.stdout?.on('data',consume);
  child.once('error',error=>finish(new Error(`无法启动 Git：${error.message}`)));
  child.once('close',code=>{
   if(code===0)return finish();
   const error=new Error(downloadFailure(detail));
   error.retryable=/TLS|GnuTLS|EOF|RPC failed|disconnect|timed out|unable to access|could not resolve|failed to connect/i.test(detail);
   if(/authentication|could not read Username|repository not found|permission denied/i.test(detail))error.retryable=false;
   finish(error);
  });
 });
}
export async function prepareFramework(root,source){
 const started=Date.now();
 const step=(number,message)=>console.error(`\n[创作框架 ${number}/4] [${'█'.repeat(number)}${'░'.repeat(4-number)}] ${message}`);
 step(1,'检查版本锁定');
 const lock=JSON.parse(await fs.readFile(path.join(root,'local-authoring.lock.json'),'utf8'));
 if(lock.repository!=='https://github.com/reduct-shuku/course-template.git'||!/^[a-f0-9]{40}$/.test(lock.commit))throw Error('框架版本锁定无效，请检查 local-authoring.lock.json');
 console.error(`  锁定提交：${lock.commit.slice(0,12)}`);
 const cache=path.join(root,'.authoring-template'),destination=path.join(cache,lock.commit);
 const git=(cwd,...args)=>runFrameworkGit(cwd,args);
 async function verify(folder){
  if(git(folder,'rev-parse','HEAD')!==lock.commit||git(folder,'status','--porcelain'))throw Error('框架缓存存在修改，或提交与版本锁定不一致，请检查缓存目录');
  for(const name of ['creator-skills/SKILL.md','creator-skills/shared/react/index.ts','environment/frontend/package.json','runtime/frontend/index.html'])await fs.access(path.join(folder,name));
 }
 await fs.mkdir(cache,{recursive:true});
 step(2,'检查本地缓存');
 if(await fs.stat(destination).then(()=>true,()=>false)){await verify(destination);step(4,'缓存校验通过，无需下载 ✓');return destination;}
 const temporary=await fs.mkdtemp(path.join(cache,'.prepare-'));
 try{
  git(temporary,'init','--quiet');
  git(temporary,'remote','add','origin',source?path.resolve(source):lock.repository);
  step(3,'下载锁定版本（只拉当前提交，不拉完整历史）');
  for(let attempt=1;attempt<=2;attempt++){
   console.error(`  下载尝试 ${attempt}/2 · 每次最长 5 分钟 · 每 10 秒报告状态`);
   try{await fetchFramework(temporary,lock.commit);break;}catch(error){
    if(attempt===2||!error.retryable)throw error;
    console.error(`  ⚠ ${error.message}\n  3 秒后自动重试一次…`);
    await new Promise(resolve=>setTimeout(resolve,3000));
   }
  }
  step(4,'校验并安装框架');
  git(temporary,'checkout','--quiet','--detach',lock.commit);
  await verify(temporary);await fs.rename(temporary,destination);
  console.error(`  ✓ 创作框架准备完成 · 总耗时 ${Math.ceil((Date.now()-started)/1000)} 秒`);return destination;
 }finally{
  if(path.dirname(temporary)!==cache||!path.basename(temporary).startsWith('.prepare-'))throw Error('Temporary framework path leaves cache');
  await fs.rm(temporary,{recursive:true,force:true});
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const i=process.argv.indexOf('--from');
 try{const folder=await prepareFramework(root,i>=0?process.argv[i+1]:undefined);console.log(`框架目录：${folder}`);}
 catch(error){console.error(`\n✗ 创作框架准备失败\n  原因：${error.message}\n  下一步：修复上述问题后重新运行原构建命令。`);process.exitCode=1;}
}
