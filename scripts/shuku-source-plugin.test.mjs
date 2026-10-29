import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {sourcePlugin} from './shuku-source-plugin.mjs';
const root=process.cwd();
function compile(files){return build({stdin:{contents:"import value from 'shuku-source:main.ts';console.log(value)",resolveDir:root,loader:'ts'},bundle:true,platform:'browser',write:false,logLevel:'silent',plugins:[sourcePlugin(files,root)]});}

test('raw text and ordinary image imports stay inside the virtual source map',async()=>{
 const result=await compile({'main.ts':"import text from './note.md?raw';import image from './图片.PNG';export default {text,image}",'note.md':'课程说明','图片.PNG':'data:image/png;base64,iVBORw0KGgo='});
 assert.match(result.outputFiles[0].text,/data:image\/png;base64/);assert.match(result.outputFiles[0].text,/课程说明|\\u8BFE/i);
});

test('source code cannot import arbitrary packages, host files or escape shared paths',async()=>{
 for(const name of ['node:fs','/etc/passwd','../../secret.json','@shared/react/../../backend','@shared/vendor/../../backend.py?url','https://attacker.invalid/code.js']){
  await assert.rejects(compile({'main.ts':'import value from '+JSON.stringify(name)+';export default value'}));
 }
});

test('unsupported dynamic module URLs fail at build instead of a broken preview',async()=>{
 await assert.rejects(compile({'main.ts':"export default new URL(userInput,import.meta.url)"}),/Module URLs must use a static resource path/);
});


test('native eager page registries enumerate submitted pages, with no filesystem lookup',async()=>{
 const result=await compile({'main.ts':"const pages=import.meta.glob('./pages/[0-9]*.tsx',{eager:true});export default pages",'pages/01.tsx':"export const Page='first-page-content'",'pages/example.tsx':"export const Page='excluded-content'"});
 assert.match(result.outputFiles[0].text,/first-page-content/);assert.doesNotMatch(result.outputFiles[0].text,/excluded-content|import\.meta\.glob/);
 await assert.rejects(compile({'main.ts':"export default import.meta.glob('../../secret/*',{eager:true})"}),/inside/);
 await assert.rejects(compile({'main.ts':"export default import.meta.glob(userInput)"}),/static eager/);
});


test('only the fixed public authoring document provider is available to source modules',async()=>{
 const provider={name:'fixture-docs',setup(context){context.onResolve({filter:/^virtual:creator-skill-documents$/},()=>({path:'fixed-docs',namespace:'fixture-docs'}));context.onLoad({filter:/.*/,namespace:'fixture-docs'},()=>({contents:'export default [{path:"SKILL.md",content:"fixed authoring guidance"}]',loader:'js'}));}};
 const result=await build({stdin:{contents:"import docs from 'shuku-source:main.ts';console.log(docs)",resolveDir:root,loader:'ts'},bundle:true,write:false,plugins:[sourcePlugin({'main.ts':"export {default} from 'virtual:creator-skill-documents'"},root),provider]});
 assert.match(result.outputFiles[0].text,/fixed authoring guidance/);
 await assert.rejects(compile({'main.ts':"export {default} from 'virtual:private-server-documents'"}));
});


test('page CSS uses the same fixed canvas breakpoints as the local template preview',async()=>{
 const result=await build({entryPoints:['shuku-source:modules/Course/pages/slide.css'],bundle:true,write:false,plugins:[sourcePlugin({'modules/Course/pages/slide.css':'@media(max-width:700px){.card{color:red}}'},root)]});
 assert.match(result.outputFiles[0].text,/@container lesson-slide/);assert.doesNotMatch(result.outputFiles[0].text,/@media/);
 await assert.rejects(build({entryPoints:['shuku-source:modules/Course/pages/slide.css'],bundle:true,write:false,logLevel:'silent',plugins:[sourcePlugin({'modules/Course/pages/slide.css':'@media (orientation: landscape){.card{color:red}}'},root)]}),/Fixed lesson canvas/);
});
