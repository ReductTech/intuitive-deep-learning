import { useId, useRef, type KeyboardEvent } from 'react';
import { Typography } from '../../shared/react';
import './AttentionHeatmap.css';

export interface AttentionHeatmapProps {
  compact?: boolean;
  matrix: readonly (readonly number[])[];
  selectedRow: number;
  onSelectRow?: (row: number) => void;
  rowLabels?: readonly string[];
  columnLabels?: readonly string[];
  maxValue?: number;
  label: string;
  showValues?: boolean;
  rowAxisLabel?: string;
  columnAxisLabel?: string;
}

export interface WeightStripProps {
  compact?: boolean;
  weights: readonly number[];
  positions?: readonly number[];
  label: string;
  maxValue?: number;
}

const HEATMAP = { x: 134, y: 76, width: 756, height: 288 };
const STRIP = { x: 98, y: 52, width: 858, height: 270 };
const validWeight = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const scaleLimit = (value: number, fallback: number) => Number.isFinite(value) && value > 0 ? value : fallback;
const scaleText = (value: number) => Number(value.toPrecision(3)).toString().replace('-', '−');

function sparseIndices(count: number, maximum = 7): number[] {
  if (count <= maximum) return Array.from({ length: count }, (_, index) => index);
  return Array.from({ length: maximum }, (_, index) => Math.round(index * (count - 1) / (maximum - 1)));
}

function nextHeatmapRow(key: string, current: number, count: number): number | null {
  if (key === 'ArrowUp') return Math.max(0, current - 1);
  if (key === 'ArrowDown') return Math.min(count - 1, current + 1);
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'Enter' || key === ' ') return current;
  return null;
}

function hiddenPreview(node: Element): boolean {
  return Boolean(node.closest('[aria-hidden="true"], [inert]'));
}

function EmptyGraphic({ label, message, className }: { label: string; message: string; className: string }) {
  return <svg className={className} viewBox="0 0 1000 440" role="img" aria-label={`${label}：${message}`}>
    <foreignObject x="150" y="180" width="700" height="70"><Typography as="div" variant="bodySmall" tone="muted" align="center">{message}</Typography></foreignObject>
  </svg>;
}

