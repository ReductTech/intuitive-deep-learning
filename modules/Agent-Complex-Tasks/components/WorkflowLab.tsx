import { useEffect, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import { acceptanceSuite, fixedProgram, brokenProgram } from '../model/labModel';
import './WorkflowLab.css';

const Text = ({children, tone='main'}: {children: React.ReactNode; tone?: 'main'|'muted'|'success'|'danger'|'accent'}) => <Typography as="div" variant="bodySmall" tone={tone}>{children}</Typography>;
const names = ['接口检查','行为测试','构建','预览验收','交付'];
const descriptions = [
  ['代码快照','核对导出与调用名称','接口报告'],
  ['同版代码＋接口报告','暂停、继续、提醒、记录','四项测试报告'],
  ['同版代码＋通过的报告','生成可运行产物','构建产物'],
  ['构建产物','操作暂停按钮，检查显示','预览记录'],
  ['同版完整证据','核对版本与检查结果','交付清单'],
];
type Snapshot = {logic:boolean; ui:boolean; stage:number; version:number};
const key='agent-workflow-delivery-v1';
function read(): Snapshot { try {return JSON.parse(sessionStorage.getItem(key)||'null') || {logic:false,ui:false,stage:-1,version:0};} catch {return {logic:false,ui:false,stage:-1,version:0};} }
function Flow({stage,selected,onSelect,failed=-1,assembling=false}: {stage:number;selected?:number;onSelect?:(n:number)=>void;failed?:number;assembling?:boolean}) {return <div className="actwf-flow">{names.map((n,i)=><Button key={n} className={`actwf-node ${stage>=i?'passed':''} ${failed===i?'failed':''}`} active={selected===i} onClick={()=>onSelect?.(i)}><Text>{String(i+1).padStart(2,'0')} · {n}</Text><Text tone={failed===i?'danger':stage>=i?'success':'muted'}>{failed===i?'✕ 失败 · 已阻断':stage>=i?(assembling?'✓ 已接入':'✓ 有证据'):assembling?'待接入':stage===i-1?'等待执行':'等待上游'}</Text></Button>)}</div>;}
function Panel({title,children}: {title:string;children:React.ReactNode}) {return <section className="actwf-panel"><Text tone="accent">{title}</Text>{children}</section>;}

export function WorkflowAssembly(){
 const [order,setOrder]=useState<number[]>([]),[selected,setSelected]=useState(0),[message,setMessage]=useState('选择节点，按照证据依赖装配交付流程。');
 return <div className="actwf"><Flow stage={order.length-1} assembling selected={selected} onSelect={setSelected}/><div className="actwf-columns"><Panel title={`查看节点 · ${names[selected]}`}><Text>输入：{descriptions[selected][0]}</Text><Text>执行：{descriptions[selected][1]}</Text><Text>输出：{descriptions[selected][2]}</Text><Button variant="primary" disabled={order.includes(selected)} onClick={()=>{if(selected!==order.length){setMessage(`不能接入「${names[selected]}」：缺少上游${selected?descriptions[selected-1][2]:'代码快照'}。`);return;}setOrder([...order,selected]);setMessage(selected===4?'流程闭合：交付必须等到同版证据齐备。':'接入成功。继续选择下一节点。');}}>接入流程</Button></Panel><Panel title="你装配的流程"><div className="actwf-chain">{order.length?order.map(i=><Text key={i}>↓ {names[i]} → {descriptions[i][2]}</Text>):<Text tone="muted">代码快照已就绪 · 尚未接入检查节点</Text>}</div></Panel></div><div className="actwf-bottom"><Text>{message}</Text><Button onClick={()=>{setOrder([]);setMessage('流程已清空，尝试先接入构建节点。');}}>重新装配</Button></div></div>;
}

export function WorkflowFailure(){
 const [fixed,setFixed]=useState(false),[stage,setStage]=useState(-1),[selected,setSelected]=useState(1),[message,setMessage]=useState('B0 已接收。运行流程，找出阻断交付的证据。');
 const test=acceptanceSuite(fixed?fixedProgram:brokenProgram)[0];
 function run(){setStage(fixed?4:0);setMessage(fixed?'B1：接口、四项行为、构建与预览均通过教学模型检查。':'流程停在行为测试：暂停后仍在倒计时。后续节点不执行。');}
 return <div className="actwf"><Flow stage={stage} failed={stage===0?1:-1} selected={selected} onSelect={setSelected}/><div className="actwf-columns"><Panel title={`代码快照 · ${fixed?'B1':'B0'}`}><Text>{fixed?'已停止定时回调，并释放句柄。':'仅修改 running 标记，定时回调仍然存在。'}</Text><Button variant="primary" onClick={run}>{stage<0?'运行完整流程':'重新运行完整流程'}</Button><Button disabled={fixed} onClick={()=>{setFixed(true);setStage(-1);setMessage('代码变为 B1。B0 的报告不能证明 B1，必须重新检查。');}}>提交修复版本 B1</Button><Button onClick={()=>setMessage(stage===4?'B1 已具备完整证据，可以交付。':'不能跳过失败节点：交付需要同一版本的完整通过证据。')}>尝试直接交付</Button></Panel><Panel title={`节点证据 · ${names[selected]}`}><Text>输入：{descriptions[selected][0]}</Text>{selected===1?<><Text>暂停时 00:03 → 再推进 2 秒</Text><Text>预期 00:03 · 实际 {stage>=0?test.actual:'尚未测试'}</Text><Text tone={stage<0?'muted':test.pass?'success':'danger'}>{stage<0?'等待新版本证据':test.pass?'PASS · 时间保持不变':'FAIL · 定时回调未停止'}</Text></>:<Text>{stage>=selected?`${fixed?'B1':'B0'} · ${descriptions[selected][2]}已生成`:'无报告：等待上游通过。'}</Text>}</Panel></div><div className="actwf-bottom"><Text>{message}</Text><Button onClick={()=>{setFixed(false);setStage(-1);setMessage('已恢复 B0。');}}>重置实验</Button></div></div>;
}

export function TimeoutLab(){
 const [scenario,setScenario]=useState(0),[limit,setLimit]=useState(2),[retry,setRetry]=useState(true),[ran,setRan]=useState(false);
 const latency=scenario===0?[3,1]:scenario===1?[4,4]:[1,1];
 const attempts=latency[0]>limit&&retry?2:1;
 const result=!ran?'等待执行':latency[attempts-1]>limit?'TIMEOUT':scenario===2?'FAIL':'PASS';
 return <div className="actwf"><div className="actwf-toolbar">{['临时延迟','持续无响应','返回断言失败'].map((v,i)=><Button key={v} active={scenario===i} onClick={()=>{setScenario(i);setRan(false);}}>{v}</Button>)}</div><div className="actwf-columns"><Panel title="制定运行策略"><Text>每次等待上限（教学模拟秒）</Text><div className="actwf-toolbar">{[2,5].map(n=><Button key={n} active={limit===n} onClick={()=>{setLimit(n);setRan(false);}}>{n} 秒</Button>)}</div><Button active={retry} onClick={()=>{setRetry(!retry);setRan(false);}}>超时后最多重试一次：{retry?'开启':'关闭'}</Button><Button variant="primary" onClick={()=>setRan(true)}>按此策略执行</Button></Panel><Panel title="执行时间线 · 只有超时才重试">{ran?Array.from({length:attempts},(_,i)=><div key={i} className="actwf-attempt"><Text>尝试 {i+1} · 等待 {Math.min(limit,latency[i])} 秒</Text><div className="actwf-bar"><i style={{width:`${Math.min(limit,latency[i])/5*100}%`}}/></div><Text>{latency[i]>limit?'到达截止线，没有结果':scenario===2?'已返回：预期 00:03，实际 00:01':'已返回：断言通过'}</Text></div>):<Text tone="muted">先设策略，再观察是否产生可用证据。</Text>}</Panel></div><div className="actwf-bottom"><Text tone={result==='PASS'?'success':result==='FAIL'?'danger':'muted'}>{result} · {result==='PASS'?'允许下游执行':result==='FAIL'?'已有失败证据，进入修复，不自动重试':result==='TIMEOUT'?'尚无测试结论，阻断下游并报告未验证':'改变策略会清除本轮结果'}</Text></div></div>;
}

export function MechanismLab(){
 const [failure,setFailure]=useState(0),[action,setAction]=useState(-1);
 return <div className="actwf"><Flow stage={failure===0?-1:0}/><div className="actwf-columns"><Panel title="固定流程运行到了什么证据？"><div className="actwf-toolbar">{['接口失败','暂停失败'].map((v,i)=><Button key={v} active={failure===i} onClick={()=>{setFailure(i);setAction(-1);}}>{v}</Button>)}</div><Text>{failure===0?'TypeError: stopTimer is not a function':'暂停后：预期 00:03，实际 00:01'}</Text><Text tone="muted">固定部分：每次提交都按相同顺序执行检查。</Text></Panel><Panel title="你负责局部 ReAct：下一步查哪里？">{['读取 controls.js 的调用','读取 timer.js 的暂停实现','直接重跑相同测试'].map((v,i)=><Button key={v} active={action===i} onClick={()=>setAction(i)}>{v}</Button>)}</Panel></div><div className="actwf-bottom"><Text>{action<0?'先读失败证据，再选择能减少不确定性的动作。':action===failure?(failure===0?'新观察：界面调用 stopTimer，模块只导出 pauseTimer。下一步修复调用。':'新观察：只改 running，没有 clearInterval。下一步停止定时回调。'):'这一步没有解释当前失败。换一份证据时，排查动作也应改变。'}</Text></div></div>;
}

export function NestedLab(){
 const [calls,setCalls]=useState(0),[seen,setSeen]=useState(false),[fixed,setFixed]=useState(false),[verified,setVerified]=useState(false),[outer,setOuter]=useState(false),[message,setMessage]=useState('外层行为测试失败：预期 00:03，实际 00:01。');
 function act(n:number){if(calls>=3)return;setCalls(calls+1);if(n===0){setSeen(true);setMessage('Observation：pauseTimer 仅设置 running=false，未清除定时回调。');}if(n===1){if(seen){setFixed(true);setMessage('已写入 B1：clearInterval(timerId); timerId=null; 尚未验证。');}else setMessage('缺少定位证据，未提交补丁。这次检查消耗一次调用。');}if(n===2){setVerified(fixed);setMessage(fixed?'B1 复测 PASS。允许返回外层，从接口检查重新验证新版本。':'B0 复测 FAIL。重复测试没有消除缺陷。');}}
 return <div className="actwf"><Flow stage={outer?4:fixed?-1:0} failed={!fixed?1:-1} selected={1}/><div className="actwf-columns"><Panel title="失败节点内的 ReAct · 最多 3 次工具调用"><Text>剩余调用：{3-calls} · 当前版本 {fixed?'B1':'B0'}</Text>{['读取相关代码','依据观察写入补丁','运行暂停复测'].map((v,i)=><Button key={v} disabled={calls>=3||verified} onClick={()=>act(i)}>{v}</Button>)}</Panel><Panel title="回到外层的条件"><Text>① 读到能解释失败的代码</Text><Text>② 修复生成新版本 B1</Text><Text>③ 对 B1 复测通过</Text><Text tone={verified?'success':'muted'}>{verified?'局部修复已验证；交付仍需外层完整检查。':'外层保持阻断；写入成功不能代替验证。'}</Text>{verified&&<Button disabled={outer} variant="primary" onClick={()=>{setOuter(true);setMessage('B1 已重新通过外层完整检查，生成交付证据。');}}>返回外层，运行完整检查</Button>}</Panel></div><div className="actwf-bottom"><Text>{calls===3&&!verified?'预算耗尽，未验证。需人工接管或重新授权排查。':message}</Text><Button onClick={()=>{setOuter(false);setCalls(0);setSeen(false);setFixed(false);setVerified(false);setMessage('已恢复初始失败，重新规划三次调用。');}}>重新规划</Button></div></div>;
}

export function DeliveryLab({receipt=false}: {receipt?:boolean}){
 const [s,setS]=useState<Snapshot>(read),[selected,setSelected]=useState(0),[message,setMessage]=useState('三个角色产物需要合并到同一快照，再运行交付流程。'),[inspected,setInspected]=useState(''),[running,setRunning]=useState(false),[cursor,setCursor]=useState(0),[halted,setHalted]=useState(-1);
 function update(next:Snapshot){setS(next);sessionStorage.setItem(key,JSON.stringify(next));}
 function change(which:'logic'|'ui'){setHalted(-1);update({...s,[which]:!s[which],version:s.version+1,stage:-1});setInspected('');setMessage('产物已变更，生成新快照。旧测试证据失效。');}
 function run(){setHalted(-1);update({...s,stage:-1});setCursor(0);setSelected(0);setRunning(true);setMessage(`正在检查 M${s.version} 的接口…`);}
 useEffect(()=>{if(!running)return;const timer=window.setTimeout(()=>{
   const failed=cursor===0&&!s.ui||cursor===1&&!s.logic;
   if(failed){setHalted(cursor);setRunning(false);setMessage(cursor===0?'接口失败：stopTimer is not a function。选择文件展开局部排查。':'行为失败：暂停后 00:03 → 00:01。选择文件展开局部排查。');return;}
   update({...s,stage:cursor});
   if(cursor===4){setRunning(false);setMessage('教学模型检查完成，证据绑定当前版本。下一页读取这份交付清单。');}
   else{setCursor(cursor+1);setSelected(cursor+1);setMessage(`${names[cursor]}输出已传给下一节点，正在${names[cursor+1]}…`);}
 },650);return()=>clearTimeout(timer);},[running,cursor,s]);
 const tests=acceptanceSuite(s.logic?fixedProgram:brokenProgram);
 return <div className="actwf"><Flow stage={s.stage} failed={halted} selected={selected} onSelect={setSelected}/><div className="actwf-columns"><Panel title={receipt?`交付快照 M${s.version}`:'多智能体 · 三份具体产物'}><Text>逻辑：timer.js · {s.logic?'L1 停止回调':'L0 仅改变标记'}</Text><Text>界面：controls.js · {s.ui?'U1 调用 pauseTimer':'U0 调用 stopTimer'}</Text><Text>测试：timer.spec · T1 四项行为断言</Text>{!receipt?<><div className="actwf-toolbar"><Button disabled={running} onClick={()=>{setInspected('ui');setSelected(0);}}>读取界面文件</Button><Button disabled={running} onClick={()=>{setInspected('logic');setSelected(1);}}>读取逻辑文件</Button></div></>:<><Text tone={s.stage===4?'success':'danger'}>{s.stage===4?'可交付：同版证据完整':'不可交付：当前快照缺少通过证据'}</Text><Text tone="muted">教学模型证据，不代表真实部署或真实构建记录。</Text></>}</Panel><Panel title={`工作流证据 · ${names[selected]}`}>{inspected?<Text tone="muted">根据当前文件观察，判断是否需要提交修复。</Text>:s.stage>=selected?<><Text tone="success">M{s.version} · {names[selected]}通过</Text>{selected===1?tests.map((t,i)=><Text key={t.id}>{['暂停','继续','提醒','记录'][i]}：预期 {t.expected} / 实际 {t.actual}</Text>):<Text>{descriptions[selected][2]}已绑定当前快照。</Text>}</>:<><Text tone="muted">{running?'节点正在执行…':'该节点尚未通过。'}</Text><Text>{!s.ui?'调用与导出不一致，先核对接口。':!s.logic?'暂停实现存在缺陷，检查定时回调。':'代码已修复，重新运行才能获得证据。'}</Text></>}{inspected&&<><Text tone="accent">{inspected==='ui'?`调用 ${s.ui?'pauseTimer':'stopTimer'}()；导出 pauseTimer`:`running=false; ${s.logic?'clearInterval(timerId);':'没有清除定时回调'}`}</Text><Button disabled={running} onClick={()=>change(inspected as 'ui'|'logic')}>{inspected==='ui'?'界面':'逻辑'}角色提交{(inspected==='ui'?s.ui:s.logic)?'旧版':'修复'}</Button></>}{!inspected&&selected!==1&&<Text>{receipt?'角色交付文件 → 流程检查 → 根据失败证据排查 → 回流程复测。':'局部 ReAct：读日志 → 选文件 → 修复 → 重新取得证据。'}</Text>}</Panel></div><div className="actwf-bottom"><Text>{message}</Text><div className="actwf-toolbar"><Button variant="primary" disabled={running} onClick={run}>{running?'流程执行中':'运行交付流程'}</Button><Button disabled={running} onClick={()=>{update({logic:false,ui:false,stage:-1,version:0});setInspected('');setHalted(-1);setMessage('已恢复含两处缺陷的 M0。');}}>重置案例</Button></div></div></div>;
}
