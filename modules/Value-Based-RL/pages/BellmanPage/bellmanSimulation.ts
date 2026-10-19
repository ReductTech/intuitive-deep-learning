import { ACTIONS, BLOCKED, DELTAS, GOAL, GRID, UPPER_ROUTE, keyOf, type Position } from '../../model';
import { GAMMA, TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';

export { GAMMA, TRAP };
export const BELLMAN_ROUTE = UPPER_ROUTE;
export type StateValues = Record<string, number>;
export const WAREHOUSE_STATES: Position[] = Array.from({ length: GRID * GRID }, (_, index) => ({
  row: Math.floor(index / GRID), col: index % GRID,
})).filter(position => !BLOCKED.includes(keyOf(position)));
export const isTerminal = (position: Position) => [keyOf(GOAL), keyOf(TRAP)].includes(keyOf(position));
export const emptyValues = (): StateValues => Object.fromEntries(WAREHOUSE_STATES.map(position => [keyOf(position), 0]));

export function actionBackups(position: Position, values: StateValues) {
  return ACTIONS.map((label, action) => {
    const result = warehouseStep(position, action);
    // Rewards are paid on entry. A terminal state never adds another future reward.
    const nextValue = result.done ? 0 : values[keyOf(result.next)] ?? 0;
    return { label, action, ...result, nextValue, discounted: GAMMA * nextValue, target: result.reward + GAMMA * nextValue };
  });
}

export interface LocalBellman {
  cursor: number;
  values: StateValues;
  updates: number;
  applied: boolean;
}
export const createLocalBellman = (): LocalBellman => ({
  cursor: BELLMAN_ROUTE.length - 2, values: { [keyOf(GOAL)]: 0 }, updates: 0, applied: false,
});
export function localBackup(state: LocalBellman) {
  const current = BELLMAN_ROUTE[state.cursor];
  const next = BELLMAN_ROUTE[state.cursor + 1];
  const action = DELTAS.findIndex(delta => current.row + delta.row === next.row && current.col + delta.col === next.col);
  const backup = actionBackups(current, state.values)[action];
  return { current, ...backup, before: state.applied ? 0 : state.values[keyOf(current)] ?? 0 };
}
export function applyLocalBackup(state: LocalBellman): LocalBellman {
  if (state.applied) return state;
  const backup = localBackup(state);
  return { ...state, values: { ...state.values, [keyOf(backup.current)]: backup.target }, updates: state.updates + 1, applied: true };
}
export function moveLocalBackward(state: LocalBellman): LocalBellman {
  return state.applied && state.cursor > 0 ? { ...state, cursor: state.cursor - 1, applied: false } : state;
}

export interface BellmanPropagation {
  round: number;
  values: StateValues;
  previous: StateValues;
  changed: string[];
  delta: number;
}
export function createPropagation(): BellmanPropagation {
  const values = emptyValues();
  return { round: 0, values, previous: values, changed: [], delta: Infinity };
}
/** A synchronous sweep: every backup reads the same previous round. */
export function propagateRound(state: BellmanPropagation): BellmanPropagation {
  const values: StateValues = {};
  const changed: string[] = [];
  let delta = 0;
  for (const position of WAREHOUSE_STATES) {
    const key = keyOf(position);
    const value = isTerminal(position) ? 0 : Math.max(...actionBackups(position, state.values).map(backup => backup.target));
    values[key] = value;
    const difference = Math.abs(value - state.values[key]);
    delta = Math.max(delta, difference);
    if (difference > 1e-9) changed.push(key);
  }
  return { round: state.round + 1, values, previous: state.values, changed, delta };
}

/** Shortest transition distance to delivery, excluding the terminal trap. */
export function deliveryDistances(): Record<string, number> {
  const distances: Record<string, number> = { [keyOf(GOAL)]: 0 };
  for (let distance = 1; distance <= WAREHOUSE_STATES.length; distance++) {
    const frontier = WAREHOUSE_STATES.filter(position => !isTerminal(position)
      && distances[keyOf(position)] === undefined
      && actionBackups(position, {}).some(backup => !backup.trapped && distances[keyOf(backup.next)] === distance - 1));
    if (!frontier.length) break;
    for (const position of frontier) distances[keyOf(position)] = distance;
  }
  return distances;
}
