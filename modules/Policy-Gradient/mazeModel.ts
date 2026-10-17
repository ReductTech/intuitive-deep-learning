/** Reproducible 4×4 maze and one-episode REINFORCE calculations. */
export type Direction = 'U' | 'D' | 'L' | 'R';
export type Policy = Record<number, number[]>;
export interface Step { state: number; action: Direction; next: number; reward: number; wall: boolean; terminal: boolean; probability: number }
export interface TrainState { policy: Policy; seed: number; episodes: number; returns: number[]; last: Step[] }
export const START = 12, A = 13, GOAL = 3, WALLS = [5, 9, 11];
export const DIRECTIONS: Direction[] = ['U', 'D', 'L', 'R'];
export const DIR_LABEL: Record<Direction, string> = { U: '上', D: '下', L: '左', R: '右' };
/** Uniform draws make the classroom episode reproducible while using the real sampler. */
export const REFERENCE_DRAWS = [.82, .06, .88, .05, .04, .07, .91] as const;
export const cellName = (cell: number) => cell === START ? 'S' : cell === A ? 'A' : cell === GOAL ? 'G' : `(${Math.floor(cell / 4) + 1},${cell % 4 + 1})`;
export const format = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
export const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
export const clonePolicy = (policy: Policy): Policy => Object.fromEntries(Object.entries(policy).map(([cell, logits]) => [cell, [...logits]]));
export function probabilities(logits: number[]): number[] { const maximum = Math.max(...logits); const exponentials = logits.map(value => Math.exp(value - maximum)); const sum = exponentials.reduce((a, b) => a + b); return exponentials.map(value => value / sum); }
export function initialPolicy(): Policy {
  const policy: Policy = {};
  for (let cell = 0; cell < 16; cell++) if (!WALLS.includes(cell) && cell !== GOAL) policy[cell] = [0, 0, 0, 0];
  const route = (direction: Direction) => DIRECTIONS.map(item => Math.log(item === direction ? .6 : .4 / 3));
  policy[START] = route('R');
  policy[A] = [Math.log(.1), Math.log(.1), Math.log(.1), Math.log(.7)];
  for (const cell of [14, 10, 6]) policy[cell] = route('U');
  policy[2] = route('R');
  return policy;
}
export function transition(cell: number, action: Direction): Omit<Step, 'state' | 'action' | 'probability'> {
  if (cell === GOAL) throw Error('终点不可继续行动');
  const row = Math.floor(cell / 4), column = cell % 4;
  const nextRow = row + (action === 'U' ? -1 : action === 'D' ? 1 : 0);
  const nextColumn = column + (action === 'L' ? -1 : action === 'R' ? 1 : 0);
  const target = nextRow < 0 || nextRow >= 4 || nextColumn < 0 || nextColumn >= 4 ? cell : nextRow * 4 + nextColumn;
  const wall = target === cell || WALLS.includes(target), next = wall ? cell : target, terminal = next === GOAL;
  return { next, reward: terminal ? 10 : -1, wall, terminal };
}
function selectAction(probs: number[], draw: number): Direction {
  if (draw < 0 || draw >= 1) throw Error('draw must be in [0,1)');
  let residual = draw, index = 0;
  while (index < 3 && residual >= probs[index]) { residual -= probs[index]; index++; }
  return DIRECTIONS[index];
}
export function sampleWithDraws(policy: Policy, draws: readonly number[], start = START): Step[] {
  let cell = start; const path: Step[] = [];
  for (const draw of draws) {
    if (cell === GOAL) break;
    const probs = probabilities(policy[cell]), action = selectAction(probs, draw), result = transition(cell, action);
    path.push({ state: cell, action, ...result, probability: probs[DIRECTIONS.indexOf(action)] });
    cell = result.next;
    if (result.terminal) break;
  }
  return path;
}
export const REFERENCE = sampleWithDraws(initialPolicy(), REFERENCE_DRAWS);
export function returns(path: Step[]): number[] { const result = Array<number>(path.length).fill(0); let future = 0; for (let i = path.length - 1; i >= 0; i--) { future = path[i].reward + future; result[i] = future; } return result; }
/** Softmax log-probability gradient with respect to the four logits. */
export function score(policy: Policy, state: number, action: Direction): number[] { const probs = probabilities(policy[state]), chosen = DIRECTIONS.indexOf(action); return probs.map((prob, index) => (index === chosen ? 1 : 0) - prob); }
export interface Update { state: number; visits: number[]; weights: number[]; delta: number[]; before: Policy; after: Policy; oldProbs: number[]; newProbs: number[] }
/** All visits use the same pre-update policy; each state's gradient is accumulated once. */
export function mcUpdates(path: Step[], policy = initialPolicy(), alpha = .05): Update[] {
  const futureReturns = returns(path), states = [...new Set(path.map(step => step.state))], updates: Update[] = [];
  let current = clonePolicy(policy);
  for (const state of states) {
    const visits = path.flatMap((step, index) => step.state === state ? [index] : []);
    const weights = visits.map(index => futureReturns[index]), delta = [0, 0, 0, 0];
    visits.forEach((index, visit) => score(policy, state, path[index].action).forEach((value, i) => { delta[i] += alpha * weights[visit] * value; }));
    const before = clonePolicy(current), oldProbs = probabilities(before[state]);
    current[state] = current[state].map((value, i) => value + delta[i]);
    updates.push({ state, visits, weights, delta, before, after: clonePolicy(current), oldProbs, newProbs: probabilities(current[state]) });
  }
  return updates;
}
export function random(seed: number): [number, number] { let value = seed >>> 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return [(value >>> 0) / 4294967296, value >>> 0]; }
export function sample(policy: Policy, seed: number, maxSteps = 30): [Step[], number] {
  let cell = START, generator = seed; const path: Step[] = [];
  for (let index = 0; index < maxSteps; index++) {
    let draw; [draw, generator] = random(generator);
    const probs = probabilities(policy[cell]), action = selectAction(probs, draw), result = transition(cell, action);
    path.push({ state: cell, action, ...result, probability: probs[DIRECTIONS.indexOf(action)] });
    cell = result.next;
    if (result.terminal) break;
  }
  return [path, generator];
}
export function newTrain(seed = 123): TrainState { return { policy: initialPolicy(), seed, episodes: 0, returns: [], last: [] }; }
export function train(run: TrainState, count: number): TrainState {
  let policy = clonePolicy(run.policy), seed = run.seed, last: Step[] = [];
  const observed = [...run.returns];
  for (let index = 0; index < count; index++) {
    [last, seed] = sample(policy, seed);
    observed.push(last.reduce((sum, step) => sum + step.reward, 0));
    const updates = mcUpdates(last, policy, .01);
    if (updates.length) policy = updates.at(-1)!.after;
  }
  return { policy, seed, episodes: run.episodes + count, returns: observed, last };
}
