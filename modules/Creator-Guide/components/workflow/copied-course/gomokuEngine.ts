export const BOARD_SIZE = 15;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export type Stone = typeof EMPTY | typeof BLACK | typeof WHITE;
export type Player = typeof BLACK | typeof WHITE;
export type Board = Stone[][];
export type GomokuDifficulty = 'easy' | 'medium' | 'hard';

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

function wouldCompleteFive(board: Board, row: number, col: number, player: Player): boolean {
  return DIRECTIONS.some(({ dr, dc }) => {
    let length = 1;
    for (const sign of [-1, 1]) {
      for (let step = 1; step < 5; step += 1) {
        const nextRow = row + dr * step * sign;
        const nextCol = col + dc * step * sign;
        if (!inBounds(nextRow, nextCol) || board[nextRow][nextCol] !== player) break;
        length += 1;
      }
    }
    return length >= 5;
  });
}

/** 只统计现在确实空着、下一手落下就能成五的位置，包含跳四和边界情况。 */
export function immediateWinningMoves(board: Board, player: Player, stopAfter = BOARD_SIZE * BOARD_SIZE): Cell[] {
  const moves: Cell[] = [];
  const candidates = new Set<number>();
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== player) continue;
      for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
        const nextRow = row + dr, nextCol = col + dc;
        if (inBounds(nextRow, nextCol) && board[nextRow][nextCol] === EMPTY) candidates.add(nextRow * BOARD_SIZE + nextCol);
      }
    }
  }
  for (const index of [...candidates].sort((a, b) => a - b)) {
    const row = Math.floor(index / BOARD_SIZE), col = index % BOARD_SIZE;
    if (!wouldCompleteFive(board, row, col, player)) continue;
    moves.push({ row, col });
    if (moves.length >= stopAfter) return moves;
  }
  return moves;
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

/** 一手后产生两个不同的成五点，普通的一手封堵无法同时占住两点。 */
export function forkMoves(board: Board, history: Move[], player: Player, stopAfter = BOARD_SIZE * BOARD_SIZE): Cell[] {
  const forks: Cell[] = [];
  const trial = cloneBoard(board);
  for (const move of candidateMoves(board, history)) {
    trial[move.row][move.col] = player;
    const winningCount = immediateWinningMoves(trial, player, 2).length;
    trial[move.row][move.col] = EMPTY;
    if (winningCount < 2) continue;
    forks.push(move);
    if (forks.length >= stopAfter) break;
  }
  return forks;
}

/** 模拟落子、逐个封住后续活四点，再确认另一方向是否仍能形成双重成五点。 */
export function crossingThreatMoves(board: Board, history: Move[], player: Player, stopAfter = BOARD_SIZE * BOARD_SIZE): Cell[] {
  const opponent = otherPlayer(player);
  const trial = cloneBoard(board);
  const threats: Cell[] = [];
  for (const move of candidateMoves(board, history)) {
    let nearbyOwnStones = 0;
    for (let dr = -2; dr <= 2; dr += 1) for (let dc = -2; dc <= 2; dc += 1) {
      if (inBounds(move.row + dr, move.col + dc) && board[move.row + dr][move.col + dc] === player) nearbyOwnStones += 1;
    }
    if (nearbyOwnStones < 2) continue;
    trial[move.row][move.col] = player;
    const nextHistory: Move[] = [...history, { ...move, player }];
    if (immediateWinningMoves(trial, opponent, 1).length) { trial[move.row][move.col] = EMPTY; continue; }
    const extensions = forkMoves(trial, nextHistory, player);
    const directions = new Set<number>();
    for (const extension of extensions) {
      const dr = extension.row - move.row;
      const dc = extension.col - move.col;
      if (Math.max(Math.abs(dr), Math.abs(dc)) > 4) continue;
      if (dr === 0) directions.add(0);
      else if (dc === 0) directions.add(1);
      else if (Math.abs(dr) === Math.abs(dc)) directions.add(Math.sign(dr) === Math.sign(dc) ? 2 : 3);
    }
    if (directions.size >= 2) {
      const survivesEachDirectBlock = extensions.every((block) => {
        trial[block.row][block.col] = opponent;
        const defenderHistory: Move[] = [...nextHistory, { ...block, player: opponent }];
        const stillHasFork = forkMoves(trial, defenderHistory, player, 1).length > 0;
        trial[block.row][block.col] = EMPTY;
        return stillHasFork;
      });
      if (survivesEachDirectBlock) threats.push(move);
    }
    trial[move.row][move.col] = EMPTY;
    if (threats.length >= stopAfter) break;
  }
  return threats;
}

