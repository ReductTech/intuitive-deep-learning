export const BOARD_SIZE = 15;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export type Stone = typeof EMPTY | typeof BLACK | typeof WHITE;
export type Player = typeof BLACK | typeof WHITE;
export type Board = Stone[][];

export interface Cell {
  row: number;
  col: number;
}

export interface Move extends Cell {
  player: Stone;
}

export interface Direction {
  dr: number;
  dc: number;
  label: string;
}

/** 四个判胜方向的顺序固定：横向、竖向、主对角、副对角。 */
export const DIRECTIONS: readonly Direction[] = [
  { dr: 0, dc: 1, label: '横' },
  { dr: 1, dc: 0, label: '竖' },
  { dr: 1, dc: 1, label: '斜 ↘' },
  { dr: 1, dc: -1, label: '斜 ↗' },
];

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

const PATTERN_SCORES: Record<PatternKey, number> = {
  win: 120000,
  openFour: 76000,
  rushFour: 33000,
  gapFour: 24000,
  openThree: 9800,
  jumpThree: 4300,
  sleepThree: 1800,
  openTwo: 740,
  sleepTwo: 260,
  seed: 60,
};

const OUT: Stone = 3 as Stone;

export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => EMPTY as Stone));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice() as Stone[]);
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function otherPlayer(player: Player): Player {
  return player === BLACK ? WHITE : BLACK;
}

/** 在棋盘副本上落子，返回新棋盘与该点的判胜结果。 */
export function placeStone(board: Board, cell: Cell, player: Stone): { board: Board; winLine: Cell[] } {
  const next = cloneBoard(board);
  next[cell.row][cell.col] = player;
  return { board: next, winLine: player === EMPTY ? [] : findWinLine(next, cell.row, cell.col, player) };
}

export function findWinLine(board: Board, row: number, col: number, player: Stone): Cell[] {
  let best: Cell[] = [];
  DIRECTIONS.forEach((dir) => {
    const line: Cell[] = [{ row, col }];
    for (let step = 1; step < BOARD_SIZE; step += 1) {
      const r = row + dir.dr * step;
      const c = col + dir.dc * step;
      if (!inBounds(r, c) || board[r][c] !== player) break;
      line.push({ row: r, col: c });
    }
    for (let step = 1; step < BOARD_SIZE; step += 1) {
      const r = row - dir.dr * step;
      const c = col - dir.dc * step;
      if (!inBounds(r, c) || board[r][c] !== player) break;
      line.unshift({ row: r, col: c });
    }
    if (line.length > best.length) best = line;
  });
  return best.length >= 5 ? best : [];
}

/** 把一条获胜连线还原成方向说法，例如“斜 ↘”。 */
export function winDirectionLabel(line: Cell[]): string {
  if (line.length < 2) return '';
  const first = line[0];
  const second = line[1];
  const dr = Math.sign(second.row - first.row);
  const dc = Math.sign(second.col - first.col);
  const matched = DIRECTIONS.find((dir) => dir.dr === dr && dir.dc === dc);
  return matched ? matched.label : '';
}

function valueAt(board: Board, row: number, col: number, drift: Direction, offset: number, player: Stone): Stone {
  const r = row + drift.dr * offset;
  const c = col + drift.dc * offset;
  if (!inBounds(r, c)) return OUT;
  if (offset === 0) return player;
  return board[r][c];
}

