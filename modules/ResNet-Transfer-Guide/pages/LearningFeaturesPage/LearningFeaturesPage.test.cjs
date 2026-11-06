// node modules/ResNet-Transfer-Guide/pages/LearningFeaturesPage/LearningFeaturesPage.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,dependencies={}){
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:id=>id in dependencies?dependencies[id]:id.endsWith('.css')?{}:id.endsWith('.png')?'bottle.png':require(id)});
 return module.exports;
}
const sharedRoot=path.resolve(__dirname,'../../../shared/react'),utils=load(path.join(sharedRoot,'utils.ts'));
const typography=load(path.join(sharedRoot,'typography/Typography.tsx'),{'../utils':utils});
const shared={...typography,...load(path.join(sharedRoot,'controls/Button.tsx'),{'../utils':utils,'../typography/Typography':typography}),...load(path.join(sharedRoot,'layout/ContentBlock.tsx'),{'../utils':utils,'../typography/Typography':typography}),...load(path.join(sharedRoot,'feedback/NoticeStrip.tsx'),{'../utils':utils,'../typography/Typography':typography})};
function nodes(n,out=[]){if(Array.isArray(n))n.forEach(c=>nodes(c,out));else if(n?.props){out.push(n);nodes(n.props.children,out);}return out;}
const text=n=>n==null||typeof n==='boolean'?'':Array.isArray(n)?n.map(text).join(''):typeof n==='object'?text(n.props?.children):String(n);
function find(tree,key,value=true){const n=nodes(tree).find(n=>n.props[key]===value);assert.ok(n,key+':'+value);return n;}
function modules(tree){return nodes(tree).filter(n=>'data-learning-module'in n.props).map(n=>n.props['data-learning-module']);}
function harness(){
 const values=[],refs=[],dependencies=[];let cursor,refCursor,effectCursor,effects,calls=0;
 const react={useState(initial){const i=cursor++;if(!(i in values))values[i]=initial;return[values[i],v=>values[i]=typeof v==='function'?v(values[i]):v];},useRef(initial){return refs[refCursor++]??={current:initial};},useEffect(fn,deps){const i=effectCursor++;if(!dependencies[i]||deps.some((d,j)=>d!==dependencies[i][j])){dependencies[i]=deps;effects.push(fn);}}};
 const hook=load(path.resolve(__dirname,'../../hooks/useCompleteOnce.ts'),{react});
 const {LearningFeaturesPage}=load(path.join(__dirname,'LearningFeaturesPage.tsx'),{react,'../../../shared/react':shared,'../../hooks/useCompleteOnce':hook});
 return{get calls(){return calls;},render(){cursor=refCursor=effectCursor=0;effects=[];const result=LearningFeaturesPage({onComplete:()=>calls++});effects.forEach(fn=>fn());return result;}};
}
function advance(app,phase){find(app.render(),'data-action','phase-'+phase).props.onClick();return app.render();}

test('page6 focuses five forward modules, two loss modules, three backward modules and parameter updates before the overview',()=>{
 const app=harness();let tree=app.render();
 assert.deepEqual(modules(tree),['input','extractor','feature','head','prediction']);
 assert.equal(nodes(tree).filter(n=>String(n.props['data-action']).startsWith('phase-')).length,1);
 tree=advance(app,1);assert.deepEqual(modules(tree),['input','extractor','feature','head','prediction']);assert.equal(find(tree,'data-feature-version','old').props['data-feature-version'],'old');
 tree=advance(app,2);assert.deepEqual(modules(tree),['prediction','loss']);assert.ok(find(tree,'data-loss','1.35'));assert.equal(app.calls,0);
 tree=advance(app,3);assert.deepEqual(modules(tree),['optimizer','gradient','loss']);assert.ok(text(tree).includes('梯度已就绪；求梯度本身不改参数'));assert.equal(app.calls,0);
 tree=advance(app,4);assert.deepEqual(modules(tree),['extractor','head','optimizer']);assert.equal(nodes(tree).filter(n=>n.props['data-updated']===true).length,2);assert.ok(!nodes(tree).some(n=>'data-prediction-version'in n.props));assert.equal(app.calls,0);
 tree=advance(app,5);assert.deepEqual(modules(tree),['input','extractor','feature','head','prediction','optimizer','gradient','loss']);assert.ok(find(tree,'data-feature-version','old'));assert.ok(find(tree,'data-prediction-version','old'));assert.ok(find(tree,'data-loss','1.35'));assert.equal(tree.props['data-verified'],false);assert.equal(app.calls,0);
 assert.ok(find(tree,'data-action','phase-6'));assert.ok(text(tree).includes('旧值 · 待复算'));
 tree=advance(app,6);assert.ok(find(tree,'data-feature-version','new'));assert.ok(find(tree,'data-prediction-version','new'));assert.ok(find(tree,'data-loss','0.39'));assert.equal(app.calls,1);
 assert.ok(nodes(tree).some(n=>n.type===shared.Button&&n.props['data-overview']));assert.ok(text(tree).includes('完整闭环'));
 const html=renderToStaticMarkup(tree);assert.ok(!/NaN|undefined|\[object Object\]/.test(html));
});

