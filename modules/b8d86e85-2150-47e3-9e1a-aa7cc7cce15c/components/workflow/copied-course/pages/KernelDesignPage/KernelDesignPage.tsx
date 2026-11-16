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
  useEffect(() => { setTopLeft({ row: 0, col: 0 }); completedRef.current = false; }, [outcome.board]);
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

  return <ContentBlock shuku-edit-id="e-3cd45ace-41e9-4068-b0f3-8581fbb85182" headingLevel={1} className="cg-copy-ck-window-scan" title="根据棋形调整模板" subtitle="先在右侧设置模板，再将左侧窗口移动到棋盘中的合适位置。">
    <div shuku-edit-id="e-ea46d993-bc50-4e26-9a50-13f7857285da" className="cg-copy-ck-window-scan__layout">
      <div shuku-edit-id="e-02e0ba49-b23d-44a0-9438-91c397677f8a" className="cg-copy-ck-window-scan__board-slot">
        <div shuku-edit-id="e-aa01fcc3-cefd-47f2-89c7-b8b420923cc9" ref={boardRef} className="cg-copy-ck-window-scan__board" role="group" aria-label="经过方向变换的十五路棋盘与五乘五模板" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => { const cell = grid[row][col]; const inWindow = row >= topLeft.row && row < topLeft.row + KERNEL_SIZE && col >= topLeft.col && col < topLeft.col + KERNEL_SIZE; const op = inWindow ? kernel[row - topLeft.row][col - topLeft.col] : 0; const hit = inWindow && op === 1 && cell === 1; const ring = Math.min(4, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col))); const classes = ['cg-copy-ck-window-scan__cell', `cg-copy-ck-window-scan__cell--ring-${ring}`, cell === 1 ? 'cg-copy-ck-window-scan__cell--one' : '', cell === -1 ? 'cg-copy-ck-window-scan__cell--minus' : '', inWindow && op === 1 ? 'cg-copy-ck-window-scan__cell--eye' : '', hit ? 'cg-copy-ck-window-scan__cell--hit' : ''].filter(Boolean).join(' '); return <div shuku-edit-id="e-103eef19-1b1c-4282-8482-3637a47429cb" key={cellKey(row, col)} className={classes}>{cell !== EMPTY && <Typography shuku-edit-id="e-094f9cc8-6d14-4dfa-b8fa-0ae640731ef5" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}</div>; }))}
          <div shuku-edit-id="e-163d3298-3fd1-44dc-a138-5a673c403eb8" className={`cg-copy-ck-window-scan__window ${topLeft.row === 0 ? 'is-clamped-top' : ''} ${kernelCorrect ? '' : 'is-locked'}`} style={windowStyle} aria-hidden="true"><span shuku-edit-id="e-945d7499-301c-4afa-a161-cb5c91f7a8ef" className="cg-copy-ck-window-scan__grip"><i shuku-edit-id="e-2e5f15e1-24b9-48b6-8cd3-d1e2783228c6" /><i shuku-edit-id="e-9961f7f6-9571-480b-837e-ae99bf1c5afc" /><i shuku-edit-id="e-88eea16a-61fe-4388-92f1-19d24e086d96" /></span></div>
        </div>
        <ul shuku-edit-id="e-9d601dfc-a1a0-4063-8c1e-68657d13ddbf" className="cg-copy-ck-window-scan__key"><li shuku-edit-id="e-11a160e4-b469-499b-8734-2bcf577f5e50" className="cg-copy-ck-window-scan__key-item"><span shuku-edit-id="e-69a803a1-b831-48db-ad6e-f6211ad0e5b6" className="cg-copy-ck-window-scan__key-chip cg-copy-ck-window-scan__key-chip--one" aria-hidden="true" /><Typography shuku-edit-id="e-28f40d8a-8acc-4177-99d7-ebe2ab50ce71" as="span" variant="body" tone="muted">橙 = 赢方棋子</Typography></li><li shuku-edit-id="e-ecb86dc0-bb74-44d6-834e-2c79fef8ef60" className="cg-copy-ck-window-scan__key-item"><span shuku-edit-id="e-4dff77e3-c1b7-4c49-87ea-273df9a5d8b2" className="cg-copy-ck-window-scan__key-chip cg-copy-ck-window-scan__key-chip--minus" aria-hidden="true" /><Typography shuku-edit-id="e-70b0acce-eeb9-4796-9957-17d0d4f2e61c" as="span" variant="body" tone="muted">深蓝 = 败方棋子</Typography></li></ul>
      </div>
      <div shuku-edit-id="e-1995330d-8f9f-4203-b14a-92b496cadde5" className="cg-copy-ck-window-scan__panel">
        <div shuku-edit-id="e-148221f4-1200-41b0-b0f9-8b91f5c2b873" className="cg-copy-ck-window-scan__compare cg-copy-ck-window-scan__compare--kernel-only">
          <div shuku-edit-id="e-3a20ebda-0e48-44e3-bb65-f476a8b3c669" className="cg-copy-ck-window-scan__design-heading">
            <span shuku-edit-id="e-23d06f08-397f-4aa8-b9cb-1e9f47ed2e16" className="cg-copy-ck-window-scan__design-icon" aria-hidden="true"><GridNine size="28" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#2F80ED', '#DCEAFF', '#5B8DE8', '#FFFFFF']} /></span>
            <div shuku-edit-id="e-2dd98be2-b961-4e91-ba18-d7ed3017c51d">
              <Typography shuku-edit-id="e-77ab39b3-ff0f-401e-b591-09b945357d45" as="h2" variant="h2" tone="main">设置模板</Typography>
              <Typography shuku-edit-id="e-a07f0155-1469-4015-bd84-feb3f8d9e32b" as="p" variant="body" tone="muted">点击格子，将目标棋形对应的位置设为 1。</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-c4ec1c6e-d55a-4b80-ada2-8d16048c587e" className="cg-copy-ck-window-scan__design-body">
            <AttentionHint className="cg-copy-ck-window-scan__kernel-hint"><div shuku-edit-id="e-24d6887f-87d8-4ac7-b200-325b3f7c0611" className="cg-copy-ck-window-scan__grid cg-copy-ck-window-scan__grid--editable" role="group" aria-label="可点击编辑的卷积核">{KERNEL_INDEX.map((r) => KERNEL_INDEX.map((c) => { const cell = kernel[r][c]; const preview = hovered?.row === r && hovered?.col === c; const shown = preview ? (cell ? 0 : 1) : cell; return <button shuku-edit-id="e-a5ed55f1-dd4b-4617-a801-138a5cf5c611" key={cellKey(r, c)} type="button" className={['cg-copy-ck-window-scan__grid-cell', shown === 1 ? 'cg-copy-ck-window-scan__grid-cell--one' : '', preview ? 'is-preview' : ''].filter(Boolean).join(' ')} onMouseEnter={() => setHovered({ row: r, col: c })} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered({ row: r, col: c })} onBlur={() => setHovered(null)} onClick={() => toggleKernel(r, c)} aria-label={`第 ${r + 1} 行第 ${c + 1} 列，当前为 ${cell}，点击改为 ${cell ? 0 : 1}`}><Typography shuku-edit-id="e-32d1ee0c-7733-466e-a016-5bcbb703b153" as="span" variant="body" tone={shown === 0 ? 'muted' : 'inherit'}>{shown}</Typography></button>; }))}</div></AttentionHint>
            <div shuku-edit-id="e-f24eb3c3-995d-4fb3-b07b-336219a02a89" className="cg-copy-ck-window-scan__design-help">
            <span shuku-edit-id="e-ddf68e2d-1385-4633-ba80-c98539def2a2" className="cg-copy-ck-window-scan__design-help-icon" aria-hidden="true"><ClickTap size="30" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#F57C00', '#FFFFFF', '#173B7A', '#F57C00']} /></span>
            <Typography shuku-edit-id="e-62feb172-f205-441d-8665-7c274f02b561" as="span" variant="body" tone="muted">点击切换 0 / 1</Typography>
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-440bb049-9122-4986-b832-7b781a967a6d" className="cg-copy-ck-window-scan__result cg-copy-ck-window-scan__result-card">
          <div shuku-edit-id="e-4e256b46-d94f-41d8-bef3-3f263a7a080f" className="cg-copy-ck-window-scan__design-score"><Typography shuku-edit-id="e-0265c92c-dffd-48c2-b205-daf9944d8cfc" as="span" variant="h3" tone="muted">当前匹配</Typography><Typography shuku-edit-id="e-55e71b8d-d4c6-4b78-a6e5-e280d061fa50" as="strong" variant="display" tone={kernelCorrect ? 'success' : 'main'}>{Math.max(0, Math.min(5, value))}</Typography><Typography shuku-edit-id="e-abd1393f-e243-49a7-85aa-00566bcbac94" as="span" variant="h3" tone="muted">/ 5</Typography><div shuku-edit-id="e-51f02bb6-e4e2-47a0-89b5-6120529ea822" className="cg-copy-ck-window-scan__progress" aria-label={`当前匹配 ${Math.max(0, value)} / 5`}><span shuku-edit-id="e-fbf0cd4a-502e-4823-88e5-7e373bd61d79" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></div></div>
          <div shuku-edit-id="e-58593aaa-33c5-472e-a13f-31bf275e3f3e" className="cg-copy-ck-window-scan__design-feedback" role="status"><Move size="24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /><Typography shuku-edit-id="e-d802585c-3637-4ebc-a9dd-95eedd7d2827" as="span" variant="body" tone="muted">将模板移动到合适位置，使其与目标棋形尽可能一致。</Typography></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
