import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { BOARD_SIZE, EMPTY, HUMAN, inBounds, type Board, type Cell, type Stone } from '../model/gomokuEngine';
import './GomokuBoard.css';

interface BoardMetrics {
  cell: number;
  left: number;
  top: number;
}

const BOARD_COLOR = '#e7c889';
const LINE_COLOR = 'rgba(68, 46, 26, 0.78)';
const STAR_COLOR = 'rgba(68, 46, 26, 0.82)';

/** 棋盘边长留 6.5% 的边距，让最外侧的交叉点不贴边。 */
function metricsFor(width: number, height: number): BoardMetrics {
  const side = Math.min(width, height);
  const pad = side * 0.065;
  const cell = (side - pad * 2) / (BOARD_SIZE - 1);
  return {
    cell,
    left: (width - side) / 2 + pad,
    top: (height - side) / 2 + pad,
  };
}

function cellPoint(row: number, col: number, metrics: BoardMetrics) {
  return { x: metrics.left + col * metrics.cell, y: metrics.top + row * metrics.cell };
}

function paintSurface(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = BOARD_COLOR;
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(255,255,255,0.22)');
  gradient.addColorStop(0.52, 'rgba(255,255,255,0.03)');
  gradient.addColorStop(1, 'rgba(39,68,110,0.12)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function paintGrid(ctx: CanvasRenderingContext2D, metrics: BoardMetrics) {
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = Math.max(1, metrics.cell * 0.028);
  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const rowStart = cellPoint(index, 0, metrics);
    const rowEnd = cellPoint(index, BOARD_SIZE - 1, metrics);
    ctx.beginPath();
    ctx.moveTo(rowStart.x, rowStart.y);
    ctx.lineTo(rowEnd.x, rowEnd.y);
    ctx.stroke();
    const colStart = cellPoint(0, index, metrics);
    const colEnd = cellPoint(BOARD_SIZE - 1, index, metrics);
    ctx.beginPath();
    ctx.moveTo(colStart.x, colStart.y);
    ctx.lineTo(colEnd.x, colEnd.y);
    ctx.stroke();
  }
}

function paintStars(ctx: CanvasRenderingContext2D, metrics: BoardMetrics) {
  [3, 7, 11].forEach((row) => {
    [3, 7, 11].forEach((col) => {
      const point = cellPoint(row, col, metrics);
      ctx.beginPath();
      ctx.arc(point.x, point.y, metrics.cell * 0.105, 0, Math.PI * 2);
      ctx.fillStyle = STAR_COLOR;
      ctx.fill();
    });
  });
}

function paintStone(
  ctx: CanvasRenderingContext2D,
  metrics: BoardMetrics,
  row: number,
  col: number,
  player: number,
  isWin: boolean,
  isLast: boolean,
) {
  const point = cellPoint(row, col, metrics);
  const radius = metrics.cell * 0.42;
  ctx.save();
  ctx.shadowColor = 'rgba(33,50,74,0.28)';
  ctx.shadowBlur = metrics.cell * 0.15;
  ctx.shadowOffsetY = metrics.cell * 0.08;
  const fill = ctx.createRadialGradient(
    point.x - radius * 0.28,
    point.y - radius * 0.36,
    radius * 0.12,
    point.x,
    point.y,
    radius,
  );
  if (player === HUMAN) {
    fill.addColorStop(0, '#525a68');
    fill.addColorStop(0.42, '#1a1f27');
    fill.addColorStop(1, '#05070a');
  } else {
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.58, '#edf2f7');
    fill.addColorStop(1, '#aeb8c7');
  }
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(1.4, metrics.cell * 0.04);
  ctx.strokeStyle = player === HUMAN ? 'rgba(255,255,255,0.16)' : 'rgba(39,68,110,0.28)';
  ctx.stroke();
  if (isLast) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = player === HUMAN ? '#f07e47' : '#228d5c';
    ctx.fill();
  }
  if (isWin) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 1.2, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(2, metrics.cell * 0.06);
    ctx.strokeStyle = '#f07e47';
    ctx.stroke();
  }
  ctx.restore();
}

function paintStones(
  ctx: CanvasRenderingContext2D,
  metrics: BoardMetrics,
  board: Board,
  winLine: Cell[],
  lastMove: Stone | null,
) {
  const winKeys = new Set(winLine.map((cell) => cell.row + ':' + cell.col));
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const value = board[row][col];
      if (value === EMPTY) continue;
      paintStone(
        ctx,
        metrics,
        row,
        col,
        value,
        winKeys.has(row + ':' + col),
        Boolean(lastMove && lastMove.row === row && lastMove.col === col),
      );
    }
  }
}

function paintHover(ctx: CanvasRenderingContext2D, metrics: BoardMetrics, cell: Cell) {
  const point = cellPoint(cell.row, cell.col, metrics);
  ctx.beginPath();
  ctx.arc(point.x, point.y, metrics.cell * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(23,27,34,0.22)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(23,27,34,0.48)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export interface GomokuBoardProps {
  board: Board;
  winLine: Cell[];
  lastMove: Stone | null;
  /** 玩家此刻是否可以落子；AI 思考、终局结束时为 false。 */
  interactive: boolean;
  /** AI 正在思考，用于把光标切换成等待状态。 */
  waiting?: boolean;
  onPlace: (row: number, col: number) => void;
  className?: string;
}

export function GomokuBoard({
  board,
  winLine,
  lastMove,
  interactive,
  waiting = false,
  onPlace,
  className,
}: GomokuBoardProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Cell | null>(null);

  const draw = useCallback(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;
    const rect = frame.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const metrics = metricsFor(width, height);
    paintSurface(ctx, width, height);
    paintGrid(ctx, metrics);
    paintStars(ctx, metrics);
    paintStones(ctx, metrics, board, winLine, lastMove);
    if (hover && interactive) paintHover(ctx, metrics, hover);
  }, [board, hover, interactive, lastMove, winLine]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(frame);
    return () => observer.disconnect();
  }, [draw]);

  const resolveCell = (event: ReactPointerEvent<HTMLCanvasElement>): Cell | null => {
    const frame = frameRef.current;
    if (!frame) return null;
    const rect = frame.getBoundingClientRect();
    const metrics = metricsFor(rect.width, rect.height);
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.round((x - metrics.left) / metrics.cell);
    const row = Math.round((y - metrics.top) / metrics.cell);
    if (!inBounds(row, col)) return null;
    const snapped = cellPoint(row, col, metrics);
    if (Math.hypot(snapped.x - x, snapped.y - y) > metrics.cell * 0.46) return null;
    return { row, col };
  };

  return (
    <div
      className={['ck-board-frame', waiting && 'is-waiting', className].filter(Boolean).join(' ')}
      ref={frameRef}
    >
      <canvas
        ref={canvasRef}
        aria-label={'十五路五子棋棋盘，点击交叉点落下黑子'}
        onPointerMove={(event) => {
          if (!interactive) {
            if (hover) setHover(null);
            return;
          }
          const cell = resolveCell(event);
          setHover(cell && board[cell.row][cell.col] === EMPTY ? cell : null);
        }}
        onPointerLeave={() => setHover(null)}
        onPointerDown={(event) => {
          if (!interactive) return;
          const cell = resolveCell(event);
          if (!cell || board[cell.row][cell.col] !== EMPTY) return;
          event.preventDefault();
          setHover(null);
          onPlace(cell.row, cell.col);
        }}
      />
    </div>
  );
}