function strongestWindow(board: Board, row: number, col: number, player: Stone, drift: Direction): { self: number; empty: number } {
  let best = { self: 0, empty: 0 };
  for (let start = -4; start <= 0; start += 1) {
    let blocked = false;
    let self = 0;
    let empty = 0;
    for (let offset = start; offset < start + 5; offset += 1) {
      const value = valueAt(board, row, col, drift, offset, player);
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

interface DirectionScan {
  key: PatternKey;
  score: number;
}

function scanDirection(board: Board, row: number, col: number, player: Stone, drift: Direction): DirectionScan {
  let left = 0;
  let right = 0;
  while (valueAt(board, row, col, drift, -left - 1, player) === player) left += 1;
  while (valueAt(board, row, col, drift, right + 1, player) === player) right += 1;
  const total = left + right + 1;
  let openEnds = 0;
  if (valueAt(board, row, col, drift, -left - 1, player) === EMPTY) openEnds += 1;
  if (valueAt(board, row, col, drift, right + 1, player) === EMPTY) openEnds += 1;
  const window = strongestWindow(board, row, col, player, drift);

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
  return { key, score: PATTERN_SCORES[key] };
}

interface MoveEvaluation {
  score: number;
  keys: PatternKey[];
}

function evaluateMove(board: Board, row: number, col: number, player: Stone): MoveEvaluation {
  const keys: PatternKey[] = [];
  let score = 0;
  DIRECTIONS.forEach((dir) => {
    const scan = scanDirection(board, row, col, player, dir);
    keys.push(scan.key);
    score += scan.score;
  });
  const count = (key: PatternKey) => keys.filter((item) => item === key).length;
  if (count('openThree') >= 2) score += 17000;
  if (count('rushFour') + count('gapFour') >= 2) score += 26000;
  return { score, keys };
}

function localDensity(board: Board, row: number, col: number): number {
  let total = 0;
  for (let dr = -2; dr <= 2; dr += 1) {
    for (let dc = -2; dc <= 2; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (inBounds(r, c) && board[r][c] !== EMPTY) total += 1;
    }
  }
  return total;
}

function candidateMoves(board: Board, history: Move[]): Cell[] {
  if (!history.length) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [{ row: center, col: center }];
  }
  const seen = new Set<string>();
  const moves: Cell[] = [];
  history.forEach((move) => {
    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) {
        const row = move.row + dr;
        const col = move.col + dc;
        const key = `${row}:${col}`;
        if (!inBounds(row, col) || board[row][col] !== EMPTY || seen.has(key)) continue;
        seen.add(key);
        moves.push({ row, col });
      }
    }
  });
  return moves;
}

interface ScoredCell extends Cell {
  score: number;
  attackKeys: PatternKey[];
  defendKeys: PatternKey[];
}

/** 本地模式评分：同时评估进攻价值与封堵价值，不做全局搜索。 */
export function computeComputerMove(board: Board, history: Move[]): Cell {
  const center = (BOARD_SIZE - 1) / 2;
  const scored: ScoredCell[] = candidateMoves(board, history).map((move) => {
    const attack = evaluateMove(board, move.row, move.col, WHITE);
    const defend = evaluateMove(board, move.row, move.col, BLACK);
    const centerScore = Math.max(0, 13 - Math.hypot(move.row - center, move.col - center)) * 18;
    let score = attack.score * 1.08 + defend.score * 1.04 + centerScore + localDensity(board, move.row, move.col) * 34;
    const attackWins = attack.keys.includes('win');
    const defendWins = defend.keys.includes('win');
    const fourKeys: PatternKey[] = ['openFour', 'rushFour', 'gapFour'];
    if (attackWins) score = 520000 + attack.score;
    else if (defendWins) score = 480000 + defend.score;
    else {
      if (defend.keys.some((key) => fourKeys.includes(key))) score += 94000;
      if (attack.keys.some((key) => fourKeys.includes(key))) score += 72000;
      if (defend.keys.filter((key) => key === 'openThree').length >= 2) score += 24000;
      if (attack.keys.filter((key) => key === 'openThree').length >= 2) score += 20000;
    }
    return { ...move, score: score + Math.random() * 70, attackKeys: attack.keys, defendKeys: defend.keys };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top) return { row: center, col: center };
  const forced = top.attackKeys.includes('win') || top.defendKeys.includes('win') || top.score > 260000;
  const pool = forced ? [top] : scored.filter((item, index) => index < 3 && item.score >= top.score * 0.88);
  const picked = pool[Math.floor(Math.random() * pool.length)] ?? top;
  return { row: picked.row, col: picked.col };
}

export interface DemoPosition {
  board: Board;
  history: Move[];
  lastMove: Move;
  winLine: Cell[];
}

/** 示例棋局：黑方在斜 ↘ 方向连成五子，用于课堂直接跳到终局。 */
export function buildDemoPosition(): DemoPosition {
  const board = createBoard();
  const history: Move[] = [];
  const black: Array<[number, number]> = [[4, 3], [5, 4], [6, 5], [7, 6], [8, 7], [5, 8], [7, 4], [8, 5], [9, 5]];
  const white: Array<[number, number]> = [[4, 6], [5, 6], [6, 7], [7, 8], [8, 8], [9, 6], [6, 3], [10, 5]];
  black.forEach(([row, col]) => {
    board[row][col] = BLACK;
    history.push({ row, col, player: BLACK });
  });
  white.forEach(([row, col]) => {
    board[row][col] = WHITE;
    history.push({ row, col, player: WHITE });
  });
  const winLine = black.slice(0, 5).map(([row, col]) => ({ row, col }));
  return { board, history, lastMove: { row: 8, col: 7, player: BLACK }, winLine };
}
