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
    <div shuku-edit-id="e-fcbc377a-5380-4229-aba2-073ba471a015"
      className={interactive ? 'cg-copy-ck-gomoku-play__board is-interactive' : 'cg-copy-ck-gomoku-play__board'}
      ref={frameRef}
    >
      <canvas shuku-edit-id="e-029eb4a7-8cb7-403c-9b06-9d201c22d9a1"
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
      <span shuku-edit-id="e-411ccc48-6ff3-4ada-a9a7-62977b1ac306" ref={previewRef} className="cg-copy-ck-gomoku-play__hover-stone" aria-hidden="true" />
      {interactive && hint && <span shuku-edit-id="e-576b72fa-5ac8-4bb2-9cac-91e85632e141" className="cg-copy-ck-gomoku-play__hint-stone" style={{ left: `${(BOARD_PAD_RATIO + hint.col * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%`, top: `${(BOARD_PAD_RATIO + hint.row * (1 - 2 * BOARD_PAD_RATIO) / (BOARD_SIZE - 1)) * 100}%` }} aria-hidden="true" />}
      <div shuku-edit-id="e-292c2399-007d-4ae2-a7ef-39b9802baa2e" className="cg-copy-ck-gomoku-play__board-axis" aria-hidden="true">
        <div shuku-edit-id="e-a7ca7a0c-492a-4262-a9b6-78c1066441f8" className="cg-copy-ck-gomoku-play__board-axis-cols">
          {COLUMN_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-5d63d019-0c45-4465-ae5f-fb68642819ea" key={text} as="span" variant="body" style={{ left: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div shuku-edit-id="e-12584a86-ad8a-4c3f-a24c-cda5fe07aadf" className="cg-copy-ck-gomoku-play__board-axis-rows">
          {ROW_LABELS.map((text, index) => (
            <Typography shuku-edit-id="e-96435aba-107b-451e-814e-b097bd9717e9" key={text} as="span" variant="body" style={{ top: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
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
    <svg shuku-edit-id="e-f2c9222c-0126-4995-ae7f-d4dc82d47122" className="cg-copy-ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-aabe40e5-c80d-4653-b4c2-5a3fc6b4968d" points="23 4 23 10 17 10" />
      <path shuku-edit-id="e-6b958240-47f6-458a-b4f3-f94f9f232b04" d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg shuku-edit-id="e-12555d60-a252-45a2-bcae-8569f3242c3d" className="cg-copy-ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline shuku-edit-id="e-f002efe6-f85d-45ab-a7c8-cdeae2c26f38" points="9 14 4 9 9 4" />
      <path shuku-edit-id="e-1cc5ba49-0e7d-4e9a-aaaa-9e259ad28d0d" d="M4 9h11.5A4.5 4.5 0 0 1 20 13.5V20" />
    </svg>
  );
}

function ExampleIcon() {
  return (
    <svg shuku-edit-id="e-f35243c9-5573-45e7-b735-893b94d2f730" className="cg-copy-ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path shuku-edit-id="e-012bf2c1-fcf8-4b29-b34d-c7d13164d361" d="M9 6h11M9 12h11M9 18h11" />
      <circle shuku-edit-id="e-39186f7b-4d14-4e33-b5e5-f197a15a78dc" cx="4.4" cy="6" r="1.3" />
      <circle shuku-edit-id="e-7dd83c92-77e7-47fe-8b49-927fe5926627" cx="4.4" cy="12" r="1.3" />
      <circle shuku-edit-id="e-cd5ee9c4-3547-4626-a330-19b7425560d8" cx="4.4" cy="18" r="1.3" />
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
    <ContentBlock shuku-edit-id="e-c823dfda-6989-47a5-93e0-ee17927dee0d" className="cg-copy-ck-gomoku-play" aria-label="十五路五子棋对局：你执黑，AI 执白">
      <video shuku-edit-id="e-67ed8cb7-6165-4955-82b4-5b54ea31e74e" className="cg-copy-ck-gomoku-play__background-video" autoPlay muted loop playsInline aria-hidden="true">
        <source shuku-edit-id="e-c34443cd-c20f-4767-8390-87bbb24c0903" src={bgVideo} type="video/mp4" />
      </video>
      <div shuku-edit-id="e-06c4785c-c048-461a-98eb-9aa644244316" className="cg-copy-ck-gomoku-play__layout">
        <aside shuku-edit-id="e-ff947b66-04e5-4906-80be-8542111f72dd" className="cg-copy-ck-gomoku-play__rail">
          <div shuku-edit-id="e-7f33cab5-96fc-4dde-8207-25dce41abc00" className="cg-copy-ck-gomoku-play__intro">
            <Typography shuku-edit-id="e-6a3385a1-1d27-43c9-aa14-86ccebc021c2" as="h1" variant="h1" tone="accent">从五子棋开始<br shuku-edit-id="e-5e0e3364-4038-42f8-98d0-1da2c5010256" />认识卷积核</Typography>
          </div>
          <div shuku-edit-id="e-a7a4947f-ede6-44ed-822a-d674cb576e63" className="cg-copy-ck-gomoku-play__brief">
            <Typography shuku-edit-id="e-ddda9796-d2b0-42af-871d-864daeb179a3" as="p" variant="subtitle" tone="main">先来下一局五子棋。</Typography>
            <Typography shuku-edit-id="e-2e1bb05a-5f21-4048-b7b4-fc9a698279f6" as="p" variant="subtitle" tone="main">你执黑，与 AI 对弈。</Typography>
          </div>
        </aside>

        <div shuku-edit-id="e-d8aa339a-08b9-409b-a6ed-3fb443752ae4" className="cg-copy-ck-gomoku-play__main">
          <div shuku-edit-id="e-00d16bad-f4f5-43ec-9f14-9191e0b49d79" className="cg-copy-ck-gomoku-play__status" aria-live="polite">
            <div shuku-edit-id="e-7165c7b0-d721-4417-a2e3-074822a18496" className="cg-copy-ck-gomoku-play__panel-heading"><Typography shuku-edit-id="e-3a9bec9a-2ea7-4c3f-83f7-b288a1b8e9ad" as="span" variant="bodySmall" tone="muted">对局面板</Typography><span shuku-edit-id="e-8bd2103a-09d6-4ff0-84a7-f2f91b8d65ed" aria-hidden="true" className="cg-copy-ck-gomoku-play__panel-line" /></div>
            <div shuku-edit-id="e-bc6e5042-8f86-4547-a56c-ee677925b0d0" className="cg-copy-ck-gomoku-play__status-player"><span shuku-edit-id="e-971c67b1-3bd2-4b7a-b649-4eeedbd6f1f1" className={`cg-copy-ck-gomoku-play__turn cg-copy-ck-gomoku-play__turn--${status.stone}`} aria-hidden="true" /><Typography shuku-edit-id="e-f4d3f131-a4e7-4df9-8434-a990991dfa7b" as="strong" variant="body" tone={status.accent ? 'accent' : 'main'}>{status.text}</Typography></div>
            <div shuku-edit-id="e-b2abb3b6-5b2e-47a8-b52b-e63882b820ff" className="cg-copy-ck-gomoku-play__status-situation">{situation ? <span shuku-edit-id="e-46ee602d-4e8c-4606-879d-51bfbe56e9f5" className={`cg-copy-ck-gomoku-play__lamp cg-copy-ck-gomoku-play__lamp--${situation.tone}`} aria-hidden="true" /> : <span shuku-edit-id="e-df22ec43-5a1b-4f07-a23b-ace1c83dfa99" className="cg-copy-ck-gomoku-play__lamp cg-copy-ck-gomoku-play__lamp--off" aria-hidden="true" />}<Typography shuku-edit-id="e-941bb5d1-1449-489a-ad22-d6fdebdb246e" as="strong" variant="body" tone={situation ? 'accent' : 'muted'}>{situation?.label ?? (difficulty !== 'easy' ? '提示已关闭' : game.turn === 'computer' ? '等待 AI 落子' : game.turn === 'over' ? '对局结束' : '思考下一手')}</Typography></div>
            <div shuku-edit-id="e-c6203aaf-cce6-4e56-ab68-6239d66eabe7" className="cg-copy-ck-gomoku-play__controls">
              <div shuku-edit-id="e-faad80ca-9c6f-4f71-bd0c-b1f21ca27c7d" className="cg-copy-ck-gomoku-play__difficulty">
                <div shuku-edit-id="e-73f2a7a4-246f-4318-bc5a-c87e53954f09" className="cg-copy-ck-gomoku-play__control-heading"><Typography shuku-edit-id="e-48a8b78d-08ea-45e0-89db-f526e4e3f186" as="strong" variant="body" tone="accent">对弈难度</Typography></div>
                <div shuku-edit-id="e-8720b8e8-6cc1-4196-bebc-5609ad8bd461" className="cg-copy-ck-gomoku-play__difficulty-options" role="group" aria-label="选择 AI 难度">
                  {([['easy', '简单'], ['medium', '中等'], ['hard', '困难']] as const).map(([value, label]) => <button shuku-edit-id="e-df937aa9-f5f3-4390-b822-7ba3b9ad825b" key={value} type="button" className={difficulty === value ? 'is-active' : ''} aria-pressed={difficulty === value} onClick={() => changeDifficulty(value)}><Typography shuku-edit-id="e-c59defdf-cf94-45e6-a76f-61f97484e803" as="span" variant="body" tone="inherit">{label}</Typography></button>)}
                </div>
                <Typography shuku-edit-id="e-909730ce-e9c8-4800-baf1-7b28b04e4456" as="p" variant="bodySmall" tone="muted">{difficulty === 'easy' ? '轻松的体验' : difficulty === 'medium' ? '势均力敌' : '棋逢强敌'}</Typography>
              </div>
              <div shuku-edit-id="e-f95cc03d-ca0c-4196-b831-5a2b0b4d56dd" className="cg-copy-ck-gomoku-play__actions">
                <Typography shuku-edit-id="e-338ad5db-caa3-4086-8b85-b0d17ad8f054" as="strong" variant="body" tone="accent">棋局操作</Typography>
                <Button variant="primary" onClick={undoMove} disabled={difficulty === 'hard' || game.turn === 'over' || game.history.length === 0}><UndoIcon />悔一步</Button>
                <Button onClick={resetGame}><RestartIcon />重新开始</Button>
                <Button onClick={playDemo}><ExampleIcon />示例棋局</Button>
              </div>
            </div>
          </div>
          <div shuku-edit-id="e-0ae48b02-23e8-4663-a9a1-8f33828c4045" className="cg-copy-ck-gomoku-play__board-stage">
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
