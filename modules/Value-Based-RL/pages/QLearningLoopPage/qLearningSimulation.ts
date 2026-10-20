import {
  START, GOAL, keyOf, emptyQ, transition, chooseAction, seededRandom,
  type Position, type QTable,
} from '../../model';

/**
 * Adapted from the stepOnce, runEpisode and greedyReaches routines in
 * https://nndl.ai/viz/q-learning/ (邱锡鹏 / 蒲公英书系列).
 * Changes: the course's warehouse and action order, immutable React state,
 * recorded TD updates, random tie breaking, and explicit time-limit resets.
 */
export const TRAP: Position = { row: 6, col: 3 };
export const ALPHA = 0.5;
export const GAMMA = 0.9;
export const EPSILON = 0.3;
export const EPISODE_LIMIT = 80;

export function warehouseStep(position: Position, action: number) {
  const result = transition(position, action);
  const trapped = keyOf(result.next) === keyOf(TRAP);
  return { ...result, reward: trapped ? -10 : result.reward, done: result.done || trapped, trapped };
}

export interface LearningUpdate {
  from: Position;
  action: number;
  next: Position;
  reward: number;
  done: boolean;
  trapped: boolean;
  hit: boolean;
  truncated: boolean;
  before: number[];
  after: number[];
  nextMax: number;
  target: number;
}

export interface LearningSimulation {
  q: QTable;
  visits: Record<string, number>;
  position: Position;
  route: Position[];
  updates: number;
  episodes: number;
  deliveries: number;
  traps: number;
  episodeSteps: number;
  restart: boolean;
  randomSeed: number;
  last: LearningUpdate | null;
}

export function createSimulation(): LearningSimulation {
  return {
    q: emptyQ(), visits: {}, position: START, route: [START], updates: 0,
    episodes: 0, deliveries: 0, traps: 0, episodeSteps: 0, restart: false,
    randomSeed: 1, last: null,
  };
}

/** One actual interaction updates exactly one Q(s,a), including at terminals. */
export function advanceSimulation(state: LearningSimulation): LearningSimulation {
  const from = state.restart ? START : state.position;
  const steps = state.restart ? 0 : state.episodeSteps;
  const random = seededRandom(state.randomSeed);
  const action = chooseAction(state.q[keyOf(from)], EPSILON, random);
  const result = warehouseStep(from, action);
  const before = state.q[keyOf(from)];
  const nextMax = Math.max(...state.q[keyOf(result.next)]);
  // NNDL stepOnce: a terminal transition has no bootstrapped future value.
  const target = result.done ? result.reward : result.reward + GAMMA * nextMax;
  const after = [...before];
  after[action] += ALPHA * (target - after[action]);
  const truncated = !result.done && steps + 1 >= EPISODE_LIMIT;
  const restart = result.done || truncated;
  return {
    ...state,
    q: { ...state.q, [keyOf(from)]: after },
    visits: { ...state.visits, [keyOf(from)]: (state.visits[keyOf(from)] ?? 0) + 1 },
    position: result.next,
    route: [...(state.restart ? [START] : state.route), result.next].slice(-24),
    updates: state.updates + 1,
    episodes: state.episodes + Number(restart),
    deliveries: state.deliveries + Number(result.done && !result.trapped),
    traps: state.traps + Number(result.trapped),
    episodeSteps: steps + 1,
    restart,
    randomSeed: Math.floor(random() * 4294967296),
    last: { from, action, ...result, truncated, before: [...before], after, nextMax, target },
  };
}

export function mapEstimates(state: LearningSimulation) {
  const values: Record<string, number> = {};
  const policy: Record<string, number[]> = {};
  for (const key of Object.keys(state.visits)) {
    if (key === keyOf(GOAL) || key === keyOf(TRAP)) continue;
    const row = state.q[key];
    const max = Math.max(...row);
    values[key] = max;
    policy[key] = row.flatMap((value, action) => Math.abs(value - max) < 1e-8 ? [action] : []);
  }
  return { values, policy };
}

/** NNDL greedyReaches, expanded to return the route and the stopping reason. */
export function traceGreedyPolicy(q: QTable) {
  let position = START;
  const route = [position];
  const seen = new Set<string>();
  const random = seededRandom(31);
  for (let step = 0; step < EPISODE_LIMIT; step++) {
    if (seen.has(keyOf(position))) return { route, outcome: 'loop' as const };
    seen.add(keyOf(position));
    const action = chooseAction(q[keyOf(position)], 0, random);
    const result = warehouseStep(position, action);
    route.push(result.next);
    if (result.done) return { route, outcome: result.trapped ? 'trap' as const : 'delivered' as const };
    if (result.hit) return { route, outcome: 'collision' as const };
    position = result.next;
  }
  return { route, outcome: 'limit' as const };
}

