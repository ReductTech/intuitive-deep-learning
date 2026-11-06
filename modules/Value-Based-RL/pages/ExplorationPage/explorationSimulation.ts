import { chooseAction, keyOf, seededRandom, START, type Position, type QTable } from '../../model';
import { advanceSimulation, createSimulation, EPISODE_LIMIT, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';

export const SNAPSHOT_UPDATES = 1000;
export const TRIALS = 30;
export const TRIAL_SEED = 31;

/** An actual, still-imperfect Q table from the same training loop as slide 13. */
export function createExplorationQ(): QTable {
  let simulation = createSimulation();
  for (let step = 0; step < SNAPSHOT_UPDATES; step++) simulation = advanceSimulation(simulation);
  return simulation.q;
}

export function actionProbabilities(values: readonly number[], epsilon: number) {
  const max = Math.max(...values);
  const best = values.flatMap((value, action) => Math.abs(value - max) < 1e-8 ? [action] : []);
  return values.map((_, action) => epsilon / 4 + (best.includes(action) ? (1 - epsilon) / best.length : 0));
}

export interface ExplorationTrial {
  route: Position[];
  rewards: number[];
  outcome: 'delivered' | 'trap' | 'limit';
}

/** Freeze Q: only the behavior rule changes, with actual warehouse transitions. */
export function evaluateExploration(q: QTable, epsilon: number) {
  const random = seededRandom(TRIAL_SEED), visited = new Set<string>();
  const records: ExplorationTrial[] = [];
  for (let episode = 0; episode < TRIALS; episode++) {
    let position = START;
    const route = [position], rewards: number[] = [];
    let outcome: ExplorationTrial['outcome'] = 'limit';
    for (let step = 0; step < EPISODE_LIMIT; step++) {
      visited.add(keyOf(position));
      const action = chooseAction(q[keyOf(position)], epsilon, random);
      const result = warehouseStep(position, action);
      rewards.push(result.reward); position = result.next; route.push(position);
      visited.add(keyOf(position));
      if (result.done) { outcome = result.trapped ? 'trap' : 'delivered'; break; }
    }
    records.push({ route, rewards, outcome });
  }
  return { records, coverage: visited.size,
    deliveries: records.filter(record => record.outcome === 'delivered').length,
    traps: records.filter(record => record.outcome === 'trap').length };
}
