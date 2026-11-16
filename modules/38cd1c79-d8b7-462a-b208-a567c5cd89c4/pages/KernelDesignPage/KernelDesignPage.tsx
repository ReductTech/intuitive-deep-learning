import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NumericBoardDragHint } from '../../components/NumericBoardDragHint';
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

  return <ContentBlock shuku-edit-id="e-741aab69-3e87-46aa-8429-839708a76f7b" headingLevel={1} className="cki-window-scan" title="根据棋形调整模板" subtitle="先在右侧设置模板，再将左侧窗口移动到棋盘中的合适位置。">
    <div shuku-edit-id="e-3dcb4a28-241c-4ec6-9dda-e529acaa0dcc" className="cki-window-scan__layout">
      <div shuku-edit-id="e-93f15227-dd39-45bc-834d-1b98861f3482" className="cki-window-scan__board-slot">
        <div shuku-edit-id="e-3c2178f5-c764-4638-9af7-1f5884652a7e" ref={boardRef} className="cki-window-scan__board" aria-disabled={!kernelCorrect} data-numeric-board="cki" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col} role="group" aria-label="经过方向变换的十五路棋盘与五乘五模板" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => { const cell = grid[row][col]; const inWindow = row >= topLeft.row && row < topLeft.row + KERNEL_SIZE && col >= topLeft.col && col < topLeft.col + KERNEL_SIZE; const op = inWindow ? kernel[row - topLeft.row][col - topLeft.col] : 0; const hit = inWindow && op === 1 && cell === 1; const ring = Math.min(4, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col))); const classes = ['cki-window-scan__cell', `cki-window-scan__cell--ring-${ring}`, cell === 1 ? 'cki-window-scan__cell--one' : '', cell === -1 ? 'cki-window-scan__cell--minus' : '', inWindow && op === 1 ? 'cki-window-scan__cell--eye' : '', hit ? 'cki-window-scan__cell--hit' : ''].filter(Boolean).join(' '); return <div shuku-edit-id="e-daf74071-df23-41b9-b7b7-35cb3885e412" key={cellKey(row, col)} className={classes}>{cell !== EMPTY && <Typography shuku-edit-id="e-81330856-a46b-4eff-994c-2504659c157a" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}</div>; }))}
          {kernelCorrect && !hasMoved && !dragging && <NumericBoardDragHint />}
          <div shuku-edit-id="e-b900b7e1-5bb8-4787-8fae-bf62facd6c14" className={`cki-window-scan__window ${topLeft.row === 0 ? 'is-clamped-top' : ''} ${kernelCorrect ? '' : 'is-locked'}`} style={windowStyle} aria-hidden="true"><span shuku-edit-id="e-d53fd9a0-ce10-4ad3-9244-d7d497f2801a" className="cki-window-scan__grip"><i shuku-edit-id="e-03ee4451-3544-4c32-84b7-0f5fb09e6854" /><i shuku-edit-id="e-a8242967-49de-4a28-909f-98ce4348dec2" /><i shuku-edit-id="e-55ce697f-e808-41ee-8e13-d902bedae917" /></span></div>
        </div>
        <ul shuku-edit-id="e-79749670-76c8-424c-b9c0-c37e93391722" className="cki-window-scan__key"><li shuku-edit-id="e-cd87e3a0-eb29-456b-9cb9-22229834cf02" className="cki-window-scan__key-item"><span shuku-edit-id="e-231a0f1c-8395-4070-97ae-13b268f391cc" className="cki-window-scan__key-chip cki-window-scan__key-chip--one" aria-hidden="true" /><Typography shuku-edit-id="e-2ebc1f25-6248-45a6-ae90-945a380c7ec1" as="span" variant="body" tone="muted">橙 = 赢方棋子</Typography></li><li shuku-edit-id="e-34fc553e-3ed6-44ca-b36f-b9ccc2cb6fc7" className="cki-window-scan__key-item"><span shuku-edit-id="e-8339ca88-05bf-4ce6-a255-04eaf8d96461" className="cki-window-scan__key-chip cki-window-scan__key-chip--minus" aria-hidden="true" /><Typography shuku-edit-id="e-4bcad652-e251-4270-8235-9eb3d1e93211" as="span" variant="body" tone="muted">深蓝 = 败方棋子</Typography></li></ul>
      </div>
      <div shuku-edit-id="e-82bfad09-a63d-4d5e-a331-964b57fdc154" className="cki-window-scan__panel">
        <div shuku-edit-id="e-96d6cb78-8e42-45ce-be47-70bdb4e7ccde" className="cki-window-scan__compare cki-window-scan__compare--kernel-only">
          <div shuku-edit-id="e-ad2c18a6-b9af-41e0-811d-1b69526d8b77" className="cki-window-scan__design-heading">
            <span shuku-edit-id="e-2ca0a5fe-64d8-44e6-abe6-425b4ddbb329" className="cki-window-scan__design-icon" aria-hidden="true"><GridNine size="28" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#2F80ED', '#DCEAFF', '#5B8DE8', '#FFFFFF']} /></span>
            <div shuku-edit-id="e-fa46447f-eceb-4919-aad0-6863e482a8bf">
              <Typography shuku-edit-id="e-3f3fee33-52e2-41f8-9245-c7919af45b59" as="h2" variant="h2" tone="main">设置模板</Typography>
              <Typography shuku-edit-id="e-df5c3f24-0c7c-4cc0-8d1d-e6f8aba1fc90" as="p" variant="body" tone="muted">点击格子，将目标棋形对应的位置设为 1。</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-3e5ded92-16cf-49e1-98cc-17d4c1403e9d" className="cki-window-scan__design-body">
            <AttentionHint className="cki-window-scan__kernel-hint"><div shuku-edit-id="e-58082777-e0da-4476-ae68-b3f101c5adf0" className="cki-window-scan__grid cki-window-scan__grid--editable" role="group" aria-label="可点击编辑的卷积核">{KERNEL_INDEX.map((r) => KERNEL_INDEX.map((c) => { const cell = kernel[r][c]; const preview = hovered?.row === r && hovered?.col === c; const shown = preview ? (cell ? 0 : 1) : cell; return <button shuku-edit-id="e-3845cf81-16a8-41c7-af00-036a97690726" key={cellKey(r, c)} type="button" className={['cki-window-scan__grid-cell', shown === 1 ? 'cki-window-scan__grid-cell--one' : '', preview ? 'is-preview' : ''].filter(Boolean).join(' ')} onMouseEnter={() => setHovered({ row: r, col: c })} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered({ row: r, col: c })} onBlur={() => setHovered(null)} onClick={() => toggleKernel(r, c)} aria-label={`第 ${r + 1} 行第 ${c + 1} 列，当前为 ${cell}，点击改为 ${cell ? 0 : 1}`}><Typography shuku-edit-id="e-45fb4eb8-7623-4218-8151-5ddcbc64f6cd" as="span" variant="body" tone={shown === 0 ? 'muted' : 'inherit'}>{shown}</Typography></button>; }))}</div></AttentionHint>
            <div shuku-edit-id="e-1d0d6b90-3cd1-48aa-a186-8c4904b0c8e7" className="cki-window-scan__design-help">
            <span shuku-edit-id="e-a782086e-7fab-4a64-9ed8-f6303d10b5df" className="cki-window-scan__design-help-icon" aria-hidden="true"><ClickTap size="30" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#F57C00', '#FFFFFF', '#173B7A', '#F57C00']} /></span>
            <Typography shuku-edit-id="e-907f3440-e353-4f45-aa63-eb621c7227af" as="span" variant="body" tone="muted">点击切换 0 / 1</Typography>
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-159345e9-0786-4a7e-a767-26b2b8168039" className="cki-window-scan__result cki-window-scan__result-card">
          <div shuku-edit-id="e-2d1df39b-f523-486e-9ff7-19f07054de86" className="cki-window-scan__design-score"><Typography shuku-edit-id="e-ff91782e-2ca5-444d-88ce-c6048754f4f2" as="span" variant="h3" tone="muted">当前匹配</Typography><Typography shuku-edit-id="e-f70db877-5a59-4254-9ab0-333037f964d7" as="strong" variant="display" tone={kernelCorrect ? 'success' : 'main'}>{Math.max(0, Math.min(5, value))}</Typography><Typography shuku-edit-id="e-904f77ed-6ca2-406a-b77b-239f90f09c0c" as="span" variant="h3" tone="muted">/ 5</Typography><div shuku-edit-id="e-dba60d97-2ea5-4994-bb61-12683afb7665" className="cki-window-scan__progress" aria-label={`当前匹配 ${Math.max(0, value)} / 5`}><span shuku-edit-id="e-1644d98c-8913-43cc-9aa1-3c14f5937b21" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></div></div>
          <div shuku-edit-id="e-dab31140-a25f-4288-be70-d64e18a0d38e" className="cki-window-scan__design-feedback" role="status"><Move size="24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /><Typography shuku-edit-id="e-dd7c48b4-9cb5-474c-89e0-3753fa16f1ce" as="span" variant="body" tone="muted">将模板移动到合适位置，使其与目标棋形尽可能一致。</Typography></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
