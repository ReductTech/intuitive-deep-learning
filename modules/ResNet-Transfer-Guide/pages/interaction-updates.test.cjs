// node modules/ResNet-Transfer-Guide/pages/interaction-updates.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, ...globals,
    require: id => id in dependencies ? dependencies[id] : id.endsWith('/shared/react/assets') ? {moduleAssetUrl:(id,relative)=>`/${id}/${relative}`} : id.endsWith('.css') ? {} : id.endsWith('.json') ? require(path.resolve(path.dirname(file),id)) : /\.(png|jpg)$/.test(id) ? { default: id } : require(id) });
  return module.exports;
}
const sharedRoot = path.resolve(__dirname, '../../shared/react');
const utils = load(path.join(sharedRoot, 'utils.ts'));
const type = load(path.join(sharedRoot, 'typography/Typography.tsx'), { '../utils': utils });
const shared = { ...type,
  ...load(path.join(sharedRoot, 'controls/Switch.tsx'), { '../utils': utils }),
  ...load(path.join(sharedRoot, 'controls/TextInput.tsx'), { '../utils': utils, '../typography/Typography': type }),
  ...load(path.join(sharedRoot, 'controls/Button.tsx'), { '../utils': utils, '../typography/Typography': type }),
  ...load(path.join(sharedRoot, 'controls/RangeControl.tsx'), { '../utils': utils, '../typography/Typography': type }),
  ...load(path.join(sharedRoot, 'layout/ContentBlock.tsx'), { '../utils': utils, '../typography/Typography': type }),
  ...load(path.join(sharedRoot, 'feedback/NoticeStrip.tsx'), { '../utils': utils, '../typography/Typography': type }),
  ...load(path.join(sharedRoot, 'learning/MathFormulaBlock.tsx'), { '../utils': utils }),
};
const range = load(path.resolve(__dirname, '../components/ParameterRange/ParameterRange.tsx'), { '../../../shared/react': shared });
const transferVisuals = load(path.resolve(__dirname, '../components/TransferVisuals/TransferVisuals.tsx'), { '../../../shared/react': shared });
const blockConnections = load(path.join(__dirname, 'BasicBlockPage/connections.ts'));
const superResolutionMotion = load(path.join(__dirname, 'SuperResolutionPage/motion.ts'));
const superResolutionScene = load(path.join(__dirname, 'SuperResolutionPage/scene.ts'));
const startingFrames = require(path.resolve(__dirname, '../assets/starting-points/images.json'));
const startingModel = load(path.join(__dirname, 'StartingPointsPage/model.ts'), { '../../../shared/react/moduleJson': { moduleJson: () => ({ready:true,read:()=>startingFrames,load:()=>Promise.resolve(startingFrames)}) }, '../../../shared/react/assets': { moduleAssetUrl: (id,relative)=>`/${id}/${relative}` }, '../../outlines.json': {moduleIdentity:{id:'test'}} });
const transferClassification = load(path.join(__dirname, 'TransferableExperiencePage/classification.ts'));
const RtgQuestion = props => require('react').createElement('div', { 'data-question': props.questionId }, props.title);
const TransferCheckPanel = props => require('react').createElement('div', { 'data-review-panel': true, hidden: props.hidden });
function elements(node, out = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, out));
  else if (node?.props) { out.push(node); elements(node.props.children, out); }
  return out;
}
const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node);
const plain = value => JSON.parse(JSON.stringify(value));
function harness(name, reduced = false, failFirstImage = false, browserMocks = {}, serviceMocks = {}) {
  const states = [], refs = [], memos = [], dependencies = [], cleanups = [], timers = new Map(), frames = new Map();
  let cursor, refCursor, effectCursor, memoCursor, pending, dirty, calls = 0, nextId = 1, tree;
  const react = {
    Fragment: require('react').Fragment,
    useState(initial) {
      const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], value => { const next = typeof value === 'function' ? value(states[i]) : value; if (next !== states[i]) { states[i] = next; dirty = true; } }];
    },
    useMemo(fn,next) {
      const i=memoCursor++;
      if(!next||!memos[i]||next.some((value,index)=>value!==memos[i].dependencies[index])) memos[i]={value:fn(),dependencies:next};
      return memos[i].value;
    },
    useRef(initial) { return refs[refCursor++] ??= { current: initial }; },
    useEffect(fn, next) {
      const i = effectCursor++;
      if (!dependencies[i] || next.some((value, index) => value !== dependencies[i][index])) {
        dependencies[i] = next; pending.push(() => { cleanups[i]?.(); cleanups[i] = fn(); });
      }
    },
  };
  const window = {
    matchMedia: () => ({ matches: reduced }),
    setInterval(fn) { const id = nextId++; timers.set(id, { fn, interval: true }); return id; },
    clearInterval(id) { timers.delete(id); },
    setTimeout(fn) { const id = nextId++; timers.set(id, { fn, interval: false }); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(fn) { const id = nextId++; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  const completeHook = load(path.resolve(__dirname, '../hooks/useCompleteOnce.ts'), { react });
  const playbackHook = load(path.resolve(__dirname, '../hooks/useTeachingPlayback.ts'), { react }, { window });
  const pixelModel = load(path.resolve(__dirname, 'SuperResolutionPage/pixels.ts'));
  const target = new Uint8ClampedArray([90,110,150,255, 30,60,100,255, 180,160,120,255, 100,120,140,255]);
  const baseline = new Uint8ClampedArray([100,100,100,255, 50,50,100,255, 150,150,150,255, 110,110,110,255]);
  const residual = Int16Array.from(target, (value,index) => index % 4 === 3 ? 0 : value - baseline[index]);
  const fixture = { size:2, lowSize:1, target, baseline, residual, visualization:Uint8ClampedArray.from(residual,(value,index)=>index%4===3?255:128+2*value) };
  let imageRequests=0;
  class TestImage { decode() { return failFirstImage && imageRequests++===0 ? Promise.reject(new Error('test load failure')) : Promise.resolve(); } }
  const entry = name === 'TransferCheckPanel' ? path.join(__dirname, 'TransferableExperiencePage/TransferCheckPanel.tsx') : path.join(__dirname, name, name + '.tsx');
  const exports = load(entry, {
    react, '../../../shared/react': shared, '../../hooks/useCompleteOnce': completeHook,
    '../../components/RtgQuestion/RtgQuestion': { RtgQuestion },
    '../../components/ParameterRange/ParameterRange': range,
    '../../components/TransferVisuals/TransferVisuals': transferVisuals,
    '../../hooks/useTeachingPlayback': playbackHook,
    './pixels': { preparePixels: () => fixture, reconstructPixels: pixelModel.reconstructPixels },
    './connections': blockConnections,
    './motion': superResolutionMotion,
    './scene': superResolutionScene,
    './model': startingModel,
    '../../../shared/react/withAssetResources': { withAssetResources: Component => Component },
    './classification': transferClassification,
    './TransferCheckPanel': { TransferCheckPanel },
    '../../services/aiShortAnswer': { evaluateAiShortAnswer: serviceMocks.evaluateAiShortAnswer || (() => { throw Error('Unexpected AI request'); }) },
  }, { window, Image: TestImage, requestAnimationFrame: window.requestAnimationFrame, ...browserMocks });
  const onComplete = () => calls++;
  return { exports, get calls() { return calls; }, get timers() { return timers; }, get frames() { return frames; },
    render(extraProps = {}) {
      let repeat = 0;
      do {
        dirty = false; cursor = 0; refCursor = 0; effectCursor = 0; memoCursor = 0; pending = [];
        tree = exports[name]({ onComplete, ...extraProps }); pending.forEach(fn => fn());
        if (++repeat > 20) throw Error('Effect render loop');
      } while (dirty);
      return tree;
    },
    interval() { [...timers.values()].filter(timer => timer.interval).forEach(timer => timer.fn()); return this.render(); },
    timeout() { [...timers].filter(([, timer]) => !timer.interval).forEach(([id, timer]) => { timers.delete(id); timer.fn(); }); return this.render(); },
    frame(time) { const work = [...frames.values()]; frames.clear(); work.forEach(fn => fn(time)); return this.render(); },
    dispose() { cleanups.forEach(fn => fn?.()); },
  };
}
function button(tree, label) {
  const target = elements(tree).find(node => (node.type === shared.Button || node.type === 'button')
    && (text(node) === label || node.props['aria-label'] === label));
  assert.ok(target, label); return target;
}
function click(tree, label) { const node = button(tree, label); assert.ok(!node.props.disabled, label); node.props.onClick(); }
function byData(tree, attribute, value) {
  const node = elements(tree).find(node => attribute in node.props && node.props[attribute] === value); assert.ok(node, attribute + ':' + value); return node;
}
function finishResidualDerivation(app, tree) {
  for (let clip = 0; clip < 2; clip++) {
    if (clip > 0) { byData(tree, 'data-advance', true).props.onClick(); tree = app.render(); }
    if (tree.props['data-animation-playing']) tree = app.timeout();
  }
  assert.equal(tree.props['data-stage'], 1);
  return tree;
}
function checkMarkup(tree, expectHeader = true) {
  const html = renderToStaticMarkup(tree);
  assert.equal(html.includes('edu-content-head'), expectHeader); assert.ok(!html.includes('[object Object]')); assert.ok(!html.includes('NaN'));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]); assert.equal(ids.length, new Set(ids).size);
  for (const match of html.matchAll(/data-latex="([^"]+)"/g)) assert.ok(!match[1].includes('\\\\'), 'double-escaped math: ' + match[1]);
  return html;
}

test('page23 names the old question, swipes away only its head, then retains three-sample observation and the original check', () => {
  const app=harness('ReplaceHeadPage');let tree=app.render();checkMarkup(tree);
  assert.equal(tree.props['data-phase'],'old');
  assert.equal(tree.props.subtitle,'保留预训练视觉骨干，只替换负责输出类别分数的最后一段。');
  assert.ok(text(tree).includes('它属于哪个旧类别？'));assert.ok(text(tree).includes('例如：猫、狗、汽车'));
  const backbone=renderToStaticMarkup(byData(tree,'data-retained-backbone',true));
  assert.ok(backbone.includes('保留结构与预训练参数'));
  assert.equal(byData(tree,'data-install-head',true).props.disabled,true);
  byData(tree,'data-install-head',true).props.onClick();tree=app.render();assert.equal(tree.props['data-phase'],'old');
  const remove=byData(tree,'data-remove-head',true).props.onClick;
  remove();tree=app.render();assert.equal(tree.props['data-phase'],'removing');assert.equal(app.timers.size,1);
  assert.equal(byData(tree,'data-remove-head',true).props.disabled,true);assert.equal(byData(tree,'data-install-head',true).props.disabled,true);
  remove();tree=app.render();assert.equal(tree.props['data-removal-frame'],0);assert.equal(app.timers.size,1);
  for(let frame=1;frame<=2;frame++){
    tree=app.interval();assert.equal(tree.props['data-phase'],'removing');assert.ok(text(tree).includes('它属于哪个旧类别？'));
    assert.equal(renderToStaticMarkup(byData(tree,'data-retained-backbone',true)),backbone);
  }
  tree=app.interval();assert.equal(tree.props['data-phase'],'removed');assert.equal(app.timers.size,0);
  assert.ok(text(tree).includes('接口空缺'));assert.ok(!text(tree).includes('它属于哪个旧类别？'));assert.equal(app.calls,0);
  assert.equal(byData(tree,'data-install-head',true).props.disabled,false);
  byData(tree,'data-install-head',true).props.onClick();tree=app.render();assert.equal(tree.props['data-phase'],'new');assert.ok(text(tree).includes('3 类分数'));
  assert.ok(!elements(tree).some(node=>node.type===RtgQuestion));assert.equal(app.calls,0);
  for(const id of ['bottle','can','carton']){
    byData(tree,'data-sample-id',id).props.onClick();tree=app.render();
    assert.equal(renderToStaticMarkup(byData(tree,'data-retained-backbone',true)),backbone);
  }
  const question=elements(tree).find(node=>node.type===RtgQuestion);assert.equal(question.props.questionId,'new-output-count');
  question.props.onCheck({ok:false,answer:['channels']});tree=app.render();assert.equal(app.calls,0);
  question.props.onCheck({ok:true,answer:['classes']});tree=app.render();assert.equal(tree.props['data-complete'],true);assert.equal(app.calls,1);
  byData(tree,'data-sample-id','bottle').props.onClick();tree=app.render();checkMarkup(tree);assert.equal(app.calls,1);app.dispose();
});

test('page23 reduced motion skips the swipe wait and leaving the page cancels pending removal', () => {
  const reduced=harness('ReplaceHeadPage',true);let tree=reduced.render();byData(tree,'data-remove-head',true).props.onClick();tree=reduced.render();
  assert.equal(tree.props['data-phase'],'removed');assert.equal(reduced.timers.size,0);assert.equal(reduced.calls,0);reduced.dispose();
  const app=harness('ReplaceHeadPage');tree=app.render();byData(tree,'data-remove-head',true).props.onClick();tree=app.render();
  const stale=[...app.timers.values()][0].fn;tree=app.interval();assert.equal(tree.props['data-removal-frame'],1);
  app.dispose();assert.equal(app.timers.size,0);stale();tree=app.render();assert.equal(tree.props['data-removal-frame'],1);assert.equal(tree.props['data-phase'],'removing');assert.equal(app.calls,0);
  const css=fs.readFileSync(path.join(__dirname,'ReplaceHeadPage/ReplaceHeadPage.css'),'utf8');require('postcss').parse(css);
  assert.ok(css.includes('rtg-head-swipe-away 960ms'));assert.ok(css.includes('prefers-reduced-motion'));assert.ok(!/font-size|font-weight|line-height/.test(css));
  assert.ok(!/backbone[^{}]*\{[^}]*animation/.test(css),'retained backbone must stay still');
});

