import { useEffect, useMemo, useState } from 'react';
import { Button, Question, RangeControl, Typography } from "@shuku/course-style/react";
import { ClockDial, CodeLines, LabStatus, LabText as T } from '../../components/LabAtoms';
import { acceptanceSuite, brokenProgram, clockText, fixedProgram, newClock, PATCHES, pauseClock, pauseProbe, startClock, tickClock, type PatchOp, type Regression } from '../../model/labModel';
import { updateLab, useLabMemory } from '../../model/labMemory';
import '../../components/LabAtoms.css';

const reasoningChoices=[
  {title:'读取暂停实现',tool:'read_file("timer.js")',result:'pauseTimer 只把 running 设为 false，没有移除定时回调。',note:'拿到实现证据后，下一步可以检查定时回调。'},
  {title:'再跑相同测试',tool:'run_test("pause-freezes-time")',result:'FAIL：预期 00:03，实际 00:01。',note:'相同测试再次复现了问题；原因仍然未知。'},
  {title:'按已完成交付',tool:'没有工具调用',result:'目前只有失败记录，没有通过证据。',note:'此时不能声称暂停功能已经完成。'},
];
export function ReActNavigator() {
  const [selection,setSelection]=useState<number|null>(null);
  const [phase,setPhase]=useState(0);
  const [running,setRunning]=useState(false);
  const [turn,setTurn]=useState(0);
  useEffect(()=>{if(!running)return;if(phase>=3){setRunning(false);if(selection===0)updateLab({inspected:true});return;}const timer=window.setTimeout(()=>setPhase(v=>v+1),650);return()=>window.clearTimeout(timer)},[phase,running,selection]);
  const info=selection===null?null:reasoningChoices[selection];
  return <div shuku-edit-id="e-e35062dd-dc7a-4ae0-b09e-d6fe2387c98d" className="actlab-react"><div shuku-edit-id="e-36ecb3f6-0504-4648-bb52-e0e67aa72747" className={`actlab-orbit phase-${phase}`}><svg shuku-edit-id="e-b0a3c30a-680c-497d-b3ab-e5f2958aee77" viewBox="0 0 500 420" aria-hidden="true"><path shuku-edit-id="e-dd74c023-a36c-4839-9d64-f6106c8dc5e2" className="actlab-orbit-track" d="M250 70 C420 70 470 220 370 330 C280 430 60 320 95 185 C110 100 180 70 250 70"/><path shuku-edit-id="e-bbb610d8-f736-4383-b34b-1d086c960e17" className={running?'actlab-orbit-signal is-traveling':'actlab-orbit-signal'} key={turn} d="M250 70 C420 70 470 220 370 330 C280 430 60 320 95 185 C110 100 180 70 250 70"/></svg><div shuku-edit-id="e-2d32f330-3504-4066-8713-653cf21fcbfd" className={`actlab-orbit-node is-decision ${phase===0||phase===3?'is-current':''}`}><T variant="h3">判断</T><T variant="bodySmall">下一步缺什么证据</T></div><div shuku-edit-id="e-43a5eb2a-f6e6-4b7f-96a1-ee79648a623d" className={`actlab-orbit-node is-action ${phase===1?'is-current':''}`}><T variant="h3">行动</T><T variant="bodySmall">发出工具请求</T></div><div shuku-edit-id="e-5240f76e-7fb8-483f-91af-547ca843193e" className={`actlab-orbit-node is-observe ${phase===2?'is-current':''}`}><T variant="h3">观察</T><T variant="bodySmall">读取真实返回</T></div><div shuku-edit-id="e-91dac0db-ac0f-4aa1-a8c5-67fe6ec0513e" className="actlab-orbit-center"><LabStatus state={running?'busy':phase===3?(selection===2?'warn':'pass'):'idle'}>{running?'一轮正在发生':phase===3?(selection===2?'交付依据不足':'带着新证据回来'):'ReAct'}</LabStatus></div></div>
    <div shuku-edit-id="e-a9112cd4-c995-4e9d-a61d-aa1bbcdf76b4" className="actlab-decision-desk"><div shuku-edit-id="e-82b80bec-bf5a-41e5-80b1-a61d5042318e" className="actlab-current-evidence"><T variant="bodySmall" tone="muted">已知证据</T><T>{phase===3&&info?info.result:'暂停后，剩余时间仍从 00:03 变为 00:01。'}</T></div><div shuku-edit-id="e-a4467cab-6897-4bb3-be59-b7a1c742b4a3" className="actlab-action-menu">{reasoningChoices.map((item,i)=><Button key={item.title} active={selection===i} disabled={running} onClick={()=>{setSelection(i);setPhase(0)}}>{item.title}</Button>)}</div><Button variant="primary" disabled={selection===null||running} onClick={()=>{setPhase(selection===2?3:0);setRunning(selection!==2);setTurn(v=>v+1)}}>执行所选行动</Button>
      <div shuku-edit-id="e-0d2c4cb1-8aa9-4788-bf0b-3236c8dc6be5" className="actlab-loop-feedback" aria-live="polite">{phase>=1&&info?<><Typography shuku-edit-id="e-0097f9fd-e5c7-4731-9542-94df5d51fd9d" as="code" variant="bodySmall">{info.tool}</Typography><T variant="bodySmall" tone={selection===0?'accent':'warning'}>{phase>=3?info.note:phase===2?info.result:'工具正在执行本次请求。'}</T></>:<T variant="bodySmall" tone="muted">选择会影响得到的证据；返回后再做下一次判断。</T>}</div>
    </div></div>;
}

