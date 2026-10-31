import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';

/** Same six versioned files as the online runtime; no second dependency version. */
export function pythonOfflineFiles(root) {
 const runtime=path.join(root,'node_modules/pyodide');
 const {version}=JSON.parse(fs.readFileSync(path.join(runtime,'package.json'),'utf8'));
 const lock=JSON.parse(fs.readFileSync(path.join(runtime,'pyodide-lock.json'),'utf8'));
 const wheel=lock.packages.numpy.file_name;
 return {version,files:Object.fromEntries([
  ...['pyodide.mjs','pyodide.asm.mjs','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'].map(name=>[name,path.join(runtime,name)]),
  [wheel,path.join(root,'modules/AI-Practice-Education/runtime/pyodide',wheel)],
 ])};
}
export async function buildOfflinePythonWorker(root) {
 const result=await build({entryPoints:[path.join(root,'modules/AI-Practice-Education/pages/CodePracticePage/python.offline.worker.ts')],bundle:true,format:'esm',write:false,minify:true,loader:{'.py':'text'}});
 return result.outputFiles[0].text;
}
export async function pythonOfflineBootstrap(root) {
 const runtime=pythonOfflineFiles(root),assets={};
 for(const [name,file]of Object.entries(runtime.files)){
  const mime=name.endsWith('.mjs')?'text/javascript':name.endsWith('.json')?'application/json':name.endsWith('.wasm')?'application/wasm':'application/octet-stream';
  assets[name]='data:'+mime+';base64,'+fs.readFileSync(file).toString('base64');
 }
 return 'globalThis.__SHUKU_OFFLINE_PYTHON__='+JSON.stringify({worker:await buildOfflinePythonWorker(root),assets})+';';
}
