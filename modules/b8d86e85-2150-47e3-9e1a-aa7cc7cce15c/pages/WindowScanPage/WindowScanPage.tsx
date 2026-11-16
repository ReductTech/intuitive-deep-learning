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
import { useGomokuOutcome } from '../../ShowcaseGomokuContext';
import { BOARD_SIZE, EMPTY, type Board, type Cell } from '../../showcaseGomokuEngine';
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

  const [topLeft, setTopLeft] = useState<Cell>({ row: 4, col: 3 });
  const [dragging, setDragging] = useState(false);

  // 换了一盘棋就回到新的开局位置。
  useEffect(() => setTopLeft({ row: 4, col: 3 }), [outcome.board]);

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
    'aipe-showcase-ck-window-scan__window',
    topLeft.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock shuku-edit-id="e-d5af0304-f79f-48bc-a2ff-1e5cabb4b392"
      headingLevel={1}
      className="aipe-showcase-ck-window-scan"
      title="棋形的局部匹配"
      subtitle="移动一个 5 × 5 模板，比较它与棋盘不同区域的匹配程度。"
    >
      <div shuku-edit-id="e-fcca7ba5-e9ea-4260-aa1c-502ca2d7d7b0" className="aipe-showcase-ck-window-scan__layout">
        <div shuku-edit-id="e-bb03475d-ad10-44d9-a23d-05dedb05bdff" className="aipe-showcase-ck-window-scan__board-slot">
          <div shuku-edit-id="e-2926b10b-4460-431a-90fd-23f8f35f2750"
            ref={boardRef}
            className="aipe-showcase-ck-window-scan__board"
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
                'aipe-showcase-ck-window-scan__cell',
                `aipe-showcase-ck-window-scan__cell--ring-${ring}`,
                cell === 1 ? 'aipe-showcase-ck-window-scan__cell--one' : '',
                cell === -1 ? 'aipe-showcase-ck-window-scan__cell--minus' : '',
                inWindow && op === 1 ? 'aipe-showcase-ck-window-scan__cell--eye' : '',
                hit ? 'aipe-showcase-ck-window-scan__cell--hit' : '',
              ].filter(Boolean).join(' ');
              return (
                <div shuku-edit-id="e-0d9dcc47-d1a2-487e-9ae3-90d48aac4a56" key={cellKey(row, col)} className={classes}>
                  {cell !== EMPTY && <Typography shuku-edit-id="e-572bf03b-c94b-40a5-acbf-a5eab37852a6" as="span" variant="h3" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}
                </div>
              );
            }))}

            <div shuku-edit-id="e-5d3ec986-b410-4ebb-b8ff-a0c94c131104" className={windowClasses} style={windowStyle} aria-hidden="true">
              <span shuku-edit-id="e-af037ee8-d2ed-4f24-929b-27763c6a8e09" className="aipe-showcase-ck-window-scan__grip">
                <i shuku-edit-id="e-042d60e0-d65d-4a53-909a-defbfcf73def" /><i shuku-edit-id="e-bec513cf-4cd7-4c7e-a863-f79cbd6d6460" /><i shuku-edit-id="e-952c7999-5eba-464e-8b51-cda6e9603b45" />
              </span>
            </div>
          </div>

          <ul shuku-edit-id="e-39cd765d-4ebe-430d-9f27-1297aa8ad13b" className="aipe-showcase-ck-window-scan__key">
            <li shuku-edit-id="e-1c7a297d-dd20-40a7-9dd5-c80220e14613" className="aipe-showcase-ck-window-scan__key-item">
              <span shuku-edit-id="e-baabcd86-ae23-4f92-9b46-c4c55fc556b1" className="aipe-showcase-ck-window-scan__key-chip aipe-showcase-ck-window-scan__key-chip--one" aria-hidden="true" />
              <Typography shuku-edit-id="e-e56ea4ad-3fc2-4169-8fe5-87e8173b51d5" as="span" variant="body" tone="muted">橙色＝赢方棋子（1）</Typography>
            </li>
            <li shuku-edit-id="e-87170069-ecde-4601-8510-3b03ee4d7333" className="aipe-showcase-ck-window-scan__key-item">
              <span shuku-edit-id="e-9309722a-3124-487c-9138-9798e040ace4" className="aipe-showcase-ck-window-scan__key-chip aipe-showcase-ck-window-scan__key-chip--minus" aria-hidden="true" />
              <Typography shuku-edit-id="e-849feef3-9624-482e-b5d7-d685729d15c9" as="span" variant="body" tone="muted">蓝色＝败方棋子（−1）</Typography>
            </li>
          </ul>
        </div>

        <div shuku-edit-id="e-119379ef-554c-45e5-b94b-8b0ad0cd7063" className="aipe-showcase-ck-window-scan__panel">
          <div shuku-edit-id="e-500d62c8-20a4-4208-aa83-83d746dd2a37" className="aipe-showcase-ck-window-scan__compare">
            <div shuku-edit-id="e-9fd0e2f4-33a7-4f1b-9023-84bcb5d77438" className="aipe-showcase-ck-window-scan__operand">
              <div shuku-edit-id="e-12307b67-a69d-4ce9-bc22-61ae386480ee" className="aipe-showcase-ck-window-scan__operand-heading">
                <span shuku-edit-id="e-2a0992a6-d0e4-43d1-aaed-bd83459f3e72" className="aipe-showcase-ck-window-scan__operand-icon" aria-hidden="true"><Picture size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-cfab4ea0-66e5-4e87-bb46-a2fca9e7d5b6">
                  <Typography shuku-edit-id="e-68428a21-e9be-4417-99f2-27768c1d4eab" as="strong" variant="h3" tone="main">当前区域</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-563256cc-d09a-4869-a790-b2ecc7185dd3"
                className="aipe-showcase-ck-window-scan__grid"
                role="group"
                aria-label="当前区域的 5 × 5 数值，橙色轮廓标出目标模板中的 1 对应的位置。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = patch[row][col];
                  const eye = kernel[row][col] === 1;
                  const hit = eye && cell === 1;
                  const classes = [
                    'aipe-showcase-ck-window-scan__grid-cell',
                    cell === 1 ? 'aipe-showcase-ck-window-scan__grid-cell--one' : '',
                    cell === -1 ? 'aipe-showcase-ck-window-scan__grid-cell--minus' : '',
                    eye ? 'aipe-showcase-ck-window-scan__grid-cell--eye' : '',
                    hit ? 'aipe-showcase-ck-window-scan__grid-cell--hit' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div shuku-edit-id="e-6fbe5ece-8f87-412a-b147-89f0afd0f895" key={cellKey(row, col)} className={classes}>
                      <Typography shuku-edit-id="e-a2c78e61-e3d0-4bd6-bbd2-8782746028db" as="span" variant="h3" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div shuku-edit-id="e-9befe18b-0b3c-42d5-85db-8ae14b67d0ac" className="aipe-showcase-ck-window-scan__operator-wrap">
              <Typography shuku-edit-id="e-b2602bd9-b92a-4bb3-bb38-2f21f8959d53" as="span" role="img" aria-label="卷积运算符" variant="h2" tone="main" className="aipe-showcase-ck-window-scan__operator is-ready"><Asterisk size="28" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="outline" fill="#173B7A" /></Typography>
              <Typography shuku-edit-id="e-0f23e285-5aa1-4be2-b0b1-80c9c8c87afa" as="span" variant="bodySmall" tone="muted" className="aipe-showcase-ck-window-scan__operator-note">对应位置相乘<br shuku-edit-id="e-5262b4e5-aa5b-44dc-af7a-406f57a3172d" />并求和</Typography>
            </div>

            <div shuku-edit-id="e-95e061d6-2350-4f1d-b2ba-786631e2962f" className="aipe-showcase-ck-window-scan__operand">
              <div shuku-edit-id="e-265d5298-5ec6-4df5-bb4e-697ffc174f36" className="aipe-showcase-ck-window-scan__operand-heading">
                <span shuku-edit-id="e-aacc1242-0521-44ed-b24d-a1c372fff1cc" className="aipe-showcase-ck-window-scan__operand-icon" aria-hidden="true"><GridFour size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-c3ab36c2-8107-47ea-be10-86b23615de43">
                  <Typography shuku-edit-id="e-f749c138-4e70-421a-98c1-4b06f205ccb1" as="strong" variant="h3" tone="main">目标模板</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-ba0cb3ac-992c-457c-a2b2-cee691dccde3"
                className="aipe-showcase-ck-window-scan__grid"
                role="group"
                aria-label="五乘五目标模板：五格连成一线的地方是 1，其余是 0。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = kernel[row][col];
                  return (
                    <div shuku-edit-id="e-0bfde300-14ec-4d4d-bf72-abdf688e1639" key={cellKey(row, col)} className={cell === 1 ? 'aipe-showcase-ck-window-scan__grid-cell aipe-showcase-ck-window-scan__grid-cell--one' : 'aipe-showcase-ck-window-scan__grid-cell'}>
                      <Typography shuku-edit-id="e-d3f82887-4961-448a-a3b7-027149de9d73" as="span" variant="h3" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-5bc9add7-f330-421f-9ea7-b90e535b1228" className="aipe-showcase-ck-window-scan__result aipe-showcase-ck-window-scan__result-card">
            <div shuku-edit-id="e-3923d486-dde0-4214-8da5-868ad09d108d" className="aipe-showcase-ck-window-scan__result-heading">
              <Typography shuku-edit-id="e-513b30a6-598e-4cd6-b3d8-710717be97c1" as="span" variant="body" tone="muted">当前区域的得分</Typography>
            </div>
            <div shuku-edit-id="e-1ae98819-6e20-4e5c-95e4-eb96476dcda4" className="aipe-showcase-ck-window-scan__score-row">
              <div shuku-edit-id="e-4c2f05c1-f612-4670-93a7-e3d8f60d8b1b" className="aipe-showcase-ck-window-scan__activation-box">
                <Typography shuku-edit-id="e-4cc42f65-750f-4b2b-8332-88e5bb4e65a1" as="strong" variant="display" tone={found ? 'success' : 'main'}>{value < 0 ? `−${Math.abs(value)}` : value}</Typography>
                <ExplainPanelButton label="查看匹配得分的计算过程" triggerText="?">
                    <Typography shuku-edit-id="e-03f6d4d5-e75b-4bc5-b44e-deb8e6f2f0f4" as="strong" variant="bodySmall" tone="accent">匹配得分怎么得到？</Typography>
                    <Typography shuku-edit-id="e-8b8dbced-5938-49a7-a1c0-6f233890088f" variant="bodySmall" tone="muted">当前区域与目标模板对应位置相乘，再把 25 个乘积相加。</Typography>
                    <div shuku-edit-id="e-660fea7b-30a6-4017-bc10-8fa4f9f0fad5" className="aipe-showcase-ck-window-scan__multiply" role="grid" aria-label="当前窗口与卷积核的逐项乘积">
                      {KERNEL_INDEX.flatMap((row) => KERNEL_INDEX.map((col) => {
                        const product = kernel[row][col] * patch[row][col];
                        return (
                          <span shuku-edit-id="e-f3b488e3-4295-4e17-86f2-0c7842774a5a" className={`aipe-showcase-ck-window-scan__multiply-cell${product !== 0 ? ' is-active' : ''}`} role="gridcell" key={cellKey(row, col)}>
                            <Typography shuku-edit-id="e-a3bce937-89ea-4524-8f27-71943ee22919" as="strong" variant="bodySmall" tone={product !== 0 ? 'success' : 'muted'}>{product}</Typography>
                            <Typography shuku-edit-id="e-6dfc5ade-5456-4d07-9ab6-f093f2ad6e92" as="span" variant="bodySmall" tone="muted">{`${kernel[row][col]} × ${patch[row][col]}`}</Typography>
                          </span>
                        );
                      }))}
                    </div>
                    <div shuku-edit-id="e-8007f9b4-308d-4756-8d6d-b8ae52e431af" className="aipe-showcase-ck-window-scan__sum-line" aria-label={`所有乘积相加等于 ${value}`}>
                      <Typography shuku-edit-id="e-65eb737c-f2d5-40ac-ae77-f0fa6fbc6d36" as="span" variant="bodySmall" tone="accent">{`Σ（模板值 × 区域值）= ${value < 0 ? `−${Math.abs(value)}` : value}`}</Typography>
                    </div>
                </ExplainPanelButton>
              </div>
              <Typography shuku-edit-id="e-451c6a41-21ba-40e4-a944-2faf6a3fca57" variant="bodySmall" tone="muted" className="aipe-showcase-ck-window-scan__result-caption"><Tips size="36" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#EFA94B', '#FFF1D9', '#EFA94B']} /><span shuku-edit-id="e-594ea98e-bd7b-4822-be03-f8b464fa83b7">得分越高，<br shuku-edit-id="e-dc136757-6718-489b-94ed-87514cc65b49" />当前位置越符合目标棋形。</span></Typography>
            </div>
          </div>
          <div shuku-edit-id="e-72ff8545-757c-4f7b-8819-22df6c7109e5" className="aipe-showcase-ck-window-scan__instruction" role="status">
            <span shuku-edit-id="e-4ac35f81-ae68-4093-9d20-f4bc7fe42182" className="aipe-showcase-ck-window-scan__instruction-icon" aria-hidden="true"><Move size="27" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /></span>
            <Typography shuku-edit-id="e-22506e6e-597d-4ee2-82e2-15faf97a80f9" as="span" variant="body" tone="muted">拖动左侧窗口，寻找匹配得分最高的位置。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
