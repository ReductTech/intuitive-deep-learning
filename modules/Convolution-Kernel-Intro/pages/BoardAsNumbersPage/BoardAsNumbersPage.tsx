import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { useGomokuOutcome } from '../../LessonContext';
import {
  BLACK,
  BOARD_SIZE,
  EMPTY,
  winDirectionLabel,
  type Board,
  type Cell,
  type Stone,
} from '../../model/gomokuEngine';
import './BoardAsNumbersPage.css';

/** 局部放大窗口的边长：棋形的最小外接矩形 5 × 5，四周各留两层，正好 9 × 9。 */
const WINDOW_SIZE = 9;
/** 底色从中心往外一共分五层，再远都并到最外那一层。 */
const RING_MAX = 4;
/** 网格在棋盘边框内缩进的比例，画布与 HTML 坐标轴共用同一数值。 */
const BOARD_PAD_RATIO = 0.075;
/** 棋盘上的星位：天元与四个星点。 */
const STAR_POINTS: ReadonlyArray<readonly [number, number]> = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];

/** 棋盘坐标轴：列用 A–O，行用 1–15，和右边矩阵的行列索引一致。 */
const COLUMN_LABELS = Array.from({ length: BOARD_SIZE }, (_, index) => String.fromCharCode(65 + index));
const ROW_LABELS = Array.from({ length: BOARD_SIZE }, (_, index) => String(index + 1));

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

/** 棋盘的数字版本：赢方的子记 1，对手的子记 -1，空点记 0。 */
function toNumberGrid(board: Board, winner: number): number[][] {
  return board.map((row) => row.map((stone) => {
    if (stone === EMPTY) return 0;
    return stone === winner ? 1 : -1;
  }));
}

/** 以棋形的最小外接矩形为中心取一个 size × size 的窗口，再整体夹回棋盘内。 */
function zoomWindow(line: Cell[], size: number): { origin: Cell; centre: Cell; rows: number[]; cols: number[] } {
  const lineRows = line.map((cell) => cell.row);
  const lineCols = line.map((cell) => cell.col);
  const middle = Math.floor((BOARD_SIZE - 1) / 2);
  const midRow = lineRows.length ? Math.round((Math.min(...lineRows) + Math.max(...lineRows)) / 2) : middle;
  const midCol = lineCols.length ? Math.round((Math.min(...lineCols) + Math.max(...lineCols)) / 2) : middle;
  const half = Math.floor((size - 1) / 2);
  const limit = Math.max(0, BOARD_SIZE - size);
  const origin = {
    row: Math.min(Math.max(midRow - half, 0), limit),
    col: Math.min(Math.max(midCol - half, 0), limit),
  };
  return {
    origin,
    centre: { row: origin.row + half, col: origin.col + half },
    rows: Array.from({ length: size }, (_, index) => origin.row + index),
    cols: Array.from({ length: size }, (_, index) => origin.col + index),
  };
}

/* 左栏的棋盘：木色底、星位、获胜连线，外加矩阵指过来的那一圈高亮。 */

function paintStone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  player: Stone,
  highlighted: boolean,
) {
  if (highlighted) {
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240, 126, 71, .2)';
    ctx.fill();
  }
  ctx.save();
  ctx.shadowColor = 'rgba(24, 36, 54, .3)';
  ctx.shadowBlur = radius * 0.55;
  ctx.shadowOffsetY = radius * 0.16;
  const gradient = ctx.createRadialGradient(x - radius * 0.34, y - radius * 0.38, radius * 0.1, x, y, radius);
  if (player === BLACK) {
    gradient.addColorStop(0, '#5C6D85');
    gradient.addColorStop(0.46, '#28374E');
    gradient.addColorStop(1, '#0E1622');
  } else {
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.58, '#F3F7FB');
    gradient.addColorStop(1, '#C9D4E2');
  }
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = player === BLACK ? 'rgba(10, 18, 30, .48)' : 'rgba(33, 50, 74, .24)';
  ctx.lineWidth = Math.max(1, radius * 0.07);
  ctx.stroke();
}

