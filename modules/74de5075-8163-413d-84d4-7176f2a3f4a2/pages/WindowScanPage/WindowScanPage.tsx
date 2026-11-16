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
    'spp-showcase-window-scan__window',
    topLeft.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock shuku-edit-id="e-e2149c3b-2c98-4c13-b731-f5a05ee5da2a"
      headingLevel={1}
      className="spp-showcase-window-scan"
      title="棋形的局部匹配"
      subtitle="移动一个 5 × 5 模板，比较它与棋盘不同区域的匹配程度。"
    >
      <div shuku-edit-id="e-b273241d-7036-4def-99f5-9e8ec2837879" className="spp-showcase-window-scan__layout">
        <div shuku-edit-id="e-4b1cbba9-e85a-45eb-822b-b8bbd74cca88" className="spp-showcase-window-scan__board-slot">
          <div shuku-edit-id="e-2f19e9b5-33e2-4f86-94a1-a5b542be6941"
            ref={boardRef}
            className="spp-showcase-window-scan__board" data-numeric-board="spp" tabIndex={0} onKeyDown={handleBoardKeyDown} data-window-row={topLeft.row} data-window-col={topLeft.col}
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
                'spp-showcase-window-scan__cell',
                `spp-showcase-window-scan__cell--ring-${ring}`,
                cell === 1 ? 'spp-showcase-window-scan__cell--one' : '',
                cell === -1 ? 'spp-showcase-window-scan__cell--minus' : '',
                inWindow && op === 1 ? 'spp-showcase-window-scan__cell--eye' : '',
                hit ? 'spp-showcase-window-scan__cell--hit' : '',
              ].filter(Boolean).join(' ');
              return (
                <div shuku-edit-id="e-abaf03cb-f612-4df6-9e36-6515bcba3668" key={cellKey(row, col)} className={classes}>
                  {cell !== EMPTY && <Typography shuku-edit-id="e-dd24434e-29d3-4c7b-90ab-134cc18eea12" as="span" variant="h3" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}
                </div>
              );
            }))}

            {!hasMoved && !dragging && <NumericBoardDragHint />}
            <div shuku-edit-id="e-c5404b0f-9082-4bdc-aa46-0142223b4694" className={windowClasses} style={windowStyle} aria-hidden="true">
              <span shuku-edit-id="e-556ee126-e9a7-42f3-9e25-b6267ab2d8e6" className="spp-showcase-window-scan__grip">
                <i shuku-edit-id="e-5b184e8e-00ef-420f-8fd8-9a30c9269230" /><i shuku-edit-id="e-9ce8b26f-3c4e-481b-b973-5406a37651f1" /><i shuku-edit-id="e-363fbbec-7683-4bf5-87e3-ebe19ee55aed" />
              </span>
            </div>
          </div>

          <ul shuku-edit-id="e-d5567aa8-7251-4747-8843-080695e15f99" className="spp-showcase-window-scan__key">
            <li shuku-edit-id="e-65fc4458-ab47-4d6d-9bb3-2a40934990c6" className="spp-showcase-window-scan__key-item">
              <span shuku-edit-id="e-aaef4d09-c79f-4ba6-ae73-5a632a88ea2d" className="spp-showcase-window-scan__key-chip spp-showcase-window-scan__key-chip--one" aria-hidden="true" />
              <Typography shuku-edit-id="e-1859740c-734f-4111-b9b2-db2e153dd0e0" as="span" variant="body" tone="muted">橙色＝赢方棋子（1）</Typography>
            </li>
            <li shuku-edit-id="e-96f4b1b4-0ac6-4c2f-a8fc-8754a051c19d" className="spp-showcase-window-scan__key-item">
              <span shuku-edit-id="e-0c630502-aca3-4dce-a0ff-3a48d6b3f8ff" className="spp-showcase-window-scan__key-chip spp-showcase-window-scan__key-chip--minus" aria-hidden="true" />
              <Typography shuku-edit-id="e-9da98085-8579-405d-a960-7dbc25d34d8f" as="span" variant="body" tone="muted">蓝色＝败方棋子（−1）</Typography>
            </li>
          </ul>
        </div>

        <div shuku-edit-id="e-49e93814-343c-4d05-8ca1-0764a45cf634" className="spp-showcase-window-scan__panel">
          <div shuku-edit-id="e-6d26dec8-5613-47d5-bc22-6c7e230afdc4" className="spp-showcase-window-scan__compare">
            <div shuku-edit-id="e-a20e53a6-9530-43fc-8d5c-c8dca983be9a" className="spp-showcase-window-scan__operand">
              <div shuku-edit-id="e-de906962-4cd6-4cac-bac0-75829c249081" className="spp-showcase-window-scan__operand-heading">
                <span shuku-edit-id="e-2bde1eaf-316d-4d6f-84b6-f62f275ff722" className="spp-showcase-window-scan__operand-icon" aria-hidden="true"><Picture size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-d63d4d5a-1e70-4a8e-b057-943754dbefc3">
                  <Typography shuku-edit-id="e-36b054ea-1b19-4e5c-b500-8b6012582dc6" as="strong" variant="h3" tone="main">当前区域</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-d2a0a052-24db-40d9-9f10-a10f50126c14"
                className="spp-showcase-window-scan__grid"
                role="group"
                aria-label="当前区域的 5 × 5 数值，橙色轮廓标出目标模板中的 1 对应的位置。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = patch[row][col];
                  const eye = kernel[row][col] === 1;
                  const hit = eye && cell === 1;
                  const classes = [
                    'spp-showcase-window-scan__grid-cell',
                    cell === 1 ? 'spp-showcase-window-scan__grid-cell--one' : '',
                    cell === -1 ? 'spp-showcase-window-scan__grid-cell--minus' : '',
                    eye ? 'spp-showcase-window-scan__grid-cell--eye' : '',
                    hit ? 'spp-showcase-window-scan__grid-cell--hit' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div shuku-edit-id="e-0fdc0c46-9a08-448d-ab56-35e70bb7c589" key={cellKey(row, col)} className={classes}>
                      <Typography shuku-edit-id="e-b8ded25e-bbcf-42ee-a6cc-2f56a489485d" as="span" variant="h3" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div shuku-edit-id="e-9898dcba-8f8e-420a-a4cb-077dba722f30" className="spp-showcase-window-scan__operator-wrap">
              <Typography shuku-edit-id="e-e26ee850-ed64-4aff-8c90-dc3d1304de83" as="span" role="img" aria-label="卷积运算符" variant="h2" tone="main" className="spp-showcase-window-scan__operator is-ready"><Asterisk size="28" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="outline" fill="#173B7A" /></Typography>
              <Typography shuku-edit-id="e-bab1014f-bf0c-4163-b919-49b632e32850" as="span" variant="bodySmall" tone="muted" className="spp-showcase-window-scan__operator-note">对应位置相乘<br shuku-edit-id="e-5603ea6a-57c2-4ad4-9ca1-c58c0b3b9a23" />并求和</Typography>
            </div>

            <div shuku-edit-id="e-280514a3-0d3d-4f90-89d5-bbf74b62d15f" className="spp-showcase-window-scan__operand">
              <div shuku-edit-id="e-759ba442-904a-4fd6-a97e-2b53cda026c9" className="spp-showcase-window-scan__operand-heading">
                <span shuku-edit-id="e-3c8f53c4-dce6-4e3a-891b-e1c552b27ddb" className="spp-showcase-window-scan__operand-icon" aria-hidden="true"><GridFour size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-2648a16c-b30a-4891-b3aa-5cd0f1aa4f6c">
                  <Typography shuku-edit-id="e-2f0e00eb-307f-405b-a839-6653e7231ae3" as="strong" variant="h3" tone="main">目标模板</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-4b2be71c-374c-404c-ac91-9498238dd781"
                className="spp-showcase-window-scan__grid"
                role="group"
                aria-label="五乘五目标模板：五格连成一线的地方是 1，其余是 0。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = kernel[row][col];
                  return (
                    <div shuku-edit-id="e-b07ebdab-5ccd-475c-b890-29a9770ccb1a" key={cellKey(row, col)} className={cell === 1 ? 'spp-showcase-window-scan__grid-cell spp-showcase-window-scan__grid-cell--one' : 'spp-showcase-window-scan__grid-cell'}>
                      <Typography shuku-edit-id="e-4191ebcb-1e8d-45be-a974-0ae75202a4ef" as="span" variant="h3" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-a9f2f75f-0bf8-4388-830c-61a8fbadf2c0" className="spp-showcase-window-scan__result spp-showcase-window-scan__result-card">
            <div shuku-edit-id="e-6a1a3a8b-ed68-4f97-bb06-1822500ca7e3" className="spp-showcase-window-scan__result-heading">
              <Typography shuku-edit-id="e-f1cab895-2793-48a0-a224-d90198d40200" as="span" variant="body" tone="muted">当前区域的得分</Typography>
            </div>
            <div shuku-edit-id="e-72bb17db-a2b4-4519-9c1a-05a104e1b4c9" className="spp-showcase-window-scan__score-row">
              <div shuku-edit-id="e-94cc1c3c-5cdf-40da-87c7-327aa9fa549b" className="spp-showcase-window-scan__activation-box">
                <Typography shuku-edit-id="e-5a83034b-2fd3-4847-b693-d7e06542e19d" as="strong" variant="display" tone={found ? 'success' : 'main'}>{value < 0 ? `−${Math.abs(value)}` : value}</Typography>
                <ExplainPanelButton label="查看匹配得分的计算过程" triggerText="?">
                    <Typography shuku-edit-id="e-8d6058ff-e361-42d8-a927-c77d49f7bdb6" as="strong" variant="bodySmall" tone="accent">匹配得分怎么得到？</Typography>
                    <Typography shuku-edit-id="e-40cbe7ca-60a8-4f56-b185-bbf24a53747e" variant="bodySmall" tone="muted">当前区域与目标模板对应位置相乘，再把 25 个乘积相加。</Typography>
                    <div shuku-edit-id="e-616f16bf-0327-4257-b14b-317ff0484fa1" className="spp-showcase-window-scan__multiply" role="grid" aria-label="当前窗口与卷积核的逐项乘积">
                      {KERNEL_INDEX.flatMap((row) => KERNEL_INDEX.map((col) => {
                        const product = kernel[row][col] * patch[row][col];
                        return (
                          <span shuku-edit-id="e-2dbe999d-758d-4989-968e-a27d77442cd3" className={`spp-showcase-window-scan__multiply-cell${product !== 0 ? ' is-active' : ''}`} role="gridcell" key={cellKey(row, col)}>
                            <Typography shuku-edit-id="e-146ed6cb-aed8-4816-9095-291ac3f03584" as="strong" variant="bodySmall" tone={product !== 0 ? 'success' : 'muted'}>{product}</Typography>
                            <Typography shuku-edit-id="e-7f98661d-6e5b-4c5d-b2ce-32ef74e86d2d" as="span" variant="bodySmall" tone="muted">{`${kernel[row][col]} × ${patch[row][col]}`}</Typography>
                          </span>
                        );
                      }))}
                    </div>
                    <div shuku-edit-id="e-ca8b2d4a-ee4c-491d-bc19-aab67fa1188c" className="spp-showcase-window-scan__sum-line" aria-label={`所有乘积相加等于 ${value}`}>
                      <Typography shuku-edit-id="e-cb25065c-cf44-4a36-80e3-a3d52590a9ba" as="span" variant="bodySmall" tone="accent">{`Σ（模板值 × 区域值）= ${value < 0 ? `−${Math.abs(value)}` : value}`}</Typography>
                    </div>
                </ExplainPanelButton>
              </div>
              <Typography shuku-edit-id="e-78e1681f-b868-49ef-b474-43eeec9b108d" variant="bodySmall" tone="muted" className="spp-showcase-window-scan__result-caption"><Tips size="36" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#EFA94B', '#FFF1D9', '#EFA94B']} /><span shuku-edit-id="e-01579b9d-25d6-4263-a81b-895e46c57999">得分越高，<br shuku-edit-id="e-63a50653-82aa-4791-80d4-7536797023fd" />当前位置越符合目标棋形。</span></Typography>
            </div>
          </div>
          <div shuku-edit-id="e-205de7ac-e2be-4354-a4d9-465812f13eb7" className="spp-showcase-window-scan__instruction" role="status">
            <span shuku-edit-id="e-cba7bc00-f4bc-4c41-aa13-ddda6f2c7034" className="spp-showcase-window-scan__instruction-icon" aria-hidden="true"><Move size="27" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /></span>
            <Typography shuku-edit-id="e-fa5bb698-e861-437b-97f1-bdbddc44d48f" as="span" variant="body" tone="muted">拖动左侧窗口，寻找匹配得分最高的位置。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