test('page22 keeps six prominent clues together, explains mistakes and opens a second act before reporting completion', () => {
  const app=harness('TransferableExperiencePage');let tree=app.render();checkMarkup(tree);
  const rows=()=>elements(tree).filter(node=>'data-clue-row' in node.props);
  const choose=(id,category)=>{const target=elements(tree).find(node=>node.props['data-clue-id']===id&&node.props['data-choice']===category);assert.ok(target);target.props.onClick();tree=app.render();};
  assert.equal(rows().length,6);assert.equal(elements(tree).filter(node=>'data-clue-id' in node.props).length,12);
  assert.equal(tree.props['data-act'],0);assert.equal(byData(tree,'data-act-choice',1).props.disabled,true);
  assert.ok(elements(tree).find(node=>node.type===TransferCheckPanel).props.hidden);
  for(const row of rows()){
    const label=elements(row).find(node=>node.type===shared.Typography);
    assert.equal(label.props.variant,'h3');assert.equal(label.props.as,'strong');
  }
  assert.ok(!elements(tree).some(node=>node.type===RtgQuestion||node.type==='form'));
  const title=elements(byData(tree,'data-bucket','reusable')).find(node=>node.type===shared.Typography);
  assert.equal(title.props.variant,'h2');
  byData(tree,'data-check-classification',true).props.onClick();tree=app.render();assert.ok(text(tree).includes('尚未分类：物体边缘'));
  choose('edges','old-task');choose('labels','reusable');
  byData(tree,'data-check-classification',true).props.onClick();tree=app.render();
  assert.ok(text(tree).includes('需调整：“物体边缘”属于可复用表示'));
  assert.ok(text(tree).includes('需调整：“旧任务类别名称”属于旧任务答案'));
  assert.equal(rows().filter(node=>node.props['data-wrong']).length,2);assert.equal(app.calls,0);
  assert.equal(tree.props['data-act'],0);
  assert.ok(text(byData(tree,'data-bucket','old-task')).includes('物体边缘'),'feedback must not silently move a chosen item');
  for(const clue of transferClassification.TRANSFER_CLUES) choose(clue.id,clue.answer);
  assert.equal(tree.props['data-checked'],false);assert.equal(app.calls,0);
  byData(tree,'data-check-classification',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-act'],1);assert.equal(tree.props['data-complete'],false);assert.equal(app.calls,0);
  let review=elements(tree).find(node=>node.type===TransferCheckPanel);assert.equal(review.props.hidden,false);
  review.props.onCheck({ok:false,answer:['same-labels']});tree=app.render();assert.equal(app.calls,0);
  review.props.onCheck({ok:true,answer:['representation']});tree=app.render();assert.equal(app.calls,1);assert.equal(tree.props['data-complete'],true);
  byData(tree,'data-act-choice',0).props.onClick();tree=app.render();assert.equal(tree.props['data-act'],0);assert.ok(text(tree).includes('分类正确'));
  assert.equal(elements(byData(tree,'data-bucket','reusable')).filter(node=>node.type===shared.Typography).length,5);
  assert.equal(elements(byData(tree,'data-bucket','old-task')).filter(node=>node.type===shared.Typography).length,3);
  checkMarkup(tree);byData(tree,'data-reset',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-checked'],false);assert.equal(tree.props['data-complete'],false);
  assert.equal(tree.props['data-act'],0);assert.equal(elements(tree).find(node=>node.type===TransferCheckPanel).props.attempt,1);
  assert.ok(elements(tree).filter(node=>'data-clue-id' in node.props).every(node=>!node.props['aria-pressed']));
  for(const clue of transferClassification.TRANSFER_CLUES) choose(clue.id,clue.answer);
  byData(tree,'data-check-classification',true).props.onClick();tree=app.render();assert.equal(tree.props['data-complete'],false);
  elements(tree).find(node=>node.type===TransferCheckPanel).props.onCheck({ok:true,answer:['representation']});app.render();assert.equal(app.calls,1);app.dispose();
});

test('page22 feedback accounts for every combination of missing and incorrectly assigned clues', () => {
  const {TRANSFER_CLUES:clues,classificationFeedback:feedback}=transferClassification;
  for(let pattern=0;pattern<3**clues.length;pattern++){
    let value=pattern;
    const choices=clues.map(()=>{const choice=[null,'reusable','old-task'][value%3];value=Math.floor(value/3);return choice;});
    const result=feedback(choices);
    assert.deepEqual(plain(result.missing),plain(choices.flatMap((choice,index)=>choice==null?[index]:[])));
    assert.deepEqual(plain(result.wrong),plain(choices.flatMap((choice,index)=>choice!=null&&choice!==clues[index].answer?[index]:[])));
    assert.equal(result.complete,choices.every((choice,index)=>choice===clues[index].answer));
    for(const index of [...result.missing,...result.wrong]) assert.ok(result.message.includes(clues[index].label));
  }
});

test('page22 second act keeps the original question and optional AI together, preserves input and only forwards the question result', async () => {
  let resolveRequest,requests=0;
  const app=harness('TransferCheckPanel',false,false,{}, {evaluateAiShortAnswer:(task,answer)=>{requests++;assert.equal(task,'resnet.transferable_clue');assert.ok(answer.includes('边缘'));return new Promise(resolve=>{resolveRequest=resolve;});}});
  const results=[],onCheck=result=>results.push(result),render=(hidden=false)=>app.render({onCheck,hidden,attempt:2});
  let tree=render();checkMarkup(tree,false);
  const question=elements(tree).find(node=>node.type===RtgQuestion);assert.equal(question.props.questionId,'why-backbone');
  assert.equal(question.props.pageId,'22-transferable-experience:attempt-2');
  assert.ok(elements(tree).some(node=>node.type==='form'));assert.equal(byData(tree,'data-ask-ai',true).props.disabled,true);
  let form=elements(tree).find(node=>node.type==='form');await form.props.onSubmit({preventDefault(){}});assert.equal(requests,0);
  elements(tree).find(node=>node.type===shared.TextInput).props.onChange({currentTarget:{value:'瓶口边缘也能描述新的物体。'}});tree=render();
  form=elements(tree).find(node=>node.type==='form');const pending=form.props.onSubmit({preventDefault(){}});
  await form.props.onSubmit({preventDefault(){}});assert.equal(requests,1);tree=render();
  assert.equal(byData(tree,'data-ask-ai',true).props.loading,true);assert.equal(app.calls,0);
  resolveRequest({verdict:'正确',isCorrect:true,level:'correct',explanation:'边缘线索可跨任务复用。'});await pending;tree=render();
  assert.ok(text(tree).includes('边缘线索可跨任务复用'));assert.equal(results.length,0);
  tree=render(true);assert.equal(tree.props.hidden,true);tree=render(false);assert.ok(text(tree).includes('边缘线索可跨任务复用'));
  question.props.onCheck({ok:false,answer:['same-labels']});question.props.onCheck({ok:true,answer:['representation']});assert.deepEqual(results.map(result=>result.ok),[false,true]);
  byData(tree,'data-edit-reflection',true).props.onClick();tree=render();assert.equal(elements(tree).find(node=>node.type===shared.TextInput).props.value,'瓶口边缘也能描述新的物体。');
  checkMarkup(tree,false);app.dispose();
});

test('optional transfer AI allows retry after failure and ignores a response after leaving the page', async () => {
  let requests=0;
  const app=harness('TransferCheckPanel',false,false,{}, {evaluateAiShortAnswer:async()=>{if(++requests===1)throw Error('offline');return {verdict:'正确',isCorrect:true,explanation:'形状可以迁移。'};}});
  let tree=app.render();elements(tree).find(node=>node.type===shared.TextInput).props.onChange({currentTarget:{value:'形状'}});tree=app.render();
  await elements(tree).find(node=>node.type==='form').props.onSubmit({preventDefault(){}});tree=app.render();
  assert.ok(text(tree).includes('暂时不可用'));assert.equal(app.calls,0);
  byData(tree,'data-edit-reflection',true).props.onClick();tree=app.render();
  await elements(tree).find(node=>node.type==='form').props.onSubmit({preventDefault(){}});tree=app.render();assert.ok(text(tree).includes('形状可以迁移'));assert.equal(requests,2);app.dispose();
  let resolve;
  const leaving=harness('TransferCheckPanel',false,false,{}, {evaluateAiShortAnswer:()=>new Promise(done=>{resolve=done;})});
  tree=leaving.render();elements(tree).find(node=>node.type===shared.TextInput).props.onChange({currentTarget:{value:'边缘'}});tree=leaving.render();
  const pending=elements(tree).find(node=>node.type==='form').props.onSubmit({preventDefault(){}});leaving.dispose();
  resolve({verdict:'正确',isCorrect:true,explanation:'stale feedback'});await pending;tree=leaving.render();assert.ok(!text(tree).includes('stale feedback'));assert.equal(leaving.calls,0);
});

test('page17 restores manual cells, quick fill, ReLU and final check; only top operation selection is removed', () => {
  const app = harness('ElementwiseAdditionPage'); let tree = app.render();
  let html = checkMarkup(tree);
  assert.ok(!/矩阵乘法|左右拼接|选择合并方式/.test(html)); assert.ok(html.includes('<input'));
  const input = () => elements(tree).find(node => node.type === shared.TextInput);
  assert.ok(input().props.className.includes('ui-typography--h3'));
  assert.ok(input().props.className.includes('ui-typography--tone-accent'));
  assert.match(html, /<input[^>]*class="[^"]*rtg-elementwise__answer-input[^"]*ui-typography--h3/);
  click(tree, '填入当前格'); tree = app.render(); assert.ok(text(tree).includes('请输入一个数值'));
  input().props.onChange({currentTarget:{value:'999'}}); tree=app.render();
  click(tree, '填入当前格'); tree = app.render(); assert.ok(text(tree).includes('再看同一坐标'));
  input().props.onChange({currentTarget:{value:'1'}}); tree=app.render();
  click(tree, '填入当前格'); tree=app.render(); assert.ok(text(tree).includes('第 1 行 · 第 2 列'));
  click(tree, '直接得到完整答案'); tree=app.render();
  assert.ok(text(tree).includes('3×3 结果已完成')); assert.equal(app.calls,0);
  const apply = elements(tree).find(node => node.type === shared.Button && text(node).includes('观察 ReLU 变换'));
  assert.ok(apply); apply.props.onClick(); tree=app.render();
  assert.equal(tree.props['data-relu-playing'], true); assert.equal(tree.props['data-relu-count'], 0);
  const matrices = () => elements(tree).filter(node => typeof node.type === 'function' && node.type.name === 'Matrix');
  assert.equal(matrices().length, 2);
  assert.deepEqual(plain(matrices()[0].props.values), [1,3,0,1,-1,3,1,1,-2]);
  assert.deepEqual(plain(matrices()[1].props.values), Array(9).fill(null));
  assert.ok(!elements(tree).some(node => node.type === RtgQuestion));
  for(let i=0;i<5;i++) tree=app.interval();
  assert.equal(matrices()[0].props.values[4],-1); assert.equal(matrices()[1].props.values[4],0);
  assert.equal(matrices()[0].props.active,4); assert.equal(matrices()[1].props.active,4);
  for(let i=5;i<9;i++) tree=app.interval();
  assert.equal(tree.props['data-relu-playing'], false); assert.equal(app.timers.size,0);
  html = checkMarkup(tree); assert.ok(html.includes('is-clamped')); assert.ok(html.includes('ReLU 后输出'));
  const question = elements(tree).find(node => node.type === RtgQuestion);
  assert.ok(question); assert.equal(question.props.questionId,'same-shape'); assert.equal(app.calls,0);
  question.props.onCheck({ok:false}); tree=app.render(); assert.equal(app.calls,0);
  question.props.onCheck({ok:true}); tree=app.render(); assert.equal(app.calls,1); assert.equal(tree.props['data-complete'],true);
  app.dispose();
});
test('page17 allows entering all nine correct sums without a preliminary quiz', () => {
  const app=harness('ElementwiseAdditionPage'); let tree=app.render();
  for(const value of [1,3,0,1,-1,3,1,1,-2]) {
    const entry=elements(tree).find(node=>node.type===shared.TextInput);
    assert.ok(!entry.props.disabled); entry.props.onChange({currentTarget:{value:String(value)}}); tree=app.render();
    click(tree,'填入当前格'); tree=app.render();
  }
  assert.ok(text(tree).includes('3×3 结果已完成')); assert.equal(app.calls,0); checkMarkup(tree); app.dispose();
});

test('page18 restores separate spatial and channel experiments, their values, addition and the original check', () => {
  const app=harness('ProjectionShortcutPage'); let tree=app.render(); checkMarkup(tree);
  assert.equal(tree.props.title,'形状不一样，怎样对齐后再相加？');
  assert.equal(tree.props.subtitle,'先对齐空间尺寸和通道数，再把对应位置的数值相加。');
  const outline=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../outlines.json'),'utf8'));
  assert.equal(outline.pages.find(page=>page.id==='18-projection-shortcut').title,tree.props.title);
  const course=fs.readFileSync(path.resolve(__dirname,'../course.tsx'),'utf8');
  assert.equal(course.match(/id: '18-projection-shortcut',\s*title: '([^']+)'/)[1],tree.props.title);
  assert.equal(tree.props['data-mode'],'overview'); assert.equal(tree.props['data-complete'],false);
  assert.ok(byData(tree,'data-open-mechanism','space').props.disabled);
  click(tree,'尝试直接相加'); tree=app.render(); assert.equal(tree.props['data-conflict'],true);
  byData(tree,'data-open-mechanism','space').props.onClick(); tree=app.render();
  assert.equal(tree.props['data-mode'],'space');
  assert.ok(!elements(tree).some(node=>'data-apply' in node.props));
  for(const index of [0,1,2,3]){byData(tree,'data-compute',index).props.onClick();tree=app.render();}
  const samples=elements(tree).filter(node=>'data-source' in node.props);
  assert.deepEqual(samples.map(node=>node.props['data-value']),[1,3,9,11]);
  byData(tree,'data-apply',true).props.onClick(); tree=app.render(); assert.equal(tree.props['data-spatial'],true); assert.equal(tree.props['data-channels'],false);
  byData(tree,'data-open-mechanism','channels').props.onClick(); tree=app.render();
  for(const index of [0,1,2]){byData(tree,'data-compute',index).props.onClick();tree=app.render();}
  assert.deepEqual(elements(tree).filter(node=>'data-compute' in node.props).map(node=>node.props['data-value']),[6,3,2]);
  byData(tree,'data-apply',true).props.onClick();tree=app.render();assert.equal(tree.props['data-channels'],true);assert.equal(app.calls,0);
  click(tree,'验证两路逐元素相加');tree=app.render();assert.equal(tree.props['data-added'],true);
  click(tree,'查看理解检查');tree=app.render();
  const question=elements(tree).find(node=>node.type===RtgQuestion);assert.ok(question);
  question.props.onCheck({ok:false});tree=app.render();assert.equal(app.calls,0);
  question.props.onCheck({ok:true});tree=app.render();assert.equal(app.calls,1);checkMarkup(tree);
  app.dispose();
});

test('page18 restored version supports reversing the experiment order, undo and complete reset', () => {
  const app=harness('ProjectionShortcutPage',true);let tree=app.render();click(tree,'尝试直接相加');tree=app.render();
  for(const kind of ['channels','space']){
    byData(tree,'data-open-mechanism',kind).props.onClick();tree=app.render();
    for(let index=0;index<(kind==='space'?4:3);index++){byData(tree,'data-compute',index).props.onClick();tree=app.render();}
    byData(tree,'data-apply',true).props.onClick();tree=app.render();assert.equal(tree.props['data-motion'],'');
  }
  byData(tree,'data-undo','space').props.onClick();tree=app.render();
  assert.equal(tree.props['data-spatial'],false);assert.equal(tree.props['data-channels'],true);assert.equal(tree.props['data-added'],false);
  elements(tree).find(node=>'data-reset' in node.props).props.onClick();tree=app.render();
  for(const flag of ['data-conflict','data-spatial','data-channels','data-added','data-complete']) assert.equal(tree.props[flag],false);
  assert.equal(tree.props['data-mode'],'overview');checkMarkup(tree);app.dispose();
});

test('page19 separates x and correction, removes the F-plus-target sign, and reveals the full output only after the merge', () => {
  const app = harness('ShortcutGradientPage'); let tree = app.render();
  const toggle = elements(tree).find(node => 'data-toggle-shortcut' in node.props); toggle.props.onClick(); tree = app.render();
  byData(tree, 'data-forward-node', 1).props.onClick(); tree = app.render();
  byData(tree, 'data-forward-node', 2).props.onClick(); tree = app.render();
  let html = checkMarkup(tree); assert.ok(html.includes('相加后的输出 H(x)'));
  const structuralPlus = elements(tree).filter(node => node.type === shared.Typography && node.props.variant === 'h2' && text(node) === '+');
  assert.equal(structuralPlus.length, 0);
  byData(tree, 'data-forward-node', 3).props.onClick(); tree = app.render();
  assert.equal(tree.props['data-merging'], true); assert.equal(tree.props['data-step'], 2); assert.equal(app.calls, 0);
  html = checkMarkup(tree); assert.ok(html.includes('merge-input')); assert.ok(html.includes('merge-residual'));
  tree = app.timeout(); assert.equal(tree.props['data-merging'], false); assert.equal(tree.props['data-step'], 3);
  html = checkMarkup(tree); assert.ok(html.includes('保留的输入加修正量等于完整输出')); assert.ok(html.includes('data-latex="x"')); assert.ok(html.includes('data-latex="F(x)"')); assert.ok(html.includes('data-latex="H(x)"'));
  byData(tree, 'data-forward-node', 3).props.onClick(); tree = app.render();
  assert.equal(tree.props['data-merging'], true); assert.equal(tree.props['data-step'], 2);
  tree = app.timeout(); assert.equal(tree.props['data-step'], 3); assert.equal(app.timers.size, 0); app.dispose();
});
test('page19 cancels merge on mode change, and reduced motion preserves the forward/backward completion rules', () => {
  const app = harness('ShortcutGradientPage'); let tree = app.render();
  elements(tree).find(node => 'data-toggle-shortcut' in node.props).props.onClick(); tree = app.render();
  for (const index of [1, 2, 3]) { byData(tree, 'data-forward-node', index).props.onClick(); tree = app.render(); }
  const stale = [...app.timers.values()][0].fn;
  byData(tree, 'data-experiment-tab', 1).props.onClick(); tree = app.render(); stale(); tree = app.render();
  assert.equal(tree.props['data-experiment'], 1); assert.equal(tree.props['data-step'], 0); assert.equal(app.timers.size, 0); app.dispose();
  const reduced = harness('ShortcutGradientPage', true); tree = reduced.render();
  elements(tree).find(node => 'data-toggle-shortcut' in node.props).props.onClick(); tree = reduced.render();
  for (const index of [1, 2, 3]) { byData(tree, 'data-forward-node', index).props.onClick(); tree = reduced.render(); }
  assert.equal(tree.props['data-step'], 3); assert.equal(reduced.timers.size, 0); assert.equal(reduced.calls, 0);
  for (const mode of [1, 2]) {
    byData(tree, 'data-experiment-tab', mode).props.onClick(); tree = reduced.render();
    for (const index of [3, 2, 1, 0]) { byData(tree, 'data-gradient-node', index).props.onClick(); tree = reduced.render(); }
    checkMarkup(tree);
  }
  assert.equal(reduced.calls, 1); assert.equal(tree.props['data-complete'], true);
  elements(tree).find(node => 'data-reset' in node.props).props.onClick(); tree = reduced.render(); assert.equal(tree.props['data-complete'], false); reduced.dispose();
});
test('revised pages keep token-based, shrinkable layouts and Shared typography', () => {
  for (const name of ['BasicBlockPage', 'IdentityRoutePage', 'ElementwiseAdditionPage', 'ResNetAssemblyPage', 'PretrainingPage', 'StartingPointsPage', 'FreezeFineTunePage', 'StrategyMapPage', 'TransferWorkflowPage', 'SuperResolutionPage']) {
    const css = fs.readFileSync(path.join(__dirname, name, name + '.css'), 'utf8');
    require('postcss').parse(css); assert.ok(!/font-size|font-weight|line-height|#[0-9a-f]{3,8}\b|overflow\s*:\s*hidden/i.test(css));
    assert.ok(css.includes('minmax(0,') || css.includes('flex:1 1 0'),name+' must use shrinkable grid or flex tracks'); assert.ok(css.includes('prefers-reduced-motion'));
    if (name === 'ElementwiseAdditionPage') {
      const entry = require('postcss').parse(css).nodes.find(node => node.selector === '.course-shell .rtg-elementwise__entry');
      assert.equal(entry.nodes.find(node => node.prop === 'align-content').value, 'center', 'page14 entry controls must be vertically centered');
      assert.equal(entry.nodes.find(node => node.prop === 'align-self').value, 'stretch', 'page14 keeps the full-height right column and separator');
      const answer = require('postcss').parse(css).nodes.find(node => node.selector === '.course-shell .rtg-elementwise__entry .rtg-elementwise__answer-input');
      assert.equal(answer.nodes.find(node => node.prop === 'height').value, '64px', 'page14 answer field fits the enlarged Shared h3 value');
      assert.equal(answer.nodes.find(node => node.prop === 'text-align').value, 'center');
    }
  }
});
test('page17 ReLU replay keeps the input matrix immutable, supports reduced motion and cancels stale timers', () => {
  const reduced=harness('ElementwiseAdditionPage',true); let tree=reduced.render();
  click(tree,'直接得到完整答案'); tree=reduced.render();
  elements(tree).find(node=>node.type===shared.Button&&text(node).includes('观察 ReLU 变换')).props.onClick(); tree=reduced.render();
  assert.equal(tree.props['data-relu-count'],9); assert.equal(tree.props['data-relu-playing'],false);
  assert.equal(reduced.calls,0); assert.equal(reduced.timers.size,0);
  click(tree,'重放ReLU逐位置变换'); tree=reduced.render(); assert.equal(tree.props['data-relu-count'],9); checkMarkup(tree); reduced.dispose();
  const normal=harness('ElementwiseAdditionPage'); tree=normal.render(); click(tree,'直接得到完整答案'); tree=normal.render();
  elements(tree).find(node=>node.type===shared.Button&&text(node).includes('观察 ReLU 变换')).props.onClick(); tree=normal.render();
  const stale=[...normal.timers.values()][0].fn; normal.dispose(); stale(); tree=normal.render();
  assert.equal(tree.props['data-relu-count'],0); assert.equal(normal.timers.size,0);
});
test('page20 merges structure, shapes and naming into exactly six direct actions with no modes or end quiz', () => {
  const app=harness('ResNetAssemblyPage');let tree=app.render();
  const expectedCounts=[0,1,5,9,13,17,18],expectedBlocks=[0,0,2,4,6,8,8];
  let html=checkMarkup(tree);assert.ok(!/组装网络|跟随特征流动|理解18层命名|点亮一层|自动播放|装配检查/.test(html));
  assert.equal(elements(tree).filter(node=>'data-assembly-step' in node.props).length,6);
  assert.ok(byData(tree,'data-assembly-step',2).props.disabled);
  byData(tree,'data-assembly-step',6).props.onClick();tree=app.render();assert.equal(tree.props['data-built'],0);
  for(let step=1;step<=6;step++){
    byData(tree,'data-assembly-step',step).props.onClick();tree=app.render();
    assert.equal(tree.props['data-built'],step);assert.equal(tree.props['data-focus'],step);
    assert.equal(tree.props['data-count'],expectedCounts[step]);assert.equal(tree.props['data-blocks'],expectedBlocks[step]);
    assert.equal(app.calls,step===6?1:0);html=checkMarkup(tree);
    if(step<=5)assert.ok(html.includes('data-output-shape="'+app.exports.ASSEMBLY_STEPS[step-1].latex+'"'));
  }
  assert.ok(html.includes('ResNet-18'));assert.ok(html.includes('命名结论'));assert.ok(html.includes('17 个卷积层'));
  assert.ok(html.includes('捷径投影不计入该命名'));assert.ok(!elements(tree).some(node=>node.type===RtgQuestion));
  assert.equal(app.timers.size,0);assert.equal(app.frames.size,0);
  byData(tree,'data-assembly-step',2).props.onClick();tree=app.render();
  assert.equal(tree.props['data-focus'],2);assert.equal(tree.props['data-built'],6);assert.equal(tree.props['data-count'],18);assert.equal(app.calls,1);
  click(tree,'重新开始');tree=app.render();assert.equal(tree.props['data-built'],0);assert.equal(tree.props['data-count'],0);
  for(let step=1;step<=6;step++){byData(tree,'data-assembly-step',step).props.onClick();tree=app.render();}
  assert.equal(app.calls,1);app.dispose();
});
test('page20 pure sequence rejects skipping and repeated clicks cannot inflate layer counts', () => {
  const app=harness('ResNetAssemblyPage');const {assemblyTotals,assemblyTransition,INITIAL_ASSEMBLY}=app.exports;
  const initial=plain(INITIAL_ASSEMBLY);Object.freeze(initial);
  for(const step of [0,3,7,-1,1.5,NaN])assert.equal(assemblyTransition(initial,step),initial);
  let state=initial;
  for(let step=1;step<=6;step++){
    state=assemblyTransition(state,step);const before=state.built;
    state=assemblyTransition(state,step);assert.equal(state.built,before);
  }
  assert.deepEqual(plain(assemblyTotals(state.built)),{stages:4,blocks:8,stem:1,blockConvs:16,fc:1,layers:18});
  assert.deepEqual(plain(assemblyTotals(-20)),{stages:0,blocks:0,stem:0,blockConvs:0,fc:0,layers:0});
  assert.equal(assemblyTotals(100).layers,18);app.dispose();
});

test('page20 dimensions retain their wrap point while larger diagrams and locally smaller formulas stay in aligned tracks', () => {
  const app=harness('ResNetAssemblyPage');let tree=app.render();
  for(let step=1;step<=6;step++){
    byData(tree,'data-assembly-step',step).props.onClick();tree=app.render();
    for(let index=0;index<step;index++){
      const stage=app.exports.ASSEMBLY_STEPS[index];
      const shape=byData(tree,'data-output-shape',stage.latex);
      const terms=elements(shape).filter(node=>node.type===shared.MathFormulaStatic).map(node=>node.props.latex);
      assert.deepEqual(terms,index===5?[stage.latex]:[stage.shape[0]+'\\times'+stage.shape[0],'\\times'+stage.shape[1]]);
      assert.ok(!terms.some(term=>term.split('\\times').length>2),'single unbreakable H×W×C formula');
    }
    checkMarkup(tree);
  }
  const css=require('postcss').parse(fs.readFileSync(path.join(__dirname,'ResNetAssemblyPage/ResNetAssemblyPage.css'),'utf8'));
  const declarations=selector=>Object.fromEntries(css.nodes.find(node=>node.selector===selector).nodes.map(node=>[node.prop,node.value]));
  const columns=declarations('.course-shell .rtg-assembly__pipeline')['grid-template-columns'];
  assert.ok(columns.includes('repeat(2,minmax(0,1.25fr))'),'Stem and Stage 1 must have equal width');
  const tracks=declarations('.course-shell .rtg-assembly__node > span');
  assert.equal(tracks.display,'grid');assert.equal(tracks['grid-template-rows'],'40px minmax(0,1fr) 104px 40px');
  const shape=declarations('.course-shell .rtg-assembly__shape .math-formula-block');
  assert.equal(shape.width,'100%');assert.equal(shape['--ui-type-formula-size'],'var(--ui-type-body-small-size)');
  assert.equal(declarations('.course-shell .rtg-assembly__block-icon, .course-shell .rtg-assembly__single-icon').height,'104px');
  const formulaOverrides=css.nodes.filter(node=>node.type==='rule'&&node.nodes.some(decl=>decl.prop==='--ui-type-formula-size'));
  assert.deepEqual(formulaOverrides.map(rule=>rule.selector),['.course-shell .rtg-assembly__shape .math-formula-block']);
  app.dispose();
});

test('current page20 completes through three distinct observations while pretrained weights remain available from the start', () => {
  const app=harness('PretrainingPage');let tree=app.render();let html=checkMarkup(tree);
  assert.ok(html.includes('边缘、线条、明暗变化'));assert.ok(html.includes('纹理、拐角、局部形状'));assert.ok(html.includes('基础部件'));
  assert.equal(elements(tree).filter(node=>node.type==='img').length,1);
  assert.equal(elements(tree).filter(node=>'data-cue-choice' in node.props).length,3);
  assert.ok(!/观察参数更新|data-parameter=|理解检查|data-candidate=/.test(html));
  assert.ok(!/data-save|保存参数|参数已保存/.test(html));
  assert.ok(!elements(tree).some(node=>node.type===RtgQuestion));
  assert.equal(tree.props['data-cue'],2);assert.equal(tree.props['data-seen'],'');assert.equal(tree.props['data-complete'],false);
  assert.equal(elements(tree).filter(node=>'data-observed-cue' in node.props).length,0);
  assert.equal(text(byData(tree,'data-weight-status','pretrained')),'已训练 · 可复用');
  assert.equal(app.calls,0);
  const photo=elements(tree).find(node=>node.type==='img').props.src;
  const seen=new Set();
  for(const index of [2,0,2,1]) {
    byData(tree,'data-cue-choice',index).props.onClick();tree=app.render();
    seen.add(index);
    assert.equal(tree.props['data-cue'],index);assert.ok(byData(tree,'data-highlight',index));
    assert.ok(byData(tree,'data-weight-connector',index));
    assert.equal(elements(tree).filter(node=>'data-observed-cue' in node.props).length,seen.size);
    assert.equal(byData(tree,'data-cue-choice',index).props['data-inspected'],true);
    assert.equal(app.calls,seen.size===3?1:0);
    assert.equal(text(byData(tree,'data-weight-status','pretrained')),'已训练 · 可复用');
    assert.equal(elements(tree).find(node=>node.type==='img').props.src,photo);checkMarkup(tree);
  }
  assert.equal(app.calls,1);assert.equal(tree.props['data-complete'],true);
  const conclusion=byData(tree,'data-pretraining-conclusion',true);
  assert.equal(conclusion.type,shared.Typography);assert.equal(conclusion.props.as,'h2');assert.equal(conclusion.props.variant,'h3');
  assert.equal(text(conclusion),'视觉经验保存在预训练参数中。');
  assert.match(text(tree),/这些参数，是新任务的起点/);
  assert.equal(app.timers.size,0);app.dispose();
});

test('current page20 reset clears only observations, preserves pretrained status and deduplicates completion after review', () => {
  const app=harness('PretrainingPage',true);let tree=app.render();
  for(const index of [0,2,0]) { byData(tree,'data-cue-choice',index).props.onClick();tree=app.render(); }
  assert.equal(tree.props['data-complete'],false);assert.equal(app.calls,0);
  assert.equal(elements(tree).filter(node=>'data-observed-cue' in node.props).length,2);
  byData(tree,'data-reset',true).props.onClick();tree=app.render();assert.equal(tree.props['data-seen'],'');assert.equal(tree.props['data-cue'],2);
  for(let repeat=0;repeat<2;repeat++){
    assert.equal(elements(tree).filter(node=>'data-observed-cue' in node.props).length,0);
    assert.equal(text(byData(tree,'data-weight-status','pretrained')),'已训练 · 可复用');
    for(const index of [1,0,2]) { byData(tree,'data-cue-choice',index).props.onClick();tree=app.render(); }
    assert.equal(app.calls,1);assert.equal(tree.props['data-complete'],true);
    byData(tree,'data-cue-choice',0).props.onClick();tree=app.render();assert.equal(app.calls,1);
    byData(tree,'data-reset',true).props.onClick();tree=app.render();assert.equal(tree.props['data-complete'],false);
    assert.equal(tree.props['data-seen'],'');
  }
  assert.equal(app.timers.size,0);app.dispose();
});

test('current page21 starts with one model and reveals theta before loading its existing backbone', () => {
  const app=harness('StartingPointsPage');let tree=app.render();let html=checkMarkup(tree);
  assert.equal(tree.props['data-phase'],0);assert.equal(tree.props['data-loaded'],false);assert.equal(tree.props['data-loading'],false);
  assert.equal(elements(tree).filter(node=>'data-parameter-side' in node.props).length,0);
  assert.equal((html.match(/data-architecture="single"/g)||[]).length,1);
  assert.equal((html.match(/data-new-head="true"/g)||[]).length,1);
  assert.equal((html.match(/data-backbone-glyph="true"/g)||[]).length,5);
  assert.ok(!html.includes('rtg-starting__weight-file'));
  assert.ok(byData(tree,'data-phase-choice',1).props.disabled);
  byData(tree,'data-phase-choice',1).props.onClick();tree=app.render();assert.equal(tree.props['data-phase'],0);
  byData(tree,'data-load',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-loading'],true);assert.equal(tree.props['data-loaded'],false);
  assert.ok(byData(tree,'data-load',true).props.disabled);assert.ok(checkMarkup(tree).includes('rtg-starting__weight-file'));
  byData(tree,'data-load',true).props.onClick();tree=app.render();assert.equal(tree.props['data-load-frame'],0);
  for(let frame=1;frame<=3;frame++){
    tree=app.interval();assert.equal(tree.props['data-load-frame'],frame);
    assert.equal(tree.props['data-loaded'],frame===3);assert.equal(tree.props['data-phase'],0);
  }
  html=checkMarkup(tree);assert.equal((html.match(/data-backbone-glyph="true"/g)||[]).length,5);
  assert.equal((html.match(/data-new-head="true"/g)||[]).length,1);
  assert.ok(html.includes('✓ 已装入预训练权重'));assert.equal(app.timers.size,0);
  byData(tree,'data-open-comparison',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-phase'],1);assert.equal(tree.props['data-compared'],'0');
  assert.equal(elements(tree).filter(node=>'data-neighbor-side' in node.props).length,16);
  assert.equal(byData(tree,'data-parameter-side','A').props['data-parameter-source'],'随机初始化');
  assert.equal(byData(tree,'data-parameter-side','B').props['data-parameter-source'],'预训练权重');
  assert.equal(app.calls,0);checkMarkup(tree);app.dispose();
});

test('current page21 changes the common input in both A/B panels, keeps weights fixed and retains the original single check', () => {
  const app=harness('StartingPointsPage',true);let tree=app.render();
  byData(tree,'data-load',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-loaded'],true);assert.equal(tree.props['data-phase'],0);
  byData(tree,'data-open-comparison',true).props.onClick();tree=app.render();
  assert.equal(text(byData(tree,'data-change-input',true)),'点击改变输入');
  assert.ok(!elements(tree).some(node=>'data-open-quiz' in node.props));
  const initialBottleOrder=elements(tree).filter(node=>node.props['data-neighbor-side']==='B').map(node=>node.props['data-sample-id']);
  for(let query=0;query<4;query++){
    if(query>0){byData(tree,query%2?'data-query-input':'data-change-input',true).props.onClick();tree=app.render();}
    assert.equal(tree.props['data-query'],query);
    const a=byData(tree,'data-parameter-side','A'),b=byData(tree,'data-parameter-side','B');
    assert.equal(a.props['data-input-id'],startingModel.getQuerySamples()[query].id);
    assert.equal(b.props['data-input-id'],a.props['data-input-id']);
    assert.equal(a.props['data-parameter-status'],'random');assert.equal(b.props['data-parameter-status'],'loaded');
    assert.equal(tree.props['data-loaded'],true);assert.equal(app.calls,0);
    for(const side of ['A','B'])assert.equal(elements(tree).filter(node=>node.props['data-neighbor-side']===side).length,8);
    if(query===1)assert.notDeepEqual(elements(tree).filter(node=>node.props['data-neighbor-side']==='B').map(node=>node.props['data-sample-id']),initialBottleOrder);
    assert.ok(!/同时训练一轮|同步训练|回看上一轮|data-train/.test(checkMarkup(tree)));
  }
  byData(tree,'data-open-quiz',true).props.onClick();tree=app.render();
  const question=elements(tree).find(node=>node.type===RtgQuestion);assert.ok(question);
  assert.equal(question.props.questionId,'same-network-different-start');
  question.props.onCheck({ok:false});tree=app.render();assert.equal(app.calls,0);
  question.props.onCheck({ok:true});tree=app.render();assert.equal(app.calls,1);assert.equal(tree.props['data-complete'],true);
  byData(tree,'data-phase-choice',0).props.onClick();tree=app.render();assert.equal(tree.props['data-loaded'],true);assert.equal(tree.props['data-quiz'],false);
  byData(tree,'data-open-comparison',true).props.onClick();tree=app.render();assert.equal(tree.props['data-query'],3);
  byData(tree,'data-reset',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-phase'],0);assert.equal(tree.props['data-loaded'],false);assert.equal(tree.props['data-query'],0);
  assert.equal(tree.props['data-compared'],'');assert.equal(tree.props['data-complete'],false);assert.equal(app.timers.size,0);app.dispose();
});

test('current page21 uses eight identical candidates per side, excludes self-matches and groups four visual variants in the pretrained example', () => {
  for(let index=0;index<startingModel.getQuerySamples().length;index++){
    const input=startingModel.getQuerySamples()[index],a=startingModel.neighborsFor(index,false),b=startingModel.neighborsFor(index,true);
    assert.equal(a.length,8);assert.equal(b.length,8);
    assert.equal(new Set(a.map(item=>item.id)).size,8);assert.equal(new Set(b.map(item=>item.id)).size,8);
    assert.deepEqual([...a].map(item=>item.id).sort(),[...b].map(item=>item.id).sort());
    assert.ok(a.every(item=>item.image!==input.image));assert.ok(b.every(item=>item.image!==input.image));
    assert.ok(b.slice(0,4).every(item=>item.category===input.category));
    assert.ok(a.slice(0,2).every(item=>item.category!==input.category));
    if(input.category===0){assert.ok(b.slice(0,4).some(item=>/压扁/.test(item.label)));assert.ok(b.slice(0,4).some(item=>/直立/.test(item.label)));}
  }
  const assetRoot=path.resolve(__dirname,'../assets/starting-points');
  for(const sample of [...startingModel.getQuerySamples(),...startingModel.getCandidateSamples()]){
    const frame=startingFrames[sample.id],photo=path.resolve(assetRoot,frame.file);assert.ok(fs.existsSync(photo),photo);
    const [left,top,width,height]=sample.viewBox.split(' ').map(Number);
    assert.ok(left>=0&&top>=0&&width>0&&height>0&&left+width<=sample.width&&top+height<=sample.height);
    assert.ok(sample.image.startsWith('/test/'));
    if(photo.endsWith('.jpg'))assert.equal(fs.readFileSync(photo).readUInt16BE(0),0xffd8);
  }
  assert.ok(startingFrames['query-bottle-flat'].source.includes('瓶07_压扁.jpg'));
  const [, ,flatWidth,flatHeight]=startingFrames['query-bottle-flat'].viewBox.split(' ').map(Number);
  assert.ok(flatWidth/flatHeight>1.5,'crushed query should expose the flattened horizontal silhouette');
});

test('current page21 reset and unmount cancel weight loading while reduced motion preserves an explicit comparison step', () => {
  for(const ending of ['reset','unmount']){
    const app=harness('StartingPointsPage');let tree=app.render();byData(tree,'data-load',true).props.onClick();tree=app.render();
    tree=app.interval();const stale=[...app.timers.values()][0].fn;
    if(ending==='reset'){byData(tree,'data-reset',true).props.onClick();tree=app.render();}else app.dispose();
    stale();tree=app.render();
    assert.equal(tree.props['data-loaded'],false);assert.equal(app.calls,0);assert.equal(app.timers.size,0);
    if(ending==='reset'){
      assert.equal(tree.props['data-loading'],false);assert.equal(tree.props['data-load-frame'],0);
      byData(tree,'data-load',true).props.onClick();tree=app.render();for(let i=0;i<3;i++)tree=app.interval();
      assert.equal(tree.props['data-loaded'],true);assert.equal(tree.props['data-phase'],0);app.dispose();
    }
  }
  const app=harness('StartingPointsPage',true);let tree=app.render();
  byData(tree,'data-load',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-loaded'],true);assert.equal(tree.props['data-loading'],false);assert.equal(tree.props['data-phase'],0);
  assert.equal(app.timers.size,0);assert.equal(app.calls,0);
  byData(tree,'data-open-comparison',true).props.onClick();tree=app.render();assert.equal(tree.props['data-phase'],1);
  assert.equal(elements(tree).filter(node=>'data-neighbor-side' in node.props).length,16);app.dispose();
});

function parameterGroups(tree) {
  const node=elements(tree).find(node=>node.type===range.ParameterRange);assert.ok(node);
  return elements(range.ParameterRange(node.props)).filter(node=>'data-layer-name' in node.props);
}
test('page25 default shows all groups and every mode explicitly identifies frozen versus trainable parameters and who learns', () => {
  const app=harness('FreezeFineTunePage');let tree=app.render();
  const names=['Stem','Stage 1','Stage 2','Stage 3','Stage 4','新分类头'];
  for(const [index,count] of [[0,1],[1,2],[2,6]]) {
    if(index>0){byData(tree,'data-mode-choice',index).props.onClick();tree=app.render();}
    const groups=parameterGroups(tree);assert.deepEqual(groups.map(node=>node.props['data-layer-name']),names);
    assert.equal(groups.filter(node=>node.props['data-trainable']).length,count);
    for(const group of groups) assert.ok(text(group).includes(group.props['data-trainable']?'可训练':'冻结'));
    const html=checkMarkup(tree);assert.ok(html.includes('谁在学：'));assert.ok(html.includes('冻结层仍参与前向计算'));
    assert.equal(text(byData(tree,'data-benefit',true)),'能获得什么：'+app.exports.FINE_TUNE_MODES[index].benefit);
    assert.equal(text(byData(tree,'data-cost',true)),'主要代价：'+app.exports.FINE_TUNE_MODES[index].cost);
    assert.equal(byData(tree,'data-benefit',true).props.align,'center');assert.equal(byData(tree,'data-cost',true).props.align,'center');
    assert.equal(byData(tree,'data-benefit',true).props.variant,'body');assert.equal(byData(tree,'data-cost',true).props.variant,'body');
    assert.equal(app.calls,index===2?1:0);
  }
  byData(tree,'data-reset',true).props.onClick();tree=app.render();assert.equal(tree.props['data-mode'],0);
  assert.equal(parameterGroups(tree).filter(node=>node.props['data-trainable']).length,1);assert.equal(tree.props['data-complete'],false);app.dispose();
});

test('strategy map starts unlit and each click lights only its case; earlier cases stay lit and completion is deduplicated', () => {
  const app=harness('StrategyMapPage');let tree=app.render();let html=checkMarkup(tree);
  assert.equal(elements(tree).filter(node=>'data-case' in node.props).length,4);assert.equal(elements(tree).filter(node=>node.type==='img').length,0);
  for(const phrase of ['新数据量','与预训练任务的相似度','只训练新头','Stage 4 ＋ 新头','骨干全部层 ＋ 新头','先新头 → 再尝试后段']) assert.ok(html.includes(phrase),phrase);
  const strips=elements(tree).filter(node=>node.type===range.ParameterRange);
  assert.deepEqual(strips.map(node=>node.props.trainableFrom),[4,0,5,5]);
  const lit=()=>elements(tree).filter(node=>node.props['data-lit']===true).length;
  assert.equal(tree.props['data-selected'],'');assert.equal(lit(),0);
  assert.ok(!/data-inspect|回看照片|约 300 张|数千张/.test(html));
  const seen=new Set();
  for(const index of [2,2,0,1,3]){
    byData(tree,'data-case',index).props.onClick();tree=app.render();
    if(index!==3)seen.add(index);assert.equal(lit(),new Set([...seen,index]).size);
    assert.equal(tree.props['data-visited'],[...seen].join(','));
    assert.equal(tree.props['data-selected'],app.exports.STRATEGY_CASES[index].id);checkMarkup(tree);
    assert.equal(text(byData(tree,'data-reason',true)),'原因：'+app.exports.STRATEGY_CASES[index].why);
    assert.equal(text(byData(tree,'data-cost',true)),'代价：'+app.exports.STRATEGY_CASES[index].cost);
    assert.equal(byData(tree,'data-reason',true).props.variant,'body');assert.equal(byData(tree,'data-cost',true).props.variant,'body');
    assert.equal(byData(tree,'data-reason',true).props.align,'center');assert.equal(byData(tree,'data-cost',true).props.align,'center');
  }
  assert.equal(app.calls,1);assert.equal(tree.props['data-complete'],true);
  byData(tree,'data-reset',true).props.onClick();tree=app.render();assert.equal(tree.props['data-selected'],'');assert.equal(tree.props['data-visited'],'');assert.equal(tree.props['data-complete'],false);assert.equal(lit(),0);
  assert.equal(app.timers.size,0);app.dispose();
});

test('page25 case4 requires a separate click for baseline, Stage4 trial and validation comparison, unlike the fixed case1 range', () => {
  const app=harness('StrategyMapPage');let tree=app.render();
  const scopes=index=>elements(byData(tree,'data-case',index)).filter(node=>node.type===range.ParameterRange).map(node=>node.props.trainableFrom);
  assert.deepEqual(scopes(0),[4]);assert.deepEqual(scopes(3),[5]);
  assert.ok(!elements(tree).some(node=>'data-trial-next' in node.props));
  byData(tree,'data-case',3).props.onClick();tree=app.render();
  assert.equal(tree.props['data-trial-step'],0);assert.equal(app.timers.size,0);assert.deepEqual(scopes(3),[5]);
  assert.equal(tree.props['data-visited'],'');assert.equal(byData(tree,'data-case-cell',3).props['data-case-completed'],false);
  assert.ok(!elements(tree).some(node=>node.props['data-case-check']===3));
  assert.ok(text(tree).includes('先冻结：只训新头'));assert.equal(app.calls,0);
  for(let pause=0;pause<8;pause++){tree=app.interval();tree=app.timeout();assert.equal(tree.props['data-trial-step'],0);}
  assert.equal(text(byData(tree,'data-trial-next',true)),'试调后段 →');
  assert.ok(elements(byData(tree,'data-case-cell',3)).includes(byData(tree,'data-trial-next',true)));
  assert.ok(!elements(byData(tree,'data-case',3)).includes(byData(tree,'data-trial-next',true)),'the small action must be a sibling, never nested inside the case button');
  assert.ok(!elements(elements(tree).find(node=>node.type==='footer')).some(node=>'data-trial-next' in node.props));
  byData(tree,'data-trial-next',true).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],1);assert.deepEqual(scopes(3),[4]);assert.deepEqual(scopes(0),[4]);
  assert.ok(elements(tree).some(node=>node.props.className==='rtg-strategy__trial-live is-tuning'));
  assert.equal(tree.props['data-visited'],'');assert.ok(!elements(tree).some(node=>node.props['data-case-check']===3));
  const tuning=elements(byData(tree,'data-case',3)).find(node=>node.type===range.ParameterRange);
  const groups=elements(range.ParameterRange(tuning.props)).filter(node=>'data-layer-name' in node.props);
  assert.deepEqual(groups.map(node=>node.props['data-trainable']),[false,false,false,false,true,true]);
  for(let pause=0;pause<8;pause++){tree=app.interval();tree=app.timeout();assert.equal(tree.props['data-trial-step'],1);}
  assert.equal(text(byData(tree,'data-trial-next',true)),'验证比较 →');
  byData(tree,'data-trial-next',true).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],2);assert.deepEqual(scopes(3),[5,4]);
  assert.equal(tree.props['data-visited'],'3');assert.equal(byData(tree,'data-case-cell',3).props['data-case-completed'],true);
  assert.equal(text(byData(tree,'data-case-check',3)).trim(),'✓');
  assert.equal(byData(tree,'data-case-check',3).props.className,'rtg-strategy__seen');
  assert.ok(elements(byData(tree,'data-case-cell',3)).includes(byData(tree,'data-case-check',3)));
  assert.ok(!elements(byData(tree,'data-case',3)).includes(byData(tree,'data-case-check',3)),'all four completion marks share the same top-right anchor outside the case button');
  assert.ok(byData(tree,'data-trial-candidate','baseline'));assert.ok(byData(tree,'data-trial-candidate','finetune'));
  assert.ok(text(tree).includes('比较验证表现与成本'));assert.ok(!elements(tree).some(node=>'data-trial-winner' in node.props));checkMarkup(tree);
  assert.ok(!text(tree).includes('④ 基线与试调，验证后再决定保留哪种。'));
  for(const candidate of ['baseline','finetune']){
    const strip=elements(byData(tree,'data-trial-candidate',candidate)).find(node=>node.type===range.ParameterRange);
    assert.equal(elements(range.ParameterRange(strip.props)).filter(node=>'data-layer-name' in node.props).length,6);
  }
  tree=app.interval();assert.equal(tree.props['data-trial-step'],2);assert.equal(app.timers.size,0);assert.equal(app.calls,0);
  assert.equal(text(byData(tree,'data-trial-next',true)),'重新演示');
  byData(tree,'data-trial-next',true).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],0);assert.deepEqual(scopes(3),[5]);
  byData(tree,'data-case',0).props.onClick();tree=app.render();assert.equal(app.calls,1);assert.equal(app.timers.size,0);assert.deepEqual(scopes(3),[5]);
  assert.equal(byData(tree,'data-case-check',3).props.className,byData(tree,'data-case-check',0).props.className);app.dispose();
});

test('page25 preserves the paused step when comparing another case and reset clears it without pending callbacks', () => {
  const app=harness('StrategyMapPage');let tree=app.render();byData(tree,'data-case',3).props.onClick();tree=app.render();
  byData(tree,'data-trial-next',true).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],1);
  byData(tree,'data-case',0).props.onClick();tree=app.render();assert.equal(tree.props['data-selected'],'many-near');
  assert.equal(byData(tree,'data-case-cell',3).props['data-lit'],false);assert.ok(!elements(tree).some(node=>node.props['data-case-check']===3));assert.equal(app.calls,0);
  assert.ok(!elements(tree).some(node=>'data-trial-next' in node.props));
  tree=app.interval();tree=app.timeout();assert.equal(tree.props['data-trial-step'],1);
  byData(tree,'data-case',3).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],1);
  byData(tree,'data-case',3).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],2,'the selected case itself can advance one step');
  assert.equal(app.calls,1);assert.ok(byData(tree,'data-case-check',3));
  byData(tree,'data-case',0).props.onClick();tree=app.render();assert.equal(byData(tree,'data-case-cell',3).props['data-lit'],true);assert.ok(byData(tree,'data-case-check',3));
  byData(tree,'data-reset',true).props.onClick();tree=app.render();assert.equal(tree.props['data-selected'],'');assert.equal(tree.props['data-visited'],'');
  assert.equal(tree.props['data-complete'],false);assert.equal(tree.props['data-trial-step'],0);assert.equal(app.timers.size,0);app.dispose();assert.equal(app.timers.size,0);
});