function drawNumbersBoard(
  ctx: CanvasRenderingContext2D,
  size: number,
  board: Board,
  winLine: Cell[],
  spotlight: Cell | null,
) {
  const pad = size * BOARD_PAD_RATIO;
  const gap = (size - pad * 2) / (BOARD_SIZE - 1);
  const stoneRadius = gap * 0.44;
  const pointX = (col: number) => pad + col * gap;
  const pointY = (row: number) => pad + row * gap;

  ctx.clearRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(126, 98, 58, .4)';
  ctx.lineWidth = Math.max(1, size / 900);
  ctx.beginPath();
  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const position = pad + index * gap;
    ctx.moveTo(pad, position);
    ctx.lineTo(size - pad, position);
    ctx.moveTo(position, pad);
    ctx.lineTo(position, size - pad);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(104, 78, 42, .66)';
  STAR_POINTS.forEach(([row, col]) => {
    ctx.beginPath();
    ctx.arc(pointX(col), pointY(row), Math.max(1.6, gap * 0.13), 0, Math.PI * 2);
    ctx.fill();
  });

  if (winLine.length >= 2) {
    const first = winLine[0];
    const last = winLine[winLine.length - 1];
    ctx.save();
    ctx.strokeStyle = 'rgba(240, 126, 71, .82)';
    ctx.lineWidth = gap * 0.26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pointX(first.col), pointY(first.row));
    ctx.lineTo(pointX(last.col), pointY(last.row));
    ctx.stroke();
    ctx.restore();
  }

  const onWinLine = (row: number, col: number) => winLine.some((cell) => cell.row === row && cell.col === col);
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const stone = board[row][col];
      if (stone === EMPTY) continue;
      paintStone(ctx, pointX(col), pointY(row), stoneRadius, stone, onWinLine(row, col));
    }
  }

  if (spotlight) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pointX(spotlight.col), pointY(spotlight.row), stoneRadius * 1.55, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240, 126, 71, .16)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pointX(spotlight.col), pointY(spotlight.row), stoneRadius * 1.55, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(240, 126, 71, .92)';
    ctx.lineWidth = Math.max(2, gap * 0.1);
    ctx.stroke();
    ctx.restore();
  }
}

interface NumbersBoardProps {
  board: Board;
  winLine: Cell[];
  spotlight: Cell | null;
  label: string;
}

