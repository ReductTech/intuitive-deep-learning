import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Typography } from '../../shared/react';
import { IMAGE_SIZE, type DisplayCell } from '../model/kernelLab';
import './BinaryGrid.css';

export interface BinaryGridProps {
  cells: DisplayCell[];
  windowTop: number;
  windowLeft: number;
  windowSize: number;
  showWindow?: boolean;
  /** 允许用指针拖动橙色窗口。 */
  interactive?: boolean;
  onMoveWindow?: (top: number, left: number) => void;
  label?: string;
  className?: string;
}

/** 补零后的 0/1 棋盘。指针按下时会把握着的窗口挪到指针所在的格子中心。 */
export function BinaryGrid({
  cells,
  windowTop,
  windowLeft,
  windowSize,
  showWindow = true,
  interactive = false,
  onMoveWindow,
  label,
  className,
}: BinaryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const moveToPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || !onMoveWindow) return;
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const cell = rect.width / IMAGE_SIZE;
    if (cell <= 0) return;
    const row = Math.floor((event.clientY - rect.top) / cell);
    const col = Math.floor((event.clientX - rect.left) / cell);
    const half = Math.floor(windowSize / 2);
    const max = IMAGE_SIZE - windowSize;
    const clamp = (value: number) => Math.max(0, Math.min(max, value));
    onMoveWindow(clamp(row - half), clamp(col - half));
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    const grid = gridRef.current;
    try {
      if (grid && grid.hasPointerCapture(event.pointerId)) grid.releasePointerCapture(event.pointerId);
    } catch {
      // 指针捕获可能已经被浏览器释放；拖动本身不依赖它。
    }
  };

  return (
    <div
      ref={gridRef}
      className={['ck-binary-grid', interactive && 'is-interactive', className].filter(Boolean).join(' ')}
      style={{ '--ck-grid-size': IMAGE_SIZE } as CSSProperties}
      role="img"
      aria-label={label}
      onPointerDown={(event) => {
        if (!interactive) return;
        draggingRef.current = true;
        event.preventDefault();
        try {
          gridRef.current?.setPointerCapture(event.pointerId);
        } catch {
          // 合成事件或已释放的指针无法捕获，直接继续拖动。
        }
        moveToPointer(event);
      }}
      onPointerMove={(event) => { if (draggingRef.current) moveToPointer(event); }}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      {cells.map((cell) => {
        const inWindow = showWindow
          && cell.row >= windowTop
          && cell.row < windowTop + windowSize
          && cell.col >= windowLeft
          && cell.col < windowLeft + windowSize;
        const onEdge = inWindow && (
          cell.row === windowTop
          || cell.row === windowTop + windowSize - 1
          || cell.col === windowLeft
          || cell.col === windowLeft + windowSize - 1
        );
        const classes = [
          'ck-binary-cell',
          cell.value ? 'is-one' : 'is-zero',
          !cell.onBoard && 'is-padding',
          cell.isWin && 'is-win',
          cell.isHit && 'is-hit',
          inWindow && 'is-window',
          onEdge && 'is-window-edge',
        ].filter(Boolean).join(' ');
        return (
          <span key={cell.row + ':' + cell.col} className={classes} data-value={cell.value}>
            <Typography as="span" variant="bodySmall" tone="inherit">{cell.value}</Typography>
          </span>
        );
      })}
    </div>
  );
}
