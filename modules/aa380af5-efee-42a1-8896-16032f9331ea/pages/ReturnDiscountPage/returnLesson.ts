import { START, UPPER_ROUTE, returnOf, type Position } from '../../model';
import { warehouseStep } from '../QLearningLoopPage/qLearningSimulation';

function deliveryExperience(id: 'direct' | 'detour', label: string, intended: readonly Position[]) {
  let position = START;
  const positions = [position];
  const steps = intended.slice(1).map(next => {
    const from = position;
    const action = next.row < from.row ? 0 : next.col > from.col ? 1 : next.row > from.row ? 2 : 3;
    const result = warehouseStep(from, action);
    position = result.next;
    positions.push(position);
    return { from, action, ...result };
  });
  return { id, label, positions, steps, rewards: steps.map(step => step.reward) };
}

export const RETURN_EXPERIENCES = [
  deliveryExperience('direct', '直接送达', UPPER_ROUTE),
  deliveryExperience('detour', '绕行送达', [START, { row: 5, col: 0 }, { row: 4, col: 0 }, ...UPPER_ROUTE.slice(1)]),
] as const;

export function rewardContribution(reward: number, stepIndex: number, gamma: number) {
  return reward * gamma ** stepIndex;
}

export const experienceReturn = (experience: typeof RETURN_EXPERIENCES[number], gamma: number) => returnOf(experience.rewards, gamma);
