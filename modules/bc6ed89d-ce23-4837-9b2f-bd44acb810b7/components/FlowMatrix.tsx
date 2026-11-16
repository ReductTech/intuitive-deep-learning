import type { ReactNode } from 'react';
import { Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-5f3ae5ce-1ffe-45b7-a4a3-75f847686b8f" className={`kvc-flow-matrix kvc-flow-matrix--${tone} ${compact ? 'kvc-flow-matrix--compact' : ''}`}>
    <Typography shuku-edit-id="e-21d69067-477c-478b-8a1e-fdf89232bf05" as="strong" variant="body" tone="inherit" className="kvc-flow-matrix-label">{label}</Typography>
    <div shuku-edit-id="e-18f6d438-c54e-4759-80ea-22e7a7ed046a" className="kvc-flow-matrix-main">
      {rowLabels && <div shuku-edit-id="e-438eaa2d-2bba-43bf-89c7-da9721e1bd2b" className="kvc-flow-matrix-rows" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {rowLabels.slice(0, rows).map((item, index) => <Typography shuku-edit-id="e-3973c88a-9ea2-474c-babc-7a724b4bfe9a" as="span" variant="bodySmall" tone="inherit" key={`${index}-${item}`}>{item}</Typography>)}
      </div>}
      <div shuku-edit-id="e-1af7d3b8-f60a-44dd-8b08-d8c3a1080c90" className="kvc-flow-matrix-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: rows * columns }, (_, index) => {
          const row = Math.floor(index / columns);
          const column = index % columns;
          const state = cellState?.(row, column) ?? 'normal';
          return <span shuku-edit-id="e-97598f48-ba49-4809-9f7c-7caebbd2d3a3" className={`kvc-flow-cell kvc-flow-cell--${state}`} key={index} />;
        })}
      </div>
      <Typography shuku-edit-id="e-4bc00745-079c-48ae-9fe2-8e1499d82793" as="span" variant="bodySmall" tone="inherit" className="kvc-flow-matrix-dots">…</Typography>
    </div>
    <Typography shuku-edit-id="e-e5399e4b-7fa4-44a7-8f0e-d041f6544ee6" as="span" variant="bodySmall" tone="muted" className="kvc-flow-matrix-shape">{shape}</Typography>
  </div>;
}
