import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { WarehouseMap } from '../../components/WarehouseMap';
import { TeachingHeading } from '../../components/TeachingPanel';
import { ACTIONS, GOAL, START, keyOf, type Position } from '../../model';
import {
  ALPHA, GAMMA, TRAP, advanceSimulation, createSimulation, mapEstimates,
  traceGreedyPolicy, type LearningUpdate,
} from './qLearningSimulation';
import './QLearningLoopPage.css';

const emptyStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const loadedStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

const cellLabel = (position: { row: number; col: number }) => `格 ${position.row + 1},${position.col + 1}`;
const number = (value: number) => value.toFixed(2);

function UpdateExplanation({ update }: { update: LearningUpdate | null }) {
  const before = update?.before ?? [0, 0, 0, 0];
  const after = update?.after ?? before;
  const targetFormula = update
    ? update.done
      ? `y=r=${number(update.reward)}`
      : `y=${number(update.reward)}+${number(GAMMA)}\\times(${number(update.nextMax)})=${number(update.target)}`
    : String.raw`y=r+\gamma\max_{a'}Q(s',a')`;
  const updateFormula = update
    ? `\\begin{aligned}\\Delta Q&=${number(ALPHA)}\\times[${number(update.target)}-(${number(before[update.action])})]\\\\Q_{\\mathrm{new}}&=${number(before[update.action])}+(${number(after[update.action] - before[update.action])})=${number(after[update.action])}\\end{aligned}`
    : String.raw`Q_{\mathrm{new}}=Q_{\mathrm{old}}+\alpha(y-Q_{\mathrm{old}})`;
  return <section className="vbrl-cycle__explanation" aria-label="本次经历与局部更新">
    <TeachingHeading>{update ? `${cellLabel(update.from)} → ${ACTIONS[update.action]} → ${cellLabel(update.next)}` : '一次经历，一处更新'}</TeachingHeading>
    <div className="vbrl-cycle__experience">
      <Typography variant="bodySmall" tone={update?.trapped ? 'danger' : update?.done ? 'success' : 'muted'}>
        {!update ? '移动 −1 · 碰撞 −3 · 送达 +10 · 陷阱 −10'
          : `即时奖励 ${update.reward > 0 ? '+' : ''}${update.reward} · ${update.trapped ? '踩中陷阱，本回合结束' : update.done ? '成功送达，本回合结束' : update.hit ? '碰到障碍，位置不变' : update.truncated ? '达到 80 步，下一步重新出发' : '继续从下一状态学习'}`}
      </Typography>
    </div>
    <div className="vbrl-cycle__calculation">
      <Formula latex={targetFormula} />
      <Typography className="vbrl-cycle__target-note" variant="bodySmall" tone={update?.done ? 'warning' : 'muted'}>
        {update?.done ? '回合已终止，目标只包含这一步的奖励。' : '未终止时接上未来价值；终止时只取这一步的奖励。'}
      </Typography>
      <Formula latex={updateFormula} />
    </div>
    <div className="vbrl-cycle__table-section">
      <Typography variant="bodySmall" tone="accent">{update ? `${cellLabel(update.from)} 的四个 Q 值` : '起点的四个 Q 值'}</Typography>
      <table className="vbrl-cycle__q-table" aria-label="本次更新前后的四个 Q 值">
        <thead><tr><th><Typography variant="bodySmall" tone="muted">动作</Typography></th>{ACTIONS.map((action, index) =>
          <th key={action} className={update?.action === index ? 'is-selected' : undefined}><Typography variant="bodySmall" tone={update?.action === index ? 'warning' : 'accent'}>{action}</Typography></th>)}</tr></thead>
        <tbody>{[before, after].map((row, rowIndex) => <tr key={rowIndex}>
          <th><Typography variant="bodySmall" tone="muted">{rowIndex ? '更新后' : '更新前'}</Typography></th>
          {row.map((value, action) => <td key={action} data-action={action} data-q={value} className={update?.action === action ? rowIndex ? 'is-updated' : 'is-selected' : undefined}><Typography variant="bodySmall" tone={update?.action === action ? 'warning' : 'accent'}>{number(value)}</Typography></td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

export function QLearningLoopPage() {
  const [simulation, setSimulation] = useState(createSimulation);
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  const [evaluation, setEvaluation] = useState<ReturnType<typeof traceGreedyPolicy> | null>(null);
  const [inspected, setInspected] = useState<Position | null>(null);
  const running = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { values, policy } = useMemo(() => mapEstimates(simulation), [simulation]);

  function pause() { running.current = false; setPlaying(false); }
  function step() { pause(); setEvaluation(null); setSimulation(advanceSimulation); }
  function togglePlayback() {
    if (running.current) { pause(); return; }
    setEvaluation(null); running.current = true; setPlaying(true);
  }

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (running.current) setSimulation(advanceSimulation);
    }, fast ? 35 : 600);
    return () => window.clearInterval(timer);
  }, [playing, fast]);

  useEffect(() => {
    const stop = () => { running.current = false; setPlaying(false); };
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onVisibility);
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) stop();
    });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => { running.current = false; observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  const last = simulation.last;
  const evaluationLabel = evaluation
    ? evaluation.outcome === 'delivered' ? `当前策略：${evaluation.route.length - 1} 步送达，避开陷阱`
      : `当前策略尚未送达：${({ trap: '踩中陷阱', collision: '碰到障碍', loop: '来回绕圈', limit: '达到步数上限' } as const)[evaluation.outcome]}`
    : null;
  const robot = evaluation ? evaluation.route[evaluation.route.length - 1] : simulation.position;
  const inspectedState = inspected ?? last?.from ?? START;
  const inspectedTerminal = [keyOf(GOAL), keyOf(TRAP)].includes(keyOf(inspectedState));
  const inspectedValue = Math.max(...simulation.q[keyOf(inspectedState)]);

  return <LessonPage className="vbrl-cycle-page" title="Q-learning：边走边更新整张表"
    subtitle="Q-learning 通过反复交互，用即时奖励和下一状态的最大 Q 值更新当前估计。"
    footer={<div className="vbrl-cycle__footer">
      <Typography className="vbrl-cycle__status" variant="bodySmall" tone={evaluation ? evaluation.outcome === 'delivered' ? 'success' : 'danger' : 'muted'} role="status">
        {evaluationLabel ?? '橙色：本次更新 · 绿色：最大 Q · 灰色：并列'}
      </Typography>
      <Typography variant="bodySmall" tone="accent">一次经历只改写一个 Q 值，回合结束后保留 Q 表。</Typography>
    </div>}>
    <div className="vbrl-cycle" ref={rootRef} data-updates={simulation.updates} data-episodes={simulation.episodes}
      data-deliveries={simulation.deliveries} data-traps={simulation.traps} data-playing={playing}
      data-position={keyOf(simulation.position)} data-last-state={last ? keyOf(last.from) : undefined}
      data-last-action={last?.action} data-terminal={last?.done}>
      <div className="vbrl-cycle__toolbar">
        <div className="vbrl-controls">
          <Button variant="primary" onClick={step}>单步学习</Button>
          <Button variant={playing ? 'warn' : 'default'} onClick={togglePlayback} aria-pressed={playing}>{playing ? '暂停' : '连续播放'}</Button>
          <Button active={fast} aria-pressed={fast} onClick={() => setFast(value => !value)}>加速训练</Button>
          <Button onClick={() => { pause(); setEvaluation(traceGreedyPolicy(simulation.q)); }}>试走当前策略</Button>
          <Button onClick={() => { pause(); setEvaluation(null); setInspected(null); setSimulation(createSimulation()); }}>重置</Button>
        </div>
        <Typography variant="bodySmall" tone="muted">更新 {simulation.updates} 次 · 回合 {simulation.episodes} · 送达 {simulation.deliveries} 次 · 陷阱 {simulation.traps} 次</Typography>
      </div>
      <div className="vbrl-cycle__stage">
        <div className="vbrl-cycle__warehouse">
          <TeachingHeading>反复尝试，逐渐形成策略</TeachingHeading>
          <div className="vbrl-cycle__map-area">
            <WarehouseMap className="vbrl-cycle__map" coordinates robot={robot} values={values} policy={policy} showValueLabels={false}
              selected={inspected ?? undefined} onSelect={position => setInspected(position)} markers={{ [keyOf(TRAP)]: '!' }}
              goalArt={keyOf(robot) === keyOf(GOAL) ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
              update={last && !evaluation ? { position: last.from, action: last.action } : undefined}
              trails={[{ points: evaluation?.route ?? simulation.route, color: evaluation ? evaluation.outcome === 'delivered' ? 'var(--ui-success)' : 'var(--ui-danger)' : 'var(--ui-border)', dashed: !evaluation }]}
            />
            <div className="vbrl-cycle__value-inspector" data-inspected-state={keyOf(inspectedState)} data-q={inspectedValue}>
              <Typography variant="bodySmall" tone="accent">({inspectedState.row + 1},{inspectedState.col + 1})</Typography>
              <Typography variant="bodySmall" tone="muted">{inspectedTerminal ? '终止价值' : inspected ? '最大 Q' : '点格查看 Q'}</Typography>
              <Typography variant="bodySmall" tone={inspectedValue < 0 ? 'danger' : inspectedValue > 0 ? 'success' : 'muted'}>{number(inspectedValue)}</Typography>
            </div>
          </div>
        </div>
        <UpdateExplanation update={last} />
      </div>
    </div>
  </LessonPage>;
}
