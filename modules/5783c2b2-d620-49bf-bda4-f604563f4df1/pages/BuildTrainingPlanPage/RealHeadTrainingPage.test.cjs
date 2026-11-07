// node modules/ResNet-Transfer-Guide/pages/BuildTrainingPlanPage/RealHeadTrainingPage.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,dependencies={},globals={}){
 const module={exports:{}};
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replaceAll('import.meta.env','({})');
 vm.runInNewContext(source,{module,exports:module.exports,...globals,require:id=>id in dependencies?dependencies[id]:id.endsWith('.css')?{}:require(id)});return module.exports;
}
const sharedRoot=path.resolve(__dirname,'../../../shared/react'),utils=load(path.join(sharedRoot,'utils.ts'));
const type=load(path.join(sharedRoot,'typography/Typography.tsx'),{'../utils':utils});
const shared={...type,...load(path.join(sharedRoot,'controls/Button.tsx'),{'../utils':utils,'../typography/Typography':type}),...load(path.join(sharedRoot,'layout/ContentBlock.tsx'),{'../utils':utils,'../typography/Typography':type}),...load(path.join(sharedRoot,'feedback/NoticeStrip.tsx'),{'../utils':utils,'../typography/Typography':type}),
 RangeControl:props=>React.createElement('input',{'data-range':true,type:'range',value:props.value,onChange:props.onChange}),
 EChartsChart:()=>React.createElement('div',{'data-loss-chart':true})};
