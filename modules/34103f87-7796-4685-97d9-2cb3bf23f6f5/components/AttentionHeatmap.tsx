import { useId, useRef, type KeyboardEvent } from 'react';
import { Typography } from "@shuku/course-style/react";
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
  axisLabel?: string;
  valueLabel?: string;
}

const HEATMAP = { x: 134, y: 76, width: 756, height: 288 };
const STRIP = { x: 134, y: 52, width: 756, height: 270 };
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
  return <svg shuku-edit-id="e-c25be08e-9b18-4dab-8edf-cb3b53202037" className={className} viewBox="0 0 1000 440" role="img" aria-label={`${label}：${message}`}>
    <foreignObject shuku-edit-id="e-a1b8370a-76df-4cf1-ab82-4638445d36fa" x="150" y="180" width="700" height="70"><Typography shuku-edit-id="e-55ad69da-54fb-4c4a-9dd1-80e25f921aad" as="div" variant="bodySmall" tone="muted" align="center">{message}</Typography></foreignObject>
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
  const plot = compact ? { ...HEATMAP, y: 54, height: 230 } : HEATMAP;
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
    <svg shuku-edit-id="e-b1cc8302-0baf-4b92-9283-34b11dac96b9" className="attn-heatmap" viewBox={`0 0 1000 ${compact ? 350 : 440}`} role={onSelectRow ? 'group' : 'img'} aria-label={label}>
      <defs shuku-edit-id="e-455ccd67-8e75-4629-9eb3-4d20841c73e1"><linearGradient shuku-edit-id="e-1c9a814a-bf73-4e7d-9023-0db0cfe1cede" id={gradientId} x1="0" y1="1" x2="0" y2="0"><stop shuku-edit-id="e-f8ce8fc5-2879-4b11-af18-6036e7af04c6" offset="0%" stopColor="var(--ui-bg-card, white)" /><stop shuku-edit-id="e-d85a9e48-a09d-4dc6-b7cc-c2248a382831" offset="100%" stopColor="var(--attn-activation, #7c57a6)" /></linearGradient></defs>
      <foreignObject shuku-edit-id="e-5bfd3619-da15-4dd6-9ed7-f722ad6518b5" x="2" y={compact ? 3 : 16} width="122" height="42"><Typography shuku-edit-id="e-1451ce5e-08d1-4d73-8f38-63b60292db67" as="div" variant="bodySmall" tone="muted" align="end">{rowAxisLabel}</Typography></foreignObject>
      {visibleColumnLabels.map(column => <foreignObject shuku-edit-id="e-685709d2-6372-4456-971e-87b014a0b3ea" key={column} x={plot.x + (column + 0.5) * cellWidth - 55} y={compact ? 3 : 22} width="110" height="42"><Typography shuku-edit-id="e-9a73a542-9e72-4afd-9fab-4bad418581a5" as="div" variant="bodySmall" tone="muted" align="center" title={columnName(column)}>{columnName(column)}</Typography></foreignObject>)}
      <rect shuku-edit-id="e-747db849-e202-43ba-98d9-6272f05ce711" x={plot.x} y={plot.y} width={plot.width} height={plot.height} fill="var(--ui-bg-card, white)" />
      {matrix.map((row, rowIndex) => (
        <g shuku-edit-id="e-e9af04db-430a-47b2-9f06-85d1c036447a"
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
            return <g shuku-edit-id="e-d98992f1-3617-4b7b-9e3b-40244cacfad2" key={column}>
              <rect shuku-edit-id="e-03c567a5-560e-4613-96a4-331b75ae3409" aria-hidden="true" data-heatmap-cell data-weight={weight} x={x} y={y} width={cellWidth} height={cellHeight} fill="var(--attn-activation, #7c57a6)" fillOpacity={intensity} stroke="var(--ui-border)" strokeWidth={columnCount > 12 ? 0.25 : 0.75}>
                <title>{`${rowName(rowIndex)} × ${columnName(column)}：${weight}`}</title>
              </rect>
              {displayValues && <foreignObject shuku-edit-id="e-84ac6ccc-87f1-4459-9e7b-7f97a356ec0d" data-cell-value x={x + 2} y={y + (cellHeight - 42) / 2} width={cellWidth - 4} height="42" className="attn-heatmap-value"><Typography shuku-edit-id="e-4041dc0f-617f-4c73-9fef-d8acbf016ec9" as="div" variant="bodySmall" align="center" style={{ color: intensity >= 0.85 ? 'var(--ui-bg-card, white)' : 'var(--ui-text-main)' }}>{weight.toFixed(3)}</Typography></foreignObject>}
            </g>;
          })}
          <rect shuku-edit-id="e-c7f2f726-78a8-486c-925c-628250a6063e" className={`attn-heatmap-row-outline${rowIndex === selectedRow ? ' is-selected' : ''}`} x={plot.x + 1} y={plot.y + rowIndex * cellHeight + 1} width={plot.width - 2} height={Math.max(0, cellHeight - 2)} fill="none" strokeWidth="2" />
        </g>
      ))}
      {visibleRowLabels.map(row => <foreignObject shuku-edit-id="e-3087f4c3-3478-4091-8b79-2f4accab0e15" key={row} x="2" y={plot.y + (row + 0.5) * cellHeight - 21} width="122" height="42"><Typography shuku-edit-id="e-1d721253-8b9b-4711-afc5-ba5b6a6967c4" as="div" variant="bodySmall" tone={row === selectedRow ? 'accent' : 'muted'} align="end" title={rowName(row)}>{rowName(row)}</Typography></foreignObject>)}
      <rect shuku-edit-id="e-95f7d108-94a0-45c6-b51f-4c1f4f20bca4" x="924" y={compact ? 64 : 90} width="18" height={compact ? 210 : 234} fill={`url(#${gradientId})`} stroke="var(--ui-border)" />
      <foreignObject shuku-edit-id="e-f477fdfa-73c4-4c0a-9195-967be0ccb27d" x="900" y={compact ? 8 : 39} width="98" height="42"><Typography shuku-edit-id="e-21d6d626-b941-4c8c-8bad-d3d8c8a12543" as="div" variant="bodySmall" tone="muted" align="center">{matrix.some(row => row.some(weight => weight > limit)) ? `≥${scaleText(limit)}` : scaleText(limit)}</Typography></foreignObject>
      <foreignObject shuku-edit-id="e-43e8487e-2f43-4f4d-a6ea-32035b5472f3" x="900" y={compact ? 280 : 330} width="98" height="42"><Typography shuku-edit-id="e-db669a94-51c6-4f7e-bc39-5381dbd591b1" as="div" variant="bodySmall" tone="muted" align="center">0</Typography></foreignObject>
      <foreignObject shuku-edit-id="e-93c55ad9-4660-40b2-9c97-30d06f5ff3e7" x="360" y={compact ? 304 : 390} width="300" height="42"><Typography shuku-edit-id="e-59fbb628-2076-41ca-9f81-a19d2654991b" as="div" variant="bodySmall" tone="muted" align="center">{columnAxisLabel}</Typography></foreignObject>
      <title>{`${label}。色标0至${limit}，超过上限的权重颜色饱和，悬停可读原值。`}</title>
    </svg>
  );
}