test('page25 unfinished case4 stays gray and unchecked after switching to any of cases1,2,3', () => {
  for(const pausedStep of [0,1])for(const otherCase of [0,1,2]){
    const app=harness('StrategyMapPage');let tree=app.render();
    byData(tree,'data-case',3).props.onClick();tree=app.render();
    if(pausedStep===1){byData(tree,'data-trial-next',true).props.onClick();tree=app.render();}
    assert.equal(byData(tree,'data-case-cell',3).props['data-lit'],true,'the active demonstration is legible while in progress');
    assert.ok(!elements(tree).some(node=>node.props['data-case-check']===3));
    byData(tree,'data-case',otherCase).props.onClick();tree=app.render();
    const paused=byData(tree,'data-case-cell',3);
    assert.equal(paused.props['data-lit'],false);assert.equal(paused.props['data-case-completed'],false);
    assert.ok(!/is-lit|is-selected/.test(paused.props.className));
    assert.equal(tree.props['data-visited'],String(otherCase));assert.equal(tree.props['data-complete'],false);assert.equal(app.calls,0);
    assert.ok(!elements(paused).some(node=>'data-case-check' in node.props));
    byData(tree,'data-case',3).props.onClick();tree=app.render();
    assert.equal(tree.props['data-trial-step'],pausedStep,'returning resumes the unfinished demonstration');
    assert.equal(byData(tree,'data-case-cell',3).props['data-lit'],true);assert.equal(app.calls,0);checkMarkup(tree);app.dispose();
  }
});

