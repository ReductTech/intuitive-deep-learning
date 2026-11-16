import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NumericBoardDragHint } from '../../../../../../NumericBoardDragHint';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Asterisk, GridFour, Move, Picture, Tips } from '@icon-park/react';
import { ContentBlock, ExplainPanelButton, Typography } from "@shuku/course-style/react";
import { useGomokuOutcome } from '../../LessonContext';
import { BOARD_SIZE, EMPTY, type Board, type Cell } from '../../gomokuEngine';
import './WindowScanPage.css';

/** 小框和算子的边长：五子连成一线，正好装进 5 × 5。 */
const KERNEL_SIZE = 5;
/** 小框左上角能滑到的最远处：小框整个留在盘内。 */
const WINDOW_LIMIT = BOARD_SIZE - KERNEL_SIZE;
/** 小框正中间那一格。 */
const WINDOW_MIDDLE = Math.floor(KERNEL_SIZE / 2);
/** 一格占整盘的百分比：橙色小框按它定位，格子才是正方形。 */
const UNIT = 100 / BOARD_SIZE;
/** 前面几页放大看过的窗口，这一页只借它来定底色分层的中心。 */
const ZOOM_SIZE = 9;
/** 底色从中心往外一共分五层，再远都并到最外那一层。 */
const RING_MAX = 4;

/** 整盘和算子各自的行列索引。 */
const BOARD_INDEX = Array.from({ length: BOARD_SIZE }, (_, index) => index);
const KERNEL_INDEX = Array.from({ length: KERNEL_SIZE }, (_, index) => index);

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 棋盘的数字版本：赢方的子记 1，对手的子记 -1，空点记 0。 */
function toNumberGrid(board: Board, winner: number): number[][] {
  return board.map((row) => row.map((stone) => {
    if (stone === EMPTY) return 0;
    return stone === winner ? 1 : -1;
  }));
}

/** 以棋形的最小外接矩形为中心取一个 size × size 的窗口，返回窗口正中的那一格。 */
function windowCentre(line: Cell[], size: number): Cell {
  const lineRows = line.map((cell) => cell.row);
  const lineCols = line.map((cell) => cell.col);
  const middle = Math.floor((BOARD_SIZE - 1) / 2);
  const midRow = lineRows.length ? Math.round((Math.min(...lineRows) + Math.max(...lineRows)) / 2) : middle;
  const midCol = lineCols.length ? Math.round((Math.min(...lineCols) + Math.max(...lineCols)) / 2) : middle;
  const half = Math.floor((size - 1) / 2);
  const limit = Math.max(0, BOARD_SIZE - size);
  return {
    row: Math.min(Math.max(midRow - half, 0), limit) + half,
    col: Math.min(Math.max(midCol - half, 0), limit) + half,
  };
}

/** 按获胜方向生成 5 × 5 算子：五格连成一线的地方是 1，其余是 0。 */
function kernelForWinDirection(line: Cell[]): number[][] {
  const dr = line.length >= 2 ? Math.sign(line[1].row - line[0].row) : 0;
  const dc = line.length >= 2 ? Math.sign(line[1].col - line[0].col) : 1;
  return KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
    if (dc === 0) return col === WINDOW_MIDDLE ? 1 : 0;
    if (dr === 0) return row === WINDOW_MIDDLE ? 1 : 0;
    if (dr === dc) return row === col ? 1 : 0;
    return row + col === KERNEL_SIZE - 1 ? 1 : 0;
  }));
}

/** 小框左上角在 (top, left) 时，小框盖住的那 25 个数字。 */
function windowPatch(grid: number[][], top: number, left: number): number[][] {
  return KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => grid[top + row][left + col]));
}

/** 激活值：小框里的数字和算子逐格相乘再相加。 */
function windowActivation(grid: number[][], kernel: number[][], top: number, left: number): number {
  return kernel.reduce((sum, kernelRow, row) => sum + kernelRow.reduce((rowSum, value, col) => (
    rowSum + value * grid[top + row][left + col]
  ), 0), 0);
}

/** 把小框滑遍整盘，返回最大的那个激活值。 */
function bestActivation(grid: number[][], kernel: number[][]): number {
  let best = -Infinity;
  for (let row = 0; row <= WINDOW_LIMIT; row += 1) {
    for (let col = 0; col <= WINDOW_LIMIT; col += 1) {
      best = Math.max(best, windowActivation(grid, kernel, row, col));
    }
  }
  return Number.isFinite(best) ? best : 0;
}

