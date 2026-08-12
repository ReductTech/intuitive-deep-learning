import type { Board, Cell, Move, Player } from './gomokuEngine';

export interface GomokuSessionSnapshot {
  board: Board;
  moveHistory: Move[];
  winner: Player;
  winLine: Cell[];
}
