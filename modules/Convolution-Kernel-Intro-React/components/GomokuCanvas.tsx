import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  AI,
  BOARD_SIZE,
  EMPTY,
  HUMAN,
  inBounds,
  type Board,
  type Cell,
  type Move,
} from '../model/gomokuEngine';

interface Props {
  board: Board;
  winLine: Cell[];
  lastMove: Move | null;
  disabled?: boolean;
  onCell: (row: number, col: number) => void;
}

interface Metrics {
  width: number;
  height: number;
  side: number;
  cell: number;
  left: number;
  top: number;
}

function metrics(width: number, height: number): Metrics {
  const side = Math.min(width, height);
  const pad = side * 0.065;
  return {
    width,
    height,
    side,
    cell: (side - pad * 2) / (BOARD_SIZE - 1),
    left: (width - side) / 2 + pad,
    top: (height - side) / 2 + pad,
  };
}

function point(row: number, col: number, size: Metrics) {
  return {
    x: size.left + col * size.cell,
    y: size.top + row * size.cell,
  };
}

export function GomokuCanvas({
  board,
  winLine,
  lastMove,
  disabled = false,
  onCell,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setRevision((value) => value + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
    const pixelHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = metrics(rect.width, rect.height);
    context.clearRect(0, 0, size.width, size.height);
    context.fillStyle = '#e7c889';
    context.fillRect(0, 0, size.width, size.height);
    const surface = context.createLinearGradient(0, 0, size.width, size.height);
    surface.addColorStop(0, 'rgba(255,255,255,0.22)');
    surface.addColorStop(0.52, 'rgba(255,255,255,0.03)');
    surface.addColorStop(1, 'rgba(39,68,110,0.12)');
    context.fillStyle = surface;
    context.fillRect(0, 0, size.width, size.height);

    context.strokeStyle = 'rgba(68, 46, 26, 0.78)';
    context.lineWidth = Math.max(1, size.cell * 0.028);
    for (let index = 0; index < BOARD_SIZE; index += 1) {
      let start = point(index, 0, size);
      let end = point(index, BOARD_SIZE - 1, size);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      start = point(0, index, size);
      end = point(BOARD_SIZE - 1, index, size);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    [3, 7, 11].forEach((row) => {
      [3, 7, 11].forEach((col) => {
        const at = point(row, col, size);
        context.beginPath();
        context.arc(at.x, at.y, size.cell * 0.105, 0, Math.PI * 2);
        context.fillStyle = 'rgba(68, 46, 26, 0.82)';
        context.fill();
      });
    });

    const winKeys = new Set(winLine.map((cell) => `${cell.row}:${cell.col}`));
    board.forEach((line, row) => line.forEach((player, col) => {
      if (player === EMPTY) return;
      const at = point(row, col, size);
      const radius = size.cell * 0.42;
      context.save();
      context.shadowColor = 'rgba(33,50,74,0.28)';
      context.shadowBlur = size.cell * 0.15;
      context.shadowOffsetY = size.cell * 0.08;
      const fill = context.createRadialGradient(
        at.x - radius * 0.28,
        at.y - radius * 0.36,
        radius * 0.12,
        at.x,
        at.y,
        radius,
      );
      if (player === HUMAN) {
        fill.addColorStop(0, '#525a68');
        fill.addColorStop(0.42, '#1a1f27');
        fill.addColorStop(1, '#05070a');
      } else if (player === AI) {
        fill.addColorStop(0, '#ffffff');
        fill.addColorStop(0.58, '#edf2f7');
        fill.addColorStop(1, '#aeb8c7');
      }
      context.fillStyle = fill;
      context.beginPath();
      context.arc(at.x, at.y, radius, 0, Math.PI * 2);
      context.fill();
      context.shadowColor = 'transparent';
      context.lineWidth = Math.max(1.4, size.cell * 0.04);
      context.strokeStyle = player === HUMAN
        ? 'rgba(255,255,255,0.16)'
        : 'rgba(39,68,110,0.28)';
      context.stroke();
      if (lastMove?.row === row && lastMove.col === col) {
        context.beginPath();
        context.arc(at.x, at.y, radius * 0.3, 0, Math.PI * 2);
        context.fillStyle = player === HUMAN ? '#f07e47' : '#228d5c';
        context.fill();
      }
      if (winKeys.has(`${row}:${col}`)) {
        context.beginPath();
        context.arc(at.x, at.y, radius * 1.2, 0, Math.PI * 2);
        context.lineWidth = Math.max(2, size.cell * 0.06);
        context.strokeStyle = '#f07e47';
        context.stroke();
      }
      context.restore();
    }));

    if (hover && !disabled && board[hover.row]?.[hover.col] === EMPTY) {
      const at = point(hover.row, hover.col, size);
      context.beginPath();
      context.arc(at.x, at.y, size.cell * 0.38, 0, Math.PI * 2);
      context.fillStyle = 'rgba(23,27,34,0.22)';
      context.fill();
      context.strokeStyle = 'rgba(23,27,34,0.48)';
      context.lineWidth = 2;
      context.stroke();
    }
  }, [board, disabled, hover, lastMove, revision, winLine]);

  function cellFromEvent(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const size = metrics(rect.width, rect.height);
    const col = Math.round((event.clientX - rect.left - size.left) / size.cell);
    const row = Math.round((event.clientY - rect.top - size.top) / size.cell);
    if (!inBounds(row, col)) return null;
    const snapped = point(row, col, size);
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return Math.hypot(snapped.x - x, snapped.y - y) <= size.cell * 0.46
      ? { row, col }
      : null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={900}
      aria-label="十五路五子棋棋盘"
      onPointerMove={(event) => setHover(cellFromEvent(event))}
      onPointerLeave={() => setHover(null)}
      onPointerDown={(event) => {
        if (disabled) return;
        const cell = cellFromEvent(event);
        if (!cell) return;
        event.preventDefault();
        onCell(cell.row, cell.col);
      }}
    />
  );
}