const traceLines=['let timerId = setInterval(() => {','  remaining -= 1;','  renderTime(remaining);','}, 1000);','','function pauseTimer() {','  running = false;','}'];
function HighlightCode({text}:{text:string}) {
  return <>{text.split(/(\blet\b|\bfunction\b|\bfalse\b|\b\d+\b|\bsetInterval\b|\brenderTime\b|\bpauseTimer\b)/g).map((part,i)=><span shuku-edit-id="e-a7952fe4-bb0d-45a3-895e-454d94e96730" key={i} className={/^(let|function)$/.test(part)?'actlab-syntax-keyword':/^(false|\d+)$/.test(part)?'actlab-syntax-value':/^(setInterval|renderTime|pauseTimer)$/.test(part)?'actlab-syntax-function':undefined}>{part}</span>)}</>;
}
export function CodeMicroscope() {
  const [state,setState]=useState(()=>({...startClock(newClock()),remaining:3}));
  const [line,setLine]=useState<number|null>(null);
  const [tick,setTick]=useState(0);
  const runLine=(i:number)=>{
    setLine(i);
    if(i===0){setState({...startClock(newClock()),remaining:3});setTick(0)}
    if(i===6){setState(s=>pauseClock(s,brokenProgram));updateLab({inspected:true})}
    if(i===1){setState(s=>tickClock(s,brokenProgram));setTick(v=>v+1)}
  };
  const hint=line===6?'running 变为 false，但定时回调仍已注册。':line===1?'回调不读取 running；只要仍在执行，就继续减秒。':line===0?'重新建立计时器，剩余时间回到本次实验的 3 秒。':line===2?'把 remaining 显示到页面。':'先点第 7 行暂停，再点第 2 行模拟一次回调。';
  return <div shuku-edit-id="e-16a122a7-fd09-44bf-8fc2-ac0a14244196" className="actlab-code-microscope"><div shuku-edit-id="e-d4f2c807-cec0-438b-9373-5af6c4b27ce7" className="actlab-dark-editor"><div shuku-edit-id="e-75c77e26-7249-4963-819d-48af7b80d017" className="actlab-editor-bar"><T variant="bodySmall" tone="inherit">timer.js · 计时与暂停</T><T variant="bodySmall" tone="inherit">B0</T></div><div shuku-edit-id="e-cd3aa06e-b12a-4cff-9e3f-265ceb0a6aa1" className="actlab-executable-lines">{traceLines.map((text,i)=><Button key={i} className={line===i?'is-current':''} disabled={text===''} aria-label={`查看第 ${i+1} 行 ${text}`} onClick={()=>runLine(i)}><Typography shuku-edit-id="e-8a12b94f-1a43-4733-a27c-c06e064c968d" as="span" variant="bodySmall" tone="inherit" className="actlab-code-line-number">{String(i+1).padStart(2,'0')}</Typography><Typography shuku-edit-id="e-eff55bf6-9a44-46d5-94dc-7729da98e1b2" as="code" variant="bodySmall" tone="inherit" className="actlab-source-line"><HighlightCode text={text||' '}/></Typography>{[0,1,6].includes(i)&&<i shuku-edit-id="e-fb8c3495-9da0-4e5b-83b2-3e526853e75e"/>}</Button>)}</div></div>
    <div shuku-edit-id="e-0dfe2ae8-8f03-4fdd-95ac-756abb012341" className="actlab-runtime-view"><T variant="h3">运行时观察</T><div shuku-edit-id="e-c5d06f40-32dc-4719-b3b5-da5d60d99115" className="actlab-runtime-variable"><T>界面标记 running</T><LabStatus state={state.running?'busy':'warn'}>{state.running?'true':'false'}</LabStatus></div><div shuku-edit-id="e-36cd54e9-c818-4257-b1cc-7e6f6c635f03" className="actlab-runtime-variable"><T>定时回调</T><LabStatus state={state.callbackRegistered?(state.running?'busy':'fail'):'idle'}>{state.callbackRegistered?'仍已注册':'已停止'}</LabStatus></div><div shuku-edit-id="e-85bea0b4-7e59-462f-ba50-284e6a5e972e" className={`actlab-runtime-number ${tick?'has-ticked':''}`} key={tick}><T variant="bodySmall" tone="muted">remaining</T><T variant="display">{clockText(state.remaining)}</T></div><div shuku-edit-id="e-51253bce-f5ad-4c81-8d77-92fdbf36c206" className="actlab-cause-note"><T variant="bodySmall">{hint}</T></div></div>
  </div>;
}

