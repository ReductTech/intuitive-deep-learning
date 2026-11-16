import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NumericBoardDragHint } from '../../components/NumericBoardDragHint';
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
}

export function WindowScanPage({ onComplete }: WindowScanPageProps) {
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
    'cki-window-scan__window',
    topLeft.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock shuku-edit-id="e-61a8931c-2fc4-41d3-99fd-7ee68cfaa3fa"
      headingLevel={1}
      className="cki-window-scan"
      title="棋形的局部匹配"
      subtitle="移动一个 5 × 5 模板，比较它与棋盘不同区域的匹配程度。"
    >
      <div shuku-edit-id="e-73dcbe3a-1364-4383-bf41-c45dd1d87c0b" className="cki-window-scan__layout">
        <div shuku-edit-id="e-9fd80f62-117e-45e3-95b1-838e6c1fb184" className="cki-window-scan__board-slot">
          <div shuku-edit-id="e-c8deb3d4-2c0c-41d3-902c-032511da6ca4"
            ref={boardRef}
            className="cki-window-scan__board" data-numeric-board="cki" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col}
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
                'cki-window-scan__cell',
                `cki-window-scan__cell--ring-${ring}`,
                cell === 1 ? 'cki-window-scan__cell--one' : '',
                cell === -1 ? 'cki-window-scan__cell--minus' : '',
                inWindow && op === 1 ? 'cki-window-scan__cell--eye' : '',
                hit ? 'cki-window-scan__cell--hit' : '',
              ].filter(Boolean).join(' ');
              return (
                <div shuku-edit-id="e-083f1822-d577-404d-9c34-067b0fc69a29" key={cellKey(row, col)} className={classes}>
                  {cell !== EMPTY && <Typography shuku-edit-id="e-db718d40-0f06-46ca-ab98-a9a2889c9348" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}
                </div>
              );
            }))}

            {!hasMoved && !dragging && <NumericBoardDragHint />}
            <div shuku-edit-id="e-1e23c6ba-96fa-4022-9824-864502c3ab44" className={windowClasses} style={windowStyle} aria-hidden="true">
              <span shuku-edit-id="e-8cab58a5-00bb-4ee3-99ba-0691481c85f9" className="cki-window-scan__grip">
                <i shuku-edit-id="e-2f1d2e22-0fb1-46cc-9fd6-783fdc6df314" /><i shuku-edit-id="e-011000bc-c52c-4140-9262-5055b9776986" /><i shuku-edit-id="e-664cfdb9-69c5-4533-89d2-23f1d1b3da85" />
              </span>
            </div>
          </div>

          <ul shuku-edit-id="e-ab280711-cfa2-400f-89f5-2d8c06b928f1" className="cki-window-scan__key">
            <li shuku-edit-id="e-9603cbc6-42bd-4742-b70f-326490608645" className="cki-window-scan__key-item">
              <span shuku-edit-id="e-509d5b72-bd58-46b6-9aac-d4d96346c0fc" className="cki-window-scan__key-chip cki-window-scan__key-chip--one" aria-hidden="true" />
              <Typography shuku-edit-id="e-b4d589a8-bf93-4d7f-aee3-e37400a1798a" as="span" variant="body" tone="muted">橙色＝赢方棋子（1）</Typography>
            </li>
            <li shuku-edit-id="e-ed619f6e-e55a-47b8-902a-b7d82a4990d2" className="cki-window-scan__key-item">
              <span shuku-edit-id="e-aebefe79-f000-4456-9520-51d231b60b35" className="cki-window-scan__key-chip cki-window-scan__key-chip--minus" aria-hidden="true" />
              <Typography shuku-edit-id="e-ba5b377e-8833-492c-8bcc-5400cc9f2e0e" as="span" variant="body" tone="muted">蓝色＝败方棋子（−1）</Typography>
            </li>
          </ul>
        </div>

        <div shuku-edit-id="e-f0d8caea-6b6f-465c-929c-0e8d5f998a94" className="cki-window-scan__panel">
          <div shuku-edit-id="e-83671909-a3b4-4c89-8301-ef0ee297406c" className="cki-window-scan__compare">
            <div shuku-edit-id="e-37861c06-e75e-439f-bfbd-e1b660eaf6a0" className="cki-window-scan__operand">
              <div shuku-edit-id="e-432c5755-13cd-4282-9b56-afa578e47cff" className="cki-window-scan__operand-heading">
                <span shuku-edit-id="e-1090b778-e8cd-44e1-8a3c-9d460b765e1f" className="cki-window-scan__operand-icon" aria-hidden="true"><Picture size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-1bd0e9f0-c3da-4ccc-8d62-f43d2e684adc">
                  <Typography shuku-edit-id="e-20937d50-391c-4a34-ae8c-1dfbd6aaeb7e" as="strong" variant="h3" tone="main">当前区域</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-5d3c9be0-0929-4ad6-9f59-e050e2acd58e"
                className="cki-window-scan__grid"
                role="group"
                aria-label="当前区域的 5 × 5 数值，橙色轮廓标出目标模板中的 1 对应的位置。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = patch[row][col];
                  const eye = kernel[row][col] === 1;
                  const hit = eye && cell === 1;
                  const classes = [
                    'cki-window-scan__grid-cell',
                    cell === 1 ? 'cki-window-scan__grid-cell--one' : '',
                    cell === -1 ? 'cki-window-scan__grid-cell--minus' : '',
                    eye ? 'cki-window-scan__grid-cell--eye' : '',
                    hit ? 'cki-window-scan__grid-cell--hit' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div shuku-edit-id="e-34f7bda2-9af6-425a-8f25-fd07f00da385" key={cellKey(row, col)} className={classes}>
                      <Typography shuku-edit-id="e-f5790e62-80cd-4e17-94e2-487a80fe54d2" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div shuku-edit-id="e-f124b628-f403-4988-b414-18e2c8704f6c" className="cki-window-scan__operator-wrap">
              <Typography shuku-edit-id="e-f009ed06-7693-473a-a06e-48e42ab434f8" as="span" role="img" aria-label="卷积运算符" variant="h2" tone="main" className="cki-window-scan__operator is-ready"><Asterisk size="28" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="outline" fill="#173B7A" /></Typography>
              <Typography shuku-edit-id="e-f6f1ceeb-18b3-4dda-9a83-b8c4cc6c699c" as="span" variant="bodySmall" tone="muted" className="cki-window-scan__operator-note">对应位置相乘<br shuku-edit-id="e-8c9aee7c-f10c-45f7-9bef-832b3c362285" />并求和</Typography>
            </div>

            <div shuku-edit-id="e-eb3a5145-82f5-4681-86f8-2d40781e0421" className="cki-window-scan__operand">
              <div shuku-edit-id="e-7c0faa27-e851-4f56-a6dc-1a783c792200" className="cki-window-scan__operand-heading">
                <span shuku-edit-id="e-5e503e99-c905-41cf-8c9f-8bc06a9357ed" className="cki-window-scan__operand-icon" aria-hidden="true"><GridFour size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-123bfaeb-f7d3-4775-8c9e-022ef7e65e0b">
                  <Typography shuku-edit-id="e-15acff7a-33d0-4e83-a2a4-223c496cba80" as="strong" variant="h3" tone="main">目标模板</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-105be93d-5dd4-4660-adbf-f07416381ce6"
                className="cki-window-scan__grid"
                role="group"
                aria-label="五乘五目标模板：五格连成一线的地方是 1，其余是 0。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = kernel[row][col];
                  return (
                    <div shuku-edit-id="e-578c1ef8-80d9-4b91-95ed-d4abce6c1495" key={cellKey(row, col)} className={cell === 1 ? 'cki-window-scan__grid-cell cki-window-scan__grid-cell--one' : 'cki-window-scan__grid-cell'}>
                      <Typography shuku-edit-id="e-1dc204c7-677c-4216-a491-f1ad35664ebd" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-0f61f562-7864-404f-a7a6-53768bd50556" className="cki-window-scan__result cki-window-scan__result-card">
            <div shuku-edit-id="e-1755cae1-6a84-4bc4-99ce-2ff89d38f296" className="cki-window-scan__result-heading">
              <Typography shuku-edit-id="e-25400b4c-84af-4046-a6d1-10d9e8fbe95e" as="span" variant="body" tone="muted">当前区域的得分</Typography>
            </div>
            <div shuku-edit-id="e-da9faaa6-116d-4fc2-a735-a23aaaf0f44c" className="cki-window-scan__score-row">
              <div shuku-edit-id="e-5eb88e98-66ef-4c54-9734-6176fc1aa742" className="cki-window-scan__activation-box">
                <Typography shuku-edit-id="e-8b83eed6-f82f-41a8-87b8-cd75346f251b" as="strong" variant="display" tone={found ? 'success' : 'main'}>{value < 0 ? `−${Math.abs(value)}` : value}</Typography>
                <ExplainPanelButton label="查看匹配得分的计算过程" triggerText="?">
                    <Typography shuku-edit-id="e-4a1482a3-a91d-4b81-b827-fd3df8ae565b" as="strong" variant="bodySmall" tone="accent">匹配得分怎么得到？</Typography>
                    <Typography shuku-edit-id="e-da56646a-3ca0-44e8-b127-25c07c73e145" variant="bodySmall" tone="muted">当前区域与目标模板对应位置相乘，再把 25 个乘积相加。</Typography>
                    <div shuku-edit-id="e-6faf444f-6341-4282-8a3d-4e0c93785949" className="cki-window-scan__multiply" role="grid" aria-label="当前窗口与卷积核的逐项乘积">
                      {KERNEL_INDEX.flatMap((row) => KERNEL_INDEX.map((col) => {
                        const product = kernel[row][col] * patch[row][col];
                        return (
                          <span shuku-edit-id="e-3379163f-29d0-4181-b147-44b3f378a73a" className={`cki-window-scan__multiply-cell${product !== 0 ? ' is-active' : ''}`} role="gridcell" key={cellKey(row, col)}>
                            <Typography shuku-edit-id="e-bd81f9d5-03bb-43d0-b52b-4473df948825" as="strong" variant="bodySmall" tone={product !== 0 ? 'success' : 'muted'}>{product}</Typography>
                            <Typography shuku-edit-id="e-4c21d138-34d0-459b-92f5-47e74a8acd89" as="span" variant="bodySmall" tone="muted">{`${kernel[row][col]} × ${patch[row][col]}`}</Typography>
                          </span>
                        );
                      }))}
                    </div>
                    <div shuku-edit-id="e-aead4cd0-9b1a-48c7-b88b-8f5fcac243d7" className="cki-window-scan__sum-line" aria-label={`所有乘积相加等于 ${value}`}>
                      <Typography shuku-edit-id="e-e6639a2b-f8e0-4653-a728-f528d417803c" as="span" variant="bodySmall" tone="accent">{`Σ（模板值 × 区域值）= ${value < 0 ? `−${Math.abs(value)}` : value}`}</Typography>
                    </div>
                </ExplainPanelButton>
              </div>
              <Typography shuku-edit-id="e-d2bb29e8-e7db-4fd1-bdf2-bb81ec85a459" variant="bodySmall" tone="muted" className="cki-window-scan__result-caption"><Tips size="36" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#EFA94B', '#FFF1D9', '#EFA94B']} /><span shuku-edit-id="e-dbdce504-8429-4c14-88df-69e4f22ad62f">得分越高，<br shuku-edit-id="e-ad907ba0-f468-4697-a12f-84585751eea1" />当前位置越符合目标棋形。</span></Typography>
            </div>
          </div>
          <div shuku-edit-id="e-64546af7-1f6f-4d19-845e-6ac693a913df" className="cki-window-scan__instruction" role="status">
            <span shuku-edit-id="e-4897a569-7e1d-44d0-b987-b3968a0b76d9" className="cki-window-scan__instruction-icon" aria-hidden="true"><Move size="27" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /></span>
            <Typography shuku-edit-id="e-e68471ed-999a-4259-ab42-9fc02c734edb" as="span" variant="body" tone="muted">拖动左侧窗口，寻找匹配得分最高的位置。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
