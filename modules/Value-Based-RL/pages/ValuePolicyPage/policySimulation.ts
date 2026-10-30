import { sampleDelivery } from '../../components/policyEvaluation';

export const POLICY_BATCH_SIZE = 32;
const POLICY_RATE = .2;
// Fixed, action-independent baseline; no value function or Q table is fitted.
const RETURN_BASELINE = -4;

export interface PolicySimulation {
  logits: number[];
  seed: number;
  episodes: number;
  lastBatch: { episodes: number; delivered: number; meanReturn: number } | null;
}
export function createPolicySimulation(): PolicySimulation {
  return { logits: [0, 0, 0, 0], seed: 71, episodes: 0, lastBatch: null };
}
export function policyProbabilities(logits: readonly number[]): number[] {
  const maximum = Math.max(...logits), weights = logits.map(value => Math.exp(value - maximum));
  const sum = weights.reduce((total, weight) => total + weight, 0);
  return weights.map(weight => weight / sum);
}
export function samplePolicyAction(probabilities: readonly number[], uniform: number): number {
  let cumulative = 0;
  for (let action = 0; action < probabilities.length; action++) {
    cumulative += probabilities[action];
    if (uniform < cumulative) return action;
  }
  return probabilities.length - 1;
}
/** Local REINFORCE demonstration: learn only the first action at START.
 * The later policy is the same fixed policy as slides 6–7. Each whole delivery
 * supplies G; gradients of log pi change the four policy parameters directly.
 * No Q values are read or converted into probabilities.
 */
export function trainPolicy(previous: PolicySimulation, batches = 1): PolicySimulation {
  const logits = [...previous.logits];
  let seed = previous.seed, delivered = 0, totalReturn = 0;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let batch = 0; batch < batches; batch++) {
    const probabilities = policyProbabilities(logits), gradient = [0, 0, 0, 0];
    for (let episode = 0; episode < POLICY_BATCH_SIZE; episode++) {
      const action = samplePolicyAction(probabilities, random());
      const index = previous.episodes + batch * POLICY_BATCH_SIZE + episode;
      const experience = sampleDelivery('safe', index, action);
      const advantage = experience.value - RETURN_BASELINE;
      for (let a = 0; a < 4; a++) gradient[a] += advantage * (Number(a === action) - probabilities[a]) / POLICY_BATCH_SIZE;
      delivered += Number(experience.delivered); totalReturn += experience.value;
    }
    for (let action = 0; action < 4; action++) logits[action] += POLICY_RATE * gradient[action];
  }
  const episodes = batches * POLICY_BATCH_SIZE;
  return { logits, seed, episodes: previous.episodes + episodes, lastBatch: { episodes, delivered, meanReturn: totalReturn / episodes } };
}
// Display integer percentages while preserving a sum of 100%.
export function roundedPercentages(probabilities: readonly number[]): number[] {
  const percentages = probabilities.map(value => Math.floor(value * 100));
  const order = probabilities.map((value, action) => ({ action, remainder: value * 100 - percentages[action] }))
    .sort((a, b) => b.remainder - a.remainder || a.action - b.action);
  const missing = 100 - percentages.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < missing; index++) percentages[order[index].action]++;
  return percentages;
}
