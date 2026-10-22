// Typecheck generated files against the real Shared contracts without writing a module into the app.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
let input='';for await(const chunk of process.stdin)input+=chunk;
const files=JSON.parse(input);
const root=process.cwd();
const virtualRoot=path.join(root,'modules','__toolkit_scaffold_test__');
const normalized=value=>path.resolve(value).replaceAll('\\','/');
const virtual=new Map(Object.entries(files).map(([name,text])=>[normalized(path.join(virtualRoot,name)),text]));
const config=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
const options={...parsed.options,noEmit:true,composite:false,incremental:false};
const host=ts.createCompilerHost(options);
const originalExists=host.fileExists.bind(host), originalRead=host.readFile.bind(host), originalSource=host.getSourceFile.bind(host);
host.fileExists=name=>virtual.has(normalized(name))||originalExists(name);
host.directoryExists=name=>normalized(name)===normalized(virtualRoot)||ts.sys.directoryExists(name);
host.readFile=name=>virtual.get(normalized(name))??originalRead(name);
host.getSourceFile=(name,version,onError,createNew)=>virtual.has(normalized(name))?ts.createSourceFile(name,virtual.get(normalized(name)),version,true,name.endsWith('.json')?ts.ScriptKind.JSON:ts.ScriptKind.TSX):originalSource(name,version,onError,createNew);
const program=ts.createProgram([...virtual.keys(),...parsed.fileNames.filter(name=>name.endsWith('.d.ts'))],options,host);
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:name=>name,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));process.exitCode=1;}
else console.log('Generated scaffold passes TypeScript checks against real Shared contracts.');