export function WeightStrip({ weights, positions, label, maxValue = 0.22, compact = false, axisLabel, valueLabel }: WeightStripProps) {
  if (!weights.length) return <EmptyGraphic className="attn-weight-strip" label={label} message="暂无权重" />;
  const realPositions = positions !== undefined;
  const horizontalLabel = axisLabel ?? (realPositions ? '坐标 x' : '记录序号');
  const entryLabel = valueLabel ?? (realPositions ? '坐标' : '记录');
  if (!weights.every(validWeight) || (positions && (positions.length !== weights.length || !positions.every(value => Number.isFinite(value) && value >= 0 && value <= 5)))) {
    return <EmptyGraphic className="attn-weight-strip" label={label} message="权重或位置数据不可用" />;
  }
  const limit = scaleLimit(maxValue, 0.22);
  const strip = compact ? { ...STRIP, y: 24, height: 88 } : STRIP;
  const bottom = strip.y + strip.height;
  const xPosition = (index: number) => realPositions ? strip.x + positions![index] / 5 * strip.width : strip.x + (weights.length === 1 ? 0.5 : index / (weights.length - 1)) * strip.width;
  const horizontalTicks = realPositions ? [0, 2.5, 5].map(value => ({ value, x: strip.x + value / 5 * strip.width })) : [...new Set([0, Math.floor((weights.length - 1) / 2), weights.length - 1])].map(index => ({ value: index + 1, x: xPosition(index) }));
  return (
    <svg shuku-edit-id="e-215b268c-e51a-48b4-aec5-98e8a5718b06" className="attn-weight-strip" viewBox={`0 0 1000 ${compact ? 190 : 440}`} role="img" aria-label={`${label}；横轴${horizontalLabel}${realPositions ? '，0至5' : ''}；纵轴权重0至${limit}`}>
      <foreignObject shuku-edit-id="e-67bc3fcf-c501-4b90-8c47-eeccf815a56f" x="3" y={strip.y + strip.height / 2 - 40} width="40" height="80"><Typography shuku-edit-id="e-c21d2583-19fe-4931-9701-7942349d96c6" as="div" variant="bodySmall" tone="muted" style={{ writingMode: 'vertical-rl' }}>权重</Typography></foreignObject>
      {[0, limit / 2, limit].map(value => {
        const y = bottom - value / limit * strip.height;
        return <g shuku-edit-id="e-1259dbf5-facd-4411-8413-c9f462a81b9e" key={value}><line shuku-edit-id="e-4b257c72-7b48-49ac-bee2-2ed63c483f4d" x1={strip.x} x2={strip.x + strip.width} y1={y} y2={y} stroke="var(--ui-border)" strokeDasharray={value === 0 ? undefined : '4 6'} /><foreignObject shuku-edit-id="e-067a2897-20f9-4396-ba57-057c899551f8" x="40" y={y - 21} width="82" height="42"><Typography shuku-edit-id="e-9f682b2a-5278-4663-8456-e9de024a0251" as="div" variant="bodySmall" tone="muted" align="end">{scaleText(value)}</Typography></foreignObject></g>;
      })}
      <path shuku-edit-id="e-0079762d-2a69-4891-9030-44cc44297617" d={`M${strip.x} ${strip.y}V${bottom}H${strip.x + strip.width}`} fill="none" stroke="var(--ui-border-strong)" strokeWidth="1.5" />
      {weights.map((weight, index) => {
        const x = xPosition(index);
        const y = bottom - Math.min(1, weight / limit) * strip.height;
        return <g shuku-edit-id="e-9bce7e9d-38e1-4a45-886d-b5dc6ce8321d" key={index}>
          <line shuku-edit-id="e-922cf94d-4a2f-49b8-bf3d-7b9c6fdc7d85" data-weight-bar data-weight={weight} data-position={realPositions ? positions![index] : index + 1} x1={x} x2={x} y1={bottom} y2={y} stroke="var(--attn-activation, #7c57a6)" strokeWidth={realPositions ? 3 : Math.min(20, strip.width / weights.length * 0.65)}>
            <title>{`${entryLabel} ${realPositions ? positions![index] : index + 1}：${weight}${weight > limit ? '（超过纵轴上限）' : ''}`}</title>
          </line>
          {weight > limit && <path shuku-edit-id="e-8959667f-54ea-45c4-8045-85fdcc7b0c10" d={`M${x - 4} ${strip.y + 1}L${x} ${strip.y - 7}L${x + 4} ${strip.y + 1}`} fill="none" stroke="var(--attn-activation, #7c57a6)" strokeWidth="2" />}
        </g>;
      })}
      {horizontalTicks.map(tick => <g shuku-edit-id="e-ad91134c-1ec5-49f2-a591-b1f7becbed07" key={tick.value}><line shuku-edit-id="e-9a81c68d-e979-4c1f-9423-4003fc5fe83d" x1={tick.x} x2={tick.x} y1={bottom} y2={bottom + 5} stroke="var(--ui-border-strong)" /><foreignObject shuku-edit-id="e-95412de3-79db-4428-b4ed-08dfe94e8a45" x={tick.x - 38} y={bottom + 8} width="76" height="42"><Typography shuku-edit-id="e-9a78480c-d3a3-4243-bc37-babbf2182432" as="div" variant="bodySmall" tone="muted" align="center">{scaleText(tick.value)}</Typography></foreignObject></g>)}
      <foreignObject shuku-edit-id="e-dfbee014-dc91-442a-aa2d-05e05bebd868" x="300" y={compact ? 146 : 382} width="450" height="42"><Typography shuku-edit-id="e-3b1c5048-9efa-49be-8c05-e709300254b8" as="div" variant="bodySmall" tone="muted" align="center">{horizontalLabel}</Typography></foreignObject>
    </svg>
  );
}
