const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
test('page27 opens the real training workflow directly and forwards course completion',()=>{
 const module={exports:{}},RealHeadTrainingPage=()=>null;
 const source=fs.readFileSync(path.join(__dirname,'BuildTrainingPlanPage.tsx'),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:id=>id==='./RealHeadTrainingPage'?{RealHeadTrainingPage}:require(id)});
 const complete=()=>{};const tree=module.exports.BuildTrainingPlanPage({onComplete:complete});
 assert.equal(tree.type,RealHeadTrainingPage);assert.equal(tree.props.onComplete,complete);
 assert.ok(!source.includes('data-real-training'));assert.ok(!source.includes('trainingPlanModel'));assert.ok(!source.includes('onBack'));
});
