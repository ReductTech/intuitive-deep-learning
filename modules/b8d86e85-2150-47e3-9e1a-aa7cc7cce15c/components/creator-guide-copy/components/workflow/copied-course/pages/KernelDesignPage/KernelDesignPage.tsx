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
  useEffect(() => { setTopLeft({ row: 0, col: 0 }); completedRef.current = false; }, [outcome.board]);
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
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => { if (!kernelCorrect || !dragging || !dragOrigin.current) return; const cell = cellFromPointer(event); if (!cell) return; setTopLeft({ row: clamp(dragOrigin.current.topLeft.row + cell.row - dragOrigin.current.cell.row, 0, WINDOW_LIMIT), col: clamp(dragOrigin.current.topLeft.col + cell.col - dragOrigin.current.cell.col, 0, WINDOW_LIMIT) }); };
  const endDrag = useCallback(() => { dragOrigin.current = null; setDragging(false); }, []);
  const toggleKernel = (row: number, col: number) => recordDesignedKernel(kernel.map((line, r) => line.map((cell, c) => r === row && c === col ? (cell ? 0 : 1) : cell)));
  useEffect(() => { if (!found || completedRef.current) return; completedRef.current = true; onComplete(); }, [found, onComplete]);
  const windowStyle: CSSProperties = { left: `${topLeft.col * UNIT}%`, top: `${topLeft.row * UNIT}%`, width: `${KERNEL_SIZE * UNIT}%`, height: `${KERNEL_SIZE * UNIT}%` };

  return <ContentBlock shuku-edit-id="e-e2c56126-bd11-4eea-8389-93ea52d7a4fb" headingLevel={1} className="aipe-replay-cg-copy-ck-window-scan" title="根据棋形调整模板" subtitle="先在右侧设置模板，再将左侧窗口移动到棋盘中的合适位置。">
    <div shuku-edit-id="e-df0a727a-d123-41c7-b8c4-409d6b82b3cc" className="aipe-replay-cg-copy-ck-window-scan__layout">
      <div shuku-edit-id="e-75c6c070-e5e1-4f3f-ab5f-4b8d9dea4f92" className="aipe-replay-cg-copy-ck-window-scan__board-slot">
        <div shuku-edit-id="e-09f43be2-e8b7-4135-86b9-be5588acefba" ref={boardRef} className="aipe-replay-cg-copy-ck-window-scan__board" role="group" aria-label="经过方向变换的十五路棋盘与五乘五模板" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => { const cell = grid[row][col]; const inWindow = row >= topLeft.row && row < topLeft.row + KERNEL_SIZE && col >= topLeft.col && col < topLeft.col + KERNEL_SIZE; const op = inWindow ? kernel[row - topLeft.row][col - topLeft.col] : 0; const hit = inWindow && op === 1 && cell === 1; const ring = Math.min(4, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col))); const classes = ['aipe-replay-cg-copy-ck-window-scan__cell', `aipe-replay-cg-copy-ck-window-scan__cell--ring-${ring}`, cell === 1 ? 'aipe-replay-cg-copy-ck-window-scan__cell--one' : '', cell === -1 ? 'aipe-replay-cg-copy-ck-window-scan__cell--minus' : '', inWindow && op === 1 ? 'aipe-replay-cg-copy-ck-window-scan__cell--eye' : '', hit ? 'aipe-replay-cg-copy-ck-window-scan__cell--hit' : ''].filter(Boolean).join(' '); return <div shuku-edit-id="e-8b32b005-d7ad-42e5-80c1-13ba8263b4a5" key={cellKey(row, col)} className={classes}>{cell !== EMPTY && <Typography shuku-edit-id="e-d3e4440c-a555-47b1-be49-3c7c248cf078" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}</div>; }))}
          <div shuku-edit-id="e-71d48cc5-f2ff-4596-9355-7bba51892fbc" className={`aipe-replay-cg-copy-ck-window-scan__window ${topLeft.row === 0 ? 'is-clamped-top' : ''} ${kernelCorrect ? '' : 'is-locked'}`} style={windowStyle} aria-hidden="true"><span shuku-edit-id="e-d8f72c88-80f0-408c-bb39-be6d0132b069" className="aipe-replay-cg-copy-ck-window-scan__grip"><i shuku-edit-id="e-940485ca-e9d5-4682-b416-054e9dc282e2" /><i shuku-edit-id="e-12784091-be9c-44a0-bf1d-4131a4fea24f" /><i shuku-edit-id="e-2e1e05e8-cf3b-4cfa-a613-88dfaa269b97" /></span></div>
        </div>
        <ul shuku-edit-id="e-a81144bf-ee82-4646-9407-fa1fca6fc6f6" className="aipe-replay-cg-copy-ck-window-scan__key"><li shuku-edit-id="e-6d9a6fb6-6556-4d70-994e-a29a3c7d76c2" className="aipe-replay-cg-copy-ck-window-scan__key-item"><span shuku-edit-id="e-cb4f4b2d-8f4d-4ea4-805b-0413e2d6ac51" className="aipe-replay-cg-copy-ck-window-scan__key-chip aipe-replay-cg-copy-ck-window-scan__key-chip--one" aria-hidden="true" /><Typography shuku-edit-id="e-84c05cd6-b577-4c8c-a000-35e3592ab5e8" as="span" variant="body" tone="muted">橙 = 赢方棋子</Typography></li><li shuku-edit-id="e-781330a7-01d9-4243-b961-84f37ff287b4" className="aipe-replay-cg-copy-ck-window-scan__key-item"><span shuku-edit-id="e-9cda5e86-b576-4d0c-9b40-472415a55aad" className="aipe-replay-cg-copy-ck-window-scan__key-chip aipe-replay-cg-copy-ck-window-scan__key-chip--minus" aria-hidden="true" /><Typography shuku-edit-id="e-08e9e8cd-f9a1-490c-9a52-2293aeb88777" as="span" variant="body" tone="muted">深蓝 = 败方棋子</Typography></li></ul>
      </div>
      <div shuku-edit-id="e-61294be9-4c13-45a0-a327-ee88bcca8e36" className="aipe-replay-cg-copy-ck-window-scan__panel">
        <div shuku-edit-id="e-a0751131-57d0-4ad9-8d2b-958b950689bb" className="aipe-replay-cg-copy-ck-window-scan__compare aipe-replay-cg-copy-ck-window-scan__compare--kernel-only">
          <div shuku-edit-id="e-e8f62ab0-6d3a-4c01-b6c1-e78e8d080210" className="aipe-replay-cg-copy-ck-window-scan__design-heading">
            <span shuku-edit-id="e-5ec05e0c-ace3-442d-81ee-4ab976608d83" className="aipe-replay-cg-copy-ck-window-scan__design-icon" aria-hidden="true"><GridNine size="28" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#2F80ED', '#DCEAFF', '#5B8DE8', '#FFFFFF']} /></span>
            <div shuku-edit-id="e-2005ed65-e5a9-468f-a8ae-c6a98fba2f4f">
              <Typography shuku-edit-id="e-8c2a2ade-2aef-4411-a20a-c088683b5525" as="h2" variant="h2" tone="main">设置模板</Typography>
              <Typography shuku-edit-id="e-3a137a69-6d8f-47df-b855-bacf1f1fb779" as="p" variant="body" tone="muted">点击格子，将目标棋形对应的位置设为 1。</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-ad5d674e-e976-4d6c-8531-99ea25e12769" className="aipe-replay-cg-copy-ck-window-scan__design-body">
            <AttentionHint className="aipe-replay-cg-copy-ck-window-scan__kernel-hint"><div shuku-edit-id="e-bf716b77-60e9-41f2-bb22-a2b1a9da0b39" className="aipe-replay-cg-copy-ck-window-scan__grid aipe-replay-cg-copy-ck-window-scan__grid--editable" role="group" aria-label="可点击编辑的卷积核">{KERNEL_INDEX.map((r) => KERNEL_INDEX.map((c) => { const cell = kernel[r][c]; const preview = hovered?.row === r && hovered?.col === c; const shown = preview ? (cell ? 0 : 1) : cell; return <button shuku-edit-id="e-6adab9fa-03b1-487a-a765-998c4bb74910" key={cellKey(r, c)} type="button" className={['aipe-replay-cg-copy-ck-window-scan__grid-cell', shown === 1 ? 'aipe-replay-cg-copy-ck-window-scan__grid-cell--one' : '', preview ? 'is-preview' : ''].filter(Boolean).join(' ')} onMouseEnter={() => setHovered({ row: r, col: c })} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered({ row: r, col: c })} onBlur={() => setHovered(null)} onClick={() => toggleKernel(r, c)} aria-label={`第 ${r + 1} 行第 ${c + 1} 列，当前为 ${cell}，点击改为 ${cell ? 0 : 1}`}><Typography shuku-edit-id="e-6df7ee79-9f99-42c5-b714-c6daf88412cd" as="span" variant="body" tone={shown === 0 ? 'muted' : 'inherit'}>{shown}</Typography></button>; }))}</div></AttentionHint>
            <div shuku-edit-id="e-6450e0da-a199-4bbd-90ee-aaf4a4b6f0b1" className="aipe-replay-cg-copy-ck-window-scan__design-help">
            <span shuku-edit-id="e-cf11491b-a0ba-4d89-9b29-095fc110e2dd" className="aipe-replay-cg-copy-ck-window-scan__design-help-icon" aria-hidden="true"><ClickTap size="30" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#F57C00', '#FFFFFF', '#173B7A', '#F57C00']} /></span>
            <Typography shuku-edit-id="e-a16659c2-273c-4b3c-ba80-99338d3b9a68" as="span" variant="body" tone="muted">点击切换 0 / 1</Typography>
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-1877ca75-820f-4857-80f1-fc2d7febf70c" className="aipe-replay-cg-copy-ck-window-scan__result aipe-replay-cg-copy-ck-window-scan__result-card">
          <div shuku-edit-id="e-f946c599-e362-458e-864e-0d3140d50516" className="aipe-replay-cg-copy-ck-window-scan__design-score"><Typography shuku-edit-id="e-78c53a14-7e69-4f25-b91f-f0e70a182e53" as="span" variant="h3" tone="muted">当前匹配</Typography><Typography shuku-edit-id="e-0dcaf58e-e76e-40fe-adaa-621b1dd4d034" as="strong" variant="display" tone={kernelCorrect ? 'success' : 'main'}>{Math.max(0, Math.min(5, value))}</Typography><Typography shuku-edit-id="e-60f634ef-df59-4110-94fd-7a3cc5168d5d" as="span" variant="h3" tone="muted">/ 5</Typography><div shuku-edit-id="e-e1bfbb38-28ea-4791-beed-db85dfbb6b2d" className="aipe-replay-cg-copy-ck-window-scan__progress" aria-label={`当前匹配 ${Math.max(0, value)} / 5`}><span shuku-edit-id="e-c4a12667-a136-4d23-9869-31c50956b25c" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></div></div>
          <div shuku-edit-id="e-280687ee-6889-4420-8781-2a4b562a93d0" className="aipe-replay-cg-copy-ck-window-scan__design-feedback" role="status"><Move size="24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /><Typography shuku-edit-id="e-9c697d6c-ce3d-40b6-85ac-d42cc6c936f4" as="span" variant="body" tone="muted">将模板移动到合适位置，使其与目标棋形尽可能一致。</Typography></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
