/**
 * Convolution-Kernel-Intro · 第一幕：五子棋
 *
 * 这一层只放纯逻辑：棋盘状态、胜负判断、本地 AI 评分与示例棋局。
 * 它不接触 DOM、Canvas 或 React，页面组件只负责渲染与交互。
 */

export const BOARD_SIZE = 15;
export const EMPTY = 0;
export const HUMAN = 1;
export const AI = 2;

/** 棋盘之外的格子，用来判断一条棋路是否被边界堵死。 */
const OUT = 3;

export interface Cell {
  row: number;
  col: number;
}

export interface Stone extends Cell {
  player: number;
}

export type Board = number[][];

export type PatternKey =
  | 'win'
  | 'openFour'
  | 'rushFour'
  | 'gapFour'
  | 'openThree'
  | 'jumpThree'
  | 'sleepThree'
  | 'openTwo'
  | 'sleepTwo'
  | 'seed';

export interface Direction {
  dr: number;
  dc: number;
  label: string;
}

export const DIRECTIONS: readonly Direction[] = [
  { dr: 0, dc: 1, label: '横向' },
  { dr: 1, dc: 0, label: '竖向' },
  { dr: 1, dc: 1, label: '左上到右下斜线' },
  { dr: 1, dc: -1, label: '右上到左下斜线' },
];

export const PATTERNS: Record<PatternKey, { label: string; score: number }> = {
  win: { label: '成五', score: 120000 },
  openFour: { label: '活四', score: 76000 },
  rushFour: { label: '冲四', score: 33000 },
  gapFour: { label: '跳四', score: 24000 },
  openThree: { label: '活三', score: 9800 },
  jumpThree: { label: '跳三', score: 4300 },
  sleepThree: { label: '眠三', score: 1800 },
  openTwo: { label: '活二', score: 740 },
  sleepTwo: { label: '眠二', score: 260 },
  seed: { label: '落点', score: 60 },
};

/** 对局过程中的观察提示，与棋盘同步轮播。 */
export const STRATEGY_TIPS: readonly string[] = [
  '越靠近棋盘中心，棋子通常越容易向多个方向延伸。',
  '计算机看到的棋盘，本质上是一张由数字组成的表格。',
  '别只盯着自己的棋，也要看看对手下一步最想下在哪里。',
  '连续三颗棋子已经值得警惕，再不阻止可能就晚了。',
  '程序判断胜负时，会分别检查横向、竖向和两条斜线。',
  '一条很长的棋路，不一定比两条同时发展的棋路更危险。',
  '有时最好的进攻，就是下在对手最需要的位置上。',
  '计算机不需要理解“棋”，它只需要找到连续出现的相同数字。',
  '棋子之间隔着一个空位，也可能隐藏着危险。',
  '同时影响两个方向的位置，往往比普通位置更有价值。',
  '扫描棋盘时，一个小窗口可以逐格移动，寻找特定的排列。',
  '发现对手已经连成四颗时，必须立刻阻止。',
  '边缘位置可以发展的方向较少，开局不要太早走到角落。',
  '胜负往往不取决于最后一步，而取决于几步前漏掉的威胁。',
  '只要检测到五个相同的数字连成一线，程序就能宣布胜负。',
];

export interface GomokuGame {
  board: Board;
  current: 'human' | 'ai' | 'done';
  thinking: boolean;
  gameOver: boolean;
  /** HUMAN 或 AI 表示获胜方；EMPTY 表示还没有结果或平局。 */
  winner: number;
  winLine: Cell[];
  lastMove: Stone | null;
  moveHistory: Stone[];
  drawRequiresReset: boolean;
}

export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => EMPTY));
}

