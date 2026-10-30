// Parse source syntax without importing or executing a course.
import fs from 'node:fs';
import ts from 'typescript';
const files=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const ids=new Set(),byFile={};
for(const [name,source] of Object.entries(files)){
 if(!/\.[jt]sx?$/.test(name))continue;
 const found=new Set();
 const ast=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,name.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 function visit(node){
  if(ts.isObjectLiteralExpression(node)){
   const properties=new Map(node.properties.filter(ts.isPropertyAssignment).map(p=>[p.name?.text,p.initializer]));
   const id=properties.get('id');
   if(id&&ts.isStringLiteralLike(id)&&(properties.has('render')||properties.has('component'))&&properties.get('showInPpt')?.kind!==ts.SyntaxKind.FalseKeyword){ids.add(id.text);found.add(id.text);}
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);byFile[name]=[...found];
}
process.stdout.write(JSON.stringify(process.argv[3]==='--by-file'?byFile:[...ids]));