test('page25 reduced motion still requires every manual step and replays never inflate completion', () => {
  for(const reduced of [false,true]){
    const app=harness('StrategyMapPage',reduced);let tree=app.render();
    for(let cycle=0;cycle<2;cycle++){
      byData(tree,'data-case',3).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],0);
      for(let replay=0;replay<2;replay++){
        for(const step of [1,2]){byData(tree,'data-trial-next',true).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],step);}
        assert.ok(byData(tree,'data-trial-comparison',true));assert.equal(app.timers.size,0);assert.equal(tree.props['data-visited'],'3');
        byData(tree,'data-trial-next',true).props.onClick();tree=app.render();assert.equal(tree.props['data-trial-step'],0);
      }
      assert.equal(app.calls,cycle===0?0:1);byData(tree,'data-case',0).props.onClick();tree=app.render();assert.equal(app.calls,1);
      byData(tree,'data-reset',true).props.onClick();tree=app.render();assert.equal(tree.props['data-complete'],false);
    }
    app.dispose();
  }
  const css=fs.readFileSync(path.join(__dirname,'StrategyMapPage/StrategyMapPage.css'),'utf8');require('postcss').parse(css);
  assert.ok(css.includes('transition:fill .7s ease'));assert.ok(css.includes('stroke-dasharray:4 2'));assert.ok(css.includes('prefers-reduced-motion'));
});

