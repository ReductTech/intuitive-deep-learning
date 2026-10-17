import { START, chooseAction, huber, keyOf, seededRandom, tdTarget, type Position } from './model';
import { EPISODE_LIMIT, GAMMA, warehouseStep } from './pages/QLearningLoopPage/qLearningSimulation';
import { collectReplayExperience, createReplaySimulation, type ReplayExperience } from './pages/ReplayBufferPage/replaySimulation';

// A small, real neural Q function: one-hot position, 24 shared ReLU units, four action outputs.
// Position encoding gives the warehouse enough representational capacity without a pre-trained policy.
export const DQN_HIDDEN = 24;
const INPUTS = 49, HIDDEN_BIAS = INPUTS * DQN_HIDDEN;
const OUTPUT_WEIGHTS = HIDDEN_BIAS + DQN_HIDDEN, OUTPUT_BIAS = OUTPUT_WEIGHTS + 4 * DQN_HIDDEN;
const PARAMS = OUTPUT_BIAS + 4;
export type DqnNetwork = Float64Array;
export interface DqnOptimizer { mean: Float64Array; variance: Float64Array; step: number; }
export const DQN_CAPACITY = 1024, DQN_BATCH = 16, DQN_SYNC = 100;
export const dqnEpsilon = (steps: number) => Math.max(.15, 1 - steps / 5000);
export function createDqnNetwork(): DqnNetwork {
  const random = seededRandom(71);
  return Float64Array.from({ length: PARAMS }, (_, index) => index < HIDDEN_BIAS ? (random() - .5) * .4
    : index < OUTPUT_WEIGHTS ? .2 : index < OUTPUT_BIAS ? (random() - .5) * .2 : 0);
}
export const createDqnOptimizer = (): DqnOptimizer => ({ mean: new Float64Array(PARAMS), variance: new Float64Array(PARAMS), step: 0 });
export function dqnForward(network: DqnNetwork, position: Position) {
  const state = position.row * 7 + position.col;
  const hidden = Array.from({ length: DQN_HIDDEN }, (_, j) => Math.max(0, network[j * INPUTS + state] + network[HIDDEN_BIAS + j]));
  const values = Array.from({ length: 4 }, (_, action) => hidden.reduce((value, activation, j) =>
    value + network[OUTPUT_WEIGHTS + action * DQN_HIDDEN + j] * activation, network[OUTPUT_BIAS + action]));
  return { state, hidden, values };
}
export const dqnTarget = (network: DqnNetwork, entry: ReplayExperience) => tdTarget(entry.reward, GAMMA,
  Math.max(...dqnForward(network, entry.next).values), entry.done);
export interface DqnUpdate {
  ids: number[]; targets: number[]; before: number[]; after: number[]; lossBefore: number; lossAfter: number;
}
/** Mean Huber semi-gradient. All targets and gradients read pre-update parameters; Adam updates only online weights. */
export function trainDqnBatch(online: DqnNetwork, target: DqnNetwork, optimizer: DqnOptimizer, batch: readonly ReplayExperience[]) {
  const gradient = new Float64Array(PARAMS), targets = batch.map(entry => dqnTarget(target, entry));
  const before = batch.map((entry, i) => {
    const { state, hidden, values } = dqnForward(online, entry.s);
    const delta = Math.max(-1, Math.min(1, values[entry.action] - targets[i])) / batch.length;
    gradient[OUTPUT_BIAS + entry.action] += delta;
    for (let j = 0; j < DQN_HIDDEN; j++) {
      gradient[OUTPUT_WEIGHTS + entry.action * DQN_HIDDEN + j] += delta * hidden[j];
      if (hidden[j] > 0) {
        const back = delta * online[OUTPUT_WEIGHTS + entry.action * DQN_HIDDEN + j];
        gradient[j * INPUTS + state] += back; gradient[HIDDEN_BIAS + j] += back;
      }
    }
    return values[entry.action];
  });
  const network = online.slice(), mean = optimizer.mean.slice(), variance = optimizer.variance.slice(), step = optimizer.step + 1;
  const meanCorrection = 1 - .9 ** step, varianceCorrection = 1 - .999 ** step;
  for (let i = 0; i < PARAMS; i++) {
    mean[i] = .9 * mean[i] + .1 * gradient[i]; variance[i] = .999 * variance[i] + .001 * gradient[i] ** 2;
    network[i] -= .003 * (mean[i] / meanCorrection) / (Math.sqrt(variance[i] / varianceCorrection) + 1e-8);
  }
  const after = batch.map(entry => dqnForward(network, entry.s).values[entry.action]);
  return { network, optimizer: { mean, variance, step }, update: { ids: batch.map(entry => entry.id), targets, before, after,
    lossBefore: before.reduce((sum, value, i) => sum + huber(value - targets[i]), 0) / batch.length,
    lossAfter: after.reduce((sum, value, i) => sum + huber(value - targets[i]), 0) / batch.length } satisfies DqnUpdate };
}

