import { useEffect, useState, type ReactNode } from 'react';
import { Button, Typography } from "@shuku/course-style/react";

const Text = ({ children, tone = 'main', variant = 'body', className = '' }: { children: ReactNode; tone?: 'main'|'muted'|'accent'|'success'|'danger'|'warning'; variant?: 'body'|'bodySmall'|'h3'; className?: string }) => <Typography shuku-edit-id="e-6058eb0d-ef9e-4409-8c17-b4ad1a7d0aa9" as="div" tone={tone} variant={variant} className={className}>{children}</Typography>;

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
  return <div shuku-edit-id="e-fc5fcf98-c72f-4d52-9ae5-5effab9890d5" className="act-requirement-scene">
    <div shuku-edit-id="e-94c6699a-abc6-419e-8ee1-f2945e41b6f2" className="act-request"><Text variant="bodySmall" tone="muted">小林的原话</Text><Text variant="h3">“帮我做个番茄钟，今晚就想用。”</Text><div shuku-edit-id="e-de225a32-be4c-4a7b-92ce-ddfdd0f2e8d1" className="act-request-tokens">{requirements.map((r, i) => <button shuku-edit-id="e-661dd6a5-eec6-4300-956f-dbf7493b8ce7" key={r.phrase} className={`act-token ${selected === i ? 'is-current' : ''} ${seen.includes(i) ? 'is-seen' : ''}`} onClick={() => choose(i)}>{r.phrase}</button>)}</div><Text variant="bodySmall" tone="muted">点选一句话里的行为，看它如何变成验收条件。</Text></div>
    <div shuku-edit-id="e-52e600f4-d1d3-4c2c-bb19-1366e57d8394" className="act-specimen"><Text variant="bodySmall" tone="muted">可验证的行为</Text>{selected === null ? <div shuku-edit-id="e-0520c54f-e057-46c6-80c7-dbaf64b3e0f9" className="act-empty-prompt"><Text variant="h3">先选一个行为</Text><Text tone="muted">每个动词都需要对应的可观察结果。</Text></div> : <div shuku-edit-id="e-a202e21f-73b5-42f8-a1b2-6196521a8787" className="act-specimen-content" key={selected}><Text variant="h3">{requirements[selected].rule}</Text><div shuku-edit-id="e-7acb18d4-b97c-40b3-bf9d-4a0f0400d781" className="act-proof"><Text variant="bodySmall" tone="muted">如何验收</Text><Text>{requirements[selected].proof}</Text></div></div>}<div shuku-edit-id="e-1a383728-5c65-4a70-a073-c8a278596963" className="act-spec-progress">{requirements.map((r, i) => <span shuku-edit-id="e-1593ee59-ffe5-47b2-a4f1-b6961234423e" key={r.phrase} className={seen.includes(i) ? 'filled' : ''}/>)}</div></div>
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
  return <div shuku-edit-id="e-f4146902-aef9-49af-87eb-fc3fde885b26" className="act-bug-scene">
    <div shuku-edit-id="e-e0e667ea-cea4-471b-b3e7-80efe125c523" className="act-bug-app"><Text variant="bodySmall" tone="muted">第一版 B0 · 可操作预览</Text><div shuku-edit-id="e-2ef28bf3-6605-4511-8e9e-7ca7024fc6a8" className="act-clock act-clock-large">00:{String(remaining).padStart(2,'0')}</div><div shuku-edit-id="e-c152f639-a9dc-4c9e-a9dc-678e35219130" className="act-bug-buttons"><Button variant="primary" onClick={() => setMode('running')} disabled={mode==='running'||mode==='done'}>{mode==='paused'?'继续':'开始'}</Button><Button onClick={() => { setMode('paused'); setAtPause(remaining); }} disabled={mode!=='running'}>暂停</Button><Button onClick={reset}>重置</Button></div><Text tone={mode==='paused'?'warning':'muted'}>{mode==='paused'?'按钮显示“继续”，但请观察数字。':mode==='done'?'本轮结束。重置后可再试一次。':'请先开始，再按暂停。'}</Text></div>
    <div shuku-edit-id="e-5f49d977-655d-4a0f-8a1e-68edb35600e6" className="act-bug-evidence"><Text variant="bodySmall" tone="muted">两个状态应该一致</Text><div shuku-edit-id="e-81e3416a-8da9-4cda-bbe9-68407b273c31" className="act-evidence-row"><Text>界面状态</Text><div shuku-edit-id="e-14e653c3-2107-49b6-a00f-6aca1b4dfbb9" className={`act-state-pill ${mode==='paused'?'paused':''}`}>{mode==='paused'?'已暂停':mode==='running'?'运行中':mode==='done'?'已结束':'待开始'}</div></div><div shuku-edit-id="e-62d88b4b-94e8-403e-9ccd-af22525629c4" className="act-evidence-row"><Text>计时器</Text><div shuku-edit-id="e-fc62be47-f731-4813-a9d3-2bfa1969d94f" className={`act-tick-track ${mode==='paused'?'is-broken':''}`}><span shuku-edit-id="e-30131c07-40a8-41c1-8345-441b620d3d20" style={{width:`${(5-remaining)*20}%`}}/></div></div>{atPause !== null && <div shuku-edit-id="e-dd8c44fc-9bb7-4e54-ac40-9fdda56125cb" className="act-divergence" key={ticksSincePause}><Text variant="h3" tone={ticksSincePause>0?'danger':'warning'}>{ticksSincePause>0?`暂停后又减少 ${ticksSincePause} 秒`:'记住暂停这一刻'}</Text><Text>暂停时 00:{String(atPause).padStart(2,'0')}　当前 00:{String(remaining).padStart(2,'0')}</Text></div>}</div>
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
  return <div shuku-edit-id="e-d6ed6349-614e-44e4-91ce-9906c23c6693" className="act-role-scene"><div shuku-edit-id="e-64c843f6-ac23-4e25-bede-311a3af60e99" className="act-task-pool"><Text variant="bodySmall" tone="muted">待分配任务</Text>{tasks.map((task,i) => <button shuku-edit-id="e-9c99cfc1-94ad-4b5d-a11b-c3d29b7a8380" key={task} draggable onDragStart={e => {e.dataTransfer.setData('text/plain',String(i));setHeld(i)}} onClick={()=>setHeld(i)} className={`act-task ${held===i?'is-held':''} ${assigned[i]!==null?'is-assigned':''}`}>{task}<span shuku-edit-id="e-1e11abc0-13f7-4c66-92be-d6712ef71c32">{assigned[i]!==null?'已分配':'拖动或点选'}</span></button>)}</div><div shuku-edit-id="e-872a94a1-36bb-4e7a-b5e1-71289eed9fb9" className="act-role-targets">{roles.map((role,i)=><div shuku-edit-id="e-5da0f8b0-eb1c-4dfd-99fe-d83dd5a8199d" key={role} className={`act-role-target ${assigned[i]!==null?'is-filled':''}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();assign(i,Number(e.dataTransfer.getData('text/plain')))}}><Text variant="h3">{role}</Text><Text tone="muted">{assigned[i]!==null?tasks[i]:'把对应任务放到这里'}</Text><Button onClick={()=>assign(i)} disabled={held===null||assigned[i]!==null}>分配给{role}</Button></div>)}</div><div shuku-edit-id="e-ed813bda-82b4-4e74-b3af-506816f8d240" className="act-role-footer"><Text tone={assigned.every(x=>x!==null)?'success':'muted'}>{started?'接口草案已确认：暂停函数统一叫 pauseTimer。':message}</Text>{assigned.every(x=>x!==null)&&!started&&<Button variant="primary" onClick={()=>setStarted(true)}>开始协作</Button>}</div></div>;
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
  return <div shuku-edit-id="e-deab8809-fa86-4a6d-b98f-d598bacab429" className="act-parallel-scene"><div shuku-edit-id="e-45181c67-5789-48ca-b6b6-3736746a62ca" className="act-parallel-head"><Text variant="h3">同一份工作，两种安排</Text><Button variant="primary" onClick={start}>{run?'重播时间线':'运行对比'}</Button></div><div shuku-edit-id="e-607167fe-4b7e-4851-8866-dd0cbe3aaa6a" className="act-parallel-boards"><div shuku-edit-id="e-b58eb738-8d47-49d4-bdbd-1a382f679bf1" className="act-parallel-board"><Text variant="h3">并行准备</Text>{lines.map(([name,startAt,duration],i)=><div shuku-edit-id="e-d36fa260-8ebe-4a89-8f52-e6c6bb97e821" className="act-parallel-line" key={name}><Text variant="bodySmall">{name}</Text><div shuku-edit-id="e-d9e2041d-4b20-4be2-932d-d530c415d3ce" className="act-parallel-track"><span shuku-edit-id="e-8a7c0ad9-d0d9-407e-8033-2f2aca1e4b4f" key={run} className={run&&elapsed>=startAt?'animate':''} style={{left:`${startAt*13}%`,width:`${duration*13}%`,animationDuration:`${duration*.65}s`,background:i===3?'var(--ui-success)':undefined}}/></div></div>)}<Text tone="success">准备 3 秒，集成 1 秒，共 4 秒</Text></div><div shuku-edit-id="e-aa1756cb-ed36-40d3-94ad-8377eda60208" className="act-parallel-board"><Text variant="h3">依次准备</Text>{lines.map(([name,,duration,serialStart],i)=><div shuku-edit-id="e-3b8b7b61-051a-4330-9784-efa0938a9bc4" className="act-parallel-line" key={name}><Text variant="bodySmall">{name}</Text><div shuku-edit-id="e-2b9a70a7-2e78-4bf8-8eb5-aeb08675ffea" className="act-parallel-track"><span shuku-edit-id="e-bd68aab6-64de-4c92-a734-294726befe55" key={run} className={run&&elapsed>=serialStart?'animate':''} style={{left:`${serialStart*13}%`,width:`${duration*13}%`,animationDuration:`${duration*.65}s`,background:i===3?'var(--ui-success)':undefined}}/></div></div>)}<Text tone="accent">准备 6 秒，集成 1 秒，共 7 秒</Text></div></div><Text variant="bodySmall" tone="muted">这是一组预设教学时长，用来比较流程结构，并非实测性能。</Text></div>;
}

function Network({count, dense}:{count:number;dense:boolean}) {
  const points = Array.from({length:count},(_,i)=>({x:110+79*Math.cos(-Math.PI/2+i*2*Math.PI/count),y:100+79*Math.sin(-Math.PI/2+i*2*Math.PI/count)}));
  const center={x:110,y:100};
  const edges=dense?points.flatMap((a,i)=>points.slice(i+1).map(b=>[a,b])):points.map(a=>[a,center]);
  return <svg shuku-edit-id="e-2212f46e-15ea-4d4a-87c2-0924ddb6ebe9" className="act-network-svg" viewBox="0 0 220 200" aria-hidden="true"><g shuku-edit-id="e-897e97a9-6570-4fa3-a4da-6d67bcd536e5" key={`${count}-${dense}`} className="act-network-lines">{edges.map(([a,b],i)=><line shuku-edit-id="e-7c70f998-64b4-4131-8ced-02a0bacaf829" key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>)}</g>{!dense&&<circle shuku-edit-id="e-70c920b2-17d0-436a-b10e-795e04eec8da" className="hub" cx={center.x} cy={center.y} r="19"/>}{points.map((p,i)=><g shuku-edit-id="e-b2d4dac9-3347-4156-a695-92d9cbc3e190" key={i}><circle shuku-edit-id="e-dcb748c9-417d-4d72-a002-934261747f16" cx={p.x} cy={p.y} r="16"/><text shuku-edit-id="e-70bfa6c6-df6a-433e-aaf4-54daf5a19376" x={p.x} y={p.y+5} textAnchor="middle">{i+1}</text></g>)}</svg>;
}

export function MessageScene() {
  const [count,setCount]=useState(3);
  return <div shuku-edit-id="e-a0f69ed3-cc47-4f11-a38a-6f2a945d7d8e" className="act-message-scene"><div shuku-edit-id="e-ce889dd1-c3e1-4f01-a69e-dc3be490745c" className="act-message-control"><Text variant="h3">{count} 个工作角色</Text><input shuku-edit-id="e-cf5cbb3f-a3f3-4ad5-9dd2-bcb15e50e798" type="range" min="2" max="5" value={count} aria-label="工作角色数量" onChange={e=>setCount(Number(e.target.value))}/><Text variant="bodySmall" tone="muted">拖动人数，比较每人发送一次结果时的消息数。</Text></div><div shuku-edit-id="e-8d6fab2d-e46e-4b0b-94da-5254085293c3" className="act-network-pair"><div shuku-edit-id="e-366cd4b9-0343-4c46-88c3-d4ace6978934"><Text variant="h3">集中汇报</Text><Network count={count} dense={false}/><Text tone="accent">{count} 条</Text></div><div shuku-edit-id="e-9780b069-ec2b-4942-abd9-32ee4c5c1681"><Text variant="h3">相互通知</Text><Network count={count} dense/><Text tone="warning">{count*(count-1)} 条</Text></div></div><Text variant="bodySmall" tone="muted">箭头方向省略；相互通知中，每对角色各发送一条，合计 n(n−1) 条。</Text></div>;
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
  return <div shuku-edit-id="e-70996adf-d1dc-45f3-9881-eb2fa6c21e22" className="act-workflow-scene"><div shuku-edit-id="e-b65698b3-6c4e-455b-bf3d-5eb76f0377ec" className="act-version-rail"><button shuku-edit-id="e-61259929-ec4a-451d-a0b7-b3318dc54186" className={version==='B0'?'is-selected':''} onClick={()=>select('B0')}>B0 · 暂停缺陷</button><button shuku-edit-id="e-f5e35d16-cdf1-402e-93a1-dc10bd1c575d" className={version==='B1'?'is-selected':''} onClick={()=>select('B1')}>B1 · 已修复</button><Button variant="primary" onClick={()=>{setStep(-1);setActive(true)}}>运行交付检查</Button></div><div shuku-edit-id="e-47aa2b6e-b877-4809-9049-cfdc323e6d4b" className="act-workflow-line">{workflow.map((node,i)=><div shuku-edit-id="e-2c677f7e-4b46-4daf-bff9-928959daef27" key={node} className={`act-workflow-node ${step>=i?'visited':''} ${step===i?'current':''} ${failed&&step===2&&i===2?'failed':''}`}><span shuku-edit-id="e-72005f2d-eb77-49a8-bcde-77185593cd9b" className="act-node-index">{String(i+1).padStart(2,'0')}</span><Text>{node}</Text></div>)}</div><div shuku-edit-id="e-a1dd5821-7104-4727-9d80-85ee4e84f949" className={`act-workflow-result ${step===2&&failed?'is-failure':''}`}>{step<0?<Text tone="muted">先选择版本，运行同一套检查。</Text>:step===2&&failed?<><Text variant="h3" tone="danger">功能测试失败，流程停在这里</Text><Text>暂停测试：预期时间不变，实际继续减少。</Text><Button onClick={()=>{setRepair(true);setStep(1);setActive(true)}}>修复并从失败节点复测</Button></>:step===5?<Text tone="success">检查全部通过，已记录交付版本。</Text>:<Text tone="accent">正在检查同一个代码版本…</Text>}</div></div>;
}

export function FullRunScene() {
  const [fault,setFault]=useState(0);
  const [phase,setPhase]=useState(0);
  const events=[['无缺陷','所有检查通过','记录可交付版本'],['暂停失效','功能测试失败','读取计时器并修复，复测通过'],['接口不一致','接口检查失败','统一函数名后复测通过']];
  return <div shuku-edit-id="e-ede778ff-94c5-4276-aabc-8303d492bdc7" className="act-full-scene"><div shuku-edit-id="e-9f8f572b-53c8-4ac8-90da-87b1ede037aa" className="act-scenario-rail">{events.map(([name],i)=><button shuku-edit-id="e-177923f0-2bac-4e61-a37e-325484bd5110" key={name} className={fault===i?'is-selected':''} onClick={()=>{setFault(i);setPhase(0)}}>{name}</button>)}</div><div shuku-edit-id="e-75896659-eb7a-47db-9bf3-2d179eab6917" className="act-full-map"><div shuku-edit-id="e-e5f5f994-c6c8-4af6-bc69-c726395ac8ea" className={`act-full-stage ${phase>0?'is-on':''}`}><Text variant="bodySmall" tone="muted">01 多智能体</Text><Text variant="h3">提交逻辑、界面与测试</Text></div><div shuku-edit-id="e-0431f0c9-e422-49a7-9719-3645ae448721" className={`act-full-stage ${phase>1?'is-on':''} ${phase===2&&fault>0?'is-failed':''}`}><Text variant="bodySmall" tone="muted">02 工作流</Text><Text variant="h3">{phase>=2?events[fault][1]:'接口、功能与构建检查'}</Text></div><div shuku-edit-id="e-9334bdb1-7c1d-40dc-8ba4-94dd60c2efac" className={`act-full-stage ${phase>2?'is-on':''}`}><Text variant="bodySmall" tone="muted">03 {fault===0?'交付':'局部 ReAct'}</Text><Text variant="h3">{phase>=3?events[fault][2]:fault===0?'记录版本':'读证据、修改、复测'}</Text></div></div><Button variant="primary" onClick={()=>setPhase(p=>p>=3?0:p+1)}>{phase===0?'运行任务':phase===3?'重置情境':'继续运行'}</Button><Text variant="bodySmall" tone="muted">每次切换情境都会清空旧结果；同一轮的证据只对应当前版本。</Text></div>;
}

const fileSamples = [
  { name: 'timer.js', lines: ['function pauseTimer() {', '  running = false;', '}'], hint: '暂停函数只改了标记；定时回调仍会触发。' },
  { name: 'controls.js', lines: ['pauseButton.onclick = () => {', '  pauseTimer();', '}'], hint: '按钮已经正确调用暂停函数。' },
  { name: 'timer.test.js', lines: ['pause();', 'advanceClock(2);', 'expect(remaining).toBe(3);'], hint: '断言清楚表明：暂停后两秒，剩余值应该保持不变。' },
];
export function InvestigationScene() {
  const [file,setFile]=useState<number|null>(null);
  const [line,setLine]=useState<number|null>(null);
  return <div shuku-edit-id="e-2af91472-e62e-41de-b415-3def29b0febc" className="act-investigation-scene"><div shuku-edit-id="e-80ea4e8f-e951-4062-9c27-fe09c6bfb70a" className="act-file-rail"><Text variant="bodySmall" tone="muted">当前问题：按钮变了，倒计时没停</Text>{fileSamples.map((sample,i)=><button shuku-edit-id="e-4a404e09-4420-4a35-8190-86ec36ff4300" key={sample.name} onClick={()=>{setFile(i);setLine(null)}} className={file===i?'is-current':''}>{sample.name}<span shuku-edit-id="e-77e63055-cd0d-459a-9343-12117eb50c37">{i===0?'计时逻辑':i===1?'按钮连接':'验收用例'}</span></button>)}</div><div shuku-edit-id="e-e0f71521-a171-4220-a37f-4ad81b081bd9" className="act-code-inspector"><Text variant="bodySmall" tone="muted">{file===null?'选择一份文件':fileSamples[file].name}</Text>{file===null?<div shuku-edit-id="e-7ee67c9e-1fb6-4c51-8e45-052abe9ea1e4" className="act-inspector-empty"><Text variant="h3">从哪里查起？</Text><Text>按钮已经响应，优先查看实际计时行为。</Text></div>:<><div shuku-edit-id="e-f3e29c76-3a29-4c4a-bbd1-117a2f4ffef3" className="act-code-lines">{fileSamples[file].lines.map((text,i)=><button shuku-edit-id="e-549f39ee-252a-4af1-8b25-029f4ca40fa1" key={`${file}-${i}`} className={line===i?'is-current':''} onClick={()=>setLine(i)}><span shuku-edit-id="e-19c17115-052d-442f-b0e5-49d030c3e6a7">{String(i+1).padStart(2,'0')}</span><code shuku-edit-id="e-83185427-44ab-4365-af45-90faaed8d57e">{text}</code></button>)}</div><div shuku-edit-id="e-2b919916-d8e8-4f83-9f48-f382743a8ab6" className="act-inspector-feedback">{line===null?<Text tone="muted">点选一行，判断它与暂停失效有什么关系。</Text>:<Text tone={file===0&&line===1?'danger':'accent'}>{fileSamples[file].hint}</Text>}</div></>}</div></div>;
}

const patches = [
  { name: '只改按钮外观', code: 'pauseButton.classList.add("paused");', result: '00:03 → 00:01', status: '测试仍失败', detail: '数字继续减少；改变外观没有停止计时器。' },
  { name: '停止并清除计时器', code: 'clearInterval(timerId);\ntimerId = null;', result: '00:03 → 00:03', status: '测试通过', detail: '暂停后数字保持不变；接下来验收继续与完成。' },
];
export function PatchScene() {
  const [selected,setSelected]=useState<number|null>(null);
  const [tested,setTested]=useState(false);
  return <div shuku-edit-id="e-03a5f96b-2299-4025-99da-a539d2243ae3" className="act-patch-scene"><div shuku-edit-id="e-ab416ed2-5580-4b00-b131-effcc73df822" className="act-patch-options">{patches.map((patch,i)=><button shuku-edit-id="e-f8223bd7-7a17-475b-9c20-0934b5188e34" key={patch.name} className={selected===i?'is-current':''} onClick={()=>{setSelected(i);setTested(false)}}><Text variant="h3">{patch.name}</Text><code shuku-edit-id="e-1a2b01e1-2d11-44a5-a031-6f94c720d1b9">{patch.code}</code></button>)}</div><div shuku-edit-id="e-5421061f-de27-4f24-ad92-349c41062022" className="act-patch-compare"><div shuku-edit-id="e-64b74ef5-b485-4a3b-a833-f3d4c9bd91c1" className="act-patch-preview"><Text variant="bodySmall" tone="muted">测试：暂停后推进 2 秒</Text><div shuku-edit-id="e-b6481064-4481-4491-81d5-e3c7190c73df" className="act-patch-clock"><span shuku-edit-id="e-81cc4121-0e10-4744-a2b1-8ec9333e0e51">暂停时<br shuku-edit-id="e-27b067a4-1c2c-45f4-9fd5-9c1953cc3cc6"/>00:03</span><strong shuku-edit-id="e-f1c96385-076b-41c2-9367-0676b34566f1">→</strong><span shuku-edit-id="e-bdf15492-b904-472d-acba-58cc70a0198b" className={tested&&selected===0?'is-wrong':''}>测试后<br shuku-edit-id="e-c731c2af-96de-4ba5-9bb4-aee831feb4d6"/>{tested&&selected!==null?patches[selected].result.split('→')[1].trim():'--:--'}</span></div></div><Button variant="primary" disabled={selected===null} onClick={()=>setTested(true)}>应用补丁并测试</Button>{tested&&selected!==null&&<div shuku-edit-id="e-c1f74a44-45ef-4483-96ea-769592af6197" className={`act-patch-result ${selected===0?'is-failed':'is-passed'}`}><Text variant="h3" tone={selected===0?'danger':'success'}>{patches[selected].status}</Text><Text>{patches[selected].detail}</Text></div>}</div></div>;
}

export function IntegrationScene() {
  const [merged,setMerged]=useState(false);
  const [aligned,setAligned]=useState(false);
  const [tested,setTested]=useState(false);
  return <div shuku-edit-id="e-70ec613a-463e-47b8-9985-8817b13d5b62" className="act-integration-scene"><div shuku-edit-id="e-88113f1c-f830-4401-bbdc-cb46a3d5b04c" className="act-integration-code"><div shuku-edit-id="e-4d5375ef-cfa6-49aa-8a6e-0e6b1ee20d4c"><Text variant="bodySmall" tone="muted">逻辑员 · timer.js</Text><code shuku-edit-id="e-f01ebc0d-debf-43c9-b64a-7d616fb76ea7">export function <mark shuku-edit-id="e-7431a6f6-775a-4f2e-bc7d-4dcce71b82cd">pauseTimer</mark>() {'{'}<br shuku-edit-id="e-b4870687-46ed-4369-8b91-d15ab7bed163"/>　clearInterval(timerId);<br shuku-edit-id="e-33d223c9-c0b0-4add-9c07-2b9a386b48b4"/>{'}'}</code></div><div shuku-edit-id="e-cd8b0d39-9cd9-4d5f-ba25-acbfeaf0f930"><Text variant="bodySmall" tone="muted">界面员 · controls.js</Text><code shuku-edit-id="e-fed62d57-0683-4047-830b-4a5565eacdaf">pauseButton.onclick = () =&gt; {'{'}<br shuku-edit-id="e-7a7d5a82-a78a-47c2-9e62-aa8c26a3eb70"/>　timer.<button shuku-edit-id="e-b861ff94-454e-411d-aedf-47e6535de0b2" onClick={()=>{setAligned(true);setTested(false)}} title="点击统一函数名">{aligned?'pauseTimer':'stopTimer'}</button>();<br shuku-edit-id="e-ae677b50-20e9-4566-86ff-3ad9f45f07fa"/>{'}'}</code></div></div><div shuku-edit-id="e-69e25470-eef0-4d8f-9f95-2024c7b2c954" className="act-integration-console"><Text variant="bodySmall" tone="muted">集成测试</Text><Button variant="primary" onClick={()=>{setMerged(true);setTested(true)}}>{merged?'重新运行集成测试':'合并并测试'}</Button>{tested&&<div shuku-edit-id="e-26afe601-9e94-4743-b78e-e7cf2f09aa74" className={aligned?'is-success':'is-error'}><Text variant="h3" tone={aligned?'success':'danger'}>{aligned?'暂停按钮调用成功':'TypeError: timer.stopTimer is not a function'}</Text><Text>{aligned?'函数名一致，页面可以调用计时逻辑。':'点击界面代码中的 stopTimer，把它与逻辑模块接口对齐。'}</Text></div>}</div></div>;
}
