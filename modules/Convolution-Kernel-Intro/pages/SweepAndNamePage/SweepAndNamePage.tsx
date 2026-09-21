import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { useGomokuOutcome } from '../../LessonContext';
import { BOARD_SIZE, EMPTY, type Board, type Cell } from '../../model/gomokuEngine';
import './SweepAndNamePage.css';

/** 小框是 5 × 5：五个子连成一线，正好装得下。 */
const KERNEL_SIZE = 5;
/** 小框正中间那一格。 */
const MIDDLE = Math.floor(KERNEL_SIZE / 2);
/** 小框左上角最远滑到哪儿：整框留在盘内。 */
const WINDOW_LIMIT = BOARD_SIZE - KERNEL_SIZE;
/** 滑一遍是 (10 + 1)² = 121 次，落成的表正好 11 × 11。 */
const MAP_SIZE = WINDOW_LIMIT + 1;
const MAP_TOTAL = MAP_SIZE * MAP_SIZE;
const LAST_STEP = MAP_TOTAL - 1;
/** 小框走一格用多久；滑完停一下，再滑回最亮的那一格。 */
const STEP_MS = 40;
const PAUSE_MS = 320;
const GLIDE_MS = 620;
/** 停稳之后，三个名字才一起贴上来。 */
const NAME_MS = GLIDE_MS + 140;
/** 一格正好是小框自身宽度的 1 / 5：位移全按这个比例算。 */
const CELL_SHARE = 100 / KERNEL_SIZE;
/** 框停稳那一下的缓动，单步与回滑都跟着它走。 */
const GLIDE_EASING = 'cubic-bezier(.33, 0, .2, 1)';
/** 棋盘底色分层的中心：沿用前面放大看过的那个窗口。 */
const ZOOM_SIZE = 9;
const RING_MAX = 4;

const BOARD_INDEX = Array.from({ length: BOARD_SIZE }, (_, index) => index);
const KERNEL_INDEX = Array.from({ length: KERNEL_SIZE }, (_, index) => index);
const MAP_INDEX = Array.from({ length: MAP_SIZE }, (_, index) => index);

/** idle = 还没开始，playing = 正在滑，paused = 停住了，done = 滑完并且停稳。 */
type Mode = 'idle' | 'playing' | 'paused' | 'done';

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

/** 五个子连成的方向：只看行和列各自怎么变。 */
function winDirection(line: Cell[]): { dr: number; dc: number } {
  if (line.length < 2) return { dr: 0, dc: 1 };
  return {
    dr: Math.sign(line[1].row - line[0].row),
    dc: Math.sign(line[1].col - line[0].col),
  };
}

/** 横竖的棋形转 90°，斜的棋形左右翻——上一页就是这么把棋盘转过去的。 */
function transformFor(line: Cell[]): 'rotate' | 'flip' {
  const { dr, dc } = winDirection(line);
  return dr === 0 || dc === 0 ? 'rotate' : 'flip';
}

/** 棋盘上的 (row, col) 落到画面上的哪一格。 */
function boardToDisplay(cell: Cell, transform: 'rotate' | 'flip'): Cell {
  if (transform === 'flip') return { row: cell.row, col: BOARD_SIZE - 1 - cell.col };
  return { row: cell.col, col: BOARD_SIZE - 1 - cell.row };
}

/** 画面上第 (row, col) 格显示的是棋盘上的哪一格。 */
function displayToBoard(row: number, col: number, transform: 'rotate' | 'flip'): Cell {
  if (transform === 'flip') return { row, col: BOARD_SIZE - 1 - col };
  return { row: BOARD_SIZE - 1 - col, col: row };
}

/** 整盘棋子跟着转过之后的样子。 */
function toDisplayBoard(board: Board, transform: 'rotate' | 'flip'): Board {
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

/** 整块矩阵顺时针转 90°。 */
function rotateClockwise(kernel: number[][]): number[][] {
  return KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => kernel[KERNEL_SIZE - 1 - col][row]));
}

/** 整块矩阵左右翻一次。 */
function flipHorizontal(kernel: number[][]): number[][] {
  return KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => kernel[row][KERNEL_SIZE - 1 - col]));
}

