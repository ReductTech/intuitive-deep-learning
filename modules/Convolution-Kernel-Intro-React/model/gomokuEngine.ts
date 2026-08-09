export const BOARD_SIZE = 15;

export const EMPTY = 0 as const;
export const HUMAN = 1 as const;
export const AI = 2 as const;
export const OUT = 3 as const;

export type Player = typeof EMPTY | typeof HUMAN | typeof AI;
export type StonePlayer = typeof HUMAN | typeof AI;
export type CellValue = Player;
export type Board = CellValue[][];

export interface Cell {
  row: number;
  col: number;
}

export interface Move extends Cell {
  player: StonePlayer;
}

export interface Direction {
  dr: number;
  dc: number;
  label: string;
}

export type WinDirection = Pick<Direction, 'dr' | 'dc'>;

export const DIRECTIONS: readonly Direction[] = [
  { dr: 0, dc: 1, label: '横向' },
  { dr: 1, dc: 0, label: '竖向' },
  { dr: 1, dc: 1, label: '左上到右下斜线' },
  { dr: 1, dc: -1, label: '右上到左下斜线' },
] as const;

export const PATTERNS = {
  win: { label: '成五', score: 120_000 },
  openFour: { label: '活四', score: 76_000 },
  rushFour: { label: '冲四', score: 33_000 },
  gapFour: { label: '跳四', score: 24_000 },
  openThree: { label: '活三', score: 9_800 },
  jumpThree: { label: '跳三', score: 4_300 },
  sleepThree: { label: '眠三', score: 1_800 },
  openTwo: { label: '活二', score: 740 },
  sleepTwo: { label: '眠二', score: 260 },
  seed: { label: '落点', score: 60 },
} as const;

export type PatternKey = keyof typeof PATTERNS;
export type PatternFeatures = Record<PatternKey, number>;

export interface PatternResult {
  key: PatternKey;
  score: number;
}

export interface MoveEvaluation {
  score: number;
  features: PatternFeatures;
  best: PatternResult;
}

export interface ScoredCandidate extends Cell {
  score: number;
  attack: MoveEvaluation;
  defend: MoveEvaluation;
}

export interface AiDecision {
  choice: ScoredCandidate;
  candidates: ScoredCandidate[];
  forced: boolean;
}

export interface PlaceStoneResult {
  board: Board;
  move: Move;
  winLine: Cell[];
  winner: Player;
  isDraw: boolean;
}

export interface DemoGame {
  board: Board;
  moveHistory: Move[];
  lastMove: Move;
  winner: typeof HUMAN;
  winLine: Cell[];
}

export const DEMO_BLACK_MOVES = [
  [4, 3], [5, 4], [6, 5], [7, 6], [8, 7],
  [5, 8], [7, 4], [8, 5], [9, 5],
] as const;

export const DEMO_WHITE_MOVES = [
  [4, 6], [5, 6], [6, 7], [7, 8], [8, 8],
  [9, 6], [6, 3], [10, 5],
] as const;