export function createGame(): GomokuGame {
  return {
    board: createBoard(),
    current: 'human',
    thinking: false,
    gameOver: false,
    winner: EMPTY,
    winLine: [],
    lastMove: null,
    moveHistory: [],
    drawRequiresReset: false,
  };
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function playerName(player: number): string {
  if (player === HUMAN) return '你';
  if (player === AI) return 'AI';
  return '无';
}

export function coordinate(row: number, col: number): string {
  return String(col + 1).padStart(2, '0') + ',' + String(row + 1).padStart(2, '0');
}

/** 以最新落子为中心，找出穿过它的最长同色连线；不足五颗时返回空数组。 */
export function findWinLine(board: Board, row: number, col: number, player: number): Cell[] {
  let best: Cell[] = [];
  DIRECTIONS.forEach((direction) => {
    const line: Cell[] = [{ row, col }];
    for (let step = 1; step < BOARD_SIZE; step += 1) {
      const nextRow = row + direction.dr * step;
      const nextCol = col + direction.dc * step;
      if (!inBounds(nextRow, nextCol) || board[nextRow][nextCol] !== player) break;
      line.push({ row: nextRow, col: nextCol });
    }
    for (let step = 1; step < BOARD_SIZE; step += 1) {
      const nextRow = row - direction.dr * step;
      const nextCol = col - direction.dc * step;
      if (!inBounds(nextRow, nextCol) || board[nextRow][nextCol] !== player) break;
      line.unshift({ row: nextRow, col: nextCol });
    }
    if (line.length > best.length) best = line;
  });
  return best.length >= 5 ? best : [];
}

function placeOnBoard(board: Board, row: number, col: number, player: number): Board {
  return board.map((line, rowIndex) => (
    rowIndex === row ? line.map((value, colIndex) => (colIndex === col ? player : value)) : line
  ));
}

/** 落下一颗棋子并结算对局；非法落点返回 null。 */
export function applyMove(game: GomokuGame, row: number, col: number, player: number): GomokuGame | null {
  if (!inBounds(row, col) || game.board[row][col] !== EMPTY) return null;
  const board = placeOnBoard(game.board, row, col, player);
  const move: Stone = { row, col, player };
  const moveHistory = [...game.moveHistory, move];
  const winLine = findWinLine(board, row, col, player);
  if (winLine.length >= 5) {
    return {
      ...game,
      board,
      moveHistory,
      lastMove: move,
      gameOver: true,
      winner: player,
      winLine,
      current: 'done',
      thinking: false,
      drawRequiresReset: false,
    };
  }
  if (moveHistory.length >= BOARD_SIZE * BOARD_SIZE) {
    return {
      ...game,
      board,
      moveHistory,
      lastMove: move,
      gameOver: true,
      winner: EMPTY,
      winLine: [],
      current: 'done',
      thinking: false,
      drawRequiresReset: true,
    };
  }
  return { ...game, board, moveHistory, lastMove: move, winner: EMPTY, winLine: [], drawRequiresReset: false };
}

/** 悔一步：退回玩家与 AI 的最近一手。 */
export function undoPair(game: GomokuGame): GomokuGame {
  if (!game.moveHistory.length) return game;
  const board = game.board.map((line) => [...line]);
  const history = [...game.moveHistory];
  let removed = 0;
  while (history.length && removed < 2) {
    const move = history.pop();
    if (!move) break;
    board[move.row][move.col] = EMPTY;
    removed += 1;
    if (move.player === HUMAN && removed > 1) break;
  }
  return {
    ...createGame(),
    board,
    moveHistory: history,
    lastMove: history[history.length - 1] ?? null,
    current: 'human',
  };
}

export function playAiMove(game: GomokuGame, decision: Cell): GomokuGame {
  const placed = applyMove(game, decision.row, decision.col, AI);
  if (!placed) return { ...game, current: 'human', thinking: false };
  return placed.gameOver ? placed : { ...placed, current: 'human', thinking: false };
}

/** 页面读数的文案，与对局状态保持一致。 */
export function gameStatus(game: GomokuGame): { turn: string; position: string } {
  if (game.gameOver) {
    return {
      turn: '本局结束',
      position: game.winner === EMPTY ? '平局' : playerName(game.winner) + '连成五子',
    };
  }
  if (game.thinking) return { turn: 'AI 思考中', position: 'AI 落子中' };
  return { turn: '轮到你', position: game.moveHistory.length ? '继续对弈' : '等待第一手' };
}

export function resultSummary(winner: number): string {
  if (winner === HUMAN) return '恭喜！您获胜了。';
  if (winner === AI) return '这局惜败，别灰心，再试一次！';
  return '平局了，重新开局再试一次吧！';
}

/** 示例棋局：黑棋沿对角线连成五子，用来直接看到终局。 */
const DEMO_WIN_BLACK: ReadonlyArray<readonly [number, number]> = [
  [4, 3], [5, 4], [6, 5], [7, 6], [8, 7],
  [5, 8], [7, 4], [8, 5], [9, 5],
];
const DEMO_WIN_WHITE: ReadonlyArray<readonly [number, number]> = [
  [4, 6], [5, 6], [6, 7], [7, 8], [8, 8],
  [9, 6], [6, 3], [10, 5],
];

export function demoWinGame(): GomokuGame {
  const board = createBoard();
  const moveHistory: Stone[] = [];
  DEMO_WIN_BLACK.forEach(([row, col]) => {
    board[row][col] = HUMAN;
    moveHistory.push({ row, col, player: HUMAN });
  });
  DEMO_WIN_WHITE.forEach(([row, col]) => {
    board[row][col] = AI;
    moveHistory.push({ row, col, player: AI });
  });
  return {
    ...createGame(),
    board,
    moveHistory,
    lastMove: { row: 8, col: 7, player: HUMAN },
    gameOver: true,
    winner: HUMAN,
    winLine: DEMO_WIN_BLACK.slice(0, 5).map(([row, col]) => ({ row, col })),
    current: 'done',
  };
}

/** 只做一种判断的本地 AI：候选点评分后取最优，必要时在一线候选里随机。 */
function localDensity(board: Board, row: number, col: number): number {
  let total = 0;
  for (let dr = -2; dr <= 2; dr += 1) {
    for (let dc = -2; dc <= 2; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (inBounds(nextRow, nextCol) && board[nextRow][nextCol] !== EMPTY) total += 1;
    }
  }
  return total;
}

function lineValueAt(
  board: Board,
  row: number,
  col: number,
  player: number,
  direction: Direction,
  offset: number,
): number {
  const nextRow = row + direction.dr * offset;
  const nextCol = col + direction.dc * offset;
  if (!inBounds(nextRow, nextCol)) return OUT;
  if (offset === 0) return player;
  return board[nextRow][nextCol];
}

function strongestWindow(
  board: Board,
  row: number,
  col: number,
  player: number,
  direction: Direction,
): { self: number; empty: number } {
  let best = { self: 0, empty: 0 };
  for (let start = -4; start <= 0; start += 1) {
    let blocked = false;
    let self = 0;
    let empty = 0;
    for (let offset = start; offset < start + 5; offset += 1) {
      const value = lineValueAt(board, row, col, player, direction, offset);
      if (value === player) self += 1;
      else if (value === EMPTY) empty += 1;
      else blocked = true;
    }
    if (!blocked && (self > best.self || (self === best.self && empty > best.empty))) {
      best = { self, empty };
    }
  }
  return best;
}

function scanDirection(
  board: Board,
  row: number,
  col: number,
  player: number,
  direction: Direction,
): { key: PatternKey; score: number } {
  let left = 0;
  let right = 0;
  while (lineValueAt(board, row, col, player, direction, -left - 1) === player) left += 1;
  while (lineValueAt(board, row, col, player, direction, right + 1) === player) right += 1;
  const total = left + right + 1;
  let openEnds = 0;
  if (lineValueAt(board, row, col, player, direction, -left - 1) === EMPTY) openEnds += 1;
  if (lineValueAt(board, row, col, player, direction, right + 1) === EMPTY) openEnds += 1;
  const window = strongestWindow(board, row, col, player, direction);
  let key: PatternKey = 'seed';
  if (total >= 5 || window.self >= 5) key = 'win';
  else if (total === 4 && openEnds === 2) key = 'openFour';
  else if (total === 4 && openEnds === 1) key = 'rushFour';
  else if (window.self === 4) key = 'gapFour';
  else if (total === 3 && openEnds === 2) key = 'openThree';
  else if (window.self === 3 && window.empty === 2) key = 'jumpThree';
  else if (total === 3 && openEnds === 1) key = 'sleepThree';
  else if (total === 2 && openEnds === 2) key = 'openTwo';
  else if (total === 2 && openEnds === 1) key = 'sleepTwo';
  return { key, score: PATTERNS[key].score };
}

function evaluateMove(board: Board, row: number, col: number, player: number): {
  score: number;
  features: Record<PatternKey, number>;
  best: { key: PatternKey; score: number };
} {
  const features = {} as Record<PatternKey, number>;
  (Object.keys(PATTERNS) as PatternKey[]).forEach((key) => { features[key] = 0; });
  let best: { key: PatternKey; score: number } = { key: 'seed', score: PATTERNS.seed.score };
  let score = 0;
  DIRECTIONS.forEach((direction) => {
    const line = scanDirection(board, row, col, player, direction);
    features[line.key] += 1;
    score += line.score;
    if (line.score > best.score) best = line;
  });
  if (features.openThree >= 2) score += 17000;
  if (features.rushFour + features.gapFour >= 2) score += 26000;
  return { score, features, best };
}

function candidateMoves(board: Board, moveHistory: Stone[]): Cell[] {
  if (!moveHistory.length) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [{ row: center, col: center }];
  }
  const seen = new Set<string>();
  const moves: Cell[] = [];
  moveHistory.forEach((move) => {
    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) {
        const row = move.row + dr;
        const col = move.col + dc;
        const key = row + ':' + col;
        if (!inBounds(row, col) || board[row][col] !== EMPTY || seen.has(key)) continue;
        seen.add(key);
        moves.push({ row, col });
      }
    }
  });
  return moves;
}

