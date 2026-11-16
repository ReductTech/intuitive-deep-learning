import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { useGomokuOutcome } from '../../LessonContext';
import {
  BLACK,
  BOARD_SIZE,
  EMPTY,
  winDirectionLabel,
  type Board,
  type Cell,
  type Stone,
} from '../../gomokuEngine';
import './BoardAsNumbersPage.css';

/** 局部放大窗口的边长：棋形的最小外接矩形 5 × 5，四周各留两层，正好 9 × 9。 */
const WINDOW_SIZE = 9;
/** 底色从中心往外一共分五层，再远都并到最外那一层。 */
const RING_MAX = 4;
/** 网格在棋盘边框内缩进的比例，画布与 HTML 坐标轴共用同一数值。 */
const BOARD_PAD_RATIO = 0.075;
/** 棋盘上的星位：天元与四个星点。 */
const STAR_POINTS: ReadonlyArray<readonly [number, number]> = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
const boardBackgroundStyle = {
  '--spp-copy-numbers-background': `url("${moduleAssetUrl('workflow/convolution-course/bg1.jpg')}")`,
} as CSSProperties;

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
  origin: Cell,
) {
  const pad = size * BOARD_PAD_RATIO;
  const gap = (size - pad * 2) / (WINDOW_SIZE - 1);
  const stoneRadius = gap * 0.44;
  const pointX = (col: number) => pad + col * gap;
  const pointY = (row: number) => pad + row * gap;

  ctx.clearRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(126, 98, 58, .4)';
  ctx.lineWidth = Math.max(1, size / 900);
  ctx.beginPath();
  for (let index = 0; index < WINDOW_SIZE; index += 1) {
    const position = pad + index * gap;
    ctx.moveTo(pad, position);
    ctx.lineTo(size - pad, position);
    ctx.moveTo(position, pad);
    ctx.lineTo(position, size - pad);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(104, 78, 42, .66)';
  STAR_POINTS.filter(([row, col]) => row >= origin.row && row < origin.row + WINDOW_SIZE && col >= origin.col && col < origin.col + WINDOW_SIZE).forEach(([row, col]) => {
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
    ctx.moveTo(pointX(first.col - origin.col), pointY(first.row - origin.row));
    ctx.lineTo(pointX(last.col - origin.col), pointY(last.row - origin.row));
    ctx.stroke();
    ctx.restore();
  }

  const onWinLine = (row: number, col: number) => winLine.some((cell) => cell.row === row && cell.col === col);
  for (let row = 0; row < WINDOW_SIZE; row += 1) {
    for (let col = 0; col < WINDOW_SIZE; col += 1) {
      const stone = board[origin.row + row][origin.col + col];
      if (stone === EMPTY) continue;
      paintStone(ctx, pointX(col), pointY(row), stoneRadius, stone, onWinLine(origin.row + row, origin.col + col));
    }
  }

  if (spotlight) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pointX(spotlight.col - origin.col), pointY(spotlight.row - origin.row), stoneRadius * 1.55, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240, 126, 71, .16)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pointX(spotlight.col - origin.col), pointY(spotlight.row - origin.row), stoneRadius * 1.55, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(240, 126, 71, .92)';
    ctx.lineWidth = Math.max(2, gap * 0.1);
    ctx.stroke();
    ctx.restore();
  }

  if (winLine.length >= 2) {
    const rows = winLine.map((cell) => cell.row - origin.row);
    const cols = winLine.map((cell) => cell.col - origin.col);
    const minRow = Math.max(0, Math.min(...rows));
    const maxRow = Math.min(WINDOW_SIZE - 1, Math.max(...rows));
    const minCol = Math.max(0, Math.min(...cols));
    const maxCol = Math.min(WINDOW_SIZE - 1, Math.max(...cols));
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = '#2d63ad';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(pointX(minCol) - gap * .48, pointY(minRow) - gap * .48, (maxCol - minCol) * gap + gap * .96, (maxRow - minRow) * gap + gap * .96);
    ctx.restore();
  }
}

