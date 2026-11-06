import { useEffect, useState, type ReactNode } from 'react';
import { Button, Typography } from '../../../shared/react';

const Text = ({ children, tone = 'main', variant = 'body', className = '' }: { children: ReactNode; tone?: 'main'|'muted'|'accent'|'success'|'danger'|'warning'; variant?: 'body'|'bodySmall'|'h3'; className?: string }) => <Typography as="div" tone={tone} variant={variant} className={className}>{children}</Typography>;

const requirements = [
  { phrase: '开始', rule: '从 25 分钟开始倒数', proof: '按下开始后，数字每秒减少。' },
  { phrase: '暂停和继续', rule: '暂停时停住，继续不重置', proof: '暂停两秒后剩余值不变。' },
  { phrase: '到点提醒', rule: '到 0 只提醒一次', proof: '同一轮不会重复弹出完成提醒。' },
  { phrase: '记录轮数', rule: '完成一轮只加 1', proof: '到点后完成记录增加一次。' },
];

export function RequirementScene() {
  const [selected, setSelected] = useState<number | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  const choose = (i: number) => { setSelected(i); setSeen(v => v.includes(i) ? v : [...v, i]); };
  return <div className="act-requirement-scene">
    <div className="act-request"><Text variant="bodySmall" tone="muted">小林的原话</Text><Text variant="h3">“帮我做个番茄钟，今晚就想用。”</Text><div className="act-request-tokens">{requirements.map((r, i) => <button key={r.phrase} className={`act-token ${selected === i ? 'is-current' : ''} ${seen.includes(i) ? 'is-seen' : ''}`} onClick={() => choose(i)}>{r.phrase}</button>)}</div><Text variant="bodySmall" tone="muted">点选一句话里的行为，看它如何变成验收条件。</Text></div>
    <div className="act-specimen"><Text variant="bodySmall" tone="muted">可验证的行为</Text>{selected === null ? <div className="act-empty-prompt"><Text variant="h3">先选一个行为</Text><Text tone="muted">每个动词都需要对应的可观察结果。</Text></div> : <div className="act-specimen-content" key={selected}><Text variant="h3">{requirements[selected].rule}</Text><div className="act-proof"><Text variant="bodySmall" tone="muted">如何验收</Text><Text>{requirements[selected].proof}</Text></div></div>}<div className="act-spec-progress">{requirements.map((r, i) => <span key={r.phrase} className={seen.includes(i) ? 'filled' : ''}/>)}</div></div>
  </div>;
}

export function BugTimerScene() {
  const [remaining, setRemaining] = useState(5);
  const [mode, setMode] = useState<'ready'|'running'|'paused'|'done'>('ready');
  const [atPause, setAtPause] = useState<number | null>(null);
  const [ticksSincePause, setTicksSincePause] = useState(0);
  useEffect(() => {
    if (mode !== 'running' && mode !== 'paused') return;
    if (remaining === 0) { setMode('done'); return; }
    const timeout = window.setTimeout(() => { setRemaining(n => Math.max(0, n - 1)); if (mode === 'paused') setTicksSincePause(n => n + 1); }, 1000);
    return () => window.clearTimeout(timeout);
  }, [mode, remaining]);
  const reset = () => { setRemaining(5); setMode('ready'); setAtPause(null); setTicksSincePause(0); };
  return <div className="act-bug-scene">
    <div className="act-bug-app"><Text variant="bodySmall" tone="muted">第一版 B0 · 可操作预览</Text><div className="act-clock act-clock-large">00:{String(remaining).padStart(2,'0')}</div><div className="act-bug-buttons"><Button variant="primary" onClick={() => setMode('running')} disabled={mode==='running'||mode==='done'}>{mode==='paused'?'继续':'开始'}</Button><Button onClick={() => { setMode('paused'); setAtPause(remaining); }} disabled={mode!=='running'}>暂停</Button><Button onClick={reset}>重置</Button></div><Text tone={mode==='paused'?'warning':'muted'}>{mode==='paused'?'按钮显示“继续”，但请观察数字。':mode==='done'?'本轮结束。重置后可再试一次。':'请先开始，再按暂停。'}</Text></div>
    <div className="act-bug-evidence"><Text variant="bodySmall" tone="muted">两个状态应该一致</Text><div className="act-evidence-row"><Text>界面状态</Text><div className={`act-state-pill ${mode==='paused'?'paused':''}`}>{mode==='paused'?'已暂停':mode==='running'?'运行中':mode==='done'?'已结束':'待开始'}</div></div><div className="act-evidence-row"><Text>计时器</Text><div className={`act-tick-track ${mode==='paused'?'is-broken':''}`}><span style={{width:`${(5-remaining)*20}%`}}/></div></div>{atPause !== null && <div className="act-divergence" key={ticksSincePause}><Text variant="h3" tone={ticksSincePause>0?'danger':'warning'}>{ticksSincePause>0?`暂停后又减少 ${ticksSincePause} 秒`:'记住暂停这一刻'}</Text><Text>暂停时 00:{String(atPause).padStart(2,'0')}　当前 00:{String(remaining).padStart(2,'0')}</Text></div>}</div>
  </div>;
}

