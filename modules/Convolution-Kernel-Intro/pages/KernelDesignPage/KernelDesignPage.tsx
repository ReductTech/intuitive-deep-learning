import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { useGomokuOutcome } from '../../LessonContext';
import { BOARD_SIZE, EMPTY, type Board, type Cell } from '../../model/gomokuEngine';
import './KernelDesignPage.css';

/** 算子和小框都按 5 × 5 排：五个子连成一线，正好装得下。 */
const KERNEL_SIZE = 5;
/** 小框正中间那一格。 */
const MIDDLE = Math.floor(KERNEL_SIZE / 2);
/** 小框左上角最远能挪到哪儿：整个框留在盘内。 */
const WINDOW_LIMIT = BOARD_SIZE - KERNEL_SIZE;
/** 一格正好是小框自身宽度的 1 / 5：位移全按这个比例算。 */
const CELL_SHARE = 100 / KERNEL_SIZE;
/** 前面几页放大看过的窗口，这一页只借它来定底色分层的中心。 */
const ZOOM_SIZE = 9;
/** 底色从中心往外一共分五层，再远都并到最外那一层。 */
const RING_MAX = 4;

const BOARD_INDEX = Array.from({ length: BOARD_SIZE }, (_, index) => index);
const KERNEL_INDEX = Array.from({ length: KERNEL_SIZE }, (_, index) => index);

/** 棋盘整盘转过一次：横竖的棋形转 90°，斜的棋形左右翻。 */
type Transform = 'rotate' | 'flip';
/** design = 还在点格子排算子；drag = 排对了，拖着框在盘上找。 */
type Phase = 'design' | 'drag';

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 五个子连成的方向：只看行和列各自怎么变。 */
function winDirection(line: Cell[]): { dr: number; dc: number } {
  if (line.length < 2) return { dr: 0, dc: 1 };
  return {
    dr: Math.sign(line[1].row - line[0].row),
    dc: Math.sign(line[1].col - line[0].col),
  };
}

/** 横竖的棋形转 90°，斜的棋形左右翻——换完方向，那排 1 就对不上了。 */
function transformFor(line: Cell[]): Transform {
  const { dr, dc } = winDirection(line);
  return dr === 0 || dc === 0 ? 'rotate' : 'flip';
}

function transformLabel(transform: Transform): string {
  return transform === 'rotate' ? '棋盘顺时针转了 90°' : '棋盘左右翻了过来';
}

/** 棋盘上的 (row, col) 落到画面上的哪一格。 */
function boardToDisplay(cell: Cell, transform: Transform): Cell {
  if (transform === 'flip') return { row: cell.row, col: BOARD_SIZE - 1 - cell.col };
  return { row: cell.col, col: BOARD_SIZE - 1 - cell.row };
}

/** 画面上第 (row, col) 格显示的是棋盘上的哪一格。 */
function displayToBoard(row: number, col: number, transform: Transform): Cell {
  if (transform === 'flip') return { row, col: BOARD_SIZE - 1 - col };
  return { row: BOARD_SIZE - 1 - col, col: row };
}

/** 整盘棋子跟着一起转过之后的样子。 */
function toDisplayBoard(board: Board, transform: Transform): Board {
  return BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => {
    const source = displayToBoard(row, col, transform);
    return board[source.row][source.col];
  }));
}

/** 棋盘的数字版本：赢方的子记 1，对手的子记 -1，空点记 0。 */
function toNumberGrid(board: Board, winner: number): number[][] {
  return board.map((row) => row.map((stone) => {
    if (stone === EMPTY) return 0;
    return stone === winner ? 1 : -1;
  }));
}

/** 按获胜方向生成 5 × 5 算子：五格连成一线的地方是 1，其余是 0。 */
function kernelForWinDirection(line: Cell[]): number[][] {
  const { dr, dc } = winDirection(line);
  return KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
    if (dc === 0) return col === MIDDLE ? 1 : 0;
    if (dr === 0) return row === MIDDLE ? 1 : 0;
    if (dr === dc) return row === col ? 1 : 0;
    return row + col === KERNEL_SIZE - 1 ? 1 : 0;
  }));
}

