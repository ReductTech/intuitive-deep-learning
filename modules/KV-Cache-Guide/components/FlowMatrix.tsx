import type { ReactNode } from 'react';
import { Typography } from '../../shared/react';
import './FlowMatrix.css';

export type MatrixCellState = 'normal' | 'masked' | 'repeated' | 'new' | 'probability';

export function FlowMatrix({
  label, shape, rows, columns, tone = 'neutral', rowLabels, cellState, compact = false,
}: {
  label: ReactNode;
  shape: string;
  rows: number;
  columns: number;
  tone?: 'neutral' | 'q' | 'k' | 'v' | 'score' | 'output';
  rowLabels?: readonly string[];
  cellState?: (row: number, column: number) => MatrixCellState;
  compact?: boolean;
}) {
  return <div className={`kvc-flow-matrix kvc-flow-matrix--${tone} ${compact ? 'kvc-flow-matrix--compact' : ''}`}>
    <Typography as="strong" variant="body" tone="inherit" className="kvc-flow-matrix-label">{label}</Typography>
    <div className="kvc-flow-matrix-main">
      {rowLabels && <div className="kvc-flow-matrix-rows" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {rowLabels.slice(0, rows).map((item, index) => <Typography as="span" variant="bodySmall" tone="inherit" key={`${index}-${item}`}>{item}</Typography>)}
      </div>}
      <div className="kvc-flow-matrix-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: rows * columns }, (_, index) => {
          const row = Math.floor(index / columns);
          const column = index % columns;
          const state = cellState?.(row, column) ?? 'normal';
          return <span className={`kvc-flow-cell kvc-flow-cell--${state}`} key={index} />;
        })}
      </div>
      <Typography as="span" variant="bodySmall" tone="inherit" className="kvc-flow-matrix-dots">…</Typography>
    </div>
    <Typography as="span" variant="bodySmall" tone="muted" className="kvc-flow-matrix-shape">{shape}</Typography>
  </div>;
}