export interface TargetObservation { step: number; sync: boolean; predictions: number[]; moving: number[]; frozen: number[]; }
export interface TargetExperiment {
  online: DqnNetwork; target: DqnNetwork; optimizer: DqnOptimizer; batch: ReplayExperience[];
  updates: number; syncs: number; lastSync: number; history: TargetObservation[]; lastUpdate: DqnUpdate | null;
}
function observeTarget(state: Omit<TargetExperiment, 'history'>, sync = false): TargetObservation {
  return { step: state.updates, sync, predictions: state.batch.map(entry => dqnForward(state.online, entry.s).values[entry.action]),
    moving: state.batch.map(entry => dqnTarget(state.online, entry)), frozen: state.batch.map(entry => dqnTarget(state.target, entry)) };
}
export function createTargetExperiment(): TargetExperiment {
  let rollout = createReplaySimulation(); const records: ReplayExperience[] = [];
  // A delivered route, followed by a real trap episode. No reward or transition is hand-authored.
  for (const action of [0, 1, 1, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1]) {
    rollout = collectReplayExperience(rollout, action); records.push(rollout.latest!);
  }
  const online = createDqnNetwork();
  const state = { online, target: online.slice(), optimizer: createDqnOptimizer(), batch: [records[8], records[9], records[11], records[12]],
    updates: 0, syncs: 0, lastSync: 0, lastUpdate: null };
  return { ...state, history: [observeTarget(state)] };
}
export function updateTargetExperiment(state: TargetExperiment, count = 1): TargetExperiment {
  let next = state;
  for (let i = 0; i < count; i++) {
    const trained = trainDqnBatch(next.online, next.target, next.optimizer, next.batch);
    next = { ...next, online: trained.network, optimizer: trained.optimizer, updates: next.updates + 1, lastUpdate: trained.update };
    next = { ...next, history: [...next.history, observeTarget(next)].slice(-161) };
  }
  return next;
}
export function syncTargetExperiment(state: TargetExperiment): TargetExperiment {
  const next = { ...state, target: state.online.slice(), syncs: state.syncs + 1, lastSync: state.updates };
  return { ...next, history: [...state.history, observeTarget(next, true)].slice(-161) };
}

