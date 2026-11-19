import { valueBasedRlAssetUrl } from '../assetUrls';
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { BLOCKED, GOAL, GRID, START, keyOf, type Position } from '../model';
import './WarehouseMap.css';

const robotArt = valueBasedRlAssetUrl("cover-v2/robot.webp");
const targetArt = valueBasedRlAssetUrl('delivery-target.svg');

export interface MapTrail { points: readonly Position[]; color?: string; dashed?: boolean; }
export function WarehouseMap({ robot = START, goal = GOAL, blocked = BLOCKED, trails = [], selected, onSelect, values, caption, markers = {}, className = '', policy, update, overlay, coordinates = false, goalArt = targetArt, dangerArt, showValueLabels = true }: {
  robot?: Position; goal?: Position; blocked?: readonly string[]; trails?: readonly MapTrail[]; selected?: Position;
  onSelect?: (position: Position) => void; values?: Record<string, number>; caption?: string; markers?: Record<string, string | undefined>; className?: string;
  policy?: Record<string, readonly number[]>; update?: { position: Position; action: number };
  overlay?: ReactNode;
  coordinates?: boolean;
  goalArt?: string;
  dangerArt?: string;
  showValueLabels?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const axisPosition = selected ?? robot;
  const boardRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState({ width: 700, height: 700 });
  useLayoutEffect(() => {
    if (!boardRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBoard(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(boardRef.current); return () => observer.disconnect();
  }, []);
  const center = (p: Position) => {
    const width = (board.width - 48) / GRID, height = (board.height - 48) / GRID;
    return `${p.col * (width + 8) + width / 2},${p.row * (height + 8) + height / 2}`;
  };
  return <figure shuku-edit-id="e-405cd06a-08f4-4637-8bdf-a368bbd06787" className={`vbrl-map${coordinates ? ' has-coordinates' : ''} ${className}`}>
    <div shuku-edit-id="e-bf4c4591-1bd0-4939-bb77-39e8e00ad8fd" className="vbrl-map__frame">
      {coordinates && <>
        <div shuku-edit-id="e-2018fd9d-8fce-402d-8f48-29b3d6eda46e" className="vbrl-map__column-labels" aria-label="列号">{Array.from({ length: GRID }, (_, index) => <Typography shuku-edit-id="e-f115562f-c33e-42fb-989a-a2fbcbb1bc5d" key={index} as="span" variant="bodySmall"
          className={'vbrl-map__axis-label' + (index === axisPosition.col ? ' is-active' : '')} tone={index === axisPosition.col ? 'accent' : 'muted'}
          aria-current={index === axisPosition.col ? 'true' : undefined}>{index + 1}</Typography>)}</div>
        <div shuku-edit-id="e-d9ecc60d-abf0-43a7-9847-13b1a063e54b" className="vbrl-map__row-labels" aria-label="行号">{Array.from({ length: GRID }, (_, index) => <Typography shuku-edit-id="e-bf54d774-1ccd-49c0-b202-6f3967582dd9" key={index} as="span" variant="bodySmall"
          className={'vbrl-map__axis-label' + (index === axisPosition.row ? ' is-active' : '')} tone={index === axisPosition.row ? 'accent' : 'muted'}
          aria-current={index === axisPosition.row ? 'true' : undefined}>{index + 1}</Typography>)}</div>
      </>}
      <div shuku-edit-id="e-e4bf2e84-709c-45a3-8f75-356ed8aabcfa" className="vbrl-map__board" ref={boardRef} role="group" aria-label="统一的七乘七仓库地图">
      {Array.from({ length: GRID * GRID }, (_, i) => {
        const p = { row: Math.floor(i / GRID), col: i % GRID }; const key = keyOf(p);
        const wall = blocked.includes(key); const isGoal = key === keyOf(goal); const isRobot = key === keyOf(robot);
        const active = selected && key === keyOf(selected); const value = values?.[key];
        const directions = policy?.[key];
        const updated = update && key === keyOf(update.position);
        const art = <>{markers[key] === '!' ? dangerArt ? <img shuku-edit-id="e-70e0538c-3fc2-4f7c-86dd-1b9d3896cace" className="vbrl-map__marker vbrl-map__marker-art" src={dangerArt} alt="危险格" /> : <svg shuku-edit-id="e-8ca731e9-d69a-49f2-a90f-1b554144d0ca" className="vbrl-map__marker vbrl-map__marker-icon" viewBox="0 0 24 24" role="img" aria-label="危险格"><path shuku-edit-id="e-bc85c93b-dc7c-4514-ac94-0be8f9ed3d0f" d="M12 4V14M12 19V19.1" /></svg>
          : markers[key] && <Typography shuku-edit-id="e-d20bb57d-79cf-4071-900f-158e71c0623f" className="vbrl-map__marker" variant="bodySmall" tone="danger">{markers[key]}</Typography>}{isGoal && <img shuku-edit-id="e-76558198-0a8f-4c6f-b02f-e20ef3ad3c07" src={goalArt} alt="目的地" />}{isRobot && <img shuku-edit-id="e-badde87c-c89f-4f5e-8fe8-25c0a8fa3207" src={robotArt} alt="机器人" />}{showValueLabels && value !== undefined && !wall && !isRobot && !isGoal && <Typography shuku-edit-id="e-8d2d243f-bb92-440c-ac66-3c1f00f5f2ad" className={policy ? 'vbrl-map__q-value' : undefined} variant="bodySmall" tone="accent" wrap={policy ? 'nowrap' : undefined}>{value.toFixed(1)}</Typography>}
          {directions && !wall && !isGoal && !markers[key] && <svg shuku-edit-id="e-d6f410a1-4489-41ee-9156-bebd58808ef1" className={`vbrl-map__policy${directions.length > 1 ? ' is-tied' : ''}`} viewBox="0 0 100 100" aria-hidden="true">{directions.map(action => <path shuku-edit-id="e-10dd77a0-11b2-4064-a1b3-9b6d29fde10b" key={action} data-policy-action={action} d="M50 68V43M41 52L50 43L59 52" transform={`rotate(${action * 90} 50 64)`} />)}</svg>}
          {updated && <svg shuku-edit-id="e-fb960370-9977-45d9-8ad2-550aa6190787" className="vbrl-map__update-arrow" viewBox="0 0 100 100" aria-hidden="true"><path shuku-edit-id="e-8513fac9-79ba-4493-b889-814e6f70c320" d="M50 68V35M39 46L50 35L61 46" transform={`rotate(${update.action * 90} 50 64)`} /></svg>}
        </>;
        const cellClass = `vbrl-map__cell${wall ? ' is-wall' : ''}${isGoal ? ' is-goal' : ''}${active ? ' is-selected' : ''}${directions ? ' has-policy' : ''}${updated ? ' is-updated' : ''}`;
        const style = value === undefined || wall || isGoal ? undefined : {
          '--vbrl-value-alpha': Math.min(0.68, Math.abs(value) / 10 * 0.68),
          '--vbrl-value-color': value >= 0 ? 'var(--ui-success)' : 'var(--ui-danger)',
        } as CSSProperties;
        return onSelect && !wall ? <Button key={key} data-cell={key} data-value={value} className={cellClass} style={style} onClick={() => onSelect(p)} aria-label={`选择第${p.row + 1}行第${p.col + 1}列`} aria-pressed={Boolean(active)} active={Boolean(active)}>{art}</Button> : <div shuku-edit-id="e-dfa105f2-8413-47d8-8798-2dcc587a4e20" key={key} data-cell={key} data-value={value} className={cellClass} style={style}>{art}</div>;
      })}
      <svg shuku-edit-id="e-e083cfa0-5f92-47ac-9afc-ccad85832246" className="vbrl-map__trails" viewBox={`0 0 ${board.width} ${board.height}`} aria-hidden="true"><defs shuku-edit-id="e-35d8f970-fa3f-4850-a384-1c2edbdbc6f6">{trails.map((t, i) => <marker shuku-edit-id="e-6d40ef8d-d836-4897-a62b-aa0ef845a9bf" key={i} id={`${id}-${i}`} markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto"><path shuku-edit-id="e-1ae43173-70b2-4369-9dc0-c651ad8daf8b" d="M0,0 L4,2 L0,4 Z" fill={t.color ?? 'var(--ui-accent)'} /></marker>)}</defs>{trails.map((t, i) => t.points.length > 1 ? <polyline shuku-edit-id="e-c13efa84-94ca-4cea-bc4b-80cc3f3c6343" key={i} points={t.points.map(center).join(' ')} fill="none" stroke={t.color ?? 'var(--ui-accent)'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={t.dashed ? '6 6' : undefined} markerEnd={`url(#${id}-${i})`} /> : null)}</svg>
      {overlay}
    </div></div>
    {caption && <Typography shuku-edit-id="e-459a24b6-86ef-4374-8326-ddac2337f7fa" as="figcaption" variant="bodySmall" tone="muted" align="center">{caption}</Typography>}
  </figure>;
}
