import { createTargetExperiment, syncTargetExperiment, updateTargetExperiment } from '../../dqnSimulation';

// A real, bounded warm-up makes the estimates legible. No Q-table targets are used.
export const TARGET_WARMUP = 120;
export function createTargetLesson() {
  return syncTargetExperiment(updateTargetExperiment(createTargetExperiment(), TARGET_WARMUP));
}
