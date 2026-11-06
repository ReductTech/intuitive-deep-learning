import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPrimitives';
import { WarehouseMap } from '../../components/WarehouseMap';
import { TeachingHeading } from '../../components/TeachingPanel';
import { GOAL, START, keyOf } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import { ScheduleCurve, ReturnCurve, CurveLegend } from './ScheduleCharts';
import { DEFAULT_SCHEDULE, SCHEDULE_EPISODES, SCHEDULE_PRESETS, createScheduleTraining, advanceScheduleTraining,
  sameSchedule, trainSchedule, type EpsilonSchedule, type ScheduleRun, type ScheduleTrace } from './epsilonSimulation';
import './EpsilonSchedulePage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const emptyStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const loadedStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

const signed = (value: number) => (value > 0 ? '+' : '') + value.toFixed(2);
const outcomes = { delivered: '送达', trap: '陷阱', limit: '截断' };

function EpisodeMap({ trace }: { trace: ScheduleTrace }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 336, height: 336 });
  useLayoutEffect(() => {
    if (!overlayRef.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(overlayRef.current); return () => observer.disconnect();
  }, []);
  const robot = trace.positions.at(-1)!;
  const center = (position: { row: number; col: number }) => {
    const w = (size.width - 48) / 7, h = (size.height - 48) / 7;
    return (position.col * (w + 8) + w / 2) + ',' + (position.row * (h + 8) + h / 2);
  };
  const tone = trace.outcome === 'delivered' ? 'var(--ui-success)' : trace.outcome === 'trap' ? 'var(--ui-danger)' : 'var(--ui-accent-alt)';
  return <WarehouseMap className="vbrl-epsilon__map" coordinates robot={robot} selected={START} markers={{ [keyOf(TRAP)]: '!' }}
    goalArt={trace.outcome === 'delivered' ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
    overlay={<div className="vbrl-epsilon__map-overlay" ref={overlayRef}>
      <svg viewBox={'0 0 ' + size.width + ' ' + size.height} aria-hidden="true"><polyline points={trace.positions.map(center).join(' ')} stroke={tone} /></svg>
      <div className={'vbrl-epsilon__robot' + ([keyOf(GOAL), keyOf(TRAP)].includes(keyOf(robot)) ? ' is-terminal' : '')}
        style={{ '--epsilon-row': robot.row, '--epsilon-col': robot.col } as CSSProperties}><img src={robotArt} alt="本回合路线结束时的机器人" /></div>
    </div>} />;
}

export function EpsilonSchedulePage() {
  const [schedule, setSchedule] = useState<EpsilonSchedule>({ ...DEFAULT_SCHEDULE });
  const [run, setRun] = useState<ScheduleRun>(() => trainSchedule(DEFAULT_SCHEDULE));
  const [previous, setPrevious] = useState<ScheduleRun | null>(null);
  const [selected, setSelected] = useState(60);
  const [mode, setMode] = useState<'training' | 'greedy'>('training');
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const generation = useRef(0);
  const dirty = !sameSchedule(schedule, run.schedule);
  const record = run.records[selected - 1], trace = record[mode];
  function changeSchedule(next: EpsilonSchedule) { if (!training) setSchedule(next); }
  function retrain() {
    if (training) return;
    const current = ++generation.current, session = createScheduleTraining(schedule);
    setTraining(true); setProgress(0);
    const tick = () => {
      if (current !== generation.current) return;
      advanceScheduleTraining(session);
      setProgress(session.records.length);
      if (session.records.length < SCHEDULE_EPISODES) { timer.current = window.setTimeout(tick, 8); return; }
      if (!sameSchedule(run.schedule, session.schedule)) setPrevious(run);
      setRun({ schedule: session.schedule, records: session.records });
      setTraining(false); timer.current = null;
    };
    timer.current = window.setTimeout(tick, 0);
  }
  useEffect(() => () => { generation.current++; if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  const message = dirty ? '曲线尚未重新训练；当前路线与回报仍来自上次训练。'
    : record.greedy.outcome === 'delivered' && record.training.outcome !== 'delivered'
      ? 'Q 表关闭探索后已能送达；本回合仍在探索，付出了额外成本。'
      : record.greedy.outcome !== 'delivered' && record.epsilon <= .2
        ? '探索率已经很低，但本次验证仍未送达；可以把衰减点后移再比较。'
        : record.greedy.outcome === 'delivered' && run.schedule.end <= 30
          ? '这次较早减少探索也学会了送达；已访问 ' + record.coverage + ' 格，换曲线再比较。'
          : '到此已访问 ' + record.coverage + ' 个可行动状态；对照训练经历与关闭探索后的表现。';

  return <LessonPage className="vbrl-epsilon-page" title="探索率为什么要慢慢降下来？"
    subtitle="ε 衰减逐步降低随机探索的概率，使决策更多依据已学到的动作价值。"
    footer={<div className="vbrl-epsilon__footer">
      <Typography variant="bodySmall" tone={dirty ? 'warning' : 'accent'} role="status">{message}</Typography>
    </div>}>
    <div className="vbrl-epsilon" data-start={schedule.start} data-end={schedule.end} data-trained-start={run.schedule.start} data-trained-end={run.schedule.end}
      data-selected={selected} data-epsilon={record.epsilon} data-dirty={dirty} data-training={training} data-mode={mode}
      data-score={trace.score} data-outcome={trace.outcome} data-coverage={record.coverage} data-updates={record.updates}>
      <div className="vbrl-epsilon__toolbar">
        <div className="vbrl-controls" role="group" aria-label="参考衰减节奏">
          {SCHEDULE_PRESETS.map(preset => <Button key={preset.label} active={sameSchedule(schedule, preset.schedule)} disabled={training}
            onClick={() => changeSchedule({ ...preset.schedule })}>{preset.label}</Button>)}
          <Button variant="primary" disabled={training} onClick={retrain}>{training ? '训练 ' + progress + '/' + SCHEDULE_EPISODES : '重新训练'}</Button>
        </div>
        <Typography variant="bodySmall" tone={dirty ? 'warning' : 'muted'}>{dirty ? '曲线已修改 · 需重新训练' : '同一起点、空 Q 表与随机种子'}</Typography>
      </div>
      <div className="vbrl-epsilon__scene">
        <div className="vbrl-epsilon__charts">
          <div className="vbrl-epsilon__chart-heading"><Typography variant="bodySmall" tone="accent">探索率 ε{dirty ? ' · 待训练' : ''}</Typography><Typography variant="bodySmall" tone="muted">拖动圆点调整衰减；点击曲线选择回合</Typography></div>
          <ScheduleCurve schedule={schedule} ghost={dirty ? run.schedule : previous?.schedule} selected={selected} disabled={training} onChange={changeSchedule} onSelect={setSelected} />
          <Typography variant="bodySmall" tone="accent">第 {schedule.start} 回合开始衰减 · 第 {schedule.end} 回合降至 5%</Typography>
          <div className="vbrl-epsilon__chart-heading"><Typography variant="bodySmall" tone="accent">近期平均回报（15 回合）</Typography><CurveLegend previous={!dirty && !!previous} stale={dirty} /></div>
          <ReturnCurve run={run} previous={dirty ? null : previous} selected={selected} onSelect={setSelected} stale={dirty} />
        </div>
        <section className="vbrl-epsilon__route" aria-label="所选回合的实际经历与策略验证">
          <TeachingHeading aside={<div className="vbrl-epsilon__modes" role="group" aria-label="路线查看方式">
            <Button active={mode === 'training'} aria-pressed={mode === 'training'} aria-label="本回合训练路线" onClick={() => setMode('training')}>训练路线</Button>
            <Button active={mode === 'greedy'} aria-pressed={mode === 'greedy'} aria-label="关闭探索验证" onClick={() => setMode('greedy')}>关闭探索</Button>
          </div>}>第 {selected} 回合</TeachingHeading>
          <EpisodeMap trace={trace} />
          <div className="vbrl-epsilon__metrics">
            <div><Typography variant="bodySmall" tone="muted">{dirty ? '上次' : '当时'} ε</Typography><Typography variant="bodySmall" tone="accent">{(record.epsilon * 100).toFixed(1)}%</Typography></div>
            <div><Typography variant="bodySmall" tone="muted">累计回报</Typography><Typography variant="bodySmall" tone="accent">{signed(trace.score)}</Typography></div>
            <div><Typography variant="bodySmall" tone="muted">步数 / 碰撞</Typography><Typography variant="bodySmall" tone="accent">{trace.actions.length} / {trace.collisions}</Typography></div>
            <div><Typography variant="bodySmall" tone="muted">结果</Typography><Typography variant="bodySmall" tone={trace.outcome === 'delivered' ? 'success' : trace.outcome === 'trap' ? 'danger' : 'warning'}>{outcomes[trace.outcome]}</Typography></div>
          </div>
        </section>
      </div>
    </div>
  </LessonPage>;
}