export interface DqnSimulation {
  online: DqnNetwork; target: DqnNetwork; optimizer: DqnOptimizer;
  position: Position; episode: number; episodeSteps: number; restart: boolean;
  collected: number; collectorSeed: number; sampleSeed: number; slots: (ReplayExperience | null)[]; nextSlot: number;
  latest: ReplayExperience | null; batch: ReplayExperience[]; draws: number; updates: number; syncs: number; lastSync: number;
  deliveries: number; traps: number; lastUpdate: DqnUpdate | null;
}
export function createDqnSimulation(): DqnSimulation {
  const online = createDqnNetwork();
  return { online, target: online.slice(), optimizer: createDqnOptimizer(), position: START, episode: 1, episodeSteps: 0, restart: false,
    collected: 0, collectorSeed: 29, sampleSeed: 73, slots: Array(DQN_CAPACITY).fill(null), nextSlot: 0,
    latest: null, batch: [], draws: 0, updates: 0, syncs: 0, lastSync: 0, deliveries: 0, traps: 0, lastUpdate: null };
}
export function collectDqnExperience(state: DqnSimulation, manualAction?: number): DqnSimulation {
  const s = state.restart ? START : state.position, episode = state.episode + Number(state.restart), step = state.restart ? 1 : state.episodeSteps + 1;
  const random = seededRandom(state.collectorSeed);
  const action = manualAction ?? chooseAction(dqnForward(state.online, s).values, dqnEpsilon(state.collected), random);
  const result = warehouseStep(s, action), truncated = !result.done && step >= EPISODE_LIMIT;
  const entry: ReplayExperience = { id: state.collected + 1, slot: state.nextSlot, episode, step, s: { ...s }, action,
    reward: result.reward, next: { ...result.next }, done: result.done, hit: result.hit, trapped: result.trapped, truncated };
  const slots = [...state.slots]; slots[state.nextSlot] = entry;
  return { ...state, position: entry.next, episode, episodeSteps: step, restart: result.done || truncated,
    collected: entry.id, collectorSeed: Math.floor(random() * 4294967296), slots, nextSlot: (state.nextSlot + 1) % DQN_CAPACITY,
    latest: entry, deliveries: state.deliveries + Number(result.done && !result.trapped), traps: state.traps + Number(result.trapped) };
}
export function sampleDqnBatch(state: DqnSimulation): DqnSimulation {
  const entries = state.slots.filter((entry): entry is ReplayExperience => !!entry);
  if (entries.length < DQN_BATCH) return state;
  const random = seededRandom(state.sampleSeed);
  // Partial Fisher-Yates, uniform sampling without replacement within each batch.
  for (let i = 0; i < DQN_BATCH; i++) {
    const j = i + Math.floor(random() * (entries.length - i)); [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return { ...state, batch: entries.slice(0, DQN_BATCH).map(entry => ({ ...entry, s: { ...entry.s }, next: { ...entry.next } })),
    draws: state.draws + 1, sampleSeed: Math.floor(random() * 4294967296), lastUpdate: null };
}
export function updateDqnSimulation(state: DqnSimulation): DqnSimulation {
  if (state.batch.length !== DQN_BATCH) return state;
  const trained = trainDqnBatch(state.online, state.target, state.optimizer, state.batch), updates = state.updates + 1;
  const sync = updates % DQN_SYNC === 0;
  return { ...state, online: trained.network, optimizer: trained.optimizer, updates, lastUpdate: trained.update,
    target: sync ? trained.network.slice() : state.target, syncs: state.syncs + Number(sync), lastSync: sync ? updates : state.lastSync };
}
/** Bounded real collection. Two independent replay updates follow each collected transition once the pool is ready. */
export function advanceDqnTraining(state: DqnSimulation, count: number): DqnSimulation {
  let next = state;
  for (let i = 0; i < count; i++) {
    next = collectDqnExperience(next);
    if (next.collected >= DQN_BATCH) for (let update = 0; update < 2; update++) next = updateDqnSimulation(sampleDqnBatch(next));
  }
  return next;
}
export interface DqnEvaluation { route: Position[]; actions: number[]; rewards: number[]; outcome: 'delivered' | 'trap' | 'loop' | 'limit'; total: number; }
/** Greedy, read-only verification with exploration disabled. Repeated state/action pairs end a deterministic loop. */
export function evaluateDqn(network: DqnNetwork): DqnEvaluation {
  let position = START; const route = [position], actions: number[] = [], rewards: number[] = [], seen = new Set<string>();
  let outcome: DqnEvaluation['outcome'] = 'limit';
  for (let i = 0; i < EPISODE_LIMIT; i++) {
    const values = dqnForward(network, position).values, action = values.indexOf(Math.max(...values)), key = keyOf(position) + ':' + action;
    if (seen.has(key)) { outcome = 'loop'; break; }
    seen.add(key); const result = warehouseStep(position, action); actions.push(action); rewards.push(result.reward);
    position = result.next; route.push(position);
    if (result.done) { outcome = result.trapped ? 'trap' : 'delivered'; break; }
  }
  return { route, actions, rewards, outcome, total: rewards.reduce((sum, value) => sum + value, 0) };
}
