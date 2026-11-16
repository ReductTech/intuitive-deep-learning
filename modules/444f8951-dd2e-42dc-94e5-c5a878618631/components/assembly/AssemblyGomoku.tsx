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
    <div shuku-edit-id="e-69773fd5-cb06-4c6a-a766-0b14d23eba33"
      className={interactive ? 'cg-built-gomoku__board is-interactive' : 'cg-built-gomoku__board'}
      ref={frameRef}
    >
      <canvas shuku-edit-id="e-bfdfff6f-702f-4c09-a9aa-88d1f14000aa"
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
      <span shuku-edit-id="e-275669c5-6dc5-4210-9cd8-ef73d39e07ed" ref={previewRef} className="cg-built-gomoku__hover-stone" aria-hidden="true" />
      {interactive && hint && <span shuku-edit-id="e-3473ee31-0255-45ed-8b6f-98f127f2c7d5" className="cg-built-gomoku__hint-stone" style={{ left: `${(BOARD_PAD_RATIO + hint.col * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%`, top: `${(BOARD_PAD_RATIO + hint.row * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%` }} aria-hidden="true" />}
      <div shuku-edit-id="e-2739808f-b9eb-4399-ba56-e394533c2683" className="cg-built-gomoku__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-5f81f791-9a3a-4104-8b8f-688fb8117a08" className="cg-built-gomoku__board-axis-cols">
          {COLUMN_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-f5323271-df1f-405b-ac79-dc7c7a1fd27b" key={text} as="span" variant="body" style={{ left: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-7ad024b9-495d-4f22-babb-b8f58bdb8145" className="cg-built-gomoku__board-axis-rows">
          {ROW_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-82b9c183-ef5f-4a53-be5f-3367711dbbce" key={text} as="span" variant="body" style={{ top: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
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
    <svg shuku-edit-id="e-503a0a0f-4975-4ce3-91b2-42df4e358619" className="cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-28867c2c-f454-47fb-80fc-a0aad2c60f34" points="23 4 23 10 17 10" />
      <path shuku-edit-id="e-8948ce8a-9a06-47cc-87d7-051f93a8444b" d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg shuku-edit-id="e-49761942-5804-4d9a-918b-5a74ad6df395" className="cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-709c11a8-17a8-4279-9456-8b156d00d814" points="9 14 4 9 9 4" />
      <path shuku-edit-id="e-e24d15df-d515-4f62-bde2-b07c0e0c4c13" d="M4 9h11.5A4.5 4.5 0 0 1 20 13.5V20" />
    </svg>
  );
}