export function PatchWorkbench() {
  const memory=useLabMemory();
  const [draft,setDraft]=useState<PatchOp[]>(memory.patch??[]);
  const [applied,setApplied]=useState<PatchOp[]|null>(null);
  const [phase,setPhase]=useState(-1);
  const [running,setRunning]=useState(false);
  useEffect(()=>{if(!running)return;if(phase>=3){setRunning(false);return;}const timer=window.setTimeout(()=>setPhase(v=>v+1),470);return()=>window.clearTimeout(timer)},[running,phase]);
  const add=(op:PatchOp)=>{if(running||draft.includes(op))return;setDraft(v=>[...v,op]);setPhase(-1)};
  const remove=(index:number)=>{setDraft(v=>v.filter((_,i)=>i!==index));setPhase(-1)};
  const move=(index:number)=>{if(index===0)return;setDraft(v=>{const copy=[...v];[copy[index-1],copy[index]]=[copy[index],copy[index-1]];return copy});setPhase(-1)};
  const evidence=applied?pauseProbe({patch:applied}):null;
  const stale=applied!==null&&draft.join()!==applied.join();
  const failure=applied?.includes('reset')?'暂停不应重置剩余时间。':applied?.includes('clear')&&applied.indexOf('release')>=0&&applied.indexOf('release')<applied.indexOf('clear')?'句柄先被清空，clearInterval 已找不到原回调。':'回调仍在执行，按钮外观不会阻止减秒。';
  return <div shuku-edit-id="e-c88dacbf-9c1e-4c4d-a52b-a2cbc791a4a8" className="actlab-patch-bench"><div shuku-edit-id="e-f48a0e5a-fb69-4d39-9a35-440a8dcc159b" className="actlab-patch-editor"><T variant="bodySmall" tone="muted">把代码块放进函数，顺序也会影响行为</T><div shuku-edit-id="e-53f34a56-b5d2-4e06-adab-d81873f304c3" className="actlab-patch-function"><Typography shuku-edit-id="e-c30b007c-8124-4859-9337-97c39c10cde0" as="code" variant="bodySmall">function pauseTimer() {'{'}</Typography><Typography shuku-edit-id="e-bd371241-9398-4952-ba88-0934d43b42cd" as="code" variant="bodySmall">　running = false;</Typography><div shuku-edit-id="e-5d647c4b-ac27-4d1f-ab60-069fa6e0540f" className="actlab-patch-dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const op=e.dataTransfer.getData('text/plain');if(op in PATCHES)add(op as PatchOp)}}>{draft.length===0?<T variant="bodySmall" tone="muted">拖入代码块，或点选下方代码块</T>:draft.map((op,i)=><div shuku-edit-id="e-b0a2e5b6-393e-442f-a60b-054cca753e35" key={op} className="actlab-patch-line"><Typography shuku-edit-id="e-a8469980-558d-496c-8345-e5ea26cfb4f3" as="code" variant="bodySmall">{PATCHES[op].code}</Typography><Button disabled={running||i===0} aria-label={`上移${PATCHES[op].label}`} onClick={()=>move(i)}>↑</Button><Button disabled={running} aria-label={`移除${PATCHES[op].label}`} onClick={()=>remove(i)}>×</Button></div>)}</div><Typography shuku-edit-id="e-c717047d-d06c-4d95-a924-6d53eba20bb6" as="code" variant="bodySmall">{'}'}</Typography></div>
      <div shuku-edit-id="e-ad6babce-1351-44e8-b0ee-d8eaa23248c6" className="actlab-patch-bank">{(Object.keys(PATCHES) as PatchOp[]).map(op=><Button key={op} draggable={!running} disabled={draft.includes(op)||running} onDragStart={e=>e.dataTransfer.setData('text/plain',op)} onClick={()=>add(op)}><T variant="bodySmall">{PATCHES[op].label}</T></Button>)}</div></div>
    <div shuku-edit-id="e-85fe70a3-a3ca-4277-8279-33c06fba1e1e" className="actlab-patch-test"><LabStatus state={stale?'warn':phase===3?(evidence?.pass?'pass':'fail'):running?'busy':'idle'}>{stale?'草稿已变，需重新应用':phase===3?(evidence?.pass?'暂停测试通过':'暂停测试失败'):running?'正在测试补丁':'准备一次可验证的修改'}</LabStatus><div shuku-edit-id="e-e8d8b764-3749-437f-b2cd-4ccbea7bbf14" className="actlab-patch-readouts"><div shuku-edit-id="e-2a177ada-3e23-4d0e-8c6b-ef7412ecf5e8"><T variant="bodySmall" tone="muted">预期</T><T variant="display">00:03</T></div><div shuku-edit-id="e-8db54fa4-9f7a-49e2-aba7-4cac36b3fb27"><T variant="bodySmall" tone="muted">实际</T><T variant={evidence?.actual.includes("→")?"h3":"display"} tone={phase===3?(evidence?.pass?'success':'danger'):'muted'}>{phase===3&&!stale?evidence?.actual:'--:--'}</T></div></div><div shuku-edit-id="e-178de8a5-beb4-4e77-a727-a1d4573a9e15" className="actlab-probe-steps">{['从 5 秒开始','推进 2 秒','点击暂停','再推进 2 秒'].map((step,i)=><T key={step} variant="bodySmall" className={phase>=i?'is-done':''}>{phase>=i?'●':'○'}　{step}</T>)}</div><Button variant="primary" disabled={running} onClick={()=>{setApplied([...draft]);setPhase(0);setRunning(true);updateLab({patch:[...draft],revision:memory.revision+1,verified:false})}}>应用补丁并运行测试</Button><T variant="bodySmall" tone={phase===3&&!evidence?.pass?'warning':'muted'}>{phase===3&&!stale?(evidence?.pass?'此补丁修复了暂停；下一页还要检查其他行为。':failure):'结果只对应本次已应用的代码版本。'}</T></div>
  </div>;
}

