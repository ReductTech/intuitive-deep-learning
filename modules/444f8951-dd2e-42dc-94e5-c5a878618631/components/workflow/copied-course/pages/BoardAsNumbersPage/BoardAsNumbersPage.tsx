import bg1Asset0 from '../../../../../assets/workflow/convolution-course/bg1.jpg';
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
  '--cg-numbers-background': `url("${bg1Asset0}")`,
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
    <div shuku-edit-id="e-a21d889d-e679-4cf7-9dbe-c47d3a54b8f0" className="cg-replay-numbers__board" ref={frameRef}>
      <canvas shuku-edit-id="e-f09c5eb8-d8e9-4f76-b932-43cf26155e5e" ref={canvasRef} className="cg-replay-numbers__board-canvas" role="img" aria-label={label} />
      <div shuku-edit-id="e-e18667b0-6cb1-4f73-99bb-964e23e54fc2" className="cg-replay-numbers__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-ca880edf-ed66-4e33-b4ab-ce6ec4239549" className="cg-replay-numbers__board-axis-cols">
          {Array.from({ length: WINDOW_SIZE }, (_, index) => COLUMN_LABELS[origin.col + index]).map((text, index) => (
              <Typography shuku-edit-id="e-af437fb0-2e48-4ea8-8137-b4380562b2d6" key={text} as="span" variant="body" style={{ left: `${(index / (WINDOW_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-664f7d89-67d0-40e2-a7dd-c946b613bc7d" className="cg-replay-numbers__board-axis-rows">
          {Array.from({ length: WINDOW_SIZE }, (_, index) => ROW_LABELS[origin.row + index]).map((text, index) => (
              <Typography shuku-edit-id="e-44a0958f-06d1-4d12-b1b0-f520dd1ff68b" key={text} as="span" variant="body" style={{ top: `${(index / (WINDOW_SIZE - 1)) * 100}%` }}>
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
    <span shuku-edit-id="e-ef35b0a0-3049-41f3-8816-42470c1e7555" className="cg-replay-numbers__arrow-slot" aria-hidden="true">
      <span shuku-edit-id="e-4fc7f8b1-09e1-4dce-b2f9-53c30f3bf2d1" className="cg-replay-numbers__arrow" />
    </span>
  );
}

export interface BoardAsNumbersPageProps {
  onComplete: () => void;
  clarifyOrigin?: boolean;
  autoDemo?: boolean;
}

export function BoardAsNumbersPage({ onComplete, clarifyOrigin = false, autoDemo = false }: BoardAsNumbersPageProps) {
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
  useEffect(() => {
    if (!autoDemo) return;
    const timer = setTimeout(() => setFocus(zoom.centre), 1200);
    return () => clearTimeout(timer);
  }, [autoDemo, zoom]);

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
    <ContentBlock shuku-edit-id="e-623df4a1-d97d-4f34-b607-7e0a11cc503a"
      headingLevel={1}
      className="cg-replay-numbers"
      style={boardBackgroundStyle}
      title="棋盘局部区域的数值表示"
      subtitle={clarifyOrigin ? '这些数字对应上一页的棋盘位置。将棋子与空位映射为数值，得到对应的局部矩阵。' : '将棋子与空位映射为数值，得到对应的局部矩阵。'}
    >
      <div shuku-edit-id="e-9e0573d4-cf0b-4807-b154-e7a1142a5673" className="cg-replay-numbers__layout">
        <div shuku-edit-id="e-b3427d92-313a-4df4-8ab2-f3634ac10630" className="cg-replay-numbers__stage">
          <div shuku-edit-id="e-d8459a10-e6e0-43e9-b6a0-95b3243ad768" className="cg-replay-numbers__step-heading"><span shuku-edit-id="e-f4f0589a-99ad-462a-b3e4-8879dba346e6">1</span><div shuku-edit-id="e-3dbe6856-e7d3-4acf-968f-8ec6220c6874"><Typography shuku-edit-id="e-689a6c9b-b8ee-4e76-bc55-0b50cd8b3ecd" as="h2" variant="h3" tone="accent">局部区域选取</Typography><Typography shuku-edit-id="e-3beb8902-69ef-466a-9c8b-fef0b635b678" variant="bodySmall" tone="muted">选取五子连线附近的局部棋盘。</Typography></div></div>
          <NumbersBoard board={board} winLine={outcome.winLine} spotlight={focus} origin={zoom.origin} label={boardLabel} />
        </div>

        <FlowArrow />

        <div shuku-edit-id="e-40c4e6c3-be23-4d3e-9f75-c5600d752890" className="cg-replay-numbers__map">
          <div shuku-edit-id="e-d3e92546-9cf9-4c4b-95cb-57f9cf94a691" className="cg-replay-numbers__step-heading"><span shuku-edit-id="e-8761df10-9986-412b-b4b3-6f880dc03008">2</span><div shuku-edit-id="e-343b6cfb-73ea-4b3b-a260-e45799ca1752"><Typography shuku-edit-id="e-0878bb1d-92e5-4d92-a457-f925511fc81a" as="h2" variant="h3" tone="accent">数值编码规则</Typography><Typography shuku-edit-id="e-0b5ee2fc-2ee6-4a65-a168-e667ab7614a6" variant="bodySmall" tone="muted">目标棋子记为 1，对手棋子记为 −1，空位记为 0。</Typography></div></div>
          <div shuku-edit-id="e-545addc3-54bd-49b0-afdf-d58ee8a1c584" className="cg-replay-numbers__map-tiles">
            {tiles.map((tile) => {
              const kind = tile.value === 1 ? 'one' : tile.value === -1 ? 'minus' : 'zero';
              return (
                <div shuku-edit-id="e-d5970ddf-8cf7-4dff-8b84-970063ea46e9" key={tile.key} className={`cg-replay-numbers__map-tile cg-replay-numbers__map-tile--${kind}`}>
                  <div shuku-edit-id="e-38b1dd03-8061-462d-9c0a-5bad44a501b1" className="cg-replay-numbers__map-face">
                    <Typography shuku-edit-id="e-56e1d85c-00d0-4624-8bcb-e55ed8a3d0b8" as="span" variant="body" tone="muted">{tile.label}</Typography>
                    <span shuku-edit-id="e-72717848-6c0d-4d00-84a0-1118738c0072"
                      className={`cg-replay-numbers__map-icon cg-replay-numbers__map-icon--${tile.icon}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div shuku-edit-id="e-3520902f-ee89-40f4-869e-1dea044caf59" className="cg-replay-numbers__map-value">
                    <Typography shuku-edit-id="e-574554b3-6c2e-4984-a76f-57fbb2b998fe" as="span" variant="h2" tone="inherit">
                      {tile.value}
                    </Typography>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FlowArrow />

        <div shuku-edit-id="e-52ecedfc-b404-4f13-842e-5e3f738f72b5" className="cg-replay-numbers__panel">
          <div shuku-edit-id="e-74ca38bc-9bcc-46bd-b978-208d747dad04" className="cg-replay-numbers__step-heading"><span shuku-edit-id="e-ecbfd54c-b7b9-4290-9e68-9584bccb400f">3</span><div shuku-edit-id="e-b2ec708e-08d1-4352-8808-b0fe4d379516"><Typography shuku-edit-id="e-51f45024-9f8e-4447-8574-965f68230c77" as="h2" variant="h3" tone="accent">局部矩阵表示</Typography><Typography shuku-edit-id="e-15cb22f9-9d36-4afd-98e8-caae7e4c0424" variant="bodySmall" tone="muted">按照相同的空间位置排列对应数值。</Typography></div></div>
          <div shuku-edit-id="e-95be0dd8-0e30-4c44-8d60-7734034f8a39" className="cg-replay-numbers__matrix">
            <div shuku-edit-id="e-8d0d9599-2c98-453e-9de5-8cf47f6acb11" className="cg-replay-numbers__matrix-corner" aria-hidden="true" />

            <div shuku-edit-id="e-7cfa8c7e-067f-4e57-ad01-11717e08e831" className="cg-replay-numbers__matrix-cols" aria-hidden="true">
              {matrixCols.map((col) => (
                <Typography shuku-edit-id="e-d636e396-ee32-4208-9d32-47f91b576a67"
                  key={col}
                  as="span"
                  variant="body"
                  tone={focus && focus.col === col ? 'accent' : 'light'}
                >
                  {COLUMN_LABELS[col]}
                </Typography>
              ))}
            </div>

            <div shuku-edit-id="e-c9a1f003-9cb6-4e41-a860-1647fd2136a1" className="cg-replay-numbers__matrix-rows" aria-hidden="true">
              {matrixRows.map((row) => (
                <Typography shuku-edit-id="e-a745b600-8a25-476c-beb8-02fae010f5b2"
                  key={row}
                  as="span"
                  variant="body"
                  tone={focus && focus.row === row ? 'accent' : 'light'}
                >
                  {ROW_LABELS[row]}
                </Typography>
              ))}
            </div>

            <div shuku-edit-id="e-77b1b3a7-b5e1-43a7-92aa-274ab6edb38f"
              className="cg-replay-numbers__matrix-grid"
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
                  'cg-replay-numbers__cell',
                  `cg-replay-numbers__cell--ring-${ring}`,
                  value === 1 ? 'cg-replay-numbers__cell--one' : '',
                  value === -1 ? 'cg-replay-numbers__cell--minus' : '',
                  focus && focus.row === row && focus.col === col ? 'is-hovered' : '',
                ].filter(Boolean).join(' ');
                return (
                  <div shuku-edit-id="e-c8cc197a-2314-4017-8f5a-2f78c0580eeb"
                    key={cellKey(row, col)}
                    className={classes}
                    data-cell={cellKey(row, col)}
                    onPointerEnter={onHoverCell.bind(null, { row, col })}
                    onPointerDown={onHoverCell.bind(null, { row, col })}
                  >
                    <Typography shuku-edit-id="e-5725c94f-2f82-4174-a383-caea3d65797d"
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
