import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import {
  BLACK,
  BOARD_SIZE,
  EMPTY,
  WHITE,
  buildDemoPosition,
  computeComputerMove,
  computeHumanAdvice,
  createBoard,
  placeStone,
  type GomokuDifficulty,
  type Board,
  type Cell,
  type Move,
  type Stone,
} from './gomokuEngine';
import './AssemblyGomoku.css';
import outline from '../../outlines.json';

const bgVideo = moduleAssetUrl('assembly/gomoku-bg.mp4');

const HUMAN = BLACK;
const COMPUTER = WHITE;

/** 棋盘坐标轴：列用 A–O，行用 1–15。 */
const COLUMN_LABELS = Array.from({ length: BOARD_SIZE }, (_, index) => String.fromCharCode(65 + index));
const ROW_LABELS = Array.from({ length: BOARD_SIZE }, (_, index) => String(index + 1));
/** 网格在棋盘边框内缩进的比例，画布与 HTML 坐标轴共用同一数值。 */
const BOARD_PAD_RATIO = 0.075;
/** 棋盘上的星位：天元与四个星点。 */
const STAR_POINTS: ReadonlyArray<readonly [number, number]> = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];

/* 棋盘：木色底、星位、棋子与落点预览，全部画在一张 canvas 上。 */

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

interface PlayBoardDrawOptions {
  size: number;
  board: Board;
  lastMove: Move | null;
  hover: Cell | null;
  cursor: Cell | null;
  winLine: Cell[];
  interactive: boolean;
}

