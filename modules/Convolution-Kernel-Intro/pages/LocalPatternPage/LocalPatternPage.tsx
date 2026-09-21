import { useEffect, useRef } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { useGomokuOutcome, type GomokuOutcome } from '../../LessonContext';
import { BOARD_SIZE, EMPTY, type Board, type Cell } from '../../model/gomokuEngine';
import './LocalPatternPage.css';

/** 5 × 5：一块局部输入的样子，也正好是一个卷积核的样子。 */
const SIZE = 5;
const MIDDLE = Math.floor(SIZE / 2);
const INDEX = Array.from({ length: SIZE }, (_, index) => index);
const BOARD_INDEX = Array.from({ length: BOARD_SIZE }, (_, index) => index);

/** 这一页只用看懂一件事，留一拍站站稳就放行下一幕。 */
const SETTLE_MS = 900;

/* ---------- 棋盘 → 数字 → 抠出那 5 × 5 ---------- */

/** 五个子连成的方向：只看行和列各自怎么变。 */
function winDirection(line: Cell[]): { dr: number; dc: number } {
  if (line.length < 2) return { dr: 0, dc: 1 };
  return {
    dr: Math.sign(line[1].row - line[0].row),
    dc: Math.sign(line[1].col - line[0].col),
  };
}

/** 横竖的棋形转 90°，斜的棋形左右翻——前面几页就是这么把棋盘转过去的。 */
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

function toDisplayBoard(board: Board, transform: 'rotate' | 'flip'): Board {
  return BOARD_INDEX.map((row) => BOARD_INDEX.map((col) => {
    const source = displayToBoard(row, col, transform);
    return board[source.row][source.col];
  }));
}

/** 棋盘的数字版本：我方的子记 1，对手的子记 -1，空点记 0。 */
function toNumberGrid(board: Board, winner: number): number[][] {
  return board.map((row) => row.map((stone) => {
    if (stone === EMPTY) return 0;
    return stone === winner ? 1 : -1;
  }));
}

