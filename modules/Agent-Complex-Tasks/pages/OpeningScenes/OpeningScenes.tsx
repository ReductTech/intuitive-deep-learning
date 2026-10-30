import { useEffect, useState } from 'react';
import { Button, RangeControl, Typography } from '../../../shared/react';
import { ClockDial, CodeLines, LabStatus, LabText as T, WorkingTimer } from '../../components/LabAtoms';
import { brokenProgram, clockText, newClock, pauseClock, pauseProbe, startClock, tickClock, type ClockState } from '../../model/labModel';
import { updateLab, useLabMemory } from '../../model/labMemory';
import '../../components/LabAtoms.css';

export const FRONT_LEADS = [
  '接下一张开发工单，亲手判断第一版能不能交付。',
  '把模型的请求送到正确工具，观察文件何时真正改变。',
  '为每个需求选一个验收条件，把“能用”说清楚。',
  '在任意时刻按下暂停，把“应该发生的”和“实际发生的”放在一起。',
  '同一个 B0 版本，分别读取、测试、试玩；比较得到的证据。',
  '把一段执行记录放回正确的位置，分清目标、行动和观察。',
  '你决定下一步查什么，再看工具返回如何改变下一次判断。',
  '点击代码行，跟踪界面标记和定时回调的变化。',
  '把代码块放进暂停函数，应用后用同一项测试检验。',
  '暂停通过后，继续检查恢复、提醒和记录。',
  '已花掉两次调用，给最后一次复测留出位置。',
  '调整调用预算，比较任务在不同位置停下时留下了什么。',
];

export function LaunchStudio() {
  const memory=useLabMemory();
  const [phase,setPhase]=useState(0);
  const [attempt,setAttempt]=useState(0);
  const [paused,setPaused]=useState(false);
  const [verdict,setVerdict]=useState<'accept'|'test'|null>(null);
  useEffect(()=>{
    if(!attempt||phase>=4)return;
    const timer=window.setTimeout(()=>{setPhase(v=>v+1);if(phase===3)updateLab({generated:true})},650);
    return()=>window.clearTimeout(timer);
  },[phase,attempt]);
  const lines=['创建 timer.js','连接开始与暂停按钮','打开应用预览','第一版 B0 已就绪'];
  return <div className="actlab-launch"><div className="actlab-brief">
    <LabStatus state="warn">今晚要用的小工具</LabStatus><T variant="h3">“帮我做个番茄钟。”</T><T>能开始、暂停和继续。到点提醒，记下今天完成了几轮。</T>
    <div className="actlab-ticket-bottom"><T variant="bodySmall" tone="muted">交付物</T><T>一个可以实际使用的应用</T></div>
    <Button variant="primary" disabled={attempt>0&&phase<4} onClick={()=>{setAttempt(v=>v+1);setPhase(0);setVerdict(null);setPaused(false)}}>{phase===4?'重新生成第一版':'交给智能体制作'}</Button>
  </div><div className={`actlab-studio ${phase===4?'is-ready':''}`}>
    <div className="actlab-windowbar"><span/><span/><span/><T variant="bodySmall" tone="muted">番茄钟 / {phase===4?'可操作预览':'工作区'}</T><LabStatus state={phase===4?'warn':attempt?'busy':'idle'}>{phase===4?'尚未验收':attempt?'生成中':'等待任务'}</LabStatus></div>
    {phase<4?<div className="actlab-buildspace"><div className={`actlab-build-core ${attempt?'is-active':''}`}><i/><i/><i/><T variant="h3">{attempt?'正在建立第一版':'任务还未开始'}</T></div><div className="actlab-build-log">{lines.map((line,i)=><div className={phase>i?'is-done':phase===i&&attempt?'is-current':''} key={line}><T variant="bodySmall" tone="inherit">{phase>i?'✓':String(i+1).padStart(2,'0')}　{line}</T></div>)}</div></div>:<div className="actlab-preview-reveal"><WorkingTimer compact onPause={()=>setPaused(true)}/><div className="actlab-launch-decision"><T variant="bodySmall">第一版已经出现，你准备怎么做？</T><div className="actlab-controls"><Button active={verdict==='accept'} onClick={()=>setVerdict('accept')}>直接交付</Button><Button active={verdict==='test'} onClick={()=>setVerdict('test')}>先验证行为</Button></div>{verdict&&<T variant="bodySmall" tone={verdict==='test'?'success':'warning'}>{verdict==='test'?'下一步先约定怎么验收。':paused?'你已经试过暂停，再核对数字是否真的停住。':'页面已经出现，暂停和记录还没有证据。'}</T>}</div></div>}
    <div className="actlab-studio-caption"><T variant="bodySmall" tone="muted">预设生成轨迹 · 预览计时可真实操作{memory.generated?' · 第一版已保存':''}</T></div>
  </div></div>;
}

