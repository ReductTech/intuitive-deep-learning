import fs from 'node:fs/promises';
import path from 'node:path';

// This adapts the pinned, trusted vendor only; course source never enters here.
export function sandboxMathLive(code){
 const marker='this.targetOrigin=window.origin';
 if(!code.includes(marker))throw Error('Unsupported pinned MathLive origin contract');
 return code.replaceAll(marker,'this.targetOrigin=new URL(document.referrer||location.href).origin');
}

export function runtimeCompatPlugin(sharedRoot){
 const target=fs.realpath(path.join(sharedRoot,'vendor/mathlive/mathlive.min.mjs')).catch(()=>null);
 return {name:'sandboxed-fixed-runtime',setup(context){
  context.onLoad({filter:/mathlive\.min\.mjs$/,namespace:'file'},async args=>{
   if(await fs.realpath(args.path)!==await target)return;
   return {contents:sandboxMathLive(await fs.readFile(args.path,'utf8')),loader:'js',resolveDir:path.dirname(args.path)};
  });
 }};
}
