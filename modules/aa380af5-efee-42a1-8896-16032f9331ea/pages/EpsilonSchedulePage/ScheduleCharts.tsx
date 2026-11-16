import { useMemo, useRef, type CSSProperties, type PointerEvent } from 'react';
import { Button, EChartsChart, Typography } from "@shuku/course-style/react";
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
    <div shuku-edit-id="e-4707dc97-b58a-4379-b52d-a68e89c0fc14" className="vbrl-epsilon__cursor" style={{ left: position(selected) + '%' }} aria-hidden="true" />
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
  return <div shuku-edit-id="e-c9e39334-db8f-48a7-a325-119178ad6c73" className="vbrl-epsilon__chart vbrl-epsilon__curve" aria-label="可直接拖动转折点的探索率曲线">
    <EChartsChart option={epsilonAxes} minHeight={185} style={{ height: 185 }} aria-label="探索率百分比与训练回合坐标轴" />
    <div shuku-edit-id="e-c148b178-af08-415f-b9bd-8184fd36d801" className="vbrl-epsilon__plot" ref={plotRef} style={plotStyle}>
      <svg shuku-edit-id="e-442ce43d-15ee-4ca6-aba2-e4de931b871e" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        {ghost && <polyline shuku-edit-id="e-8f51ed04-cf40-42da-9ef8-7da3b98fb56e" className="is-ghost" points={points(ghost)} />}
        <polyline shuku-edit-id="e-9e04a9d1-ab0a-4aa8-8cf9-22a7e0eda12c" points={points(schedule)} />
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
  return <div shuku-edit-id="e-4007333c-0da8-45e7-83e0-7e8f82e75d0b" className="vbrl-epsilon__chart vbrl-epsilon__return">
    <EChartsChart option={option} minHeight={165} style={{ height: 165 }} aria-label="最近十五回合平均回报，点击选择回合" />
    <div shuku-edit-id="e-9f8135fb-9d90-4f44-b090-4882c392526c" className="vbrl-epsilon__plot" style={plotStyle}><EpisodePicker selected={selected} onSelect={onSelect} /></div>
  </div>;
}

export function CurveLegend({ previous, stale = false }: { previous: boolean; stale?: boolean }) {
  return <div shuku-edit-id="e-1d67253e-9bb2-425c-9648-d05a5bfbd4ce" className="vbrl-epsilon__legend">{[[stale ? '上次训练' : '训练中', stale ? 'previous' : 'training'], [stale ? '上次验证' : '关探索', stale ? 'stale-greedy' : 'greedy'], ...(previous ? [['上次训练', 'previous']] : [])].map(([label, id]) =>
    <Typography shuku-edit-id="e-793ac3e2-66cc-466e-a6c7-a780fcfd9f6d" key={id} variant="bodySmall" tone="muted"><i shuku-edit-id="e-04cd4d34-4280-4bb5-a93e-4dd67bc1e051" className={'is-' + id} aria-hidden="true" />{label}</Typography>)}</div>;
}