export function ToolPipeline() {
  const [target,setTarget]=useState<'read'|'write'|null>(null);
  const [phase,setPhase]=useState(0);
  const [running,setRunning]=useState(false);
  const [error,setError]=useState(false);
  useEffect(()=>{if(!running)return;const timer=window.setTimeout(()=>{if(phase>=3){setRunning(false);updateLab({written:true});return;}setPhase(v=>v+1)},600);return()=>window.clearTimeout(timer)},[phase,running]);
  const send=()=>{if(target!=='write'){setError(true);return;}setError(false);setPhase(0);setRunning(true)};
  const choose=(value:'read'|'write')=>{if(running)return;setTarget(value);setError(false);setPhase(0)};
  return <div className="actlab-pipeline"><div className="actlab-pipeline-top"><T variant="h3">这段文本怎样变成文件变化？</T><LabStatus state={phase===3?'pass':running?'busy':'idle'}>{phase===3?'已收到写入回执':running?'正在执行请求':'工具请求尚未执行'}</LabStatus></div>
    <div className="actlab-pipeline-stage"><div className="actlab-request-packet" draggable onDragStart={e=>e.dataTransfer.setData('text/plain','tool-request')}><T variant="bodySmall" tone="muted">语言模型提出</T><CodeLines lines={['write_file({','  path: "timer.js",','  content: firstDraft','})']}/><T variant="bodySmall" tone="muted">拖到工具，或点选下方工具</T></div>
      <div className={`actlab-channel phase-${phase} ${running?'is-running':''}`}><div className="actlab-channel-rail"><i/></div><T variant="bodySmall" tone="accent">{phase===0?'待执行':phase===1?'校验请求':phase===2?'写入文件':'返回回执'}</T><div className="actlab-runtime-chip"><T variant="bodySmall">执行程序</T></div></div>
      <div className="actlab-file-result"><div className="actlab-file-page"><div className="actlab-file-fold"/><T variant="h3">timer.js</T><div className={`actlab-file-lines ${phase>=2?'is-written':''}`}><i/><i/><i/><i/></div></div><LabStatus state={phase>=2?'warn':'idle'}>{phase>=2?'文件已更新，功能未测试':'磁盘文件未改变'}</LabStatus></div></div>
    <div className="actlab-pipeline-tools">{(['read','write'] as const).map(kind=><div key={kind} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(e.dataTransfer.getData('text/plain')==='tool-request')choose(kind)}}><Button active={target===kind} disabled={running} onClick={()=>choose(kind)}>{kind==='read'?'读取文件工具':'写入文件工具'}</Button></div>)}<Button variant="primary" disabled={!target||running} onClick={send}>{phase===3?'再次执行':'执行所选工具'}</Button><T variant="bodySmall" tone={error?'danger':'muted'}>{error?'读取工具只能取回内容，无法执行写入请求。':phase===3?'模型拿到回执后，才能知道文件修改完成。':'生成请求时，文件本身还不会改变。'}</T></div>
  </div>;
}

