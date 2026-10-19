import { collectReplayExperience, createReplaySimulation } from './replaySimulation';

/** Actual delivery and trap transitions, used to populate the opening illustration. */
export function createReplayExample() {
  let state = createReplaySimulation();
  for (const action of [0,1,1,0,0,1,1,2,2,2,2,1,1]) state = collectReplayExperience(state, action);
  return state;
}