const roles = ['逻辑员','界面员','测试员'] as const;
const tasks = ['实现倒计时与暂停','制作按钮与时间显示','编写暂停验收用例'] as const;

export function RoleScene() {
  const [assigned, setAssigned] = useState<(number|null)[]>([null,null,null]);
  const [held, setHeld] = useState<number|null>(null);
  const [message, setMessage] = useState('先选一项任务，再把它交给合适的角色。');
  const [started, setStarted] = useState(false);
  const assign = (role: number, task: number|null = held) => {
    if (task === null) return;
    if (role !== task) { setMessage(`${roles[role]}不负责这项工作。检查职责后再试。`); return; }
    setAssigned(current => current.map((value,i) => i===task ? role : value));
    setHeld(null);
    setMessage(`${tasks[task]}已交给${roles[role]}。`);
  };
  return <div className="act-role-scene"><div className="act-task-pool"><Text variant="bodySmall" tone="muted">待分配任务</Text>{tasks.map((task,i) => <button key={task} draggable onDragStart={e => {e.dataTransfer.setData('text/plain',String(i));setHeld(i)}} onClick={()=>setHeld(i)} className={`act-task ${held===i?'is-held':''} ${assigned[i]!==null?'is-assigned':''}`}>{task}<span>{assigned[i]!==null?'已分配':'拖动或点选'}</span></button>)}</div><div className="act-role-targets">{roles.map((role,i)=><div key={role} className={`act-role-target ${assigned[i]!==null?'is-filled':''}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();assign(i,Number(e.dataTransfer.getData('text/plain')))}}><Text variant="h3">{role}</Text><Text tone="muted">{assigned[i]!==null?tasks[i]:'把对应任务放到这里'}</Text><Button onClick={()=>assign(i)} disabled={held===null||assigned[i]!==null}>分配给{role}</Button></div>)}</div><div className="act-role-footer"><Text tone={assigned.every(x=>x!==null)?'success':'muted'}>{started?'接口草案已确认：暂停函数统一叫 pauseTimer。':message}</Text>{assigned.every(x=>x!==null)&&!started&&<Button variant="primary" onClick={()=>setStarted(true)}>开始协作</Button>}</div></div>;
}

export function ParallelScene() {
  const [run, setRun] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!run || elapsed>=7) return;
    const timer = window.setTimeout(()=>setElapsed(x=>x+1),650);
    return ()=>window.clearTimeout(timer);
  },[run,elapsed]);
  const start = () => { setElapsed(0); setRun(x=>x+1); };
  const lines: [string,number,number,number][] = [['逻辑员',0,3,0],['界面员',0,2,3],['测试员',0,1,5],['集成检查',3,1,6]];
  return <div className="act-parallel-scene"><div className="act-parallel-head"><Text variant="h3">同一份工作，两种安排</Text><Button variant="primary" onClick={start}>{run?'重播时间线':'运行对比'}</Button></div><div className="act-parallel-boards"><div className="act-parallel-board"><Text variant="h3">并行准备</Text>{lines.map(([name,startAt,duration],i)=><div className="act-parallel-line" key={name}><Text variant="bodySmall">{name}</Text><div className="act-parallel-track"><span key={run} className={run&&elapsed>=startAt?'animate':''} style={{left:`${startAt*13}%`,width:`${duration*13}%`,animationDuration:`${duration*.65}s`,background:i===3?'var(--ui-success)':undefined}}/></div></div>)}<Text tone="success">准备 3 秒，集成 1 秒，共 4 秒</Text></div><div className="act-parallel-board"><Text variant="h3">依次准备</Text>{lines.map(([name,,duration,serialStart],i)=><div className="act-parallel-line" key={name}><Text variant="bodySmall">{name}</Text><div className="act-parallel-track"><span key={run} className={run&&elapsed>=serialStart?'animate':''} style={{left:`${serialStart*13}%`,width:`${duration*13}%`,animationDuration:`${duration*.65}s`,background:i===3?'var(--ui-success)':undefined}}/></div></div>)}<Text tone="accent">准备 6 秒，集成 1 秒，共 7 秒</Text></div></div><Text variant="bodySmall" tone="muted">这是一组预设教学时长，用来比较流程结构，并非实测性能。</Text></div>;
}

function Network({count, dense}:{count:number;dense:boolean}) {
  const points = Array.from({length:count},(_,i)=>({x:110+79*Math.cos(-Math.PI/2+i*2*Math.PI/count),y:100+79*Math.sin(-Math.PI/2+i*2*Math.PI/count)}));
  const center={x:110,y:100};
  const edges=dense?points.flatMap((a,i)=>points.slice(i+1).map(b=>[a,b])):points.map(a=>[a,center]);
  return <svg className="act-network-svg" viewBox="0 0 220 200" aria-hidden="true"><g key={`${count}-${dense}`} className="act-network-lines">{edges.map(([a,b],i)=><line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>)}</g>{!dense&&<circle className="hub" cx={center.x} cy={center.y} r="19"/>}{points.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="16"/><text x={p.x} y={p.y+5} textAnchor="middle">{i+1}</text></g>)}</svg>;
}

export function MessageScene() {
  const [count,setCount]=useState(3);
  return <div className="act-message-scene"><div className="act-message-control"><Text variant="h3">{count} 个工作角色</Text><input type="range" min="2" max="5" value={count} aria-label="工作角色数量" onChange={e=>setCount(Number(e.target.value))}/><Text variant="bodySmall" tone="muted">拖动人数，比较每人发送一次结果时的消息数。</Text></div><div className="act-network-pair"><div><Text variant="h3">集中汇报</Text><Network count={count} dense={false}/><Text tone="accent">{count} 条</Text></div><div><Text variant="h3">相互通知</Text><Network count={count} dense/><Text tone="warning">{count*(count-1)} 条</Text></div></div><Text variant="bodySmall" tone="muted">箭头方向省略；相互通知中，每对角色各发送一条，合计 n(n−1) 条。</Text></div>;
}

const workflow = ['代码版本','接口检查','功能测试','构建应用','预览验收','记录版本'];
export function WorkflowScene() {
  const [version,setVersion]=useState<'B0'|'B1'>('B0');
  const [step,setStep]=useState(-1);
  const [repair,setRepair]=useState(false);
  const [active,setActive]=useState(false);
  const failed=version==='B0'&&!repair;
  useEffect(()=>{
    if(!active)return;
    if(step>= (failed?2:5)){setActive(false);return;}
    const timer=window.setTimeout(()=>setStep(v=>v+1),520);
    return()=>window.clearTimeout(timer);
  },[active,step,failed]);
  const select=(v:'B0'|'B1')=>{setVersion(v);setStep(-1);setRepair(false);setActive(false)};
  return <div className="act-workflow-scene"><div className="act-version-rail"><button className={version==='B0'?'is-selected':''} onClick={()=>select('B0')}>B0 · 暂停缺陷</button><button className={version==='B1'?'is-selected':''} onClick={()=>select('B1')}>B1 · 已修复</button><Button variant="primary" onClick={()=>{setStep(-1);setActive(true)}}>运行交付检查</Button></div><div className="act-workflow-line">{workflow.map((node,i)=><div key={node} className={`act-workflow-node ${step>=i?'visited':''} ${step===i?'current':''} ${failed&&step===2&&i===2?'failed':''}`}><span className="act-node-index">{String(i+1).padStart(2,'0')}</span><Text>{node}</Text></div>)}</div><div className={`act-workflow-result ${step===2&&failed?'is-failure':''}`}>{step<0?<Text tone="muted">先选择版本，运行同一套检查。</Text>:step===2&&failed?<><Text variant="h3" tone="danger">功能测试失败，流程停在这里</Text><Text>暂停测试：预期时间不变，实际继续减少。</Text><Button onClick={()=>{setRepair(true);setStep(1);setActive(true)}}>修复并从失败节点复测</Button></>:step===5?<Text tone="success">检查全部通过，已记录交付版本。</Text>:<Text tone="accent">正在检查同一个代码版本…</Text>}</div></div>;
}

export function FullRunScene() {
  const [fault,setFault]=useState(0);
  const [phase,setPhase]=useState(0);
  const events=[['无缺陷','所有检查通过','记录可交付版本'],['暂停失效','功能测试失败','读取计时器并修复，复测通过'],['接口不一致','接口检查失败','统一函数名后复测通过']];
  return <div className="act-full-scene"><div className="act-scenario-rail">{events.map(([name],i)=><button key={name} className={fault===i?'is-selected':''} onClick={()=>{setFault(i);setPhase(0)}}>{name}</button>)}</div><div className="act-full-map"><div className={`act-full-stage ${phase>0?'is-on':''}`}><Text variant="bodySmall" tone="muted">01 多智能体</Text><Text variant="h3">提交逻辑、界面与测试</Text></div><div className={`act-full-stage ${phase>1?'is-on':''} ${phase===2&&fault>0?'is-failed':''}`}><Text variant="bodySmall" tone="muted">02 工作流</Text><Text variant="h3">{phase>=2?events[fault][1]:'接口、功能与构建检查'}</Text></div><div className={`act-full-stage ${phase>2?'is-on':''}`}><Text variant="bodySmall" tone="muted">03 {fault===0?'交付':'局部 ReAct'}</Text><Text variant="h3">{phase>=3?events[fault][2]:fault===0?'记录版本':'读证据、修改、复测'}</Text></div></div><Button variant="primary" onClick={()=>setPhase(p=>p>=3?0:p+1)}>{phase===0?'运行任务':phase===3?'重置情境':'继续运行'}</Button><Text variant="bodySmall" tone="muted">每次切换情境都会清空旧结果；同一轮的证据只对应当前版本。</Text></div>;
}

const fileSamples = [
  { name: 'timer.js', lines: ['function pauseTimer() {', '  running = false;', '}'], hint: '暂停函数只改了标记；定时回调仍会触发。' },
  { name: 'controls.js', lines: ['pauseButton.onclick = () => {', '  pauseTimer();', '}'], hint: '按钮已经正确调用暂停函数。' },
  { name: 'timer.test.js', lines: ['pause();', 'advanceClock(2);', 'expect(remaining).toBe(3);'], hint: '断言清楚表明：暂停后两秒，剩余值应该保持不变。' },
];
export function InvestigationScene() {
  const [file,setFile]=useState<number|null>(null);
  const [line,setLine]=useState<number|null>(null);
  return <div className="act-investigation-scene"><div className="act-file-rail"><Text variant="bodySmall" tone="muted">当前问题：按钮变了，倒计时没停</Text>{fileSamples.map((sample,i)=><button key={sample.name} onClick={()=>{setFile(i);setLine(null)}} className={file===i?'is-current':''}>{sample.name}<span>{i===0?'计时逻辑':i===1?'按钮连接':'验收用例'}</span></button>)}</div><div className="act-code-inspector"><Text variant="bodySmall" tone="muted">{file===null?'选择一份文件':fileSamples[file].name}</Text>{file===null?<div className="act-inspector-empty"><Text variant="h3">从哪里查起？</Text><Text>按钮已经响应，优先查看实际计时行为。</Text></div>:<><div className="act-code-lines">{fileSamples[file].lines.map((text,i)=><button key={`${file}-${i}`} className={line===i?'is-current':''} onClick={()=>setLine(i)}><span>{String(i+1).padStart(2,'0')}</span><code>{text}</code></button>)}</div><div className="act-inspector-feedback">{line===null?<Text tone="muted">点选一行，判断它与暂停失效有什么关系。</Text>:<Text tone={file===0&&line===1?'danger':'accent'}>{fileSamples[file].hint}</Text>}</div></>}</div></div>;
}

const patches = [
  { name: '只改按钮外观', code: 'pauseButton.classList.add("paused");', result: '00:03 → 00:01', status: '测试仍失败', detail: '数字继续减少；改变外观没有停止计时器。' },
  { name: '停止并清除计时器', code: 'clearInterval(timerId);\ntimerId = null;', result: '00:03 → 00:03', status: '测试通过', detail: '暂停后数字保持不变；接下来验收继续与完成。' },
];
export function PatchScene() {
  const [selected,setSelected]=useState<number|null>(null);
  const [tested,setTested]=useState(false);
  return <div className="act-patch-scene"><div className="act-patch-options">{patches.map((patch,i)=><button key={patch.name} className={selected===i?'is-current':''} onClick={()=>{setSelected(i);setTested(false)}}><Text variant="h3">{patch.name}</Text><code>{patch.code}</code></button>)}</div><div className="act-patch-compare"><div className="act-patch-preview"><Text variant="bodySmall" tone="muted">测试：暂停后推进 2 秒</Text><div className="act-patch-clock"><span>暂停时<br/>00:03</span><strong>→</strong><span className={tested&&selected===0?'is-wrong':''}>测试后<br/>{tested&&selected!==null?patches[selected].result.split('→')[1].trim():'--:--'}</span></div></div><Button variant="primary" disabled={selected===null} onClick={()=>setTested(true)}>应用补丁并测试</Button>{tested&&selected!==null&&<div className={`act-patch-result ${selected===0?'is-failed':'is-passed'}`}><Text variant="h3" tone={selected===0?'danger':'success'}>{patches[selected].status}</Text><Text>{patches[selected].detail}</Text></div>}</div></div>;
}

export function IntegrationScene() {
  const [merged,setMerged]=useState(false);
  const [aligned,setAligned]=useState(false);
  const [tested,setTested]=useState(false);
  return <div className="act-integration-scene"><div className="act-integration-code"><div><Text variant="bodySmall" tone="muted">逻辑员 · timer.js</Text><code>export function <mark>pauseTimer</mark>() {'{'}<br/>　clearInterval(timerId);<br/>{'}'}</code></div><div><Text variant="bodySmall" tone="muted">界面员 · controls.js</Text><code>pauseButton.onclick = () =&gt; {'{'}<br/>　timer.<button onClick={()=>{setAligned(true);setTested(false)}} title="点击统一函数名">{aligned?'pauseTimer':'stopTimer'}</button>();<br/>{'}'}</code></div></div><div className="act-integration-console"><Text variant="bodySmall" tone="muted">集成测试</Text><Button variant="primary" onClick={()=>{setMerged(true);setTested(true)}}>{merged?'重新运行集成测试':'合并并测试'}</Button>{tested&&<div className={aligned?'is-success':'is-error'}><Text variant="h3" tone={aligned?'success':'danger'}>{aligned?'暂停按钮调用成功':'TypeError: timer.stopTimer is not a function'}</Text><Text>{aligned?'函数名一致，页面可以调用计时逻辑。':'点击界面代码中的 stopTimer，把它与逻辑模块接口对齐。'}</Text></div>}</div></div>;
}