/** 整块矩阵顺时针转 90°：原来那一行，转完立成一列。 */
function rotateClockwise(kernel: number[][]): number[][] {
  return KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => kernel[KERNEL_SIZE - 1 - col][row]));
}

/** 整块矩阵左右翻一次。 */
function flipHorizontal(kernel: number[][]): number[][] {
  return KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => kernel[row][KERNEL_SIZE - 1 - col]));
}

/** 这一页要排的算子：原来那排 1 跟着棋盘一起转（或翻）过去。 */
function targetKernel(line: Cell[], transform: Transform): number[][] {
  const base = kernelForWinDirection(line);
  return transform === 'rotate' ? rotateClockwise(base) : flipHorizontal(base);
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

/** 算子盖住的那 25 个数字，按位相乘再相加，就是这一格的激活值。 */
function activationAt(grid: number[][], kernel: number[][], top: number, left: number): number {
  return kernel.reduce((sum, kernelRow, row) => sum + kernelRow.reduce((rowSum, value, col) => (
    rowSum + value * grid[top + row][left + col]
  ), 0), 0);
}

/** 扫遍整盘，找出激活值最高的那一格；并列时取最靠上的一格。 */
function bestWindow(grid: number[][], kernel: number[][]): { position: Cell; value: number } {
  let position: Cell = { row: 0, col: 0 };
  let best = -Infinity;
  for (let row = 0; row <= WINDOW_LIMIT; row += 1) {
    for (let col = 0; col <= WINDOW_LIMIT; col += 1) {
      const value = activationAt(grid, kernel, row, col);
      if (value > best) {
        best = value;
        position = { row, col };
      }
    }
  }
  return { position, value: Number.isFinite(best) ? best : 0 };
}

function blankKernel(): number[][] {
  return KERNEL_INDEX.map(() => KERNEL_INDEX.map(() => 0));
}

function sameKernel(a: number[][], b: number[][]): boolean {
  return a.every((row, rowIndex) => row.every((value, colIndex) => value === b[rowIndex][colIndex]));
}

export interface KernelDesignPageProps {
  onComplete: () => void;
}

export function KernelDesignPage({ onComplete }: KernelDesignPageProps) {
  const { outcome } = useGomokuOutcome();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragOrigin = useRef<{ cell: Cell; topLeft: Cell } | null>(null);
  const completedRef = useRef(false);

  const transform = useMemo(() => transformFor(outcome.winLine), [outcome.winLine]);
  const displayBoard = useMemo(() => toDisplayBoard(outcome.board, transform), [outcome.board, transform]);
  const grid = useMemo(() => toNumberGrid(displayBoard, outcome.winner), [displayBoard, outcome.winner]);
  const displayWinLine = useMemo(
    () => outcome.winLine.map((cell) => boardToDisplay(cell, transform)),
    [outcome.winLine, transform],
  );
  const centre = useMemo(() => windowCentre(displayWinLine, ZOOM_SIZE), [displayWinLine]);
  const answer = useMemo(() => targetKernel(outcome.winLine, transform), [outcome.winLine, transform]);
  /** 拖着要找的那一格：激活值最高的位置，就压在赢的那五个子上。 */
  const finish = useMemo(() => bestWindow(grid, answer), [grid, answer]);

  const [kernel, setKernel] = useState<number[][]>(blankKernel);
  const [hover, setHover] = useState<Cell | null>(null);
  const [phase, setPhase] = useState<Phase>('design');
  const [cursor, setCursor] = useState<Cell>({ row: 0, col: 0 });
  const [dragging, setDragging] = useState(false);

  // 换了一盘棋就回到空白算子，重新排。
  useEffect(() => {
    completedRef.current = false;
    setKernel(blankKernel());
    setHover(null);
    setPhase('design');
    setCursor({ row: 0, col: 0 });
    setDragging(false);
    dragOrigin.current = null;
  }, [answer]);

  const designing = phase === 'design';
  const activation = activationAt(grid, kernel, cursor.row, cursor.col);
  /** 框挪到激活值最大的那一格就算找着了；再拖走，提示也跟着回去。 */
  const found = !designing && finish.value > 0 && activation >= finish.value;

  useEffect(() => {
    if (!found || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [found, onComplete]);

  /**
   * 指针落在棋盘的第几行第几列：每格正好是 1 / 15 的边长，除一下就得到格子索引。
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
    if (designing) return;
    const cell = cellFromPointer(event);
    if (!cell) return;
    dragOrigin.current = { cell, topLeft: cursor };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current;
    if (!dragging || !origin) return;
    const cell = cellFromPointer(event);
    if (!cell) return;
    setCursor({
      row: clamp(origin.topLeft.row + cell.row - origin.cell.row, 0, WINDOW_LIMIT),
      col: clamp(origin.topLeft.col + cell.col - origin.cell.col, 0, WINDOW_LIMIT),
    });
  };

  const endDrag = useCallback(() => {
    dragOrigin.current = null;
    setDragging(false);
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (!designing) return;
    const next = kernel.map((values, rowIndex) => values.map((value, colIndex) => (
      rowIndex === row && colIndex === col ? (value ? 0 : 1) : value
    )));
    setKernel(next);
    setHover(null);
    if (sameKernel(next, answer)) setPhase('drag');
  };

  const oneCount = kernel.reduce((sum, row) => sum + row.filter((value) => value === 1).length, 0);

  const readoutText = designing
    ? (oneCount === KERNEL_SIZE ? '1 够 5 个了，只是排得还不对。' : '点格子，照着五个子的排列把 1 摆好。')
    : found
      ? `就是这儿：新算子照样拿到最大的激活值 ${finish.value}。`
      : '排对了。拖着框在盘上走，找出激活值最大的那一格。';

  const windowStyle: CSSProperties = {
    transform: `translate(${cursor.col * CELL_SHARE}%, ${cursor.row * CELL_SHARE}%)`,
  };

  // 小框贴到棋盘上边时，拖动的标记缩回框内，不然会被棋盘裁掉一半。
  const windowClasses = [
    'ck-redesign__window',
    found ? 'is-found' : '',
    cursor.row === 0 ? 'is-clamped-top' : '',
  ].filter(Boolean).join(' ');

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-redesign"
      title="棋盘转了向，重新排一个算子"
      subtitle="棋盘转了个方向，原来那排 1 立刻对不上。点格子重新摆好，再拖着框在盘上找出激活值最大的地方。"
    >
      <div className="ck-redesign__layout">
        <div className="ck-redesign__board-slot">
          <span className="ck-redesign__caption">
            <Typography as="span" variant="body" tone="main">{transformLabel(transform)}</Typography>
          </span>

          <div
            ref={boardRef}
            className={designing ? 'ck-redesign__board' : 'ck-redesign__board is-draggable'}
            role="group"
            aria-label={designing
              ? `转过方向的棋盘。${transformLabel(transform)}。右边排好算子后，可以拖着它在盘上走。`
              : `转过方向的棋盘。${transformLabel(transform)}。按住棋盘拖动那个 5 × 5 的小框，激活值最大的位置就压在赢的那五个子上。`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => {
              const cell = grid[row][col];
              const ring = Math.min(RING_MAX, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col)));
              const classes = [
                'ck-redesign__cell',
                `ck-redesign__cell--ring-${ring}`,
                cell === 1 ? 'ck-redesign__cell--one' : '',
                cell === -1 ? 'ck-redesign__cell--minus' : '',
              ].filter(Boolean).join(' ');
              return <div key={cellKey(row, col)} className={classes} />;
            }))}

            {!designing && (
              /* 浮层自己再铺一遍同样的 15 × 15 网格：小框占住 5 × 5 格，
                 既跟下面的格子对得齐，又不会挤走盘上的棋子。 */
              <div className="ck-redesign__window-host">
                <div
                  className={windowClasses}
                  style={windowStyle}
                  aria-hidden="true"
                >
                  {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                    const op = kernel[row][col];
                    const under = grid[cursor.row + row][cursor.col + col];
                    const hit = op === 1 && under === 1;
                    const classes = [
                      'ck-redesign__window-cell',
                      op === 1 ? 'is-op' : '',
                      under !== 0 ? 'is-on-stone' : '',
                      hit ? 'is-hit' : '',
                    ].filter(Boolean).join(' ');
                    return (
                      <span key={cellKey(row, col)} className={classes}>
                        <Typography as="span" variant="body" tone="inherit">{op}</Typography>
                      </span>
                    );
                  }))}

                  {/* 拖动标记：按住盘面任意处都能拖，这三个点只是告诉你这个框能拖。 */}
                  <span className="ck-redesign__grip">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}
          </div>

          <ul className="ck-redesign__key">
            <li className="ck-redesign__key-item">
              <span className="ck-redesign__key-chip ck-redesign__key-chip--one" aria-hidden="true" />
              <Typography as="span" variant="body" tone="muted">橙 = 赢方的子</Typography>
            </li>
            <li className="ck-redesign__key-item">
              <span className="ck-redesign__key-chip ck-redesign__key-chip--minus" aria-hidden="true" />
              <Typography as="span" variant="body" tone="muted">深蓝 = 对手的子</Typography>
            </li>
            {!designing && (
              <li className="ck-redesign__key-item">
                <span className="ck-redesign__key-chip ck-redesign__key-chip--hit" aria-hidden="true" />
                <Typography as="span" variant="body" tone="muted">绿 = 算子压中</Typography>
              </li>
            )}
          </ul>
        </div>

        <div className="ck-redesign__panel">
          <div className="ck-redesign__label-row">
            <Typography as="span" variant="body" tone="muted">算子</Typography>
            <Typography as="span" variant="bodySmall" tone="muted">
              {designing ? `已放 ${oneCount} / ${KERNEL_SIZE}` : '已经排好'}
            </Typography>
          </div>

          <div
            className="ck-redesign__grid"
            role="group"
            aria-label="可以点选的五乘五算子，点一下把 0 变成 1，再点一下变回 0。"
          >
            {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
              const value = kernel[row][col];
              const hovered = designing && hover !== null && hover.row === row && hover.col === col;
              const preview = hovered ? (value ? 0 : 1) : value;
              const classes = [
                'ck-redesign__grid-cell',
                !hovered && value === 1 ? 'ck-redesign__grid-cell--one' : '',
                hovered && value === 0 ? 'ck-redesign__grid-cell--preview-one' : '',
                hovered && value === 1 ? 'ck-redesign__grid-cell--preview-zero' : '',
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={cellKey(row, col)}
                  type="button"
                  className={classes}
                  disabled={!designing}
                  aria-label={`第 ${row + 1} 行第 ${col + 1} 列，现在是 ${value}，点击变成 ${value ? 0 : 1}`}
                  onMouseEnter={() => setHover({ row, col })}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover({ row, col })}
                  onBlur={() => setHover(null)}
                  onClick={() => handleCellClick(row, col)}
                >
                  <Typography as="span" variant="body" tone={preview === 0 ? 'muted' : 'inherit'} aria-hidden="true">
                    {preview}
                  </Typography>
                </button>
              );
            }))}
          </div>

          {!designing && (
            <div className="ck-redesign__value">
              <Typography as="span" variant="body" tone="muted">激活值</Typography>
              <Typography as="span" variant="display" tone={found ? 'success' : 'accent'}>{activation}</Typography>
            </div>
          )}

          <div
            className={found ? 'ck-redesign__readout is-found' : 'ck-redesign__readout'}
            aria-live="polite"
          >
            <Typography as="p" variant="body" tone={found ? 'success' : 'main'}>{readoutText}</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