const range=load(path.resolve(__dirname,'../../components/ParameterRange/ParameterRange.tsx'),{'../../../shared/react':shared});
const dataset=require('../../assets/training-head/dataset.json'),SESSION='1'.repeat(32),RUN='2'.repeat(32);
const data={DEMO_CLASSES:dataset.classes,DEMO_COUNTS:dataset.split_counts,DEMO_SAMPLES:dataset.samples.map(p=>({...p,image:p.file}))};
const text=n=>n==null||typeof n==='boolean'?'':Array.isArray(n)?n.map(text).join(''):typeof n==='object'?text(n.props?.children):String(n);
function elements(n,out=[]){if(Array.isArray(n))n.forEach(c=>elements(c,out));else if(n?.props){out.push(n);elements(n.props.children,out);}return out;}
function find(tree,key,value=true){const node=elements(tree).find(n=>n.props[key]===value);assert.ok(node,key+':'+value);return node;}
const absent=(tree,key)=>!elements(tree).some(n=>n.props[key]===true);
function defer(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
function loaded(){return{session_id:SESSION,dataset_revision:dataset.revision,old_classes:1000,feature_dimensions:512,backbone_frozen:true};}
function created(){return{...loaded(),new_classes:3,head_parameters:1539,initial_probabilities:Array.from({length:60},()=>[.3,.4,.3])};}
function training(){return{run_id:RUN,session_id:SESSION,seed:0,epochs:20,best_epoch:18,train_count:180,val_count:60,test_count:60,classes:dataset.classes,dataset_revision:dataset.revision,
 validation_samples:dataset.samples.filter(p=>p.split==='validation').map(({id,label})=>({id,label})),duration_ms:200,
 audit:{backbone_frozen:true,batchnorm_frozen:true,backbone_max_change:0,head_max_change:.04,trainable_parameters:1539,feature_cache_hit:true},
 history:Array.from({length:21},(_,epoch)=>({epoch,train_loss:1/(epoch+1),val_loss:.15+(epoch-18)**2*.002,train_correct:epoch?180:60,val_correct:epoch?54:20,probabilities:dataset.samples.filter(p=>p.split==='validation').map((p,i)=>{if(!epoch)return[.3,.4,.3];const predicted=i<54?p.label:(p.label+1)%3;return[0,1,2].map(label=>label===predicted?.6:.2);})}))};}
function testing(){return{run_id:RUN,count:60,correct:45,samples:dataset.samples.filter(p=>p.split==='test').map((p,i)=>{const prediction=i<45?p.label:(p.label+1)%3;return{id:p.id,label:p.label,prediction,probabilities:[0,1,2].map(n=>n===prediction?.6:.2)};})};}
const defaults={loadRecyclingBackbone:async()=>loaded(),replaceRecyclingHead:async()=>created(),trainRecyclingHead:async()=>training(),evaluateRecyclingHead:async()=>testing()};
function harness(overrides={},globals={}){
 const states=[],refs=[],deps=[],cleanup=[];let cursor,refCursor,effectCursor,effects,calls=0;
 const react={useState(initial){const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},useRef(initial){return refs[refCursor++]??={current:initial};},useMemo(fn){return fn();},useEffect(fn,next){const i=effectCursor++;if(!deps[i]||next.some((v,j)=>v!==deps[i][j])){deps[i]=next;effects.push(()=>{cleanup[i]?.();cleanup[i]=fn();});}}};
 const hook=load(path.resolve(__dirname,'../../hooks/useCompleteOnce.ts'),{react});
 const {RealHeadTrainingPage}=load(path.join(__dirname,'RealHeadTrainingPage.tsx'),{react,'../../../shared/react':shared,'../../hooks/useCompleteOnce':hook,'../../components/ParameterRange/ParameterRange':range,'../../components/TransferVisuals/TransferVisuals':{WeightCheckpoint:()=>React.createElement('span',{'data-checkpoint':true},'θ*')},'../../services/recyclingData':data,'../../services/recyclingTraining':{...defaults,...overrides}},{AbortController,Error,...globals});
 return{get calls(){return calls;},render(){cursor=refCursor=effectCursor=0;effects=[];const tree=RealHeadTrainingPage({onComplete:()=>calls++});effects.forEach(fn=>fn());return tree;},dispose(){cleanup.forEach(fn=>fn?.());}};
}
async function advance(app,key){const tree=app.render();await find(tree,key).props.onClick();return app.render();}
function nextScene(app,target){find(app.render(),'data-next-scene',target).props.onClick();return app.render();}
async function reach(app,phase){
 await advance(app,'data-load');if(phase==='loaded')return app.render();
 nextScene(app,2);await advance(app,'data-replace');if(phase==='head-ready')return app.render();
 nextScene(app,3);await advance(app,'data-train');return app.render();
}
async function prepare(app,key){
 if(key==='data-replace'){await reach(app,'loaded');nextScene(app,2);}
 if(key==='data-train'){await reach(app,'head-ready');nextScene(app,3);}
 if(key==='data-test'){await reach(app,'trained');nextScene(app,4);}
}

test('four focused scenes require genuine operations and keep each completed result visible until the learner continues',async()=>{
 const pending=defer();let starts=0;const app=harness({loadRecyclingBackbone(){starts++;return pending.promise;}});
 let tree=app.render();assert.equal(tree.props['data-scene'],1);assert.equal(tree.props['data-phase'],'empty');
 assert.equal(elements(tree).filter(n=>'data-scene-panel'in n.props).length,1);assert.ok(find(tree,'data-classifier','old'));assert.ok(absent(tree,'data-replace')&&absent(tree,'data-train'));
 assert.ok(!elements(tree).some(n=>'data-sample'in n.props||n.type===shared.EChartsChart));assert.ok(find(tree,'data-scene-tab',2).props.disabled);
 const start=find(tree,'data-load').props.onClick,loading=start();await start();tree=app.render();assert.equal(starts,1);assert.equal(tree.props['data-phase'],'loading');assert.ok(find(tree,'data-scene-tab',1).props.disabled);
 pending.resolve(loaded());await loading;tree=app.render();assert.equal(tree.props['data-scene'],1);assert.equal(tree.props['data-phase'],'loaded');assert.ok(text(tree).includes('预训练权重已装入'));
 tree=nextScene(app,2);assert.equal(tree.props['data-scene'],2);assert.ok(!text(tree).includes('ImageNet预训练权重'));assert.ok(!elements(tree).some(n=>'data-sample'in n.props));
 tree=await advance(app,'data-replace');assert.ok(find(tree,'data-classifier','new'));assert.equal(tree.props['data-scene'],2);assert.ok(text(tree).includes('随机新头'));
 tree=nextScene(app,3);assert.equal(tree.props['data-observed-split'],'train');assert.ok(!elements(tree).some(n=>n.type===range.ParameterRange));assert.ok(find(tree,'data-validation-before',20));
 tree=await advance(app,'data-train');assert.equal(tree.props['data-scene'],3);assert.equal(tree.props['data-observed-split'],'validation');assert.ok(find(tree,'data-validation-after',54));assert.ok(find(tree,'data-saved-epoch',18));assert.equal(app.calls,0);
 tree=nextScene(app,4);assert.ok(find(tree,'data-test-locked'));assert.ok(!elements(tree).some(n=>'data-sample'in n.props||n.type===shared.EChartsChart));assert.ok(find(tree,'data-final-validation',54));
 tree=await advance(app,'data-test');assert.equal(tree.props['data-scene'],4);assert.equal(tree.props['data-phase'],'done');assert.ok(find(tree,'data-test-correct',45));assert.ok(find(tree,'data-final-validation',54));assert.equal(app.calls,1);
 assert.ok(find(tree,'data-action','done').props.disabled);assert.ok(!/NaN|\[object Object\]/.test(renderToStaticMarkup(tree)));app.dispose();
});

test('loading, replacement, training and test reject duplicates; reset and unmount invalidate their pending results',async()=>{
 for(const [phase,key,method,fallback,value]of [['loading','data-load','loadRecyclingBackbone','empty',loaded()],['replacing','data-replace','replaceRecyclingHead','loaded',created()],['training','data-train','trainRecyclingHead','head-ready',training()],['testing','data-test','evaluateRecyclingHead','trained',testing()]]){
  const pending=defer();let signal,operations=0;
  const app=harness({[method](...args){operations++;signal=args.find(a=>a instanceof AbortSignal);return pending.promise;}});
  await prepare(app,key);let tree=app.render();const onClick=find(tree,key).props.onClick,work=onClick();await onClick();tree=app.render();
  assert.equal(tree.props['data-phase'],phase);assert.equal(operations,1);assert.ok(elements(tree).filter(n=>'data-scene-tab'in n.props).every(n=>n.props.disabled));
  find(tree,'data-reset').props.onClick();tree=app.render();assert.ok(signal.aborted);pending.resolve(value);await work;tree=app.render();assert.equal(tree.props['data-scene'],1);assert.equal(tree.props['data-phase'],'empty');assert.equal(app.calls,0);app.dispose();
 }
 const pending=defer();let signal;const app=harness({loadRecyclingBackbone(s){signal=s;return pending.promise;}});
 const work=find(app.render(),'data-load').props.onClick();app.dispose();pending.resolve(loaded());await work;assert.ok(signal.aborted);assert.equal(app.calls,0);
});

test('operation failure stays in the current scene and retry performs only that operation',async()=>{
 for(const [key,method,fallback,value]of [['data-load','loadRecyclingBackbone','empty',loaded()],['data-replace','replaceRecyclingHead','loaded',created()],['data-train','trainRecyclingHead','head-ready',training()],['data-test','evaluateRecyclingHead','trained',testing()]]){
  let calls=0;const app=harness({[method]:async()=>{if(calls++===0)throw Error('服务中断');return value;}});
  await prepare(app,key);const scene=app.render().props['data-scene'];let tree=await advance(app,key);assert.equal(tree.props['data-scene'],scene);assert.equal(tree.props['data-phase'],fallback);assert.ok(text(tree).includes('服务中断'));assert.equal(app.calls,0);
  tree=await advance(app,key);assert.equal(tree.props['data-scene'],scene);assert.ok(!text(tree).includes('服务中断'));app.dispose();
 }
});

test('completed scenes can be reviewed without new jobs, changing the saved model or mixing test predictions into validation',async()=>{
 const calls=[];const app=harness(Object.fromEntries(Object.entries(defaults).map(([name,fn])=>[name,async(...args)=>{calls.push(name);return fn(...args);} ])));
 await reach(app,'trained');nextScene(app,4);await advance(app,'data-test');
 for(const scene of [1,2,3,4]){
  let tree=app.render();find(tree,'data-scene-tab',scene).props.onClick();tree=app.render();assert.equal(tree.props['data-scene'],scene);assert.equal(tree.props['data-complete'],true);assert.equal(elements(tree).filter(n=>'data-scene-panel'in n.props).length,1);
  if(scene===3){
   assert.equal(tree.props['data-observed-split'],'validation');assert.ok(find(tree,'data-validation-after',54));
   const slider=elements(tree).find(n=>n.type===shared.RangeControl);assert.equal(slider.props.disabled,false);slider.props.onChange({currentTarget:{value:'0'}});tree=app.render();
   assert.ok(find(tree,'data-validation-after',54));const chart=elements(tree).find(n=>n.type===shared.EChartsChart);assert.equal(chart.props.option.series[1].markLine.data[0].xAxis,18);assert.ok(text(tree).includes('第 0 轮'));
  }
  if(scene===4){assert.ok(find(tree,'data-test-correct',45));assert.ok(find(tree,'data-validation-before',20));assert.ok(find(tree,'data-validation-after',54));}
 }
 assert.deepEqual(calls,Object.keys(defaults));assert.equal(app.calls,1);app.dispose();
});

test('all 180/60/60 inputs remain reachable in their own scene, with visible test errors and safe stale handlers',async()=>{
 const app=harness();await reach(app,'head-ready');nextScene(app,3);let stale;
 for(const split of ['train','validation','test']){
  if(split==='validation')await advance(app,'data-train');
  if(split==='test'){nextScene(app,4);await advance(app,'data-test');}
  const expected=dataset.samples.filter(p=>p.split===split),seen=[];let errors=0;
  for(let page=0;page<expected.length/6;page++){
   let tree=app.render();assert.equal(tree.props['data-observed-split'],split);
   seen.push(...elements(tree).filter(n=>'data-sample-id'in n.props).map(n=>n.props['data-sample-id']));
   errors+=elements(tree).filter(n=>n.props['data-prediction-correct']===false).length;
   if(split==='train'&&page===29)stale=find(tree,'data-sample',179).props.onClick;
   if(page+1<expected.length/6)find(tree,'data-photo-next').props.onClick();
  }
  assert.deepEqual(seen,expected.map(p=>p.id));if(split==='test')assert.equal(errors,15);
 }
 let tree=app.render();find(tree,'data-scene-tab',3).props.onClick();tree=app.render();stale();tree=app.render();assert.ok(find(tree,'data-sample',0).props['aria-pressed']);app.dispose();
});

test('reset preserves initialization seed zero; stale model-operation and stage handlers cannot resume an old run',async()=>{
 const seeds=[],app=harness({replaceRecyclingHead:async(session,seed)=>{seeds.push(seed);return created();}});
 for(let round=0;round<2;round++){
  await reach(app,'head-ready');let tree=app.render();const oldTrain=find(nextScene(app,3),'data-train').props.onClick,oldTab=find(tree,'data-scene-tab',2).props.onClick;
  find(app.render(),'data-reset').props.onClick();app.render();await oldTrain();oldTab();tree=app.render();assert.equal(tree.props['data-scene'],1);assert.equal(tree.props['data-phase'],'empty');
 }
 assert.deepEqual(seeds,[0,0]);app.dispose();
});

test('native stage-transition callbacks cannot restore stale scenes after reset; reduced motion switches directly',async()=>{
 const queued=[];let skips=0;
 const app=harness({},{
  document:{startViewTransition(fn){queued.push(fn);return{skipTransition(){skips++;},ready:Promise.resolve(),finished:Promise.resolve()};}},
  window:{matchMedia:()=>({matches:false})},
 });
 await reach(app,'loaded');find(app.render(),'data-next-scene',2).props.onClick();
 find(app.render(),'data-reset').props.onClick();app.render();queued[0]();let tree=app.render();assert.equal(tree.props['data-scene'],1);assert.equal(tree.props['data-phase'],'empty');assert.ok(skips>0);app.dispose();
 let nativeCalls=0;const reduced=harness({},{
  document:{startViewTransition(){nativeCalls++;throw Error('should not run');}},
  window:{matchMedia:()=>({matches:true})},
 });
 await reach(reduced,'loaded');tree=nextScene(reduced,2);assert.equal(tree.props['data-scene'],2);assert.equal(nativeCalls,0);reduced.dispose();
});

test('four-stage layout uses Shared typography, bounded grids, smooth snapshots and reduced-motion alternatives',()=>{
 const css=fs.readFileSync(path.join(__dirname,'RealHeadTrainingPage.css'),'utf8');require('postcss').parse(css);
 assert.ok(!/font-size:|font-weight:|line-height:|overflow[^;]*hidden|@media\s*\(max-width/.test(css));
 assert.ok(css.includes('minmax(0,1fr)'));assert.ok(css.includes('prefers-reduced-motion'));assert.ok(css.includes('view-transition-name:rtg-head-stage'));assert.ok(css.includes('::view-transition-old(rtg-head-stage)'));
});

test('service submits four session-linked jobs and validates the 300-photo split',async()=>{
 let requests=[],corrupt=false;
 const service=load(path.resolve(__dirname,'../../services/recyclingTraining.ts'),{'../assets/training-head/dataset.json':{default:dataset}},{fetch:async(url,options)=>{const body=JSON.parse(options.body);requests.push(body);const result=body.endpoint.includes('load-backbone')?loaded():body.endpoint.includes('replace-head')?created():body.endpoint.includes('train-head')?training():testing();if(corrupt&&result.audit)result.audit.backbone_max_change=.1;return{ok:true,json:async()=>({id:'job',status:'complete',result:{ok:true,result}})};},DOMException,setTimeout,clearTimeout});
 const signal=new AbortController().signal;
 const weights=await service.loadRecyclingBackbone(signal,()=>{}),head=await service.replaceRecyclingHead(weights.session_id,0,signal),run=await service.trainRecyclingHead(head.session_id,signal,()=>{}),result=await service.evaluateRecyclingHead(run.run_id,signal);
 assert.equal(result.count,60);assert.equal(result.correct,45);assert.deepEqual(requests.map(p=>p.payload),[{}, {session_id:SESSION,seed:0},{session_id:SESSION},{run_id:RUN}]);
 corrupt=true;await assert.rejects(()=>service.trainRecyclingHead(SESSION,signal,()=>{}),/独立数据划分/);
});

test('service rejects inconsistent validation counts, a non-minimum checkpoint or a test label inconsistent with its probabilities',async()=>{
 let invalid='count';
 const service=load(path.resolve(__dirname,'../../services/recyclingTraining.ts'),{'../assets/training-head/dataset.json':{default:dataset}},{fetch:async(url,options)=>{
  const endpoint=JSON.parse(options.body).endpoint,result=endpoint.includes('evaluate-head')?testing():training();
  if(invalid==='count')result.history[18].val_correct=55;
  if(invalid==='checkpoint')result.best_epoch=20;
  if(invalid==='test-prediction'){result.samples[0].prediction=(result.samples[0].prediction+1)%3;result.correct--;}
  return{ok:true,json:async()=>({id:'job',status:'complete',result:{ok:true,result}})};
 },DOMException,setTimeout,clearTimeout});
 const signal=new AbortController().signal;
 await assert.rejects(()=>service.trainRecyclingHead(SESSION,signal,()=>{}),/完整曲线/);
 invalid='checkpoint';await assert.rejects(()=>service.trainRecyclingHead(SESSION,signal,()=>{}),/最低验证损失/);
 invalid='test-prediction';await assert.rejects(()=>service.evaluateRecyclingHead(RUN,signal),/测试结果/);
});
