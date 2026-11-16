import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { ACTIONS, START, huber, keyOf } from '../../model';
import { ReplayExperienceMap } from '../ReplayBufferPage/ReplayExperienceMap';
import type { ReplayExperience } from '../ReplayBufferPage/replaySimulation';
import { DqnValidationMap } from './DqnValidationMap';
import { DQN_BATCH, DQN_SYNC, advanceDqnTraining, collectDqnExperience, createDqnNetwork, createDqnSimulation,
  dqnForward, dqnTarget, evaluateDqn, sampleDqnBatch, updateDqnSimulation, type DqnEvaluation } from '../../dqnSimulation';
import './DqnTrainingPage.css';

const initialNetwork = createDqnNetwork(), initialEvaluation = evaluateDqn(initialNetwork);
const coordinate = (p: { row: number; col: number }) => `(${p.row + 1},${p.col + 1})`;
const arrows = ['↑','→','↓','←'];
const outcomeText = { delivered:'成功送达',trap:'进入陷阱',loop:'重复动作，形成循环',limit:'达到验证步数上限' };
type View = { kind:'replay';entry:ReplayExperience;end:boolean;nonce:number }
  | { kind:'validate';result:DqnEvaluation;index:number;update:number;nonce:number } | null;

export function DqnTrainingPage() {
  const [state,setState] = useState(createDqnSimulation), [selectedId,setSelectedId] = useState<number | null>(null);
  const [batchPage,setBatchPage] = useState(0);
  const [view,setView] = useState<View>(null), [auto,setAuto] = useState<'slow'|'fast'|null>(null), [stopAt,setStopAt] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null), nonce = useRef(0);
  const occupied = state.slots.filter((entry):entry is ReplayExperience => !!entry);
  const selected = state.batch.find(entry => entry.id === selectedId) ?? state.batch[0];
  const inspectedPosition = selected?.s ?? START, values = dqnForward(state.online,inspectedPosition).values;
  const before = dqnForward(initialNetwork,inspectedPosition).values, best = values.indexOf(Math.max(...values)), oldBest = before.indexOf(Math.max(...before));
  const updateIndex = selected && state.lastUpdate ? state.lastUpdate.ids.indexOf(selected.id) : -1;
  const prediction = selected ? updateIndex >= 0 ? state.lastUpdate!.before[updateIndex] : values[selected.action] : undefined;
  const target = selected ? updateIndex >= 0 ? state.lastUpdate!.targets[updateIndex] : dqnTarget(state.target,selected) : undefined;
  const loss = prediction === undefined || target === undefined ? undefined : huber(prediction-target);
  const errorLatex = prediction === undefined || target === undefined ? '' : String.raw`${prediction.toFixed(2)}-\left(${target.toFixed(2)}\right)`;
  const lossLatex = loss === undefined ? String.raw`\ell_i=\operatorname{Huber}\left(Q_\theta\left(s_i,a_i\right)-y_i\right)`
    : Math.abs(prediction!-target!) <= 1 ? String.raw`\ell=0.5\left(${errorLatex}\right)^2\approx ${loss.toFixed(3)}`
      : String.raw`\ell=\left|${errorLatex}\right|-0.5\approx ${loss.toFixed(3)}`;
  const verifying = view?.kind === 'validate' ? view : null, replaying = view?.kind === 'replay' ? view : null;
  const completed = verifying && verifying.index === verifying.result.route.length-1;
  const currentExperience = replaying?.entry ?? state.latest;
  function stop() { setAuto(null);setView(null); }
  function collect() {
    stop();setSelectedId(null);setState(previous => { let next=previous;for(let i=0;i<DQN_BATCH;i++)next=collectDqnExperience(next);return next; });
  }
  function draw() { stop();setBatchPage(0);const next=sampleDqnBatch(state);setState(next);if(next.batch[0])replay(next.batch[0]); }
  function learn() { setAuto(null);setState(updateDqnSimulation);if(selected)setView({kind:'replay',entry:selected,end:true,nonce:++nonce.current}); }
  function replay(entry:ReplayExperience) { setAuto(null);setSelectedId(entry.id);setView({kind:'replay',entry,end:false,nonce:++nonce.current}); }
  function validate() { setAuto(null);setView({kind:'validate',result:evaluateDqn(state.online),index:0,update:state.updates,nonce:++nonce.current}); }
  function run(speed:'slow'|'fast') { setView(null);setSelectedId(null);setBatchPage(0);setStopAt(state.collected+(speed==='fast'?2000:6000));setAuto(speed); }
  function reset() { stop();setState(createDqnSimulation());setSelectedId(null);setBatchPage(0); }
  useEffect(() => {
    if(!auto)return;
    const timer=window.setInterval(() => setState(previous => advanceDqnTraining(previous,Math.max(0,Math.min(auto==='fast'?40:8,stopAt-previous.collected)))),auto==='fast'?45:180);
    return () => window.clearInterval(timer);
  },[auto,stopAt]);
  useEffect(() => { if(auto&&state.collected>=stopAt)setAuto(null); },[auto,state.collected,stopAt]);
  useEffect(() => {
    if(!view)return;const token=view.nonce;
    if(view.kind==='replay') {
      const timer=window.setTimeout(() => setView(previous => previous?.kind==='replay'&&previous.nonce===token?{...previous,end:true}:previous),450);
      return () => window.clearTimeout(timer);
    }
    if(view.index===view.result.route.length-1)return;
    const timer=window.setTimeout(() => setView(previous => previous?.kind==='validate'&&previous.nonce===token?{...previous,index:Math.min(previous.index+1,previous.result.route.length-1)}:previous),220);
    return () => window.clearTimeout(timer);
  },[view?.nonce,view?.kind==='validate'?view.index:-1]);
  useEffect(() => {
    const pause=() => setAuto(null),hidden=() => {if(document.hidden)pause();};
    const observer=new IntersectionObserver(entries => {if(!entries[0].isIntersecting)pause();});
    if(rootRef.current)observer.observe(rootRef.current);document.addEventListener('visibilitychange',hidden);
    return () => {observer.disconnect();document.removeEventListener('visibilitychange',hidden);};
  },[]);

  return <LessonPage className="vbrl-foundation-page vbrl-dqn-page" title="DQN：训练怎样改变机器人的决策？"
    subtitle="经验池提供数据，目标网络提供参照，用误差更新共享参数，再依据新估值选择动作。"
    footer={<div shuku-edit-id="e-25d47c27-64a8-4acd-b0dc-e42214275a9c" className="vbrl-dqn__cycle" aria-label="真实 DQN 训练循环">
      {['ε-greedy 选动作','与环境交互','经历存入池','抽样更新参数','重新估价'].map((label,index) => <div shuku-edit-id="e-72ea45ad-aaef-4e1d-a9bf-dd12efb21a67" key={label} className={index===3?'is-learning':''}>
        <Typography shuku-edit-id="e-d7e206a9-5930-4fc3-948b-60f00e33cfc8" variant="bodySmall" tone="inherit">{index+1} · {label}</Typography>{index<4&&<span shuku-edit-id="e-d8638d76-34a6-402d-8afe-749955ec4a8e" aria-hidden="true">→</span>}</div>)}
    </div>}>
    <div shuku-edit-id="e-52e9e35c-bc44-4cde-9ec3-9472c449376e" className="vbrl-dqn" ref={rootRef} data-collected={state.collected} data-updates={state.updates} data-syncs={state.syncs} data-last-sync={state.lastSync}
      data-auto={auto??'paused'} data-buffer-count={occupied.length} data-draws={state.draws} data-batch-ids={state.batch.map(entry=>entry.id).join(',')} data-selected={selected?.id}
      data-live-position={keyOf(state.position)} data-mode={view?.kind??'live'} data-replay-phase={replaying?replaying.end?'end':'start':undefined}
      data-evaluation={verifying?.result.outcome} data-validation-step={verifying?.index} data-validation-updates={verifying?.update}
      data-loss-before={state.lastUpdate?.lossBefore} data-loss-after={state.lastUpdate?.lossAfter}
      data-selected-prediction={prediction} data-selected-target={target} data-selected-loss={loss}
      data-decision-values={values.join(',')} data-decision-position={keyOf(inspectedPosition)} data-best-action={best}
      onKeyDown={event=>{if(event.key===' '&&event.target instanceof HTMLElement&&event.target.closest('button'))event.stopPropagation();}}>
      <TeachingPanel title="① 从经验池取样" className="vbrl-dqn__sample">
        <div shuku-edit-id="e-48b60472-6a24-46f0-aea6-9155e809e516" className="vbrl-dqn__map-zone">{verifying?<DqnValidationMap result={verifying.result} index={verifying.index} before={initialEvaluation}/>
          :<ReplayExperienceMap position={state.position} experience={currentExperience??null} atEnd={replaying?replaying.end:true}
            robotKey={replaying?'replay-'+replaying.nonce:'live-'+state.episode}/>}</div>
        <div shuku-edit-id="e-f7f37862-395d-4d43-b661-7bbe022a2131" className="vbrl-dqn__batch" aria-label="本批十六条完整经历，点击回放">
          {state.batch.length?<><Button onClick={()=>{setAuto(null);setBatchPage(value=>(value+3)%4);}} aria-label="上一组经历">‹</Button>{state.batch.slice(batchPage*4,batchPage*4+4).map(entry=><Button key={entry.id} active={entry.id===selected?.id} onClick={()=>replay(entry)}
            data-id={entry.id} data-transition={[keyOf(entry.s),entry.action,entry.reward,keyOf(entry.next),entry.done].join('|')} aria-label={`回放经历 #${entry.id}`}>
            <Typography shuku-edit-id="e-3ba182f6-1a0e-4fd7-8e60-741141f88556" variant="bodySmall" tone="inherit">#{entry.id}</Typography></Button>)}<Button onClick={()=>{setAuto(null);setBatchPage(value=>(value+1)%4);}} aria-label="下一组经历">›</Button></>
            :<Typography shuku-edit-id="e-9855dbbb-abe3-4686-9ee7-3524c784a173" variant="bodySmall" tone="muted" align="center">先采集 16 步，再随机抽取一批。</Typography>}
        </div>
        <div shuku-edit-id="e-49900ece-7f09-485a-86a6-56067e53ed1a" className="vbrl-dqn__tuple" aria-live="polite"><Typography shuku-edit-id="e-64de33b3-b69f-49d7-89a8-4cda81261efe" variant="bodySmall" tone={completed&&verifying.result.outcome==='delivered'?'success':'accent'}>
          {verifying?completed?`${outcomeText[verifying.result.outcome]} · ${verifying.result.actions.length} 步`:`验证当前策略 · 第 ${verifying.index} 步`
            :currentExperience?`${coordinate(currentExperience.s)} ${arrows[currentExperience.action]} ${currentExperience.reward>0?'+':''}${currentExperience.reward} ${coordinate(currentExperience.next)}`:'记录起点、动作、奖励与下一状态。'}</Typography>
          <Typography shuku-edit-id="e-9ac234d0-4dcf-4343-85ca-edf178271550" variant="bodySmall" tone="muted">{verifying?'验证不采集、不更新。':state.batch.length?`16 条中的 ${batchPage*4+1}–${batchPage*4+4} · 点击回放`:'每条数据都来自真实环境交互。'}</Typography></div>
      </TeachingPanel>
      <TeachingPanel title="② 计算误差，更新参数" className="vbrl-dqn__gradient">
        <div shuku-edit-id="e-8cb44e0b-d73d-432c-a00c-177c6eacee50" className="vbrl-dqn__steps"><Button onClick={collect}>采集 16 步</Button><Button disabled={occupied.length<DQN_BATCH} onClick={draw}>抽取 batch</Button>
          <Button variant="primary" disabled={state.batch.length!==DQN_BATCH} onClick={learn}>更新参数</Button></div>
        <div shuku-edit-id="e-ff3cda55-fcd8-4937-996d-1bf33a34b571" className="vbrl-dqn__prediction-target">
          <div shuku-edit-id="e-eac22a01-3d5c-46a0-a755-d7e16e735311"><Typography shuku-edit-id="e-5d066999-1e73-459d-a6c3-2ccd46eca012" variant="bodySmall" tone="muted">当前动作的预测</Typography><Typography shuku-edit-id="e-118bf524-64f4-4b16-a127-668f1c99403e" variant="h3" tone="warning">{prediction===undefined?'—':prediction.toFixed(2)}</Typography></div>
          <div shuku-edit-id="e-12982357-e6e8-47b8-8d62-fd7d61a72784"><Typography shuku-edit-id="e-c0d6dc24-9044-44e4-a254-820d3e07ae2c" variant="bodySmall" tone="muted">目标网络给出参照</Typography><Typography shuku-edit-id="e-d3ac85c8-07a5-42d7-994b-07b58257cabc" variant="h3" tone="success">{target===undefined?'—':'y = '+target.toFixed(2)}</Typography></div>
        </div>
        <div shuku-edit-id="e-bfbce206-5dbd-4bcf-83a4-41fde06fcb8b" className="vbrl-dqn__individual-loss"><Typography shuku-edit-id="e-e6c8b972-2875-47be-8c3c-73d0a74ab8e4" variant="bodySmall" tone="accent">实际动作的误差 → Huber 损失</Typography>
          <Formula latex={lossLatex} /></div>
        <div shuku-edit-id="e-af57b17b-9750-4cd8-b58d-cf278dcb8990" className="vbrl-dqn__batch-loss"><Typography shuku-edit-id="e-0cf12842-d135-4bb4-97ec-c36e88237b46" variant="bodySmall" tone="muted">把这一批样本的损失取平均</Typography>
          <Formula latex={String.raw`L(\theta)=\frac{1}{B}\sum_{i=1}^{B}\ell_i,\quad B=16`} />
          <Typography shuku-edit-id="e-93d6ced6-2698-438c-8ee5-43323c50e8fe" variant="bodySmall" tone="success">{state.lastUpdate?`本批实际损失：${state.lastUpdate.lossBefore.toFixed(3)} → ${state.lastUpdate.lossAfter.toFixed(3)}`:'数据不变，也可以再次学习这一批。'}</Typography></div>
        <div shuku-edit-id="e-81d65776-c33d-4d8d-a696-cddbe41cc96f" className="vbrl-dqn__backprop"><Formula latex={String.raw`g=\nabla_\theta L(\theta)`} />
          <Typography shuku-edit-id="e-48a175c0-cb03-4158-a2f9-83fc298bb0a3" variant="bodySmall" tone="accent">反向传播求梯度，Adam 更新当前网络。</Typography></div>
      </TeachingPanel>
      <TeachingPanel title="③ 用新评分再决策" className="vbrl-dqn__decision">
        <div shuku-edit-id="e-5c95ab13-b191-4c24-b504-09e8e021157a" className="vbrl-dqn__decision-state"><Formula latex={`s=${coordinate(inspectedPosition)}`} /><Typography shuku-edit-id="e-9ed62ca6-160c-46a7-83d9-8fc26ccb1cb4" variant="bodySmall" tone="muted">同一状态比较</Typography></div>
        <table shuku-edit-id="e-216b4fe7-787d-46f3-b351-d739f4cde93c" className="vbrl-dqn__q-table"><thead shuku-edit-id="e-8e9d7889-2aa8-408d-b94b-94c57055a82e"><tr shuku-edit-id="e-ce7ada10-8c91-4bd1-9f82-03f32c546b84">{['动作','训练前','当前'].map(label=><th shuku-edit-id="e-23ce976f-cc39-4483-b8fe-2ba3cc5ab630" key={label}><Typography shuku-edit-id="e-ec597438-f3c7-4820-87ee-9f6ef358d747" variant="bodySmall" tone="accent">{label}</Typography></th>)}</tr></thead>
          <tbody shuku-edit-id="e-fb3d1f8f-432b-40ea-af77-9ca4d9c7f0ff">{ACTIONS.map((action,index)=><tr shuku-edit-id="e-ced12191-9337-437a-a42e-4d10a5d88e76" key={action} data-action={index}><th shuku-edit-id="e-4e664068-68d2-4fb2-ad6b-25d93965de9e"><Typography shuku-edit-id="e-a242372b-d9a6-4475-a47b-e199096aa6c2" variant="bodySmall" tone="accent">{arrows[index]} {action.slice(1)}</Typography></th>
            <td shuku-edit-id="e-dbb8d0be-3c53-4091-bbcd-1e878387f9e1" className={index===oldBest?'is-before':''}><Typography shuku-edit-id="e-3e8e8752-f893-4b64-9a33-1759186284c1" variant="bodySmall" tone={index===oldBest?'warning':'muted'}>{before[index].toFixed(2)}</Typography></td>
            <td shuku-edit-id="e-9d45a77c-943b-4335-ace6-94e282242e90" className={index===best?'is-after':''}><Typography shuku-edit-id="e-6c629e8a-bf85-4b12-a16e-69f23d2d6db7" variant="bodySmall" tone={index===best?'success':'muted'}>{values[index].toFixed(2)}</Typography></td></tr>)}</tbody></table>
        <div shuku-edit-id="e-630ac021-8eca-4dbb-b1a9-72f08865d30b" className="vbrl-dqn__choices"><Typography shuku-edit-id="e-1c1db19a-d2e1-4765-a3fe-d458e4bd0ff2" variant="bodySmall" tone="warning">原选择 {arrows[oldBest]}</Typography><Typography shuku-edit-id="e-31a498f8-ef32-47bb-90a6-da7944a9d446" variant="bodySmall" tone="muted">→</Typography><Typography shuku-edit-id="e-650a8dc1-f5ef-4794-92d0-1231f3b61116" variant="bodySmall" tone="success">新选择 {arrows[best]}</Typography></div>
        <Typography shuku-edit-id="e-ffa0e1cf-40d1-46ef-a537-b8a47b4508f4" variant="bodySmall" tone="accent">参数共享，其他评分也可能变化。<br shuku-edit-id="e-ec7c20b9-d074-4e5f-b4a7-95f19e36cf72"/>单次更新不保证更换动作。</Typography>
        <div shuku-edit-id="e-4253ddbb-327b-4955-b8a2-3cc159929190" className="vbrl-dqn__controls"><Button variant="primary" onClick={()=>auto?setAuto(null):run('slow')}>{auto?'暂停回放':'连续训练'}</Button>
          <Button disabled={!!auto} onClick={()=>run('fast')}>训练 2000 步</Button><Button onClick={validate}>验证策略</Button><Button onClick={reset}>重置</Button></div>
        <Typography shuku-edit-id="e-a67d2085-858a-41c8-b5e0-187a8dadf382" variant="bodySmall" tone="muted">采集 {state.collected} 步 · 更新 {state.updates} 次</Typography>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
