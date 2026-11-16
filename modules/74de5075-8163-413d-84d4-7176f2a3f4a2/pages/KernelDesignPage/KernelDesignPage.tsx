import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NumericBoardDragHint } from '../../components/NumericBoardDragHint';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ClickTap, GridNine, Move } from '@icon-park/react';
import { AttentionHint, ContentBlock, Typography } from "@shuku/course-style/react";
import { useGomokuOutcome } from '../../ShowcaseGomokuContext';
import { BOARD_SIZE, EMPTY, type Board, type Cell } from '../../showcaseGomokuEngine';
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
  const { outcome } = useGomokuOutcome();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragOrigin = useRef<{ cell: Cell; topLeft: Cell } | null>(null);
  const completedRef = useRef(false);
  const transform = useMemo(() => transformFor(outcome.winLine), [outcome.winLine]);
  const targetKernel = useMemo(() => kernelForLine(outcome.winLine.map((cell) => toDisplayCell(cell, transform))), [outcome.winLine, transform]);
  const displayBoard = useMemo(() => toDisplayBoard(outcome.board, transform), [outcome.board, transform]);
  const grid = useMemo(() => toNumberGrid(displayBoard, outcome.winner), [displayBoard, outcome.winner]);
  const centre = useMemo(() => windowCentre(outcome.winLine.map((cell) => toDisplayCell(cell, transform))), [outcome.winLine, transform]);
  const [kernel, setKernel] = useState(() => EMPTY_KERNEL.map(row => [...row]));
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
  const toggleKernel = (row: number, col: number) => setKernel(kernel.map((line, r) => line.map((cell, c) => r === row && c === col ? (cell ? 0 : 1) : cell)));
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

  return <ContentBlock shuku-edit-id="e-4b46cf0d-1f27-42d0-a890-e2fd2ac201b1" headingLevel={1} className="spp-showcase-kernel-design" title="根据棋形调整模板" subtitle="先在右侧设置模板，再将左侧窗口移动到棋盘中的合适位置。">
    <div shuku-edit-id="e-075a8f2d-0946-4949-a540-c91ab4147b89" className="spp-showcase-kernel-design__layout">
      <div shuku-edit-id="e-6c516055-1409-4171-824c-8a1a638108b1" className="spp-showcase-kernel-design__board-slot">
        <div shuku-edit-id="e-5445dba2-094c-4325-b189-20cdee119f4b" ref={boardRef} className="spp-showcase-kernel-design__board" aria-disabled={!kernelCorrect} data-numeric-board="spp" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col} role="group" aria-label="经过方向变换的十五路棋盘与五乘五模板" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => { const cell = grid[row][col]; const inWindow = row >= topLeft.row && row < topLeft.row + KERNEL_SIZE && col >= topLeft.col && col < topLeft.col + KERNEL_SIZE; const op = inWindow ? kernel[row - topLeft.row][col - topLeft.col] : 0; const hit = inWindow && op === 1 && cell === 1; const ring = Math.min(4, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col))); const classes = ['spp-showcase-kernel-design__cell', `spp-showcase-kernel-design__cell--ring-${ring}`, cell === 1 ? 'spp-showcase-kernel-design__cell--one' : '', cell === -1 ? 'spp-showcase-kernel-design__cell--minus' : '', inWindow && op === 1 ? 'spp-showcase-kernel-design__cell--eye' : '', hit ? 'spp-showcase-kernel-design__cell--hit' : ''].filter(Boolean).join(' '); return <div shuku-edit-id="e-7cc9d1e5-1d3d-4126-ade8-517b70cee8c4" key={cellKey(row, col)} className={classes}>{cell !== EMPTY && <Typography shuku-edit-id="e-ba5dadae-e3f4-43bc-99ba-4e31d4f45179" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}</div>; }))}
          {kernelCorrect && !hasMoved && !dragging && <NumericBoardDragHint />}
          <div shuku-edit-id="e-f4428edc-611a-41c9-a1c7-ba33e0fbf4d9" className={`spp-showcase-kernel-design__window ${topLeft.row === 0 ? 'is-clamped-top' : ''} ${kernelCorrect ? '' : 'is-locked'}`} style={windowStyle} aria-hidden="true"><span shuku-edit-id="e-e088cc24-ebda-4450-9c8a-81f91299c79f" className="spp-showcase-kernel-design__grip"><i shuku-edit-id="e-f94c37b6-bff9-4d94-aca6-c7d7e5f88a0b" /><i shuku-edit-id="e-d6d0b6ea-d088-46b0-ad2f-34340a7c5db8" /><i shuku-edit-id="e-3d474f6f-b6f8-4737-9da6-7cce1cd2ceac" /></span></div>
        </div>
        <ul shuku-edit-id="e-c3766c99-675a-424a-9980-1924b2d85e54" className="spp-showcase-kernel-design__key"><li shuku-edit-id="e-a82a3ace-2157-4019-b8af-ea9e2341723c" className="spp-showcase-kernel-design__key-item"><span shuku-edit-id="e-1f33302f-5d05-46c5-868e-af0e4edf2bdc" className="spp-showcase-kernel-design__key-chip spp-showcase-kernel-design__key-chip--one" aria-hidden="true" /><Typography shuku-edit-id="e-df44a56a-7a70-477c-b4f4-a1ee034fb934" as="span" variant="body" tone="muted">橙 = 赢方棋子</Typography></li><li shuku-edit-id="e-aa14e9d5-77fc-466f-8b9b-f11ddf1cc98f" className="spp-showcase-kernel-design__key-item"><span shuku-edit-id="e-c33eab93-7d69-49f9-a8e2-f204ad24390f" className="spp-showcase-kernel-design__key-chip spp-showcase-kernel-design__key-chip--minus" aria-hidden="true" /><Typography shuku-edit-id="e-247a5cee-a5d2-4aa9-9f08-bf419b6930a6" as="span" variant="body" tone="muted">深蓝 = 败方棋子</Typography></li></ul>
      </div>
      <div shuku-edit-id="e-80084dcb-ca1d-4f65-b625-151115117aa3" className="spp-showcase-kernel-design__panel">
        <div shuku-edit-id="e-fa04da98-e00d-4507-8ea5-4dcf8db0e23a" className="spp-showcase-kernel-design__compare spp-showcase-kernel-design__compare--kernel-only">
          <div shuku-edit-id="e-082d4d45-804d-45d9-b1ce-e8544ce5a123" className="spp-showcase-kernel-design__design-heading">
            <span shuku-edit-id="e-8dfdf889-0675-4610-9142-9949cb38728c" className="spp-showcase-kernel-design__design-icon" aria-hidden="true"><GridNine size="28" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#2F80ED', '#DCEAFF', '#5B8DE8', '#FFFFFF']} /></span>
            <div shuku-edit-id="e-fe52312f-a650-40a5-8c81-17d2025d9a87">
              <Typography shuku-edit-id="e-08af1513-9e93-40bf-a50c-02f6e74881ff" as="h2" variant="h2" tone="main">设置模板</Typography>
              <Typography shuku-edit-id="e-4fa34cb5-fc5b-4eae-9140-297fb4705e46" as="p" variant="body" tone="muted">点击格子，将目标棋形对应的位置设为 1。</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-0fe2f0e0-1c28-4248-b8b7-232bd08529ac" className="spp-showcase-kernel-design__design-body">
            <AttentionHint className="spp-showcase-kernel-design__kernel-hint"><div shuku-edit-id="e-17f67141-cc26-485f-9fa6-9ab8df4e4d08" className="spp-showcase-kernel-design__grid spp-showcase-kernel-design__grid--editable" role="group" aria-label="可点击编辑的卷积核">{KERNEL_INDEX.map((r) => KERNEL_INDEX.map((c) => { const cell = kernel[r][c]; const preview = hovered?.row === r && hovered?.col === c; const shown = cell; return <button shuku-edit-id="e-2d2c1431-2551-4bad-8a1a-a800bb85c2cf" key={cellKey(r, c)} type="button" className={['spp-showcase-kernel-design__grid-cell', shown === 1 ? 'spp-showcase-kernel-design__grid-cell--one' : '', preview ? 'is-preview' : ''].filter(Boolean).join(' ')} onMouseEnter={() => setHovered({ row: r, col: c })} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered({ row: r, col: c })} onBlur={() => setHovered(null)} onClick={() => toggleKernel(r, c)} aria-label={`第 ${r + 1} 行第 ${c + 1} 列，当前为 ${cell}，点击改为 ${cell ? 0 : 1}`}><Typography shuku-edit-id="e-d4ae74c9-6e5b-46f1-8ed2-8f6c2410dfba" as="span" variant="body" tone={shown === 0 ? 'muted' : 'inherit'}>{shown}</Typography></button>; }))}</div></AttentionHint>
            <div shuku-edit-id="e-7c26cda8-68b2-445a-8b70-bb56ab5507ea" className="spp-showcase-kernel-design__design-help">
            <span shuku-edit-id="e-3b416eb5-5dcb-49f7-add0-f06cdb230aa2" className="spp-showcase-kernel-design__design-help-icon" aria-hidden="true"><ClickTap size="30" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#F57C00', '#FFFFFF', '#173B7A', '#F57C00']} /></span>
            <Typography shuku-edit-id="e-8f25b77a-f035-4a52-9a5f-84730747add3" as="span" variant="body" tone="muted">点击切换 0 / 1</Typography>
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-a7519a5c-1c2b-4feb-80c4-b99876710c2b" className="spp-showcase-kernel-design__result spp-showcase-kernel-design__result-card">
          <div shuku-edit-id="e-fde27a27-3c41-46b6-bcfe-20db33596c8b" className="spp-showcase-kernel-design__design-score"><Typography shuku-edit-id="e-92301e33-f053-48aa-82d0-a4163c951805" as="span" variant="h3" tone="muted">当前匹配</Typography><Typography shuku-edit-id="e-ba504bb1-2f6f-4fd9-9fd1-acfbc8dd2616" as="strong" variant="display" tone={kernelCorrect ? 'success' : 'main'}>{Math.max(0, Math.min(5, value))}</Typography><Typography shuku-edit-id="e-54223de5-94ed-4417-bc91-338da2968c1d" as="span" variant="h3" tone="muted">/ 5</Typography><div shuku-edit-id="e-153de85b-a43c-4a1c-8efa-14eed5d5c1b3" className="spp-showcase-kernel-design__progress" aria-label={`当前匹配 ${Math.max(0, value)} / 5`}><span shuku-edit-id="e-9f3aba90-1efc-4478-918e-dd8bdd076395" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></div></div>
          <div shuku-edit-id="e-4a9a5bd5-e63e-4e76-a915-292965c85832" className="spp-showcase-kernel-design__design-feedback" role="status"><Move size="24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /><Typography shuku-edit-id="e-0c783ad6-16f7-46bb-87be-63bfbef097ff" as="span" variant="body" tone="muted">将模板移动到合适位置，使其与目标棋形尽可能一致。</Typography></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