function drawPlayBoard(ctx: CanvasRenderingContext2D, options: PlayBoardDrawOptions) {
  const { size, board, lastMove, hover, cursor, winLine, interactive } = options;
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

  if (lastMove) {
    ctx.beginPath();
    ctx.arc(pointX(lastMove.col), pointY(lastMove.row), Math.max(2.2, stoneRadius * 0.26), 0, Math.PI * 2);
    ctx.fillStyle = '#F07E47';
    ctx.fill();
  }

  if (interactive && hover && board[hover.row][hover.col] === EMPTY) {
    ctx.save();
    ctx.globalAlpha = 0.62;
    paintStone(ctx, pointX(hover.col), pointY(hover.row), stoneRadius, HUMAN, false);
    ctx.restore();
  }

  if (interactive && cursor) {
    ctx.save();
    ctx.setLineDash([gap * 0.22, gap * 0.18]);
    ctx.strokeStyle = 'rgba(39, 68, 110, .6)';
    ctx.lineWidth = Math.max(1.5, size / 520);
    ctx.beginPath();
    ctx.arc(pointX(cursor.col), pointY(cursor.row), stoneRadius * 1.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

interface PlayBoardProps {
  board: Board;
  lastMove: Move | null;
  winLine: Cell[];
  hover: Cell | null;
  cursor: Cell | null;
  hint: Cell | null;
  interactive: boolean;
  label: string;
  onHoverCell: (cell: Cell | null) => void;
  onPickCell: (cell: Cell) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLCanvasElement>) => void;
  onFocusChange: (focused: boolean) => void;
}

function PlayBoard({
  board,
  lastMove,
  winLine,
  hover,
  cursor,
  hint,
  interactive,
  label,
  onHoverCell,
  onPickCell,
  onKeyDown,
  onFocusChange,
}: PlayBoardProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLSpanElement | null>(null);
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
    drawPlayBoard(ctx, {
      size,
      board,
      lastMove,
      hover: null,
      cursor: interactive ? cursor : null,
      winLine,
      interactive,
    });
  }, [size, board, lastMove, hover, cursor, winLine, interactive]);

  const cellFromPointer = useCallback((event: ReactPointerEvent<HTMLCanvasElement>): Cell | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return null;
    const pad = rect.width * BOARD_PAD_RATIO;
    const gap = (rect.width - pad * 2) / (BOARD_SIZE - 1);
    const offsetX = event.clientX - rect.left - pad;
    const offsetY = event.clientY - rect.top - pad;
    const col = Math.round(offsetX / gap);
    const row = Math.round(offsetY / gap);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
    if (Math.hypot(offsetX - col * gap, offsetY - row * gap) > gap * 0.92) return null;
    return { row, col };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!canvas || !preview || !interactive) return undefined;
    const movePreview = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const pad = rect.width * BOARD_PAD_RATIO;
      const gap = (rect.width - pad * 2) / (BOARD_SIZE - 1);
      const offsetX = event.clientX - rect.left - pad;
      const offsetY = event.clientY - rect.top - pad;
      const col = Math.max(0, Math.min(BOARD_SIZE - 1, Math.round(offsetX / gap)));
      const row = Math.max(0, Math.min(BOARD_SIZE - 1, Math.round(offsetY / gap)));
      const distance = Math.hypot(offsetX - col * gap, offsetY - row * gap);
      if (distance > gap * 0.92 || board[row][col] !== EMPTY) {
        preview.style.opacity = '0';
        return;
      }
      preview.style.left = `${((pad + col * gap) / rect.width) * 100}%`;
      preview.style.top = `${((pad + row * gap) / rect.width) * 100}%`;
      preview.style.opacity = '0.62';
    };
    const clearPreview = () => { preview.style.opacity = '0'; };
    canvas.addEventListener('pointermove', movePreview, { passive: true });
    canvas.addEventListener('pointerleave', clearPreview, { passive: true });
    return () => {
      canvas.removeEventListener('pointermove', movePreview);
      canvas.removeEventListener('pointerleave', clearPreview);
    };
  }, [board, interactive]);

  return (
    <div shuku-edit-id="e-ab134a41-6bce-469b-95ad-cb026528d2af"
      className={interactive ? 'cg-built-gomoku__board is-interactive' : 'cg-built-gomoku__board'}
      ref={frameRef}
    >
      <canvas shuku-edit-id="e-21119d48-46b3-43e8-b3f4-62547804d75f"
        ref={canvasRef}
        className="cg-built-gomoku__board-canvas"
        tabIndex={0}
        aria-label={label}
        onPointerMove={undefined}
        onPointerLeave={undefined}
        onPointerUp={interactive ? (event) => {
          const cell = cellFromPointer(event);
          if (cell) onPickCell(cell);
        } : undefined}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onKeyDown={onKeyDown}
      />
      <span shuku-edit-id="e-ff737167-b5f8-4091-9cde-864061be932d" ref={previewRef} className="cg-built-gomoku__hover-stone" aria-hidden="true" />
      {interactive && hint && <span shuku-edit-id="e-56a6b933-55f3-41bf-9f62-624b70150007" className="cg-built-gomoku__hint-stone" style={{ left: `${(BOARD_PAD_RATIO + hint.col * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%`, top: `${(BOARD_PAD_RATIO + hint.row * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%` }} aria-hidden="true" />}
      <div shuku-edit-id="e-09a6a9d7-6b04-4446-a2c1-073f09133481" className="cg-built-gomoku__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-66cfb4bc-beff-4013-baf4-b1b07c845135" className="cg-built-gomoku__board-axis-cols">
          {COLUMN_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-67ab598a-9511-46a5-864b-a3bcb5ad2604" key={text} as="span" variant="body" style={{ left: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-937954a3-0fa6-4fc7-a339-fa4e5f3f0dda" className="cg-built-gomoku__board-axis-rows">
          {ROW_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-34191930-d5a8-4027-87a9-8be72c26db06" key={text} as="span" variant="body" style={{ top: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 对局面板按钮图标：跟随按钮文字颜色，尺寸相对按钮字号。 */
function RestartIcon() {
  return (
    <svg shuku-edit-id="e-d18af499-136e-4a2d-b726-0b001f181a42" className="cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-fd332c8f-2429-436c-b371-7b2b4f53e3ae" points="23 4 23 10 17 10" />
      <path shuku-edit-id="e-b10a2127-6f85-44c7-a235-ff67f34e3031" d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg shuku-edit-id="e-4b9646c3-0de0-476b-a6fd-998ea0bc3de0" className="cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-d315b66f-4c41-44ca-bbcc-24657a111616" points="9 14 4 9 9 4" />
      <path shuku-edit-id="e-3f170783-bb07-4872-991a-00c818c0b508" d="M4 9h11.5A4.5 4.5 0 0 1 20 13.5V20" />
    </svg>
  );
}

function ExampleIcon() {
  return (
    <svg shuku-edit-id="e-f90ab33d-8332-410e-9349-a00b208fd953" className="cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path shuku-edit-id="e-4e4c3026-2904-40c4-b661-91a053338648" d="M9 6h11M9 12h11M9 18h11" />
      <circle shuku-edit-id="e-05fea419-c75d-449a-b33c-e1a7cb724409" cx="4.4" cy="6" r="1.3" />
      <circle shuku-edit-id="e-ada81db1-9d89-461c-9ffd-cc18b778bc5c" cx="4.4" cy="12" r="1.3" />
      <circle shuku-edit-id="e-bda98cf0-40f9-47a7-b3d5-e071e4b521e6" cx="4.4" cy="18" r="1.3" />
    </svg>
  );
}

interface GameState {
  board: Board;
  history: Move[];
  lastMove: Move | null;
  turn: 'human' | 'computer' | 'over';
  winner: Stone;
  winLine: Cell[];
  draw: boolean;
}

function createGame(): GameState {
  return { board: createBoard(), history: [], lastMove: null, turn: 'human', winner: EMPTY, winLine: [], draw: false };
}

function applyMove(game: GameState, cell: Cell, player: Stone): GameState {
  if (game.turn === 'over') return game;
  if (game.board[cell.row]?.[cell.col] !== EMPTY) return game;
  const placed = placeStone(game.board, cell, player);
  const history: Move[] = [...game.history, { row: cell.row, col: cell.col, player }];
  const lastMove: Move = { row: cell.row, col: cell.col, player };
  if (placed.winLine.length >= 5) {
    return { board: placed.board, history, lastMove, turn: 'over', winner: player, winLine: placed.winLine, draw: false };
  }
  if (history.length >= BOARD_SIZE * BOARD_SIZE) {
    return { board: placed.board, history, lastMove, turn: 'over', winner: EMPTY, winLine: [], draw: true };
  }
  return {
    board: placed.board,
    history,
    lastMove,
    turn: player === HUMAN ? 'computer' : 'human',
    winner: EMPTY,
    winLine: [],
    draw: false,
  };
}

export interface AssemblyGomokuProps {
  onComplete: () => void;
  active?: boolean;
}

export function AssemblyGomoku({ onComplete, active = true }: AssemblyGomokuProps) {
  const [game, setGame] = useState<GameState>(createGame);
  const [difficulty, setDifficulty] = useState<GomokuDifficulty>('easy');
  const [hover, setHover] = useState<Cell | null>(null);
  const [cursor, setCursor] = useState<Cell>({ row: 7, col: 7 });
  const [focused, setFocused] = useState(false);
  const [hintCell, setHintCell] = useState<Cell | null>(null);
  const completedRef = useRef(false);

  const canPlay = game.turn === 'human';
  const advice = useMemo(() => difficulty === 'easy' && canPlay
    ? computeHumanAdvice(game.board, game.history) : null,
  [difficulty, canPlay, game.board, game.history]);

  useEffect(() => {
    setHintCell(null);
    if (!active || !advice) return undefined;
    const timer = window.setTimeout(() => setHintCell(advice.cell), 3000);
    return () => window.clearTimeout(timer);
  }, [active, advice]);

  useEffect(() => {
    if (game.turn !== 'computer') return undefined;
    const decision = computeComputerMove(game.board, game.history, difficulty);
    const timer = window.setTimeout(() => {
      setGame((current) => (current.turn === 'computer' ? applyMove(current, decision, COMPUTER) : current));
    }, 420);
    return () => window.clearTimeout(timer);
  }, [game.turn, game.board, game.history, difficulty]);

  // This standalone demonstration keeps the entire game local to Creator-Guide.
  useEffect(() => {
    if (game.winner === EMPTY || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [game.board, game.history.length, game.winLine, game.winner, onComplete]);

  const playHuman = useCallback((cell: Cell) => {
    setGame((current) => (current.turn === 'human' ? applyMove(current, cell, HUMAN) : current));
    setHover(null);
  }, []);

  const resetGame = useCallback(() => {
    completedRef.current = false;
    setGame(createGame());
    setHover(null);
    setCursor({ row: 7, col: 7 });
  }, []);

  const undoMove = useCallback(() => {
    setGame((current) => {
      if (current.turn === 'over' || !current.history.length) return current;
      const kept = current.history.slice(0, Math.max(0, current.history.length - 2));
      const board = createBoard();
      kept.forEach((move) => { board[move.row][move.col] = move.player; });
      return {
        board,
        history: kept,
        lastMove: kept.length ? kept[kept.length - 1] : null,
        turn: 'human',
        winner: EMPTY,
        winLine: [],
        draw: false,
      };
    });
    setHover(null);
  }, []);

  const playDemo = useCallback(() => {
    const demo = buildDemoPosition();
    setGame({
      board: demo.board,
      history: demo.history,
      lastMove: demo.lastMove,
      turn: 'over',
      winner: HUMAN,
      winLine: demo.winLine,
      draw: false,
    });
    setHover(null);
  }, []);

  const changeDifficulty = useCallback((nextDifficulty: GomokuDifficulty) => {
    setDifficulty(nextDifficulty);
    completedRef.current = false;
    setGame(createGame());
    setHover(null);
    setCursor({ row: 7, col: 7 });
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const steps: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    const step = steps[event.key];
    if (step) {
      event.stopPropagation();
      event.preventDefault();
      setCursor((current) => ({
        row: Math.max(0, Math.min(BOARD_SIZE - 1, current.row + step[0])),
        col: Math.max(0, Math.min(BOARD_SIZE - 1, current.col + step[1])),
      }));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
      event.preventDefault();
      if (canPlay) playHuman(cursor);
    }
  };

  const status = useMemo<{ text: string; stone: 'black' | 'white'; accent: boolean }>(() => {
    if (game.winner !== EMPTY) {
      return {
        text: game.winner === HUMAN ? '你获胜' : 'AI 获胜',
        stone: game.winner === HUMAN ? 'black' : 'white',
        accent: true,
      };
    }
    if (game.draw) return { text: '平局', stone: 'black', accent: true };
    return game.turn === 'human'
      ? { text: '轮到你', stone: 'black', accent: false }
      : { text: '轮到 AI', stone: 'white', accent: false };
  }, [game]);

  const situation = advice
    ? { tone: advice.mode === 'defense' ? 'orange' : 'green', label: advice.mode === 'defense' ? '防守' : '进攻' }
    : null;

  return (
    <ContentBlock shuku-edit-id="e-a5397056-b959-49cf-9787-f4663dcb0526" data-move-count={game.history.length} data-turn={game.turn} className="cg-built-gomoku" aria-label="十五路五子棋对局：你执黑，AI 执白">
      <video shuku-edit-id="e-d9664b7f-d40b-44f8-8e8d-2d9bc926b52f" className="cg-built-gomoku__background-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source shuku-edit-id="e-7d380cc0-0cf3-4fd4-acf1-55896514e672" src={bgVideo} type="video/mp4" />
      </video>
      <div shuku-edit-id="e-c511cd28-a041-4524-8b2b-922708c07940" className="cg-built-gomoku__layout">
        <aside shuku-edit-id="e-624e56b3-076b-4d61-807e-a893cf52b738" className="cg-built-gomoku__rail">
          <div shuku-edit-id="e-ec415bc0-f9a0-423f-9712-16b7d062c4c1" className="cg-built-gomoku__intro">
            <Typography shuku-edit-id="e-2092f2fb-b56a-4a13-8d21-baa323a045c6" as="h1" variant="h1" tone="accent">从五子棋开始<br shuku-edit-id="e-6ce56609-cce0-455c-b105-1973bd3d1767" />认识卷积核</Typography>
          </div>
          <div shuku-edit-id="e-004c95a5-7bea-4019-bbb7-4800da7c98a5" className="cg-built-gomoku__brief">
            <Typography shuku-edit-id="e-f6044c53-b508-4bfe-8aca-557396027a19" as="p" variant="subtitle" tone="main">先来下一局五子棋。</Typography>
            <Typography shuku-edit-id="e-c61265a6-d48d-4df1-93e3-cb07dadf6c4a" as="p" variant="subtitle" tone="main">你执黑，与 AI 对弈。</Typography>
          </div>
        </aside>

        <div shuku-edit-id="e-0c863b03-a5ab-4425-8520-b450cd11dda3" className="cg-built-gomoku__main">
          <div shuku-edit-id="e-1fff0e1d-bf99-478d-852a-1c31025eb6f6" className="cg-built-gomoku__status" aria-live="polite">
            <div shuku-edit-id="e-5ca12638-8e78-4e2a-be27-d4df83389148" className="cg-built-gomoku__panel-heading"><Typography shuku-edit-id="e-96dfd637-1323-43fd-99f3-7d8792b31a80" as="span" variant="bodySmall" tone="muted">对局面板</Typography><span shuku-edit-id="e-a0c1d659-39f7-4c8d-accc-9df47cbedf95" aria-hidden="true" className="cg-built-gomoku__panel-line" /></div>
            <div shuku-edit-id="e-098429e0-d589-4256-bfbc-faa25d4a0539" className="cg-built-gomoku__status-player"><span shuku-edit-id="e-4884366b-bd89-41ab-9fd9-9fa09d392f39" className={`cg-built-gomoku__turn cg-built-gomoku__turn--${status.stone}`} aria-hidden="true" /><Typography shuku-edit-id="e-ec37ba8e-749b-43a5-9c7a-26957735873f" as="strong" variant="body" tone={status.accent ? 'accent' : 'main'}>{status.text}</Typography></div>
            <div shuku-edit-id="e-59bfebb5-96df-4cbe-99f9-84e0c14a6d1c" className="cg-built-gomoku__status-situation">{situation ? <span shuku-edit-id="e-eba18107-56ca-4546-8a62-1b1401da2d71" className={`cg-built-gomoku__lamp cg-built-gomoku__lamp--${situation.tone}`} aria-hidden="true" /> : <span shuku-edit-id="e-4f70cbe4-6f62-454f-b056-b73aa7593dd0" className="cg-built-gomoku__lamp cg-built-gomoku__lamp--off" aria-hidden="true" />}<Typography shuku-edit-id="e-e17e9872-1474-480c-ab30-3ce686f2fab8" as="strong" variant="body" tone={situation ? 'accent' : 'muted'}>{situation?.label ?? (difficulty !== 'easy' ? '提示已关闭' : game.turn === 'computer' ? '等待 AI 落子' : game.turn === 'over' ? '对局结束' : '思考下一手')}</Typography></div>
            <div shuku-edit-id="e-190edf12-81c9-47ca-9c60-148df8b98277" className="cg-built-gomoku__controls">
              <div shuku-edit-id="e-5dc29163-cf5a-4933-8588-af07c63f2fea" className="cg-built-gomoku__difficulty">
                <div shuku-edit-id="e-833b8c38-b7e6-4724-ae39-d81abed95974" className="cg-built-gomoku__control-heading"><Typography shuku-edit-id="e-08d3153c-3834-4e59-8e26-7f6ece7e6658" as="strong" variant="body" tone="accent">对弈难度</Typography></div>
                <div shuku-edit-id="e-67c05156-6df2-4528-866b-6cd06b40968a" className="cg-built-gomoku__difficulty-options" role="group" aria-label="选择 AI 难度">
                  {([['easy', '简单'], ['medium', '中等'], ['hard', '困难']] as const).map(([value, label]) => <button shuku-edit-id="e-f157fe1c-4ae3-4737-98de-c6932da76240" key={value} type="button" className={difficulty === value ? 'is-active' : ''} aria-pressed={difficulty === value} onClick={() => changeDifficulty(value)}><Typography shuku-edit-id="e-8339822a-da5b-4f87-b352-b420a7baab05" as="span" variant="body" tone="inherit">{label}</Typography></button>)}
                </div>
                <Typography shuku-edit-id="e-8000ad1c-c1e3-442e-8d53-13f8adce6ab2" as="p" variant="bodySmall" tone="muted">{difficulty === 'easy' ? '轻松的体验' : difficulty === 'medium' ? '势均力敌' : '棋逢强敌'}</Typography>
              </div>
              <div shuku-edit-id="e-33e598c5-177b-4a84-88d3-de4720a8af17" className="cg-built-gomoku__actions">
                <Typography shuku-edit-id="e-aaeff23f-c195-4a54-b1be-0d9e4656e650" as="strong" variant="body" tone="accent">棋局操作</Typography>
                <Button variant="primary" onClick={undoMove} disabled={difficulty === 'hard' || game.turn === 'over' || game.history.length === 0}><UndoIcon />悔一步</Button>
                <Button onClick={resetGame}><RestartIcon />重新开始</Button>
                <Button onClick={playDemo}><ExampleIcon />示例棋局</Button>
              </div>
            </div>
          </div>
          <div shuku-edit-id="e-2a812357-3300-42da-8412-afb57b1635b7" className="cg-built-gomoku__board-stage">
            <PlayBoard
              board={game.board}
              lastMove={game.lastMove}
              winLine={game.winLine}
              hover={hover}
              cursor={cursor}
              hint={hintCell}
              interactive={canPlay}
              label={`十五路五子棋棋盘，${status.text}。${hintCell && advice ? `建议${advice.mode === 'defense' ? '防守' : '进攻'}落点 ${COLUMN_LABELS[hintCell.col]}${hintCell.row + 1}。` : ''}方向键移动落点，回车落子。`}
              onHoverCell={setHover}
              onPickCell={playHuman}
              onKeyDown={handleKeyDown}
              onFocusChange={setFocused}
            />
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}
