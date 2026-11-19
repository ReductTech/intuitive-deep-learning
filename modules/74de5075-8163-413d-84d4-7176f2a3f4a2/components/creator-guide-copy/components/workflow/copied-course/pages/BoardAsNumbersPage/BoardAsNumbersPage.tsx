import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
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
  '--spp-replay-numbers-background': `url("${creatorGuideAssetUrl('444f8951-dd2e-42dc-94e5-c5a878618631', "workflow/convolution-course/bg1.webp")}")`,
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
    <div shuku-edit-id="e-2a4ce4c3-a5b7-4356-a554-e1e1b174b1eb" className="spp-replay-numbers__board" ref={frameRef}>
      <canvas shuku-edit-id="e-19e4e23d-a559-43a3-b434-8d13840a4f5a" ref={canvasRef} className="spp-replay-numbers__board-canvas" role="img" aria-label={label} />
      <div shuku-edit-id="e-0b513180-e0d7-4e1b-935e-1f329826f333" className="spp-replay-numbers__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-ca10f018-3aa2-463f-b716-765b59209d4d" className="spp-replay-numbers__board-axis-cols">
          {Array.from({ length: WINDOW_SIZE }, (_, index) => COLUMN_LABELS[origin.col + index]).map((text, index) => (
              <Typography shuku-edit-id="e-087e022c-2f62-46cc-bad0-7f7cf402c72a" key={text} as="span" variant="body" style={{ left: `${(index / (WINDOW_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-21b036e4-5b06-4ed0-bd02-ea6806f5a1ae" className="spp-replay-numbers__board-axis-rows">
          {Array.from({ length: WINDOW_SIZE }, (_, index) => ROW_LABELS[origin.row + index]).map((text, index) => (
              <Typography shuku-edit-id="e-251f575b-dc06-4b92-9072-d5cdf6dfc0e4" key={text} as="span" variant="body" style={{ top: `${(index / (WINDOW_SIZE - 1)) * 100}%` }}>
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
    <span shuku-edit-id="e-0901bb0f-0a93-4ed7-a507-aeb3e3f29daa" className="spp-replay-numbers__arrow-slot" aria-hidden="true">
      <span shuku-edit-id="e-a2d7b698-a9af-4461-838f-1e855234bc66" className="spp-replay-numbers__arrow" />
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
    <ContentBlock shuku-edit-id="e-bcb0c29e-793e-41f4-b46d-411939701f35"
      headingLevel={1}
      className="spp-replay-numbers"
      style={boardBackgroundStyle}
      title="棋盘局部区域的数值表示"
      subtitle={clarifyOrigin ? '这些数字对应上一页的棋盘位置。将棋子与空位映射为数值，得到对应的局部矩阵。' : '将棋子与空位映射为数值，得到对应的局部矩阵。'}
    >
      <div shuku-edit-id="e-2dfe28cd-c083-4a46-bdc8-ef6253765d3d" className="spp-replay-numbers__layout">
        <div shuku-edit-id="e-e85a23af-90bf-4c21-932a-6215e9d00d17" className="spp-replay-numbers__stage">
          <div shuku-edit-id="e-9e2b97af-b911-4692-b27f-d4c595d3c6dc" className="spp-replay-numbers__step-heading"><span shuku-edit-id="e-88f7237d-975f-45fa-b479-2ced6f814e59">1</span><div shuku-edit-id="e-30f71d8a-103a-41da-bdfb-b16e08901c5e"><Typography shuku-edit-id="e-0d01388a-d0ea-442b-82ba-bb47e6fd710e" as="h2" variant="h3" tone="accent">局部区域选取</Typography><Typography shuku-edit-id="e-89dce0d9-4671-4f32-b136-b56ec121b6ea" variant="bodySmall" tone="muted">选取五子连线附近的局部棋盘。</Typography></div></div>
          <NumbersBoard board={board} winLine={outcome.winLine} spotlight={focus} origin={zoom.origin} label={boardLabel} />
        </div>

        <FlowArrow />

        <div shuku-edit-id="e-c6fef61e-4bac-4185-893f-e0c0b8c33c41" className="spp-replay-numbers__map">
          <div shuku-edit-id="e-12605a87-54f3-454e-b688-38b30c26b977" className="spp-replay-numbers__step-heading"><span shuku-edit-id="e-107ebada-a24a-4848-9e56-e658b34c836b">2</span><div shuku-edit-id="e-2a99fd8e-87b7-4eae-8692-d2dbf2d67ee2"><Typography shuku-edit-id="e-2e9d4d58-fe99-4ec4-a2ee-c8c889fd31ff" as="h2" variant="h3" tone="accent">数值编码规则</Typography><Typography shuku-edit-id="e-87925441-344f-47c4-8c93-5ba5ea1516ca" variant="bodySmall" tone="muted">目标棋子记为 1，对手棋子记为 −1，空位记为 0。</Typography></div></div>
          <div shuku-edit-id="e-1dbac5e3-0cef-4b9f-b98f-befed7a35489" className="spp-replay-numbers__map-tiles">
            {tiles.map((tile) => {
              const kind = tile.value === 1 ? 'one' : tile.value === -1 ? 'minus' : 'zero';
              return (
                <div shuku-edit-id="e-6a3966c7-a716-448f-8a8a-fc2e6b8a443e" key={tile.key} className={`spp-replay-numbers__map-tile spp-replay-numbers__map-tile--${kind}`}>
                  <div shuku-edit-id="e-b0eef025-68fe-443d-972d-aa9d9de9daeb" className="spp-replay-numbers__map-face">
                    <Typography shuku-edit-id="e-3dfa2526-b786-4c56-b03d-22349ffa87fb" as="span" variant="body" tone="muted">{tile.label}</Typography>
                    <span shuku-edit-id="e-18af31a1-d314-4bee-88ef-e184fc9b0535"
                      className={`spp-replay-numbers__map-icon spp-replay-numbers__map-icon--${tile.icon}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div shuku-edit-id="e-ce801a6a-3c09-43fe-8a30-044c4b21a18f" className="spp-replay-numbers__map-value">
                    <Typography shuku-edit-id="e-aea3c0c9-f16d-4f36-b18f-c332f8c08ded" as="span" variant="h2" tone="inherit">
                      {tile.value}
                    </Typography>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FlowArrow />

        <div shuku-edit-id="e-07b05683-48a9-43dd-af63-452787542b42" className="spp-replay-numbers__panel">
          <div shuku-edit-id="e-20781638-bd66-4596-a513-601f429d763b" className="spp-replay-numbers__step-heading"><span shuku-edit-id="e-9a8655e5-9385-4cda-a7d1-95a9487e8fce">3</span><div shuku-edit-id="e-839490e0-38d1-4b74-bb3c-8ec9367d5afa"><Typography shuku-edit-id="e-c3bba5fd-ef56-4c75-8980-a17492a247c5" as="h2" variant="h3" tone="accent">局部矩阵表示</Typography><Typography shuku-edit-id="e-3a524a91-cef8-48f1-8ee2-eb749670c48d" variant="bodySmall" tone="muted">按照相同的空间位置排列对应数值。</Typography></div></div>
          <div shuku-edit-id="e-1836ba0c-9a80-40ab-8347-24855afd2bb2" className="spp-replay-numbers__matrix">
            <div shuku-edit-id="e-cb0bef2b-a1b3-4979-ba34-3651ee3ef570" className="spp-replay-numbers__matrix-corner" aria-hidden="true" />

            <div shuku-edit-id="e-da870e39-8360-4bad-95cd-8686cafcbc85" className="spp-replay-numbers__matrix-cols" aria-hidden="true">
              {matrixCols.map((col) => (
                <Typography shuku-edit-id="e-f346a66b-154c-48a8-9d18-dac05b8348a2"
                  key={col}
                  as="span"
                  variant="body"
                  tone={focus && focus.col === col ? 'accent' : 'light'}
                >
                  {COLUMN_LABELS[col]}
                </Typography>
              ))}
            </div>

            <div shuku-edit-id="e-95bb28a1-b20b-4807-ab2d-11d972ae8b40" className="spp-replay-numbers__matrix-rows" aria-hidden="true">
              {matrixRows.map((row) => (
                <Typography shuku-edit-id="e-d6b8d9d5-5dba-41d1-a653-89fcf7532f78"
                  key={row}
                  as="span"
                  variant="body"
                  tone={focus && focus.row === row ? 'accent' : 'light'}
                >
                  {ROW_LABELS[row]}
                </Typography>
              ))}
            </div>

            <div shuku-edit-id="e-b38c1571-a5ae-4449-8b4f-42eb9eff4716"
              className="spp-replay-numbers__matrix-grid"
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
                  'spp-replay-numbers__cell',
                  `spp-replay-numbers__cell--ring-${ring}`,
                  value === 1 ? 'spp-replay-numbers__cell--one' : '',
                  value === -1 ? 'spp-replay-numbers__cell--minus' : '',
                  focus && focus.row === row && focus.col === col ? 'is-hovered' : '',
                ].filter(Boolean).join(' ');
                return (
                  <div shuku-edit-id="e-899f4a6e-f790-499c-940b-c712c560301f"
                    key={cellKey(row, col)}
                    className={classes}
                    data-cell={cellKey(row, col)}
                    onPointerEnter={onHoverCell.bind(null, { row, col })}
                    onPointerDown={onHoverCell.bind(null, { row, col })}
                  >
                    <Typography shuku-edit-id="e-81b45222-c473-4d55-a416-631d9667f902"
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
