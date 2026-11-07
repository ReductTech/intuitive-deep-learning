import { useMemo, useRef, type CSSProperties, type PointerEvent } from 'react';
import { Button, EChartsChart, Typography } from '../../../shared/react';
import { EPSILON_FLOOR, SCHEDULE_EPISODES, epsilonAt, normalizeSchedule, rollingReturns, type EpsilonSchedule, type ScheduleRun } from './epsilonSimulation';

const GRID = { left: 64, right: 28, top: 20, bottom: 36 };
const position = (episode: number) => (episode - 1) / (SCHEDULE_EPISODES - 1) * 100;
const axis = { type: 'value', min: 1, max: SCHEDULE_EPISODES, axisLabel: { fontSize: 18 }, splitLine: { show: false } };
const chartBase = { animation: false, textStyle: { fontFamily: 'Arial, sans-serif', color: '#27446e', fontSize: 18 }, grid: GRID, xAxis: axis };
const epsilonAxes = { ...chartBase, yAxis: { type: 'value', min: 0, max: 1, interval: .25,
  axisLabel: { fontSize: 18, formatter: (value: number) => Math.round(value * 100) + '%' }, splitLine: { lineStyle: { color: '#e4eaf2' } } }, series: [] };
const plotStyle: CSSProperties = { left: GRID.left, right: GRID.right, top: GRID.top, bottom: GRID.bottom };

function EpisodePicker({ selected, onSelect }: { selected: number; onSelect: (episode: number) => void }) {
  return <>
    <div className="vbrl-epsilon__cursor" style={{ left: position(selected) + '%' }} aria-hidden="true" />
    <Button className="vbrl-epsilon__episode-picker" role="slider" aria-label="选择查看的训练回合" aria-valuemin={1} aria-valuemax={SCHEDULE_EPISODES}
      aria-valuenow={selected} aria-valuetext={'第 ' + selected + ' 回合'} onClick={event => {
        if (!event.detail) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        onSelect(Math.max(1, Math.min(SCHEDULE_EPISODES, Math.round((event.clientX - bounds.left) / bounds.width * (SCHEDULE_EPISODES - 1)) + 1)));
      }} onKeyDown={event => {
        const key = event.key;
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
        event.preventDefault(); event.stopPropagation();
        onSelect(key === 'Home' ? 1 : key === 'End' ? SCHEDULE_EPISODES : Math.max(1, Math.min(SCHEDULE_EPISODES, selected + (key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1))));
      }} />
  </>;
}

export function ScheduleCurve({ schedule, ghost, selected, disabled, onChange, onSelect }: {
  schedule: EpsilonSchedule; ghost?: EpsilonSchedule; selected: number; disabled: boolean;
  onChange: (schedule: EpsilonSchedule) => void; onSelect: (episode: number) => void;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const drag = useRef<'start' | 'end' | null>(null);
  const points = (value: EpsilonSchedule) => [[1, 1], [value.start, 1], [value.end, EPSILON_FLOOR], [SCHEDULE_EPISODES, EPSILON_FLOOR]]
    .map(([episode, epsilon]) => `${position(episode) * 10},${(1 - epsilon) * 1000}`).join(' ');
  function change(point: 'start' | 'end', episode: number) {
    onChange(normalizeSchedule(point === 'start' ? { ...schedule, start: Math.max(1, Math.min(schedule.end - 1, episode)) }
      : { ...schedule, end: Math.max(schedule.start + 1, Math.min(SCHEDULE_EPISODES, episode)) }));
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current || disabled || !plotRef.current) return;
    const bounds = plotRef.current.getBoundingClientRect();
    change(drag.current, Math.round((event.clientX - bounds.left) / bounds.width * (SCHEDULE_EPISODES - 1)) + 1);
  }
  return <div className="vbrl-epsilon__chart vbrl-epsilon__curve" aria-label="可直接拖动转折点的探索率曲线">
    <EChartsChart option={epsilonAxes} minHeight={185} style={{ height: 185 }} aria-label="探索率百分比与训练回合坐标轴" />
    <div className="vbrl-epsilon__plot" ref={plotRef} style={plotStyle}>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        {ghost && <polyline className="is-ghost" points={points(ghost)} />}
        <polyline points={points(schedule)} />
      </svg>
      <EpisodePicker selected={selected} onSelect={onSelect} />
      {(['start', 'end'] as const).map(point => <Button key={point} className="vbrl-epsilon__handle" role="slider" disabled={disabled}
        aria-label={point === 'start' ? '开始衰减的回合' : '达到最低探索率的回合'} aria-valuenow={schedule[point]}
        aria-valuemin={point === 'start' ? 1 : schedule.start + 1} aria-valuemax={point === 'start' ? schedule.end - 1 : SCHEDULE_EPISODES}
        aria-valuetext={'第 ' + schedule[point] + ' 回合，探索率 ' + (point === 'start' ? '100%' : '5%')}
        style={{ left: position(schedule[point]) + '%', top: point === 'start' ? '0%' : '95%' }}
        onPointerDown={event => { drag.current = point; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={move}
        onPointerUp={event => { move(event); drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { drag.current = null; }} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          const next = event.key === 'Home' ? point === 'start' ? 1 : schedule.start + 1
            : event.key === 'End' ? point === 'start' ? schedule.end - 1 : SCHEDULE_EPISODES
              : schedule[point] + (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1);
          change(point, next);
        }} />)}
    </div>
  </div>;
}

export function ReturnCurve({ run, previous, selected, onSelect, stale = false }: { run: ScheduleRun; previous: ScheduleRun | null; selected: number; onSelect: (episode: number) => void; stale?: boolean }) {
  const option = useMemo(() => {
    const series = [
      { name: '训练中', data: rollingReturns(run, 'training'), color: stale ? '#a7b2c2' : '#f07e47' },
      { name: '关探索', data: rollingReturns(run, 'greedy'), color: stale ? '#91b3a3' : '#228d5c' },
      ...(previous ? [{ name: '上次训练', data: rollingReturns(previous, 'training'), color: '#a7b2c2' }] : []),
    ];
    const min = Math.min(-20, Math.floor(Math.min(...series.flatMap(item => item.data)) / 20) * 20);
    return { ...chartBase, yAxis: { type: 'value', min, max: 10, axisLabel: { fontSize: 18 }, splitLine: { lineStyle: { color: '#e4eaf2' } } },
      series: series.map(item => ({ name: item.name, type: 'line', data: item.data.map((value, index) => [index + 1, value]), showSymbol: false,
        lineStyle: { color: item.color, width: item.name === '上次训练' ? 2 : 3, type: item.name === '上次训练' ? 'dashed' : 'solid' } })) };
  }, [run, previous, stale]);
  return <div className="vbrl-epsilon__chart vbrl-epsilon__return">
    <EChartsChart option={option} minHeight={165} style={{ height: 165 }} aria-label="最近十五回合平均回报，点击选择回合" />
    <div className="vbrl-epsilon__plot" style={plotStyle}><EpisodePicker selected={selected} onSelect={onSelect} /></div>
  </div>;
}

export function CurveLegend({ previous, stale = false }: { previous: boolean; stale?: boolean }) {
  return <div className="vbrl-epsilon__legend">{[[stale ? '上次训练' : '训练中', stale ? 'previous' : 'training'], [stale ? '上次验证' : '关探索', stale ? 'stale-greedy' : 'greedy'], ...(previous ? [['上次训练', 'previous']] : [])].map(([label, id]) =>
    <Typography key={id} variant="bodySmall" tone="muted"><i className={'is-' + id} aria-hidden="true" />{label}</Typography>)}</div>;
}