const specs=[
  {id:'start',name:'开始',question:'按下开始后，什么结果算正确？',options:['时间开始倒数','只把按钮换个颜色'],answer:0,result:['数字每秒减少','数字保持不变'],rule:'从 25 分钟开始倒数'},
  {id:'pause',name:'暂停与继续',question:'暂停再继续，应该怎样处理剩余时间？',options:['继续时重新计满一轮','停住，并从剩余时间继续'],answer:1,result:['剩余 3 秒重新变成 5 秒','暂停后保持 3 秒，继续后变成 2 秒'],rule:'暂停保留剩余值，继续不重置'},
  {id:'notice',name:'到点提醒',question:'到 0 后，提醒应该出现几次？',options:['一次','每次刷新都提醒'],answer:0,result:['同一轮只出现一次完成提醒','同一轮反复出现提醒'],rule:'到 0 只提醒一次'},
  {id:'record',name:'记录轮数',question:'同一轮收到两次完成事件，记录怎么变？',options:['完成轮数加 2','完成轮数只加 1'],answer:1,result:['同一轮被记了两次','重复事件不会增加记录'],rule:'同一轮只增加 1 次记录'},
];
function RuleSimulation({kind,correct,active}:{kind:number;correct:boolean;active:boolean}) {
  const [frame,setFrame]=useState(0);
  useEffect(()=>{if(!active||frame>=2)return;const timer=window.setTimeout(()=>setFrame(v=>v+1),650);return()=>window.clearTimeout(timer)},[active,frame]);
  const scenes=[
    {values:correct?['00:05','00:04','00:03']:['00:05','00:05','00:05'],events:['按下开始','经过 1 秒','再过 1 秒']},
    {values:correct?['00:03','00:03','00:02']:['00:03','00:05','00:04'],events:['暂停在 3 秒','按下继续','再过 1 秒']},
    {values:correct?['0 次','1 次','1 次']:['0 次','1 次','2 次'],events:['接近结束','首次完成事件','再次刷新']},
    {values:correct?['0 轮','1 轮','1 轮']:['0 轮','1 轮','2 轮'],events:['尚未完成','首次完成事件','重复完成事件']},
  ];
  const scene=scenes[kind];
  return <div className={`actlab-rule-sim ${active?'is-active':''}`}><T variant="display" tone={active&&frame===2?(correct?'success':'danger'):'accent'} key={frame}>{scene.values[frame]}</T><T variant="bodySmall" tone="muted">{active?scene.events[frame]:'产品行为预览'}</T><div className="actlab-rule-beats" aria-hidden="true">{[0,1,2].map(i=><i key={i} className={active&&frame>=i?'is-on':''}/>)}</div></div>;
}
export function SpecificationLab() {
  const memory=useLabMemory();
  const [focus,setFocus]=useState(0);
  const [selection,setSelection]=useState<number|null>(null);
  const [observed,setObserved]=useState(false);
  const [trial,setTrial]=useState(0);
  const current=specs[focus];
  const saved=memory.contracts.includes(focus);
  const select=(index:number)=>{setFocus(index);setSelection(null);setObserved(false)};
  return <div className="actlab-spec"><div className="actlab-spec-spine">{specs.map((spec,i)=><Button key={spec.id} className="actlab-spec-tab" active={focus===i} onClick={()=>select(i)}><T variant="bodySmall" tone="muted">{memory.contracts.includes(i)?'✓':String(i+1).padStart(2,'0')}</T><T>{spec.name}</T></Button>)}</div>
    <div className="actlab-spec-detail"><T variant="h3">{current.question}</T><div className="actlab-spec-choices">{current.options.map((option,i)=><Button key={option} active={selection===i} onClick={()=>{setSelection(i);setObserved(false)}}>{option}</Button>)}</div>
      <div className={`actlab-spec-preview ${observed?'is-observed':''}`} key={`${focus}-${selection}-${observed}-${trial}`}><RuleSimulation kind={focus} correct={selection===current.answer} active={observed}/><T tone={observed?(selection===current.answer?'success':'warning'):'muted'}>{observed&&selection!==null?current.result[selection]:'选定规则后，演示它对产品行为的影响。'}</T></div>
      <div className="actlab-spec-actions"><Button variant="primary" disabled={selection===null} onClick={()=>{setTrial(v=>v+1);setObserved(true);if(selection===current.answer)updateLab({contracts:[...new Set([...memory.contracts,focus])]})}}>试用这条规则</Button><LabStatus state={saved?'pass':'idle'}>{saved?'已写入验收约定':`${memory.contracts.length} / 4 条约定已确认`}</LabStatus></div>
      {saved&&<div className="actlab-contract-strip"><T variant="bodySmall" tone="muted">当前验收约定</T><T>{current.rule}</T></div>}
    </div></div>;
}

