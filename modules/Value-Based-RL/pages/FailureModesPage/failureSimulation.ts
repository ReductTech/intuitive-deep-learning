import {
  BLOCKED, DELTAS, GOAL, GRID, START, chooseAction, emptyQ, keyOf, seededRandom,
  type Position, type QTable,
} from '../../model';
import { ALPHA, GAMMA, EPSILON, EPISODE_LIMIT, TRAP } from '../QLearningLoopPage/qLearningSimulation';

export { ALPHA, GAMMA, EPSILON, EPISODE_LIMIT };
/** In this experiment the red cell is traversable, with a penalty on each entry. */
export const DANGER = TRAP;
export const TRAINING_EPISODES = 6000;
export const TRAINING_SEED = 17;
export type FailureCase = 'movement' | 'danger' | 'obstacle';
export type Prediction = 'safe' | 'danger' | 'undelivered';
export interface FailureWorld { movement: number; dangerPenalty: number; added: string[]; }
export const FAILURE_CASES: { id: FailureCase; label: string; prompt: string }[] = [
  { id: 'movement', label: '移动也加分', prompt: '每走一步都有奖励，机器人还愿意尽快送达吗？' },
  { id: 'danger', label: '危险区抄近路', prompt: '穿过危险区能少走几步，惩罚多大才会改变选择？' },
  { id: 'obstacle', label: '地图新增障碍', prompt: '旧路线被挡住后，原策略和重新训练的策略会怎样？' },
];
export function originalWorld(id: FailureCase): FailureWorld {
  return { movement: id === 'movement' ? 2 : -1, dangerPenalty: id === 'danger' ? -.5 : -8, added: [] };
}
export function defaultWorld(id: FailureCase): FailureWorld {
  return { ...originalWorld(id), added: id === 'obstacle' ? ['4:1'] : [] };
}
export function worldKey(world: FailureWorld) {
  return JSON.stringify([world.movement, world.dangerPenalty, [...world.added].sort()]);
}
export function failureStep(world: FailureWorld, position: Position, action: number) {
  const candidate = { row: position.row + DELTAS[action].row, col: position.col + DELTAS[action].col };
  const hit = candidate.row < 0 || candidate.row >= GRID || candidate.col < 0 || candidate.col >= GRID
    || BLOCKED.includes(keyOf(candidate)) || world.added.includes(keyOf(candidate));
  const next = hit ? position : candidate;
  const done = keyOf(next) === keyOf(GOAL);
  const danger = !hit && keyOf(next) === keyOf(DANGER);
  const reward = done ? 10 : hit ? -3 : world.movement + (danger ? world.dangerPenalty : 0);
  return { next, done, hit, danger, reward };
}
export function canAddObstacle(position: Position) {
  return ![keyOf(START), keyOf(GOAL), keyOf(DANGER), ...BLOCKED].includes(keyOf(position));
}
export function goalReachable(world: FailureWorld) {
  const queue = [START], seen = new Set([keyOf(START)]);
  for (let index = 0; index < queue.length; index++) {
    if (keyOf(queue[index]) === keyOf(GOAL)) return true;
    for (let action = 0; action < 4; action++) {
      const result = failureStep(world, queue[index], action), key = keyOf(result.next);
      if (!result.hit && !seen.has(key)) { seen.add(key); queue.push(result.next); }
    }
  }
  return false;
}

export function createFailureTraining(world: FailureWorld, seed = TRAINING_SEED, total = TRAINING_EPISODES) {
  return {
    world: { ...world, added: [...world.added] }, q: emptyQ(), random: seededRandom(seed),
    episodes: 0, total, updates: 0, deliveries: 0,
  };
}
export type FailureTraining = ReturnType<typeof createFailureTraining>;
/** Mutable local session, batched before passing progress/results to React. */
export function trainFailureBatch(training: FailureTraining, batch = 200) {
  const end = Math.min(training.total, training.episodes + batch);
  for (; training.episodes < end; training.episodes++) {
    let position = START;
    for (let step = 0; step < EPISODE_LIMIT; step++) {
      const before = training.q[keyOf(position)];
      const action = chooseAction(before, EPSILON, training.random);
      const result = failureStep(training.world, position, action);
      const target = result.reward + (result.done ? 0 : GAMMA * Math.max(...training.q[keyOf(result.next)]));
      before[action] += ALPHA * (target - before[action]);
      training.updates++;
      position = result.next;
      if (result.done) { training.deliveries++; break; }
      // A time-limit reset is not an environmental terminal: preserve bootstrapping.
    }
  }
  return training;
}
export function trainFailureWorld(world: FailureWorld) {
  const training = createFailureTraining(world);
  trainFailureBatch(training, training.total);
  return training;
}
export function greedyAction(values: readonly number[]) {
  const best = Math.max(...values);
  // Use a stable action order for numerical ties; never invent a route.
  return values.findIndex(value => best - value < 1e-6);
}
export interface PolicyTrace {
  positions: Position[];
  rewards: number[];
  actions: number[];
  delivered: boolean;
  dangerEntries: number;
  collisions: number;
  repeats: number;
  score: number;
  discountedReturn: number;
  outcome: Prediction;
}
export function evaluateFailurePolicy(q: QTable, world: FailureWorld): PolicyTrace {
  let position = START, score = 0, discountedReturn = 0, dangerEntries = 0, collisions = 0, repeats = 0, delivered = false;
  const positions = [position], rewards: number[] = [], actions: number[] = [];
  const seen = new Set([keyOf(position)]);
  for (let step = 0; step < EPISODE_LIMIT; step++) {
    const action = greedyAction(q[keyOf(position)]);
    const result = failureStep(world, position, action);
    position = result.next;
    positions.push(position); rewards.push(result.reward); actions.push(action);
    score += result.reward; discountedReturn += GAMMA ** step * result.reward;
    dangerEntries += Number(result.danger); collisions += Number(result.hit);
    repeats += Number(seen.has(keyOf(position))); seen.add(keyOf(position));
    if (result.done) { delivered = true; break; }
  }
  return {
    positions, rewards, actions, delivered, dangerEntries, collisions, repeats, score, discountedReturn,
    outcome: delivered ? dangerEntries ? 'danger' : 'safe' : 'undelivered',
  };
}
export function failurePolicy(q: QTable, world: FailureWorld) {
  return Object.fromEntries(Object.entries(q).filter(([key]) => key !== keyOf(GOAL)
    && key !== keyOf(DANGER) && !BLOCKED.includes(key) && !world.added.includes(key))
    .map(([key, values]) => [key, [greedyAction(values)]]));
}
