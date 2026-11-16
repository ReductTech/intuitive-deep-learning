import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NumericBoardDragHint } from '../../../../NumericBoardDragHint';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ClickTap, GridNine, Move } from '@icon-park/react';
import { AttentionHint, ContentBlock, Typography } from "@shuku/course-style/react";
import { useGomokuOutcome } from '../../LessonContext';
import { BOARD_SIZE, EMPTY, type Board, type Cell } from '../../gomokuEngine';
import './KernelDesignPage.css';

const KERNEL_SIZE = 5;
const WINDOW_LIMIT = BOARD_SIZE - KERNEL_SIZE;
const WINDOW_MIDDLE = 2;
const UNIT = 100 / BOARD_SIZE;
const BOARD_INDEX = Array.from({ length: BOARD_SIZE }, (_, i) => i);
const KERNEL_INDEX = Array.from({ length: KERNEL_SIZE }, (_, i) => i);
type Transform = 'rotate' | 'flip';

const cellKey = (row: number, col: number) => `${row}:${col}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const transformFor = (line: Cell[]): Transform => {
  const a = line[0]; const b = line[1];
  return a && b && a.row !== b.row && a.col !== b.col ? 'flip' : 'rotate';
};
const toDisplayCell = (cell: Cell, transform: Transform): Cell => transform === 'rotate'
  ? { row: cell.col, col: BOARD_SIZE - 1 - cell.row }
  : { row: cell.row, col: BOARD_SIZE - 1 - cell.col };
function toDisplayBoard(board: Board, transform: Transform): Board {
  const next: Board = board.map((row) => row.map(() => EMPTY));
  board.forEach((row, r) => row.forEach((stone, c) => { const cell = toDisplayCell({ row: r, col: c }, transform); next[cell.row][cell.col] = stone; }));
  return next;
}
const toNumberGrid = (board: Board, winner: number) => board.map((row) => row.map((stone) => stone === EMPTY ? 0 : stone === winner ? 1 : -1));
function windowCentre(line: Cell[]): Cell {
  const rows = line.map((c) => c.row); const cols = line.map((c) => c.col);
  const row = rows.length ? Math.round((Math.min(...rows) + Math.max(...rows)) / 2) : 7;
  const col = cols.length ? Math.round((Math.min(...cols) + Math.max(...cols)) / 2) : 7;
  return { row: clamp(row - WINDOW_MIDDLE, 0, WINDOW_LIMIT) + WINDOW_MIDDLE, col: clamp(col - WINDOW_MIDDLE, 0, WINDOW_LIMIT) + WINDOW_MIDDLE };
}
const EMPTY_KERNEL = KERNEL_INDEX.map(() => KERNEL_INDEX.map(() => 0));
const windowActivation = (grid: number[][], kernel: number[][], top: number, left: number) => kernel.reduce((sum, kr, r) => sum + kr.reduce((rowSum, value, c) => rowSum + value * grid[top + r][left + c], 0), 0);
function bestActivation(grid: number[][], kernel: number[][]) { let best = -Infinity; for (let r = 0; r <= WINDOW_LIMIT; r += 1) for (let c = 0; c <= WINDOW_LIMIT; c += 1) best = Math.max(best, windowActivation(grid, kernel, r, c)); return Number.isFinite(best) ? best : 0; }
function startCell(grid: number[][], kernel: number[][]): Cell { let best: Cell = { row: 0, col: 0 }; let value = -Infinity; for (let r = 0; r <= WINDOW_LIMIT; r += 1) for (let c = 0; c <= WINDOW_LIMIT; c += 1) { const next = windowActivation(grid, kernel, r, c); if (next > value) { value = next; best = { row: r, col: c }; } } return best; }
function kernelForLine(line: Cell[]): number[][] {
  const a = line[0]; const b = line[1];
  const dr = a && b ? Math.sign(b.row - a.row) : 0;
  const dc = a && b ? Math.sign(b.col - a.col) : 1;
  return KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
    if (dc === 0) return col === WINDOW_MIDDLE ? 1 : 0;
    if (dr === 0) return row === WINDOW_MIDDLE ? 1 : 0;
    return dr === dc ? (row === col ? 1 : 0) : (row + col === KERNEL_SIZE - 1 ? 1 : 0);
  }));
}
const sameKernel = (left: number[][], right: number[][]) => left.every((row, r) => row.every((cell, c) => cell === right[r][c]));

export interface KernelDesignPageProps { onComplete: () => void; autoDemo?: boolean; }

export function KernelDesignPage({ onComplete, autoDemo = false }: KernelDesignPageProps) {
  const { outcome, designedKernel, recordDesignedKernel } = useGomokuOutcome();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragOrigin = useRef<{ cell: Cell; topLeft: Cell } | null>(null);
  const completedRef = useRef(false);
  const transform = useMemo(() => transformFor(outcome.winLine), [outcome.winLine]);
  const targetKernel = useMemo(() => kernelForLine(outcome.winLine.map((cell) => toDisplayCell(cell, transform))), [outcome.winLine, transform]);
  const displayBoard = useMemo(() => toDisplayBoard(outcome.board, transform), [outcome.board, transform]);
  const grid = useMemo(() => toNumberGrid(displayBoard, outcome.winner), [displayBoard, outcome.winner]);
  const centre = useMemo(() => windowCentre(outcome.winLine.map((cell) => toDisplayCell(cell, transform))), [outcome.winLine, transform]);
  const kernel = designedKernel ?? EMPTY_KERNEL;
  const [hovered, setHovered] = useState<Cell | null>(null);
  const best = useMemo(() => bestActivation(grid, kernel), [grid, kernel]);
  const [topLeft, setTopLeft] = useState<Cell>({ row: 0, col: 0 });
  const [dragging, setDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  useEffect(() => { setTopLeft({ row: 0, col: 0 }); setHasMoved(false); completedRef.current = false; }, [outcome.board]);
  useEffect(() => {
    if (!autoDemo) return;
    const cells = targetKernel.flatMap((row, r) => row.flatMap((value, c) => value ? [{ row: r, col: c }] : []));
    const timers = cells.map((_, index) => setTimeout(() => {
      const next = EMPTY_KERNEL.map(row => [...row]);
      for (const cell of cells.slice(0, index + 1)) next[cell.row][cell.col] = 1;
      recordDesignedKernel(next);
    }, 650 + index * 180));
    timers.push(setTimeout(() => setTopLeft(startCell(grid, targetKernel)), 1900));
    return () => timers.forEach(clearTimeout);
  }, [autoDemo, targetKernel, grid, recordDesignedKernel]);
  const patch = KERNEL_INDEX.map((r) => KERNEL_INDEX.map((c) => grid[topLeft.row + r][topLeft.col + c]));
  const value = windowActivation(grid, kernel, topLeft.row, topLeft.col);
  const found = best > 0 && value >= best;
  const kernelCorrect = sameKernel(kernel, targetKernel);
  const cellFromPointer = (event: ReactPointerEvent<HTMLDivElement>): Cell | null => { const host = boardRef.current; if (!host) return null; const rect = host.getBoundingClientRect(); if (!rect.width || !rect.height) return null; return { row: clamp(Math.floor(((event.clientY - rect.top) / rect.height) * BOARD_SIZE), 0, BOARD_SIZE - 1), col: clamp(Math.floor(((event.clientX - rect.left) / rect.width) * BOARD_SIZE), 0, BOARD_SIZE - 1) }; };
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => { if (!kernelCorrect) return; const cell = cellFromPointer(event); if (!cell) return; dragOrigin.current = { cell, topLeft }; event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => { if (!kernelCorrect || !dragging || !dragOrigin.current) return; const cell = cellFromPointer(event); if (!cell) return; const next = { row: clamp(dragOrigin.current.topLeft.row + cell.row - dragOrigin.current.cell.row, 0, WINDOW_LIMIT), col: clamp(dragOrigin.current.topLeft.col + cell.col - dragOrigin.current.cell.col, 0, WINDOW_LIMIT) }; if (next.row !== topLeft.row || next.col !== topLeft.col) setHasMoved(true); setTopLeft(next); };
  const endDrag = useCallback(() => { dragOrigin.current = null; setDragging(false); }, []);
  const toggleKernel = (row: number, col: number) => recordDesignedKernel(kernel.map((line, r) => line.map((cell, c) => r === row && c === col ? (cell ? 0 : 1) : cell)));
  useEffect(() => { if (!found || completedRef.current) return; completedRef.current = true; onComplete(); }, [found, onComplete]);
  const handleBoardKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!kernelCorrect) return;
    const delta: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const step = delta[event.key];
    if (!step) return;
    event.preventDefault(); event.stopPropagation();
    const next = { row: clamp(topLeft.row + step[0], 0, WINDOW_LIMIT), col: clamp(topLeft.col + step[1], 0, WINDOW_LIMIT) };
    if (next.row !== topLeft.row || next.col !== topLeft.col) setHasMoved(true);
    setTopLeft(next);
  };

  const windowStyle: CSSProperties = { left: `${topLeft.col * UNIT}%`, top: `${topLeft.row * UNIT}%`, width: `${KERNEL_SIZE * UNIT}%`, height: `${KERNEL_SIZE * UNIT}%` };

  return <ContentBlock shuku-edit-id="e-1d29b9fb-484a-431e-b940-30af3adfe00b" headingLevel={1} className="cg-replay-window-scan" title="根据棋形调整模板" subtitle="先在右侧设置模板，再将左侧窗口移动到棋盘中的合适位置。">
    <div shuku-edit-id="e-297b602e-5804-4492-97c2-02e549aaaa5a" className="cg-replay-window-scan__layout">
      <div shuku-edit-id="e-56626a06-0bce-497b-9231-2f8ecaf46ca2" className="cg-replay-window-scan__board-slot">
        <div shuku-edit-id="e-9077d4c2-910a-4991-8ab7-03fa3eb3223d" ref={boardRef} className="cg-replay-window-scan__board" aria-disabled={!kernelCorrect} data-numeric-board="spp" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col} role="group" aria-label="经过方向变换的十五路棋盘与五乘五模板" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => { const cell = grid[row][col]; const inWindow = row >= topLeft.row && row < topLeft.row + KERNEL_SIZE && col >= topLeft.col && col < topLeft.col + KERNEL_SIZE; const op = inWindow ? kernel[row - topLeft.row][col - topLeft.col] : 0; const hit = inWindow && op === 1 && cell === 1; const ring = Math.min(4, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col))); const classes = ['cg-replay-window-scan__cell', `cg-replay-window-scan__cell--ring-${ring}`, cell === 1 ? 'cg-replay-window-scan__cell--one' : '', cell === -1 ? 'cg-replay-window-scan__cell--minus' : '', inWindow && op === 1 ? 'cg-replay-window-scan__cell--eye' : '', hit ? 'cg-replay-window-scan__cell--hit' : ''].filter(Boolean).join(' '); return <div shuku-edit-id="e-dcadfd70-f3ab-433d-b799-faf56cb1fc9a" key={cellKey(row, col)} className={classes}>{cell !== EMPTY && <Typography shuku-edit-id="e-9479643f-ed50-41d8-a255-bbda16a087db" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}</div>; }))}
          {kernelCorrect && !autoDemo && !hasMoved && !dragging && <NumericBoardDragHint />}
          <div shuku-edit-id="e-33dfd853-7d78-47b8-92a8-4bf3bef4f4db" className={`cg-replay-window-scan__window ${topLeft.row === 0 ? 'is-clamped-top' : ''} ${kernelCorrect ? '' : 'is-locked'}`} style={windowStyle} aria-hidden="true"><span shuku-edit-id="e-1f6ab9e4-e129-43b3-b0c7-c5bfeb7f9a54" className="cg-replay-window-scan__grip"><i shuku-edit-id="e-da14dd83-02a8-4183-924a-a5f45308c801" /><i shuku-edit-id="e-71349297-e03b-4814-b722-2d33c926bf87" /><i shuku-edit-id="e-74a353d3-ca53-44a0-928a-1aa788158c7f" /></span></div>
        </div>
        <ul shuku-edit-id="e-3f8f5698-ef15-45e8-88d8-f2b777a54865" className="cg-replay-window-scan__key"><li shuku-edit-id="e-61a0f1a1-6edf-4da8-8176-8fc6b44fecba" className="cg-replay-window-scan__key-item"><span shuku-edit-id="e-33de3517-dec8-4243-9b7a-90ee3fcf2969" className="cg-replay-window-scan__key-chip cg-replay-window-scan__key-chip--one" aria-hidden="true" /><Typography shuku-edit-id="e-3d8ae10f-8442-4f40-aed2-3133ec2c3e05" as="span" variant="body" tone="muted">橙 = 赢方棋子</Typography></li><li shuku-edit-id="e-4432a423-1cf6-46cb-99d8-ced2d3f37161" className="cg-replay-window-scan__key-item"><span shuku-edit-id="e-0305c32d-d499-4ae4-905a-ef2466d314cf" className="cg-replay-window-scan__key-chip cg-replay-window-scan__key-chip--minus" aria-hidden="true" /><Typography shuku-edit-id="e-d74129ec-9fba-4725-92cf-0d2fa1b46824" as="span" variant="body" tone="muted">深蓝 = 败方棋子</Typography></li></ul>
      </div>
      <div shuku-edit-id="e-f8186d8b-1e02-4b8d-86fb-311a11dac0f9" className="cg-replay-window-scan__panel">
        <div shuku-edit-id="e-fb76ea0b-ebf0-4730-b6e6-79c634f68960" className="cg-replay-window-scan__compare cg-replay-window-scan__compare--kernel-only">
          <div shuku-edit-id="e-089f20b5-be00-445f-af25-58714c045801" className="cg-replay-window-scan__design-heading">
            <span shuku-edit-id="e-b139ff69-2093-453b-81e1-5f2f598da246" className="cg-replay-window-scan__design-icon" aria-hidden="true"><GridNine size="28" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#2F80ED', '#DCEAFF', '#5B8DE8', '#FFFFFF']} /></span>
            <div shuku-edit-id="e-e6ae247b-851e-456b-8449-a15256bfda17">
              <Typography shuku-edit-id="e-91191b06-fe20-46c6-89fb-df7492f51387" as="h2" variant="h2" tone="main">设置模板</Typography>
              <Typography shuku-edit-id="e-9bac3b5b-0c7f-4426-b321-e784e8fc0e3a" as="p" variant="body" tone="muted">点击格子，将目标棋形对应的位置设为 1。</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-3029fc47-ef31-44aa-a5d9-01608c2e06b9" className="cg-replay-window-scan__design-body">
            <AttentionHint className="cg-replay-window-scan__kernel-hint"><div shuku-edit-id="e-a8045942-17c5-4147-958a-f4e652b0c848" className="cg-replay-window-scan__grid cg-replay-window-scan__grid--editable" role="group" aria-label="可点击编辑的卷积核">{KERNEL_INDEX.map((r) => KERNEL_INDEX.map((c) => { const cell = kernel[r][c]; const preview = hovered?.row === r && hovered?.col === c; const shown = preview ? (cell ? 0 : 1) : cell; return <button shuku-edit-id="e-94e79ded-2c51-4593-a7e0-2428e240e8ba" key={cellKey(r, c)} type="button" className={['cg-replay-window-scan__grid-cell', shown === 1 ? 'cg-replay-window-scan__grid-cell--one' : '', preview ? 'is-preview' : ''].filter(Boolean).join(' ')} onMouseEnter={() => setHovered({ row: r, col: c })} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered({ row: r, col: c })} onBlur={() => setHovered(null)} onClick={() => toggleKernel(r, c)} aria-label={`第 ${r + 1} 行第 ${c + 1} 列，当前为 ${cell}，点击改为 ${cell ? 0 : 1}`}><Typography shuku-edit-id="e-6282722c-d5c2-4bbc-9b31-09c365f8ce26" as="span" variant="body" tone={shown === 0 ? 'muted' : 'inherit'}>{shown}</Typography></button>; }))}</div></AttentionHint>
            <div shuku-edit-id="e-3c82f6d2-b3cf-4041-9760-a39542d13f73" className="cg-replay-window-scan__design-help">
            <span shuku-edit-id="e-ef86d320-a902-4258-a021-fdf688d2b03d" className="cg-replay-window-scan__design-help-icon" aria-hidden="true"><ClickTap size="30" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#F57C00', '#FFFFFF', '#173B7A', '#F57C00']} /></span>
            <Typography shuku-edit-id="e-b8a0d2bb-8f84-4f68-bbc4-eb5274ed9040" as="span" variant="body" tone="muted">点击切换 0 / 1</Typography>
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-4cf2d989-b85a-4b16-9dd1-a06ebad604f5" className="cg-replay-window-scan__result cg-replay-window-scan__result-card">
          <div shuku-edit-id="e-25d96285-3d51-4993-9ac4-a7bbe40b44b3" className="cg-replay-window-scan__design-score"><Typography shuku-edit-id="e-2c216e7a-1b44-437a-81b0-057563358c26" as="span" variant="h3" tone="muted">当前匹配</Typography><Typography shuku-edit-id="e-9128eb29-7027-48d8-8166-55eb6628670b" as="strong" variant="display" tone={kernelCorrect ? 'success' : 'main'}>{Math.max(0, Math.min(5, value))}</Typography><Typography shuku-edit-id="e-4d344057-dd52-4bc7-bfe4-6d8c74818296" as="span" variant="h3" tone="muted">/ 5</Typography><div shuku-edit-id="e-f8cc5dc8-ad62-45be-b9c9-4d89e032f1d0" className="cg-replay-window-scan__progress" aria-label={`当前匹配 ${Math.max(0, value)} / 5`}><span shuku-edit-id="e-e2c7efce-2c98-4e64-8d42-8199aa51570e" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></div></div>
          <div shuku-edit-id="e-f1221714-15d6-4c2e-bce1-5223a86cc39a" className="cg-replay-window-scan__design-feedback" role="status"><Move size="24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /><Typography shuku-edit-id="e-eb87401c-d382-4c49-92d8-de0e5c5742c8" as="span" variant="body" tone="muted">将模板移动到合适位置，使其与目标棋形尽可能一致。</Typography></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