export function AcceptanceMission() {
  const memory=useLabMemory();
  const [regression,setRegression]=useState<Regression>('none');
  const [revealed,setRevealed]=useState(0);
  const [running,setRunning]=useState(false);
  const [focus,setFocus]=useState(0);
  const [accepted,setAccepted]=useState(false);
  const patchKey=(memory.patch??fixedProgram.patch).join();
  const program=useMemo(()=>({patch:[...(memory.patch??fixedProgram.patch)],regression}),[patchKey,regression]);
  const results=acceptanceSuite(program);
  const allPass=results.every(result=>result.pass);
  useEffect(()=>{if(!running)return;if(revealed>=4){setRunning(false);const firstFailure=results.findIndex(result=>!result.pass);setFocus(firstFailure>=0?firstFailure:0);return;}const timer=window.setTimeout(()=>{setFocus(revealed);setRevealed(v=>v+1)},620);return()=>window.clearTimeout(timer)},[running,revealed]);
  const change=(value:Regression)=>{setRegression(value);setRevealed(0);setFocus(0);setRunning(false);setAccepted(false)};
  const simulating=regression!=='none';
  const feedback=simulating
    ? revealed===4?'已检出模拟缺陷。请返回当前代码重新验收。':'此情境故意加入缺陷，不会改动补丁实验中的代码。'
    : accepted?'已记录通过验收的版本。':revealed===4&&!allPass?'当前补丁未通过，请回“让补丁接受实际测试”调整后重测。':'当前代码全部通过后，才能接受这个版本。';
  const result=results[focus];
  return <div shuku-edit-id="e-1cd0d924-0f94-4700-950e-b6309206bbf0" className="actlab-acceptance"><div shuku-edit-id="e-d0cec495-ee49-4910-a30d-43299e2c172d" className="actlab-acceptance-head"><div shuku-edit-id="e-c7bc5b8a-0451-491b-a23c-5119c8823cb1"><T variant="h3">{simulating?'模拟缺陷实验':memory.patch===null?'演示基准 B1':`当前补丁 P${memory.revision}`}</T><T variant="bodySmall" tone="muted">{simulating?'观察验收能否发现故意加入的问题。':memory.patch===null?'直接进入本页，加载已修复的演示代码。':'沿用上一页实际应用的代码。'}</T></div><div shuku-edit-id="e-0a6259e1-3cca-4845-ba00-272f07594dbe" className="actlab-controls">{(['none','resume','record'] as Regression[]).map((value,i)=><Button key={value} active={regression===value} disabled={running} onClick={()=>change(value)}>{['当前代码','模拟继续重置','模拟重复记录'][i]}</Button>)}</div></div>
    <div shuku-edit-id="e-9257da7b-2dc8-4801-9118-40f77e8b85ee" className="actlab-acceptance-grid"><div shuku-edit-id="e-59f4d33c-be7e-4f3c-96c1-f2c2799fad26" className="actlab-test-list">{results.map((test,i)=><Button key={test.id} active={focus===i} className={revealed>i?(test.pass?'is-pass':'is-fail'):''} onClick={()=>setFocus(i)}><LabStatus state={revealed>i?(test.pass?'pass':'fail'):running&&i===revealed?'busy':'idle'}>{String(i+1).padStart(2,'0')}</LabStatus><T>{test.label}</T><T variant="bodySmall" tone="inherit">{revealed>i?(test.pass?'通过':'失败'):'待验证'}</T></Button>)}</div><div shuku-edit-id="e-d8048698-ca71-4b14-97b6-423a07899231" className="actlab-test-detail"><T variant="bodySmall" tone="muted">测试证据 / {result.id}</T><div shuku-edit-id="e-ede7e616-f171-40ef-97fa-82906252b3eb" className="actlab-test-procedure">{result.steps.map((step,i)=><T key={step} variant="bodySmall">{i+1}. {step}</T>)}</div><div shuku-edit-id="e-ebd3c68e-d53f-4773-8af8-488f3776f049" className="actlab-result-pair"><div shuku-edit-id="e-964e0feb-3d93-42ad-b56c-0599420e66d6"><T variant="bodySmall" tone="muted">预期</T><T variant="h3">{result.expected}</T></div><div shuku-edit-id="e-a1747f56-1c2e-401a-aad2-8c0e9c28090e"><T variant="bodySmall" tone="muted">实际</T><T variant="h3" tone={revealed>focus?(result.pass?'success':'danger'):'muted'}>{revealed>focus?result.actual:'等待运行'}</T></div></div></div></div>
    <div shuku-edit-id="e-3f4c806d-a747-4b59-8d87-ca86c9984d4b" className="actlab-acceptance-footer"><Button variant="primary" disabled={running} onClick={()=>{setRevealed(0);setFocus(0);setRunning(true);setAccepted(false)}}>运行四项验收</Button>{simulating?<Button disabled={running} onClick={()=>change('none')}>返回当前代码</Button>:<Button disabled={revealed<4||!allPass||running} onClick={()=>{setAccepted(true);updateLab({verified:true})}}>接受这个版本</Button>}<T variant="bodySmall" tone={simulating?'accent':accepted?'success':revealed===4&&!allPass?'danger':'muted'}>{feedback}</T></div>
  </div>;
}