interface ScoredCell extends Cell {
  score: number;
  attackKeys: PatternKey[];
  defendKeys: PatternKey[];
}

function scoreCandidates(board: Board, history: Move[], includeRandomness: boolean): ScoredCell[] {
  const center = (BOARD_SIZE - 1) / 2;
  return candidateMoves(board, history).map((move) => {
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
    return { ...move, score: score + (includeRandomness ? Math.random() * 70 : 0), attackKeys: attack.keys, defendKeys: defend.keys };
  }).sort((a, b) => b.score - a.score);
}

function boardHeuristic(board: Board): number {
  let score = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== EMPTY) continue;
      score += evaluateMove(board, row, col, WHITE).score * 1.08;
      score -= evaluateMove(board, row, col, BLACK).score * 1.04;
    }
  }
  return score;
}

function searchReply(board: Board, history: Move[], depth: number): number {
  if (depth <= 0) return boardHeuristic(board);
  const replies = scoreCandidates(board, history, false).slice(0, 10);
  if (!replies.length) return boardHeuristic(board);
  let best = Number.POSITIVE_INFINITY;
  for (const reply of replies) {
    const placed = placeStone(board, reply, BLACK);
    if (placed.winLine.length >= 5) return -520000;
    const nextHistory: Move[] = [...history, { row: reply.row, col: reply.col, player: BLACK }];
    const followUps = depth > 1 ? scoreCandidates(placed.board, nextHistory, false).slice(0, 5) : [];
    const replyValue = followUps.length
      ? Math.max(...followUps.map((followUp) => {
        const next = placeStone(placed.board, followUp, WHITE);
        return next.winLine.length >= 5 ? 520000 : followUp.score;
      }))
      : boardHeuristic(placed.board);
    best = Math.min(best, replyValue);
  }
  return best;
}

/** 用模式评分模拟不同难度：简单看当前局面，中等预判一次，困难会先看对手的反击。 */
export function computeComputerMove(board: Board, history: Move[], difficulty: GomokuDifficulty = 'easy'): Cell {
  const center = Math.floor(BOARD_SIZE / 2);
  const scored = scoreCandidates(board, history, difficulty === 'easy');

  const top = scored[0];
  if (!top) return { row: center, col: center };
  if (difficulty !== 'easy') {
    const depth = difficulty === 'hard' ? 2 : 1;
    const lookahead = scored.slice(0, difficulty === 'hard' ? 14 : 10).map((move) => {
      const placed = placeStone(board, move, WHITE);
      if (placed.winLine.length >= 5) return { move, score: 520000 + move.score };
      const nextHistory: Move[] = [...history, { row: move.row, col: move.col, player: WHITE }];
      return { move, score: move.score + searchReply(placed.board, nextHistory, depth) * 0.05 };
    }).sort((a, b) => b.score - a.score);
    return lookahead[0]?.move ?? top;
  }
  const forced = top.attackKeys.includes('win') || top.defendKeys.includes('win') || top.score > 260000;
  const pool = forced ? [top] : scored.filter((item, index) => index < 3 && item.score >= top.score * 0.88);
  const picked = pool[Math.floor(Math.random() * pool.length)] ?? top;
  return { row: picked.row, col: picked.col };
}

const HINT_WIN_SCORE = 10_000_000;

function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

/** 搜索只扩展最有价值的落点；确定的成五点及必须封堵的点始终保留。 */
function hintSearchMoves(board: Board, history: Move[], player: Player, limit: number): Cell[] {
  const ownWins = immediateWinningMoves(board, player);
  if (ownWins.length) return ownWins;
  const opponentWins = immediateWinningMoves(board, otherPlayer(player));
  if (opponentWins.length) return opponentWins;
  return candidateMoves(board, history).map((move) => {
    const attack = evaluateMove(board, move.row, move.col, player).score;
    const defense = evaluateMove(board, move.row, move.col, otherPlayer(player)).score;
    return { ...move, score: attack * 1.12 + defense + localDensity(board, move.row, move.col) * 24 };
  }).sort((a, b) => b.score - a.score).slice(0, limit);
}

function hintPositionScore(board: Board, history: Move[], nextPlayer: Player): number {
  if (immediateWinningMoves(board, nextPlayer, 1).length) return nextPlayer === BLACK ? HINT_WIN_SCORE / 2 : -HINT_WIN_SCORE / 2;
  let blackBest = 0;
  let whiteBest = 0;
  for (const move of candidateMoves(board, history)) {
    blackBest = Math.max(blackBest, evaluateMove(board, move.row, move.col, BLACK).score);
    whiteBest = Math.max(whiteBest, evaluateMove(board, move.row, move.col, WHITE).score);
  }
  return blackBest * 1.08 - whiteBest * 1.1;
}

