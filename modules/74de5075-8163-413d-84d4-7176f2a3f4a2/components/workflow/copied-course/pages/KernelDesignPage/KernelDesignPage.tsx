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

export interface KernelDesignPageProps { onComplete: () => void; }

export function KernelDesignPage({ onComplete }: KernelDesignPageProps) {
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

  return <ContentBlock shuku-edit-id="e-2dc5a0e6-09c0-48ab-a63c-253488b33054" headingLevel={1} className="spp-copy-window-scan" title="根据棋形调整模板" subtitle="先在右侧设置模板，再将左侧窗口移动到棋盘中的合适位置。">
    <div shuku-edit-id="e-04d2820b-bfd6-4df7-af02-65631cd1934f" className="spp-copy-window-scan__layout">
      <div shuku-edit-id="e-f1b30f84-92e5-4b15-af2c-55db19d31ac6" className="spp-copy-window-scan__board-slot">
        <div shuku-edit-id="e-f7eb1f48-578b-4b51-8827-392be16c606f" ref={boardRef} className="spp-copy-window-scan__board" aria-disabled={!kernelCorrect} data-numeric-board="spp" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col} role="group" aria-label="经过方向变换的十五路棋盘与五乘五模板" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => { const cell = grid[row][col]; const inWindow = row >= topLeft.row && row < topLeft.row + KERNEL_SIZE && col >= topLeft.col && col < topLeft.col + KERNEL_SIZE; const op = inWindow ? kernel[row - topLeft.row][col - topLeft.col] : 0; const hit = inWindow && op === 1 && cell === 1; const ring = Math.min(4, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col))); const classes = ['spp-copy-window-scan__cell', `spp-copy-window-scan__cell--ring-${ring}`, cell === 1 ? 'spp-copy-window-scan__cell--one' : '', cell === -1 ? 'spp-copy-window-scan__cell--minus' : '', inWindow && op === 1 ? 'spp-copy-window-scan__cell--eye' : '', hit ? 'spp-copy-window-scan__cell--hit' : ''].filter(Boolean).join(' '); return <div shuku-edit-id="e-c9e91b9d-89f3-463e-b845-be3dc564d028" key={cellKey(row, col)} className={classes}>{cell !== EMPTY && <Typography shuku-edit-id="e-8bf46952-3fc5-451c-8a2a-212961f8539f" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}</div>; }))}
          {kernelCorrect && !hasMoved && !dragging && <NumericBoardDragHint />}
          <div shuku-edit-id="e-340ccae6-7256-45e6-b8f8-478a7cdf41c1" className={`spp-copy-window-scan__window ${topLeft.row === 0 ? 'is-clamped-top' : ''} ${kernelCorrect ? '' : 'is-locked'}`} style={windowStyle} aria-hidden="true"><span shuku-edit-id="e-2b504016-ea61-4f4a-aac7-f5b3d7593066" className="spp-copy-window-scan__grip"><i shuku-edit-id="e-dc711465-7a6c-447b-866f-ad0cc8ddc369" /><i shuku-edit-id="e-71ee5345-8b08-4c9a-80e2-863da53d7a42" /><i shuku-edit-id="e-fc5fd1db-f810-474f-ad72-bd79010c5812" /></span></div>
        </div>
        <ul shuku-edit-id="e-e7e7479c-fdfb-498f-9d0d-ce729629cd83" className="spp-copy-window-scan__key"><li shuku-edit-id="e-9ca40063-ebd9-49ae-b731-4a8df608ba64" className="spp-copy-window-scan__key-item"><span shuku-edit-id="e-0f61538c-66ab-4502-8e71-2b9be42215c8" className="spp-copy-window-scan__key-chip spp-copy-window-scan__key-chip--one" aria-hidden="true" /><Typography shuku-edit-id="e-2ace6895-881b-434a-ac6a-f17aa1b06e6a" as="span" variant="body" tone="muted">橙 = 赢方棋子</Typography></li><li shuku-edit-id="e-fbfe32b0-7ad7-486a-850a-494301637dd0" className="spp-copy-window-scan__key-item"><span shuku-edit-id="e-9ef6f9bf-1258-40d0-8ab8-23a0eaf43399" className="spp-copy-window-scan__key-chip spp-copy-window-scan__key-chip--minus" aria-hidden="true" /><Typography shuku-edit-id="e-42782935-0e6d-468c-b5f6-1daca94031c9" as="span" variant="body" tone="muted">深蓝 = 败方棋子</Typography></li></ul>
      </div>
      <div shuku-edit-id="e-b9b5a949-bc40-40c0-ae1b-57af39b07595" className="spp-copy-window-scan__panel">
        <div shuku-edit-id="e-f326f25f-92ec-4808-ab0d-b9d59a95adcc" className="spp-copy-window-scan__compare spp-copy-window-scan__compare--kernel-only">
          <div shuku-edit-id="e-a05c8870-35f4-4080-affb-fff3b24c7377" className="spp-copy-window-scan__design-heading">
            <span shuku-edit-id="e-9113eac8-9775-4722-b8e2-2016cb34d74e" className="spp-copy-window-scan__design-icon" aria-hidden="true"><GridNine size="28" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#2F80ED', '#DCEAFF', '#5B8DE8', '#FFFFFF']} /></span>
            <div shuku-edit-id="e-bec52d60-fb42-40b6-90dc-b49069a95280">
              <Typography shuku-edit-id="e-95f62591-acf4-450f-9a5f-3f583774e603" as="h2" variant="h2" tone="main">设置模板</Typography>
              <Typography shuku-edit-id="e-4922ac58-d4b1-45a3-949a-e1abf0e5766a" as="p" variant="body" tone="muted">点击格子，将目标棋形对应的位置设为 1。</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-374ff33b-91f6-437e-b6a5-330762728ddb" className="spp-copy-window-scan__design-body">
            <AttentionHint className="spp-copy-window-scan__kernel-hint"><div shuku-edit-id="e-aa8e4644-00d6-4e78-b8a3-5e4e84c6fa4a" className="spp-copy-window-scan__grid spp-copy-window-scan__grid--editable" role="group" aria-label="可点击编辑的卷积核">{KERNEL_INDEX.map((r) => KERNEL_INDEX.map((c) => { const cell = kernel[r][c]; const preview = hovered?.row === r && hovered?.col === c; const shown = preview ? (cell ? 0 : 1) : cell; return <button shuku-edit-id="e-2f371250-7b60-41fc-86ff-9e2de0d64edd" key={cellKey(r, c)} type="button" className={['spp-copy-window-scan__grid-cell', shown === 1 ? 'spp-copy-window-scan__grid-cell--one' : '', preview ? 'is-preview' : ''].filter(Boolean).join(' ')} onMouseEnter={() => setHovered({ row: r, col: c })} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered({ row: r, col: c })} onBlur={() => setHovered(null)} onClick={() => toggleKernel(r, c)} aria-label={`第 ${r + 1} 行第 ${c + 1} 列，当前为 ${cell}，点击改为 ${cell ? 0 : 1}`}><Typography shuku-edit-id="e-0190480e-80ac-4392-a928-fcab0319ff1f" as="span" variant="body" tone={shown === 0 ? 'muted' : 'inherit'}>{shown}</Typography></button>; }))}</div></AttentionHint>
            <div shuku-edit-id="e-b6e2b39a-c9e0-44cf-857f-b5bd9a71268c" className="spp-copy-window-scan__design-help">
            <span shuku-edit-id="e-dc86fcc5-bff6-493d-ba21-dabc4a615898" className="spp-copy-window-scan__design-help-icon" aria-hidden="true"><ClickTap size="30" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#F57C00', '#FFFFFF', '#173B7A', '#F57C00']} /></span>
            <Typography shuku-edit-id="e-33ff7b76-9fa0-40d3-a4c6-3f70d6959907" as="span" variant="body" tone="muted">点击切换 0 / 1</Typography>
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-a086a8a6-3215-4737-ab4a-973cae851019" className="spp-copy-window-scan__result spp-copy-window-scan__result-card">
          <div shuku-edit-id="e-91642042-80f5-4111-9d98-15e628723a3d" className="spp-copy-window-scan__design-score"><Typography shuku-edit-id="e-9a71431e-d43b-4f63-8d1d-5502983dcc7d" as="span" variant="h3" tone="muted">当前匹配</Typography><Typography shuku-edit-id="e-02f21ea0-75cb-41e9-8cff-d3106128e05a" as="strong" variant="display" tone={kernelCorrect ? 'success' : 'main'}>{Math.max(0, Math.min(5, value))}</Typography><Typography shuku-edit-id="e-568a383e-4a07-4cdc-aac9-0bc0a7f6d29a" as="span" variant="h3" tone="muted">/ 5</Typography><div shuku-edit-id="e-14f27a35-49f4-4545-b3ee-29f3579d5c6e" className="spp-copy-window-scan__progress" aria-label={`当前匹配 ${Math.max(0, value)} / 5`}><span shuku-edit-id="e-1eda5eef-4b5f-4d89-8374-ec64480d69ec" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></div></div>
          <div shuku-edit-id="e-aa278c63-34fa-4863-8a8d-caae49a817d9" className="spp-copy-window-scan__design-feedback" role="status"><Move size="24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /><Typography shuku-edit-id="e-a45ae808-c719-406e-bf7b-9e05526a1efd" as="span" variant="body" tone="muted">将模板移动到合适位置，使其与目标棋形尽可能一致。</Typography></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