export function createBoard(): Board {
  return Array.from(
    { length: BOARD_SIZE },
    () => Array<CellValue>(BOARD_SIZE).fill(EMPTY),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function coordinate(row: number, col: number): string {
  return `${String(col + 1).padStart(2, '0')},${String(row + 1).padStart(2, '0')}`;
}

export function getPlayerName(player: Player): string {
  if (player === HUMAN) return '你';
  if (player === AI) return 'AI';
  return '无';
}

export function getLoser(winner: Player): Player {
  if (winner === HUMAN) return AI;
  if (winner === AI) return HUMAN;
  return EMPTY;
}

export function findWinLine(
  board: Board,
  row: number,
  col: number,
  player: StonePlayer,
): Cell[] {
  let best: Cell[] = [];

  DIRECTIONS.forEach((direction) => {
    const line: Cell[] = [{ row, col }];

    for (let step = 1; step < BOARD_SIZE; step += 1) {
      const nextRow = row + direction.dr * step;
      const nextCol = col + direction.dc * step;
      if (!inBounds(nextRow, nextCol) || board[nextRow]?.[nextCol] !== player) break;
      line.push({ row: nextRow, col: nextCol });
    }

    for (let step = 1; step < BOARD_SIZE; step += 1) {
      const nextRow = row - direction.dr * step;
      const nextCol = col - direction.dc * step;
      if (!inBounds(nextRow, nextCol) || board[nextRow]?.[nextCol] !== player) break;
      line.unshift({ row: nextRow, col: nextCol });
    }

    if (line.length > best.length) best = line;
  });

  return best.length >= 5 ? best : [];
}

export function placeStone(
  board: Board,
  row: number,
  col: number,
  player: StonePlayer,
): PlaceStoneResult | null {
  if (!inBounds(row, col) || board[row]?.[col] !== EMPTY) return null;

  const nextBoard = cloneBoard(board);
  nextBoard[row][col] = player;
  const move: Move = { row, col, player };
  const winLine = findWinLine(nextBoard, row, col, player);
  const occupied = nextBoard.reduce(
    (total, line) => total + line.filter((value) => value !== EMPTY).length,
    0,
  );

  return {
    board: nextBoard,
    move,
    winLine,
    winner: winLine.length >= 5 ? player : EMPTY,
    isDraw: winLine.length < 5 && occupied >= BOARD_SIZE * BOARD_SIZE,
  };
}

export function candidateMoves(board: Board, moveHistory: readonly Move[]): Cell[] {
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
        const key = `${row}:${col}`;
        if (!inBounds(row, col) || board[row]?.[col] !== EMPTY || seen.has(key)) continue;
        seen.add(key);
        moves.push({ row, col });
      }
    }
  });

  return moves;
}

function createPatternFeatures(): PatternFeatures {
  return Object.fromEntries(
    (Object.keys(PATTERNS) as PatternKey[]).map((key) => [key, 0]),
  ) as unknown as PatternFeatures;
}