export function CallBudgetExercise() {
  const [correct,setCorrect]=useState(false);
  return <div shuku-edit-id="e-505b8dd2-7100-41fb-8f9f-909f6274773f" className="actlab-budget-exercise"><div shuku-edit-id="e-8e1e8620-c6cd-45cb-8963-8dd01ec9ab5c" className="actlab-spent-calls">{['读取文件','写入补丁','重新测试'].map((name,i)=><div shuku-edit-id="e-c2f6ae1e-7a0d-4695-933c-49a935678964" className={`${i<2?'is-spent':correct?'is-reserved':'is-needed'}`} key={name}><T variant="display">{i+1}</T><T>{name}</T><T variant="bodySmall" tone="muted">{i<2?'已消耗一次调用':correct?'预算已预留':'尚未执行'}</T></div>)}</div>
    <Question type="fill" title="最小工具调用上限是" blanks={[{label:'最小总上限',placeholder:'填数字'}]} answer={['3']} textVariant="body" feedback={{initial:'读文件和写补丁已经完成，重新测试尚未执行。',correct:'总共 3 次，已用 2 次，还要为复测保留 1 次。',wrong:'把已经完成的调用和剩余复测一起数一遍。'}} onCheck={result=>setCorrect(result.ok)}/>
  </div>;
}

