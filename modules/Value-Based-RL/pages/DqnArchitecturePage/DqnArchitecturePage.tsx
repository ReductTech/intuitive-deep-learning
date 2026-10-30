import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { PositionQNetwork } from '../../components/PositionQNetwork';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, GOAL, GRID, START, keyOf, type Position } from '../../model';
import { dqnForward } from '../../dqnSimulation';
import { TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';
import fitted from './qTableFittedNetwork.json';
import './DqnArchitecturePage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const receivingEmpty = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const receivingLoaded = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

type Phase = 'input' | 'encoding' | 'network' | 'values' | 'moved';
type Prediction = ReturnType<typeof dqnForward>;
type Experience = ReturnType<typeof warehouseStep> & { action: number };
const coordinate = (p: Position) => `(${p.row + 1}, ${p.col + 1})`;
const isTerminal = (p: Position) => keyOf(p) === keyOf(GOAL) || keyOf(p) === keyOf(TRAP);

function Direction({ action }: { action: number }) {
  return <svg className="vbrl-architecture__direction" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 21V10H3L12 1L21 10H15V21Z" transform={`rotate(${action * 90} 12 12)`} />
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
    <div className="vbrl-architecture" data-phase={phase} data-source={keyOf(source)} data-robot={keyOf(robot)}
      data-values={ready ? prediction?.values.join(',') : undefined} data-best={ready ? best : undefined}
      data-q-learning-updates={fitted.qLearningUpdates} data-fit-error={fitted.fit.maxAbsoluteError}
      data-reward={experience?.reward} data-done={experience?.done} onKeyDown={event => {
        if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation();
      }}>
      <TeachingPanel title="① 输入当前位置" className="vbrl-architecture__warehouse">
        <WarehouseMap coordinates className="vbrl-architecture__map" robot={robot} selected={source} onSelect={selectPosition}
          markers={{ [keyOf(TRAP)]: '!' }} dangerArt={pitArt} goalArt={experience?.done && !experience.trapped ? receivingLoaded : receivingEmpty}
          trails={experience && !experience.hit ? [{ points: [source, robot], color: 'var(--ui-success)' }] : []}
          overlay={<div className="vbrl-architecture__map-overlay" aria-hidden="true">
            <div className={'vbrl-architecture__robot' + (isTerminal(robot) ? ' is-terminal' : '')}
              style={{ '--architecture-row': robot.row, '--architecture-col': robot.col } as CSSProperties}>
              <img src={robotArt} alt="" />
            </div>
          </div>} />
        <div className="vbrl-architecture__position"><Typography variant="bodySmall" tone="muted">本次输入</Typography>
          <Formula latex={`s=${coordinate(source)}`} /></div>
        <Typography variant="bodySmall" tone={notice || experience?.hit || experience?.trapped ? 'warning' : experience ? 'success' : 'muted'}
          className="vbrl-architecture__feedback" role="status">{feedback}</Typography>
      </TeachingPanel>
      <TeachingPanel title="② 同一个网络，同时给四个动作评分" className="vbrl-architecture__inference">
        <div className="vbrl-architecture__pipeline">
          <div className={'vbrl-architecture__encoding' + (phase === 'encoding' ? ' is-active' : '')}>
            <Typography variant="bodySmall" tone="accent">49 维位置编码</Typography>
            <div className="vbrl-architecture__onehot" role="img" aria-label={`49 维编码：第 ${inputIndex + 1} 项为 1，其余为 0`}>
              {Array.from({ length: GRID * GRID }, (_, index) => <i key={index} data-input={index} className={index === inputIndex ? 'is-active' : undefined} />)}
            </div>
            <Formula latex={`x(s)=e_{${inputIndex + 1}}`} />
            <Typography variant="bodySmall" tone="muted" align="center">仅一项为 1<br />其余为 0</Typography>
          </div>
          <svg className={'vbrl-architecture__flow-arrow' + (busy ? ' is-active' : '')} viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12H21M13 4L21 12L13 20" /></svg>
          <div className="vbrl-architecture__model">
            <div className="vbrl-architecture__model-title"><Typography variant="bodySmall" tone="accent">共享参数</Typography><Formula latex={String.raw`\theta`} /></div>
            <PositionQNetwork hidden={phase !== 'input' && phase !== 'encoding' ? prediction?.hidden : undefined} active={phase === 'network'} />
            <Typography variant="bodySmall" tone="muted" align="center">24 个 ReLU 单元</Typography>
          </div>
          <svg className={'vbrl-architecture__outputs-flow' + (ready ? ' is-active' : '')} viewBox="0 0 24 344" preserveAspectRatio="none" aria-hidden="true">
            {[77, 145, 213, 281].map(y => <path key={y} d={`M1 ${y}H22M15 ${y - 6}L22 ${y}L15 ${y + 6}`} />)}
          </svg>
          <div className="vbrl-architecture__outputs">
            <Typography variant="bodySmall" tone="accent">四个动作的 Q 值</Typography>
            <div className="vbrl-architecture__q-rows" aria-live="polite">
              {ACTIONS.map((label, action) => {
                const value = ready && prediction ? prediction.values[action] : undefined;
                const extent = value === undefined ? 0 : Math.abs(value) / maximumMagnitude * 48;
                return <div key={action} data-action={action} data-q={value} className={'vbrl-architecture__q-row' + (ready && best === action ? ' is-best' : '')}>
                  <div className="vbrl-architecture__action"><Direction action={action} /><Typography variant="bodySmall" tone="accent">{label.slice(1)}</Typography></div>
                  <div className="vbrl-architecture__bar" aria-hidden="true"><i style={{ left: `${value !== undefined && value < 0 ? 50 - extent : 50}%`, width: `${extent}%`, background: value !== undefined && value < 0 ? 'var(--ui-danger)' : 'var(--ui-success)' }} /></div>
                  <Typography variant="bodySmall" className="vbrl-architecture__q-number" tone={value === undefined ? 'muted' : value < 0 ? 'danger' : 'success'}>{value === undefined ? '—' : (Math.abs(value) < .005 ? 0 : value).toFixed(2).replace('-', '−')}</Typography>
                  <Typography variant="bodySmall" tone="success" className="vbrl-architecture__best-label">{ready && best === action ? '最大' : ''}</Typography>
                </div>;
              })}
            </div>
          </div>
        </div>
        <div className="vbrl-architecture__explanation">
          <Formula latex={String.raw`Q_\theta(s,\cdot)=[Q_\uparrow,\;Q_\rightarrow,\;Q_\downarrow,\;Q_\leftarrow]`} />
          <div><Typography variant="bodySmall" tone="accent">换一个位置，仍使用同一组参数。</Typography></div>
        </div>
        <div className="vbrl-architecture__controls">
          <Button variant="primary" disabled={busy} onClick={calculate}>{busy ? '前向计算中…' : experience?.done ? '重新开始' : experience ? '估计下一状态' : ready ? '重新计算' : '计算四个 Q 值'}</Button>
          <Button disabled={phase !== 'values'} onClick={execute}>按最大 Q 走一步</Button>
          <Button onClick={reset}>重置</Button>
        </div>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
