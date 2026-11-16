import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
    overlay={<div shuku-edit-id="e-6ed99dfa-fa4a-41b0-9058-a39d7884d0c0" className="vbrl-epsilon__map-overlay" ref={overlayRef}>
      <svg shuku-edit-id="e-b8d1921d-fd6f-4239-ae87-d10b43f8bbf9" viewBox={'0 0 ' + size.width + ' ' + size.height} aria-hidden="true"><polyline shuku-edit-id="e-515e3ac3-9acb-48bf-9862-6f95b828eb19" points={trace.positions.map(center).join(' ')} stroke={tone} /></svg>
      <div shuku-edit-id="e-e7a1e573-1682-4e90-ad6b-f21bbe4fe952" className={'vbrl-epsilon__robot' + ([keyOf(GOAL), keyOf(TRAP)].includes(keyOf(robot)) ? ' is-terminal' : '')}
        style={{ '--epsilon-row': robot.row, '--epsilon-col': robot.col } as CSSProperties}><img shuku-edit-id="e-9d512ec1-4122-466e-a1d1-dbf3393fc34b" src={robotArt} alt="本回合路线结束时的机器人" /></div>
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
  const message = dirty ? '曲线尚未重新回放；当前路线与回报仍来自上次训练。'
    : record.greedy.outcome === 'delivered' && record.training.outcome !== 'delivered'
      ? 'Q 表关闭探索后已能送达；本回合仍在探索，付出了额外成本。'
      : record.greedy.outcome !== 'delivered' && record.epsilon <= .2
        ? '探索率已经很低，但本次验证仍未送达；可以把衰减点后移再比较。'
        : record.greedy.outcome === 'delivered' && run.schedule.end <= 30
          ? '这次较早减少探索也学会了送达；已访问 ' + record.coverage + ' 格，换曲线再比较。'
          : '到此已访问 ' + record.coverage + ' 个可行动状态；对照训练经历与关闭探索后的表现。';

  return <LessonPage className="vbrl-epsilon-page" title="探索率为什么要慢慢降下来？"
    subtitle="ε 衰减逐步降低随机探索的概率，使决策更多依据已学到的动作价值。"
    footer={<div shuku-edit-id="e-e4a8be62-cc88-45af-9323-a401683027ee" className="vbrl-epsilon__footer">
      <Typography shuku-edit-id="e-25421e21-7028-4cbe-a668-aa9785c3e08e" variant="bodySmall" tone={dirty ? 'warning' : 'accent'} role="status">{message}</Typography>
    </div>}>
    <div shuku-edit-id="e-daef3ead-a95f-4cf3-9b18-d1a8cfff8ccc" className="vbrl-epsilon" data-start={schedule.start} data-end={schedule.end} data-trained-start={run.schedule.start} data-trained-end={run.schedule.end}
      data-selected={selected} data-epsilon={record.epsilon} data-dirty={dirty} data-training={training} data-mode={mode}
      data-score={trace.score} data-outcome={trace.outcome} data-coverage={record.coverage} data-updates={record.updates}>
      <div shuku-edit-id="e-f80362ad-0b5f-4e10-9465-f6b2e01e2d05" className="vbrl-epsilon__toolbar">
        <div shuku-edit-id="e-8465f252-df63-4cd9-94e3-52f5a4659690" className="vbrl-controls" role="group" aria-label="参考衰减节奏">
          {SCHEDULE_PRESETS.map(preset => <Button key={preset.label} active={sameSchedule(schedule, preset.schedule)} disabled={training}
            onClick={() => changeSchedule({ ...preset.schedule })}>{preset.label}</Button>)}
          <Button variant="primary" disabled={training} onClick={retrain}>{training ? '训练 ' + progress + '/' + SCHEDULE_EPISODES : '重新回放'}</Button>
        </div>
        <Typography shuku-edit-id="e-8e35ea4b-f63e-4831-b6c8-ad0cd1c048aa" variant="bodySmall" tone={dirty ? 'warning' : 'muted'}>{dirty ? '曲线已修改 · 需重新回放' : '同一起点、空 Q 表与随机种子'}</Typography>
      </div>
      <div shuku-edit-id="e-7a55ccc3-edf6-473a-a5c8-ef1e31cd16c6" className="vbrl-epsilon__scene">
        <div shuku-edit-id="e-0aac65e9-d19f-4a81-9b8e-cd2b0ac26a3b" className="vbrl-epsilon__charts">
          <div shuku-edit-id="e-c13b45da-2062-4af2-94a8-fd49187b28a7" className="vbrl-epsilon__chart-heading"><Typography shuku-edit-id="e-2cffc1cc-5356-4bbb-b129-0db88b8dfea1" variant="bodySmall" tone="accent">探索率 ε{dirty ? ' · 待训练' : ''}</Typography><Typography shuku-edit-id="e-e3ad852d-0381-4efa-ba3f-924484ffe420" variant="bodySmall" tone="muted">拖动圆点调整衰减；点击曲线选择回合</Typography></div>
          <ScheduleCurve schedule={schedule} ghost={dirty ? run.schedule : previous?.schedule} selected={selected} disabled={training} onChange={changeSchedule} onSelect={setSelected} />
          <Typography shuku-edit-id="e-55a0043b-3fe3-4cc9-be09-4ec8e3de3f09" variant="bodySmall" tone="accent">第 {schedule.start} 回合开始衰减 · 第 {schedule.end} 回合降至 5%</Typography>
          <div shuku-edit-id="e-18cfbf07-fdca-4a98-b9cc-99da0b36924c" className="vbrl-epsilon__chart-heading"><Typography shuku-edit-id="e-b6b7e3b8-6cf9-4f19-bccc-914f5241d5e3" variant="bodySmall" tone="accent">近期平均回报（15 回合）</Typography><CurveLegend previous={!dirty && !!previous} stale={dirty} /></div>
          <ReturnCurve run={run} previous={dirty ? null : previous} selected={selected} onSelect={setSelected} stale={dirty} />
        </div>
        <section shuku-edit-id="e-68d57e94-5d12-49a0-a7c5-61d7cb6f4217" className="vbrl-epsilon__route" aria-label="所选回合的实际经历与策略验证">
          <TeachingHeading aside={<div shuku-edit-id="e-bb51e3af-526a-4656-adae-26ea498ea8e7" className="vbrl-epsilon__modes" role="group" aria-label="路线查看方式">
            <Button active={mode === 'training'} aria-pressed={mode === 'training'} aria-label="本回合训练路线" onClick={() => setMode('training')}>训练路线</Button>
            <Button active={mode === 'greedy'} aria-pressed={mode === 'greedy'} aria-label="关闭探索验证" onClick={() => setMode('greedy')}>关闭探索</Button>
          </div>}>第 {selected} 回合</TeachingHeading>
          <EpisodeMap trace={trace} />
          <div shuku-edit-id="e-417e6705-425e-4c21-af5f-cb521dda346d" className="vbrl-epsilon__metrics">
            <div shuku-edit-id="e-98d179ce-58cc-4563-ab1f-8576434a5ba8"><Typography shuku-edit-id="e-2916b089-31d1-4836-af46-6aa7ec34ee96" variant="bodySmall" tone="muted">{dirty ? '上次' : '当时'} ε</Typography><Typography shuku-edit-id="e-4d34f405-efc8-4204-be0b-43ee6f9ba92e" variant="bodySmall" tone="accent">{(record.epsilon * 100).toFixed(1)}%</Typography></div>
            <div shuku-edit-id="e-993834d4-fae8-415c-ae91-0a721e3a1590"><Typography shuku-edit-id="e-af10b04f-5986-4e74-b948-c90136dc7b48" variant="bodySmall" tone="muted">累计回报</Typography><Typography shuku-edit-id="e-aea784d0-dc25-4925-a7f2-0a32605332b0" variant="bodySmall" tone="accent">{signed(trace.score)}</Typography></div>
            <div shuku-edit-id="e-9647c31b-7161-4ca7-98be-bf1060af9f7d"><Typography shuku-edit-id="e-1a743a47-f23e-4f59-84da-70a9ea105e3b" variant="bodySmall" tone="muted">步数 / 碰撞</Typography><Typography shuku-edit-id="e-d101fcdd-3c5c-4f41-bbbc-6ad3cd091699" variant="bodySmall" tone="accent">{trace.actions.length} / {trace.collisions}</Typography></div>
            <div shuku-edit-id="e-723ee0a5-e50f-43cd-9be0-f49c3f9748cf"><Typography shuku-edit-id="e-9bfc9c85-c375-4fe1-a4f6-33a83338d20b" variant="bodySmall" tone="muted">结果</Typography><Typography shuku-edit-id="e-da0310af-6ac9-4c5a-85cd-faece197860e" variant="bodySmall" tone={trace.outcome === 'delivered' ? 'success' : trace.outcome === 'trap' ? 'danger' : 'warning'}>{outcomes[trace.outcome]}</Typography></div>
          </div>
        </section>
      </div>
    </div>
  </LessonPage>;
}
