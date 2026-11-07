import { START, chooseAction, huber, keyOf, seededRandom, tdTarget, type Position } from '../../model';
import { createNetwork, encodeState, forward, trainBatch, type TinyQNetwork } from '../../network';
import { GAMMA, EPISODE_LIMIT, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';

export const BUFFER_CAPACITY = 8;
export const BATCH_SIZE = 4;
export const COLLECT_EPSILON = .3;
export interface ReplayExperience {
  id: number; slot: number; episode: number; step: number;
  s: Position; action: number; reward: number; next: Position;
  done: boolean; hit: boolean; trapped: boolean; truncated: boolean;
}
export interface ReplayLearning {
  before: number; after: number; target: number;
}
export interface ReplaySimulation {
  position: Position; episode: number; episodeSteps: number; restart: boolean;
  collected: number; collectorSeed: number; sampleSeed: number;
  slots: (ReplayExperience | null)[]; nextSlot: number; evicted: number | null;
  latest: ReplayExperience | null; batch: ReplayExperience[]; drawCount: number;
  network: TinyQNetwork; updates: number; batchUpdates: number; uses: Record<number, number>;
  learning: Record<number, ReplayLearning>;
  lossBefore?: number; lossAfter?: number;
}
export function createReplaySimulation(): ReplaySimulation {
  return { position: START, episode: 1, episodeSteps: 0, restart: false,
    collected: 0, collectorSeed: 23, sampleSeed: 71,
    slots: Array(BUFFER_CAPACITY).fill(null), nextSlot: 0, evicted: null,
    latest: null, batch: [], drawCount: 0, network: createNetwork(), updates: 0, batchUpdates: 0, uses: {}, learning: {} };
}
/** One real environment action creates exactly one stored transition; no learning yet. */
export function collectReplayExperience(state: ReplaySimulation, manualAction?: number): ReplaySimulation {
  const from = state.restart ? START : state.position;
  const episode = state.episode + Number(state.restart), step = state.restart ? 1 : state.episodeSteps + 1;
  const random = seededRandom(state.collectorSeed);
  const action = manualAction ?? chooseAction(forward(state.network, encodeState(from)).values, COLLECT_EPSILON, random);
  const result = warehouseStep(from, action), truncated = !result.done && step >= EPISODE_LIMIT;
  const experience: ReplayExperience = { id: state.collected + 1, slot: state.nextSlot, episode, step,
    s: { ...from }, action, reward: result.reward, next: { ...result.next }, done: result.done, hit: result.hit, trapped: result.trapped, truncated };
  const slots = [...state.slots], evicted = slots[state.nextSlot]?.id ?? null;
  slots[state.nextSlot] = experience;
  return { ...state, position: experience.next, episode, episodeSteps: step, restart: result.done || truncated,
    collected: experience.id, collectorSeed: Math.floor(random() * 4294967296),
    slots, nextSlot: (state.nextSlot + 1) % BUFFER_CAPACITY, evicted, latest: experience };
}
/** A uniform sample without replacement. Batch snapshots survive later ring overwrites. */
export function sampleReplayBatch(state: ReplaySimulation): ReplaySimulation {
  const available = state.slots.filter((entry): entry is ReplayExperience => !!entry);
  if (available.length < BATCH_SIZE) return state;
  const random = seededRandom(state.sampleSeed);
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [available[i], available[j]] = [available[j], available[i]];
  }
  const batch = available.slice(0, BATCH_SIZE).map(entry => ({ ...entry, s: { ...entry.s }, next: { ...entry.next } }));
  return { ...state, batch, drawCount: state.drawCount + 1, sampleSeed: Math.floor(random() * 4294967296),
    batchUpdates: 0, learning: {}, lossBefore: undefined, lossAfter: undefined };
}
/** Reuse stored data in a real mean-gradient Huber update of the course's small Q network. */
export function learnReplayBatch(state: ReplaySimulation): ReplaySimulation {
  if (state.batch.length !== BATCH_SIZE) return state;
  const targets = state.batch.map(entry => tdTarget(entry.reward, GAMMA,
    Math.max(...forward(state.network, encodeState(entry.next)).values), entry.done));
  const before = state.batch.map(entry => forward(state.network, encodeState(entry.s)).values[entry.action]);
  const network = trainBatch(state.network, state.batch.map((entry, i) => ({ x: encodeState(entry.s), action: entry.action, target: targets[i] })), .05);
  const after = state.batch.map(entry => forward(network, encodeState(entry.s)).values[entry.action]);
  const uses = { ...state.uses }, learning: Record<number, ReplayLearning> = {};
  state.batch.forEach((entry, i) => { uses[entry.id] = (uses[entry.id] ?? 0) + 1; learning[entry.id] = { before: before[i], after: after[i], target: targets[i] }; });
  return { ...state, network, uses, learning, updates: state.updates + 1, batchUpdates: state.batchUpdates + 1,
    lossBefore: targets.reduce((sum, target, i) => sum + huber(before[i] - target), 0) / BATCH_SIZE,
    lossAfter: targets.reduce((sum, target, i) => sum + huber(after[i] - target), 0) / BATCH_SIZE };
}
export const bufferEntries = (state: ReplaySimulation) => state.slots.filter((entry): entry is ReplayExperience => !!entry);
export const experienceKey = (entry: ReplayExperience) => [entry.id, keyOf(entry.s), entry.action, entry.reward, keyOf(entry.next), entry.done].join('|');
