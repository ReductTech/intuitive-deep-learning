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
import { useGomokuOutcome } from '../../LessonContext';
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
} from '../../gomokuEngine';
import './GomokuPlayPage.css';

const bgVideo = moduleAssetUrl('workflow/convolution-course/bg_video.mp4');

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
    <div shuku-edit-id="e-5e2d825f-8aa9-471a-8f12-98becf912ebb"
      className={interactive ? 'cg-copy-ck-gomoku-play__board is-interactive' : 'cg-copy-ck-gomoku-play__board'}
      ref={frameRef}
    >
      <canvas shuku-edit-id="e-500fa298-9b4d-4a4c-8db9-a6e68cbfa98e"
        ref={canvasRef}
        className="cg-copy-ck-gomoku-play__board-canvas"
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
      <span shuku-edit-id="e-5ed22fcc-b6ac-4bbe-9e20-52463eaca739" ref={previewRef} className="cg-copy-ck-gomoku-play__hover-stone" aria-hidden="true" />
      {interactive && hint && <span shuku-edit-id="e-8a789c99-fe3c-488e-a49f-a1645ebfa753" className="cg-copy-ck-gomoku-play__hint-stone" style={{ left: `${(BOARD_PAD_RATIO + hint.col * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%`, top: `${(BOARD_PAD_RATIO + hint.row * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%` }} aria-hidden="true" />}
      <div shuku-edit-id="e-411fcfba-7e1f-4b47-a3f3-ac6387a190a0" className="cg-copy-ck-gomoku-play__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-c0964a8d-4da5-4a21-85bd-896c07fb2f5c" className="cg-copy-ck-gomoku-play__board-axis-cols">
          {COLUMN_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-ea1d0072-7836-4045-887b-94a211b2b82b" key={text} as="span" variant="body" style={{ left: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-e544ea55-eaf7-4db3-a2c7-f6cf0753ed68" className="cg-copy-ck-gomoku-play__board-axis-rows">
          {ROW_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-469d536a-4bb6-4108-9b6b-5e90224446c7" key={text} as="span" variant="body" style={{ top: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
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
    <svg shuku-edit-id="e-7d8a3edb-0a61-400c-97f4-20dfdf79152d" className="cg-copy-ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-fe5ee634-b869-4068-a5b0-5e64e5e0e696" points="23 4 23 10 17 10" />
      <path shuku-edit-id="e-3a33f03c-d3a6-4a0e-aea0-590b07264660" d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg shuku-edit-id="e-1344260e-0dae-431b-b7f6-7194782862c2" className="cg-copy-ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-bcb8fe59-e6e1-4576-9a69-f6b6bdaee339" points="9 14 4 9 9 4" />
      <path shuku-edit-id="e-3c9f155c-431b-47ba-b3b5-f9c3df07e53b" d="M4 9h11.5A4.5 4.5 0 0 1 20 13.5V20" />
    </svg>
  );
}