function strongestWindow(
  board: Board,
  row: number,
  col: number,
  player: StonePlayer,
  direction: Direction,
): { self: number; empty: number } {
  let best = { self: 0, empty: 0 };

  for (let start = -4; start <= 0; start += 1) {
    let blocked = false;
    let self = 0;
    let empty = 0;

    for (let offset = start; offset < start + 5; offset += 1) {
      const nextRow = row + direction.dr * offset;
      const nextCol = col + direction.dc * offset;
      const value = !inBounds(nextRow, nextCol)
        ? OUT
        : offset === 0
          ? player
          : board[nextRow]?.[nextCol] ?? OUT;

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
  player: StonePlayer,
  direction: Direction,
): PatternResult {
  const valueAt = (offset: number): CellValue | typeof OUT => {
    const nextRow = row + direction.dr * offset;
    const nextCol = col + direction.dc * offset;
    if (!inBounds(nextRow, nextCol)) return OUT;
    if (offset === 0) return player;
    return board[nextRow]?.[nextCol] ?? OUT;
  };

  let left = 0;
  let right = 0;
  while (valueAt(-left - 1) === player) left += 1;
  while (valueAt(right + 1) === player) right += 1;

  const total = left + right + 1;
  const openEnds = Number(valueAt(-left - 1) === EMPTY) + Number(valueAt(right + 1) === EMPTY);
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

export function evaluateMove(
  board: Board,
  row: number,
  col: number,
  player: StonePlayer,
): MoveEvaluation {
  const features = createPatternFeatures();
  let best: PatternResult = { key: 'seed', score: PATTERNS.seed.score };
  let score = 0;

  DIRECTIONS.forEach((direction) => {
    const line = scanDirection(board, row, col, player, direction);
    features[line.key] += 1;
    score += line.score;
    if (line.score > best.score) best = line;
  });

  if (features.openThree >= 2) score += 17_000;
  if (features.rushFour + features.gapFour >= 2) score += 26_000;

  return { score, features, best };
}

export function localDensity(board: Board, row: number, col: number): number {
  let total = 0;
  for (let dr = -2; dr <= 2; dr += 1) {
    for (let dc = -2; dc <= 2; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (inBounds(nextRow, nextCol) && board[nextRow]?.[nextCol] !== EMPTY) total += 1;
    }
  }
  return total;
}

export function scoreCandidate(
  board: Board,
  row: number,
  col: number,
  random: () => number = Math.random,
): ScoredCandidate {
  const attack = evaluateMove(board, row, col, AI);
  const defend = evaluateMove(board, row, col, HUMAN);
  const center = (BOARD_SIZE - 1) / 2;
  const centerScore = Math.max(0, 13 - Math.hypot(row - center, col - center)) * 18;
  let score = (
    attack.score * 1.08
    + defend.score * 1.04
    + centerScore
    + localDensity(board, row, col) * 34
  );

  if (attack.best.key === 'win') score = 520_000 + attack.score;
  else if (defend.best.key === 'win') score = 480_000 + defend.score;
  else {
    if (['openFour', 'rushFour', 'gapFour'].includes(defend.best.key)) score += 94_000;
    if (['openFour', 'rushFour', 'gapFour'].includes(attack.best.key)) score += 72_000;
    if (defend.features.openThree >= 2) score += 24_000;
    if (attack.features.openThree >= 2) score += 20_000;
  }

  return { row, col, score: score + random() * 70, attack, defend };
}

export function computeAiDecision(
  board: Board,
  moveHistory: readonly Move[],
  random: () => number = Math.random,
): AiDecision | null {
  const candidates = candidateMoves(board, moveHistory)
    .map((move) => scoreCandidate(board, move.row, move.col, random))
    .sort((left, right) => right.score - left.score);
  const top = candidates[0];
  if (!top) return null;

  const forced = (
    top.attack.best.key === 'win'
    || top.defend.best.key === 'win'
    || top.score > 260_000
  );
  const pool = forced
    ? [top]
    : candidates.filter((item, index) => index < 3 && item.score >= top.score * 0.88);
  const choice = pool[Math.floor(random() * pool.length)] ?? top;

  return { choice, candidates, forced };
}

export function createDemoGame(): DemoGame {
  const board = createBoard();
  const moveHistory: Move[] = [];

  DEMO_BLACK_MOVES.forEach(([row, col]) => {
    board[row][col] = HUMAN;
    moveHistory.push({ row, col, player: HUMAN });
  });
  DEMO_WHITE_MOVES.forEach(([row, col]) => {
    board[row][col] = AI;
    moveHistory.push({ row, col, player: AI });
  });

  return {
    board,
    moveHistory,
    lastMove: { row: 8, col: 7, player: HUMAN },
    winner: HUMAN,
    winLine: DEMO_BLACK_MOVES.slice(0, 5).map(([row, col]) => ({ row, col })),
  };
}

export function undoLastPair(
  board: Board,
  moveHistory: readonly Move[],
): { board: Board; moveHistory: Move[]; lastMove: Move | null } {
  const nextBoard = cloneBoard(board);
  const nextHistory = moveHistory.map((move) => ({ ...move }));
  let removed = 0;

  while (nextHistory.length && removed < 2) {
    const move = nextHistory.pop();
    if (!move) break;
    nextBoard[move.row][move.col] = EMPTY;
    removed += 1;
    if (move.player === HUMAN && removed > 1) break;
  }

  return {
    board: nextBoard,
    moveHistory: nextHistory,
    lastMove: nextHistory.at(-1) ?? null,
  };
}

export function getWinDirection(winLine: readonly Cell[]): WinDirection {
  if (winLine.length < 2) return { dr: 0, dc: 1 };
  return {
    dr: Math.sign(winLine[1].row - winLine[0].row),
    dc: Math.sign(winLine[1].col - winLine[0].col),
  };
}

export function getWinDirectionLabel(winLine: readonly Cell[]): string {
  const direction = getWinDirection(winLine);
  if (direction.dr === 0) return '横向';
  if (direction.dc === 0) return '竖向';
  if (direction.dr === direction.dc) return '左上到右下斜线';
  return '右上到左下斜线';
}
