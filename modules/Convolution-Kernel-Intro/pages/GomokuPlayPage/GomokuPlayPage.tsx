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
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { useGomokuOutcome } from '../../LessonContext';
import {
  BLACK,
  BOARD_SIZE,
  EMPTY,
  WHITE,
  buildDemoPosition,
  computeComputerMove,
  createBoard,
  placeStone,
  winDirectionLabel,
  type GomokuDifficulty,
  type Board,
  type Cell,
  type Move,
  type Stone,
} from '../../gomokuEngine';
import './GomokuPlayPage.css';

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
    <div
      className={interactive ? 'ck-gomoku-play__board is-interactive' : 'ck-gomoku-play__board'}
      ref={frameRef}
    >
      <canvas
        ref={canvasRef}
        className="ck-gomoku-play__board-canvas"
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
      <span ref={previewRef} className="ck-gomoku-play__hover-stone" aria-hidden="true" />
      <div className="ck-gomoku-play__board-axis" aria-hidden="true">
        <div className="ck-gomoku-play__board-axis-cols">
          {COLUMN_LABELS.map((text, index) => (
            <Typography key={text} as="span" variant="body" style={{ left: `${(index / (BOARD_SIZE - 1)) * 100}%` }}>
              {text}
            </Typography>
          ))}
        </div>
        <div className="ck-gomoku-play__board-axis-rows">
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

/** 对局面板按钮图标：跟随按钮文字颜色，尺寸相对按钮字号。 */
function RestartIcon() {
  return (
    <svg className="ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg className="ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline points="9 14 4 9 9 4" />
      <path d="M4 9h11.5A4.5 4.5 0 0 1 20 13.5V20" />
    </svg>
  );
}

function ExampleIcon() {
  return (
    <svg className="ck-gomoku-play__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.4" cy="6" r="1.3" />
      <circle cx="4.4" cy="12" r="1.3" />
      <circle cx="4.4" cy="18" r="1.3" />
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

type SituationTone = 'red' | 'orange' | 'green' | 'neutral';

interface Situation {
  tone: SituationTone;
  label: string;
  detail: string;
}

function countWinningMoves(board: Board, player: Stone): number {
  let total = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== EMPTY) continue;
      if (placeStone(board, { row, col }, player).winLine.length >= 5) total += 1;
    }
  }
  return total;
}

function countOpenFourThreats(board: Board, player: Stone): number {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;
  let total = 0;
  directions.forEach(([dr, dc]) => {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const beforeRow = row - dr;
        const beforeCol = col - dc;
        const afterRow = row + dr * 4;
        const afterCol = col + dc * 4;
        if (beforeRow < 0 || beforeRow >= BOARD_SIZE || beforeCol < 0 || beforeCol >= BOARD_SIZE || afterRow < 0 || afterRow >= BOARD_SIZE || afterCol < 0 || afterCol >= BOARD_SIZE) continue;
        if (board[beforeRow][beforeCol] !== EMPTY || board[afterRow][afterCol] !== EMPTY) continue;
        let line = true;
        for (let step = 0; step < 4; step += 1) {
          if (board[row + dr * step][col + dc * step] !== player) line = false;
        }
        if (line) total += 1;
      }
    }
  });
  return total;
}