/** 上一页排好的那个算子：原来那排 1 跟着棋盘一起转（或翻）过去。 */
function targetKernel(line: Cell[], transform: 'rotate' | 'flip'): number[][] {
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

/** 整盘扫一遍：把每个位置都算出来，顺便记下最亮的一格。 */
function scanBoard(grid: number[][], kernel: number[][]): { map: number[][]; brightest: { position: Cell; value: number } } {
  const map = MAP_INDEX.map((row) => MAP_INDEX.map((col) => activationAt(grid, kernel, row, col)));
  let position: Cell = { row: 0, col: 0 };
  let best = -Infinity;
  for (let row = 0; row <= WINDOW_LIMIT; row += 1) {
    for (let col = 0; col <= WINDOW_LIMIT; col += 1) {
      if (map[row][col] > best) {
        best = map[row][col];
        position = { row, col };
      }
    }
  }
  return { map, brightest: { position, value: Number.isFinite(best) ? best : 0 } };
}

/** 小框左上角停在第 index 次时，落在哪一格。 */
function cellForStep(index: number): Cell {
  const row = Math.min(Math.max(Math.floor(index / MAP_SIZE), 0), WINDOW_LIMIT);
  return { row, col: Math.min(Math.max(index - row * MAP_SIZE, 0), WINDOW_LIMIT) };
}

export interface SweepAndNamePageProps {
  onComplete: () => void;
}

export function SweepAndNamePage({ onComplete }: SweepAndNamePageProps) {
  const { outcome } = useGomokuOutcome();
  const windowRef = useRef<HTMLDivElement | null>(null);
  /** 扫描的进度，带小数：位移按它直接写进 DOM。 */
  const progressRef = useRef(-1);
  const completedRef = useRef(false);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const transform = useMemo(() => transformFor(outcome.winLine), [outcome.winLine]);
  const displayBoard = useMemo(() => toDisplayBoard(outcome.board, transform), [outcome.board, transform]);
  const grid = useMemo(() => toNumberGrid(displayBoard, outcome.winner), [displayBoard, outcome.winner]);
  const displayWinLine = useMemo(
    () => outcome.winLine.map((cell) => boardToDisplay(cell, transform)),
    [outcome.winLine, transform],
  );
  const centre = useMemo(() => windowCentre(displayWinLine, ZOOM_SIZE), [displayWinLine]);
  const kernel = useMemo(() => targetKernel(outcome.winLine, transform), [outcome.winLine, transform]);
  const { map, brightest } = useMemo(() => scanBoard(grid, kernel), [grid, kernel]);

  const [mode, setMode] = useState<Mode>('idle');
  const [cursor, setCursor] = useState<Cell>({ row: 0, col: 0 });
  /** 已经落进新表里的最后一格：-1 表示一个都还没记。 */
  const [filled, setFilled] = useState(-1);
  /** 扫完之后点过的那一格：小框会滑回去，重看它框住的那个窗口。 */
  const [focus, setFocus] = useState<Cell | null>(null);
  const [named, setNamed] = useState(false);

  const playing = mode === 'playing';
  const done = mode === 'done';
  /** 深色圈跟着小框走：滑的时候在这一格，扫完留在最亮的那一格。 */
  const focused = done ? (focus ?? brightest.position) : cursor;
  const oneCount = kernel.reduce((sum, row) => sum + row.filter((value) => value === 1).length, 0);

  // 换了一盘棋，整个扫描回到起点。
  useEffect(() => {
    progressRef.current = -1;
    completedRef.current = false;
    setMode('idle');
    setCursor({ row: 0, col: 0 });
    setFilled(-1);
    setFocus(null);
    setNamed(false);
  }, [kernel]);

  /**
   * 一遍扫到底。
   * 位移交给 requestAnimationFrame 直接写 DOM：整块小框连同里面的 0/1 一起走，
   * 不会出现样式过渡追不上内容、拖出鬼影的情况。扫到一行末尾时，小框先在最右边
   * 停住，再整块跳到下一行开头——这正是滑窗口本来的走法。
   */
  useEffect(() => {
    if (mode !== 'playing') return undefined;
    const node = windowRef.current;
    if (node) node.style.transition = 'none';
    let frame = 0;
    let settle = 0;
    let last = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      const delta = Math.min(now - last, STEP_MS * 4);
      last = now;
      const value = Math.min(progressRef.current + delta / STEP_MS, LAST_STEP);
      progressRef.current = value;
      const index = Math.max(Math.floor(value), 0);
      const step = cellForStep(index);
      const offset = Math.min(Math.max(value - step.row * MAP_SIZE, 0), WINDOW_LIMIT);
      const target = windowRef.current;
      if (target) {
        target.style.transform = `translate(${offset * CELL_SHARE}%, ${step.row * CELL_SHARE}%)`;
      }
      setCursor((current) => (current.row === step.row && current.col === step.col ? current : step));
      setFilled((current) => (current === index ? current : index));
      if (value >= LAST_STEP) {
        setFilled(LAST_STEP);
        settle = window.setTimeout(() => setMode('done'), PAUSE_MS);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [mode]);

  // 不扫的时候，小框跟着状态走：单步是滑一格，扫完是滑回最亮的那一格。
  useEffect(() => {
    if (mode === 'playing') return;
    const node = windowRef.current;
    if (!node) return;
    const target = done ? focused : cursor;
    node.style.transition = `transform ${GLIDE_MS}ms ${GLIDE_EASING}`;
    node.style.transform = `translate(${target.col * CELL_SHARE}%, ${target.row * CELL_SHARE}%)`;
  }, [mode, done, focused, cursor]);

  // 停稳之后，三个名字一起贴上来，这一页才算讲完。
  useEffect(() => {
    if (mode !== 'done') return undefined;
    const timer = window.setTimeout(() => {
      setNamed(true);
      if (completedRef.current) return;
      completedRef.current = true;
      completeRef.current();
    }, NAME_MS);
    return () => window.clearTimeout(timer);
  }, [mode]);

  const startSweep = () => {
    progressRef.current = -1;
    setCursor({ row: 0, col: 0 });
    setFilled(-1);
    setMode('playing');
  };

  const handlePlay = () => {
    if (playing) {
      setMode('paused');
      return;
    }
    if (done) {
      startSweep();
      return;
    }
    setMode('playing');
  };

  /** 单步：只走一格，走满 121 次同样算扫完。 */
  const handleStep = () => {
    if (playing) return;
    const next = filled + 1;
    if (next > LAST_STEP) return;
    progressRef.current = next;
    setCursor(cellForStep(next));
    setFilled(next);
    setMode(next >= LAST_STEP ? 'done' : 'paused');
  };

  const handleMapClick = (row: number, col: number) => {
    if (!done) return;
    setFocus({ row, col });
  };

  const currentCell = cellForStep(Math.max(filled, 0));
  const currentValue = map[currentCell.row][currentCell.col];
  const readout = done
    ? `最亮的一格是 ${brightest.value}，它正好压住赢方那五个子。`
    : playing
      ? `已经滑过 ${filled + 1} 个位置，这里记下 ${currentValue}。`
      : mode === 'paused'
        ? `停在第 ${filled + 1} 个位置，接着按「播放」。`
        : `按「播放」一次滑到底，或用「单步」一格一格看。`;

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-sweep"
      title="把窗口滑遍全图：这就是卷积"
      subtitle="框从左上角一路滑到右下角，压在哪儿就把那 25 个数算成一个，记进右边的新表。"
    >
      <div className="ck-sweep__stage">
        <div className="ck-sweep__head ck-sweep__head--in">
          <span className="ck-sweep__pill">
            <Typography as="span" variant="body" tone="inherit">输入</Typography>
          </span>
        </div>

        <div
          className="ck-sweep__board"
          role="group"
          aria-label={`棋盘：橙子是赢方的子，深蓝是对手的子。小框里那 ${oneCount} 个 1 正跟着框在盘上滑。`}
        >
          {BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => {
            const cell = grid[row][col];
            const ring = Math.min(RING_MAX, Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col)));
            const classes = [
              'ck-sweep__cell',
              `ck-sweep__cell--ring-${ring}`,
              cell === 1 ? 'ck-sweep__cell--one' : '',
              cell === -1 ? 'ck-sweep__cell--minus' : '',
            ].filter(Boolean).join(' ');
            return <div key={cellKey(row, col)} className={classes} />;
          }))}

          {/* 浮层自己再铺一遍同样的 15 × 15 网格：小框占住 5 × 5 格，
              既跟下面的格子对得齐，又不会挤走盘上的棋子。 */}
          <div className="ck-sweep__window-host">
            <div
              ref={windowRef}
              className={named ? 'ck-sweep__window is-named' : 'ck-sweep__window'}
              aria-hidden="true"
            >
              {KERNEL_INDEX.map((row) => KERNEL_INDEX.map((col) => {
                const value = kernel[row][col];
                const under = grid[cursor.row + row][cursor.col + col];
                const hit = value === 1 && under === 1;
                const classes = [
                  'ck-sweep__window-cell',
                  value === 1 ? 'is-op' : '',
                  under !== 0 ? 'is-on-stone' : '',
                  hit ? 'is-hit' : '',
                ].filter(Boolean).join(' ');
                return (
                  <span key={cellKey(row, col)} className={classes}>
                    <Typography as="span" variant="body" tone="inherit">{value}</Typography>
                  </span>
                );
              }))}

              {/* 名字最后贴上来：框里这排 0/1，就是卷积核。 */}
              <span className={named ? 'ck-sweep__kernel-tag is-on' : 'ck-sweep__kernel-tag'}
                aria-hidden={!named}>
                <Typography as="span" variant="body" tone="inherit">卷积核</Typography>
              </span>
            </div>
          </div>
        </div>

        <div className="ck-sweep__rail">
          <div className="ck-sweep__op">
            <Typography as="span" role="img" aria-label="卷积符号" variant="display" tone="main">⊛</Typography>
            <span className={named ? 'ck-sweep__op-name is-on' : 'ck-sweep__op-name'} aria-hidden={!named}>
              <Typography as="span" variant="h3" tone="accent">卷积</Typography>
            </span>
          </div>
        </div>

        <div className="ck-sweep__head ck-sweep__head--out">
          {named ? (
            <span className="ck-sweep__pill ck-sweep__pill--map is-on">
              <Typography as="span" variant="body" tone="inherit">特征图</Typography>
            </span>
          ) : (
            <Typography as="span" variant="body" tone="muted">
              {filled < 0 ? `一共 ${MAP_TOTAL} 个数` : `已记下 ${filled + 1} / ${MAP_TOTAL}`}
            </Typography>
          )}
        </div>

        <div
          className="ck-sweep__map"
          role="group"
          aria-label="新得到的表：11 乘 11，每一格对应棋盘上的一个 5 乘 5 窗口。滑完之后可以点格子，回看它框住的窗口。"
        >
          {MAP_INDEX.map((row) => MAP_INDEX.map((col) => {
            const index = row * MAP_SIZE + col;
            const value = map[row][col];
            const isFilled = index <= filled;
            const classes = ['ck-sweep__map-cell'];
            if (isFilled && value > 0) classes.push(`is-plus-${Math.min(value, KERNEL_SIZE)}`);
            else if (isFilled && value < 0) classes.push(`is-minus-${Math.min(-value, KERNEL_SIZE)}`);
            else if (isFilled) classes.push('is-zero');
            if (isFilled && value === brightest.value) classes.push('is-top');
            if (isFilled && focused.row === row && focused.col === col) classes.push('is-focus');
            if (named && isFilled && value === brightest.value) classes.push('is-named');
            return (
              <button
                key={cellKey(row, col)}
                type="button"
                className={classes.join(' ')}
                disabled={!done}
                tabIndex={-1}
                aria-label={isFilled ? `第 ${row + 1} 行第 ${col + 1} 列：${value}` : undefined}
                onClick={() => handleMapClick(row, col)}
              >
                {isFilled && (
                  <Typography as="span" variant="body" tone="inherit" aria-hidden="true">{value}</Typography>
                )}
              </button>
            );
          }))}
        </div>

        <div className="ck-sweep__foot">
          <div className="ck-sweep__controls">
            <Button variant="primary" onClick={handlePlay}>{playing ? '暂停' : '播放'}</Button>
            <Button onClick={handleStep} disabled={playing || filled >= LAST_STEP}>单步</Button>
            <Button onClick={startSweep}>重播</Button>
          </div>

          <div className={done ? 'ck-sweep__readout is-done' : 'ck-sweep__readout'}>
            <Typography variant="body" tone={done ? 'success' : 'main'}>{readout}</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
