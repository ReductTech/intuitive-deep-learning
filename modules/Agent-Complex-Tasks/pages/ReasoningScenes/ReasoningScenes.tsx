import { useEffect, useMemo, useState } from 'react';
import { Button, Question, RangeControl, Typography } from '../../../shared/react';
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
  return <div className="actlab-react"><div className={`actlab-orbit phase-${phase}`}><svg viewBox="0 0 500 420" aria-hidden="true"><path className="actlab-orbit-track" d="M250 70 C420 70 470 220 370 330 C280 430 60 320 95 185 C110 100 180 70 250 70"/><path className={running?'actlab-orbit-signal is-traveling':'actlab-orbit-signal'} key={turn} d="M250 70 C420 70 470 220 370 330 C280 430 60 320 95 185 C110 100 180 70 250 70"/></svg><div className={`actlab-orbit-node is-decision ${phase===0||phase===3?'is-current':''}`}><T variant="h3">判断</T><T variant="bodySmall">下一步缺什么证据</T></div><div className={`actlab-orbit-node is-action ${phase===1?'is-current':''}`}><T variant="h3">行动</T><T variant="bodySmall">发出工具请求</T></div><div className={`actlab-orbit-node is-observe ${phase===2?'is-current':''}`}><T variant="h3">观察</T><T variant="bodySmall">读取真实返回</T></div><div className="actlab-orbit-center"><LabStatus state={running?'busy':phase===3?(selection===2?'warn':'pass'):'idle'}>{running?'一轮正在发生':phase===3?(selection===2?'交付依据不足':'带着新证据回来'):'ReAct'}</LabStatus></div></div>
    <div className="actlab-decision-desk"><div className="actlab-current-evidence"><T variant="bodySmall" tone="muted">已知证据</T><T>{phase===3&&info?info.result:'暂停后，剩余时间仍从 00:03 变为 00:01。'}</T></div><div className="actlab-action-menu">{reasoningChoices.map((item,i)=><Button key={item.title} active={selection===i} disabled={running} onClick={()=>{setSelection(i);setPhase(0)}}>{item.title}</Button>)}</div><Button variant="primary" disabled={selection===null||running} onClick={()=>{setPhase(selection===2?3:0);setRunning(selection!==2);setTurn(v=>v+1)}}>执行所选行动</Button>
      <div className="actlab-loop-feedback" aria-live="polite">{phase>=1&&info?<><Typography as="code" variant="bodySmall">{info.tool}</Typography><T variant="bodySmall" tone={selection===0?'accent':'warning'}>{phase>=3?info.note:phase===2?info.result:'工具正在执行本次请求。'}</T></>:<T variant="bodySmall" tone="muted">选择会影响得到的证据；返回后再做下一次判断。</T>}</div>
    </div></div>;
}

