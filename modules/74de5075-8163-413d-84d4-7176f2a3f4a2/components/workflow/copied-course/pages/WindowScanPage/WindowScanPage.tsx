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
    'spp-copy-window-scan__window',
    topLeft.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock shuku-edit-id="e-1214c80b-65da-48b0-a4bf-12d7f1c02604"
      headingLevel={1}
      className="spp-copy-window-scan"
      title="棋形的局部匹配"
      subtitle="移动一个 5 × 5 模板，比较它与棋盘不同区域的匹配程度。"
    >
      <div shuku-edit-id="e-e4b88e03-70c4-4f39-8354-e9b5f0b256e9" className="spp-copy-window-scan__layout">
        <div shuku-edit-id="e-ad2f3d40-ea54-4832-9ed1-037b579b3be5" className="spp-copy-window-scan__board-slot">
          <div shuku-edit-id="e-c25d4aa8-88a1-46bb-94fd-f31121e8aeb5"
            ref={boardRef}
            className="spp-copy-window-scan__board" data-numeric-board="spp" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col}
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
                'spp-copy-window-scan__cell',
                `spp-copy-window-scan__cell--ring-${ring}`,
                cell === 1 ? 'spp-copy-window-scan__cell--one' : '',
                cell === -1 ? 'spp-copy-window-scan__cell--minus' : '',
                inWindow && op === 1 ? 'spp-copy-window-scan__cell--eye' : '',
                hit ? 'spp-copy-window-scan__cell--hit' : '',
              ].filter(Boolean).join(' ');
              return (
                <div shuku-edit-id="e-90185b49-8680-4393-aac9-a273c36a279b" key={cellKey(row, col)} className={classes}>
                  {cell !== EMPTY && <Typography shuku-edit-id="e-1847bb75-a30a-4163-9575-eca49ef992d9" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}
                </div>
              );
            }))}

            {!hasMoved && !dragging && <NumericBoardDragHint />}
            <div shuku-edit-id="e-73e050e9-a0e9-484f-a7fa-87e826e450ca" className={windowClasses} style={windowStyle} aria-hidden="true">
              <span shuku-edit-id="e-3f2d4390-8670-4c22-8b60-c99e46d0ad74" className="spp-copy-window-scan__grip">
                <i shuku-edit-id="e-d3119486-bdbf-44d9-a55d-ef6cd188d5c4" /><i shuku-edit-id="e-5da02953-3007-475c-889c-c8dd403175be" /><i shuku-edit-id="e-1cb12027-70ae-4c0f-839c-8d71d2a4af83" />
              </span>
            </div>
          </div>

          <ul shuku-edit-id="e-ae860fcd-7d3c-4999-a649-08d46fa47865" className="spp-copy-window-scan__key">
            <li shuku-edit-id="e-8302a185-c897-4885-aa10-3ab616fd120b" className="spp-copy-window-scan__key-item">
              <span shuku-edit-id="e-3d9885e4-094c-410b-9b49-01ab04f6960f" className="spp-copy-window-scan__key-chip spp-copy-window-scan__key-chip--one" aria-hidden="true" />
              <Typography shuku-edit-id="e-08ae98d0-0135-4dba-a7bb-eadb0f43e4b9" as="span" variant="body" tone="muted">橙色＝赢方棋子（1）</Typography>
            </li>
            <li shuku-edit-id="e-e2952fbb-67ae-401e-986b-13b0c1c7d622" className="spp-copy-window-scan__key-item">
              <span shuku-edit-id="e-a7927ebd-677e-4ab4-8085-02cf1de92fe2" className="spp-copy-window-scan__key-chip spp-copy-window-scan__key-chip--minus" aria-hidden="true" />
              <Typography shuku-edit-id="e-9c1d2bf1-4fe5-4760-b7b3-5a34d128e13b" as="span" variant="body" tone="muted">蓝色＝败方棋子（−1）</Typography>
            </li>
          </ul>
        </div>

        <div shuku-edit-id="e-bd94335b-697e-4c17-87d2-ee0b9fa090fb" className="spp-copy-window-scan__panel">
          <div shuku-edit-id="e-f56cc5a2-ab5b-40b5-a77d-2a2920d58a24" className="spp-copy-window-scan__compare">
            <div shuku-edit-id="e-cff0442f-cb6a-421e-bc88-78cf2619e5b9" className="spp-copy-window-scan__operand">
              <div shuku-edit-id="e-42ee7e4a-90cd-4ae0-a816-99d66b477266" className="spp-copy-window-scan__operand-heading">
                <span shuku-edit-id="e-cb5a1a65-6e5e-4681-bbd1-36d97c56c515" className="spp-copy-window-scan__operand-icon" aria-hidden="true"><Picture size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-55a38ebe-99b3-4681-8b41-536c4a4179f9">
                  <Typography shuku-edit-id="e-36dc0c7b-b9e2-47f4-bb55-f6e710ff2577" as="strong" variant="h3" tone="main">当前区域</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-f7a8746f-c3eb-4f4d-939d-5fbf62165bc4"
                className="spp-copy-window-scan__grid"
                role="group"
                aria-label="当前区域的 5 × 5 数值，橙色轮廓标出目标模板中的 1 对应的位置。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = patch[row][col];
                  const eye = kernel[row][col] === 1;
                  const hit = eye && cell === 1;
                  const classes = [
                    'spp-copy-window-scan__grid-cell',
                    cell === 1 ? 'spp-copy-window-scan__grid-cell--one' : '',
                    cell === -1 ? 'spp-copy-window-scan__grid-cell--minus' : '',
                    eye ? 'spp-copy-window-scan__grid-cell--eye' : '',
                    hit ? 'spp-copy-window-scan__grid-cell--hit' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div shuku-edit-id="e-03433061-7ec9-4c20-a409-92944d5e4475" key={cellKey(row, col)} className={classes}>
                      <Typography shuku-edit-id="e-5c20031f-15cb-48c4-b7d5-415297a22ed7" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div shuku-edit-id="e-3d8ccac6-adc2-404e-820b-1654db162a02" className="spp-copy-window-scan__operator-wrap">
              <Typography shuku-edit-id="e-da5b92a1-31f2-4238-a5f6-458de2aed3b4" as="span" role="img" aria-label="卷积运算符" variant="h2" tone="main" className="spp-copy-window-scan__operator is-ready"><Asterisk size="28" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="outline" fill="#173B7A" /></Typography>
              <Typography shuku-edit-id="e-808a758a-5665-4ccf-9ff8-f8be7167d00f" as="span" variant="bodySmall" tone="muted" className="spp-copy-window-scan__operator-note">对应位置相乘<br shuku-edit-id="e-6f5142d5-aff2-4ff7-a274-d6d749f01a3d" />并求和</Typography>
            </div>

            <div shuku-edit-id="e-4b9fd0ac-9248-4883-b224-38164b4e5230" className="spp-copy-window-scan__operand">
              <div shuku-edit-id="e-961c9c75-3bde-4290-8843-bff852589a77" className="spp-copy-window-scan__operand-heading">
                <span shuku-edit-id="e-68d124dd-36ed-49bc-8a91-62de2f480485" className="spp-copy-window-scan__operand-icon" aria-hidden="true"><GridFour size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-0aa22986-3f51-4d50-8e60-aa4ee79065a2">
                  <Typography shuku-edit-id="e-38a4f889-33ba-48be-b62f-500ceb236675" as="strong" variant="h3" tone="main">目标模板</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-c1b95e15-3ee6-45a2-a894-d72539c85e74"
                className="spp-copy-window-scan__grid"
                role="group"
                aria-label="五乘五目标模板：五格连成一线的地方是 1，其余是 0。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = kernel[row][col];
                  return (
                    <div shuku-edit-id="e-bdc6d2d4-b712-4eaf-b120-ea18a3ac5bd7" key={cellKey(row, col)} className={cell === 1 ? 'spp-copy-window-scan__grid-cell spp-copy-window-scan__grid-cell--one' : 'spp-copy-window-scan__grid-cell'}>
                      <Typography shuku-edit-id="e-1d70dca7-fb9a-4f55-b1a7-72419e2eb26d" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-901d6180-67ae-4680-85ff-a0d821f41955" className="spp-copy-window-scan__result spp-copy-window-scan__result-card">
            <div shuku-edit-id="e-39334002-40d3-4c32-929c-c3a75c6606d7" className="spp-copy-window-scan__result-heading">
              <Typography shuku-edit-id="e-13609979-dc00-4aad-9542-94a34ce3a3e9" as="span" variant="body" tone="muted">当前区域的得分</Typography>
            </div>
            <div shuku-edit-id="e-225980e6-2f0b-4328-ad27-39d9ba3f1f5c" className="spp-copy-window-scan__score-row">
              <div shuku-edit-id="e-68992319-89b8-4a36-bf10-3cf387ce47a7" className="spp-copy-window-scan__activation-box">
                <Typography shuku-edit-id="e-43bd2605-2840-495f-816c-8ce708e169b9" as="strong" variant="display" tone={found ? 'success' : 'main'}>{value < 0 ? `−${Math.abs(value)}` : value}</Typography>
                <ExplainPanelButton label="查看匹配得分的计算过程" triggerText="?">
                    <Typography shuku-edit-id="e-1ec902c9-664f-4328-ba01-320c40de8db4" as="strong" variant="bodySmall" tone="accent">匹配得分怎么得到？</Typography>
                    <Typography shuku-edit-id="e-74e48cbb-c067-4d48-9b11-3772779dae71" variant="bodySmall" tone="muted">当前区域与目标模板对应位置相乘，再把 25 个乘积相加。</Typography>
                    <div shuku-edit-id="e-388f39ab-724c-417d-a401-b8c9ab8957e9" className="spp-copy-window-scan__multiply" role="grid" aria-label="当前窗口与卷积核的逐项乘积">
                      {KERNEL_INDEX.flatMap((row) => KERNEL_INDEX.map((col) => {
                        const product = kernel[row][col] * patch[row][col];
                        return (
                          <span shuku-edit-id="e-f518c22d-72f2-4cc2-b6aa-79f9b293914b" className={`spp-copy-window-scan__multiply-cell${product !== 0 ? ' is-active' : ''}`} role="gridcell" key={cellKey(row, col)}>
                            <Typography shuku-edit-id="e-bb6801da-9649-4a23-9bd7-d63bfa52f194" as="strong" variant="bodySmall" tone={product !== 0 ? 'success' : 'muted'}>{product}</Typography>
                            <Typography shuku-edit-id="e-24fdf84e-f9c5-4549-9409-e579d9890fc6" as="span" variant="bodySmall" tone="muted">{`${kernel[row][col]} × ${patch[row][col]}`}</Typography>
                          </span>
                        );
                      }))}
                    </div>
                    <div shuku-edit-id="e-fa706441-e335-4fcd-a220-26c3f96838ca" className="spp-copy-window-scan__sum-line" aria-label={`所有乘积相加等于 ${value}`}>
                      <Typography shuku-edit-id="e-9803975e-18c7-477d-b697-08ee5580daa5" as="span" variant="bodySmall" tone="accent">{`Σ（模板值 × 区域值）= ${value < 0 ? `−${Math.abs(value)}` : value}`}</Typography>
                    </div>
                </ExplainPanelButton>
              </div>
              <Typography shuku-edit-id="e-adab2aa4-6500-4ebd-aa5d-b79a8be73be8" variant="bodySmall" tone="muted" className="spp-copy-window-scan__result-caption"><Tips size="36" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#EFA94B', '#FFF1D9', '#EFA94B']} /><span shuku-edit-id="e-08f71272-f451-4d09-8f14-7e93359c57b2">得分越高，<br shuku-edit-id="e-590094db-faa1-441b-93f9-f555dbe6304c" />当前位置越符合目标棋形。</span></Typography>
            </div>
          </div>
          <div shuku-edit-id="e-87b23d08-3b17-4acc-85ba-3b6c518788c0" className="spp-copy-window-scan__instruction" role="status">
            <span shuku-edit-id="e-7087f8f1-9fbb-4b15-b450-9a03da76fd05" className="spp-copy-window-scan__instruction-icon" aria-hidden="true"><Move size="27" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /></span>
            <Typography shuku-edit-id="e-c3761ac5-23bf-4419-a283-527fcc41d928" as="span" variant="body" tone="muted">拖动左侧窗口，寻找匹配得分最高的位置。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
