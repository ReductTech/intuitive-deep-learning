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
  '--cg-copy-ck-numbers-background': `url("${moduleAssetUrl("workflow/convolution-course/bg1.webp")}")`,
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
    <div shuku-edit-id="e-ed682096-d61c-45f1-b2a8-59685ad9390f" className="cg-copy-ck-numbers__board" ref={frameRef}>
      <canvas shuku-edit-id="e-059de8f5-06f0-467c-b04b-75172f6f9166" ref={canvasRef} className="cg-copy-ck-numbers__board-canvas" role="img" aria-label={label} />
      <div shuku-edit-id="e-c65ac1f8-fd87-40fe-8a84-fb4d977890c8" className="cg-copy-ck-numbers__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-b4cf418d-308e-4363-9986-eafc0beb3e94" className="cg-copy-ck-numbers__board-axis-cols">
          {Array.from({ length: WINDOW_SIZE }, (_, index) => COLUMN_LABELS[origin.col + index]).map((text, index) => (
              <Typography shuku-edit-id="e-0f9425b7-0675-42d7-919d-0da1df603f7d" key={text} as="span" variant="body" style={{ left: `${(index / (WINDOW_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-69ca3766-1914-4067-86b7-bc6e4ebc385a" className="cg-copy-ck-numbers__board-axis-rows">
          {Array.from({ length: WINDOW_SIZE }, (_, index) => ROW_LABELS[origin.row + index]).map((text, index) => (
              <Typography shuku-edit-id="e-80696d30-f3a3-4bc8-a67e-0c5d682d55a3" key={text} as="span" variant="body" style={{ top: `${(index / (WINDOW_SIZE - 1)) * 100}%` }}>
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
    <span shuku-edit-id="e-2b1d2398-adc3-41a8-ad00-06bb8083af3e" className="cg-copy-ck-numbers__arrow-slot" aria-hidden="true">
      <span shuku-edit-id="e-c7c7dc72-542c-4eea-b046-9c602c21f3ae" className="cg-copy-ck-numbers__arrow" />
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
    <ContentBlock shuku-edit-id="e-ee06785c-a07f-40d1-834a-54f0ae11a9ea"
      headingLevel={1}
      className="cg-copy-ck-numbers"
      style={boardBackgroundStyle}
      title="棋盘局部区域的数值表示"
      subtitle={clarifyOrigin ? '这些数字对应上一页的棋盘位置。将棋子与空位映射为数值，得到对应的局部矩阵。' : '将棋子与空位映射为数值，得到对应的局部矩阵。'}
    >
      <div shuku-edit-id="e-37c9aedd-64a0-44a0-92a0-eb76271a2b6e" className="cg-copy-ck-numbers__layout">
        <div shuku-edit-id="e-184f49ff-be07-430c-9697-8d950f775106" className="cg-copy-ck-numbers__stage">
          <div shuku-edit-id="e-a03a8e60-dd76-4ca9-8bfe-a95ac9ed2dfc" className="cg-copy-ck-numbers__step-heading"><span shuku-edit-id="e-8fa26b04-73ac-4af8-a5dd-f9c6d74775a6">1</span><div shuku-edit-id="e-7c55fed9-2286-4942-bbe6-bf4893927822"><Typography shuku-edit-id="e-bacd7910-e19a-4feb-82f6-57ce12fd5932" as="h2" variant="h3" tone="accent">局部区域选取</Typography><Typography shuku-edit-id="e-c3718459-f113-432b-a946-70c5cd33c1d1" variant="bodySmall" tone="muted">选取五子连线附近的局部棋盘。</Typography></div></div>
          <NumbersBoard board={board} winLine={outcome.winLine} spotlight={focus} origin={zoom.origin} label={boardLabel} />
        </div>

        <FlowArrow />

        <div shuku-edit-id="e-e4239df6-8ef5-49f9-b00d-e83d5e8fa51f" className="cg-copy-ck-numbers__map">
          <div shuku-edit-id="e-c930c1b4-99a9-4165-ad28-2f749658d444" className="cg-copy-ck-numbers__step-heading"><span shuku-edit-id="e-f0344c73-fd8e-440c-9632-bc550abd69c1">2</span><div shuku-edit-id="e-e706a661-5c42-4f9d-bcf1-bfd2861e4fc9"><Typography shuku-edit-id="e-6a03d796-e72f-46da-aa60-c646d38984ce" as="h2" variant="h3" tone="accent">数值编码规则</Typography><Typography shuku-edit-id="e-416636c3-793b-4242-8a8a-21c4856171e3" variant="bodySmall" tone="muted">目标棋子记为 1，对手棋子记为 −1，空位记为 0。</Typography></div></div>
          <div shuku-edit-id="e-4d812995-0e46-479c-9b10-153e532c19c6" className="cg-copy-ck-numbers__map-tiles">
            {tiles.map((tile) => {
              const kind = tile.value === 1 ? 'one' : tile.value === -1 ? 'minus' : 'zero';
              return (
                <div shuku-edit-id="e-825932db-940c-4d76-ae9a-d556b1543af9" key={tile.key} className={`cg-copy-ck-numbers__map-tile cg-copy-ck-numbers__map-tile--${kind}`}>
                  <div shuku-edit-id="e-241a78d9-b0ab-4ee5-a31f-213cbfb45cb6" className="cg-copy-ck-numbers__map-face">
                    <Typography shuku-edit-id="e-7b320aea-815a-46ea-abc1-09471b40e73e" as="span" variant="body" tone="muted">{tile.label}</Typography>
                    <span shuku-edit-id="e-47438dde-ac78-4714-abd0-ebd15be820e6"
                      className={`cg-copy-ck-numbers__map-icon cg-copy-ck-numbers__map-icon--${tile.icon}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div shuku-edit-id="e-26c1c11b-209a-4f47-bdbe-e5dadf089c25" className="cg-copy-ck-numbers__map-value">
                    <Typography shuku-edit-id="e-855cef5f-728d-43ba-81bc-f129baeb5f36" as="span" variant="h2" tone="inherit">
                      {tile.value}
                    </Typography>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FlowArrow />

        <div shuku-edit-id="e-67deb8c9-ed3b-4512-8ac5-708a5f3910ce" className="cg-copy-ck-numbers__panel">
          <div shuku-edit-id="e-ef491669-3ae5-4433-a310-b8f854cba0a3" className="cg-copy-ck-numbers__step-heading"><span shuku-edit-id="e-c9879d9c-2353-45bd-a8c5-00d0b67aa958">3</span><div shuku-edit-id="e-214ee85a-a9e4-4c11-b6b3-b58100cc6968"><Typography shuku-edit-id="e-46c5f83d-ebf5-4a79-a0f6-c9985ef019ef" as="h2" variant="h3" tone="accent">局部矩阵表示</Typography><Typography shuku-edit-id="e-d0692cbf-991b-4d27-8dd2-89e05aaaea41" variant="bodySmall" tone="muted">按照相同的空间位置排列对应数值。</Typography></div></div>
          <div shuku-edit-id="e-548aeb53-8d5d-4f17-a8fa-08d2aaef4718" className="cg-copy-ck-numbers__matrix">
            <div shuku-edit-id="e-827af786-ddab-4cad-9fd4-35993c976eea" className="cg-copy-ck-numbers__matrix-corner" aria-hidden="true" />

            <div shuku-edit-id="e-45ba4ba9-9205-4a3b-b681-09554e5048cd" className="cg-copy-ck-numbers__matrix-cols" aria-hidden="true">
              {matrixCols.map((col) => (
                <Typography shuku-edit-id="e-57302a46-9580-49c2-bbdc-c8c4285708e5"
                  key={col}
                  as="span"
                  variant="body"
                  tone={focus && focus.col === col ? 'accent' : 'light'}
                >
                  {COLUMN_LABELS[col]}
                </Typography>
              ))}
            </div>

            <div shuku-edit-id="e-330ae3bb-b932-4e59-9c7a-cc12f6a5bc0a" className="cg-copy-ck-numbers__matrix-rows" aria-hidden="true">
              {matrixRows.map((row) => (
                <Typography shuku-edit-id="e-40e2d536-6c72-4006-8d22-341c403c50a5"
                  key={row}
                  as="span"
                  variant="body"
                  tone={focus && focus.row === row ? 'accent' : 'light'}
                >
                  {ROW_LABELS[row]}
                </Typography>
              ))}
            </div>

            <div shuku-edit-id="e-2aeeb554-1923-40ef-bdd2-f5dce517b3b5"
              className="cg-copy-ck-numbers__matrix-grid"
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
                  'cg-copy-ck-numbers__cell',
                  `cg-copy-ck-numbers__cell--ring-${ring}`,
                  value === 1 ? 'cg-copy-ck-numbers__cell--one' : '',
                  value === -1 ? 'cg-copy-ck-numbers__cell--minus' : '',
                  focus && focus.row === row && focus.col === col ? 'is-hovered' : '',
                ].filter(Boolean).join(' ');
                return (
                  <div shuku-edit-id="e-716c0f84-9086-4492-ad0a-197c5a059d3c"
                    key={cellKey(row, col)}
                    className={classes}
                    data-cell={cellKey(row, col)}
                    onPointerEnter={onHoverCell.bind(null, { row, col })}
                    onPointerDown={onHoverCell.bind(null, { row, col })}
                  >
                    <Typography shuku-edit-id="e-23b6cbc4-5fc7-4c42-859c-80370612adeb"
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
