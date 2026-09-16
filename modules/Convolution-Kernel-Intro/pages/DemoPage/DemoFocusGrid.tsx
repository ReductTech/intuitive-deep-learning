import type { CSSProperties, ReactNode } from 'react';
import { Typography } from '../../../shared/react';
import { AI, EMPTY, HUMAN, inBounds, type Board, type Cell } from '../../model/gomokuEngine';
import { IMAGE_PADDING, IMAGE_SIZE, type Matrix } from '../../model/kernelLab';
import './DemoFocusGrid.css';

/** 只放图像里的一小块，数字才放得下；窗口滑到哪，这一块就跟到哪。 */
const VIEW_CELLS = 10;
/** 镜头一次挪 3 格，扫描过程中才不会一直抖。 */
const CROP_STEP = 3;
/** 窗口在特写区里留出的边距，让窗口大致居中。 */
const CROP_MARGIN = 2;

/** 把窗口位置换算成镜头的落点，永远停在图像范围内。 */
function cropOffset(windowStart: number): number {
  const max = IMAGE_SIZE - VIEW_CELLS;
  const stepped = Math.round((windowStart - CROP_MARGIN) / CROP_STEP) * CROP_STEP;
  return Math.max(0, Math.min(max, stepped));
}

export interface DemoFocusGridProps {
  board: Board;
  kernel: Matrix;
  windowTop: number;
  windowLeft: number;
  windowSize: number;
  /** 结算之后要圈出来的那条连线。 */
  winLine: Cell[];
  /** 贴在窗口右上角的小标签。 */
  badge?: ReactNode;
  label?: string;
  className?: string;
}

/**
 * 计算机眼中的棋盘特写：黑子记 1，白子记 -1，空位记 0。
 * 四周逐层淡出，只有窗口里的命中格子放大成绿色色块。
 */
export function DemoFocusGrid({
  board,
  kernel,
  windowTop,
  windowLeft,
  windowSize,
  winLine,
  badge,
  label,
  className,
}: DemoFocusGridProps) {
  const cropTop = cropOffset(windowTop);
  const cropLeft = cropOffset(windowLeft);
  const winKeys = new Set(winLine.map((cell) => cell.row + ':' + cell.col));

  const cells = [];
  for (let row = 0; row < IMAGE_SIZE; row += 1) {
    for (let col = 0; col < IMAGE_SIZE; col += 1) {
      const boardRow = row - IMAGE_PADDING;
      const boardCol = col - IMAGE_PADDING;
      const inBoard = inBounds(boardRow, boardCol);
      const stone = inBoard ? board[boardRow][boardCol] : EMPTY;
      const localRow = row - windowTop;
      const localCol = col - windowLeft;
      const inWindow = localRow >= 0 && localRow < windowSize && localCol >= 0 && localCol < windowSize;
      const isHit = inWindow && stone === HUMAN && kernel[localRow]?.[localCol] === 1;
      const value = stone === HUMAN ? 1 : stone === AI ? -1 : 0;
      const classes = [
        'ck-focus-cell',
        value === 1 && 'is-black',
        value === -1 && 'is-white',
        inWindow && 'is-window',
        isHit && 'is-hit',
        stone === HUMAN && winKeys.has(boardRow + ':' + boardCol) && 'is-win',
      ].filter(Boolean).join(' ');
      cells.push(
        <span key={row + ':' + col} className={classes}>
          <Typography as="span" variant={isHit ? 'h3' : 'body'} tone="inherit">{value}</Typography>
        </span>,
      );
    }
  }

  const px = (index: number) => (index * 100) / IMAGE_SIZE + '%';

  return (
    <div
      className={['ck-focus-grid', className].filter(Boolean).join(' ')}
      style={{ '--ck-image-cells': IMAGE_SIZE, '--ck-view-cells': VIEW_CELLS } as CSSProperties}
      role="img"
      aria-label={label}
    >
      <div
        className="ck-focus-field"
        style={{ transform: 'translate(-' + px(cropLeft) + ', -' + px(cropTop) + ')' }}
      >
        {cells}
      </div>
      <span className="ck-focus-vignette" aria-hidden="true" />
      <span
        className="ck-focus-window"
        aria-hidden="true"
        style={{
          left: ((windowLeft - cropLeft) * 100) / VIEW_CELLS + '%',
          top: ((windowTop - cropTop) * 100) / VIEW_CELLS + '%',
          width: (windowSize * 100) / VIEW_CELLS + '%',
          height: (windowSize * 100) / VIEW_CELLS + '%',
        }}
      >
        {badge ? <span className="ck-focus-badge">{badge}</span> : null}
      </span>
    </div>
  );
}