import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NumericBoardDragHint } from '../../../../../../NumericBoardDragHint';
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

  return <ContentBlock shuku-edit-id="e-c67ffa7e-bef4-4347-bb39-605ed2bef468" headingLevel={1} className="spp-replay-window-scan" title="根据棋形调整模板" subtitle="先在右侧设置模板，再将左侧窗口移动到棋盘中的合适位置。">
    <div shuku-edit-id="e-7c3802e4-423e-4e3d-9072-255f1dc51ede" className="spp-replay-window-scan__layout">
      <div shuku-edit-id="e-d1d44acf-5134-4a0f-a3ec-e233bbedebb3" className="spp-replay-window-scan__board-slot">
        <div shuku-edit-id="e-06a86836-8718-4520-919a-ca507627ee3d" ref={boardRef} className="spp-replay-window-scan__board" aria-disabled={!kernelCorrect} data-numeric-board="spp" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col} role="group" aria-label="经过方向变换的十五路棋盘与五乘五模板" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => { const cell = grid[row][col]; const inWindow = row >= topLeft.row && row < topLeft.row + KERNEL_SIZE && col >= topLeft.col && col < topLeft.col + KERNEL_SIZE; const op = inWindow ? kernel[row - topLeft.row][col - topLeft.col] : 0; const hit = inWindow && op === 1 && cell === 1; const ring = Math.min(4, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col))); const classes = ['spp-replay-window-scan__cell', `spp-replay-window-scan__cell--ring-${ring}`, cell === 1 ? 'spp-replay-window-scan__cell--one' : '', cell === -1 ? 'spp-replay-window-scan__cell--minus' : '', inWindow && op === 1 ? 'spp-replay-window-scan__cell--eye' : '', hit ? 'spp-replay-window-scan__cell--hit' : ''].filter(Boolean).join(' '); return <div shuku-edit-id="e-1df55825-01e4-4b63-a196-b169fdb9d08c" key={cellKey(row, col)} className={classes}>{cell !== EMPTY && <Typography shuku-edit-id="e-9de39632-9a6d-4f52-afe8-0961967656f3" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}</div>; }))}
          {kernelCorrect && !autoDemo && !hasMoved && !dragging && <NumericBoardDragHint />}
          <div shuku-edit-id="e-5e85faeb-2673-4998-9721-e069f3e1dc62" className={`spp-replay-window-scan__window ${topLeft.row === 0 ? 'is-clamped-top' : ''} ${kernelCorrect ? '' : 'is-locked'}`} style={windowStyle} aria-hidden="true"><span shuku-edit-id="e-dccd0a85-d772-4542-af69-01ec94a6d4ed" className="spp-replay-window-scan__grip"><i shuku-edit-id="e-ad36ecbf-cdf0-42a4-b497-4c781b3086e1" /><i shuku-edit-id="e-d7db77ca-1d44-40ae-b828-aae86a75c153" /><i shuku-edit-id="e-093babde-e75c-4e01-be97-67784915f16c" /></span></div>
        </div>
        <ul shuku-edit-id="e-f6a4088b-d433-47ac-bef9-dba0415223ea" className="spp-replay-window-scan__key"><li shuku-edit-id="e-36ad100c-672a-4640-a19c-a5741def057a" className="spp-replay-window-scan__key-item"><span shuku-edit-id="e-40d46024-d28e-4d8b-9dc9-dccf8c7aad3d" className="spp-replay-window-scan__key-chip spp-replay-window-scan__key-chip--one" aria-hidden="true" /><Typography shuku-edit-id="e-5646b5ef-bf60-4663-a0ab-cc13872bf820" as="span" variant="body" tone="muted">橙 = 赢方棋子</Typography></li><li shuku-edit-id="e-18defe46-51ba-4d12-b32d-8715c142d827" className="spp-replay-window-scan__key-item"><span shuku-edit-id="e-253a0cad-3a9c-4bba-8e1e-a3158cfc3505" className="spp-replay-window-scan__key-chip spp-replay-window-scan__key-chip--minus" aria-hidden="true" /><Typography shuku-edit-id="e-2f67e37a-7d3f-4862-a5e5-a7eaf05588a9" as="span" variant="body" tone="muted">深蓝 = 败方棋子</Typography></li></ul>
      </div>
      <div shuku-edit-id="e-68f5315c-18fd-4e4a-9a4f-767a23bd6b2e" className="spp-replay-window-scan__panel">
        <div shuku-edit-id="e-ef477872-dd19-49e9-b7fc-f541323bb81f" className="spp-replay-window-scan__compare spp-replay-window-scan__compare--kernel-only">
          <div shuku-edit-id="e-241a2872-8139-4469-99b4-0ed9061b23c4" className="spp-replay-window-scan__design-heading">
            <span shuku-edit-id="e-be2da5d8-6da0-4219-8840-a717b3b357f6" className="spp-replay-window-scan__design-icon" aria-hidden="true"><GridNine size="28" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#2F80ED', '#DCEAFF', '#5B8DE8', '#FFFFFF']} /></span>
            <div shuku-edit-id="e-46a5b27f-1f9e-4a19-bcf4-c7a467a6073d">
              <Typography shuku-edit-id="e-0ad70ba3-b6c6-49d7-9a66-092433d75149" as="h2" variant="h2" tone="main">设置模板</Typography>
              <Typography shuku-edit-id="e-8e719c7c-6446-48c5-8292-638ed5983bd3" as="p" variant="body" tone="muted">点击格子，将目标棋形对应的位置设为 1。</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-b28332a9-17fc-4e1d-96fc-09c60aebb270" className="spp-replay-window-scan__design-body">
            <AttentionHint className="spp-replay-window-scan__kernel-hint"><div shuku-edit-id="e-a95f9f4d-2564-4eac-a835-031ab0744932" className="spp-replay-window-scan__grid spp-replay-window-scan__grid--editable" role="group" aria-label="可点击编辑的卷积核">{KERNEL_INDEX.map((r) => KERNEL_INDEX.map((c) => { const cell = kernel[r][c]; const preview = hovered?.row === r && hovered?.col === c; const shown = preview ? (cell ? 0 : 1) : cell; return <button shuku-edit-id="e-9d1cbb48-cb22-419f-8cc5-fe93be515cc5" key={cellKey(r, c)} type="button" className={['spp-replay-window-scan__grid-cell', shown === 1 ? 'spp-replay-window-scan__grid-cell--one' : '', preview ? 'is-preview' : ''].filter(Boolean).join(' ')} onMouseEnter={() => setHovered({ row: r, col: c })} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered({ row: r, col: c })} onBlur={() => setHovered(null)} onClick={() => toggleKernel(r, c)} aria-label={`第 ${r + 1} 行第 ${c + 1} 列，当前为 ${cell}，点击改为 ${cell ? 0 : 1}`}><Typography shuku-edit-id="e-7405bb51-a714-467b-b2be-bf1bd8768ec2" as="span" variant="body" tone={shown === 0 ? 'muted' : 'inherit'}>{shown}</Typography></button>; }))}</div></AttentionHint>
            <div shuku-edit-id="e-6931679a-fd96-4c38-8897-2aa6ee70fd33" className="spp-replay-window-scan__design-help">
            <span shuku-edit-id="e-6f0e1128-6f6a-4085-b783-9efb1aa77733" className="spp-replay-window-scan__design-help-icon" aria-hidden="true"><ClickTap size="30" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#F57C00', '#FFFFFF', '#173B7A', '#F57C00']} /></span>
            <Typography shuku-edit-id="e-1628d1e8-52a9-4e91-bd44-6348b3459f27" as="span" variant="body" tone="muted">点击切换 0 / 1</Typography>
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-26c7d509-c1c2-42e3-a772-e071cc1b6142" className="spp-replay-window-scan__result spp-replay-window-scan__result-card">
          <div shuku-edit-id="e-1acdf5ca-a1f8-488d-bc71-1c77cadf0d80" className="spp-replay-window-scan__design-score"><Typography shuku-edit-id="e-e5e7daf1-89e8-40fd-a648-7d24634c0aaa" as="span" variant="h3" tone="muted">当前匹配</Typography><Typography shuku-edit-id="e-776aa134-7f54-4fd0-9965-19f896cb29d9" as="strong" variant="display" tone={kernelCorrect ? 'success' : 'main'}>{Math.max(0, Math.min(5, value))}</Typography><Typography shuku-edit-id="e-9e19f69d-3cb2-44a2-b318-2ff5c9fafa70" as="span" variant="h3" tone="muted">/ 5</Typography><div shuku-edit-id="e-f4cecc07-dddd-4b0f-80b1-8c893f3a351d" className="spp-replay-window-scan__progress" aria-label={`当前匹配 ${Math.max(0, value)} / 5`}><span shuku-edit-id="e-9baf0171-b45f-418d-89a6-30e17803caff" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></div></div>
          <div shuku-edit-id="e-5f624764-4a22-4457-9e95-48071dca4a73" className="spp-replay-window-scan__design-feedback" role="status"><Move size="24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /><Typography shuku-edit-id="e-73c0e069-0752-4754-9d0a-6df3a25044ff" as="span" variant="body" tone="muted">将模板移动到合适位置，使其与目标棋形尽可能一致。</Typography></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
