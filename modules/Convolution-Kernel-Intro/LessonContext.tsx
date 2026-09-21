import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { emitTelemetry } from '../shared/react';
import {
  BLACK,
  BOARD_SIZE,
  EMPTY,
  WHITE,
  buildDemoPosition,
  type Board,
  type Cell,
  type Stone,
} from './model/gomokuEngine';

/** 一局棋的终局快照：解释判胜与 0/1 矩阵都基于这一盘棋继续讲。 */
export interface GomokuOutcome {
  board: Board;
  winLine: Cell[];
  winner: Stone;
  moveCount: number;
  /** played = 学习者真的下完一局；demo = 直接跳到后面的页面时用的示例终局。 */
  source: 'played' | 'demo';
}

interface GomokuLessonValue {
  outcome: GomokuOutcome;
  recordOutcome: (outcome: GomokuOutcome | null) => void;
}

const STORAGE_KEY = 'convolution-kernel-intro:gomoku-outcome';
const STATE_KEY = 'gomoku-outcome';

const GomokuLessonContext = createContext<GomokuLessonValue | null>(null);

/** 直接进入后面的页面时，用同一个示例终局兜底，保证整条课有棋可看。 */
export function demoOutcome(): GomokuOutcome {
  const demo = buildDemoPosition();
  return { board: demo.board, winLine: demo.winLine, winner: BLACK, moveCount: demo.history.length, source: 'demo' };
}

function normalizeBoard(value: unknown): Board | null {
  if (!Array.isArray(value) || value.length !== BOARD_SIZE) return null;
  const rows: Board = [];
  for (const row of value) {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) return null;
    const cells: Stone[] = [];
    for (const cell of row) {
      if (cell !== EMPTY && cell !== BLACK && cell !== WHITE) return null;
      cells.push(cell);
    }
    rows.push(cells);
  }
  return rows;
}

function normalizeCells(value: unknown): Cell[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const cells: Cell[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const row = Number((item as Partial<Cell>).row);
    const col = Number((item as Partial<Cell>).col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
    cells.push({ row, col });
  }
  return cells;
}

function normalizeOutcome(value: unknown): GomokuOutcome | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<GomokuOutcome>;
  const board = normalizeBoard(candidate.board);
  const winLine = normalizeCells(candidate.winLine);
  if (!board || !winLine) return null;
  if (candidate.winner !== BLACK && candidate.winner !== WHITE) return null;
  const moveCount = Number(candidate.moveCount);
  if (!Number.isFinite(moveCount) || moveCount < 0) return null;
  return {
    board,
    winLine,
    winner: candidate.winner,
    moveCount: Math.round(moveCount),
    source: candidate.source === 'played' ? 'played' : 'demo',
  };
}

function readStored(): GomokuOutcome | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeOutcome(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeStored(outcome: GomokuOutcome | null) {
  if (typeof window === 'undefined') return;
  try {
    if (outcome) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(outcome));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 隐私模式下可能无法写入，此时后续页面退回示例终局。
  }
}

export function GomokuLessonProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<GomokuOutcome | null>(readStored);

  const recordOutcome = useCallback((next: GomokuOutcome | null) => {
    const normalized = next ? normalizeOutcome(next) : null;
    writeStored(normalized);
    setStored(normalized);
    if (!normalized) return;
    emitTelemetry('gomoku_outcome_recorded', null, {
      state_key: STATE_KEY,
      source: normalized.source,
      winner: normalized.winner,
      move_count: normalized.moveCount,
      win_line: normalized.winLine,
    });
  }, []);

  const value = useMemo<GomokuLessonValue>(() => ({
    outcome: stored ?? demoOutcome(),
    recordOutcome,
  }), [recordOutcome, stored]);

  return <GomokuLessonContext.Provider value={value}>{children}</GomokuLessonContext.Provider>;
}

export function useGomokuOutcome() {
  const context = useContext(GomokuLessonContext);
  if (!context) throw new Error('useGomokuOutcome must be used inside GomokuLessonProvider');
  return context;
}