export function AttentionHeatmap({ matrix, selectedRow, onSelectRow, rowLabels, columnLabels, maxValue = 0.12, label, showValues = false, compact = false, rowAxisLabel = 'Query', columnAxisLabel = 'Key' }: AttentionHeatmapProps) {
  const gradientId = `attn-heatmap-${useId().replace(/:/g, '')}`;
  const rows = useRef<(SVGGElement | null)[]>([]);
  const rowCount = matrix.length;
  const columnCount = matrix[0]?.length ?? 0;
  if (!rowCount || !columnCount) return <EmptyGraphic className="attn-heatmap" label={label} message="暂无权重" />;
  if (!matrix.every(row => row.length === columnCount && row.every(validWeight))) {
    return <EmptyGraphic className="attn-heatmap" label={label} message="权重矩阵不可用" />;
  }
  const limit = scaleLimit(maxValue, 0.12);
  const plot = compact ? { ...HEATMAP, y: 54, height: 180 } : HEATMAP;
  const cellWidth = plot.width / columnCount;
  const cellHeight = plot.height / rowCount;
  const focusRow = Number.isInteger(selectedRow) && selectedRow >= 0 && selectedRow < rowCount ? selectedRow : 0;
  const visibleRowLabels = sparseIndices(rowCount, compact ? 5 : 7);
  const visibleColumnLabels = sparseIndices(columnCount);
  const displayValues = showValues && rowCount <= 6 && cellWidth >= 82 && cellHeight >= 42;
  const rowName = (row: number) => rowLabels?.[row] ?? `Q${row + 1}`;
  const columnName = (column: number) => columnLabels?.[column] ?? `K${column + 1}`;
  const selectRow = (row: number, node: SVGGElement) => {
    if (!onSelectRow || hiddenPreview(node)) return;
    if (row !== selectedRow) onSelectRow(row);
    rows.current[row]?.focus();
  };
  const handleKey = (event: KeyboardEvent<SVGGElement>, row: number) => {
    const next = nextHeatmapRow(event.key, row, rowCount);
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    selectRow(next, event.currentTarget);
  };
  return (
    <svg className="attn-heatmap" viewBox={`0 0 1000 ${compact ? 300 : 440}`} role={onSelectRow ? 'group' : 'img'} aria-label={label}>
      <defs><linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="var(--ui-bg-card, white)" /><stop offset="100%" stopColor="var(--attn-activation, #7c57a6)" /></linearGradient></defs>
      <foreignObject x="2" y={compact ? 3 : 16} width="122" height="42"><Typography as="div" variant="bodySmall" tone="muted" align="end">{rowAxisLabel}</Typography></foreignObject>
      {visibleColumnLabels.map(column => <foreignObject key={column} x={plot.x + (column + 0.5) * cellWidth - 55} y={compact ? 3 : 22} width="110" height="42"><Typography as="div" variant="bodySmall" tone="muted" align="center" title={columnName(column)}>{columnName(column)}</Typography></foreignObject>)}
      <rect x={plot.x} y={plot.y} width={plot.width} height={plot.height} fill="var(--ui-bg-card, white)" />
      {matrix.map((row, rowIndex) => (
        <g
          key={rowIndex}
          ref={node => { rows.current[rowIndex] = node; }}
          className={onSelectRow ? 'attn-heatmap-row is-interactive' : 'attn-heatmap-row'}
          role={onSelectRow ? 'button' : undefined}
          tabIndex={onSelectRow ? (rowIndex === focusRow ? 0 : -1) : undefined}
          aria-label={onSelectRow ? `${rowName(rowIndex)}，第${rowIndex + 1}行，共${rowCount}行` : undefined}
          aria-pressed={onSelectRow ? rowIndex === selectedRow : undefined}
          onClick={onSelectRow ? event => selectRow(rowIndex, event.currentTarget) : undefined}
          onKeyDown={onSelectRow ? event => handleKey(event, rowIndex) : undefined}
        >
          {row.map((weight, column) => {
            const x = plot.x + column * cellWidth;
            const y = plot.y + rowIndex * cellHeight;
            const intensity = Math.min(1, weight / limit);
            return <g key={column}>
              <rect aria-hidden="true" data-heatmap-cell data-weight={weight} x={x} y={y} width={cellWidth} height={cellHeight} fill="var(--attn-activation, #7c57a6)" fillOpacity={intensity} stroke="var(--ui-border)" strokeWidth={columnCount > 12 ? 0.25 : 0.75}>
                <title>{`${rowName(rowIndex)} × ${columnName(column)}：${weight}`}</title>
              </rect>
              {displayValues && <foreignObject data-cell-value x={x + 2} y={y + (cellHeight - 42) / 2} width={cellWidth - 4} height="42" className="attn-heatmap-value"><Typography as="div" variant="bodySmall" align="center" style={{ color: intensity >= 0.85 ? 'var(--ui-bg-card, white)' : 'var(--ui-text-main)' }}>{weight.toFixed(3)}</Typography></foreignObject>}
            </g>;
          })}
          <rect className={`attn-heatmap-row-outline${rowIndex === selectedRow ? ' is-selected' : ''}`} x={plot.x + 1} y={plot.y + rowIndex * cellHeight + 1} width={plot.width - 2} height={Math.max(0, cellHeight - 2)} fill="none" strokeWidth="2" />
        </g>
      ))}
      {visibleRowLabels.map(row => <foreignObject key={row} x="2" y={plot.y + (row + 0.5) * cellHeight - 21} width="122" height="42"><Typography as="div" variant="bodySmall" tone={row === selectedRow ? 'accent' : 'muted'} align="end" title={rowName(row)}>{rowName(row)}</Typography></foreignObject>)}
      <rect x="924" y={compact ? 64 : 90} width="18" height={compact ? 160 : 234} fill={`url(#${gradientId})`} stroke="var(--ui-border)" />
      <foreignObject x="900" y={compact ? 8 : 39} width="98" height="42"><Typography as="div" variant="bodySmall" tone="muted" align="center">{matrix.some(row => row.some(weight => weight > limit)) ? `≥${scaleText(limit)}` : scaleText(limit)}</Typography></foreignObject>
      <foreignObject x="900" y={compact ? 230 : 330} width="98" height="42"><Typography as="div" variant="bodySmall" tone="muted" align="center">0</Typography></foreignObject>
      <foreignObject x="360" y={compact ? 254 : 390} width="300" height="42"><Typography as="div" variant="bodySmall" tone="muted" align="center">{columnAxisLabel}</Typography></foreignObject>
      <title>{`${label}。色标0至${limit}，超过上限的权重颜色饱和，悬停可读原值。`}</title>
    </svg>
  );
}

