import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../creatorGuideAssets';
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

const bgVideo = creatorGuideAssetUrl(outline.moduleIdentity.id, 'assembly/gomoku-bg.mp4');

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
    <div shuku-edit-id="e-9c96925a-c506-48f8-ad4f-674c51968f08"
      className={interactive ? 'aipe-replay-cg-built-gomoku__board is-interactive' : 'aipe-replay-cg-built-gomoku__board'}
      ref={frameRef}
    >
      <canvas shuku-edit-id="e-ffb58531-48cc-41c4-a30e-9a95ef3e94af"
        ref={canvasRef}
        className="aipe-replay-cg-built-gomoku__board-canvas"
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
      <span shuku-edit-id="e-8bc3c7eb-b35d-463e-a17a-d11cb8bfe7aa" ref={previewRef} className="aipe-replay-cg-built-gomoku__hover-stone" aria-hidden="true" />
      {interactive && hint && <span shuku-edit-id="e-860e6494-ad81-4113-b4cb-3b17acfdfe7a" className="aipe-replay-cg-built-gomoku__hint-stone" style={{ left: `${(BOARD_PAD_RATIO + hint.col * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%`, top: `${(BOARD_PAD_RATIO + hint.row * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%` }} aria-hidden="true" />}
      <div shuku-edit-id="e-fef64a1b-e3d9-42db-bff8-a453371a3d6e" className="aipe-replay-cg-built-gomoku__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-e0d756f8-4367-471d-b12b-b77f0d0ef31b" className="aipe-replay-cg-built-gomoku__board-axis-cols">
          {COLUMN_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-14cac44d-d3bc-4975-afc0-ed647fc20b06" key={text} as="span" variant="body" style={{ left: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-b47e5704-ec06-4d27-90e9-e9a163e3b43f" className="aipe-replay-cg-built-gomoku__board-axis-rows">
          {ROW_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-b794f8a9-c523-4cd3-ad25-826ec9486679" key={text} as="span" variant="body" style={{ top: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
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
    <svg shuku-edit-id="e-ab817679-577f-4749-b542-ac6990f4e17b" className="aipe-replay-cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-bbff9fe8-4c7c-48f2-ac2c-cabb21000185" points="23 4 23 10 17 10" />
      <path shuku-edit-id="e-b9e0af57-b255-44ab-a448-fa4c72efafde" d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg shuku-edit-id="e-aeaf74c8-d35d-49ac-ad6a-381f42a65d6f" className="aipe-replay-cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-e2f85671-b30c-457e-9ef3-e796b56a6416" points="9 14 4 9 9 4" />
      <path shuku-edit-id="e-2941cc5b-8f01-4cdb-9e16-e38f704fde2c" d="M4 9h11.5A4.5 4.5 0 0 1 20 13.5V20" />
    </svg>
  );
}