function NumbersBoard({ board, winLine, spotlight, label }: NumbersBoardProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState(0);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const update = () => setSize(frame.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawNumbersBoard(ctx, size, board, winLine, spotlight);
  }, [size, board, winLine, spotlight]);

  return (
    <div className="ck-numbers__board" ref={frameRef}>
      <canvas ref={canvasRef} className="ck-numbers__board-canvas" role="img" aria-label={label} />
      <div className="ck-numbers__board-axis" aria-hidden="true">
        <div className="ck-numbers__board-axis-cols">
          {COLUMN_LABELS.map((text, index) => (
            <Typography key={text} as="span" variant="body" style={{ left: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div className="ck-numbers__board-axis-rows">
          {ROW_LABELS.map((text, index) => (
            <Typography key={text} as="span" variant="body" style={{ top: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 映射卡片上的一格：棋子的样子，和它写成的那个数字。 */
interface MapTile {
  key: string;
  label: string;
  icon: 'black' | 'white' | 'empty';
  value: number;
}

/**
 * 中间的流程箭头：棋盘 → 映射关系 → 数字矩阵。
 * 用纯样式画而不是 svg，避免踩到共享的「幻灯片里 svg 一律 max-width: 100%」规则。
 */
function FlowArrow() {
  return (
    <span className="ck-numbers__arrow-slot" aria-hidden="true">
      <span className="ck-numbers__arrow" />
    </span>
  );
}

export interface BoardAsNumbersPageProps {
  onComplete: () => void;
}

export function BoardAsNumbersPage({ onComplete }: BoardAsNumbersPageProps) {
  const { outcome } = useGomokuOutcome();
  const [focus, setFocus] = useState<Cell | null>(null);
  const completedRef = useRef(false);

  const board = outcome.board;
  const winnerLabel = outcome.winner === BLACK ? '黑' : '白';
  const opponentLabel = outcome.winner === BLACK ? '白' : '黑';
  const direction = useMemo(() => winDirectionLabel(outcome.winLine), [outcome.winLine]);
  const grid = useMemo(() => toNumberGrid(board, outcome.winner), [board, outcome.winner]);
  // 窗口以获胜连线的最小外接矩形为中心，再整体夹回棋盘内。
  const zoom = useMemo(() => zoomWindow(outcome.winLine, WINDOW_SIZE), [outcome.winLine]);

  // 赢方的子记 1，输方的子记 -1，空点记 0。
  const winnerIcon = outcome.winner === BLACK ? 'black' : 'white';
  const loserIcon = outcome.winner === BLACK ? 'white' : 'black';
  const tiles: MapTile[] = [
    { key: 'winner', label: '赢方', icon: winnerIcon, value: 1 },
    { key: 'loser', label: '输方', icon: loserIcon, value: -1 },
    { key: 'empty', label: '空点', icon: 'empty', value: 0 },
  ];

  // 指针进过窗口就算这一页走通了：这一页只需要看懂「棋形 = 数字」。
  useEffect(() => {
    if (!focus || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [focus, onComplete]);

  const lastRow = zoom.origin.row + WINDOW_SIZE - 1;
  const lastCol = zoom.origin.col + WINDOW_SIZE - 1;
  const matrixLabel = [
    `局部放大窗口：棋盘第 ${ROW_LABELS[zoom.origin.row]} 到 ${ROW_LABELS[lastRow]} 行、第 ${COLUMN_LABELS[zoom.origin.col]} 到 ${COLUMN_LABELS[lastCol]} 列，共 9 × 9 个数字。`,
    `1 表示${winnerLabel}子，-1 表示${opponentLabel}子，0 表示空点。`,
  ].join('');

  const boardLabel = `十五路五子棋终局，${winnerLabel}胜，${direction}方向连成五子`;
  const onHoverCell = useCallback((cell: Cell | null) => setFocus(cell), []);

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-numbers"
      title="把棋形变成数字"
      subtitle="棋盘上每个位置，最后都写成一个数字。"
    >
      <div className="ck-numbers__layout">
        <div className="ck-numbers__stage">
          <NumbersBoard board={board} winLine={outcome.winLine} spotlight={focus} label={boardLabel} />
        </div>

        <FlowArrow />

        <div className="ck-numbers__map">
          <Typography as="h2" variant="h3" tone="accent" className="ck-numbers__map-title">
            映射关系
          </Typography>
          <div className="ck-numbers__map-tiles">
            {tiles.map((tile) => {
              const kind = tile.value === 1 ? 'one' : tile.value === -1 ? 'minus' : 'zero';
              return (
                <div key={tile.key} className={`ck-numbers__map-tile ck-numbers__map-tile--${kind}`}>
                  <div className="ck-numbers__map-face">
                    <Typography as="span" variant="body" tone="muted">{tile.label}</Typography>
                    <span
                      className={`ck-numbers__map-icon ck-numbers__map-icon--${tile.icon}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ck-numbers__map-value">
                    <Typography as="span" variant="h2" tone="inherit">
                      {tile.value}
                    </Typography>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FlowArrow />

        <div className="ck-numbers__panel">
          <div className="ck-numbers__matrix">
            <div className="ck-numbers__matrix-corner" aria-hidden="true" />

            <div className="ck-numbers__matrix-cols" aria-hidden="true">
              {zoom.cols.map((col) => (
                <Typography
                  key={col}
                  as="span"
                  variant="body"
                  tone={focus && focus.col === col ? 'accent' : 'light'}
                >
                  {COLUMN_LABELS[col]}
                </Typography>
              ))}
            </div>

            <div className="ck-numbers__matrix-rows" aria-hidden="true">
              {zoom.rows.map((row) => (
                <Typography
                  key={row}
                  as="span"
                  variant="body"
                  tone={focus && focus.row === row ? 'accent' : 'light'}
                >
                  {ROW_LABELS[row]}
                </Typography>
              ))}
            </div>

            <div
              className="ck-numbers__matrix-grid"
              role="group"
              aria-label={matrixLabel}
              onPointerLeave={() => onHoverCell(null)}
            >
              {zoom.rows.map((row) => zoom.cols.map((col) => {
                const value = grid[row][col];
                const ring = Math.min(
                  RING_MAX,
                  Math.max(Math.abs(row - zoom.centre.row), Math.abs(col - zoom.centre.col)),
                );
                const classes = [
                  'ck-numbers__cell',
                  `ck-numbers__cell--ring-${ring}`,
                  value === 1 ? 'ck-numbers__cell--one' : '',
                  value === -1 ? 'ck-numbers__cell--minus' : '',
                  focus && focus.row === row && focus.col === col ? 'is-hovered' : '',
                ].filter(Boolean).join(' ');
                return (
                  <div
                    key={cellKey(row, col)}
                    className={classes}
                    data-cell={cellKey(row, col)}
                    onPointerEnter={onHoverCell.bind(null, { row, col })}
                    onPointerDown={onHoverCell.bind(null, { row, col })}
                  >
                    <Typography
                      as="span"
                      variant="h2"
                      tone={value === 0 ? 'muted' : 'inherit'}
                      aria-hidden="true"
                    >
                      {value}
                    </Typography>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