function scoreCandidate(board: Board, row: number, col: number) {
  const attack = evaluateMove(board, row, col, AI);
  const defend = evaluateMove(board, row, col, HUMAN);
  const center = (BOARD_SIZE - 1) / 2;
  const centerScore = Math.max(0, 13 - Math.hypot(row - center, col - center)) * 18;
  let score = attack.score * 1.08 + defend.score * 1.04 + centerScore + localDensity(board, row, col) * 34;
  if (attack.best.key === 'win') score = 520000 + attack.score;
  else if (defend.best.key === 'win') score = 480000 + defend.score;
  else {
    if (defend.best.key === 'openFour' || defend.best.key === 'rushFour' || defend.best.key === 'gapFour') score += 94000;
    if (attack.best.key === 'openFour' || attack.best.key === 'rushFour' || attack.best.key === 'gapFour') score += 72000;
    if (defend.features.openThree >= 2) score += 24000;
    if (attack.features.openThree >= 2) score += 20000;
  }
  return { row, col, score: score + Math.random() * 70, attack, defend };
}

/** 返回 AI 选定的落点。评分只看四方向局部棋形，不做全局搜索。 */
export function computeAiDecision(board: Board, moveHistory: Stone[]): Cell {
  const candidates = candidateMoves(board, moveHistory)
    .map((move) => scoreCandidate(board, move.row, move.col))
    .sort((a, b) => b.score - a.score);
  const top = candidates[0];
  if (!top) return { row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) };
  const forced = top.attack.best.key === 'win' || top.defend.best.key === 'win' || top.score > 260000;
  const pool = forced
    ? [top]
    : candidates.filter((item, index) => index < 3 && item.score >= top.score * 0.88);
  const choice = pool[Math.floor(Math.random() * pool.length)] ?? top;
  return { row: choice.row, col: choice.col };
}
