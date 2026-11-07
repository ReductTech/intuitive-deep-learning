import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from '../../../shared/react';
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
    footer={<div className="vbrl-dqn__cycle" aria-label="真实 DQN 训练循环">
      {['ε-greedy 选动作','与环境交互','经历存入池','抽样更新参数','重新估价'].map((label,index) => <div key={label} className={index===3?'is-learning':''}>
        <Typography variant="bodySmall" tone="inherit">{index+1} · {label}</Typography>{index<4&&<span aria-hidden="true">→</span>}</div>)}
    </div>}>
    <div className="vbrl-dqn" ref={rootRef} data-collected={state.collected} data-updates={state.updates} data-syncs={state.syncs} data-last-sync={state.lastSync}
      data-auto={auto??'paused'} data-buffer-count={occupied.length} data-draws={state.draws} data-batch-ids={state.batch.map(entry=>entry.id).join(',')} data-selected={selected?.id}
      data-live-position={keyOf(state.position)} data-mode={view?.kind??'live'} data-replay-phase={replaying?replaying.end?'end':'start':undefined}
      data-evaluation={verifying?.result.outcome} data-validation-step={verifying?.index} data-validation-updates={verifying?.update}
      data-loss-before={state.lastUpdate?.lossBefore} data-loss-after={state.lastUpdate?.lossAfter}
      data-selected-prediction={prediction} data-selected-target={target} data-selected-loss={loss}
      data-decision-values={values.join(',')} data-decision-position={keyOf(inspectedPosition)} data-best-action={best}
      onKeyDown={event=>{if(event.key===' '&&event.target instanceof HTMLElement&&event.target.closest('button'))event.stopPropagation();}}>
      <TeachingPanel title="① 从经验池取样" className="vbrl-dqn__sample">
        <div className="vbrl-dqn__map-zone">{verifying?<DqnValidationMap result={verifying.result} index={verifying.index} before={initialEvaluation}/>
          :<ReplayExperienceMap position={state.position} experience={currentExperience??null} atEnd={replaying?replaying.end:true}
            robotKey={replaying?'replay-'+replaying.nonce:'live-'+state.episode}/>}</div>
        <div className="vbrl-dqn__batch" aria-label="本批十六条完整经历，点击回放">
          {state.batch.length?<><Button onClick={()=>{setAuto(null);setBatchPage(value=>(value+3)%4);}} aria-label="上一组经历">‹</Button>{state.batch.slice(batchPage*4,batchPage*4+4).map(entry=><Button key={entry.id} active={entry.id===selected?.id} onClick={()=>replay(entry)}
            data-id={entry.id} data-transition={[keyOf(entry.s),entry.action,entry.reward,keyOf(entry.next),entry.done].join('|')} aria-label={`回放经历 #${entry.id}`}>
            <Typography variant="bodySmall" tone="inherit">#{entry.id}</Typography></Button>)}<Button onClick={()=>{setAuto(null);setBatchPage(value=>(value+1)%4);}} aria-label="下一组经历">›</Button></>
            :<Typography variant="bodySmall" tone="muted" align="center">先采集 16 步，再随机抽取一批。</Typography>}
        </div>
        <div className="vbrl-dqn__tuple" aria-live="polite"><Typography variant="bodySmall" tone={completed&&verifying.result.outcome==='delivered'?'success':'accent'}>
          {verifying?completed?`${outcomeText[verifying.result.outcome]} · ${verifying.result.actions.length} 步`:`验证当前策略 · 第 ${verifying.index} 步`
            :currentExperience?`${coordinate(currentExperience.s)} ${arrows[currentExperience.action]} ${currentExperience.reward>0?'+':''}${currentExperience.reward} ${coordinate(currentExperience.next)}`:'记录起点、动作、奖励与下一状态。'}</Typography>
          <Typography variant="bodySmall" tone="muted">{verifying?'验证不采集、不更新。':state.batch.length?`16 条中的 ${batchPage*4+1}–${batchPage*4+4} · 点击回放`:'每条数据都来自真实环境交互。'}</Typography></div>
      </TeachingPanel>
      <TeachingPanel title="② 计算误差，更新参数" className="vbrl-dqn__gradient">
        <div className="vbrl-dqn__steps"><Button onClick={collect}>采集 16 步</Button><Button disabled={occupied.length<DQN_BATCH} onClick={draw}>抽取 batch</Button>
          <Button variant="primary" disabled={state.batch.length!==DQN_BATCH} onClick={learn}>更新参数</Button></div>
        <div className="vbrl-dqn__prediction-target">
          <div><Typography variant="bodySmall" tone="muted">当前动作的预测</Typography><Typography variant="h3" tone="warning">{prediction===undefined?'—':prediction.toFixed(2)}</Typography></div>
          <div><Typography variant="bodySmall" tone="muted">目标网络给出参照</Typography><Typography variant="h3" tone="success">{target===undefined?'—':'y = '+target.toFixed(2)}</Typography></div>
        </div>
        <div className="vbrl-dqn__individual-loss"><Typography variant="bodySmall" tone="accent">实际动作的误差 → Huber 损失</Typography>
          <Formula latex={lossLatex} /></div>
        <div className="vbrl-dqn__batch-loss"><Typography variant="bodySmall" tone="muted">把这一批样本的损失取平均</Typography>
          <Formula latex={String.raw`L(\theta)=\frac{1}{B}\sum_{i=1}^{B}\ell_i,\quad B=16`} />
          <Typography variant="bodySmall" tone="success">{state.lastUpdate?`本批实际损失：${state.lastUpdate.lossBefore.toFixed(3)} → ${state.lastUpdate.lossAfter.toFixed(3)}`:'数据不变，也可以再次学习这一批。'}</Typography></div>
        <div className="vbrl-dqn__backprop"><Formula latex={String.raw`g=\nabla_\theta L(\theta)`} />
          <Typography variant="bodySmall" tone="accent">反向传播求梯度，Adam 更新当前网络。</Typography></div>
      </TeachingPanel>
      <TeachingPanel title="③ 用新评分再决策" className="vbrl-dqn__decision">
        <div className="vbrl-dqn__decision-state"><Formula latex={`s=${coordinate(inspectedPosition)}`} /><Typography variant="bodySmall" tone="muted">同一状态比较</Typography></div>
        <table className="vbrl-dqn__q-table"><thead><tr>{['动作','训练前','当前'].map(label=><th key={label}><Typography variant="bodySmall" tone="accent">{label}</Typography></th>)}</tr></thead>
          <tbody>{ACTIONS.map((action,index)=><tr key={action} data-action={index}><th><Typography variant="bodySmall" tone="accent">{arrows[index]} {action.slice(1)}</Typography></th>
            <td className={index===oldBest?'is-before':''}><Typography variant="bodySmall" tone={index===oldBest?'warning':'muted'}>{before[index].toFixed(2)}</Typography></td>
            <td className={index===best?'is-after':''}><Typography variant="bodySmall" tone={index===best?'success':'muted'}>{values[index].toFixed(2)}</Typography></td></tr>)}</tbody></table>
        <div className="vbrl-dqn__choices"><Typography variant="bodySmall" tone="warning">原选择 {arrows[oldBest]}</Typography><Typography variant="bodySmall" tone="muted">→</Typography><Typography variant="bodySmall" tone="success">新选择 {arrows[best]}</Typography></div>
        <Typography variant="bodySmall" tone="accent">参数共享，其他评分也可能变化。<br/>单次更新不保证更换动作。</Typography>
        <div className="vbrl-dqn__controls"><Button variant="primary" onClick={()=>auto?setAuto(null):run('slow')}>{auto?'暂停训练':'连续训练'}</Button>
          <Button disabled={!!auto} onClick={()=>run('fast')}>训练 2000 步</Button><Button onClick={validate}>验证策略</Button><Button onClick={reset}>重置</Button></div>
        <Typography variant="bodySmall" tone="muted">采集 {state.collected} 步 · 更新 {state.updates} 次</Typography>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