/**
 * 开局位置：激活值最高的那一格是答案，开局不能停在那儿，
 * 于是挑一个次高的、离它最近的位置——一进页面就是"还差一点"的状态。
 */
function startCellFor(grid: number[][], kernel: number[][]): Cell {
  let best: Cell = { row: 0, col: 0 };
  let bestValue = -Infinity;
  for (let row = 0; row <= WINDOW_LIMIT; row += 1) {
    for (let col = 0; col <= WINDOW_LIMIT; col += 1) {
      const value = windowActivation(grid, kernel, row, col);
      if (value > bestValue) {
        bestValue = value;
        best = { row, col };
      }
    }
  }
  if (bestValue <= 0) return best;

  let start = best;
  let startValue = -Infinity;
  let startGap = Infinity;
  for (let row = 0; row <= WINDOW_LIMIT; row += 1) {
    for (let col = 0; col <= WINDOW_LIMIT; col += 1) {
      const value = windowActivation(grid, kernel, row, col);
      if (value >= bestValue) continue;
      const gap = Math.abs(row - best.row) + Math.abs(col - best.col);
      if (value > startValue || (value === startValue && gap < startGap)) {
        startValue = value;
        startGap = gap;
        start = { row, col };
      }
    }
  }
  return start;
}

export interface WindowScanPageProps {
  onComplete: () => void;
  autoDemo?: boolean;
}