/** 按方向生成 5 × 5 的核：五个 1 连成一线，其余是 0。 */
function kernelForWinDirection(line: Cell[]): number[][] {
  const { dr, dc } = winDirection(line);
  return INDEX.map((row) => INDEX.map((col) => {
    if (dc === 0) return col === MIDDLE ? 1 : 0;
    if (dr === 0) return row === MIDDLE ? 1 : 0;
    if (dr === dc) return row === col ? 1 : 0;
    return row + col === SIZE - 1 ? 1 : 0;
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

/** 抠出窗口正中的那一块 5 × 5。 */
function patchAt(grid: number[][], centre: Cell): number[][] {
  return INDEX.map((row) => INDEX.map((col) => (
    grid[centre.row - MIDDLE + row][centre.col - MIDDLE + col]
  )));
}

/** 核盖住的那 25 个数字按位相乘再相加，就是这块输入给这个核的响应值。 */
function responseAt(input: number[][], kernel: number[][]): number {
  return kernel.reduce((sum, kernelRow, row) => sum + kernelRow.reduce(
    (rowSum, value, col) => rowSum + value * input[row][col],
    0,
  ), 0);
}

/* ---------- 右边那三个核 ---------- */

/** 斜线核的默认朝向：左下到右上。 */
function diagonalKernel(): number[][] {
  return INDEX.map((row) => INDEX.map((col) => (row + col === SIZE - 1 ? 1 : 0)));
}

function horizontalKernel(): number[][] {
  return INDEX.map((row) => INDEX.map((col) => (row === MIDDLE ? 1 : 0)));
}

function verticalKernel(): number[][] {
  return INDEX.map((row) => INDEX.map((col) => (col === MIDDLE ? 1 : 0)));
}

/** 拐角核：五个 1 摆在左上角，转成一个直角。 */
function cornerKernel(): number[][] {
  return INDEX.map((row) => INDEX.map((col) => (
    (row === 0 && col <= MIDDLE) || (col === 0 && row <= MIDDLE) ? 1 : 0
  )));
}

interface KernelRow {
  id: string;
  label: string;
  /** 这个核专门找什么，念给读屏软件听。 */
  shape: string;
  grid: number[][];
}

interface Scene {
  /** 全页唯一那块固定输入：学习者自己那盘棋里，赢的那五个子所在的一小块。 */
  input: number[][];
  kernels: KernelRow[];
}

/**
 * 输入取自学习者自己的终局：跟前面几页一样先转过棋盘，再把获胜棋形所在的那一块 5 × 5 抠出来。
 * 三个核里有一个一定跟它同形，另外两个是不同的模式，用来对照。
 */
function buildScene(outcome: GomokuOutcome): Scene {
  const line = outcome.winLine;
  const played = line.length >= SIZE;
  const transform = played ? transformFor(line) : 'flip';
  const numbers = toNumberGrid(toDisplayBoard(outcome.board, transform), outcome.winner);
  const displayLine = line.map((cell) => boardToDisplay(cell, transform));
  const input = patchAt(numbers, windowCentre(played ? displayLine : [], SIZE));

  const direction = played ? winDirection(displayLine) : { dr: -1, dc: 1 };
  const diagonal = played && direction.dr !== 0 && direction.dc !== 0
    ? kernelForWinDirection(displayLine)
    : diagonalKernel();
  const straight = direction.dr === 0 ? horizontalKernel() : verticalKernel();
  const straightAxis = direction.dr === 0 ? '横' : '竖';

  return {
    input,
    kernels: [
      { id: 'diagonal', label: '斜线核', shape: '五个 1 斜着连成一线', grid: diagonal },
      { id: 'straight', label: `${straightAxis}线核`, shape: `五个 1 ${straightAxis}着连成一线`, grid: straight },
      { id: 'corner', label: '拐角核', shape: '五个 1 排成一个拐角', grid: cornerKernel() },
    ],
  };
}

export interface LocalPatternPageProps {
  onComplete: () => void;
}

export function LocalPatternPage({ onComplete }: LocalPatternPageProps) {
  const { outcome } = useGomokuOutcome();
  const completeRef = useRef(onComplete);
  const doneRef = useRef(false);
  completeRef.current = onComplete;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      completeRef.current();
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const scene = buildScene(outcome);
  const scores = scene.kernels.map((kernel) => responseAt(scene.input, kernel.grid));
  const best = Math.max(...scores);

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-pattern"
      title="同一块输入，不同卷积核会看到不同模式"
      subtitle="卷积核决定“关注什么”，响应值表示“匹配得有多强”。"
    >
      <div className="ck-pattern__stage">
        {/* 左边这块输入全页就一个，三个核都从它身上读，是唯一的参照。 */}
        <div className="ck-pattern__input">
          <Typography as="p" variant="body" tone="muted">同一块局部输入</Typography>

          <div
            className="ck-pattern__grid"
            role="img"
            aria-label="五乘五的局部输入：1 是我方的子，-1 是对手的子，0 是空点。"
          >
            {INDEX.map((row) => INDEX.map((col) => {
              const value = scene.input[row][col];
              const classes = ['ck-pattern__cell'];
              if (value === 1) classes.push('ck-pattern__cell--one');
              else if (value === -1) classes.push('ck-pattern__cell--minus');
              return (
                <span key={`${row}:${col}`} className={classes.join(' ')}>
                  <Typography as="span" variant="body" tone="inherit" aria-hidden="true">
                    {value}
                  </Typography>
                </span>
              );
            }))}
          </div>

          <Typography as="p" variant="bodySmall" tone="muted" align="center">
            1 我方 · -1 对手 · 0 空点
          </Typography>
        </div>

        {/* 右边三张卡并排：同一块输入进三个不同的核，各给一个响应值。 */}
        <div className="ck-pattern__kernels">
          {scene.kernels.map((kernel, index) => {
            const score = scores[index];
            const matched = score === best;
            return (
              <div key={kernel.id} className={matched ? 'ck-pattern__card is-top' : 'ck-pattern__card is-idle'}>
                <div className="ck-pattern__name">
                  <Typography as="p" variant="body" tone="muted">{kernel.label}</Typography>
                </div>

                <div
                  className="ck-pattern__grid ck-pattern__grid--kernel"
                  role="img"
                  aria-label={`${kernel.label}：五乘五，${kernel.shape}，其余都是 0。`}
                >
                  {INDEX.map((cellRow) => INDEX.map((cellCol) => {
                    const value = kernel.grid[cellRow][cellCol];
                    return (
                      <span
                        key={`${cellRow}:${cellCol}`}
                        className={value === 1 ? 'ck-pattern__cell ck-pattern__cell--one' : 'ck-pattern__cell'}
                      >
                        <Typography as="span" variant="body" tone="inherit" aria-hidden="true">
                          {value}
                        </Typography>
                      </span>
                    );
                  }))}
                </div>

                <div className="ck-pattern__response">
                  <Typography as="span" variant="bodySmall" tone="muted">响应</Typography>
                  <Typography as="span" variant="h2" tone="muted">{score}</Typography>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ContentBlock>
  );
}