interface NumbersBoardProps {
  board: Board;
  winLine: Cell[];
  spotlight: Cell | null;
  label: string;
  origin: Cell;
}

function NumbersBoard({ board, winLine, spotlight, label, origin }: NumbersBoardProps) {
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
    drawNumbersBoard(ctx, size, board, winLine, spotlight, origin);
  }, [size, board, winLine, spotlight, origin]);

  return (
    <div shuku-edit-id="e-7e7d46b2-b5d3-4be1-9288-cb33b568e918" className="spp-copy-numbers__board" ref={frameRef}>
      <canvas shuku-edit-id="e-1b5c2760-1856-4293-88f7-de50b8e60fb6" ref={canvasRef} className="spp-copy-numbers__board-canvas" role="img" aria-label={label} />
      <div shuku-edit-id="e-77e2e8e9-8ca7-47d9-92d0-de0abcf0b546" className="spp-copy-numbers__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-d5997860-262c-4b76-afe5-876e2ff45d8c" className="spp-copy-numbers__board-axis-cols">
          {Array.from({ length: WINDOW_SIZE }, (_, index) => COLUMN_LABELS[origin.col + index]).map((text, index) => (
              <Typography shuku-edit-id="e-5c862f00-4028-4829-afee-2bc3c13e8ac1" key={text} as="span" variant="body" style={{ left: `${(index / (WINDOW_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-10665028-0856-4158-9846-72b0e925a0f8" className="spp-copy-numbers__board-axis-rows">
          {Array.from({ length: WINDOW_SIZE }, (_, index) => ROW_LABELS[origin.row + index]).map((text, index) => (
              <Typography shuku-edit-id="e-66130e2f-7619-403d-bf9f-071ea6a8b3da" key={text} as="span" variant="body" style={{ top: `${(index / (WINDOW_SIZE - 1)) * 100}%` }}>
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
    <span shuku-edit-id="e-c39ef507-6ab8-4914-a512-b4d8109f5de3" className="spp-copy-numbers__arrow-slot" aria-hidden="true">
      <span shuku-edit-id="e-0446b1fb-dc2c-4087-985d-d8765ef91a01" className="spp-copy-numbers__arrow" />
    </span>
  );
}

export interface BoardAsNumbersPageProps {
  onComplete: () => void;
  clarifyOrigin?: boolean;
}

export function BoardAsNumbersPage({ onComplete, clarifyOrigin = false }: BoardAsNumbersPageProps) {
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
    { key: 'winner', label: '目标棋子', icon: winnerIcon, value: 1 },
    { key: 'loser', label: '对手棋子', icon: loserIcon, value: -1 },
    { key: 'empty', label: '空位', icon: 'empty', value: 0 },
  ];

  // 指针进过窗口就算这一页走通了：这一页只需要看懂「棋形 = 数字」。
  useEffect(() => {
    if (!focus || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [focus, onComplete]);

  const lastRow = zoom.origin.row + WINDOW_SIZE - 1;
  const lastCol = zoom.origin.col + WINDOW_SIZE - 1;
  const matrixRows = zoom.rows.slice(2, 7);
  const matrixCols = zoom.cols.slice(2, 7);
  const matrixLabel = [
    `局部放大窗口：棋盘第 ${ROW_LABELS[zoom.origin.row]} 到 ${ROW_LABELS[lastRow]} 行、第 ${COLUMN_LABELS[zoom.origin.col]} 到 ${COLUMN_LABELS[lastCol]} 列，共 9 × 9 个数字。`,
    `1 表示${winnerLabel}子，-1 表示${opponentLabel}子，0 表示空点。右侧显示中心 5 × 5 数字块。`,
  ].join('');

  const boardLabel = `十五路五子棋终局，${winnerLabel}胜，${direction}方向连成五子`;
  const onHoverCell = useCallback((cell: Cell | null) => setFocus(cell), []);

  return (
    <ContentBlock shuku-edit-id="e-f7d928d9-2c62-4efa-bf1b-a5eced331093"
      headingLevel={1}
      className="spp-copy-numbers"
      style={boardBackgroundStyle}
      title="棋盘局部区域的数值表示"
      subtitle={clarifyOrigin ? '这些数字对应上一页的棋盘位置。将棋子与空位映射为数值，得到对应的局部矩阵。' : '将棋子与空位映射为数值，得到对应的局部矩阵。'}
    >
      <div shuku-edit-id="e-04b9b2df-644f-4c7b-9fb9-d55f38006d4a" className="spp-copy-numbers__layout">
        <div shuku-edit-id="e-2c7d5034-529b-431d-9ad7-cc0aa40b49d1" className="spp-copy-numbers__stage">
          <div shuku-edit-id="e-7e323a0f-28e7-420c-a3c4-f1c7f612144b" className="spp-copy-numbers__step-heading"><span shuku-edit-id="e-5ba407d5-9288-491f-9056-58a70427e93e">1</span><div shuku-edit-id="e-f567d884-2cfb-4813-8ae2-9f8ce9e61dfb"><Typography shuku-edit-id="e-23d53e65-eab6-4b79-957e-e30864fc03e2" as="h2" variant="h3" tone="accent">局部区域选取</Typography><Typography shuku-edit-id="e-d827c5b8-6321-40a1-9a14-f34ff02892aa" variant="bodySmall" tone="muted">选取五子连线附近的局部棋盘。</Typography></div></div>
          <NumbersBoard board={board} winLine={outcome.winLine} spotlight={focus} origin={zoom.origin} label={boardLabel} />
        </div>

        <FlowArrow />

        <div shuku-edit-id="e-ae11dfa0-2374-459b-868a-d6ddecee338b" className="spp-copy-numbers__map">
          <div shuku-edit-id="e-944a1c4a-2c13-48cb-b2ae-fff495a6a8bf" className="spp-copy-numbers__step-heading"><span shuku-edit-id="e-110453c8-ec7f-4d8b-a11e-a4d59cc05311">2</span><div shuku-edit-id="e-f98b627c-7d98-475f-bdfb-cbb4ef9cc4f8"><Typography shuku-edit-id="e-87a4d569-9e52-4c5d-8368-b4c8f7d00b61" as="h2" variant="h3" tone="accent">数值编码规则</Typography><Typography shuku-edit-id="e-5b4812f0-9f1a-45b7-8a5d-231a027f7618" variant="bodySmall" tone="muted">目标棋子记为 1，对手棋子记为 −1，空位记为 0。</Typography></div></div>
          <div shuku-edit-id="e-6c75e6a7-ddfa-4d4e-8ad0-f0b7ada079f2" className="spp-copy-numbers__map-tiles">
            {tiles.map((tile) => {
              const kind = tile.value === 1 ? 'one' : tile.value === -1 ? 'minus' : 'zero';
              return (
                <div shuku-edit-id="e-fef19be5-bf5a-4873-8311-ae64069f4a1a" key={tile.key} className={`spp-copy-numbers__map-tile spp-copy-numbers__map-tile--${kind}`}>
                  <div shuku-edit-id="e-1e076a92-af10-4409-9ea5-8ee67f958ea0" className="spp-copy-numbers__map-face">
                    <Typography shuku-edit-id="e-a537eace-12c8-4b56-9eb9-87b9d9bbeec5" as="span" variant="body" tone="muted">{tile.label}</Typography>
                    <span shuku-edit-id="e-d13da9c6-dc05-47db-ae19-efe98f9f1bcc"
                      className={`spp-copy-numbers__map-icon spp-copy-numbers__map-icon--${tile.icon}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div shuku-edit-id="e-a9020355-f598-45a7-928c-6ec46c3588d0" className="spp-copy-numbers__map-value">
                    <Typography shuku-edit-id="e-91ba4b8c-afad-497e-be45-b13496d3a5a4" as="span" variant="h2" tone="inherit">
                      {tile.value}
                    </Typography>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FlowArrow />

        <div shuku-edit-id="e-77ecce82-db6b-4655-a5fb-78be19febcfb" className="spp-copy-numbers__panel">
          <div shuku-edit-id="e-184018d3-db83-41e0-823b-491aa4d778d6" className="spp-copy-numbers__step-heading"><span shuku-edit-id="e-d4a33487-27c7-4a46-b986-5bb0331c665c">3</span><div shuku-edit-id="e-3a37f295-355c-46a4-b6f5-95f3c83ae4eb"><Typography shuku-edit-id="e-4dda7c60-cb5e-4c40-a3d4-b264a546a6d0" as="h2" variant="h3" tone="accent">局部矩阵表示</Typography><Typography shuku-edit-id="e-d61f4907-931b-44cc-97f5-aa4db00eb472" variant="bodySmall" tone="muted">按照相同的空间位置排列对应数值。</Typography></div></div>
          <div shuku-edit-id="e-f02ca374-839b-415b-9fb3-75cd5fccb33e" className="spp-copy-numbers__matrix">
            <div shuku-edit-id="e-7eecca91-0d8b-4987-a076-de0e31a15f30" className="spp-copy-numbers__matrix-corner" aria-hidden="true" />

            <div shuku-edit-id="e-0da6887e-1d5f-4979-9555-ae9bc32406ca" className="spp-copy-numbers__matrix-cols" aria-hidden="true">
              {matrixCols.map((col) => (
                <Typography shuku-edit-id="e-77bac819-2b93-41ff-a612-e51b9b43a33e"
                  key={col}
                  as="span"
                  variant="body"
                  tone={focus && focus.col === col ? 'accent' : 'light'}
                >
                  {COLUMN_LABELS[col]}
                </Typography>
              ))}
            </div>

            <div shuku-edit-id="e-7a119570-d312-4f1e-b851-6c66790324a3" className="spp-copy-numbers__matrix-rows" aria-hidden="true">
              {matrixRows.map((row) => (
                <Typography shuku-edit-id="e-4f2f22d3-47b3-4042-b177-611fa88461a2"
                  key={row}
                  as="span"
                  variant="body"
                  tone={focus && focus.row === row ? 'accent' : 'light'}
                >
                  {ROW_LABELS[row]}
                </Typography>
              ))}
            </div>

            <div shuku-edit-id="e-4d694972-ad8c-48dc-89a9-8d654dc50b0f"
              className="spp-copy-numbers__matrix-grid"
              role="group"
              aria-label={matrixLabel}
              onPointerLeave={() => onHoverCell(null)}
            >
              {matrixRows.map((row) => matrixCols.map((col) => {
                const value = grid[row][col];
                const ring = Math.min(
                  RING_MAX,
                  Math.max(Math.abs(row - zoom.centre.row), Math.abs(col - zoom.centre.col)),
                );
                const classes = [
                  'spp-copy-numbers__cell',
                  `spp-copy-numbers__cell--ring-${ring}`,
                  value === 1 ? 'spp-copy-numbers__cell--one' : '',
                  value === -1 ? 'spp-copy-numbers__cell--minus' : '',
                  focus && focus.row === row && focus.col === col ? 'is-hovered' : '',
                ].filter(Boolean).join(' ');
                return (
                  <div shuku-edit-id="e-04a888a8-6a5a-4480-8f41-e5210c769e7e"
                    key={cellKey(row, col)}
                    className={classes}
                    data-cell={cellKey(row, col)}
                    onPointerEnter={onHoverCell.bind(null, { row, col })}
                    onPointerDown={onHoverCell.bind(null, { row, col })}
                  >
                    <Typography shuku-edit-id="e-71a901e4-5031-4c39-8fe0-0fb7147d6ad2"
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