export function BudgetSimulator() {
  const [budget,setBudget]=useState(2);
  const [detour,setDetour]=useState(false);
  const [completed,setCompleted]=useState(0);
  const [running,setRunning]=useState(false);
  const [hasRun,setHasRun]=useState(false);
  const calls=detour?['重复预览','读取文件','应用补丁','重新测试']:['读取文件','应用补丁','重新测试'];
  useEffect(()=>{if(!running)return;if(completed>=Math.min(budget,calls.length)){setRunning(false);return;}const timer=window.setTimeout(()=>setCompleted(v=>v+1),620);return()=>window.clearTimeout(timer)},[running,completed,budget,calls.length]);
  const verified=completed===calls.length;
  const modified=calls.slice(0,completed).includes('应用补丁');
  const inspected=calls.slice(0,completed).includes('读取文件');
  const invalidate=()=>{setCompleted(0);setRunning(false);setHasRun(false)};
  return <div shuku-edit-id="e-48dfc4f9-334e-485d-893d-753e9b779b2e" className="actlab-budget-simulator"><div shuku-edit-id="e-d5bcfdee-b925-4e0b-aa7a-d3c9b1ce4b45" className="actlab-budget-controls"><RangeControl label="最大工具调用次数" min={1} max={5} step={1} value={budget} suffix=" 次" onChange={e=>{setBudget(Number(e.target.value));invalidate()}}/><Button active={detour} onClick={()=>{setDetour(v=>!v);invalidate()}}>开头增加一次重复预览</Button><Button variant="primary" disabled={running} onClick={()=>{setCompleted(0);setHasRun(true);setRunning(true)}}>运行这条轨迹</Button></div>
    <div shuku-edit-id="e-7c9afd73-90a9-4eac-b2f4-babc02d9d024" className="actlab-call-track">{calls.map((name,i)=><div shuku-edit-id="e-809e484f-cdbe-4300-8f2a-bd41b6147205" key={name} className={`actlab-call-cell ${completed>i?'is-done':''} ${running&&completed===i?'is-current':''} ${i>=budget?'is-outside':''}`}><div shuku-edit-id="e-04999d3a-3329-4c6b-8e80-ecb3e61063e3" className="actlab-call-token"><T variant="h3">{i+1}</T></div><T>{name}</T><T variant="bodySmall" tone="muted">{i>=budget?'超过预算':completed>i?'已执行':'等待执行'}</T></div>)}</div>
    <div shuku-edit-id="e-a4e61025-7efc-4142-8854-ead99d5b0135" className="actlab-budget-output"><div shuku-edit-id="e-cb7e655c-60b8-49e0-bc0b-e351a40eb3e9" className="actlab-budget-file"><div shuku-edit-id="e-438ec154-078d-4e88-b153-c29aa23faadb" className="actlab-file-mini"/><T variant="h3">{verified?'已验证':modified?'已修改，未验证':inspected?'已读取，未修改':'尚未取得实现证据'}</T></div><div shuku-edit-id="e-400b7871-baaa-4df5-a363-d66c83b02ae4"><LabStatus state={running?'busy':verified?'pass':hasRun?'warn':'idle'}>{running?`正在消耗第 ${completed+1} 次调用`:hasRun?`实际使用 ${completed} / ${budget} 次`:'等待运行'}</LabStatus><T>{verified?`重新测试返回 ${pauseProbe(fixedProgram).actual}，与预期一致。`:hasRun?'调用额度用完后，不能把未验证的代码称为已完成。':'同一条轨迹，上限会改变它停下的位置。'}</T></div></div>
  </div>;
}
