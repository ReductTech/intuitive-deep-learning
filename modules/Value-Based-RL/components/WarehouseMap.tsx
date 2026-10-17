import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Typography } from '../../shared/react';
import robotArt from '../assets/cover-v2/robot.png';
import targetArt from '../assets/delivery-target.svg';
import { BLOCKED, GOAL, GRID, START, keyOf, type Position } from '../model';
import './WarehouseMap.css';

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
  return <figure className={`vbrl-map${coordinates ? ' has-coordinates' : ''} ${className}`}>
    <div className="vbrl-map__frame">
      {coordinates && <>
        <div className="vbrl-map__column-labels" aria-label="列号">{Array.from({ length: GRID }, (_, index) => <Typography key={index} as="span" variant="bodySmall"
          className={'vbrl-map__axis-label' + (index === axisPosition.col ? ' is-active' : '')} tone={index === axisPosition.col ? 'accent' : 'muted'}
          aria-current={index === axisPosition.col ? 'true' : undefined}>{index + 1}</Typography>)}</div>
        <div className="vbrl-map__row-labels" aria-label="行号">{Array.from({ length: GRID }, (_, index) => <Typography key={index} as="span" variant="bodySmall"
          className={'vbrl-map__axis-label' + (index === axisPosition.row ? ' is-active' : '')} tone={index === axisPosition.row ? 'accent' : 'muted'}
          aria-current={index === axisPosition.row ? 'true' : undefined}>{index + 1}</Typography>)}</div>
      </>}
      <div className="vbrl-map__board" ref={boardRef} role="group" aria-label="统一的七乘七仓库地图">
      {Array.from({ length: GRID * GRID }, (_, i) => {
        const p = { row: Math.floor(i / GRID), col: i % GRID }; const key = keyOf(p);
        const wall = blocked.includes(key); const isGoal = key === keyOf(goal); const isRobot = key === keyOf(robot);
        const active = selected && key === keyOf(selected); const value = values?.[key];
        const directions = policy?.[key];
        const updated = update && key === keyOf(update.position);
        const art = <>{markers[key] === '!' ? dangerArt ? <img className="vbrl-map__marker vbrl-map__marker-art" src={dangerArt} alt="危险格" /> : <svg className="vbrl-map__marker vbrl-map__marker-icon" viewBox="0 0 24 24" role="img" aria-label="危险格"><path d="M12 4V14M12 19V19.1" /></svg>
          : markers[key] && <Typography className="vbrl-map__marker" variant="bodySmall" tone="danger">{markers[key]}</Typography>}{isGoal && <img src={goalArt} alt="目的地" />}{isRobot && <img src={robotArt} alt="机器人" />}{showValueLabels && value !== undefined && !wall && !isRobot && !isGoal && <Typography className={policy ? 'vbrl-map__q-value' : undefined} variant="bodySmall" tone="accent" wrap={policy ? 'nowrap' : undefined}>{value.toFixed(1)}</Typography>}
          {directions && !wall && !isGoal && !markers[key] && <svg className={`vbrl-map__policy${directions.length > 1 ? ' is-tied' : ''}`} viewBox="0 0 100 100" aria-hidden="true">{directions.map(action => <path key={action} data-policy-action={action} d="M50 68V43M41 52L50 43L59 52" transform={`rotate(${action * 90} 50 64)`} />)}</svg>}
          {updated && <svg className="vbrl-map__update-arrow" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 68V35M39 46L50 35L61 46" transform={`rotate(${update.action * 90} 50 64)`} /></svg>}
        </>;
        const cellClass = `vbrl-map__cell${wall ? ' is-wall' : ''}${isGoal ? ' is-goal' : ''}${active ? ' is-selected' : ''}${directions ? ' has-policy' : ''}${updated ? ' is-updated' : ''}`;
        const style = value === undefined || wall || isGoal ? undefined : {
          '--vbrl-value-alpha': Math.min(0.68, Math.abs(value) / 10 * 0.68),
          '--vbrl-value-color': value >= 0 ? 'var(--ui-success)' : 'var(--ui-danger)',
        } as CSSProperties;
        return onSelect && !wall ? <Button key={key} data-cell={key} data-value={value} className={cellClass} style={style} onClick={() => onSelect(p)} aria-label={`选择第${p.row + 1}行第${p.col + 1}列`} aria-pressed={Boolean(active)} active={Boolean(active)}>{art}</Button> : <div key={key} data-cell={key} data-value={value} className={cellClass} style={style}>{art}</div>;
      })}
      <svg className="vbrl-map__trails" viewBox={`0 0 ${board.width} ${board.height}`} aria-hidden="true"><defs>{trails.map((t, i) => <marker key={i} id={`${id}-${i}`} markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill={t.color ?? 'var(--ui-accent)'} /></marker>)}</defs>{trails.map((t, i) => t.points.length > 1 ? <polyline key={i} points={t.points.map(center).join(' ')} fill="none" stroke={t.color ?? 'var(--ui-accent)'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={t.dashed ? '6 6' : undefined} markerEnd={`url(#${id}-${i})`} /> : null)}</svg>
      {overlay}
    </div></div>
    {caption && <Typography as="figcaption" variant="bodySmall" tone="muted" align="center">{caption}</Typography>}
  </figure>;
}
