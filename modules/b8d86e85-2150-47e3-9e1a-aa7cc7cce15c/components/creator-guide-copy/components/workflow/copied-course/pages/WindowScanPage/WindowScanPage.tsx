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

  const [topLeft, setTopLeft] = useState<Cell>({ row: 4, col: 3 });
  const [dragging, setDragging] = useState(false);

  // 换了一盘棋就回到新的开局位置。
  useEffect(() => setTopLeft({ row: 4, col: 3 }), [outcome.board]);
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
    setTopLeft({
      row: clamp(origin.topLeft.row + cell.row - origin.cell.row, 0, WINDOW_LIMIT),
      col: clamp(origin.topLeft.col + cell.col - origin.cell.col, 0, WINDOW_LIMIT),
    });
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

  const windowStyle: CSSProperties = {
    left: `${topLeft.col * UNIT}%`,
    top: `${topLeft.row * UNIT}%`,
    width: `${KERNEL_SIZE * UNIT}%`,
    height: `${KERNEL_SIZE * UNIT}%`,
  };

  // 小框贴到棋盘上边时把手缩回框内，不然会被棋盘裁掉一半。
  const windowClasses = [
    'aipe-replay-cg-copy-ck-window-scan__window',
    topLeft.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock shuku-edit-id="e-2fef001d-9bf9-498b-b637-155fe8637517"
      headingLevel={1}
      className="aipe-replay-cg-copy-ck-window-scan"
      title="棋形的局部匹配"
      subtitle="移动一个 5 × 5 模板，比较它与棋盘不同区域的匹配程度。"
    >
      <div shuku-edit-id="e-8a4d54c2-0cd2-4c20-9b2a-7ec4e6b3c2d8" className="aipe-replay-cg-copy-ck-window-scan__layout">
        <div shuku-edit-id="e-7c17835e-7c51-4e8c-99c0-764f52b03acb" className="aipe-replay-cg-copy-ck-window-scan__board-slot">
          <div shuku-edit-id="e-cd5620fe-7836-4e1d-8561-2dc216e1895c"
            ref={boardRef}
            className="aipe-replay-cg-copy-ck-window-scan__board"
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
                'aipe-replay-cg-copy-ck-window-scan__cell',
                `aipe-replay-cg-copy-ck-window-scan__cell--ring-${ring}`,
                cell === 1 ? 'aipe-replay-cg-copy-ck-window-scan__cell--one' : '',
                cell === -1 ? 'aipe-replay-cg-copy-ck-window-scan__cell--minus' : '',
                inWindow && op === 1 ? 'aipe-replay-cg-copy-ck-window-scan__cell--eye' : '',
                hit ? 'aipe-replay-cg-copy-ck-window-scan__cell--hit' : '',
              ].filter(Boolean).join(' ');
              return (
                <div shuku-edit-id="e-6b882244-edc2-48c3-8339-20d8903506b4" key={cellKey(row, col)} className={classes}>
                  {cell !== EMPTY && <Typography shuku-edit-id="e-873c1a9a-0b98-4c9b-87b6-e0c87db78ec9" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}
                </div>
              );
            }))}

            <div shuku-edit-id="e-e5016519-78f7-4c96-adb3-8f5c888e771f" className={windowClasses} style={windowStyle} aria-hidden="true">
              <span shuku-edit-id="e-0adc9117-835a-40b8-8dc2-fe9f4ef320ba" className="aipe-replay-cg-copy-ck-window-scan__grip">
                <i shuku-edit-id="e-86d6f535-8ec8-461d-b328-28a9bf6e9b56" /><i shuku-edit-id="e-ab4b00d8-8f73-43ae-bfb0-777e969f9004" /><i shuku-edit-id="e-24a2bbbe-c349-4e2f-bbb5-c6f29d63c4b7" />
              </span>
            </div>
          </div>

          <ul shuku-edit-id="e-d16c6771-d5f0-458f-806d-d3238cdcea04" className="aipe-replay-cg-copy-ck-window-scan__key">
            <li shuku-edit-id="e-aba8a962-e39b-4f6d-b6e5-b209963238b3" className="aipe-replay-cg-copy-ck-window-scan__key-item">
              <span shuku-edit-id="e-837718a3-d7d8-4274-9307-4250dc2f11e9" className="aipe-replay-cg-copy-ck-window-scan__key-chip aipe-replay-cg-copy-ck-window-scan__key-chip--one" aria-hidden="true" />
              <Typography shuku-edit-id="e-a551bb95-b1b4-4377-864a-0a29456cf4ba" as="span" variant="body" tone="muted">橙色＝赢方棋子（1）</Typography>
            </li>
            <li shuku-edit-id="e-c1c5af83-33b9-4eb3-b8de-a1f95e660ce2" className="aipe-replay-cg-copy-ck-window-scan__key-item">
              <span shuku-edit-id="e-d1116d7d-8fa7-4c75-8774-4dbf81317e13" className="aipe-replay-cg-copy-ck-window-scan__key-chip aipe-replay-cg-copy-ck-window-scan__key-chip--minus" aria-hidden="true" />
              <Typography shuku-edit-id="e-86ba7348-c8a0-4957-90f3-2035f292493c" as="span" variant="body" tone="muted">蓝色＝败方棋子（−1）</Typography>
            </li>
          </ul>
        </div>

        <div shuku-edit-id="e-21f263e9-776c-44c0-b0be-140babbbc839" className="aipe-replay-cg-copy-ck-window-scan__panel">
          <div shuku-edit-id="e-f4f40a71-e9a1-4d6b-91c9-526f59914b85" className="aipe-replay-cg-copy-ck-window-scan__compare">
            <div shuku-edit-id="e-3707789d-66c7-46e6-81fa-6f8e708fb09c" className="aipe-replay-cg-copy-ck-window-scan__operand">
              <div shuku-edit-id="e-379271a9-d64b-4a48-be4c-455c45a7abd9" className="aipe-replay-cg-copy-ck-window-scan__operand-heading">
                <span shuku-edit-id="e-cff18db6-8783-4ad7-b4bc-de4f3585dc88" className="aipe-replay-cg-copy-ck-window-scan__operand-icon" aria-hidden="true"><Picture size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-9ed6e813-8a0e-4ac5-ace8-89255c51925c">
                  <Typography shuku-edit-id="e-bdfb7345-1ae0-45ed-93a7-a97659c2ce9a" as="strong" variant="h3" tone="main">当前区域</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-c5edbfed-cc7c-4074-bd45-db422ffda21e"
                className="aipe-replay-cg-copy-ck-window-scan__grid"
                role="group"
                aria-label="当前区域的 5 × 5 数值，橙色轮廓标出目标模板中的 1 对应的位置。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = patch[row][col];
                  const eye = kernel[row][col] === 1;
                  const hit = eye && cell === 1;
                  const classes = [
                    'aipe-replay-cg-copy-ck-window-scan__grid-cell',
                    cell === 1 ? 'aipe-replay-cg-copy-ck-window-scan__grid-cell--one' : '',
                    cell === -1 ? 'aipe-replay-cg-copy-ck-window-scan__grid-cell--minus' : '',
                    eye ? 'aipe-replay-cg-copy-ck-window-scan__grid-cell--eye' : '',
                    hit ? 'aipe-replay-cg-copy-ck-window-scan__grid-cell--hit' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div shuku-edit-id="e-d0a3e656-220d-42ff-bbcf-e157395c103b" key={cellKey(row, col)} className={classes}>
                      <Typography shuku-edit-id="e-87080b3d-e96f-464b-851f-7a3148cc2b29" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div shuku-edit-id="e-81232eb9-f92a-48db-a38c-9e117203c189" className="aipe-replay-cg-copy-ck-window-scan__operator-wrap">
              <Typography shuku-edit-id="e-759a518a-f25d-4b83-9e5d-8d98272b849d" as="span" role="img" aria-label="卷积运算符" variant="h2" tone="main" className="aipe-replay-cg-copy-ck-window-scan__operator is-ready"><Asterisk size="28" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="outline" fill="#173B7A" /></Typography>
            </div>

            <div shuku-edit-id="e-d4dcc106-9680-404d-a840-3176e26f155c" className="aipe-replay-cg-copy-ck-window-scan__operand">
              <div shuku-edit-id="e-cf83d7b1-ea90-4f2a-a881-e105c833c9df" className="aipe-replay-cg-copy-ck-window-scan__operand-heading">
                <span shuku-edit-id="e-05a3803e-edb3-4ace-bdad-4ce3b33bed60" className="aipe-replay-cg-copy-ck-window-scan__operand-icon" aria-hidden="true"><GridFour size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-fc8ac74d-b6dc-4a6c-89d5-edd92093ab86">
                  <Typography shuku-edit-id="e-8f3b84e6-49fc-425a-b121-a010f7c39346" as="strong" variant="h3" tone="main">目标模板</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-e7852606-bc9e-4fd6-bb20-5e818d49e5ee"
                className="aipe-replay-cg-copy-ck-window-scan__grid"
                role="group"
                aria-label="五乘五目标模板：五格连成一线的地方是 1，其余是 0。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = kernel[row][col];
                  return (
                    <div shuku-edit-id="e-5014df20-1f74-41c9-9d8b-2992d9366822" key={cellKey(row, col)} className={cell === 1 ? 'aipe-replay-cg-copy-ck-window-scan__grid-cell aipe-replay-cg-copy-ck-window-scan__grid-cell--one' : 'aipe-replay-cg-copy-ck-window-scan__grid-cell'}>
                      <Typography shuku-edit-id="e-dcc2afed-b19f-45f8-8567-fd71f09e5082" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-dd1971ee-aca8-4a3f-9455-7fa691e0fdf4" className="aipe-replay-cg-copy-ck-window-scan__result aipe-replay-cg-copy-ck-window-scan__result-card">
            <div shuku-edit-id="e-0b148ba1-2c3f-4324-9833-60c89575a8a0" className="aipe-replay-cg-copy-ck-window-scan__result-heading">
              <Typography shuku-edit-id="e-b5bddc69-fab1-4a4d-92d1-28071b8358ad" as="span" variant="body" tone="muted">当前区域的得分</Typography>
            </div>
            <div shuku-edit-id="e-d4d756e8-e710-45a3-a84a-3d0e6e8f52f2" className="aipe-replay-cg-copy-ck-window-scan__score-row">
              <div shuku-edit-id="e-0278ba95-ee78-4288-8f84-ba1139bcd64a" className="aipe-replay-cg-copy-ck-window-scan__activation-box">
                <Typography shuku-edit-id="e-090e51f8-d9d8-4ad0-a5f9-67fc204058f1" as="strong" variant="display" tone={found ? 'success' : 'main'}>{value < 0 ? `−${Math.abs(value)}` : value}</Typography>
                <ExplainPanelButton label="查看匹配得分的计算过程" triggerText="?">
                    <Typography shuku-edit-id="e-808a4bea-fb66-409f-9652-be3e3379b33a" as="strong" variant="bodySmall" tone="accent">匹配得分怎么得到？</Typography>
                    <Typography shuku-edit-id="e-393adb62-884a-4dc9-ae52-5932e3e21951" variant="bodySmall" tone="muted">当前区域与目标模板对应位置相乘，再把 25 个乘积相加。</Typography>
                    <div shuku-edit-id="e-e08f5a67-31d5-40ea-8f9d-bcb3760095ad" className="aipe-replay-cg-copy-ck-window-scan__multiply" role="grid" aria-label="当前窗口与卷积核的逐项乘积">
                      {KERNEL_INDEX.flatMap((row) => KERNEL_INDEX.map((col) => {
                        const product = kernel[row][col] * patch[row][col];
                        return (
                          <span shuku-edit-id="e-98c16cb0-e8b9-4fe7-9171-d44e4246ab9c" className={`aipe-replay-cg-copy-ck-window-scan__multiply-cell${product !== 0 ? ' is-active' : ''}`} role="gridcell" key={cellKey(row, col)}>
                            <Typography shuku-edit-id="e-b5b180d0-1568-45af-9dff-9f54794c2d89" as="strong" variant="bodySmall" tone={product !== 0 ? 'success' : 'muted'}>{product}</Typography>
                            <Typography shuku-edit-id="e-a2b92cbd-9cae-4a3b-ab86-b934ffd2bfca" as="span" variant="bodySmall" tone="muted">{`${kernel[row][col]} × ${patch[row][col]}`}</Typography>
                          </span>
                        );
                      }))}
                    </div>
                    <div shuku-edit-id="e-7fc97661-5698-4348-8ee9-81ced05681d4" className="aipe-replay-cg-copy-ck-window-scan__sum-line" aria-label={`所有乘积相加等于 ${value}`}>
                      <Typography shuku-edit-id="e-b22440e6-5929-4dbb-a9ae-99783529e104" as="span" variant="bodySmall" tone="accent">{`Σ（模板值 × 区域值）= ${value < 0 ? `−${Math.abs(value)}` : value}`}</Typography>
                    </div>
                </ExplainPanelButton>
              </div>
              <Typography shuku-edit-id="e-00b8f529-a0e8-4299-a313-9e9b3a26b751" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-window-scan__result-caption"><Tips size="36" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#EFA94B', '#FFF1D9', '#EFA94B']} /><span shuku-edit-id="e-8ebbaedd-171c-43eb-9bc7-e891cb31c4ed">得分越高，<br shuku-edit-id="e-e6ae7d2a-97ed-40f0-a11a-a5d95d412790" />当前位置越符合目标棋形。</span></Typography>
            </div>
          </div>
          <div shuku-edit-id="e-197b83aa-0f91-40de-9423-d5e1a2f9fc96" className="aipe-replay-cg-copy-ck-window-scan__instruction" role="status">
            <span shuku-edit-id="e-331b4a57-30ff-4fba-b2a5-0807566e20f5" className="aipe-replay-cg-copy-ck-window-scan__instruction-icon" aria-hidden="true"><Move size="27" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /></span>
            <Typography shuku-edit-id="e-c24ccc09-f7b4-406c-a24e-4dba7ff94f34" as="span" variant="body" tone="muted">拖动左侧窗口，寻找匹配得分最高的位置。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