export function PauseMicroscope() {
  const [state,setState]=useState(()=>newClock());
  const [automatic,setAutomatic]=useState(false);
  const [anchor,setAnchor]=useState<number|null>(null);
  const [elapsed,setElapsed]=useState(0);
  const [scrub,setScrub]=useState(0);
  useEffect(()=>{if(!automatic||!state.callbackRegistered)return;const timer=window.setTimeout(()=>advance(),1000);return()=>window.clearTimeout(timer)},[automatic,state,anchor]);
  const advance=()=>{const next=tickClock(state,brokenProgram);setState(next);if(anchor!==null){setElapsed(v=>v+1);setScrub(elapsed+1);updateLab({pauseEvidence:{before:anchor,after:next.remaining,elapsed:elapsed+1}})}};
  const reset=()=>{setState(newClock());setAnchor(null);setElapsed(0);setScrub(0);setAutomatic(false)};
  const expected=anchor??state.remaining;
  const observed=anchor===null?state.remaining:Math.max(0,anchor-scrub);
  return <div className="actlab-microscope"><div className="actlab-preview-island"><LabStatus state={anchor!==null?'warn':state.running?'busy':'idle'}>{anchor!==null?'界面显示已暂停':'第一版 B0'}</LabStatus><ClockDial state={state} ghost={anchor} label={anchor!==null?'按钮已暂停':undefined}/><div className="actlab-controls"><Button variant="primary" disabled={state.running||state.completed} onClick={()=>setState(s=>startClock(s))}>开始</Button><Button disabled={!state.running} onClick={()=>{setAnchor(state.remaining);setElapsed(0);setScrub(0);setState(s=>pauseClock(s,brokenProgram))}}>暂停并取证</Button><Button onClick={reset}>重置</Button></div><div className="actlab-controls"><Button disabled={!state.callbackRegistered||automatic} onClick={advance}>推进 1 秒</Button><Button active={automatic} disabled={!state.callbackRegistered} onClick={()=>setAutomatic(v=>!v)}>{automatic?'关闭自动时钟':'自动时钟'}</Button></div></div>
    <div className="actlab-evidence-island"><div><T variant="bodySmall" tone="muted">暂停之后，时间应该停在哪里？</T><T variant="h3">{anchor===null?'先选一个时刻暂停':'同一时刻，两条轨迹'}</T></div><div className="actlab-trace-lanes"><div><T variant="bodySmall" tone="muted">预期</T><div className="actlab-trace-rail"><span style={{width:`${expected/5*100}%`}}/></div><T variant="h3" tone="success">{clockText(expected)}</T></div><div><T variant="bodySmall" tone="muted">实际</T><div className="actlab-trace-rail is-actual"><span style={{width:`${observed/5*100}%`}}/></div><T variant="h3" tone={anchor!==null&&scrub>0?'danger':'accent'}>{clockText(observed)}</T></div></div>
      <RangeControl label="回看暂停后的时间" min={0} max={Math.max(elapsed,1)} step={1} value={Math.min(scrub,Math.max(elapsed,1))} disabled={elapsed===0} suffix=" 秒" onChange={e=>setScrub(Number(e.target.value))}/>
      <div className={`actlab-evidence-note ${elapsed?'is-visible':''}`}><LabStatus state={elapsed?'fail':'idle'}>{elapsed?'已捕捉失败证据':'等待一次暂停操作'}</LabStatus><T variant="bodySmall">{elapsed?`暂停时 ${clockText(anchor??0)}，经过 ${elapsed} 秒后实际为 ${clockText(state.remaining)}。`:'手动时钟让你控制每一秒；也可以打开自动时钟。'}</T></div>
    </div></div>;
}

