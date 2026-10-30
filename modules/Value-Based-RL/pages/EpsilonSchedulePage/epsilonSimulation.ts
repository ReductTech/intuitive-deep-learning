import { START, chooseAction, emptyQ, keyOf, seededRandom, type Position, type QTable } from '../../model';
import { ALPHA, GAMMA, EPISODE_LIMIT, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';

export { ALPHA, GAMMA, EPISODE_LIMIT };
export const SCHEDULE_EPISODES = 240;
export const SCHEDULE_SEED = 41;
export const EPSILON_FLOOR = .05;
export interface EpsilonSchedule { start: number; end: number; }
export const SCHEDULE_PRESETS = [
  { label: '较早衰减', schedule: { start: 1, end: 10 } },
  { label: '逐步衰减', schedule: { start: 20, end: 160 } },
  { label: '较晚衰减', schedule: { start: 180, end: 230 } },
] as const;
export const DEFAULT_SCHEDULE: EpsilonSchedule = { start: 20, end: 160 };
export function normalizeSchedule(schedule: EpsilonSchedule): EpsilonSchedule {
  const start = Math.max(1, Math.min(SCHEDULE_EPISODES - 1, Math.round(schedule.start)));
  return { start, end: Math.max(start + 1, Math.min(SCHEDULE_EPISODES, Math.round(schedule.end))) };
}
export const sameSchedule = (a: EpsilonSchedule, b: EpsilonSchedule) => a.start === b.start && a.end === b.end;
export function epsilonAt(schedule: EpsilonSchedule, episode: number) {
  if (episode <= schedule.start) return 1;
  if (episode >= schedule.end) return EPSILON_FLOOR;
  return 1 - (1 - EPSILON_FLOOR) * (episode - schedule.start) / (schedule.end - schedule.start);
}
export interface ScheduleTrace {
  positions: Position[];
  actions: number[];
  rewards: number[];
  explorations: boolean[];
  collisions: number;
  score: number;
  outcome: 'delivered' | 'trap' | 'limit';
}
export interface ScheduleEpisode {
  episode: number;
  epsilon: number;
  training: ScheduleTrace;
  greedy: ScheduleTrace;
  q: QTable;
  coverage: number;
  updates: number;
}
const cloneQ = (q: QTable) => Object.fromEntries(Object.entries(q).map(([key, values]) => [key, [...values]]));
function trace(q: QTable, epsilon: number, random: () => number, learning: boolean, onVisit?: (position: Position) => void): ScheduleTrace {
  let position = START, score = 0, collisions = 0;
  const positions = [position], actions: number[] = [], rewards: number[] = [], explorations: boolean[] = [];
  let outcome: ScheduleTrace['outcome'] = 'limit';
  for (let step = 0; step < EPISODE_LIMIT; step++) {
    onVisit?.(position);
    let firstDraw: number | undefined;
    const action = chooseAction(q[keyOf(position)], epsilon, () => {
      const draw = random(); if (firstDraw === undefined) firstDraw = draw; return draw;
    });
    const result = warehouseStep(position, action);
    if (learning) {
      const values = q[keyOf(position)];
      const target = result.reward + (result.done ? 0 : GAMMA * Math.max(...q[keyOf(result.next)]));
      values[action] += ALPHA * (target - values[action]);
    }
    actions.push(action); rewards.push(result.reward); explorations.push(firstDraw! < epsilon);
    collisions += Number(result.hit); score += result.reward;
    position = result.next; positions.push(position);
    if (result.done) { outcome = result.trapped ? 'trap' : 'delivered'; break; }
    // Reaching the demonstration time limit does not remove the TD bootstrap.
  }
  return { positions, actions, rewards, explorations, collisions, score, outcome };
}
export function evaluateSchedulePolicy(q: QTable) {
  return trace(q, 0, seededRandom(31), false);
}
export function createScheduleTraining(schedule: EpsilonSchedule, seed = SCHEDULE_SEED) {
  return { schedule: normalizeSchedule(schedule), q: emptyQ(), random: seededRandom(seed),
    records: [] as ScheduleEpisode[], visited: new Set<string>(), updates: 0 };
}
export type ScheduleTraining = ReturnType<typeof createScheduleTraining>;
export interface ScheduleRun { schedule: EpsilonSchedule; records: ScheduleEpisode[]; }
export function advanceScheduleTraining(session: ScheduleTraining, count = 12) {
  const end = Math.min(SCHEDULE_EPISODES, session.records.length + count);
  while (session.records.length < end) {
    const episode = session.records.length + 1, epsilon = epsilonAt(session.schedule, episode);
    const training = trace(session.q, epsilon, session.random, true, position => session.visited.add(keyOf(position)));
    session.updates += training.actions.length;
    const q = cloneQ(session.q);
    session.records.push({ episode, epsilon, training, q, greedy: evaluateSchedulePolicy(q), coverage: session.visited.size, updates: session.updates });
  }
  return session;
}
export function trainSchedule(schedule: EpsilonSchedule): ScheduleRun {
  const session = createScheduleTraining(schedule);
  advanceScheduleTraining(session, SCHEDULE_EPISODES);
  return { schedule: session.schedule, records: session.records };
}
export const rollingReturns = (run: ScheduleRun, mode: 'training' | 'greedy') => run.records.map((_, index) => {
  const recent = run.records.slice(Math.max(0, index - 14), index + 1);
  return recent.reduce((sum, record) => sum + record[mode].score, 0) / recent.length;
});
