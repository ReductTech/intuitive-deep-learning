import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NumericBoardDragHint } from '../../../../NumericBoardDragHint';
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
    'cg-replay-window-scan__window',
    topLeft.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock shuku-edit-id="e-97acddba-50a4-4e8d-85bd-3d1e774eca34"
      headingLevel={1}
      className="cg-replay-window-scan"
      title="棋形的局部匹配"
      subtitle="移动一个 5 × 5 模板，比较它与棋盘不同区域的匹配程度。"
    >
      <div shuku-edit-id="e-bb82b39f-29fc-4210-9cc0-46dc5ff15c61" className="cg-replay-window-scan__layout">
        <div shuku-edit-id="e-68b4f005-84d6-48cc-abf0-1775e33191dd" className="cg-replay-window-scan__board-slot">
          <div shuku-edit-id="e-5cc102e3-adee-4572-93c6-a818d58ea7d5"
            ref={boardRef}
            className="cg-replay-window-scan__board" data-numeric-board="spp" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col}
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
                'cg-replay-window-scan__cell',
                `cg-replay-window-scan__cell--ring-${ring}`,
                cell === 1 ? 'cg-replay-window-scan__cell--one' : '',
                cell === -1 ? 'cg-replay-window-scan__cell--minus' : '',
                inWindow && op === 1 ? 'cg-replay-window-scan__cell--eye' : '',
                hit ? 'cg-replay-window-scan__cell--hit' : '',
              ].filter(Boolean).join(' ');
              return (
                <div shuku-edit-id="e-422c9e62-5d86-4f09-97e7-ea5da8d9335f" key={cellKey(row, col)} className={classes}>
                  {cell !== EMPTY && <Typography shuku-edit-id="e-b7a087a0-9063-4f86-902f-c7588e56eb0c" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}
                </div>
              );
            }))}

            {!autoDemo && !hasMoved && !dragging && <NumericBoardDragHint />}
            <div shuku-edit-id="e-0cb6f5d1-8db8-452c-9e1d-ae30b984b013" className={windowClasses} style={windowStyle} aria-hidden="true">
              <span shuku-edit-id="e-7c9def9b-0f10-40b9-8d17-24435835995f" className="cg-replay-window-scan__grip">
                <i shuku-edit-id="e-976dfe9c-d20f-449a-ba16-1ffc5d4924a6" /><i shuku-edit-id="e-69eefeb3-a7be-4e9f-a119-24ebe83ce804" /><i shuku-edit-id="e-2fff7ba6-5a06-4a74-ad8d-a01bdab7309b" />
              </span>
            </div>
          </div>

          <ul shuku-edit-id="e-07e4d3b7-05a5-4fa6-95fd-cf6716fc4627" className="cg-replay-window-scan__key">
            <li shuku-edit-id="e-579911f2-5c65-40d1-8f57-3cbdb461628d" className="cg-replay-window-scan__key-item">
              <span shuku-edit-id="e-3f2a6f76-fe75-4fd3-a04a-6a4f3062de2f" className="cg-replay-window-scan__key-chip cg-replay-window-scan__key-chip--one" aria-hidden="true" />
              <Typography shuku-edit-id="e-d3ba2f15-eba4-40c0-a460-5f03e9d69659" as="span" variant="body" tone="muted">橙色＝赢方棋子（1）</Typography>
            </li>
            <li shuku-edit-id="e-6a856d22-5b49-456d-b082-f2c0c44649d1" className="cg-replay-window-scan__key-item">
              <span shuku-edit-id="e-076fb024-8eaf-49d6-b113-747e0f879670" className="cg-replay-window-scan__key-chip cg-replay-window-scan__key-chip--minus" aria-hidden="true" />
              <Typography shuku-edit-id="e-2b5760e8-d510-41ba-9346-e59a43042109" as="span" variant="body" tone="muted">蓝色＝败方棋子（−1）</Typography>
            </li>
          </ul>
        </div>

        <div shuku-edit-id="e-b6c131dd-fd7f-4867-8f84-b0af4d7feb9d" className="cg-replay-window-scan__panel">
          <div shuku-edit-id="e-5f6875c7-e8ee-4a86-bdc9-01e1937a673c" className="cg-replay-window-scan__compare">
            <div shuku-edit-id="e-130f40bb-200a-41cd-9dcc-685694db572a" className="cg-replay-window-scan__operand">
              <div shuku-edit-id="e-f453a294-0541-4ab2-b2bb-156f988982d1" className="cg-replay-window-scan__operand-heading">
                <span shuku-edit-id="e-f5af7ecc-e175-42ca-baf8-662dec2b5db1" className="cg-replay-window-scan__operand-icon" aria-hidden="true"><Picture size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-4604179d-ea16-4540-a9a4-24771eb72e9e">
                  <Typography shuku-edit-id="e-f46f2a73-9e65-4fe1-aa17-fc1415d4f09c" as="strong" variant="h3" tone="main">当前区域</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-b0d5186e-b5ce-4cae-8e99-161df029ea51"
                className="cg-replay-window-scan__grid"
                role="group"
                aria-label="当前区域的 5 × 5 数值，橙色轮廓标出目标模板中的 1 对应的位置。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = patch[row][col];
                  const eye = kernel[row][col] === 1;
                  const hit = eye && cell === 1;
                  const classes = [
                    'cg-replay-window-scan__grid-cell',
                    cell === 1 ? 'cg-replay-window-scan__grid-cell--one' : '',
                    cell === -1 ? 'cg-replay-window-scan__grid-cell--minus' : '',
                    eye ? 'cg-replay-window-scan__grid-cell--eye' : '',
                    hit ? 'cg-replay-window-scan__grid-cell--hit' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div shuku-edit-id="e-8ffcb17c-a921-43f7-aee4-877bee26d517" key={cellKey(row, col)} className={classes}>
                      <Typography shuku-edit-id="e-f85f94c3-5ab4-4e03-a95d-e0817659ff60" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div shuku-edit-id="e-e42cf835-97bb-47aa-b192-1860d9684ceb" className="cg-replay-window-scan__operator-wrap">
              <Typography shuku-edit-id="e-98b71f69-cc9d-4ffe-b15c-782a342cace7" as="span" role="img" aria-label="卷积运算符" variant="h2" tone="main" className="cg-replay-window-scan__operator is-ready"><Asterisk size="28" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="outline" fill="#173B7A" /></Typography>
            </div>

            <div shuku-edit-id="e-0e63ea72-9918-4006-a308-8b55aeb1b99e" className="cg-replay-window-scan__operand">
              <div shuku-edit-id="e-900a7605-b43e-41f8-aa84-b3bec5b21cca" className="cg-replay-window-scan__operand-heading">
                <span shuku-edit-id="e-74e506ba-082e-4d91-b264-7cb075f9caf4" className="cg-replay-window-scan__operand-icon" aria-hidden="true"><GridFour size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-c0bb7974-6dd4-4bb0-b988-970c244344bf">
                  <Typography shuku-edit-id="e-a866c01c-0639-4a6f-a368-e120dcc1431b" as="strong" variant="h3" tone="main">目标模板</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-f02e7ae2-bbd4-4889-843a-06678e36e819"
                className="cg-replay-window-scan__grid"
                role="group"
                aria-label="五乘五目标模板：五格连成一线的地方是 1，其余是 0。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = kernel[row][col];
                  return (
                    <div shuku-edit-id="e-6e492903-071d-4364-a0b4-435bfcd88626" key={cellKey(row, col)} className={cell === 1 ? 'cg-replay-window-scan__grid-cell cg-replay-window-scan__grid-cell--one' : 'cg-replay-window-scan__grid-cell'}>
                      <Typography shuku-edit-id="e-5e242c15-423f-4fdf-a851-109059c0a6ad" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-1d580039-e18e-4967-bb0c-3527f503294e" className="cg-replay-window-scan__result cg-replay-window-scan__result-card">
            <div shuku-edit-id="e-57534c30-fea4-4258-bd8e-07a9b05b8b4c" className="cg-replay-window-scan__result-heading">
              <Typography shuku-edit-id="e-03afc5b2-e597-4a60-a02f-541dfbcbbe65" as="span" variant="body" tone="muted">当前区域的得分</Typography>
            </div>
            <div shuku-edit-id="e-46a7af82-5817-4386-b12b-e3dcbc9ee1bc" className="cg-replay-window-scan__score-row">
              <div shuku-edit-id="e-3f39a2ea-4c37-4d02-9e6c-c01fc1f836f6" className="cg-replay-window-scan__activation-box">
                <Typography shuku-edit-id="e-e8c03bbc-a493-489a-88a9-e0b6014f3962" as="strong" variant="display" tone={found ? 'success' : 'main'}>{value < 0 ? `−${Math.abs(value)}` : value}</Typography>
                <ExplainPanelButton label="查看匹配得分的计算过程" triggerText="?">
                    <Typography shuku-edit-id="e-352bc860-7e18-429f-a06d-665644f04e8c" as="strong" variant="bodySmall" tone="accent">匹配得分怎么得到？</Typography>
                    <Typography shuku-edit-id="e-f5e928bc-55aa-462d-9c1b-66c26c150115" variant="bodySmall" tone="muted">当前区域与目标模板对应位置相乘，再把 25 个乘积相加。</Typography>
                    <div shuku-edit-id="e-bb142846-32b6-48ea-9a51-07fe396bf753" className="cg-replay-window-scan__multiply" role="grid" aria-label="当前窗口与卷积核的逐项乘积">
                      {KERNEL_INDEX.flatMap((row) => KERNEL_INDEX.map((col) => {
                        const product = kernel[row][col] * patch[row][col];
                        return (
                          <span shuku-edit-id="e-d9baddc8-c32a-48bd-9f75-9dffbea1fe1e" className={`cg-replay-window-scan__multiply-cell${product !== 0 ? ' is-active' : ''}`} role="gridcell" key={cellKey(row, col)}>
                            <Typography shuku-edit-id="e-af8ecf83-dbea-49bd-a68f-f68a168b59dc" as="strong" variant="bodySmall" tone={product !== 0 ? 'success' : 'muted'}>{product}</Typography>
                            <Typography shuku-edit-id="e-f01357bd-cf49-4ab4-9f7e-bc1e081634b8" as="span" variant="bodySmall" tone="muted">{`${kernel[row][col]} × ${patch[row][col]}`}</Typography>
                          </span>
                        );
                      }))}
                    </div>
                    <div shuku-edit-id="e-7390da36-62ec-4479-ab65-b1f78fb77452" className="cg-replay-window-scan__sum-line" aria-label={`所有乘积相加等于 ${value}`}>
                      <Typography shuku-edit-id="e-4939431d-4827-4c40-90b5-e08726e319cf" as="span" variant="bodySmall" tone="accent">{`Σ（模板值 × 区域值）= ${value < 0 ? `−${Math.abs(value)}` : value}`}</Typography>
                    </div>
                </ExplainPanelButton>
              </div>
              <Typography shuku-edit-id="e-3ad083c2-7109-4440-b72a-db4fea26b0e7" variant="bodySmall" tone="muted" className="cg-replay-window-scan__result-caption"><Tips size="36" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#EFA94B', '#FFF1D9', '#EFA94B']} /><span shuku-edit-id="e-47a6bd80-5e2d-4638-8dbd-181d9df4f015">得分越高，<br shuku-edit-id="e-b7a52be3-c5e9-4644-820f-55f6e37e577b" />当前位置越符合目标棋形。</span></Typography>
            </div>
          </div>
          <div shuku-edit-id="e-a936c2b6-3e0f-47b7-9b0a-1812fb4f66b0" className="cg-replay-window-scan__instruction" role="status">
            <span shuku-edit-id="e-9b5ee504-ad76-4e5e-9526-a9027dfc22b5" className="cg-replay-window-scan__instruction-icon" aria-hidden="true"><Move size="27" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /></span>
            <Typography shuku-edit-id="e-95e391b4-f96b-456b-b4b4-53f6e50bff23" as="span" variant="body" tone="muted">拖动左侧窗口，寻找匹配得分最高的位置。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