export function ToolsWorkbench() {
  const [tool,setTool]=useState(0);
  const [phase,setPhase]=useState<'idle'|'running'|'done'>('idle');
  const [wait,setWait]=useState(2);
  const [runId,setRunId]=useState(0);
  useEffect(()=>{if(phase!=='running')return;const timer=window.setTimeout(()=>setPhase('done'),750);return()=>window.clearTimeout(timer)},[phase]);
  const evidence=pauseProbe(brokenProgram,wait);
  const select=(i:number)=>{setTool(i);setPhase('idle')};
  return <div className="actlab-tools"><div className="actlab-tool-dock">{['读取文件','运行测试','打开预览'].map((name,i)=><Button key={name} active={tool===i} onClick={()=>select(i)}><T variant="h3" tone="inherit">{['{ }','✓','▷'][i]}</T><T>{name}</T></Button>)}</div><div className="actlab-tool-workspace"><div className="actlab-windowbar"><T variant="bodySmall">B0 / {['timer.js','pause-freezes-time','应用预览'][tool]}</T><LabStatus state={phase==='running'?'busy':phase==='done'?'pass':'idle'}>{phase==='running'?'工具运行中':phase==='done'?`第 ${runId} 次返回`:'等待执行'}</LabStatus></div>
      {tool===1&&<div className="actlab-tool-parameters"><RangeControl label="暂停后推进时间" min={1} max={3} value={wait} suffix=" 秒" onChange={e=>{setWait(Number(e.target.value));setPhase('idle')}}/></div>}
      <div className={`actlab-tool-body ${phase==='running'?'is-running':''}`}>
        {phase==='idle'?<div className="actlab-tool-empty"><div className="actlab-tool-object">{['timer.js','TEST','B0'][tool]}</div><T>执行{['读取','测试','打开预览'][tool]}，拿到这一版本的证据。</T></div>:phase==='running'?<div className="actlab-tool-loading"><i/><T>正在执行当前工具…</T></div>:tool===0?<><CodeLines lines={['function pauseTimer() {','  running = false;','}']}/><T variant="bodySmall" tone="muted">文件内容告诉你实现是什么，测试才会告诉你行为是否符合约定。</T></>:tool===1?<div className="actlab-test-return"><LabStatus state={evidence.pass?'pass':'fail'}>{evidence.pass?'PASS':'FAIL'} · {evidence.id}</LabStatus><div className="actlab-result-pair"><div><T variant="bodySmall" tone="muted">expected</T><T variant="display">{evidence.expected}</T></div><div><T variant="bodySmall" tone="muted">received</T><T variant="display" tone="danger">{evidence.actual}</T></div></div><T variant="bodySmall">{evidence.steps.join('，')}。</T></div>:<WorkingTimer compact/>}
      </div><div className="actlab-tool-footer"><Button variant="primary" disabled={phase==='running'} onClick={()=>{setRunId(v=>v+1);setPhase('running')}}>{phase==='done'?'重新执行':'执行当前工具'}</Button><T variant="bodySmall" tone="muted">本地教学模拟 · 所有测试使用同一套计时逻辑</T></div>
    </div></div>;
}

const pieces=[{text:'“暂停时，剩余时间应保持不变。”',correct:0,source:'用户要求'}, {text:'run_test("pause-freezes-time")',correct:1,source:'一次工具调用'}, {text:'expected: 00:03 / received: 00:01',correct:2,source:'工具返回记录'}];
export function EvidenceSorter() {
  const [index,setIndex]=useState(0);
  const [placed,setPlaced]=useState<number[]>([]);
  const [wrong,setWrong]=useState<number|null>(null);
  const current=pieces[Math.min(index,2)];
  const place=(box:number)=>{if(index>=3)return;if(box!==current.correct){setWrong(box);return;}setPlaced(v=>[...v,index]);setIndex(v=>v+1);setWrong(null)};
  return <div className="actlab-sort"><div className="actlab-sort-head"><T variant="h3">执行记录里的三种信息</T><LabStatus state={index===3?'pass':'idle'}>{index===3?'全部归位':`${index} / 3 条已归位`}</LabStatus></div>
    <div className="actlab-evidence-slip" draggable={index<3} onDragStart={e=>e.dataTransfer.setData('text/plain','evidence')} key={index}><T variant="bodySmall" tone="muted">{index===3?'任务完成':`记录 ${index+1}`}</T><T variant="h3">{index===3?'观察为下一步行动提供依据':current.text}</T><T variant="bodySmall" tone="muted">{index===3?'失败记录说明当前结果，还不能代表任务已经完成。':'拖到对应位置，或直接点选目标区域。'}</T></div>
    <div className="actlab-evidence-bins">{['目标','行动','观察'].map((label,i)=><div key={label} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(e.dataTransfer.getData('text/plain')==='evidence')place(i)}}><Button active={placed.includes(i)} disabled={index===3} className={wrong===i?'is-wrong':''} onClick={()=>place(i)}><T variant="h3">{label}</T><T variant="bodySmall" tone="muted">{placed.includes(i)?pieces[i].source:['要实现什么','调用什么工具','工具返回什么'][i]}</T></Button></div>)}</div>
    <T variant="bodySmall" tone={wrong!==null?'warning':'muted'}>{wrong!==null?'再看这句话：它是在提出要求、发起操作，还是报告结果？':'每种信息在循环里承担不同的作用。'}</T>
  </div>;
}