test('the course-local range component uses labels, lock/update icons and dashed/solid outlines, not color alone', () => {
  for(const from of [0,4,5]){
    const tree=range.ParameterRange({trainableFrom:from});const groups=elements(tree).filter(node=>'data-layer-name' in node.props);
    assert.equal(groups.length,6);
    for(const group of groups)assert.ok(group.props['aria-label'].includes(group.props['data-trainable']?'参数允许更新':'参数不更新'));
    const html=renderToStaticMarkup(tree);assert.equal((html.match(/rtg-parameter-range__state-icon/g)||[]).length,6);
  }
  const css=fs.readFileSync(path.resolve(__dirname,'../components/ParameterRange/ParameterRange.css'),'utf8');
  require('postcss').parse(css);assert.ok(css.includes('stroke-dasharray:4 3'));assert.ok(css.includes('stroke-dasharray:none'));
  assert.ok(!/font-size|font-weight|line-height|overflow\s*:\s*hidden/.test(css));
});

test('page21 uses the same high-resolution photo for crops and highlights, with a connected path and a high-contrast weight file', () => {
  const app=harness('PretrainingPage');let tree=app.render();
  const asset=path.resolve(__dirname,'../assets/pretraining/bottle-white-cap-hd.png');
  const bytes=fs.readFileSync(asset);assert.equal(bytes.toString('ascii',1,4),'PNG');
  assert.equal(bytes.readUInt32BE(16),1024);assert.equal(bytes.readUInt32BE(20),1536);
  const source=elements(tree).find(node=>node.type==='img').props.src;
  const crops=elements(tree).filter(node=>node.type==='image');assert.equal(crops.length,3);
  assert.ok(crops.every(node=>node.props.href===source));
  assert.ok(source.includes('/pretraining/'));
  for(const index of [0,1,2]){
    byData(tree,'data-cue-choice',index).props.onClick();tree=app.render();
    const highlighter=byData(tree,'data-highlight',index);assert.ok(elements(highlighter).some(node=>node.type==='path'));
    assert.ok(byData(tree,'data-connector',index));checkMarkup(tree);
  }
  const css=fs.readFileSync(path.join(__dirname,'PretrainingPage/PretrainingPage.css'),'utf8');
  assert.match(css,/file-body\s*\{\s*fill:var\(--ui-accent\)/);
  assert.match(css,/file \.math-formula\s*\{\s*color:var\(--ui-bg-card\)/);app.dispose();
});

test('page25 has a one-block new head and page26 uses six single-block range glyphs and a selected marker', () => {
  const full=elements(range.ParameterRange({trainableFrom:4})).filter(node=>'data-block-count' in node.props);
  assert.deepEqual(full.map(node=>node.props['data-block-count']),[3,3,3,3,3,1]);
  const compact=elements(range.ParameterRange({trainableFrom:4,compact:true})).filter(node=>'data-block-count' in node.props);
  assert.deepEqual(compact.map(node=>node.props['data-block-count']),[1,1,1,1,1,1]);
  const app=harness('StrategyMapPage');let tree=app.render();
  assert.equal(elements(tree).filter(node=>node.props.className==='rtg-strategy__pin').length,0);
  byData(tree,'data-case',0).props.onClick();tree=app.render();
  assert.equal(elements(tree).filter(node=>node.props.className==='rtg-strategy__pin').length,1);
  assert.equal(tree.props['data-selected'],'many-near');app.dispose();
});

test('the requested larger weight symbol is local to its file and the selected condition uses a recognizable pushpin', () => {
  const css=fs.readFileSync(path.join(__dirname,'PretrainingPage/PretrainingPage.css'),'utf8');
  const parsed=require('postcss').parse(css);
  const resized=parsed.nodes.filter(rule=>rule.type==='rule'&&rule.nodes.some(decl=>decl.prop==='--ui-type-formula-size'));
  assert.equal(resized.length,1);assert.equal(resized[0].selector,'.course-shell .rtg-pretraining__file .math-formula-block');
  assert.equal(resized[0].nodes.find(decl=>decl.prop==='--ui-type-formula-size').value,'var(--ui-type-h1-size)');
  const app=harness('StrategyMapPage');let tree=app.render();
  for(const index of [2,0,3]){
    byData(tree,'data-case',index).props.onClick();tree=app.render();
    const pin=elements(tree).find(node=>node.props.className==='rtg-strategy__pin');assert.ok(pin);
    assert.equal(pin.props.viewBox,'0 0 48 48');assert.match(pin.props['aria-label'],/图钉/);
    for(const part of ['pin-needle','pin-head-top','pin-stem','pin-base'])assert.ok(elements(pin).some(node=>node.props.className===part));
  }
  checkMarkup(tree);app.dispose();
});


test('page27 exposes six named steps, replaces the pool and final question with one animation action, and completes after six finished animations', () => {
  const app=harness('TransferWorkflowPage');let tree=app.render();
  let html=checkMarkup(tree);assert.equal(tree.props['data-step'],0);assert.equal(tree.props['data-count'],0);
  assert.equal(elements(tree).filter(node=>'data-flow-node' in node.props).length,6);
  assert.ok(byData(tree,'data-flow-node',5).props.disabled);
  byData(tree,'data-flow-node',5).props.onClick();tree=app.render();assert.equal(tree.props['data-step'],0);
  assert.ok(!/data-flow-choice|流程检查|validation-role|下一步，该做什么/.test(html));
  for(let index=0;index<6;index++) {
    byData(tree,'data-flow-next',true).props.onClick();tree=app.render();
    assert.equal(tree.props['data-step'],index);assert.equal(tree.props['data-playing'],true);
    assert.equal(tree.props['data-count'],index);assert.ok(byData(tree,'data-flow-next',true).props.disabled);
    byData(tree,'data-flow-next',true).props.onClick();tree=app.render();assert.equal(tree.props['data-step'],index);
    for(let f=1;f<=3;f++){tree=app.interval();assert.equal(tree.props['data-frame'],f);}
    assert.equal(tree.props['data-playing'],false);assert.equal(tree.props['data-count'],index+1);
    assert.equal(app.calls,index===5?1:0);html=checkMarkup(tree);
    assert.ok(!elements(tree).some(node=>node.type===RtgQuestion));assert.equal(app.timers.size,0);
  }
  assert.equal(tree.props['data-complete'],true);assert.ok(html.includes('data-test-open="true"'));
  app.dispose();
});

test('page27 review never advances completion and reset/unmount invalidate callbacks from older animations', () => {
  const app=harness('TransferWorkflowPage');let tree=app.render();
  byData(tree,'data-flow-next',true).props.onClick();tree=app.render();
  const stale=[...app.timers.values()][0].fn;
  byData(tree,'data-reset',true).props.onClick();tree=app.render();stale();tree=app.render();
  assert.equal(tree.props['data-frame'],0);assert.equal(tree.props['data-count'],0);assert.equal(app.timers.size,0);
  for(let step=0;step<2;step++){byData(tree,'data-flow-next',true).props.onClick();tree=app.render();for(let i=0;i<3;i++)tree=app.interval();}
  byData(tree,'data-flow-node',0).props.onClick();tree=app.render();
  assert.equal(tree.props['data-step'],0);assert.equal(tree.props['data-count'],2);assert.equal(tree.props['data-frame'],3);
  assert.equal(app.calls,0);assert.equal(app.timers.size,0);
  byData(tree,'data-flow-next',true).props.onClick();tree=app.render();
  const disposed=[...app.timers.values()][0].fn;app.dispose();disposed();tree=app.render();
  assert.equal(tree.props['data-count'],2);assert.equal(app.timers.size,0);
});

test('page27 reduced motion retains six actual actions and replays cannot report completion twice', () => {
  const app=harness('TransferWorkflowPage',true);let tree=app.render();
  for(let cycle=0;cycle<2;cycle++){
    for(let i=0;i<6;i++){byData(tree,'data-flow-next',true).props.onClick();tree=app.render();assert.equal(tree.props['data-count'],i+1);}
    assert.equal(app.calls,1);assert.equal(app.timers.size,0);
    byData(tree,'data-flow-next',true).props.onClick();tree=app.render();assert.equal(app.calls,1);
    byData(tree,'data-reset',true).props.onClick();tree=app.render();assert.equal(tree.props['data-complete'],false);
  }
  app.dispose();
});

test('super-resolution transposes image terms, reveals the true residual and adds it back before reporting completion', async () => {
  const app=harness('SuperResolutionPage');let tree=app.render();
  assert.ok(byData(tree,'data-advance',true).props.disabled);
  await Promise.resolve();await Promise.resolve();tree=app.render();
  assert.equal(tree.props['data-ready'],true);assert.equal(tree.props['data-layout'],'addition');
  assert.ok(byData(tree,'data-advance',true).props.hint);checkMarkup(tree);
  byData(tree,'data-advance',true).props.onClick();tree=app.render();
  tree=finishResidualDerivation(app,tree);
  assert.equal(tree.props['data-layout'],'subtraction');assert.equal(app.calls,0);
  byData(tree,'data-add-details',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-stage'],2);assert.equal(tree.props['data-motion'],'restore');
  assert.equal(tree.props['data-layout'],'addition');assert.equal(tree.props['data-strength'],0);
  assert.equal(tree.props['data-complete'],false);assert.equal(app.calls,0);
  assert.ok(byData(tree,'data-details-range',true).props.disabled);
  tree=app.timeout();
  assert.equal(tree.props['data-strength'],100);assert.equal(tree.props['data-mean-error'],0);
  assert.equal(tree.props['data-complete'],true);assert.equal(app.calls,1);checkMarkup(tree);
  byData(tree,'data-reset',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-step'],'question');assert.equal(tree.props['data-strength'],0);
  assert.equal(tree.props['data-layout'],'addition');assert.equal(tree.props['data-complete'],false);app.dispose();
});

test('super-resolution object actions and loading retry reject early, repeated and busy actions', async () => {
  const app=harness('SuperResolutionPage',false,true);let tree=app.render();
  byData(tree,'data-advance',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-step'],'question');assert.equal(app.calls,0);
  await Promise.resolve();await Promise.resolve();await Promise.resolve();tree=app.render();
  assert.match(text(tree),/图片加载失败/);
  byData(tree,'data-retry',true).props.onClick();tree=app.render();
  await Promise.resolve();await Promise.resolve();tree=app.render();
  assert.equal(tree.props['data-ready'],true);
  byData(tree,'data-reveal-residual',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-motion'],'transpose');assert.ok(byData(tree,'data-advance',true).props.disabled);
  byData(tree,'data-advance',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-step'],'transposed');
  tree=app.timeout();assert.equal(tree.props['data-motion'],'');
  assert.ok(!byData(tree,'data-reveal-residual',true).props.disabled);
  byData(tree,'data-reveal-residual',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-motion'],'subtract');assert.equal(app.calls,0);
  byData(tree,'data-advance',true).props.onClick();tree=app.render();assert.equal(tree.props['data-motion'],'subtract');
  tree=app.timeout();assert.equal(tree.props['data-stage'],1);checkMarkup(tree);app.dispose();
});

test('super-resolution preserves variable labels and the correct equation in both image arrangements', async () => {
  const app=harness('SuperResolutionPage',true);let tree=app.render();
  await Promise.resolve();await Promise.resolve();tree=app.render();
  for(const latex of ['b=U(x)','Y','R','32\\times32\\rightarrow256\\times256'])assert.ok(checkMarkup(tree).includes('data-latex="'+latex+'"'));
  byData(tree,'data-advance',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-step'],'transposed');assert.ok(checkMarkup(tree).includes('data-latex="R=Y-b"'));
  byData(tree,'data-advance',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-step'],'residual');assert.match(text(tree),/细节残差/);
  byData(tree,'data-add-details',true).props.onClick();tree=app.render();
  for(const latex of ['b=U(x)','R','b+\\lambda R'])assert.ok(checkMarkup(tree).includes('data-latex="'+latex+'"'));
  assert.match(text(tree),/重构结果/);checkMarkup(tree);app.dispose();
});

test('current page17 moves the base across equals, changes plus to minus, pauses and reverses the exact image identities', async () => {
  const app=harness('SuperResolutionPage');let tree=app.render();
  await Promise.resolve();await Promise.resolve();tree=app.render();
  const columns=()=>Object.fromEntries(elements(tree).filter(node=>'data-panel-role' in node.props).map(node=>[node.props['data-panel-role'],node.props.style.gridColumn]));
  const bounds={baseline:50,residual:400,target:750};
  for(const role of Object.keys(bounds))byData(tree,'data-panel-role',role).props.ref({offsetWidth:256,getBoundingClientRect:()=>({left:bounds[role],top:100,width:128,height:256})});
  for(const [role,left] of [['operation',300],['equals',650]])byData(tree,'data-operator',role).props.ref({offsetWidth:44,getBoundingClientRect:()=>({left,top:200,width:22,height:30})});
  assert.deepEqual(columns(),{baseline:1,residual:3,target:5});
  byData(tree,'data-advance',true).props.onClick();tree=app.render();
  assert.deepEqual(columns(),{baseline:5,residual:1,target:3});
  assert.equal(byData(tree,'data-panel-role','baseline').props.style['--rtg-source-x'],'-1400px');
  assert.equal(byData(tree,'data-panel-role','residual').props.style['--rtg-source-x'],'700px');
  assert.equal(byData(tree,'data-panel-role','target').props.style['--rtg-source-x'],'700px');
  assert.equal(byData(tree,'data-operator','operation').props['data-symbol'],'-');
  assert.equal(byData(tree,'data-operator','operation').props.style.gridColumn,4);
  assert.equal(byData(tree,'data-operator','equals').props.style.gridColumn,2);
  const symbols=elements(byData(tree,'data-operator','operation')).filter(node=>node.type===shared.MathFormulaStatic).map(node=>node.props.latex);
  assert.deepEqual(symbols,['+','-']);
  assert.ok(byData(tree,'data-panel-role','baseline').props.className.includes('is-moving'));
  tree=app.timeout();assert.equal(tree.props['data-motion'],'');assert.equal(app.timers.size,0);assert.equal(app.frames.size,0);
  tree=app.timeout();tree=app.interval();assert.equal(tree.props['data-step'],'transposed');
  assert.match(text(byData(tree,'data-advance',true)),/计算/);
  byData(tree,'data-advance',true).props.onClick();tree=app.render();tree=app.timeout();
  assert.equal(tree.props['data-step'],'residual');assert.equal(tree.props['data-animation-playing'],false);assert.equal(app.calls,0);
  // The same figure identities now occupy the subtraction slots.
  for(const [role,left] of [['residual',50],['target',400],['baseline',750]])byData(tree,'data-panel-role',role).props.ref({offsetWidth:256,getBoundingClientRect:()=>({left,top:100,width:128,height:256})});
  byData(tree,'data-add-details',true).props.onClick();tree=app.render();
  assert.deepEqual(columns(),{baseline:1,residual:3,target:5});
  assert.equal(byData(tree,'data-panel-role','baseline').props.style['--rtg-source-x'],'1400px');
  assert.equal(byData(tree,'data-operator','operation').props['data-symbol'],'+');
  assert.equal(byData(tree,'data-operator','equals').props.style.gridColumn,4);
  assert.equal(tree.props['data-strength'],0);assert.equal(app.calls,0);
  checkMarkup(tree);tree=app.timeout();assert.equal(app.calls,1);app.dispose();
});

test('current page17 keeps both subtraction inputs separate and reveals real signed residual pixels from left to right', async () => {
  class TestImageData { constructor(data,width,height){this.data=data;this.width=width;this.height=height;} }
  const app=harness('SuperResolutionPage',false,false,{ImageData:TestImageData});let tree=app.render();
  await Promise.resolve();await Promise.resolve();tree=app.render();
  const draws=[],scanPositions=[];
  const residualCanvas=elements(byData(tree,'data-panel-role','residual')).find(node=>node.type==='canvas');
  residualCanvas.props.ref({getContext:()=>({putImageData:(...args)=>draws.push(args)})});
  byData(tree,'data-advance',true).props.onClick();tree=app.render();tree=app.timeout();
  byData(tree,'data-advance',true).props.onClick();tree=app.render();
  byData(tree,'data-residual-scan',true).props.ref.current={style:{setProperty:(_,value)=>scanPositions.push(value)}};
  assert.equal(byData(tree,'data-panel-role','residual').props.style.gridColumn,1);
  assert.equal(byData(tree,'data-panel-role','target').props.style.gridColumn,3);
  assert.equal(byData(tree,'data-panel-role','baseline').props.style.gridColumn,5);
  tree=app.frame(100);assert.equal(scanPositions.at(-1),'0%');
  assert.deepEqual(Array.from(draws.at(-1)[0].data).slice(0,4),[90,110,150,255]);
  tree=app.frame(900);assert.equal(scanPositions.at(-1),'50%');
  assert.deepEqual(draws.at(-1).slice(1),[0,0,0,0,1,2]);
  assert.deepEqual(Array.from(draws.at(-1)[0].data).slice(0,4),[108,148,228,255]);
  tree=app.frame(1700);assert.equal(scanPositions.at(-1),'100%');
  assert.equal(tree.props['data-stage'],1);assert.equal(tree.props['data-motion'],'');
  assert.equal(app.frames.size,0);assert.equal(app.timers.size,0);assert.equal(app.calls,0);app.dispose();
});

test('current page17 restores the addition layout before progressively reconstructing and supports a partial-detail replay', async () => {
  const app=harness('SuperResolutionPage');let tree=app.render();
  await Promise.resolve();await Promise.resolve();tree=app.render();
  byData(tree,'data-advance',true).props.onClick();tree=app.render();tree=finishResidualDerivation(app,tree);
  byData(tree,'data-add-details',true).props.onClick();tree=app.render();
  const initialError=tree.props['data-mean-error'];assert.ok(initialError>0);
  tree=app.frame(100);tree=app.frame(1000);
  assert.equal(tree.props['data-strength'],0);assert.equal(tree.props['data-complete'],false);
  tree=app.frame(1850);
  assert.equal(tree.props['data-strength'],50);assert.ok(tree.props['data-mean-error']>0);assert.ok(tree.props['data-mean-error']<initialError);
  assert.equal(app.calls,0);
  tree=app.frame(2550);assert.equal(tree.props['data-strength'],100);assert.equal(tree.props['data-mean-error'],0);assert.equal(app.calls,1);
  byData(tree,'data-details-range',true).props.onChange({currentTarget:{value:'50'}});tree=app.render();
  assert.equal(tree.props['data-strength'],50);assert.equal(tree.props['data-complete'],false);
  byData(tree,'data-fill-details',true).props.onClick();tree=app.render();
  assert.equal(tree.props['data-motion'],'fill');assert.ok(byData(tree,'data-details-range',true).props.disabled);
  tree=app.frame(3000);tree=app.frame(3700);assert.equal(tree.props['data-strength'],75);
  tree=app.frame(4400);assert.equal(tree.props['data-strength'],100);assert.equal(app.calls,1);app.dispose();
});

test('current page17 reset and unmount invalidate timers and queued frames in every animation phase', async () => {
  for(const phase of ['transpose','subtract','restore','fill'])for(const ending of ['reset','unmount']){
    const app=harness('SuperResolutionPage');let tree=app.render();
    await Promise.resolve();await Promise.resolve();tree=app.render();
    byData(tree,'data-advance',true).props.onClick();tree=app.render();
    if(phase!=='transpose'){
      tree=app.timeout();byData(tree,'data-advance',true).props.onClick();tree=app.render();
      if(phase==='restore'||phase==='fill'){
        tree=app.timeout();byData(tree,'data-add-details',true).props.onClick();tree=app.render();
        if(phase==='fill'){
          tree=app.timeout();byData(tree,'data-details-range',true).props.onChange({currentTarget:{value:'50'}});tree=app.render();
          byData(tree,'data-fill-details',true).props.onClick();tree=app.render();
        }
      }
    }
    assert.equal(tree.props['data-motion'],phase);
    const staleTimer=[...app.timers.values()][0]?.fn,staleFrame=[...app.frames.values()][0];
    const calls=app.calls;
    if(ending==='reset'){byData(tree,'data-reset',true).props.onClick();tree=app.render();}else app.dispose();
    staleTimer?.();staleFrame?.(5000);tree=app.render();
    assert.equal(app.timers.size,0);assert.equal(app.frames.size,0);assert.equal(app.calls,calls);
    if(ending==='reset'){assert.equal(tree.props['data-step'],'question');assert.equal(tree.props['data-motion'],'');assert.equal(tree.props['data-strength'],0);app.dispose();}
  }
});

test('current page17 reduced motion keeps all three deliberate actions and repeated viewing never completes twice', async () => {
  const app=harness('SuperResolutionPage',true);let tree=app.render();
  await Promise.resolve();await Promise.resolve();tree=app.render();
  for(let cycle=0;cycle<2;cycle++){
    byData(tree,'data-advance',true).props.onClick();tree=app.render();
    assert.equal(tree.props['data-step'],'transposed');assert.equal(tree.props['data-animation-playing'],false);
    assert.equal(app.timers.size,0);assert.equal(app.frames.size,0);assert.equal(app.calls,cycle===0?0:1);
    byData(tree,'data-advance',true).props.onClick();tree=app.render();
    assert.equal(tree.props['data-step'],'residual');assert.equal(tree.props['data-stage'],1);
    assert.equal(app.calls,cycle===0?0:1);
    byData(tree,'data-add-details',true).props.onClick();tree=app.render();
    assert.equal(tree.props['data-step'],'reconstruction');assert.equal(tree.props['data-strength'],100);
    assert.equal(tree.props['data-mean-error'],0);assert.equal(app.calls,1);
    byData(tree,'data-reset',true).props.onClick();tree=app.render();
  }
  checkMarkup(tree);app.dispose();
});

test('transfer animation visuals keep all categories in each split and distinguish training updates from validation and testing', () => {
  const split=transferVisuals.DatasetSplit({frame:3});
  const groups=elements(split).filter(node=>'data-split' in node.props);assert.equal(groups.length,3);
  for(const group of groups)assert.equal(elements(group).filter(node=>node.props.className==='sample-card').length,3);
  assert.ok(split.props['aria-label'].includes('不按类别分组'));
  for(const frame of [0,1,2,3]){
    const loop=transferVisuals.ValidationPaths({frame,scope:5});
    assert.equal(loop.props['data-test-open'],frame===3);
    assert.ok(loop.props['aria-label'].includes('择一'));
    assert.ok(text(loop).includes('满足要求：保留基线'));assert.ok(text(loop).includes('仍有空间：比较后段微调'));
  }
  const app=harness('TransferWorkflowPage',true);let tree=app.render();
  for(let i=0;i<5;i++){byData(tree,'data-flow-next',true).props.onClick();tree=app.render();}
  assert.ok(byData(tree,'data-update-target','head'));assert.ok(checkMarkup(tree).includes('训练损失'));
  assert.ok(!checkMarkup(tree).includes('准确率'));app.dispose();
});

test('current page16 removes both footer rows while preserving actual residual values, linked selection and zero identity', () => {
  const app=harness('ZeroResidualPage');let tree=app.render();
  const matrices=()=>elements(tree).filter(node=>typeof node.type==='function'&&node.type.name==='Matrix');
  const inspect=()=>{
    const html=checkMarkup(tree);
    assert.ok(!html.includes('本页只验证相加节点，尚未经过末端 ReLU'));
    assert.ok(!html.includes('当前修正强度'));assert.ok(!html.includes('原样路径一直保留'));
    assert.ok(!elements(tree).some(node=>node.type===shared.NoticeStrip));
    assert.equal(matrices()[2].props.title,'相加结果 H(x)');
    return html;
  };
  inspect();assert.equal(tree.props['data-strength'],100);assert.equal(app.calls,0);
  assert.deepEqual(plain(matrices()[2].props.values),[1,3,0,1,-1,3,1,1,-2]);
  byData(tree,'data-strength-preset',50).props.onClick();tree=app.render();inspect();
  assert.deepEqual(plain(matrices()[2].props.values),[1.5,2,0,.5,.5,2,1,.5,0]);
  matrices()[0].props.onSelect(8);tree=app.render();assert.ok(matrices().every(node=>node.props.selected===8));
  elements(tree).find(node=>node.type===shared.RangeControl).props.onChange({currentTarget:{value:'0'}});tree=app.render();inspect();
  assert.equal(tree.props['data-visited-zero'],true);assert.equal(tree.props['data-complete'],false);assert.equal(app.calls,0);
  assert.deepEqual(plain(matrices()[2].props.values),[2,1,0,0,2,1,1,0,2]);
  assert.ok(matrices()[0].props.matched&&matrices()[2].props.matched);app.dispose();
});
test('current page16 shows wrong-answer feedback only inside its question and clears it on success or reset', () => {
  const app=harness('ZeroResidualPage');let tree=app.render();
  const question=()=>elements(tree).find(node=>node.type===RtgQuestion);
  assert.ok(!question());
  byData(tree,'data-strength-preset',0).props.onClick();tree=app.render();
  const initialQuestionId=question().props.questionId;
  assert.equal(question().props.showFeedback,false);assert.ok(question().props.feedback.wrong.includes('快捷路径'));
  question().props.onCheck({ok:false});tree=app.render();
  assert.equal(question().props.showFeedback,true);assert.equal(tree.props['data-complete'],false);assert.equal(app.calls,0);
  assert.ok(!elements(tree).some(node=>node.type===shared.NoticeStrip));
  byData(tree,'data-strength-preset',100).props.onClick();tree=app.render();
  assert.equal(question().props.showFeedback,true);assert.ok(question().props.feedback.wrong.includes('输入 x'));
  byData(tree,'data-strength-preset',0).props.onClick();tree=app.render();question().props.onCheck({ok:true});tree=app.render();
  assert.equal(tree.props['data-complete'],true);assert.equal(app.calls,1);assert.ok(!question());
  assert.ok(checkMarkup(tree).includes('已验证：修正为 0 时，原信息仍然保留'));
  elements(tree).find(node=>node.props.className==='rtg-zero-residual__reset').props.onClick();tree=app.render();
  assert.equal(tree.props['data-strength'],100);assert.equal(tree.props['data-visited-zero'],false);assert.equal(tree.props['data-complete'],false);assert.ok(!question());
  byData(tree,'data-strength-preset',0).props.onClick();tree=app.render();
  assert.notEqual(question().props.questionId,initialQuestionId);assert.equal(question().props.showFeedback,false);
  question().props.onCheck({ok:true});tree=app.render();assert.equal(app.calls,1);
  const css=require('postcss').parse(fs.readFileSync(path.join(__dirname,'ZeroResidualPage/ZeroResidualPage.css'),'utf8'));
  const checkpoint=css.nodes.find(node=>node.selector==='.course-shell .rtg-zero-residual__checkpoint');
  assert.equal(checkpoint.nodes.find(node=>node.prop==='flex').value,'0 0 auto');
  assert.equal(checkpoint.nodes.find(node=>node.prop==='min-height').value,'180px');
  assert.equal(app.timers.size,0);assert.equal(app.frames.size,0);app.dispose();
});

test('page13 has exactly one visibly actionable next node and each click updates the highlighted explanation and calculation', () => {
  const app=harness('BasicBlockPage');let tree=app.render();
  const nodes=()=>elements(tree).filter(node=>'data-block-node' in node.props);
  const checkpoint=()=>byData(tree,'data-checkpoint',true);
  assert.equal(tree.props['data-stage'],0);assert.equal(tree.props['data-next'],1);
  assert.equal(nodes().length,4);assert.ok(nodes().every(node=>node.type===shared.Button));
  assert.equal(nodes().filter(node=>node.props.className.includes('is-next')).length,1);
  assert.equal(nodes().filter(node=>node.props.hint).length,1);
  assert.equal(checkpoint().props['data-description-step'],0);
  let html=checkMarkup(tree);assert.ok(html.includes('rtg-basic-block__click-cue'));assert.ok(html.includes('从残差分支开始'));
  assert.ok(!html.includes('同形状恒等捷径的 BasicBlock 示意；数值仅跟踪一个位置，非模型实测。'));
  byData(tree,'data-block-node',4).props.onClick();tree=app.render();assert.equal(tree.props['data-stage'],0);
  const results=['F(x)=-3','x=2','H=2+(-3)=-1','y=\\max(0,-1)=0'];
  const concepts=['学习修改量','保留原输入','两路相加','激活与输出'];
  for(let step=1;step<=4;step++){
    const target=byData(tree,'data-block-node',step);assert.ok(!target.props.disabled);assert.ok(target.props.className.includes('is-next'));
    target.props.onClick();tree=app.render();html=checkMarkup(tree);
    assert.ok(!html.includes('同形状恒等捷径的 BasicBlock 示意；数值仅跟踪一个位置，非模型实测。'));
    assert.equal(tree.props['data-stage'],step);assert.equal(tree.props['data-active'],step);
    assert.equal(tree.props['data-next'],step===4?0:step+1);assert.equal(checkpoint().props['data-description-step'],step);
    assert.ok(text(checkpoint()).includes(concepts[step-1]));
    assert.ok(elements(checkpoint()).some(node=>node.props.latex===results[step-1]),results[step-1]);
    assert.equal(app.calls,step===4?1:0);
    assert.equal(nodes().filter(node=>node.props.className.includes('is-next')).length,step===4?0:1);
  }
  assert.ok(html.includes('data-latex="H=2+(-3)=-1"'));assert.ok(html.includes('data-latex="y=\\operatorname{ReLU}(-1)=0"'));
  assert.equal(app.timers.size,0);assert.equal(app.frames.size,0);app.dispose();
});
test('page13 preserves completed paths while reviewing, resets its cues, rejects stale skip handlers and isolates keyboard activation', () => {
  const app=harness('BasicBlockPage',true);let tree=app.render();
  for(let step=1;step<=4;step++){byData(tree,'data-block-node',step).props.onClick();tree=app.render();}
  const stale=byData(tree,'data-block-node',4).props.onClick;
  byData(tree,'data-block-node',1).props.onClick();tree=app.render();
  assert.equal(tree.props['data-stage'],4);assert.equal(tree.props['data-active'],1);assert.equal(tree.props['data-complete'],true);assert.equal(app.calls,1);
  assert.ok(text(byData(tree,'data-checkpoint',true)).includes('修改量'));
  assert.ok(checkMarkup(tree).includes('正在回看已完成节点'));
  byData(tree,'data-reset',true).props.onClick();tree=app.render();stale();tree=app.render();
  assert.equal(tree.props['data-stage'],0);assert.equal(tree.props['data-active'],0);assert.equal(tree.props['data-next'],1);assert.equal(tree.props['data-complete'],false);
  assert.ok(byData(tree,'data-block-node',2).props.disabled);
  for(let step=1;step<=4;step++){byData(tree,'data-block-node',step).props.onClick();tree=app.render();}
  assert.equal(app.calls,1);
  let stopped=0,prevented=0;
  for(const key of ['Enter',' '])tree.props.onKeyDown({key,repeat:true,target:{closest:()=>({})},stopPropagation(){stopped++;},preventDefault(){prevented++;}});
  assert.equal(stopped,2);assert.equal(prevented,2);checkMarkup(tree);app.dispose();
});
test('page13 explanation uses high-contrast theme colors, a Shared h3 and static pointer cues instead of muted gray copy', () => {
  const app=harness('BasicBlockPage');let tree=app.render();const panel=byData(tree,'data-checkpoint',true);
  const copy=elements(panel).filter(node=>node.type===shared.Typography&&node.props.as==='h2');
  assert.equal(copy[0].props.variant,'h3');assert.equal(copy[0].props.tone,'inherit');
  assert.ok(!elements(panel).some(node=>node.type===shared.Typography&&node.props.tone==='muted'));
  const css=fs.readFileSync(path.join(__dirname,'BasicBlockPage/BasicBlockPage.css'),'utf8');
  assert.match(css,/__checkpoint\s*\{[^}]*background:var\(--ui-accent\);[^}]*color:var\(--ui-bg-card\)/);
  assert.match(css,/\.is-next:not[^}]*border:3px solid var\(--ui-warning\)/);
  assert.ok(css.includes('prefers-reduced-motion'));assert.ok(css.includes('.edu-attention-hint { animation:none; }'));
  const theme=load(path.join(sharedRoot,'theme.ts')).defaultTheme;
  function luminance(token){
    const hex=theme.colors.find(color=>color.token===token).value.replace('#','');
    const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
  }
  const a=luminance('--ui-accent'),b=luminance('--ui-bg-card');
  assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>7,'description contrast must exceed 7:1');
  checkMarkup(tree);app.dispose();
});

function blockBounds() {
  return {
    input:{left:0,top:130,right:140,bottom:270},
    branch:{left:170,top:12,right:920,bottom:164},
    shortcut:{left:170,top:272,right:920,bottom:352},
    sum:{left:992,top:152,right:1088,bottom:248},
    relu:{left:1140,top:138,right:1320,bottom:262},
    output:{left:1350,top:138,right:1490,bottom:262},
  };
}
test('page13 connector ports stop at node borders, split once and enter the sum separately without crossing its centre', () => {
  for(const offset of [0,18,-12]){
    const bounds=blockBounds();bounds.branch.top+=offset;bounds.branch.bottom+=offset;
    const graph=blockConnections.buildBlockConnections(1490,400,bounds);
    assert.equal(graph.routes.length,7);assert.equal(graph.fork.x,155);assert.equal(graph.fork.y,200);
    const routes=Object.fromEntries(graph.routes.map(route=>[route.id,route]));
    assert.equal(routes.input.line,'M140 200L155 200');assert.equal(routes.input.arrow,'');
    const cy=(bounds.branch.top+bounds.branch.bottom)/2;
    assert.ok(routes['residual-in'].line.endsWith(`L170 ${cy}`));
    assert.ok(routes['residual-out'].line.startsWith(`M920 ${cy}`));
    assert.ok(routes['residual-out'].line.endsWith('L1040 152'));
    assert.ok(routes['shortcut-out'].line.endsWith('L1040 248'));
    assert.equal(routes.sum.line,'M1088 200L1140 200');
    assert.equal(routes.output.line,'M1320 200L1350 200');
    for(const route of graph.routes){
      assert.ok(!/NaN|Infinity/.test(route.line+route.arrow));
      if(route.id!=='input')assert.ok(route.arrow);
      if(route.id.includes('-'))assert.ok(route.line.includes('Q'),'gutter turns are rounded');
    }
    for(const route of [routes['residual-out'],routes['shortcut-out']]){
      assert.ok(!route.line.endsWith('L1040 200'),'neither branch crosses the plus symbol');
    }
  }
  const css=fs.readFileSync(path.join(__dirname,'BasicBlockPage/BasicBlockPage.css'),'utf8');
  assert.match(css,/__merge-label\s*\{[^}]*position:absolute;[^}]*bottom:0/);
});
test('page13 observes real borders, compensates whole-canvas scaling and disconnects stale node observers', () => {
  const observers=[];
  class Observer { constructor(callback){this.callback=callback;this.targets=[];observers.push(this);}observe(target){this.targets.push(target);}disconnect(){this.disconnected=true;} }
  const app=harness('BasicBlockPage',false,false,{ResizeObserver:Observer});let tree=app.render();
  const bounds=blockBounds();let scale=.75;
  const container={clientWidth:1490,clientHeight:400,
    getBoundingClientRect:()=>({left:40,top:30,width:1490*scale,height:400*scale}),
    querySelector:selector=>{
      const name=selector.split('__')[1].replace('sum-circle','sum');const box=bounds[name];
      return {getBoundingClientRect:()=>({left:40+box.left*scale,right:40+box.right*scale,top:30+box.top*scale,bottom:30+box.bottom*scale})};
    },
  };
  const diagram=elements(tree).find(node=>node.props.className==='rtg-basic-block__diagram');diagram.props.ref.current=container;
  byData(tree,'data-block-node',1).props.onClick();tree=app.render();
  const svg=()=>elements(tree).find(node=>node.props.className==='rtg-basic-block__connections');
  assert.equal(svg().props.viewBox,'0 0 1490 400');assert.equal(observers[0].targets.length,7);
  assert.equal(byData(tree,'data-connection','residual-out').props.className,'is-residual');
  assert.equal(byData(tree,'data-connection','shortcut-out').props.className,undefined);
  const before=checkMarkup(tree);scale=.5;observers[0].callback();tree=app.render();assert.equal(checkMarkup(tree),before);
  byData(tree,'data-block-node',2).props.onClick();tree=app.render();assert.equal(observers[0].disconnected,true);
  assert.equal(byData(tree,'data-connection','shortcut-out').props.className,'is-shortcut');
  const stable=checkMarkup(tree);bounds.branch.right=800;observers[0].callback();tree=app.render();assert.equal(checkMarkup(tree),stable);
  observers[1].callback();tree=app.render();assert.notEqual(checkMarkup(tree),stable);
  for(const step of [3,4]){byData(tree,'data-block-node',step).props.onClick();tree=app.render();}
  assert.equal(byData(tree,'data-connection','sum').props.className,'is-sum');assert.equal(byData(tree,'data-connection','output').props.className,'is-output');
  byData(tree,'data-reset',true).props.onClick();tree=app.render();
  assert.ok(elements(tree).filter(node=>'data-connection' in node.props).every(node=>node.props.className===undefined));
  app.dispose();assert.ok(observers.every(observer=>observer.disconnected));assert.equal(app.timers.size,0);assert.equal(app.frames.size,0);
});
