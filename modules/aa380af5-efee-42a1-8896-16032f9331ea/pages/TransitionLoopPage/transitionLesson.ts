import { START, type Position } from '../../model';
import { warehouseStep } from '../QLearningLoopPage/qLearningSimulation';

export const TRANSITION_CASES = [
  { id: 'move', label: '移动', position: START, action: 1 },
  { id: 'collision', label: '碰撞', position: { row: 5, col: 2 }, action: 1 },
  { id: 'delivery', label: '送达', position: { row: 4, col: 5 }, action: 2 },
  { id: 'trap', label: '陷阱', position: { row: 6, col: 2 }, action: 1 },
] as const;
export type TransitionCase = typeof TRANSITION_CASES[number]['id'];
export type TransitionPolicy = 'direction' | 'random';
export interface TransitionLesson {
  caseId: TransitionCase; phase: 0 | 1 | 2 | 3; from: Position; position: Position; action: number;
  policy: TransitionPolicy; randomSeed: number;
  result: ReturnType<typeof warehouseStep> | null; interactions: number; episode: number; steps: number;
}
export function createTransitionLesson(caseId: TransitionCase = 'move', policy: TransitionPolicy = 'direction'): TransitionLesson {
  const scenario = TRANSITION_CASES.find(item => item.id === caseId)!;
  return { caseId, phase: 0, from: { ...scenario.position }, position: { ...scenario.position }, action: scenario.action,
    policy, randomSeed: 1, result: null, interactions: 0, episode: 1, steps: 0 };
}
export function chooseTransitionAction(state: TransitionLesson, action: number): TransitionLesson {
  return state.phase === 0 && state.policy === 'direction' && action >= 0 && action < 4 ? { ...state, action } : state;
}
export function chooseTransitionPolicy(state: TransitionLesson, policy: TransitionPolicy): TransitionLesson {
  return state.phase === 0 ? { ...state, policy } : state;
}
export function transitionActionProbabilities(state: TransitionLesson): number[] {
  return state.policy === 'random' ? [.25, .25, .25, .25] : [0, 1, 2, 3].map(action => Number(action === state.action));
}
/** Only the action-to-feedback phase calls the environment. Reading and linking feedback never generate another transition. */
export function advanceTransitionLesson(state: TransitionLesson): TransitionLesson {
  if (state.phase === 0) {
    if (state.policy === 'direction') return { ...state, phase: 1 };
    const randomSeed = (1664525 * state.randomSeed + 1013904223) >>> 0;
    return { ...state, phase: 1, randomSeed, action: Math.floor(randomSeed / 4294967296 * 4) };
  }
  if (state.phase === 1) {
    const result = warehouseStep(state.from, state.action);
    return { ...state, phase: 2, position: { ...result.next }, result, interactions: state.interactions + 1, steps: state.steps + 1 };
  }
  if (state.phase === 2) return { ...state, phase: 3 };
  const ended = !!state.result?.done, from = ended ? { ...START } : { ...state.position };
  return { ...state, phase: 0, from, position: from, result: null, episode: state.episode + Number(ended), steps: ended ? 0 : state.steps };
}