function getSituation(board: Board): Situation {
  const humanWins = countWinningMoves(board, HUMAN);
  const computerWins = countWinningMoves(board, COMPUTER);
  const humanOpenFour = countOpenFourThreats(board, HUMAN);
  const computerOpenFour = countOpenFourThreats(board, COMPUTER);
  if (computerWins > 0) return { tone: 'red', label: '对手快赢了', detail: '白方下一步就能连成五子' };
  if (humanWins > 0) return { tone: 'green', label: '胜券在握', detail: '黑方下一步就能连成五子' };
  if (computerOpenFour > 0) return { tone: 'orange', label: '对手领先', detail: '白方的四子线两端都还留着空位' };
  if (humanOpenFour > 0) return { tone: 'green', label: '优势在我', detail: '黑方已经连出有潜力的四子线' };
  return { tone: 'neutral', label: '局势安全', detail: '双方正在布局，留意棋子之间的连线' };
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
  const completedRef = useRef(false);
  const demoRef = useRef(false);
  const { recordOutcome } = useGomokuOutcome();

  const canPlay = game.turn === 'human';

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
        text: `${game.winner === HUMAN ? '黑胜' : '白胜'} · ${winDirectionLabel(game.winLine)}`,
        stone: game.winner === HUMAN ? 'black' : 'white',
        accent: true,
      };
    }
    if (game.draw) return { text: '平局', stone: 'black', accent: true };
    return game.turn === 'human'
      ? { text: '轮到你了 · 黑方', stone: 'black', accent: false }
      : { text: 'AI 思考中 · 白方', stone: 'white', accent: false };
  }, [game]);

  const situation = useMemo(() => getSituation(game.board), [game.board]);

  return (
    <ContentBlock className="ck-gomoku-play" aria-label="十五路五子棋对局：你执黑，AI 执白">
      <div className="ck-gomoku-play__layout">
        <aside className="ck-gomoku-play__rail">
          <div className="ck-gomoku-play__intro">
            <Typography as="h1" variant="h1" tone="accent">五子连线在哪里？</Typography>
            <Typography variant="subtitle" tone="muted">五颗棋子连成一线，却可能出现在不同位置、不同方向。计算机怎样找到它？</Typography>
          </div>
          <div className="ck-gomoku-play__callout"><span className="ck-gomoku-play__callout-icon" aria-hidden="true">✦</span><div><Typography as="strong" variant="body" tone="accent">完成一局五子棋。</Typography><Typography as="p" variant="bodySmall" tone="muted">你执黑，与 AI 下完一局。终局棋盘会变成数字，再由一个小窗口寻找其中的获胜连线。</Typography></div></div>

        </aside>

        <div className="ck-gomoku-play__main">
          <div className="ck-gomoku-play__status" aria-live="polite">
            <div className="ck-gomoku-play__panel-heading"><Typography as="span" variant="bodySmall" tone="muted">对局面板</Typography><span aria-hidden="true" className="ck-gomoku-play__panel-line" /></div>
            <div className="ck-gomoku-play__match-summary">
              <div className="ck-gomoku-play__status-player"><span className={`ck-gomoku-play__turn ck-gomoku-play__turn--${status.stone}`} aria-hidden="true" /><div><Typography as="strong" variant="body" tone={status.accent ? 'accent' : 'main'}>{status.text}</Typography><Typography as="span" variant="bodySmall" tone="muted">{game.turn === 'human' ? '你执黑' : game.turn === 'computer' ? 'AI 正在计算' : '本局结束'}</Typography></div></div>
              <div className="ck-gomoku-play__status-move"><Typography as="strong" variant="h2" tone="accent">{game.history.length}</Typography><Typography as="span" variant="bodySmall" tone="muted">手</Typography></div>
            </div>
            <div className="ck-gomoku-play__status-situation">{difficulty === 'easy' && <span className={`ck-gomoku-play__lamp ck-gomoku-play__lamp--${situation.tone}`} aria-hidden="true" />}<div><Typography as="strong" variant="body" tone="accent">{difficulty === 'easy' ? situation.label : '深度搜索模式'}</Typography><Typography as="span" variant="bodySmall" tone="muted">{difficulty === 'easy' ? situation.detail : difficulty === 'medium' ? '提前一步观察反击' : '搜索更多候选步'}</Typography></div></div>
            <div className="ck-gomoku-play__controls">
              <div className="ck-gomoku-play__difficulty">
                <div className="ck-gomoku-play__control-heading"><Typography as="strong" variant="body" tone="accent">观察范围</Typography><Typography as="span" variant="bodySmall" tone="muted">AI 会看多远</Typography></div>
                <div className="ck-gomoku-play__difficulty-options" role="group" aria-label="选择 AI 难度">
                  {([['easy', '简单'], ['medium', '中等'], ['hard', '困难']] as const).map(([value, label]) => <button key={value} type="button" className={difficulty === value ? 'is-active' : ''} aria-pressed={difficulty === value} onClick={() => changeDifficulty(value)}><Typography as="span" variant="body" tone="inherit">{label}</Typography></button>)}
                </div>
                <Typography as="p" variant="bodySmall" tone="muted">{difficulty === 'easy' ? '只看附近，练习发现局部形状。' : difficulty === 'medium' ? '多看一步，比较下一种可能。' : '搜索更多分支，提前判断走向。'}</Typography>
              </div>
              <div className="ck-gomoku-play__actions">
                <Typography as="strong" variant="body" tone="accent">棋局操作</Typography>
                <Button variant="primary" onClick={undoMove} disabled={difficulty === 'hard' || game.turn === 'over' || game.history.length === 0}><UndoIcon />悔一步</Button>
                <Button onClick={resetGame}><RestartIcon />重新开始</Button>
                <Button onClick={playDemo}><ExampleIcon />示例棋局</Button>
              </div>
            </div>
          </div>
          <div className="ck-gomoku-play__board-stage">
            <PlayBoard
              board={game.board}
              lastMove={game.lastMove}
              winLine={game.winLine}
              hover={hover}
              cursor={cursor}
              interactive={canPlay}
              label={`十五路五子棋棋盘，${status.text}。方向键移动落点，回车落子。`}
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