export function WindowScanPage({ onComplete, autoDemo = false }: WindowScanPageProps) {
  const { outcome } = useGomokuOutcome();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragOrigin = useRef<{ cell: Cell; topLeft: Cell } | null>(null);
  const completedRef = useRef(false);

  const grid = useMemo(() => toNumberGrid(outcome.board, outcome.winner), [outcome.board, outcome.winner]);
  const kernel = useMemo(() => kernelForWinDirection(outcome.winLine), [outcome.winLine]);
  const centre = useMemo(() => windowCentre(outcome.winLine, ZOOM_SIZE), [outcome.winLine]);
  const best = useMemo(() => bestActivation(grid, kernel), [grid, kernel]);

  const [topLeft, setTopLeft] = useState<Cell>({ row: 0, col: 0 });
  const [dragging, setDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  // 新棋局从左上角开始；有效移动后才收起手势提示。
  useEffect(() => { setTopLeft({ row: 0, col: 0 }); setHasMoved(false); completedRef.current = false; }, [outcome.board]);
  useEffect(() => {
    if (!autoDemo) return;
    let target: Cell = { row: 0, col: 0 }, score = -Infinity;
    for (let row = 0; row <= WINDOW_LIMIT; row++) for (let col = 0; col <= WINDOW_LIMIT; col++) {
      const value = windowActivation(grid, kernel, row, col);
      if (value > score) { score = value; target = { row, col }; }
    }
    const move = setTimeout(() => setTopLeft({ row: 3, col: 2 }), 650);
    const match = setTimeout(() => setTopLeft(target), 1500);
    return () => { clearTimeout(move); clearTimeout(match); };
  }, [autoDemo, grid, kernel]);

  const patch = windowPatch(grid, topLeft.row, topLeft.col);
  const value = windowActivation(grid, kernel, topLeft.row, topLeft.col);
  const found = best > 0 && value >= best;

  /**
   * 指针捕获之后事件只会发给棋盘本身，落在哪一格要自己按方框算。
   * 每格正好是 1 / 15 的边长，除一下就得到格子索引。
   */
  const cellFromPointer = (event: ReactPointerEvent<HTMLDivElement>): Cell | null => {
    const host = boardRef.current;
    if (!host) return null;
    const rect = host.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      row: clamp(Math.floor(((event.clientY - rect.top) / rect.height) * BOARD_SIZE), 0, BOARD_SIZE - 1),
      col: clamp(Math.floor(((event.clientX - rect.left) / rect.width) * BOARD_SIZE), 0, BOARD_SIZE - 1),
    };
  };

  // 按住哪里都行：小框跟着指针走多少格就挪多少格，不会突然跳。
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const cell = cellFromPointer(event);
    if (!cell) return;
    dragOrigin.current = { cell, topLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current;
    if (!dragging || !origin) return;
    const cell = cellFromPointer(event);
    if (!cell) return;
    const next = { row: clamp(origin.topLeft.row + cell.row - origin.cell.row, 0, WINDOW_LIMIT), col: clamp(origin.topLeft.col + cell.col - origin.cell.col, 0, WINDOW_LIMIT) };
    if (next.row !== topLeft.row || next.col !== topLeft.col) setHasMoved(true);
    setTopLeft(next);
  };

  const endDrag = useCallback(() => {
    dragOrigin.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!found || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [found, onComplete]);

  const handleBoardKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const delta: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const step = delta[event.key];
    if (!step) return;
    event.preventDefault(); event.stopPropagation();
    const next = { row: clamp(topLeft.row + step[0], 0, WINDOW_LIMIT), col: clamp(topLeft.col + step[1], 0, WINDOW_LIMIT) };
    if (next.row !== topLeft.row || next.col !== topLeft.col) setHasMoved(true);
    setTopLeft(next);
  };

  const windowStyle: CSSProperties = {
    left: `${topLeft.col * UNIT}%`,
    top: `${topLeft.row * UNIT}%`,
    width: `${KERNEL_SIZE * UNIT}%`,
    height: `${KERNEL_SIZE * UNIT}%`,
  };

  // 小框贴到棋盘上边时把手缩回框内，不然会被棋盘裁掉一半。
  const windowClasses = [
    'spp-replay-window-scan__window',
    topLeft.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock shuku-edit-id="e-36b313b5-5e43-4707-8828-d953fe70d692"
      headingLevel={1}
      className="spp-replay-window-scan"
      title="棋形的局部匹配"
      subtitle="移动一个 5 × 5 模板，比较它与棋盘不同区域的匹配程度。"
    >
      <div shuku-edit-id="e-eb2a31d4-c010-47fc-9ce6-eee021bef2f1" className="spp-replay-window-scan__layout">
        <div shuku-edit-id="e-075d5f45-2be4-46d1-84de-fbd228e2b176" className="spp-replay-window-scan__board-slot">
          <div shuku-edit-id="e-e9d48a79-8854-49d2-a831-bfd4da4c32e7"
            ref={boardRef}
            className="spp-replay-window-scan__board" data-numeric-board="spp" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col}
            role="group"
            aria-label="十五路棋盘写成的数字矩阵，橙色表示赢方棋子，蓝色表示输方棋子。拖动 5 × 5 窗口，比较不同区域的匹配得分。"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => {
              const cell = grid[row][col];
              const inWindow = row >= topLeft.row && row < topLeft.row + KERNEL_SIZE
                && col >= topLeft.col && col < topLeft.col + KERNEL_SIZE;
              const op = inWindow ? kernel[row - topLeft.row][col - topLeft.col] : 0;
              const hit = inWindow && op === 1 && cell === 1;
              const ring = Math.min(RING_MAX, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col)));
              const classes = [
                'spp-replay-window-scan__cell',
                `spp-replay-window-scan__cell--ring-${ring}`,
                cell === 1 ? 'spp-replay-window-scan__cell--one' : '',
                cell === -1 ? 'spp-replay-window-scan__cell--minus' : '',
                inWindow && op === 1 ? 'spp-replay-window-scan__cell--eye' : '',
                hit ? 'spp-replay-window-scan__cell--hit' : '',
              ].filter(Boolean).join(' ');
              return (
                <div shuku-edit-id="e-521736b7-b9bd-46f2-bf92-e57a151e8c37" key={cellKey(row, col)} className={classes}>
                  {cell !== EMPTY && <Typography shuku-edit-id="e-1865d659-471d-4f44-98e7-79d4b521aaed" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}
                </div>
              );
            }))}

            {!autoDemo && !hasMoved && !dragging && <NumericBoardDragHint />}
            <div shuku-edit-id="e-c6a6991b-cd87-4b99-bfeb-216e6c184b54" className={windowClasses} style={windowStyle} aria-hidden="true">
              <span shuku-edit-id="e-d46abe6a-3a5b-4f07-8e2f-ca44f993fb66" className="spp-replay-window-scan__grip">
                <i shuku-edit-id="e-5e566e2c-78b5-45b8-b33b-9c85ee75c733" /><i shuku-edit-id="e-67a3bb3a-2473-42b3-93ea-08219d7d6932" /><i shuku-edit-id="e-a4672df8-237f-4359-ad3f-4c08b067f718" />
              </span>
            </div>
          </div>

          <ul shuku-edit-id="e-602d25fb-4b55-40c7-9dba-b9007f776e1b" className="spp-replay-window-scan__key">
            <li shuku-edit-id="e-f4f25bef-804f-4e61-886e-20b85d0eec08" className="spp-replay-window-scan__key-item">
              <span shuku-edit-id="e-fb44fc8a-6c12-4ad2-8171-e5f51bf0513d" className="spp-replay-window-scan__key-chip spp-replay-window-scan__key-chip--one" aria-hidden="true" />
              <Typography shuku-edit-id="e-c942dc90-350c-4ae3-96e6-f22eae306809" as="span" variant="body" tone="muted">橙色＝赢方棋子（1）</Typography>
            </li>
            <li shuku-edit-id="e-caab65c4-877e-4090-8620-0fd38fb22b64" className="spp-replay-window-scan__key-item">
              <span shuku-edit-id="e-9e2225f0-efbf-4f67-a886-311565b4a628" className="spp-replay-window-scan__key-chip spp-replay-window-scan__key-chip--minus" aria-hidden="true" />
              <Typography shuku-edit-id="e-9395c859-540b-466b-ac29-3fc3754cba71" as="span" variant="body" tone="muted">蓝色＝败方棋子（−1）</Typography>
            </li>
          </ul>
        </div>

        <div shuku-edit-id="e-80d02d9d-9a72-430f-9e28-101d695ca616" className="spp-replay-window-scan__panel">
          <div shuku-edit-id="e-005f9c93-fe0b-4cc1-bf6a-0aaf6f505134" className="spp-replay-window-scan__compare">
            <div shuku-edit-id="e-1ae2f787-9830-4114-9603-99c5a6418380" className="spp-replay-window-scan__operand">
              <div shuku-edit-id="e-c75e6770-ff6f-48f5-8186-69c20d8a68ff" className="spp-replay-window-scan__operand-heading">
                <span shuku-edit-id="e-97f6f308-2a5b-4782-8efc-c02d39fad916" className="spp-replay-window-scan__operand-icon" aria-hidden="true"><Picture size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-561129b8-9489-4b6c-b554-4c5c6cb83043">
                  <Typography shuku-edit-id="e-8895db7d-4302-423a-ac34-1bdbb4c633b6" as="strong" variant="h3" tone="main">当前区域</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-21b66c08-b84b-4c9a-98e0-33d39a756801"
                className="spp-replay-window-scan__grid"
                role="group"
                aria-label="当前区域的 5 × 5 数值，橙色轮廓标出目标模板中的 1 对应的位置。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = patch[row][col];
                  const eye = kernel[row][col] === 1;
                  const hit = eye && cell === 1;
                  const classes = [
                    'spp-replay-window-scan__grid-cell',
                    cell === 1 ? 'spp-replay-window-scan__grid-cell--one' : '',
                    cell === -1 ? 'spp-replay-window-scan__grid-cell--minus' : '',
                    eye ? 'spp-replay-window-scan__grid-cell--eye' : '',
                    hit ? 'spp-replay-window-scan__grid-cell--hit' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div shuku-edit-id="e-f45a0751-ce42-40b1-81b7-a00db899d3d0" key={cellKey(row, col)} className={classes}>
                      <Typography shuku-edit-id="e-6ed0c369-9c91-4f05-9aa9-e4f538bcfbe1" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div shuku-edit-id="e-b7e8958e-e43d-4a82-93e2-c62f62bd1ee2" className="spp-replay-window-scan__operator-wrap">
              <Typography shuku-edit-id="e-ca856214-828c-494b-b68b-fd108557e434" as="span" role="img" aria-label="卷积运算符" variant="h2" tone="main" className="spp-replay-window-scan__operator is-ready"><Asterisk size="28" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="outline" fill="#173B7A" /></Typography>
            </div>

            <div shuku-edit-id="e-f1e0a684-4238-4c7a-8926-2e435c0fd32a" className="spp-replay-window-scan__operand">
              <div shuku-edit-id="e-2f4518c7-333b-4757-97cf-760b63fc60b7" className="spp-replay-window-scan__operand-heading">
                <span shuku-edit-id="e-1ac2e73b-703e-409d-ab2f-ac669bba9ed9" className="spp-replay-window-scan__operand-icon" aria-hidden="true"><GridFour size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-dbe4fcc3-866e-4f5d-a48f-caffa6aea162">
                  <Typography shuku-edit-id="e-464ec0ee-8605-4fe3-a395-2229f6d86997" as="strong" variant="h3" tone="main">目标模板</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-11a56960-fa1a-47bd-aceb-05e622035fb8"
                className="spp-replay-window-scan__grid"
                role="group"
                aria-label="五乘五目标模板：五格连成一线的地方是 1，其余是 0。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = kernel[row][col];
                  return (
                    <div shuku-edit-id="e-e3431b06-7ef8-400b-8844-6ded6213be98" key={cellKey(row, col)} className={cell === 1 ? 'spp-replay-window-scan__grid-cell spp-replay-window-scan__grid-cell--one' : 'spp-replay-window-scan__grid-cell'}>
                      <Typography shuku-edit-id="e-45383991-beaf-46cd-be7b-03e331365e1a" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-f758c35f-2cf0-47e4-b25e-b2c57ecee3cd" className="spp-replay-window-scan__result spp-replay-window-scan__result-card">
            <div shuku-edit-id="e-97b26f21-9a6c-424b-afbc-24791634c4d2" className="spp-replay-window-scan__result-heading">
              <Typography shuku-edit-id="e-165fea20-5ed8-4af9-b4b6-c44d179d25a8" as="span" variant="body" tone="muted">当前区域的得分</Typography>
            </div>
            <div shuku-edit-id="e-434bf59a-b90c-44b0-846d-afd150c7155a" className="spp-replay-window-scan__score-row">
              <div shuku-edit-id="e-a580c214-8d64-4a50-9a93-6440b7946e3a" className="spp-replay-window-scan__activation-box">
                <Typography shuku-edit-id="e-601409ae-9bfa-4da9-b137-9438ee7e000e" as="strong" variant="display" tone={found ? 'success' : 'main'}>{value < 0 ? `−${Math.abs(value)}` : value}</Typography>
                <ExplainPanelButton label="查看匹配得分的计算过程" triggerText="?">
                    <Typography shuku-edit-id="e-9312d32b-8c2d-4650-83e5-4905edd86f81" as="strong" variant="bodySmall" tone="accent">匹配得分怎么得到？</Typography>
                    <Typography shuku-edit-id="e-9a3ac7ef-bcb3-4209-854d-37991ae82291" variant="bodySmall" tone="muted">当前区域与目标模板对应位置相乘，再把 25 个乘积相加。</Typography>
                    <div shuku-edit-id="e-87642ba7-1210-4f56-a77d-d990ed2c68fa" className="spp-replay-window-scan__multiply" role="grid" aria-label="当前窗口与卷积核的逐项乘积">
                      {KERNEL_INDEX.flatMap((row) => KERNEL_INDEX.map((col) => {
                        const product = kernel[row][col] * patch[row][col];
                        return (
                          <span shuku-edit-id="e-2c6850c3-cb7e-4d74-91f4-44e0861efa76" className={`spp-replay-window-scan__multiply-cell${product !== 0 ? ' is-active' : ''}`} role="gridcell" key={cellKey(row, col)}>
                            <Typography shuku-edit-id="e-93390279-ab1e-417e-943d-223ba7c74af2" as="strong" variant="bodySmall" tone={product !== 0 ? 'success' : 'muted'}>{product}</Typography>
                            <Typography shuku-edit-id="e-814fcf85-5d73-4265-a1b7-194925dae391" as="span" variant="bodySmall" tone="muted">{`${kernel[row][col]} × ${patch[row][col]}`}</Typography>
                          </span>
                        );
                      }))}
                    </div>
                    <div shuku-edit-id="e-fdf1b74c-2e36-4be2-b6a7-a196c3e41047" className="spp-replay-window-scan__sum-line" aria-label={`所有乘积相加等于 ${value}`}>
                      <Typography shuku-edit-id="e-b935f49e-9a09-47da-ae28-2b76a7e59217" as="span" variant="bodySmall" tone="accent">{`Σ（模板值 × 区域值）= ${value < 0 ? `−${Math.abs(value)}` : value}`}</Typography>
                    </div>
                </ExplainPanelButton>
              </div>
              <Typography shuku-edit-id="e-bd52f5d0-0a65-4ea5-b59f-53540104886e" variant="bodySmall" tone="muted" className="spp-replay-window-scan__result-caption"><Tips size="36" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#EFA94B', '#FFF1D9', '#EFA94B']} /><span shuku-edit-id="e-101afda9-a2ee-44c1-9fbd-3e88a5b4c6ac">得分越高，<br shuku-edit-id="e-62c4a9ba-f5a5-4306-824a-aee9bb9261c5" />当前位置越符合目标棋形。</span></Typography>
            </div>
          </div>
          <div shuku-edit-id="e-7a8b7858-642e-434b-a044-73b5e469777f" className="spp-replay-window-scan__instruction" role="status">
            <span shuku-edit-id="e-61587db9-345c-472a-9bd3-ade803d97986" className="spp-replay-window-scan__instruction-icon" aria-hidden="true"><Move size="27" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /></span>
            <Typography shuku-edit-id="e-1fc59b18-596b-495b-b7b5-cb1b09ef6c15" as="span" variant="body" tone="muted">拖动左侧窗口，寻找匹配得分最高的位置。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
