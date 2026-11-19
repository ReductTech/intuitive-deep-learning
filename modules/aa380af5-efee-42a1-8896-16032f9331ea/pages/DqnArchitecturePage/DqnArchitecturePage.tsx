import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { PositionQNetwork } from '../../components/PositionQNetwork';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, GOAL, GRID, START, keyOf, type Position } from '../../model';
import { dqnForward } from '../../dqnSimulation';
import { TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';
import fitted from './qTableFittedNetwork.json';
import './DqnArchitecturePage.css';

const robotArt = valueBasedRlAssetUrl("cover-v2/robot.webp");
const receivingEmpty = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const receivingLoaded = valueBasedRlAssetUrl("cover-v2/receiving-station-loaded.webp");
const pitArt = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");

type Phase = 'input' | 'encoding' | 'network' | 'values' | 'moved';
type Prediction = ReturnType<typeof dqnForward>;
type Experience = ReturnType<typeof warehouseStep> & { action: number };
const coordinate = (p: Position) => `(${p.row + 1}, ${p.col + 1})`;
const isTerminal = (p: Position) => keyOf(p) === keyOf(GOAL) || keyOf(p) === keyOf(TRAP);

function Direction({ action }: { action: number }) {
  return <svg shuku-edit-id="e-09f551a4-7687-434f-91bd-0a29f0df07d2" className="vbrl-architecture__direction" viewBox="0 0 24 24" aria-hidden="true">
    <path shuku-edit-id="e-c89fec94-cbb7-4533-812d-258b9fb143f4" d="M9 21V10H3L12 1L21 10H15V21Z" transform={`rotate(${action * 90} 12 12)`} />
  </svg>;
}

export function DqnArchitecturePage() {
  const [network] = useState(() => Float64Array.from(fitted.weights));
  const [source, setSource] = useState<Position>(START), [robot, setRobot] = useState<Position>(START);
  const [phase, setPhase] = useState<Phase>('input'), [prediction, setPrediction] = useState<Prediction | null>(null);
  const [experience, setExperience] = useState<Experience | null>(null), [notice, setNotice] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]), phaseRef = useRef(phase);
  phaseRef.current = phase;
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => {
    const stopHidden = () => {
      if (document.hidden && (phaseRef.current === 'encoding' || phaseRef.current === 'network')) {
        clearTimers(); setPhase('input'); setPrediction(null);
      }
    };
    document.addEventListener('visibilitychange', stopHidden);
    return () => { clearTimers(); document.removeEventListener('visibilitychange', stopHidden); };
  }, []);
  const ready = phase === 'values' || phase === 'moved', busy = phase === 'encoding' || phase === 'network';
  const best = prediction ? prediction.values.indexOf(Math.max(...prediction.values)) : -1;
  const maximumMagnitude = Math.max(...(prediction?.values.map(Math.abs) ?? [1]), .000001);
  const selectPosition = (position: Position) => {
    if (isTerminal(position)) { setNotice('终止格无后续动作，请选择空地。'); return; }
    clearTimers(); setSource(position); setRobot(position); setPhase('input');
    setPrediction(null); setExperience(null); setNotice('');
  };
  const calculate = () => {
    if (busy) return;
    clearTimers();
    const position = experience?.done ? START : experience?.next ?? source;
    setSource(position); setRobot(position); setExperience(null); setNotice('');
    setPrediction(dqnForward(network, position));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('values'); return; }
    setPhase('encoding');
    timers.current = [setTimeout(() => setPhase('network'), 300), setTimeout(() => setPhase('values'), 750)];
  };
  const execute = () => {
    if (phase !== 'values' || !prediction) return;
    const step = { ...warehouseStep(source, best), action: best };
    setExperience(step); setRobot(step.next); setPhase('moved'); setNotice('');
  };
  const reset = () => {
    clearTimers(); setSource(START); setRobot(START); setPhase('input');
    setPrediction(null); setExperience(null); setNotice('');
  };
  const feedback = notice || (experience
    ? `${ACTIONS[experience.action]} · 奖励 ${experience.reward > 0 ? '+' : '−'}${Math.abs(experience.reward)}${experience.done ? experience.trapped ? ' · 陷阱终止' : ' · 送达终止' : experience.hit ? ' · 位置不变' : ` → ${coordinate(experience.next)}`}`
    : '点击空地，更换网络输入。');
  const inputIndex = source.row * GRID + source.col;

  return <LessonPage className="vbrl-foundation-page vbrl-architecture-page" title="DQN：让网络替机器人估价"
    subtitle="神经网络近似动作价值函数，输入状态，一次输出各个动作的长期评分。"
    footer="输出是 Q 值，不是动作概率；Q 值可以为负，也不需要总和为 1。">
    <div shuku-edit-id="e-f27a66eb-e5cd-4bf5-af87-d31968826f32" className="vbrl-architecture" data-phase={phase} data-source={keyOf(source)} data-robot={keyOf(robot)}
      data-values={ready ? prediction?.values.join(',') : undefined} data-best={ready ? best : undefined}
      data-q-learning-updates={fitted.qLearningUpdates} data-fit-error={fitted.fit.maxAbsoluteError}
      data-reward={experience?.reward} data-done={experience?.done} onKeyDown={event => {
        if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation();
      }}>
      <TeachingPanel title="① 输入当前位置" className="vbrl-architecture__warehouse">
        <WarehouseMap coordinates className="vbrl-architecture__map" robot={robot} selected={source} onSelect={selectPosition}
          markers={{ [keyOf(TRAP)]: '!' }} dangerArt={pitArt} goalArt={experience?.done && !experience.trapped ? receivingLoaded : receivingEmpty}
          trails={experience && !experience.hit ? [{ points: [source, robot], color: 'var(--ui-success)' }] : []}
          overlay={<div shuku-edit-id="e-90417bc2-b1f7-476e-b7e1-c5b0d94d8050" className="vbrl-architecture__map-overlay" aria-hidden="true">
            <div shuku-edit-id="e-7dea2979-3cc4-4bcc-9678-c8522034542e" className={'vbrl-architecture__robot' + (isTerminal(robot) ? ' is-terminal' : '')}
              style={{ '--architecture-row': robot.row, '--architecture-col': robot.col } as CSSProperties}>
              <img shuku-edit-id="e-21dfbb03-81e6-4ff2-ad6c-17a8d326a51a" src={robotArt} alt="" />
            </div>
          </div>} />
        <div shuku-edit-id="e-f46ab46f-fc25-47d1-92db-7829437fbf86" className="vbrl-architecture__position"><Typography shuku-edit-id="e-2840f299-ef55-4b8e-80a2-58dd16f0077c" variant="bodySmall" tone="muted">本次输入</Typography>
          <Formula latex={`s=${coordinate(source)}`} /></div>
        <Typography shuku-edit-id="e-c36c69be-1c77-4584-bdfa-5f463e94dcdf" variant="bodySmall" tone={notice || experience?.hit || experience?.trapped ? 'warning' : experience ? 'success' : 'muted'}
          className="vbrl-architecture__feedback" role="status">{feedback}</Typography>
      </TeachingPanel>
      <TeachingPanel title="② 同一个网络，同时给四个动作评分" className="vbrl-architecture__inference">
        <div shuku-edit-id="e-8bac25dd-f6cd-4341-9ea9-e6cef241e683" className="vbrl-architecture__pipeline">
          <div shuku-edit-id="e-dcda8267-3638-4c04-a8b1-d58f8b3af734" className={'vbrl-architecture__encoding' + (phase === 'encoding' ? ' is-active' : '')}>
            <Typography shuku-edit-id="e-a26d2793-d116-40c9-a896-b7940bbffbdc" variant="bodySmall" tone="accent">49 维位置编码</Typography>
            <div shuku-edit-id="e-d230ddec-ba5f-4f4b-8d23-392c2dc33165" className="vbrl-architecture__onehot" role="img" aria-label={`49 维编码：第 ${inputIndex + 1} 项为 1，其余为 0`}>
              {Array.from({ length: GRID * GRID }, (_, index) => <i shuku-edit-id="e-ce262884-ccbf-4e65-9ac9-c5e0678630cc" key={index} data-input={index} className={index === inputIndex ? 'is-active' : undefined} />)}
            </div>
            <Formula latex={`x(s)=e_{${inputIndex + 1}}`} />
            <Typography shuku-edit-id="e-0cb2e361-5215-4143-acf1-9c71a77e44fb" variant="bodySmall" tone="muted" align="center">仅一项为 1<br shuku-edit-id="e-d87516ac-bbfd-44c6-8557-8478ac2e901b" />其余为 0</Typography>
          </div>
          <svg shuku-edit-id="e-59ff978a-a201-46e5-b751-1369fb150410" className={'vbrl-architecture__flow-arrow' + (busy ? ' is-active' : '')} viewBox="0 0 24 24" aria-hidden="true"><path shuku-edit-id="e-5cfb67a0-48f0-4d41-8468-4a5fe53b0c32" d="M2 12H21M13 4L21 12L13 20" /></svg>
          <div shuku-edit-id="e-d8d6fdfa-4c88-4eed-809d-8ed13a9d6a74" className="vbrl-architecture__model">
            <div shuku-edit-id="e-48c7c91e-c825-486d-aded-4d3a8dc7d262" className="vbrl-architecture__model-title"><Typography shuku-edit-id="e-fe34e742-bd87-4ba6-8ba8-10722e1bfe5d" variant="bodySmall" tone="accent">共享参数</Typography><Formula latex={String.raw`\theta`} /></div>
            <PositionQNetwork hidden={phase !== 'input' && phase !== 'encoding' ? prediction?.hidden : undefined} active={phase === 'network'} />
            <Typography shuku-edit-id="e-6bf9ca6a-bd69-4e43-a273-20aa0d25fafc" variant="bodySmall" tone="muted" align="center">24 个 ReLU 单元</Typography>
          </div>
          <svg shuku-edit-id="e-e5617064-1601-4a96-a700-03fe9ca249a3" className={'vbrl-architecture__outputs-flow' + (ready ? ' is-active' : '')} viewBox="0 0 24 344" preserveAspectRatio="none" aria-hidden="true">
            {[77, 145, 213, 281].map(y => <path shuku-edit-id="e-c12a6b13-7e96-4456-bb25-5b0211d2b5d6" key={y} d={`M1 ${y}H22M15 ${y - 6}L22 ${y}L15 ${y + 6}`} />)}
          </svg>
          <div shuku-edit-id="e-df559b28-d0d0-48d4-9484-53cb4b18a66c" className="vbrl-architecture__outputs">
            <Typography shuku-edit-id="e-59a4ad34-d9ab-4095-9561-32f874ce3fba" variant="bodySmall" tone="accent">四个动作的 Q 值</Typography>
            <div shuku-edit-id="e-8971ce1d-c7e9-4bec-b68e-92f5cbb007f9" className="vbrl-architecture__q-rows" aria-live="polite">
              {ACTIONS.map((label, action) => {
                const value = ready && prediction ? prediction.values[action] : undefined;
                const extent = value === undefined ? 0 : Math.abs(value) / maximumMagnitude * 48;
                return <div shuku-edit-id="e-46057250-d492-4136-a532-0cb90679ec13" key={action} data-action={action} data-q={value} className={'vbrl-architecture__q-row' + (ready && best === action ? ' is-best' : '')}>
                  <div shuku-edit-id="e-c9490168-a60e-4da5-9091-fa7ec13c98b6" className="vbrl-architecture__action"><Direction action={action} /><Typography shuku-edit-id="e-dfcbfc44-d4f0-438c-a7eb-d3f0fd5044fc" variant="bodySmall" tone="accent">{label.slice(1)}</Typography></div>
                  <div shuku-edit-id="e-81457059-89ae-4ec8-8d28-9f5f5ff40e6e" className="vbrl-architecture__bar" aria-hidden="true"><i shuku-edit-id="e-9563a6be-31b5-46bf-86f1-285cfd741b59" style={{ left: `${value !== undefined && value < 0 ? 50 - extent : 50}%`, width: `${extent}%`, background: value !== undefined && value < 0 ? 'var(--ui-danger)' : 'var(--ui-success)' }} /></div>
                  <Typography shuku-edit-id="e-fa976259-3812-4875-a66d-f518019495ff" variant="bodySmall" className="vbrl-architecture__q-number" tone={value === undefined ? 'muted' : value < 0 ? 'danger' : 'success'}>{value === undefined ? '—' : (Math.abs(value) < .005 ? 0 : value).toFixed(2).replace('-', '−')}</Typography>
                  <Typography shuku-edit-id="e-50212a1b-2a4d-47e8-a4c8-4d3521506d58" variant="bodySmall" tone="success" className="vbrl-architecture__best-label">{ready && best === action ? '最大' : ''}</Typography>
                </div>;
              })}
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-c05825cd-f2d9-40f8-8ce2-4d71642539d4" className="vbrl-architecture__explanation">
          <Formula latex={String.raw`Q_\theta(s,\cdot)=[Q_\uparrow,\;Q_\rightarrow,\;Q_\downarrow,\;Q_\leftarrow]`} />
          <div shuku-edit-id="e-c7b67787-6b2c-46cf-b3f2-f72d029320a6"><Typography shuku-edit-id="e-2900f84c-243b-4da9-92b3-4b566274b59e" variant="bodySmall" tone="accent">换一个位置，仍使用同一组参数。</Typography></div>
        </div>
        <div shuku-edit-id="e-d661e980-e553-4672-bcec-930ad638e0d6" className="vbrl-architecture__controls">
          <Button variant="primary" disabled={busy} onClick={calculate}>{busy ? '前向计算中…' : experience?.done ? '重新开始' : experience ? '估计下一状态' : ready ? '重新计算' : '计算四个 Q 值'}</Button>
          <Button disabled={phase !== 'values'} onClick={execute}>按最大 Q 走一步</Button>
          <Button onClick={reset}>重置</Button>
        </div>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
