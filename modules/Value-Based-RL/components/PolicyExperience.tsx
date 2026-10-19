import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../shared/react';
import { WarehouseMap } from './WarehouseMap';
import { Formula } from './LessonPrimitives';
import { GOAL, START, keyOf, returnOf, ACTIONS } from '../model';
import robotArt from '../assets/cover-v2/robot.png';
import emptyStationArt from '../assets/cover-v2/receiving-station-empty.png';
import loadedStationArt from '../assets/cover-v2/receiving-station-loaded.png';
import pitArt from '../assets/cover-v2/maintenance-pit.png';
import { TRAP } from '../pages/QLearningLoopPage/qLearningSimulation';
import { EVALUATION_GAMMA, experienceMean, type DeliveryExperience } from './policyEvaluation';
import './PolicyExperience.css';

export const displayReturn = (value: number) => (value > 0 ? '+' : '') + value.toFixed(2);

export function ExperienceMap({ experience, cursor, firstStep = false }: { experience: DeliveryExperience | null; cursor: number; firstStep?: boolean }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 320, height: 290 });
  useLayoutEffect(() => {
    if (!overlayRef.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(overlayRef.current); return () => observer.disconnect();
  }, []);
  const robot = experience?.positions[cursor] ?? START;
  const points = experience?.positions.slice(0, cursor + 1) ?? [START];
  const center = (position: { row: number; col: number }) => {
    const width = (size.width - 48) / 7, height = (size.height - 48) / 7;
    return `${position.col * (width + 8) + width / 2},${position.row * (height + 8) + height / 2}`;
  };
  const complete = experience && cursor === experience.actions.length;
  return <div className="vbrl-experience-map-column">
    <WarehouseMap className="vbrl-experience-map" coordinates robot={robot} selected={START}
      markers={{ [keyOf(TRAP)]: '!' }} dangerArt={pitArt} goalArt={complete && experience.delivered ? loadedStationArt : emptyStationArt}
      overlay={<div className="vbrl-experience-map__overlay" ref={overlayRef}>
      <svg viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
        {points.length > 1 && <polyline points={(firstStep ? points.slice(1) : points).map(center).join(' ')} stroke="var(--ui-success)" />}
        {firstStep && points.length > 1 && <polyline data-first-step="true" points={points.slice(0, 2).map(center).join(' ')} stroke="var(--ui-accent-alt)" />}
      </svg>
      <div className={'vbrl-experience-map__robot' + (keyOf(robot) === keyOf(GOAL) ? ' is-arrived' : '') + (keyOf(robot) === keyOf(TRAP) ? ' is-trapped' : '')}
        style={{ '--experience-row': robot.row, '--experience-col': robot.col } as CSSProperties}><img src={robotArt} alt="执行当前策略的机器人" /></div>
    </div>} />
    <div className="vbrl-experience-readout" aria-live="polite">
      <Typography variant="bodySmall" tone={cursor && experience?.collisions[cursor - 1] ? 'danger' : 'accent'}>
        {experience && cursor ? `${cursor} 步 · ${ACTIONS[experience.actions[cursor - 1]]} · 奖励 ${displayReturn(experience.rewards[cursor - 1])}` : '同一起点，等待出发'}
      </Typography>
      <Typography variant="bodySmall" tone={complete ? experience.delivered ? 'success' : experience.trapped ? 'danger' : 'warning' : 'muted'}>
        {experience ? `${complete ? experience.delivered ? '已送达' : experience.trapped ? '进入维修坑' : '80 步截断' : '进行中'} · ${complete ? '本次回报' : '已累计分数'} ${displayReturn(returnOf(experience.rewards.slice(0, cursor), EVALUATION_GAMMA))}` : '经历结束后，加入一个样本'}
      </Typography>
    </div>
  </div>;
}

export function ReturnDistribution({ samples, active, onSelect, disabled = false }: { samples: readonly DeliveryExperience[]; active: DeliveryExperience | null; onSelect: (sample: DeliveryExperience) => void; disabled?: boolean }) {
  const mean = experienceMean(samples), recent = samples.slice(-6);
  const dots: { sample: DeliveryExperience; level: number }[] = [];
  for (const sample of recent) {
    let level = 0;
    while (dots.some(dot => dot.level === level && Math.abs(dot.sample.value - sample.value) < 3)) level++;
    dots.push({ sample, level });
  }
  const coordinate = (value: number) => (value + 30) / 40 * 100;
  return <div className="vbrl-experience-distribution">
    <Typography variant="bodySmall" tone="accent">{samples.length > 6 ? '最近 6 次 · 均值用全部样本' : samples.length ? '新样本 ' + displayReturn(samples.at(-1)!.value) + ' · 点选回放' : '回报样本 · 点击圆点回放'}</Typography>
    <div className="vbrl-experience-plot" role="group" aria-label="实际经历的回报分布">
      {mean === undefined ? <Typography variant="bodySmall" tone="muted" align="center">等待第一个样本</Typography>
        : <span className="vbrl-experience-mean-line" style={{ left: `${coordinate(mean)}%` }} aria-hidden="true" />}
      {dots.map(({ sample, level }) => <Button key={sample.index} className={'vbrl-experience-dot' + (active === sample ? ' is-selected' : '')}
        style={{ left: `${coordinate(sample.value)}%`, bottom: `${8 + level * 18}px` }} aria-label={`样本 ${sample.index + 1}，回报 ${displayReturn(sample.value)}，点击回放`}
        aria-pressed={active === sample} disabled={disabled} onClick={() => onSelect(sample)} />)}
    </div>
    <div className="vbrl-experience-axis">{[-30, -15, 0, 10].map(value => <Typography as="span" key={value} variant="bodySmall" tone="muted" style={{ left: `${coordinate(value)}%` }}>{value}</Typography>)}</div>
  </div>;
}

export function ExperienceEstimate({ samples, symbol }: { samples: readonly DeliveryExperience[]; symbol: string }) {
  const mean = experienceMean(samples);
  return <div className="vbrl-experience-estimate" data-count={samples.length} data-mean={mean}>
    <Typography variant="bodySmall" tone="accent">{samples.length} 个样本的均值</Typography>
    <Formula latex={`${symbol}=${mean === undefined ? '?' : mean.toFixed(2)}`} />
  </div>;
}
