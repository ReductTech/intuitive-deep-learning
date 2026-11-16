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
    'cg-copy-ck-window-scan__window',
    topLeft.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock shuku-edit-id="e-cd783fa0-5db4-4d77-9841-32e3ce6e59c9"
      headingLevel={1}
      className="cg-copy-ck-window-scan"
      title="棋形的局部匹配"
      subtitle="移动一个 5 × 5 模板，比较它与棋盘不同区域的匹配程度。"
    >
      <div shuku-edit-id="e-ed70f334-027a-431f-adbd-3b4bff049cc4" className="cg-copy-ck-window-scan__layout">
        <div shuku-edit-id="e-cad752ca-6e98-478a-b1fe-53414ac43c3c" className="cg-copy-ck-window-scan__board-slot">
          <div shuku-edit-id="e-e2143abc-a374-4fd1-9e62-0f0be74fbad1"
            ref={boardRef}
            className="cg-copy-ck-window-scan__board"
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
                'cg-copy-ck-window-scan__cell',
                `cg-copy-ck-window-scan__cell--ring-${ring}`,
                cell === 1 ? 'cg-copy-ck-window-scan__cell--one' : '',
                cell === -1 ? 'cg-copy-ck-window-scan__cell--minus' : '',
                inWindow && op === 1 ? 'cg-copy-ck-window-scan__cell--eye' : '',
                hit ? 'cg-copy-ck-window-scan__cell--hit' : '',
              ].filter(Boolean).join(' ');
              return (
                <div shuku-edit-id="e-2e36d113-2757-4fe1-813a-5461ceb6e6a9" key={cellKey(row, col)} className={classes}>
                  {cell !== EMPTY && <Typography shuku-edit-id="e-77227128-79bd-42e2-b6fe-e27f2b913910" as="span" variant="body" tone="inherit" aria-hidden="true">{cell === 1 ? '1' : '-1'}</Typography>}
                </div>
              );
            }))}

            <div shuku-edit-id="e-72d04b30-a310-48c3-8056-80bc4c890bbd" className={windowClasses} style={windowStyle} aria-hidden="true">
              <span shuku-edit-id="e-4561e8e4-270e-4549-b69a-29580f0acd98" className="cg-copy-ck-window-scan__grip">
                <i shuku-edit-id="e-035f9204-2d8f-4dbf-8f66-5c379c3dd216" /><i shuku-edit-id="e-2db01771-377f-48fe-8c92-dfe54048b33f" /><i shuku-edit-id="e-1e52c707-da8a-4580-b4cc-06c3b6770c1b" />
              </span>
            </div>
          </div>

          <ul shuku-edit-id="e-dba67c88-7c09-41cb-8065-3b11029cfe78" className="cg-copy-ck-window-scan__key">
            <li shuku-edit-id="e-bd6012d1-2d9b-405b-8604-af3a483ead1d" className="cg-copy-ck-window-scan__key-item">
              <span shuku-edit-id="e-b32d9161-4d51-45ea-8143-48fb0c08c08b" className="cg-copy-ck-window-scan__key-chip cg-copy-ck-window-scan__key-chip--one" aria-hidden="true" />
              <Typography shuku-edit-id="e-e6edd7f5-0cfd-4c48-b537-a3bfb838e7af" as="span" variant="body" tone="muted">橙色＝赢方棋子（1）</Typography>
            </li>
            <li shuku-edit-id="e-221fa5fa-892d-4c37-8ba6-15f43df53c9f" className="cg-copy-ck-window-scan__key-item">
              <span shuku-edit-id="e-b9f981f7-e196-4034-ac0b-6cfb4f35ba68" className="cg-copy-ck-window-scan__key-chip cg-copy-ck-window-scan__key-chip--minus" aria-hidden="true" />
              <Typography shuku-edit-id="e-8d8d4630-5c3f-4b81-87b8-2ff2e2959e68" as="span" variant="body" tone="muted">蓝色＝败方棋子（−1）</Typography>
            </li>
          </ul>
        </div>

        <div shuku-edit-id="e-89c54db7-f21f-4027-a44f-47e4721b8c18" className="cg-copy-ck-window-scan__panel">
          <div shuku-edit-id="e-8290cfa6-8ef4-49ae-9fef-3e99d569e70b" className="cg-copy-ck-window-scan__compare">
            <div shuku-edit-id="e-e1be11d2-719d-41a9-821a-c05f735307ad" className="cg-copy-ck-window-scan__operand">
              <div shuku-edit-id="e-baebb50a-ae2a-4b44-bd33-693afb76faa6" className="cg-copy-ck-window-scan__operand-heading">
                <span shuku-edit-id="e-7a1ea147-5bb6-471a-8bb7-79fdc39deedf" className="cg-copy-ck-window-scan__operand-icon" aria-hidden="true"><Picture size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-fb4d731f-4d55-47d2-8dff-80781ee913ab">
                  <Typography shuku-edit-id="e-e389e2ad-6905-4014-b377-7119ad56ba19" as="strong" variant="h3" tone="main">当前区域</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-be994808-267b-4f85-944f-0647bf3b616a"
                className="cg-copy-ck-window-scan__grid"
                role="group"
                aria-label="当前区域的 5 × 5 数值，橙色轮廓标出目标模板中的 1 对应的位置。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = patch[row][col];
                  const eye = kernel[row][col] === 1;
                  const hit = eye && cell === 1;
                  const classes = [
                    'cg-copy-ck-window-scan__grid-cell',
                    cell === 1 ? 'cg-copy-ck-window-scan__grid-cell--one' : '',
                    cell === -1 ? 'cg-copy-ck-window-scan__grid-cell--minus' : '',
                    eye ? 'cg-copy-ck-window-scan__grid-cell--eye' : '',
                    hit ? 'cg-copy-ck-window-scan__grid-cell--hit' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div shuku-edit-id="e-6067efd8-2559-44c9-b1f8-718cd794e5bf" key={cellKey(row, col)} className={classes}>
                      <Typography shuku-edit-id="e-1ec0483b-7bed-420d-bd1b-90702206254d" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div shuku-edit-id="e-e396508a-291f-4cbd-8f07-56d0324da77e" className="cg-copy-ck-window-scan__operator-wrap">
              <Typography shuku-edit-id="e-7a61d912-86c4-4b38-8a24-530932a270dc" as="span" role="img" aria-label="卷积运算符" variant="h2" tone="main" className="cg-copy-ck-window-scan__operator is-ready"><Asterisk size="28" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="outline" fill="#173B7A" /></Typography>
              <Typography shuku-edit-id="e-be34be80-5610-4d11-b74e-775b8ef81292" as="span" variant="bodySmall" tone="muted" className="cg-copy-ck-window-scan__operator-note">对应位置相乘<br shuku-edit-id="e-4a899bc7-9a03-4f84-84cd-893ec6adec36" />并求和</Typography>
            </div>

            <div shuku-edit-id="e-b107b268-7bc2-4ecc-b1b7-0ccbb0d99c01" className="cg-copy-ck-window-scan__operand">
              <div shuku-edit-id="e-28926b28-f8ef-494e-91cb-250cf63a1ebd" className="cg-copy-ck-window-scan__operand-heading">
                <span shuku-edit-id="e-7fd8955a-26ce-420e-86f9-860ac9c07c24" className="cg-copy-ck-window-scan__operand-icon" aria-hidden="true"><GridFour size="25" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF', '#FFFFFF', '#5B8DE8']} /></span>
                <div shuku-edit-id="e-465e25ca-e21a-4b8f-8ee5-910874821313">
                  <Typography shuku-edit-id="e-ec369dda-00e2-4acb-95d0-35835c36487f" as="strong" variant="h3" tone="main">目标模板</Typography>
                </div>
              </div>
              <div shuku-edit-id="e-5ca93c6f-674e-4a15-b0f4-e38df10055ca"
                className="cg-copy-ck-window-scan__grid"
                role="group"
                aria-label="五乘五目标模板：五格连成一线的地方是 1，其余是 0。"
              >
                {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                  const cell = kernel[row][col];
                  return (
                    <div shuku-edit-id="e-11a9e664-43f7-493b-b808-a34fa0e81774" key={cellKey(row, col)} className={cell === 1 ? 'cg-copy-ck-window-scan__grid-cell cg-copy-ck-window-scan__grid-cell--one' : 'cg-copy-ck-window-scan__grid-cell'}>
                      <Typography shuku-edit-id="e-bb1da377-0928-4c0f-b290-be2b6e506fb7" as="span" variant="body" tone={cell === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                        {cell}
                      </Typography>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-38f251c1-1295-4234-a416-917000b3b0e6" className="cg-copy-ck-window-scan__result cg-copy-ck-window-scan__result-card">
            <div shuku-edit-id="e-e894c7f6-ca46-469e-a905-275530442fab" className="cg-copy-ck-window-scan__result-heading">
              <Typography shuku-edit-id="e-59e1df29-5c32-4e7d-a0b9-15f1143428b0" as="span" variant="body" tone="muted">当前区域的得分</Typography>
            </div>
            <div shuku-edit-id="e-b72d10e4-d2b5-4dfa-bdd8-2e57205faec9" className="cg-copy-ck-window-scan__score-row">
              <div shuku-edit-id="e-5c2c5340-385a-4996-a454-9e0b66d6f442" className="cg-copy-ck-window-scan__activation-box">
                <Typography shuku-edit-id="e-d169e3f2-6d1c-4922-9e96-cbf2efc90d6e" as="strong" variant="display" tone={found ? 'success' : 'main'}>{value < 0 ? `−${Math.abs(value)}` : value}</Typography>
                <ExplainPanelButton label="查看匹配得分的计算过程" triggerText="?">
                    <Typography shuku-edit-id="e-eb6bdd80-a8ac-4347-bf30-205149d83e5d" as="strong" variant="bodySmall" tone="accent">匹配得分怎么得到？</Typography>
                    <Typography shuku-edit-id="e-88092443-e5cf-4667-8abf-3465e5d751fc" variant="bodySmall" tone="muted">当前区域与目标模板对应位置相乘，再把 25 个乘积相加。</Typography>
                    <div shuku-edit-id="e-171856a9-3155-45d1-8150-4cabbf96f099" className="cg-copy-ck-window-scan__multiply" role="grid" aria-label="当前窗口与卷积核的逐项乘积">
                      {KERNEL_INDEX.flatMap((row) => KERNEL_INDEX.map((col) => {
                        const product = kernel[row][col] * patch[row][col];
                        return (
                          <span shuku-edit-id="e-ce4c3629-141c-484b-afd1-cf944e57d2f1" className={`cg-copy-ck-window-scan__multiply-cell${product !== 0 ? ' is-active' : ''}`} role="gridcell" key={cellKey(row, col)}>
                            <Typography shuku-edit-id="e-a122707a-80ac-40ee-8d66-e4dda0716bd8" as="strong" variant="bodySmall" tone={product !== 0 ? 'success' : 'muted'}>{product}</Typography>
                            <Typography shuku-edit-id="e-8902489d-4da9-49e7-b400-20c25e47a4ab" as="span" variant="bodySmall" tone="muted">{`${kernel[row][col]} × ${patch[row][col]}`}</Typography>
                          </span>
                        );
                      }))}
                    </div>
                    <div shuku-edit-id="e-9ebdd690-c1d1-4766-8ce8-35cc6ca0710c" className="cg-copy-ck-window-scan__sum-line" aria-label={`所有乘积相加等于 ${value}`}>
                      <Typography shuku-edit-id="e-9ede7612-caac-4a61-8d8e-e31e4934e8fd" as="span" variant="bodySmall" tone="accent">{`Σ（模板值 × 区域值）= ${value < 0 ? `−${Math.abs(value)}` : value}`}</Typography>
                    </div>
                </ExplainPanelButton>
              </div>
              <Typography shuku-edit-id="e-8516c11f-a0c3-4b08-bc83-6397f7d18c97" variant="bodySmall" tone="muted" className="cg-copy-ck-window-scan__result-caption"><Tips size="36" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#EFA94B', '#FFF1D9', '#EFA94B']} /><span shuku-edit-id="e-fb846aff-a134-495f-b132-2df1d1b09dbd">得分越高，<br shuku-edit-id="e-7b870ecb-523a-4248-be36-5d275910391c" />当前位置越符合目标棋形。</span></Typography>
            </div>
          </div>
          <div shuku-edit-id="e-45754500-688b-4266-a6b3-4c9aab9cc3ac" className="cg-copy-ck-window-scan__instruction" role="status">
            <span shuku-edit-id="e-67b86fb7-6d02-4e8c-b7f7-b6bc672798ce" className="cg-copy-ck-window-scan__instruction-icon" aria-hidden="true"><Move size="27" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" theme="multi-color" fill={['#5B8DE8', '#E7EFFF']} /></span>
            <Typography shuku-edit-id="e-59b4aabb-4c24-4749-9ee8-9bf066ebb57d" as="span" variant="body" tone="muted">拖动左侧窗口，寻找匹配得分最高的位置。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
