import ts from 'typescript';

/** Retain embedded front-end demonstrations without navigating back to the development server. */
export function offlineSource(text,filename,{conditional=false}={}){
 const ast=ts.createSourceFile(filename,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(node){
  if((ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node))&&node.tagName.getText(ast)==='iframe'){
   for(const attr of node.attributes.properties){
    if(!ts.isJsxAttribute(attr)||attr.name.text!=='src'||!attr.initializer)continue;
    const value=ts.isJsxExpression(attr.initializer)?attr.initializer.expression?.getText(ast):attr.initializer.getText(ast);
    if(value)edits.push({start:attr.getStart(ast),end:attr.end,text:conditional?`{...(globalThis.__SHUKU_OFFLINE__?{srcDoc:globalThis.__SHUKU_OFFLINE_FRAME__(${value})}:{src:${value}})}`:`srcDoc={globalThis.__SHUKU_OFFLINE_FRAME__(${value})}`});
   }
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
 for(const e of edits.sort((a,b)=>b.start-a.start))text=text.slice(0,e.start)+e.text+text.slice(e.end);
 return text.replaceAll('window.location.search',"(globalThis.__SHUKU_OFFLINE_EMBED_QUERY__ || window.location.search)");
}
