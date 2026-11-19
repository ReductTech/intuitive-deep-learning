import { valueBasedRlAssetUrl } from '../assetUrls';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { WarehouseMap } from './WarehouseMap';
import { Formula } from './LessonPrimitives';
import { GOAL, START, keyOf, returnOf, ACTIONS } from '../model';
import { TRAP } from '../pages/QLearningLoopPage/qLearningSimulation';
import { EVALUATION_GAMMA, experienceMean, type DeliveryExperience } from './policyEvaluation';
import './PolicyExperience.css';

const robotArt = valueBasedRlAssetUrl("cover-v2/robot.webp");
const emptyStationArt = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const loadedStationArt = valueBasedRlAssetUrl("cover-v2/receiving-station-loaded.webp");
const pitArt = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");

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
  return <div shuku-edit-id="e-105be87d-8202-4df6-b5a3-9466ff76a59e" className="vbrl-experience-map-column">
    <WarehouseMap className="vbrl-experience-map" coordinates robot={robot} selected={START}
      markers={{ [keyOf(TRAP)]: '!' }} dangerArt={pitArt} goalArt={complete && experience.delivered ? loadedStationArt : emptyStationArt}
      overlay={<div shuku-edit-id="e-a6e3fe3d-ad8b-4dfa-bd71-eccd731d3b1c" className="vbrl-experience-map__overlay" ref={overlayRef}>
      <svg shuku-edit-id="e-63b7b4b4-fdf3-46ed-81b5-3296e64448ee" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
        {points.length > 1 && <polyline shuku-edit-id="e-95efba0b-5427-4d1f-a369-36e2dfb0ba0d" points={(firstStep ? points.slice(1) : points).map(center).join(' ')} stroke="var(--ui-success)" />}
        {firstStep && points.length > 1 && <polyline shuku-edit-id="e-c59679d9-d7e0-422a-8076-8c617abfe583" data-first-step="true" points={points.slice(0, 2).map(center).join(' ')} stroke="var(--ui-accent-alt)" />}
      </svg>
      <div shuku-edit-id="e-9cbc9078-d2d6-4839-b267-4c25b01474fe" className={'vbrl-experience-map__robot' + (keyOf(robot) === keyOf(GOAL) ? ' is-arrived' : '') + (keyOf(robot) === keyOf(TRAP) ? ' is-trapped' : '')}
        style={{ '--experience-row': robot.row, '--experience-col': robot.col } as CSSProperties}><img shuku-edit-id="e-0633dd6e-1697-43c2-8938-bb5c3da71570" src={robotArt} alt="执行当前策略的机器人" /></div>
    </div>} />
    <div shuku-edit-id="e-f0e38e97-e357-4fe7-a52a-962ddd21df81" className="vbrl-experience-readout" aria-live="polite">
      <Typography shuku-edit-id="e-dab4f7da-03d4-4611-a57b-458de1d9b6ab" variant="bodySmall" tone={cursor && experience?.collisions[cursor - 1] ? 'danger' : 'accent'}>
        {experience && cursor ? `${cursor} 步 · ${ACTIONS[experience.actions[cursor - 1]]} · 奖励 ${displayReturn(experience.rewards[cursor - 1])}` : '同一起点，等待出发'}
      </Typography>
      <Typography shuku-edit-id="e-f9e9a362-2ac6-4e2d-bf55-8e151cf82fd7" variant="bodySmall" tone={complete ? experience.delivered ? 'success' : experience.trapped ? 'danger' : 'warning' : 'muted'}>
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
  return <div shuku-edit-id="e-31d1a67f-ad91-4887-810e-1a16c5912d5a" className="vbrl-experience-distribution">
    <Typography shuku-edit-id="e-df8d654f-aeeb-4bcb-8b09-ecb8d28f4f1c" variant="bodySmall" tone="accent">{samples.length > 6 ? '最近 6 次 · 均值用全部样本' : samples.length ? '新样本 ' + displayReturn(samples.at(-1)!.value) + ' · 点选回放' : '回报样本 · 点击圆点回放'}</Typography>
    <div shuku-edit-id="e-cf46d13e-dea0-43d6-9b6b-4c0c046ece44" className="vbrl-experience-plot" role="group" aria-label="实际经历的回报分布">
      {mean === undefined ? <Typography shuku-edit-id="e-5d8b829e-359b-496d-9763-dd2655385731" variant="bodySmall" tone="muted" align="center">等待第一个样本</Typography>
        : <span shuku-edit-id="e-d7dd8602-a3c2-4937-bb73-38b12c1e8518" className="vbrl-experience-mean-line" style={{ left: `${coordinate(mean)}%` }} aria-hidden="true" />}
      {dots.map(({ sample, level }) => <Button key={sample.index} className={'vbrl-experience-dot' + (active === sample ? ' is-selected' : '')}
        style={{ left: `${coordinate(sample.value)}%`, bottom: `${8 + level * 18}px` }} aria-label={`样本 ${sample.index + 1}，回报 ${displayReturn(sample.value)}，点击回放`}
        aria-pressed={active === sample} disabled={disabled} onClick={() => onSelect(sample)} />)}
    </div>
    <div shuku-edit-id="e-597313e5-2755-4f06-b8ba-6d6cc9258910" className="vbrl-experience-axis">{[-30, -15, 0, 10].map(value => <Typography shuku-edit-id="e-9f0f85ef-db9b-481d-b5ab-cccd68498dec" as="span" key={value} variant="bodySmall" tone="muted" style={{ left: `${coordinate(value)}%` }}>{value}</Typography>)}</div>
  </div>;
}

export function ExperienceEstimate({ samples, symbol }: { samples: readonly DeliveryExperience[]; symbol: string }) {
  const mean = experienceMean(samples);
  return <div shuku-edit-id="e-b46dd2cb-9982-4ee2-9cb6-c2f5b4b3281e" className="vbrl-experience-estimate" data-count={samples.length} data-mean={mean}>
    <Typography shuku-edit-id="e-f1bec568-a1bb-444d-83bd-1a2b3db7f9d1" variant="bodySmall" tone="accent">{samples.length} 个样本的均值</Typography>
    <Formula latex={`${symbol}=${mean === undefined ? '?' : mean.toFixed(2)}`} />
  </div>;
}
