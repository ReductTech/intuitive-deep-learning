import { BLOCKED, GOAL, GRID, START, keyOf, returnOf, seededRandom, transition, type Position } from '../model';
import { TRAP, warehouseStep } from '../pages/QLearningLoopPage/qLearningSimulation';

export const EVALUATION_GAMMA = .9;
export const EVALUATION_LIMIT = 80;
export type EvaluationPolicy = 'safe' | 'random';

// Shortest-path distances specify a fixed policy, not learned values.
const distances: Record<string, number> = { [keyOf(GOAL)]: 0 };
const queue = [GOAL];
for (let i = 0; i < queue.length; i++) {
  for (let action = 0; action < 4; action++) {
    const result = transition(queue[i], action), key = keyOf(result.next);
    if (!result.hit && key !== keyOf(TRAP) && distances[key] === undefined) {
      distances[key] = distances[keyOf(queue[i])] + 1; queue.push(result.next);
    }
  }
}

export function policyProbabilities(policy: EvaluationPolicy, position: Position): number[] {
  if (keyOf(position) === keyOf(GOAL) || keyOf(position) === keyOf(TRAP)) return [0, 0, 0, 0];
  if (policy === 'random') return [.25, .25, .25, .25];
  const steps = Array.from({ length: 4 }, (_, action) => warehouseStep(position, action));
  const valid = steps.flatMap((result, action) => result.hit || result.trapped ? [] : [action]);
  const best = valid.filter(action => distances[keyOf(steps[action].next)] < distances[keyOf(position)]);
  return steps.map((_, action) => (valid.includes(action) ? .2 / valid.length : 0) + (best.includes(action) ? .8 / best.length : 0));
}

export interface DeliveryExperience {
  index: number;
  policy: EvaluationPolicy;
  firstAction?: number;
  positions: Position[];
  actions: number[];
  rewards: number[];
  collisions: boolean[];
  delivered: boolean;
  trapped: boolean;
  value: number;
}

/** Actual transitions; only the initial action can be overridden. */
export function sampleDelivery(policy: EvaluationPolicy, index: number, firstAction?: number, start = START): DeliveryExperience {
  const random = seededRandom(917 + index * 104729);
  let position = start, delivered = keyOf(start) === keyOf(GOAL), trapped = keyOf(start) === keyOf(TRAP);
  const positions = [position], actions: number[] = [], rewards: number[] = [], collisions: boolean[] = [];
  for (let step = 0; step < EVALUATION_LIMIT && !delivered && !trapped; step++) {
    // Consume the same draw even when the first action is forced.
    // Paired Q samples use identical later random draws and the same policy.
    const draw = random(), probabilities = policyProbabilities(policy, position);
    let cumulative = 0;
    const sampled = probabilities.findIndex(probability => { cumulative += probability; return draw < cumulative; });
    const action = step === 0 && firstAction !== undefined ? firstAction : sampled;
    const result = warehouseStep(position, action);
    actions.push(action); rewards.push(result.reward); collisions.push(result.hit);
    position = result.next; positions.push(position); delivered = result.done && !result.trapped; trapped = result.trapped;
  }
  return { index, policy, firstAction, positions, actions, rewards, collisions, delivered, trapped, value: returnOf(rewards, EVALUATION_GAMMA) };
}

export const experienceMean = (samples: readonly DeliveryExperience[]) => samples.length
  ? samples.reduce((sum, sample) => sum + sample.value, 0) / samples.length : undefined;
export const EVALUATION_STATES = Array.from({ length: GRID * GRID }, (_, i) => ({ row: Math.floor(i / GRID), col: i % GRID }))
  .filter(position => !BLOCKED.includes(keyOf(position)));