test('review restores focused acts, preserves the completed overview and cannot complete twice',()=>{
 const app=harness();for(let i=1;i<=6;i++)advance(app,i);
 for(let phase=1;phase<=4;phase++){
  let tree=app.render();find(tree,'data-stage',phase).props.onClick();tree=app.render();assert.equal(tree.props['data-phase'],phase);assert.equal(tree.props['data-verified'],false);
  find(tree,'data-overview').props.onClick();tree=app.render();assert.equal(tree.props['data-phase'],6);assert.equal(modules(tree).length,8);
 }
 assert.equal(app.calls,1);
 let tree=app.render();find(tree,'data-action','replay').props.onClick();tree=app.render();assert.equal(tree.props['data-phase'],0);assert.equal(modules(tree).length,5);assert.ok(!nodes(tree).some(n=>'data-overview'in n.props));
 assert.ok(nodes(tree).filter(n=>'data-stage'in n.props).every(n=>n.props.disabled));
});

test('old forward, update and overview handlers cannot skip the sequence after replay',()=>{
 const app=harness();let tree=app.render();const start=find(tree,'data-action','phase-1').props.onClick;
 start();tree=app.render();start();tree=app.render();assert.equal(tree.props['data-phase'],1);
 for(let i=2;i<=5;i++)tree=advance(app,i);
 const verify=find(tree,'data-action','phase-6').props.onClick;tree=advance(app,6);const overview=find(tree,'data-overview').props.onClick;
 find(tree,'data-action','replay').props.onClick();tree=app.render();verify();overview();tree=app.render();assert.equal(tree.props['data-phase'],0);assert.equal(app.calls,1);
});

test('opening the overview preserves old outputs; recomputing updates the existing feature and probability tracks without rewriting parameters',()=>{
 const app=harness();let before;for(let i=1;i<=5;i++)before=advance(app,i);
 const beforeModules=modules(before);
 const featureBars=tree=>nodes(find(tree,'data-learning-module','feature')).filter(n=>n.type==='b').map(n=>Math.round(parseFloat(n.props.style.height)));
 const probabilityBars=tree=>nodes(find(tree,'data-learning-module','prediction')).filter(n=>n.type==='b').map(n=>n.props.style.width);
 assert.deepEqual(featureBars(before),[28,46,23,58,36]);
 assert.deepEqual(probabilityBars(before),['26%','12%','62%']);
 const after=advance(app,6);assert.deepEqual(modules(after),beforeModules);
 assert.deepEqual(featureBars(after),[34,56,27,64,39]);
 assert.deepEqual(probabilityBars(after),['68%','12%','20%']);
 for(const tree of [before,after])assert.equal(nodes(tree).filter(n=>n.props['data-updated']===true).length,2);
 assert.equal(app.calls,1);
});

test('focus layouts keep shrinkable tracks, explicit stage separation and reduced-motion support',()=>{
 const css=fs.readFileSync(path.join(__dirname,'LearningFeaturesPage.css'),'utf8');require('postcss').parse(css);
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert.ok(css.includes('rtg-learning__scene--active-2'));assert.ok(css.includes('rtg-learning__scene--active-4'));
 assert.ok(css.includes('prefers-reduced-motion'));assert.ok(css.includes('animation:none'));
 assert.ok(!/font-size:|font-weight:|line-height:|overflow-x:\s*auto|@media\s*\(max-width/.test(css));
});