function ExampleIcon() {
  return (
    <svg shuku-edit-id="e-2a22396a-f20e-4868-830a-c25c77f58cb2" className="cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path shuku-edit-id="e-a600bb48-181f-4252-b449-7677410140c6" d="M9 6h11M9 12h11M9 18h11" />
      <circle shuku-edit-id="e-7c25f806-a04e-4f7c-97b3-a7b0f0163063" cx="4.4" cy="6" r="1.3" />
      <circle shuku-edit-id="e-cc35ffb1-189a-406d-997c-6df19e32d4b7" cx="4.4" cy="12" r="1.3" />
      <circle shuku-edit-id="e-cac4df26-afa4-4b6a-86d9-415e5c3aa52e" cx="4.4" cy="18" r="1.3" />
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
    <ContentBlock shuku-edit-id="e-4dd38fe8-3ef3-4207-bfb9-676f00096980" data-move-count={game.history.length} data-turn={game.turn} className="cg-built-gomoku" aria-label="十五路五子棋对局：你执黑，AI 执白">
      <video shuku-edit-id="e-d154eac5-13c4-49df-8791-43548978c1a4" className="cg-built-gomoku__background-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source shuku-edit-id="e-407479b2-f488-4739-9171-54a433d2bfe7" src={bgVideo} type="video/mp4" />
      </video>
      <div shuku-edit-id="e-6a62aed3-287f-4096-a86b-b51d7e32a326" className="cg-built-gomoku__layout">
        <aside shuku-edit-id="e-2bec602e-b041-45ae-b378-825cc2f698db" className="cg-built-gomoku__rail">
          <div shuku-edit-id="e-40532598-d3ec-466f-960a-d09d0c14083f" className="cg-built-gomoku__intro">
            <Typography shuku-edit-id="e-0d611af9-4e97-4670-806c-29f38ad249b6" as="h1" variant="h1" tone="accent">从五子棋开始<br shuku-edit-id="e-e031944d-2302-4813-8447-356c77d449f4" />认识卷积核</Typography>
          </div>
          <div shuku-edit-id="e-69c985aa-8fec-47be-8184-40dad97f57b7" className="cg-built-gomoku__brief">
            <Typography shuku-edit-id="e-8a8d0db6-9b0e-4124-94a4-515a1c62e095" as="p" variant="subtitle" tone="main">先来下一局五子棋。</Typography>
            <Typography shuku-edit-id="e-f984e2a6-6afe-4c28-9c84-a94b6b0d5088" as="p" variant="subtitle" tone="main">你执黑，与 AI 对弈。</Typography>
          </div>
        </aside>

        <div shuku-edit-id="e-f6be10af-481e-4640-aaef-29ccf578fc88" className="cg-built-gomoku__main">
          <div shuku-edit-id="e-6c61b5b9-6359-4c51-a34a-d2669e0581cc" className="cg-built-gomoku__status" aria-live="polite">
            <div shuku-edit-id="e-ec4c2aef-422b-49e8-b224-5305a887f678" className="cg-built-gomoku__panel-heading"><Typography shuku-edit-id="e-db608015-dcc0-4f15-bd36-f9a3b6cefb3c" as="span" variant="bodySmall" tone="muted">对局面板</Typography><span shuku-edit-id="e-5a9885fd-ca52-441b-bf8b-5d4e9df79609" aria-hidden="true" className="cg-built-gomoku__panel-line" /></div>
            <div shuku-edit-id="e-208dee5d-6217-4180-9a7a-216614e90237" className="cg-built-gomoku__status-player"><span shuku-edit-id="e-2c776821-9264-4c59-84c4-33a8332b4d29" className={`cg-built-gomoku__turn cg-built-gomoku__turn--${status.stone}`} aria-hidden="true" /><Typography shuku-edit-id="e-fae3e4d3-4b67-4853-ae26-3da6b152ba0c" as="strong" variant="body" tone={status.accent ? 'accent' : 'main'}>{status.text}</Typography></div>
            <div shuku-edit-id="e-c1e0473c-3026-44b3-901a-71bd2f9e800d" className="cg-built-gomoku__status-situation">{situation ? <span shuku-edit-id="e-aafbd993-f98f-4970-895d-d6b773c33a04" className={`cg-built-gomoku__lamp cg-built-gomoku__lamp--${situation.tone}`} aria-hidden="true" /> : <span shuku-edit-id="e-8073b8ad-898c-4181-a421-8edf56a36cbe" className="cg-built-gomoku__lamp cg-built-gomoku__lamp--off" aria-hidden="true" />}<Typography shuku-edit-id="e-8906c420-939a-4180-8a07-cd0f9df58fb1" as="strong" variant="body" tone={situation ? 'accent' : 'muted'}>{situation?.label ?? (difficulty !== 'easy' ? '提示已关闭' : game.turn === 'computer' ? '等待 AI 落子' : game.turn === 'over' ? '对局结束' : '思考下一手')}</Typography></div>
            <div shuku-edit-id="e-18a116ed-92a9-4ef5-9e0e-66c441879790" className="cg-built-gomoku__controls">
              <div shuku-edit-id="e-3cfd88e6-947c-4fdc-8c12-3b1c395367c4" className="cg-built-gomoku__difficulty">
                <div shuku-edit-id="e-8eb9f719-7fd7-47dc-a493-d3545643cfee" className="cg-built-gomoku__control-heading"><Typography shuku-edit-id="e-fe03069d-6d02-4f76-b637-fefcb464186d" as="strong" variant="body" tone="accent">对弈难度</Typography></div>
                <div shuku-edit-id="e-3fafe30d-89d9-4bc3-855d-3d133d97645f" className="cg-built-gomoku__difficulty-options" role="group" aria-label="选择 AI 难度">
                  {([['easy', '简单'], ['medium', '中等'], ['hard', '困难']] as const).map(([value, label]) => <button shuku-edit-id="e-06d561bb-9097-4f46-a4ff-8ae474fbef07" key={value} type="button" className={difficulty === value ? 'is-active' : ''} aria-pressed={difficulty === value} onClick={() => changeDifficulty(value)}><Typography shuku-edit-id="e-1d063295-24b1-4a3b-98de-d6316eeb8a88" as="span" variant="body" tone="inherit">{label}</Typography></button>)}
                </div>
                <Typography shuku-edit-id="e-9a9d1198-fc78-48bf-a82d-7908766e7d34" as="p" variant="bodySmall" tone="muted">{difficulty === 'easy' ? '轻松的体验' : difficulty === 'medium' ? '势均力敌' : '棋逢强敌'}</Typography>
              </div>
              <div shuku-edit-id="e-b6fc6ff5-d7f7-41a3-8b5c-aa186c15422c" className="cg-built-gomoku__actions">
                <Typography shuku-edit-id="e-9e3c8940-86e5-4537-8eff-e658659b5f18" as="strong" variant="body" tone="accent">棋局操作</Typography>
                <Button variant="primary" onClick={undoMove} disabled={difficulty === 'hard' || game.turn === 'over' || game.history.length === 0}><UndoIcon />悔一步</Button>
                <Button onClick={resetGame}><RestartIcon />重新开始</Button>
                <Button onClick={playDemo}><ExampleIcon />示例棋局</Button>
              </div>
            </div>
          </div>
          <div shuku-edit-id="e-bc895fa6-9e54-46f1-a931-946588844458" className="cg-built-gomoku__board-stage">
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