const traceLines=['let timerId = setInterval(() => {','  remaining -= 1;','  renderTime(remaining);','}, 1000);','','function pauseTimer() {','  running = false;','}'];
function HighlightCode({text}:{text:string}) {
  return <>{text.split(/(\blet\b|\bfunction\b|\bfalse\b|\b\d+\b|\bsetInterval\b|\brenderTime\b|\bpauseTimer\b)/g).map((part,i)=><span key={i} className={/^(let|function)$/.test(part)?'actlab-syntax-keyword':/^(false|\d+)$/.test(part)?'actlab-syntax-value':/^(setInterval|renderTime|pauseTimer)$/.test(part)?'actlab-syntax-function':undefined}>{part}</span>)}</>;
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
  return <div className="actlab-code-microscope"><div className="actlab-dark-editor"><div className="actlab-editor-bar"><T variant="bodySmall" tone="inherit">timer.js · 计时与暂停</T><T variant="bodySmall" tone="inherit">B0</T></div><div className="actlab-executable-lines">{traceLines.map((text,i)=><Button key={i} className={line===i?'is-current':''} disabled={text===''} aria-label={`查看第 ${i+1} 行 ${text}`} onClick={()=>runLine(i)}><Typography as="span" variant="bodySmall" tone="inherit" className="actlab-code-line-number">{String(i+1).padStart(2,'0')}</Typography><Typography as="code" variant="bodySmall" tone="inherit" className="actlab-source-line"><HighlightCode text={text||' '}/></Typography>{[0,1,6].includes(i)&&<i/>}</Button>)}</div></div>
    <div className="actlab-runtime-view"><T variant="h3">运行时观察</T><div className="actlab-runtime-variable"><T>界面标记 running</T><LabStatus state={state.running?'busy':'warn'}>{state.running?'true':'false'}</LabStatus></div><div className="actlab-runtime-variable"><T>定时回调</T><LabStatus state={state.callbackRegistered?(state.running?'busy':'fail'):'idle'}>{state.callbackRegistered?'仍已注册':'已停止'}</LabStatus></div><div className={`actlab-runtime-number ${tick?'has-ticked':''}`} key={tick}><T variant="bodySmall" tone="muted">remaining</T><T variant="display">{clockText(state.remaining)}</T></div><div className="actlab-cause-note"><T variant="bodySmall">{hint}</T></div></div>
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
  return <div className="actlab-patch-bench"><div className="actlab-patch-editor"><T variant="bodySmall" tone="muted">把代码块放进函数，顺序也会影响行为</T><div className="actlab-patch-function"><Typography as="code" variant="bodySmall">function pauseTimer() {'{'}</Typography><Typography as="code" variant="bodySmall">　running = false;</Typography><div className="actlab-patch-dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const op=e.dataTransfer.getData('text/plain');if(op in PATCHES)add(op as PatchOp)}}>{draft.length===0?<T variant="bodySmall" tone="muted">拖入代码块，或点选下方代码块</T>:draft.map((op,i)=><div key={op} className="actlab-patch-line"><Typography as="code" variant="bodySmall">{PATCHES[op].code}</Typography><Button disabled={running||i===0} aria-label={`上移${PATCHES[op].label}`} onClick={()=>move(i)}>↑</Button><Button disabled={running} aria-label={`移除${PATCHES[op].label}`} onClick={()=>remove(i)}>×</Button></div>)}</div><Typography as="code" variant="bodySmall">{'}'}</Typography></div>
      <div className="actlab-patch-bank">{(Object.keys(PATCHES) as PatchOp[]).map(op=><Button key={op} draggable={!running} disabled={draft.includes(op)||running} onDragStart={e=>e.dataTransfer.setData('text/plain',op)} onClick={()=>add(op)}><T variant="bodySmall">{PATCHES[op].label}</T></Button>)}</div></div>
    <div className="actlab-patch-test"><LabStatus state={stale?'warn':phase===3?(evidence?.pass?'pass':'fail'):running?'busy':'idle'}>{stale?'草稿已变，需重新应用':phase===3?(evidence?.pass?'暂停测试通过':'暂停测试失败'):running?'正在测试补丁':'准备一次可验证的修改'}</LabStatus><div className="actlab-patch-readouts"><div><T variant="bodySmall" tone="muted">预期</T><T variant="display">00:03</T></div><div><T variant="bodySmall" tone="muted">实际</T><T variant={evidence?.actual.includes("→")?"h3":"display"} tone={phase===3?(evidence?.pass?'success':'danger'):'muted'}>{phase===3&&!stale?evidence?.actual:'--:--'}</T></div></div><div className="actlab-probe-steps">{['从 5 秒开始','推进 2 秒','点击暂停','再推进 2 秒'].map((step,i)=><T key={step} variant="bodySmall" className={phase>=i?'is-done':''}>{phase>=i?'●':'○'}　{step}</T>)}</div><Button variant="primary" disabled={running} onClick={()=>{setApplied([...draft]);setPhase(0);setRunning(true);updateLab({patch:[...draft],revision:memory.revision+1,verified:false})}}>应用补丁并运行测试</Button><T variant="bodySmall" tone={phase===3&&!evidence?.pass?'warning':'muted'}>{phase===3&&!stale?(evidence?.pass?'此补丁修复了暂停；下一页还要检查其他行为。':failure):'结果只对应本次已应用的代码版本。'}</T></div>
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
  return <div className="actlab-acceptance"><div className="actlab-acceptance-head"><div><T variant="h3">{simulating?'模拟缺陷实验':memory.patch===null?'演示基准 B1':`当前补丁 P${memory.revision}`}</T><T variant="bodySmall" tone="muted">{simulating?'观察验收能否发现故意加入的问题。':memory.patch===null?'直接进入本页，加载已修复的演示代码。':'沿用上一页实际应用的代码。'}</T></div><div className="actlab-controls">{(['none','resume','record'] as Regression[]).map((value,i)=><Button key={value} active={regression===value} disabled={running} onClick={()=>change(value)}>{['当前代码','模拟继续重置','模拟重复记录'][i]}</Button>)}</div></div>
    <div className="actlab-acceptance-grid"><div className="actlab-test-list">{results.map((test,i)=><Button key={test.id} active={focus===i} className={revealed>i?(test.pass?'is-pass':'is-fail'):''} onClick={()=>setFocus(i)}><LabStatus state={revealed>i?(test.pass?'pass':'fail'):running&&i===revealed?'busy':'idle'}>{String(i+1).padStart(2,'0')}</LabStatus><T>{test.label}</T><T variant="bodySmall" tone="inherit">{revealed>i?(test.pass?'通过':'失败'):'待验证'}</T></Button>)}</div><div className="actlab-test-detail"><T variant="bodySmall" tone="muted">测试证据 / {result.id}</T><div className="actlab-test-procedure">{result.steps.map((step,i)=><T key={step} variant="bodySmall">{i+1}. {step}</T>)}</div><div className="actlab-result-pair"><div><T variant="bodySmall" tone="muted">预期</T><T variant="h3">{result.expected}</T></div><div><T variant="bodySmall" tone="muted">实际</T><T variant="h3" tone={revealed>focus?(result.pass?'success':'danger'):'muted'}>{revealed>focus?result.actual:'等待运行'}</T></div></div></div></div>
    <div className="actlab-acceptance-footer"><Button variant="primary" disabled={running} onClick={()=>{setRevealed(0);setFocus(0);setRunning(true);setAccepted(false)}}>运行四项验收</Button>{simulating?<Button disabled={running} onClick={()=>change('none')}>返回当前代码</Button>:<Button disabled={revealed<4||!allPass||running} onClick={()=>{setAccepted(true);updateLab({verified:true})}}>接受这个版本</Button>}<T variant="bodySmall" tone={simulating?'accent':accepted?'success':revealed===4&&!allPass?'danger':'muted'}>{feedback}</T></div>
  </div>;
}