export function WeightStrip({ weights, positions, label, maxValue = 0.22, compact = false }: WeightStripProps) {
  if (!weights.length) return <EmptyGraphic className="attn-weight-strip" label={label} message="暂无权重" />;
  const realPositions = positions !== undefined;
  if (!weights.every(validWeight) || (positions && (positions.length !== weights.length || !positions.every(value => Number.isFinite(value) && value >= 0 && value <= 5)))) {
    return <EmptyGraphic className="attn-weight-strip" label={label} message="权重或位置数据不可用" />;
  }
  const limit = scaleLimit(maxValue, 0.22);
  const strip = compact ? { ...STRIP, y: 24, height: 88 } : STRIP;
  const bottom = strip.y + strip.height;
  const xPosition = (index: number) => realPositions ? strip.x + positions![index] / 5 * strip.width : strip.x + (weights.length === 1 ? 0.5 : index / (weights.length - 1)) * strip.width;
  const horizontalTicks = realPositions ? [0, 2.5, 5].map(value => ({ value, x: strip.x + value / 5 * strip.width })) : [...new Set([0, Math.floor((weights.length - 1) / 2), weights.length - 1])].map(index => ({ value: index + 1, x: xPosition(index) }));
  return (
    <svg className="attn-weight-strip" viewBox={`0 0 1000 ${compact ? 220 : 440}`} role="img" aria-label={`${label}；横轴${realPositions ? '真实位置0至5' : '记录序号'}；纵轴权重0至${limit}`}>
      {[0, limit / 2, limit].map(value => {
        const y = bottom - value / limit * strip.height;
        return <g key={value}><line x1={strip.x} x2={strip.x + strip.width} y1={y} y2={y} stroke="var(--ui-border)" strokeDasharray={value === 0 ? undefined : '4 6'} /><foreignObject x="4" y={y - 21} width="82" height="42"><Typography as="div" variant="bodySmall" tone="muted" align="end">{scaleText(value)}</Typography></foreignObject></g>;
      })}
      <path d={`M${strip.x} ${strip.y}V${bottom}H${strip.x + strip.width}`} fill="none" stroke="var(--ui-border-strong)" strokeWidth="1.5" />
      {weights.map((weight, index) => {
        const x = xPosition(index);
        const y = bottom - Math.min(1, weight / limit) * strip.height;
        return <g key={index}>
          <line data-weight-bar data-weight={weight} data-position={realPositions ? positions![index] : index + 1} x1={x} x2={x} y1={bottom} y2={y} stroke="var(--attn-activation, #7c57a6)" strokeWidth={realPositions ? 3 : Math.min(20, strip.width / weights.length * 0.65)}>
            <title>{`${realPositions ? '位置' : '记录'} ${realPositions ? positions![index] : index + 1}：${weight}${weight > limit ? '（超过纵轴上限）' : ''}`}</title>
          </line>
          {weight > limit && <path d={`M${x - 4} ${strip.y + 1}L${x} ${strip.y - 7}L${x + 4} ${strip.y + 1}`} fill="none" stroke="var(--attn-activation, #7c57a6)" strokeWidth="2" />}
        </g>;
      })}
      {horizontalTicks.map(tick => <g key={tick.value}><line x1={tick.x} x2={tick.x} y1={bottom} y2={bottom + 5} stroke="var(--ui-border-strong)" /><foreignObject x={tick.x - 38} y={bottom + 8} width="76" height="42"><Typography as="div" variant="bodySmall" tone="muted" align="center">{scaleText(tick.value)}</Typography></foreignObject></g>)}
      <foreignObject x="300" y={compact ? 170 : 382} width="450" height="42"><Typography as="div" variant="bodySmall" tone="muted" align="center">{realPositions ? '真实位置 x' : '记录序号'}</Typography></foreignObject>
    </svg>
  );
}