function ExampleIcon() {
  return (
    <svg shuku-edit-id="e-74ce2bae-150f-48dd-9dc0-690d38ef38e8" className="cg-copy-ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path shuku-edit-id="e-b6b3b737-5b9f-48bd-871f-9e84caa08bd3" d="M9 6h11M9 12h11M9 18h11" />
      <circle shuku-edit-id="e-4edd8a6a-1449-406e-a635-cc3a7d7aab7e" cx="4.4" cy="6" r="1.3" />
      <circle shuku-edit-id="e-4e4acff0-9951-4c81-8226-1c49cad69fd7" cx="4.4" cy="12" r="1.3" />
      <circle shuku-edit-id="e-cec612c8-c035-456f-862c-9e605c6727d7" cx="4.4" cy="18" r="1.3" />
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

export interface GomokuPlayPageProps {
  onComplete: () => void;
}

export function GomokuPlayPage({ onComplete }: GomokuPlayPageProps) {
  const [game, setGame] = useState<GameState>(createGame);
  const [difficulty, setDifficulty] = useState<GomokuDifficulty>('easy');
  const [hover, setHover] = useState<Cell | null>(null);
  const [cursor, setCursor] = useState<Cell>({ row: 7, col: 7 });
  const [focused, setFocused] = useState(false);
  const [hintCell, setHintCell] = useState<Cell | null>(null);
  const completedRef = useRef(false);
  const demoRef = useRef(false);
  const { recordOutcome } = useGomokuOutcome();

  const canPlay = game.turn === 'human';
  const advice = useMemo(() => difficulty === 'easy' && canPlay
    ? computeHumanAdvice(game.board, game.history) : null,
  [difficulty, canPlay, game.board, game.history]);

  useEffect(() => {
    setHintCell(null);
    if (!advice) return undefined;
    const timer = window.setTimeout(() => setHintCell(advice.cell), 3000);
    return () => window.clearTimeout(timer);
  }, [advice]);

  useEffect(() => {
    if (game.turn !== 'computer') return undefined;
    const decision = computeComputerMove(game.board, game.history, difficulty);
    const timer = window.setTimeout(() => {
      setGame((current) => (current.turn === 'computer' ? applyMove(current, decision, COMPUTER) : current));
    }, 420);
    return () => window.clearTimeout(timer);
  }, [game.turn, game.board, game.history, difficulty]);

  // 分出胜负后把终局交给 LessonContext，后面的页面继续用同一盘棋。
  useEffect(() => {
    if (game.winner === EMPTY || completedRef.current) return;
    completedRef.current = true;
    recordOutcome({
      board: game.board,
      winLine: game.winLine,
      winner: game.winner,
      moveCount: game.history.length,
      source: demoRef.current ? 'demo' : 'played',
    });
    onComplete();
  }, [game.board, game.history.length, game.winLine, game.winner, onComplete, recordOutcome]);

  const playHuman = useCallback((cell: Cell) => {
    demoRef.current = false;
    setGame((current) => (current.turn === 'human' ? applyMove(current, cell, HUMAN) : current));
    setHover(null);
  }, []);

  const resetGame = useCallback(() => {
    completedRef.current = false;
    demoRef.current = false;
    recordOutcome(null);
    setGame(createGame());
    setHover(null);
    setCursor({ row: 7, col: 7 });
  }, [recordOutcome]);

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
    demoRef.current = true;
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
    demoRef.current = false;
    recordOutcome(null);
    setGame(createGame());
    setHover(null);
    setCursor({ row: 7, col: 7 });
  }, [recordOutcome]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const steps: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    const step = steps[event.key];
    if (step) {
      event.preventDefault();
      setCursor((current) => ({
        row: Math.max(0, Math.min(BOARD_SIZE - 1, current.row + step[0])),
        col: Math.max(0, Math.min(BOARD_SIZE - 1, current.col + step[1])),
      }));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
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
    <ContentBlock shuku-edit-id="e-0f2e4c94-1945-434d-b184-9f08f7dd1a42" className="cg-copy-ck-gomoku-play" aria-label="十五路五子棋对局：你执黑，AI 执白">
      <video shuku-edit-id="e-29340ac3-c17b-4955-829c-e932df40dfce" className="cg-copy-ck-gomoku-play__background-video" autoPlay muted loop playsInline aria-hidden="true">
        <source shuku-edit-id="e-819a9e7a-ff44-4aa1-81e8-e24ddf66cca3" src={bgVideo} type="video/mp4" />
      </video>
      <div shuku-edit-id="e-2c0e2e9c-86b0-43d6-b8e5-e1aff0617b8f" className="cg-copy-ck-gomoku-play__layout">
        <aside shuku-edit-id="e-e80e9085-cbcd-4c68-952c-2b2e149ce4f7" className="cg-copy-ck-gomoku-play__rail">
          <div shuku-edit-id="e-219b27dd-cb37-435a-adba-6eb640c92549" className="cg-copy-ck-gomoku-play__intro">
            <Typography shuku-edit-id="e-7f847576-787d-4c97-b015-9d17c9531498" as="h1" variant="h1" tone="accent">从五子棋开始<br shuku-edit-id="e-14709ee8-8121-4348-9ccf-f26c0225ece8" />认识卷积核</Typography>
          </div>
          <div shuku-edit-id="e-e78fd1b9-ea4b-45d7-bc6b-1d9026e478ac" className="cg-copy-ck-gomoku-play__brief">
            <Typography shuku-edit-id="e-1190d58d-9e28-474e-a02b-2a149e1604fb" as="p" variant="subtitle" tone="main">先来下一局五子棋。</Typography>
            <Typography shuku-edit-id="e-95b5c5da-258a-43f5-acdc-ede31af0d920" as="p" variant="subtitle" tone="main">你执黑，与 AI 对弈。</Typography>
          </div>
        </aside>

        <div shuku-edit-id="e-e959200b-deb7-41c5-b581-ae97cfbdb7f4" className="cg-copy-ck-gomoku-play__main">
          <div shuku-edit-id="e-162089e8-392a-4f17-b255-0e8eac0aa716" className="cg-copy-ck-gomoku-play__status" aria-live="polite">
            <div shuku-edit-id="e-564313a0-1fd5-468c-a3fb-87c471445481" className="cg-copy-ck-gomoku-play__panel-heading"><Typography shuku-edit-id="e-8dfedd74-86de-4a79-b115-a0f307251db8" as="span" variant="bodySmall" tone="muted">对局面板</Typography><span shuku-edit-id="e-00e2faf2-5738-438b-a5df-9f18bb287b9a" aria-hidden="true" className="cg-copy-ck-gomoku-play__panel-line" /></div>
            <div shuku-edit-id="e-f9e077c3-f6b9-438a-a334-63826a4d1817" className="cg-copy-ck-gomoku-play__status-player"><span shuku-edit-id="e-f9f2ebc1-eb31-40f1-84f4-c9235c6d8a2a" className={`cg-copy-ck-gomoku-play__turn cg-copy-ck-gomoku-play__turn--${status.stone}`} aria-hidden="true" /><Typography shuku-edit-id="e-1e53b321-9e59-46dc-88e3-d7ac23fc803b" as="strong" variant="body" tone={status.accent ? 'accent' : 'main'}>{status.text}</Typography></div>
            <div shuku-edit-id="e-2b43adda-ee8e-4637-aa35-5887686beb36" className="cg-copy-ck-gomoku-play__status-situation">{situation ? <span shuku-edit-id="e-835c4d13-95e4-4c80-9f40-98d80adde611" className={`cg-copy-ck-gomoku-play__lamp cg-copy-ck-gomoku-play__lamp--${situation.tone}`} aria-hidden="true" /> : <span shuku-edit-id="e-165ca776-4598-40a9-a46f-13bd86090ebc" className="cg-copy-ck-gomoku-play__lamp cg-copy-ck-gomoku-play__lamp--off" aria-hidden="true" />}<Typography shuku-edit-id="e-178deaf4-1076-435f-89a4-d94f1d643a42" as="strong" variant="body" tone={situation ? 'accent' : 'muted'}>{situation?.label ?? (difficulty !== 'easy' ? '提示已关闭' : game.turn === 'computer' ? '等待 AI 落子' : game.turn === 'over' ? '对局结束' : '思考下一手')}</Typography></div>
            <div shuku-edit-id="e-58cd9f9d-d982-4768-b308-21bb02462b8f" className="cg-copy-ck-gomoku-play__controls">
              <div shuku-edit-id="e-99c1aba0-84ea-4a23-8bdb-fbe8c9ad9a35" className="cg-copy-ck-gomoku-play__difficulty">
                <div shuku-edit-id="e-6d97805c-8560-4720-bd27-73a83397cd55" className="cg-copy-ck-gomoku-play__control-heading"><Typography shuku-edit-id="e-3e2ea689-e5b3-4c07-9c37-9b0547329283" as="strong" variant="body" tone="accent">对弈难度</Typography></div>
                <div shuku-edit-id="e-fb03e05f-2135-443a-b34f-6d8faa84bb8d" className="cg-copy-ck-gomoku-play__difficulty-options" role="group" aria-label="选择 AI 难度">
                  {([['easy', '简单'], ['medium', '中等'], ['hard', '困难']] as const).map(([value, label]) => <button shuku-edit-id="e-36649f58-427e-4f0d-9ed8-1cdc1eb403bb" key={value} type="button" className={difficulty === value ? 'is-active' : ''} aria-pressed={difficulty === value} onClick={() => changeDifficulty(value)}><Typography shuku-edit-id="e-bd3d54e1-2d6a-41e4-b31c-505013c88427" as="span" variant="body" tone="inherit">{label}</Typography></button>)}
                </div>
                <Typography shuku-edit-id="e-730c1662-4cc3-4c9d-9e64-107cd49745d0" as="p" variant="bodySmall" tone="muted">{difficulty === 'easy' ? '轻松的体验' : difficulty === 'medium' ? '势均力敌' : '棋逢强敌'}</Typography>
              </div>
              <div shuku-edit-id="e-ce0abc89-c792-4862-b648-25dc77f118ad" className="cg-copy-ck-gomoku-play__actions">
                <Typography shuku-edit-id="e-f6c2bbd6-8f52-4ca0-a223-5272b8726b43" as="strong" variant="body" tone="accent">棋局操作</Typography>
                <Button variant="primary" onClick={undoMove} disabled={difficulty === 'hard' || game.turn === 'over' || game.history.length === 0}><UndoIcon />悔一步</Button>
                <Button onClick={resetGame}><RestartIcon />重新开始</Button>
                <Button onClick={playDemo}><ExampleIcon />示例棋局</Button>
              </div>
            </div>
          </div>
          <div shuku-edit-id="e-7064dfcb-ad86-4999-84c7-d39f160a6e77" className="cg-copy-ck-gomoku-play__board-stage">
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