/** 黑白交替搜索，包含精确的终局判断和 alpha-beta 剪枝。 */
function searchHintLine(board: Board, history: Move[], player: Player, depth: number, alpha: number, beta: number): number {
  if (depth === 0) return hintPositionScore(board, history, player);
  const moves = hintSearchMoves(board, history, player, depth >= 3 ? 8 : depth === 2 ? 6 : 4);
  if (!moves.length) return 0;
  let best = player === BLACK ? -Infinity : Infinity;
  for (const move of moves) {
    board[move.row][move.col] = player;
    history.push({ ...move, player });
    const won = wouldCompleteFive(board, move.row, move.col, player);
    const value = won ? (player === BLACK ? HINT_WIN_SCORE + depth : -HINT_WIN_SCORE - depth)
      : searchHintLine(board, history, otherPlayer(player), depth - 1, alpha, beta);
    history.pop();
    board[move.row][move.col] = EMPTY;
    if (player === BLACK) {
      best = Math.max(best, value);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, value);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export interface HumanAdvice {
  cell: Cell;
  mode: 'attack' | 'defense';
}

/** 给黑棋的建议：先找确定的胜负手，再搜索双方后续应手。不会改变白棋的难度。 */
export function computeHumanAdvice(board: Board, history: Move[]): HumanAdvice {
  const center = Math.floor(BOARD_SIZE / 2);
  const ownWins = immediateWinningMoves(board, BLACK);
  if (ownWins.length) return { cell: ownWins[0], mode: 'attack' };
  const opponentWins = immediateWinningMoves(board, WHITE);
  if (opponentWins.length) return { cell: opponentWins[0], mode: 'defense' };
  const ownForks = forkMoves(board, history, BLACK);
  if (ownForks.length) return { cell: ownForks[0], mode: 'attack' };
  const opponentForks = forkMoves(board, history, WHITE);
  const opponentCrossings = opponentForks.length ? [] : crossingThreatMoves(board, history, WHITE);
  const urgentBlocks = opponentForks.length ? opponentForks : opponentCrossings;
  const ranked = hintSearchMoves(board, history, BLACK, 16);
  const rootMoves = urgentBlocks.length
    ? urgentBlocks
    : ranked.length ? ranked : [{ row: center, col: center }];
  const trial = cloneBoard(board);
  const line = history.slice();
  let bestMove = rootMoves[0];
  let bestValue = -Infinity;
  let alpha = -Infinity;
  for (const move of rootMoves) {
    trial[move.row][move.col] = BLACK;
    line.push({ ...move, player: BLACK });
    const value = searchHintLine(trial, line, WHITE, 3, alpha, Infinity)
      + evaluateMove(board, move.row, move.col, BLACK).score * 0.004;
    line.pop();
    trial[move.row][move.col] = EMPTY;
    if (value > bestValue) { bestValue = value; bestMove = move; }
    alpha = Math.max(alpha, bestValue);
  }
  const blocksThreat = urgentBlocks.some((move) => sameCell(move, bestMove));
  const defensiveWeight = evaluateMove(board, bestMove.row, bestMove.col, WHITE).score;
  const attackingWeight = evaluateMove(board, bestMove.row, bestMove.col, BLACK).score;
  return { cell: bestMove, mode: blocksThreat || defensiveWeight > attackingWeight * 1.5 ? 'defense' : 'attack' };
}

export interface DemoPosition {
  board: Board;
  history: Move[];
  lastMove: Move;
  winLine: Cell[];
}

/** 示例棋局：中心开局、双方交替攻防，黑方最终以开放的斜线两端择一连五。 */
export function buildDemoPosition(): DemoPosition {
  const board = createBoard();
  const history: Move[] = [];
  const moves: Array<[number, number]> = [
    [7, 7], [7, 8], [7, 6], [8, 6], [6, 6], [8, 7],
    [6, 7], [5, 7], [9, 6], [9, 7], [5, 5], [7, 5],
    [5, 8], [6, 8], [4, 7], [9, 5], [8, 9], [6, 5],
    [8, 8], [4, 4], [9, 9],
  ];

  moves.forEach(([row, col], index) => {
    const player = index % 2 === 0 ? BLACK : WHITE;
    board[row][col] = player;
    history.push({ row, col, player });
  });

  const lastMove = history[history.length - 1];
  const winLine = findWinLine(board, lastMove.row, lastMove.col, BLACK);
  return { board, history, lastMove, winLine };
}
