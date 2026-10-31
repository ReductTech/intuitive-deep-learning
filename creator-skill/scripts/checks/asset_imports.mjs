import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

/** Assets are runtime resources regardless of extension or size. */
export function checkAssetImports(root, directories = ['modules', 'src']) {
  const errors = [];
  function reference(file, specifier, start, source) {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) return;
    const clean = specifier.split(/[?#]/)[0];
    let target = path.resolve(path.dirname(file), clean);
    // '../assets' may name the shared assets.ts URL helper, not an asset directory.
    if (!path.extname(target)) for (const extension of ['.ts','.tsx','.js','.mjs']) {
      if (fs.existsSync(target + extension)) { target += extension; break; }
    }
    if (!target.split(path.sep).includes('assets')) return;
    errors.push({file:path.relative(root,file).replaceAll('\\','/'),line:source.slice(0,start).split('\n').length,specifier,
      message:'assets 资源禁止编译时导入；请使用 moduleAssetUrl + 运行时加载（JSON 可使用 moduleJson）。'});
  }
  function walk(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
      if (entry.isSymbolicLink() || ['assets','vendor','_scratchpad','node_modules'].includes(entry.name)) continue;
      const file = path.join(directory,entry.name);
      if (entry.isDirectory()) { walk(file); continue; }
      if (!/\.(?:[cm]?[jt]sx?|css)$/.test(file) || /(?:\.test\.|\.min\.|vite\.config\.)/.test(file)) continue;
      const source = fs.readFileSync(file,'utf8');
      if (file.endsWith('.css')) {
        for (const match of source.matchAll(/(?:url\(\s*|@import\s*)["']?([^\s"')]+)["']?\s*\)?/g)) reference(file,match[1],match.index,source);
        continue;
      }
      const ast = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
      function visit(node) {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
          reference(file,node.moduleSpecifier.text,node.getStart(ast),source);
        }
        if ((ts.isCallExpression(node) || ts.isNewExpression(node)) && node.arguments) {
          const name=node.expression.getText(ast);
          if (['import','require','URL','import.meta.glob'].includes(name)) {
            const argument=node.arguments[0];
            const values=argument&&ts.isArrayLiteralExpression(argument)?argument.elements:[argument];
            for (const value of values) if(value&&ts.isStringLiteralLike(value)) reference(file,value.text,node.getStart(ast),source);
          }
        }
        ts.forEachChild(node,visit);
      }
      visit(ast);
    }
  }
  for (const directory of directories) walk(path.resolve(root,directory));
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args=process.argv.slice(2), module=args.indexOf('--module');
  if(args.includes('--help')) { console.log('node asset_imports.mjs [--module ModuleDirectory]'); }
  else {
    const errors=checkAssetImports(process.cwd(),module<0?undefined:['modules/'+args[module+1]]);
    console.log(JSON.stringify({status:errors.length?'failed':'ok',errors}));
    process.exitCode=errors.length?1:0;
  }
}
