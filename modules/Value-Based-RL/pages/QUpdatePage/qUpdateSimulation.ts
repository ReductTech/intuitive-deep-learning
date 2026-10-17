import { GOAL, keyOf, tdTarget, updateQ, type Position, type QTable } from '../../model';
import {
  ALPHA, GAMMA, TRAP, advanceSimulation, createSimulation, warehouseStep,
} from '../QLearningLoopPage/qLearningSimulation';

export { ALPHA, GAMMA, TRAP };
export const PRETRAINING_STEPS = 300;
export const INITIAL_POSITION: Position = { row: 3, col: 5 };
export const INITIAL_ACTION = 2;
export const isTerminal = (position: Position) => keyOf(position) === keyOf(GOAL) || keyOf(position) === keyOf(TRAP);

export interface QUpdateLab {
  q: QTable;
  position: Position;
  updates: number;
}

/** Run the exact slide 13 simulation. These are estimates during learning. */
export function createQUpdateLab(): QUpdateLab {
  let simulation = createSimulation();
  for (let step = 0; step < PRETRAINING_STEPS; step++) simulation = advanceSimulation(simulation);
  return { q: simulation.q, position: INITIAL_POSITION, updates: 0 };
}

export function observeStep(q: QTable, from: Position, action: number) {
  if (isTerminal(from)) throw new Error('A terminal state cannot start another transition.');
  if (!Number.isInteger(action) || action < 0 || action > 3) throw new Error('Unknown warehouse action.');
  const result = warehouseStep(from, action);
  const before = [...q[keyOf(from)]];
  const nextQ = [...q[keyOf(result.next)]];
  const nextMax = result.done ? 0 : Math.max(...nextQ);
  const target = tdTarget(result.reward, GAMMA, nextMax, result.done);
  const error = target - before[action];
  const after = [...before];
  after[action] = updateQ(before[action], target, ALPHA);
  return {
    from, action, ...result, before, after, nextQ, nextMax, target, error,
    adjustment: ALPHA * error,
    tableBefore: q,
    tableAfter: { ...q, [keyOf(from)]: after },
  };
}
export type SingleQUpdate = ReturnType<typeof observeStep>;
