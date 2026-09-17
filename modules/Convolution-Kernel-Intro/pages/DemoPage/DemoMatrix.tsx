import type { CSSProperties } from 'react';
import { BOARD_SIZE, type Board, type Cell } from '../../model/gomokuEngine';
import { boardValueAt, type Matrix } from '../../model/kernelLab';
import './DemoMatrix.css';

export interface DemoMatrixProps {
  board: Board;
  /** 写成 1 的那一方；棋盘上其余格子都是 0。 */
  player: number;
  kernel: Matrix;
  windowTop: number;
  windowLeft: number;
  label?: string;
}

/**
 * 计算机眼里的棋盘：选定一方的棋子写成 1，其余写成 0，格子和棋盘的交叉点一一对应。
 * 窗口扫过时，与算子重叠的 1 变成绿色；五个 1 全中时，再给这条线套一个绿色的圈。
 */
export function DemoMatrix({ board, player, kernel, windowTop, windowLeft, label }: DemoMatrixProps) {
  const size = kernel.length;
  const hits: Cell[] = [];
  const cells = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const value = boardValueAt(board, player, row, col);
      const inWindow =
        row >= windowTop && row < windowTop + size && col >= windowLeft && col < windowLeft + size;
      const hit = inWindow && value === 1 && kernel[row - windowTop][col - windowLeft] === 1;
      if (hit) hits.push({ row, col });
      cells.push(
        <span
          key={row + ':' + col}
          className={[
            'ck-matrix-cell',
            value === 1 && 'is-one',
            inWindow && 'is-window',
            hit && 'is-hit',
          ].filter(Boolean).join(' ')}
        />,
      );
    }
  }

  // 命中五个时，这五个格子一定排成算子那一条线；给它们套一个圈，一眼就能看到。
  const complete = hits.length === size;
  const first = hits[0];
  const last = hits[hits.length - 1];
  const span = complete ? Math.hypot(last.row - first.row, last.col - first.col) + 1 : 0;
  const lineStyle: CSSProperties = complete ? {
    left: (((first.col + last.col + 1) / 2 - span / 2) / BOARD_SIZE) * 100 + '%',
    top: (((first.row + last.row + 1) / 2 - 0.5) / BOARD_SIZE) * 100 + '%',
    width: (span / BOARD_SIZE) * 100 + '%',
    height: 100 / BOARD_SIZE + '%',
    transform: 'rotate(' + (Math.atan2(last.row - first.row, last.col - first.col) * 180) / Math.PI + 'deg)',
  } : {};

  return (
    <div
      className="ck-matrix"
      style={{ '--ck-matrix-size': BOARD_SIZE } as CSSProperties}
      role="img"
      aria-label={label}
    >
      {cells}
      <span
        className="ck-matrix-window"
        aria-hidden="true"
        style={{
          left: (windowLeft / BOARD_SIZE) * 100 + '%',
          top: (windowTop / BOARD_SIZE) * 100 + '%',
          width: (size / BOARD_SIZE) * 100 + '%',
          height: (size / BOARD_SIZE) * 100 + '%',
        }}
      />
      {complete ? <span className="ck-matrix-line" aria-hidden="true" style={lineStyle} /> : null}
    </div>
  );
}