function ExampleIcon() {
  return (
    <svg shuku-edit-id="e-949c44bb-b869-4e45-8cdb-86cbfa2deab0" className="aipe-replay-cg-built-gomoku__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path shuku-edit-id="e-e294419a-641b-404e-b174-783ad09e073e" d="M9 6h11M9 12h11M9 18h11" />
      <circle shuku-edit-id="e-848779ac-f0fa-4ddb-b52d-4a807dba6d0e" cx="4.4" cy="6" r="1.3" />
      <circle shuku-edit-id="e-c32e8125-9a13-4d3b-88dd-cc70dca7c62e" cx="4.4" cy="12" r="1.3" />
      <circle shuku-edit-id="e-08705999-2d88-44d6-9de9-21915c3d05da" cx="4.4" cy="18" r="1.3" />
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
    <ContentBlock shuku-edit-id="e-96371bd5-88c4-4309-a016-96476fead88b" data-move-count={game.history.length} data-turn={game.turn} className="aipe-replay-cg-built-gomoku" aria-label="十五路五子棋对局：你执黑，AI 执白">
      <video shuku-edit-id="e-b3703f19-fc89-4b3f-bf6c-cab06b644df6" className="aipe-replay-cg-built-gomoku__background-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source shuku-edit-id="e-bb128a68-2dd3-46a5-aba9-89e367a6b924" src={bgVideo} type="video/mp4" />
      </video>
      <div shuku-edit-id="e-17a37f72-2143-422c-9790-b62519f8e914" className="aipe-replay-cg-built-gomoku__layout">
        <aside shuku-edit-id="e-03778b2b-b7d5-43f4-8f0d-a66cc26fd6d3" className="aipe-replay-cg-built-gomoku__rail">
          <div shuku-edit-id="e-c4224b07-c512-403c-b1b5-e8dab2026c7b" className="aipe-replay-cg-built-gomoku__intro">
            <Typography shuku-edit-id="e-54c699b1-44a1-4013-beb0-6c795ac42e30" as="h1" variant="h1" tone="accent">从五子棋开始<br shuku-edit-id="e-125098b3-1162-45a4-a9fe-1bce9ea55a07" />认识卷积核</Typography>
          </div>
          <div shuku-edit-id="e-cf6d9a6d-1e26-4405-8ab3-46dee339f149" className="aipe-replay-cg-built-gomoku__brief">
            <Typography shuku-edit-id="e-a0d36441-78e7-48b4-9a73-8bbe56497ce4" as="p" variant="subtitle" tone="main">先来下一局五子棋。</Typography>
            <Typography shuku-edit-id="e-2c0a6428-e9b7-4d6a-bec4-91160328ee9c" as="p" variant="subtitle" tone="main">你执黑，与 AI 对弈。</Typography>
          </div>
        </aside>

        <div shuku-edit-id="e-8adf121a-9371-4eec-baf7-2719e69724d6" className="aipe-replay-cg-built-gomoku__main">
          <div shuku-edit-id="e-e104ea5e-f503-434d-aeca-a7693880554e" className="aipe-replay-cg-built-gomoku__status" aria-live="polite">
            <div shuku-edit-id="e-f2308324-7a1d-4b03-9b94-e2cf0e39ae8b" className="aipe-replay-cg-built-gomoku__panel-heading"><Typography shuku-edit-id="e-61ed2e48-0ebd-45a2-8e5d-8766e5216e7d" as="span" variant="bodySmall" tone="muted">对局面板</Typography><span shuku-edit-id="e-d703fb60-dcdc-4a1b-90a5-2890c74946e5" aria-hidden="true" className="aipe-replay-cg-built-gomoku__panel-line" /></div>
            <div shuku-edit-id="e-2789b3df-9320-4411-974a-95d727625d7a" className="aipe-replay-cg-built-gomoku__status-player"><span shuku-edit-id="e-9c939188-e91f-4892-a11d-c18d746f77c5" className={`aipe-replay-cg-built-gomoku__turn aipe-replay-cg-built-gomoku__turn--${status.stone}`} aria-hidden="true" /><Typography shuku-edit-id="e-09548079-c751-497e-a64b-a623b3ec934f" as="strong" variant="body" tone={status.accent ? 'accent' : 'main'}>{status.text}</Typography></div>
            <div shuku-edit-id="e-c536a946-848a-41a3-a43a-646ebed7cc73" className="aipe-replay-cg-built-gomoku__status-situation">{situation ? <span shuku-edit-id="e-3894988a-04a6-44ab-89b7-9d15a8aadcf0" className={`aipe-replay-cg-built-gomoku__lamp aipe-replay-cg-built-gomoku__lamp--${situation.tone}`} aria-hidden="true" /> : <span shuku-edit-id="e-7d97f394-ed64-4731-bed3-b0aa6dd5fe0c" className="aipe-replay-cg-built-gomoku__lamp aipe-replay-cg-built-gomoku__lamp--off" aria-hidden="true" />}<Typography shuku-edit-id="e-035551db-c39c-45f2-97bc-bc15b2050b97" as="strong" variant="body" tone={situation ? 'accent' : 'muted'}>{situation?.label ?? (difficulty !== 'easy' ? '提示已关闭' : game.turn === 'computer' ? '等待 AI 落子' : game.turn === 'over' ? '对局结束' : '思考下一手')}</Typography></div>
            <div shuku-edit-id="e-c9b5c639-de2a-4807-a198-5750994e4e6d" className="aipe-replay-cg-built-gomoku__controls">
              <div shuku-edit-id="e-18c7a9b6-94e5-4256-b8df-b44b9e0ca50a" className="aipe-replay-cg-built-gomoku__difficulty">
                <div shuku-edit-id="e-d392d0dc-8b33-402c-9ca5-c9c61492837b" className="aipe-replay-cg-built-gomoku__control-heading"><Typography shuku-edit-id="e-b8578a1b-e4ca-4f65-8fb7-f3bff3d69b4a" as="strong" variant="body" tone="accent">对弈难度</Typography></div>
                <div shuku-edit-id="e-68a0e881-79c7-40f3-a822-84f46787a1a5" className="aipe-replay-cg-built-gomoku__difficulty-options" role="group" aria-label="选择 AI 难度">
                  {([['easy', '简单'], ['medium', '中等'], ['hard', '困难']] as const).map(([value, label]) => <button shuku-edit-id="e-dc783c6b-102d-4414-b7ea-514c307204a2" key={value} type="button" className={difficulty === value ? 'is-active' : ''} aria-pressed={difficulty === value} onClick={() => changeDifficulty(value)}><Typography shuku-edit-id="e-19510c21-2e7c-4196-8b44-f954a98f6932" as="span" variant="body" tone="inherit">{label}</Typography></button>)}
                </div>
                <Typography shuku-edit-id="e-eeeeaca9-695f-492b-b832-591b4ace9142" as="p" variant="bodySmall" tone="muted">{difficulty === 'easy' ? '轻松的体验' : difficulty === 'medium' ? '势均力敌' : '棋逢强敌'}</Typography>
              </div>
              <div shuku-edit-id="e-b28db6cd-e990-4547-9d38-2390b3ec2941" className="aipe-replay-cg-built-gomoku__actions">
                <Typography shuku-edit-id="e-fae38aaf-425d-4f75-a1fc-2cf8eced8d04" as="strong" variant="body" tone="accent">棋局操作</Typography>
                <Button variant="primary" onClick={undoMove} disabled={difficulty === 'hard' || game.turn === 'over' || game.history.length === 0}><UndoIcon />悔一步</Button>
                <Button onClick={resetGame}><RestartIcon />重新开始</Button>
                <Button onClick={playDemo}><ExampleIcon />示例棋局</Button>
              </div>
            </div>
          </div>
          <div shuku-edit-id="e-780f1e72-4923-47c2-bdd1-b51b7023e2b0" className="aipe-replay-cg-built-gomoku__board-stage">
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