export function CallBudgetExercise() {
  const [correct,setCorrect]=useState(false);
  return <div className="actlab-budget-exercise"><div className="actlab-spent-calls">{['读取文件','写入补丁','重新测试'].map((name,i)=><div className={`${i<2?'is-spent':correct?'is-reserved':'is-needed'}`} key={name}><T variant="display">{i+1}</T><T>{name}</T><T variant="bodySmall" tone="muted">{i<2?'已消耗一次调用':correct?'预算已预留':'尚未执行'}</T></div>)}</div>
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
  return <div className="actlab-budget-simulator"><div className="actlab-budget-controls"><RangeControl label="最大工具调用次数" min={1} max={5} step={1} value={budget} suffix=" 次" onChange={e=>{setBudget(Number(e.target.value));invalidate()}}/><Button active={detour} onClick={()=>{setDetour(v=>!v);invalidate()}}>开头增加一次重复预览</Button><Button variant="primary" disabled={running} onClick={()=>{setCompleted(0);setHasRun(true);setRunning(true)}}>运行这条轨迹</Button></div>
    <div className="actlab-call-track">{calls.map((name,i)=><div key={name} className={`actlab-call-cell ${completed>i?'is-done':''} ${running&&completed===i?'is-current':''} ${i>=budget?'is-outside':''}`}><div className="actlab-call-token"><T variant="h3">{i+1}</T></div><T>{name}</T><T variant="bodySmall" tone="muted">{i>=budget?'超过预算':completed>i?'已执行':'等待执行'}</T></div>)}</div>
    <div className="actlab-budget-output"><div className="actlab-budget-file"><div className="actlab-file-mini"/><T variant="h3">{verified?'已验证':modified?'已修改，未验证':inspected?'已读取，未修改':'尚未取得实现证据'}</T></div><div><LabStatus state={running?'busy':verified?'pass':hasRun?'warn':'idle'}>{running?`正在消耗第 ${completed+1} 次调用`:hasRun?`实际使用 ${completed} / ${budget} 次`:'等待运行'}</LabStatus><T>{verified?`重新测试返回 ${pauseProbe(fixedProgram).actual}，与预期一致。`:hasRun?'调用额度用完后，不能把未验证的代码称为已完成。':'同一条轨迹，上限会改变它停下的位置。'}</T></div></div>
  </div>;
}
